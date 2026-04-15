import React from "react";
import { Helmet } from "react-helmet-async";
import { getSiteUrl, SITE_NAME } from "../config/seoConfig";

/**
 * Per-route document head: title, description, canonical, Open Graph.
 * @param {object} props
 * @param {string} props.title — page title (brand appended if not already present)
 * @param {string} props.description — meta description (~150–160 chars ideal)
 * @param {string} [props.path] — pathname for canonical (default `/`)
 * @param {boolean} [props.noIndex] — admin and utility pages
 * @param {string} [props.ogImage] — absolute image URL for previews
 */
export default function SEO({
  title,
  description,
  path = "/",
  noIndex = false,
  ogImage,
}) {
  const base = getSiteUrl();
  const pathNorm = path.startsWith("/") ? path : `/${path}`;
  const canonical = `${base}${pathNorm === "/" ? "" : pathNorm}`;

  const fullTitle =
    title.includes("Evolve") || title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`;

  const robots = noIndex ? "noindex, nofollow" : "index, follow";

  const ogImg =
    ogImage ||
    (import.meta.env.VITE_OG_IMAGE_URL?.trim()
      ? import.meta.env.VITE_OG_IMAGE_URL.trim()
      : "");

  return (
    <Helmet>
      <html lang="en-IN" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content="en_IN" />
      {ogImg ? <meta property="og:image" content={ogImg} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImg ? <meta name="twitter:image" content={ogImg} /> : null}
    </Helmet>
  );
}
