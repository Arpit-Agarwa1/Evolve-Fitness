import React from "react";
import { ADMIN_PAGE_SIZE, adminPageCount } from "../../utils/adminPagination";

/**
 * Previous / next controls for admin tables (pairs with {@link adminListQuery}).
 * @param {object} props
 * @param {number} props.page — current page (1-based)
 * @param {number} props.total — total records from API
 * @param {(page: number) => void} props.onPageChange
 * @param {boolean} [props.loading]
 */
export default function AdminPagination({ page, total, onPageChange, loading }) {
  const pages = adminPageCount(total);
  if (total <= 0) {
    return null;
  }

  const from = (page - 1) * ADMIN_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_PAGE_SIZE, total);
  const disabled = Boolean(loading);

  return (
    <nav className="admin-pagination" aria-label="Table pagination">
      <p className="admin-pagination__meta">
        Showing {from}–{to} of {total}
      </p>
      <div className="admin-pagination__controls">
        <button
          type="button"
          className="admin-pagination__btn"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span className="admin-pagination__status">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          className="admin-pagination__btn"
          disabled={disabled || page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
