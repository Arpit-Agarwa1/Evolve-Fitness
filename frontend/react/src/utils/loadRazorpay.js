/**
 * Load Razorpay Checkout script once.
 * @returns {Promise<typeof window.Razorpay>}
 */
export function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay requires a browser"));
  }
  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-razorpay-checkout="1"]'
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Razorpay) resolve(window.Razorpay);
        else reject(new Error("Razorpay failed to load"));
      });
      existing.addEventListener("error", () =>
        reject(new Error("Razorpay failed to load"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "1";
    script.onload = () => {
      if (window.Razorpay) resolve(window.Razorpay);
      else reject(new Error("Razorpay failed to load"));
    };
    script.onerror = () => reject(new Error("Razorpay failed to load"));
    document.body.appendChild(script);
  });
}
