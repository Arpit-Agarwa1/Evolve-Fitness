/**
 * Admin is not supported inside cross-origin iframes (IDE previews, in-app
 * browsers, chrome-error parents). Same-origin nested frames redirect to top;
 * otherwise show a full-screen hint with a new-tab action.
 *
 * @returns {boolean} true when React should not mount into `#root`
 */
export function maybeEscapeAdminIframe() {
  if (typeof window === "undefined") return false;
  const { pathname, href } = window.location;
  if (!pathname.startsWith("/admin")) return false;
  if (window.self === window.top) return false;

  try {
    const topOrigin = window.top.location.origin;
    if (topOrigin === window.location.origin) {
      window.top.location.replace(href);
      return true;
    }
  } catch {
    /* cross-origin top — cannot read or navigate parent */
  }

  const root = document.getElementById("root");
  if (root) root.hidden = true;

  const wrap = document.createElement("div");
  wrap.className = "ev-admin-iframe-fallback";
  wrap.setAttribute("role", "alert");

  const card = document.createElement("div");
  card.className = "ev-admin-iframe-fallback__card";

  const h1 = document.createElement("h1");
  h1.className = "ev-admin-iframe-fallback__title";
  h1.textContent = "Open admin in a normal browser tab";

  const p1 = document.createElement("p");
  p1.className = "ev-admin-iframe-fallback__copy";
  p1.textContent =
    "This page cannot run correctly inside an embedded preview or another site’s frame. Use Chrome, Safari, or Edge in a full window, or open the link below in a new tab.";

  const urlRow = document.createElement("p");
  urlRow.className = "ev-admin-iframe-fallback__url";
  const code = document.createElement("code");
  code.textContent = href;
  urlRow.appendChild(code);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ev-admin-iframe-fallback__btn";
  btn.textContent = "Open in new tab";
  btn.addEventListener("click", () => {
    window.open(href, "_blank", "noopener,noreferrer");
  });

  card.append(h1, p1, urlRow, btn);
  wrap.appendChild(card);
  document.body.appendChild(wrap);
  return true;
}
