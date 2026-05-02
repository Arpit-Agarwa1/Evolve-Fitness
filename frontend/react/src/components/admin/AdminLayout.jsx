import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { EVOLVE_LOGO_NAV_SRC } from "../../config/brand";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import "../../styles/admin.css";

/**
 * Sidebar shell for owner dashboard pages.
 */
export default function AdminLayout({ children, title }) {
  const { clearToken } = useAdminAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    clearToken();
    navigate("/admin/login", { replace: true });
  }

  const navClass = ({ isActive }) =>
    `admin-nav__link ${isActive ? "admin-nav__link--active" : ""}`;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Admin">
        <div className="admin-brand">
          <img
            className="admin-brand__logo"
            src={EVOLVE_LOGO_NAV_SRC}
            alt=""
            width={520}
            height={107}
            decoding="async"
            aria-hidden="true"
          />
          <span className="admin-brand__sub">Owner console</span>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={navClass}>
            Overview
          </NavLink>
          <NavLink to="/admin/members" className={navClass}>
            Member management
          </NavLink>
          <NavLink to="/admin/contacts" className={navClass}>
            Messages
          </NavLink>
          <NavLink to="/admin/leads" className={navClass}>
            Leads
          </NavLink>
          <NavLink to="/admin/trainers" className={navClass}>
            Trainers
          </NavLink>
        </nav>
        <div className="admin-sidebar__foot">
          <Link to="/" className="admin-sidebar__site">
            View website
          </Link>
          <button
            type="button"
            className="admin-signout"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        {title ? <h1 className="admin-page-title">{title}</h1> : null}
        {children}
      </main>
    </div>
  );
}
