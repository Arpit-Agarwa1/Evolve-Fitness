import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * - Path changes without a hash: scroll to top (normal page nav).
 * - Hash present (e.g. /#experience): scroll target into view after DOM is ready (SPA + lazy routes).
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      if (!id) {
        window.scrollTo(0, 0);
        return;
      }

      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches;

      const scrollToEl = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({
            behavior: smooth ? "smooth" : "auto",
            block: "start",
          });
          return true;
        }
        return false;
      };

      if (scrollToEl()) {
        return;
      }

      /** Target may not exist until route content mounts (e.g. Home after client nav). */
      let attempts = 0;
      const maxAttempts = 30;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (scrollToEl() || attempts >= maxAttempts) {
          window.clearInterval(timer);
          if (attempts >= maxAttempts && !document.getElementById(id)) {
            window.scrollTo(0, 0);
          }
        }
      }, 50);

      return () => window.clearInterval(timer);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
