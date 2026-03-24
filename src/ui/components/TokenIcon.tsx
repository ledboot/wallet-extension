import { useEffect, useState } from 'react';

const loadedIconSrcSet = new Set<string>();

interface TokenIconProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export default function TokenIcon({
  src,
  alt,
  className = '',
  fallbackSrc = '/images/default-token.svg',
}: TokenIconProps) {
  const resolvedSrc = typeof src === 'string' ? src.trim() : '';
  const [loaded, setLoaded] = useState<boolean>(resolvedSrc ? loadedIconSrcSet.has(resolvedSrc) : false);
  const [failed, setFailed] = useState<boolean>(!resolvedSrc);

  useEffect(() => {
    if (!resolvedSrc) {
      setLoaded(false);
      setFailed(true);
      return;
    }

    let cancelled = false;

    setFailed(false);
    if (loadedIconSrcSet.has(resolvedSrc)) {
      setLoaded(true);
      return;
    }

    setLoaded(false);

    const preloader = new Image();
    preloader.decoding = 'async';
    preloader.onload = () => {
      if (cancelled) return;
      loadedIconSrcSet.add(resolvedSrc);
      setLoaded(true);
    };
    preloader.onerror = () => {
      if (cancelled) return;
      setFailed(true);
    };
    preloader.src = resolvedSrc;

    return () => {
      cancelled = true;
    };
  }, [resolvedSrc]);

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {failed ? (
        <img src={fallbackSrc} alt={alt} className='h-full w-full object-cover' />
      ) : (
        <>
          {!loaded && <div className='absolute inset-0 animate-pulse bg-gray-200' />}
          <img
            src={resolvedSrc}
            alt={alt}
            className={`h-full w-full object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            decoding='async'
            loading='eager'
            onLoad={() => {
              loadedIconSrcSet.add(resolvedSrc);
              setLoaded(true);
            }}
            onError={() => {
              setFailed(true);
            }}
          />
        </>
      )}
    </div>
  );
}
