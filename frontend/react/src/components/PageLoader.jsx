import React from "react";
import { EVOLVE_LOGO_NAV_SRC } from "../config/brand";
import "./page-loader.css";

/**
 * Shown briefly while lazy route chunks load — lightweight, on-brand.
 */
export default function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="page-loader__inner">
        <img
          className="page-loader__logo"
          src={EVOLVE_LOGO_NAV_SRC}
          alt=""
            width={520}
            height={107}
          decoding="async"
          aria-hidden="true"
        />
        <div className="page-loader__bar" aria-hidden="true">
          <div className="page-loader__bar-fill" />
        </div>
      </div>
    </div>
  );
}
