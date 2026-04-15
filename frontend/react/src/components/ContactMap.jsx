import React from "react";
import {
  getGoogleMapsEmbedSrc,
  getGoogleMapsOpenUrl,
} from "../config/googleMaps";

/**
 * Embedded Google Map + link to open in Google Maps (new tab).
 */
export default function ContactMap() {
  const embedSrc = getGoogleMapsEmbedSrc();
  const openUrl = getGoogleMapsOpenUrl();

  return (
    <div className="contact-map">
      <div className="contact-map__frame">
        <iframe
          title="Evolve Fitness location — Vivacity Mall, Jaipur"
          src={embedSrc}
          className="contact-map__iframe"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="contact-map__cta">
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-map__link"
        >
          Open in Google Maps
        </a>
      </p>
    </div>
  );
}
