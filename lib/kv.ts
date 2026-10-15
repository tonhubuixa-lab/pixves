// lib/kv.ts
import { Redis } from '@upstash/redis'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const TIMEOUT_MS = 8000

// Netlify Functions run on a read-only, ephemeral filesystem, so local
// files can't be used there (and Netlify Blobs was found to hang
// indefinitely from inside the functions this site's Next.js
// integration generates). Upstash's REST API is reached with plain
// HTTPS fetch, the same mechanism already confirmed to work for
// outbound calls (e.g. Pagar.me). Falls back to a local file when the
// env vars aren't set (plain `next dev`/`next start`).
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Upstash Redis: tempo limite ao ${label}`)), TIMEOUT_MS)
    ),
  ])
}

export function createListStore<T extends { id: string }>(redisKey: string, fileName: string) {
  const dataDir = path.join(process.cwd(), 'data')
  const dataFile = path.join(dataDir, fileName)

  function readAllFromFile(): T[] {
    if (!existsSync(dataFile)) return []
    try {
      const raw = readFileSync(dataFile, 'utf-8')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  function writeAllToFile(records: T[]) {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
    writeFileSync(dataFile, JSON.stringify(records, null, 2))
  }

  async function readAll(): Promise<T[]> {
    const redis = getRedis()
    if (redis) {
      const data = await withTimeout(redis.get<T[]>(redisKey), 'ler os dados')
      return data ?? []
    }
    return readAllFromFile()
  }

  async function writeAll(records: T[]) {
    const redis = getRedis()
    if (redis) {
      await withTimeout(redis.set(redisKey, records), 'gravar os dados')
      return
    }
    writeAllToFile(records)
  }

  return {
    list(): Promise<T[]> {
      return readAll()
    },
    async get(id: string): Promise<T | undefined> {
      const all = await readAll()
      return all.find((r) => r.id === id)
    },
    async save(record: T): Promise<T> {
      const all = await readAll()
      all.unshift(record)
      await writeAll(all)
      return record
    },
    async update(id: string, patch: Partial<T>): Promise<T | undefined> {
      const all = await readAll()
      const idx = all.findIndex((r) => r.id === id)
      if (idx === -1) return undefined
      all[idx] = { ...all[idx], ...patch }
      await writeAll(all)
      return all[idx]
    },
    async remove(id: string): Promise<boolean> {
      const all = await readAll()
      const next = all.filter((r) => r.id !== id)
      if (next.length === all.length) return false
      await writeAll(next)
      return true
    },
  }
}

export function createValueStore<T extends object>(
  redisKey: string,
  fileName: string,
  defaultValue: T
) {
  const dataDir = path.join(process.cwd(), 'data')
  const dataFile = path.join(dataDir, fileName)

  function readFromFile(): T {
    if (!existsSync(dataFile)) return defaultValue
    try {
      const raw = readFileSync(dataFile, 'utf-8')
      return raw ? { ...defaultValue, ...JSON.parse(raw) } : defaultValue
    } catch {
      return defaultValue
    }
  }

  function writeToFile(value: T) {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
    writeFileSync(dataFile, JSON.stringify(value, null, 2))
  }

  return {
    async get(): Promise<T> {
      const redis = getRedis()
      if (redis) {
        const data = await withTimeout(redis.get<T>(redisKey), 'ler os dados')
        return data ? { ...defaultValue, ...data } : defaultValue
      }
      return readFromFile()
    },
    async update(patch: Partial<T>): Promise<T> {
      const redis = getRedis()
      const current = redis
        ? { ...defaultValue, ...((await withTimeout(redis.get<T>(redisKey), 'ler os dados')) ?? {}) }
        : readFromFile()
      const next = { ...current, ...patch }
      if (redis) {
        await withTimeout(redis.set(redisKey, next), 'gravar os dados')
      } else {
        writeToFile(next)
      }
      return next
    },
  }
}
