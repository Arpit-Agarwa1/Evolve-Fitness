import React, { useCallback, useEffect, useRef, useState } from "react";
import "../styles/evolve-video.css";

/**
 * Muted looping background video. Optional startAt/endAt play a scene
 * inside a longer file so each section can open on a different shot.
 *
 * `#t=` media fragments + delayed play keep the first painted frame on
 * the scene, not the shared mall aerial at t=0.
 *
 * @param {object} props
 * @param {string} props.src
 * @param {string} [props.poster]
 * @param {number} [props.startAt]
 * @param {number} [props.endAt]
 * @param {string} [props.className]
 * @param {"none"|"metadata"|"auto"} [props.preload]
 */
export default function EvolveVideo({
  src,
  poster,
  startAt = 0,
  endAt,
  className = "",
  preload = "metadata",
}) {
  const videoRef = useRef(null);
  const seekingRef = useRef(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const hasRange = startAt > 0 || (typeof endAt === "number" && endAt > startAt);
  const rangedSrc = hasRange
    ? `${src}#t=${startAt.toFixed(2)}${typeof endAt === "number" ? `,${endAt.toFixed(2)}` : ""}`
    : src;

  const playNow = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    seekingRef.current = false;
    if (el.paused) el.play().catch(() => {});
  }, []);

  const seekToStart = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const target = Math.max(0, startAt);
    if (Math.abs(el.currentTime - target) < 0.12) {
      playNow();
      return;
    }
    seekingRef.current = true;
    el.currentTime = target;
  }, [playNow, startAt]);

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
      key={rangedSrc}
      ref={videoRef}
      className={`evolve-video ${className}`.trim()}
      src={rangedSrc}
      poster={poster}
      autoPlay
      muted
      loop={!hasRange}
      playsInline
      preload={preload}
      aria-hidden="true"
      onLoadedMetadata={seekToStart}
      onCanPlay={() => {
        const el = videoRef.current;
        if (!el || seekingRef.current) return;
        if (Math.abs(el.currentTime - startAt) < 0.25 && el.paused) {
          playNow();
        }
      }}
      onSeeked={() => {
        if (!seekingRef.current) return;
        playNow();
      }}
      onTimeUpdate={() => {
        if (!hasRange || seekingRef.current) return;
        const el = videoRef.current;
        if (!el || typeof endAt !== "number") return;
        if (el.currentTime >= endAt - 0.05 || el.currentTime < startAt - 0.2) {
          seekToStart();
        }
      }}
      onEnded={hasRange ? seekToStart : undefined}
    />
  );
}
