'use client'
import { useState } from 'react'

/** <img> que some sozinha se a URL não carregar como imagem válida. */
export function SafeImage({
  src,
  alt = '',
  className = '',
}: {
  src: string
  alt?: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  // Reseta o estado de erro quando a URL muda, sem useEffect — "ajustar
  // estado durante a renderização" é o padrão recomendado pelo React
  // para derivar estado de uma prop que mudou.
  const [lastSrc, setLastSrc] = useState(src)
  if (src !== lastSrc) {
    setLastSrc(src)
    setFailed(false)
  }
  if (failed) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className={className} />
  )
}

/** Prévia com aviso visível quando a URL informada não é uma imagem. */
export function ImagePreview({ url, className = 'h-10 w-10' }: { url: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const [lastUrl, setLastUrl] = useState(url)
  if (url !== lastUrl) {
    setLastUrl(url)
    setFailed(false)
  }

  if (!url.trim()) return null

  return (
    <div className="mt-2 flex items-center gap-2">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          onError={() => setFailed(true)}
          className={`rounded object-cover ring-1 ring-border-strong ${className}`}
        />
      ) : (
        <span
          className={`flex items-center justify-center rounded bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/40 ${className}`}
        >
          ⚠
        </span>
      )}
      <span className={`text-xs ${failed ? 'text-rose-400' : 'text-muted-2'}`}>
        {failed ? 'Esse link não carregou como imagem — confira a URL' : 'Prévia'}
      </span>
    </div>
  )
}
