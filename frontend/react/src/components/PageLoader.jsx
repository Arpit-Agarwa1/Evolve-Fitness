import React from "react";
import "./page-loader.css";

/**
 * Shown briefly while lazy route chunks load — lightweight, on-brand.
 */
export default function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label="Loading page">
      <div className="page-loader__inner">
        <div className="page-loader__mark" aria-hidden="true">
          <span className="page-loader__e">E</span>
          <span className="page-loader__arrow">&gt;</span>
          <span className="page-loader__rest">OLVE</span>
        </div>
        <div className="page-loader__bar" aria-hidden="true">
          <div className="page-loader__bar-fill" />
        </div>
      </div>
    </div>
  );
}
