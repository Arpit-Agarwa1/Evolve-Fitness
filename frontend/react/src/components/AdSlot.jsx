import { useEffect, useRef } from "react";
import { getAdsenseClient, getAdsenseSlot } from "../config/adsense";
import "../styles/adsense.css";

/**
 * Responsive display unit. Renders nothing until client + slot IDs are set
 * (avoids empty boxes and accidental clicks).
 *
 * @param {object} props
 * @param {string} [props.className]
 */
export default function AdSlot({ className = "" }) {
  const client = getAdsenseClient();
  const slot = getAdsenseSlot();
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!client || !slot || pushedRef.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      /* Script may still be loading; AdSense queues pushes. */
    }
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <aside
      className={`ad-slot ${className}`.trim()}
      aria-label="Advertisement"
    >
      <p className="ad-slot-label">Ad</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
