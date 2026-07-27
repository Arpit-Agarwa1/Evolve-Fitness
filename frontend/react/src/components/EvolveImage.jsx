import React, { useCallback, useState } from "react";
import "../styles/evolve-image.css";

/**
 * @typedef {{ src: string; srcSet?: string; width?: number; height?: number }} EvolvePhotoSrc
 */

/**
 * Resolve string URL or responsive photo object to img props.
 * @param {string | EvolvePhotoSrc} src
 */
function resolvePhoto(src) {
  if (src && typeof src === "object") {
    return {
      src: src.src,
      srcSet: src.srcSet,
      width: src.width,
      height: src.height,
    };
  }
  return { src: String(src ?? ""), srcSet: undefined, width: undefined, height: undefined };
}

/**
 * Magazine / facility photography with responsive `srcSet`/`sizes`, async decode, and optional lazy fade-in.
 * @param {object} props
 * @param {string | EvolvePhotoSrc} props.src
 * @param {string} props.alt
 * @param {string} [props.className]
 * @param {string} [props.sizes] — hint for responsive loading (viewport-relative)
 * @param {string} [props.srcSet] — override photo object's srcSet
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
  srcSet: srcSetProp,
  loading = "lazy",
  fetchPriority,
  decoding = "async",
  width,
  height,
  fadeIn,
}) {
  const [loaded, setLoaded] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);

  const resolved = resolvePhoto(src);
  const finalSrc = resolved.src;
  const finalSrcSet = srcSetProp ?? resolved.srcSet;
  const finalWidth = width ?? resolved.width;
  const finalHeight = height ?? resolved.height;

  const useFade = fadeIn ?? loading === "lazy";
  const fadeClass = useFade
    ? loaded
      ? "evolve-image--loaded"
      : "evolve-image--fade-pending"
    : "";

  return (
    <img
      src={finalSrc}
      srcSet={finalSrcSet}
      alt={alt}
      className={`evolve-image ${fadeClass} ${className}`.trim()}
      sizes={sizes}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      width={finalWidth}
      height={finalHeight}
      onLoad={onLoad}
    />
  );
}
