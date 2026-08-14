"use client";

import { useState } from "react";

interface Props {
  src?: string;
  alt: string;
  className?: string;
}

export function EntityImage({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`entity-placeholder ${className || ""}`} aria-label={alt}>
        {alt.slice(0, 1)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
