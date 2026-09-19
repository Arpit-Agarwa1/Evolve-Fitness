import React, { useEffect, useState } from "react";
import "../styles/evolve-video.css";

/**
 * Muted looping background video with a still poster for reduced-motion users.
 *
 * @param {object} props
 * @param {string} props.src
 * @param {string} [props.poster]
 * @param {string} [props.className]
 * @param {"none"|"metadata"|"auto"} [props.preload]
 */
export default function EvolveVideo({
  src,
  poster,
  className = "",
  preload = "metadata",
}) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (reduceMotion && poster) {
    return (
      <img
        src={poster}
        alt=""
        className={`evolve-video evolve-video--still ${className}`.trim()}
        decoding="async"
      />
    );
  }

  return (
    <video
      className={`evolve-video ${className}`.trim()}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload={preload}
      aria-hidden="true"
    />
  );
}
