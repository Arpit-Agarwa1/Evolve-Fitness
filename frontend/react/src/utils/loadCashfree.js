/**
 * Load Cashfree JS SDK (v3) once.
 * @returns {Promise<(opts: { mode: string }) => { checkout: Function }>}
 */
export function loadCashfreeScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cashfree requires a browser"));
  }
  if (typeof window.Cashfree === "function") {
    return Promise.resolve(window.Cashfree);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-cashfree-sdk="1"]');
    if (existing) {
      existing.addEventListener("load", () => {
        if (typeof window.Cashfree === "function") resolve(window.Cashfree);
        else reject(new Error("Cashfree failed to load"));
      });
      existing.addEventListener("error", () =>
        reject(new Error("Cashfree failed to load"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.dataset.cashfreeSdk = "1";
    script.onload = () => {
      if (typeof window.Cashfree === "function") resolve(window.Cashfree);
      else reject(new Error("Cashfree failed to load"));
    };
    script.onerror = () => reject(new Error("Cashfree failed to load"));
    document.body.appendChild(script);
  });
}
