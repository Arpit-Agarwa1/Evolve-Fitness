import React, { useCallback, useState } from "react";
import "../styles/evolve-image.css";

/**
 * Magazine / facility photography with responsive `sizes`, async decode, and optional lazy fade-in.
 * @param {object} props
 * @param {string} props.src
 * @param {string} props.alt
 * @param {string} [props.className]
 * @param {string} [props.sizes] — hint for responsive loading (viewport-relative)
 * @param {"eager"|"lazy"} [props.loading]
 * @param {"high"|"low"|"auto"} [props.fetchPriority]
 * @param {"async"|"auto"|"sync"} [props.decoding]
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {boolean} [props.fadeIn] — override: false for above-the-fold / hero (no opacity transition)
 */
export default function EvolveImage({
  src,
  alt,
  className = "",
  sizes,
  loading = "lazy",
  fetchPriority,
  decoding = "async",
  width,
  height,
  fadeIn,
}) {
  const [loaded, setLoaded] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);

  const useFade = fadeIn ?? loading === "lazy";
  const fadeClass = useFade
    ? loaded
      ? "evolve-image--loaded"
      : "evolve-image--fade-pending"
    : "";

  return (
    <img
      src={src}
      alt={alt}
      className={`evolve-image ${fadeClass} ${className}`.trim()}
      sizes={sizes}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      width={width}
      height={height}
      onLoad={onLoad}
    />
  );
}
