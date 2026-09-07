/**
 * Load the AdSense script once. Safe to call from public pages only.
 * @param {string} client ca-pub-…
 * @returns {void}
 */
export function loadAdsenseScript(client) {
  if (!client || typeof document === "undefined") return;
  if (
    document.querySelector('script[data-adsense="1"]') ||
    document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    )
  ) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  script.crossOrigin = "anonymous";
  script.dataset.adsense = "1";
  document.head.appendChild(script);
}
