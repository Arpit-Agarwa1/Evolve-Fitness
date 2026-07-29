import React, { useEffect, useState } from "react";
import {
  BADMINTON_WHATSAPP_GROUP_URL,
  BADMINTON_WHATSAPP_REDIRECT_SECONDS,
} from "../data/badmintonChampionship";

/**
 * Post-registration WhatsApp group CTA with optional timed redirect.
 */
export default function BadmintonWhatsAppInvite() {
  const [secondsLeft, setSecondsLeft] = useState(
    BADMINTON_WHATSAPP_REDIRECT_SECONDS
  );
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    if (!autoRedirect) return undefined;

    if (secondsLeft <= 0) {
      // Keep confirmation page; open invite in a new tab (may be popup-blocked).
      const tab = window.open(BADMINTON_WHATSAPP_GROUP_URL, "_blank");
      if (tab) tab.opener = null;
      setAutoRedirect(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [autoRedirect, secondsLeft]);

  return (
    <div className="badminton-whatsapp">
      <p className="badminton-form__hint">
        Optional — join the Evolve Badminton Championship WhatsApp group for
        updates and pairing info.
      </p>
      <a
        href={BADMINTON_WHATSAPP_GROUP_URL}
        className="badminton-btn badminton-btn--primary"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setAutoRedirect(false)}
      >
        Join WhatsApp group
      </a>
      {autoRedirect ? (
        <p className="badminton-whatsapp__countdown">
          Opening invite in a new tab in {secondsLeft}s…{" "}
          <button
            type="button"
            className="badminton-link-btn"
            onClick={() => setAutoRedirect(false)}
          >
            Stay here
          </button>
        </p>
      ) : (
        <p className="badminton-whatsapp__countdown">
          Confirmation stays on this page. Tap the button if the invite didn&apos;t
          open.
        </p>
      )}
    </div>
  );
}
