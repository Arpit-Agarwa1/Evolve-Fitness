import React, { useEffect } from "react";
import {
  OPEN_PRO_PLAYERS,
  OPEN_SEMI_PRO_NOTES,
  OPEN_SEMI_PRO_PLAYERS,
  OPEN_PLAYER_LIST_NOTE,
  OPEN_PLAYER_LISTS_PDF_PATH,
} from "../data/badmintonChampionship";

/**
 * Modal showing official semi-pro (List A) and professional (List B) players.
 * @param {{ open: boolean; onClose: () => void }} props
 */
export default function BadmintonPlayerListsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="badminton-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="badminton-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="badminton-player-lists-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="badminton-modal__header">
          <div>
            <p className="badminton-eyebrow">EVOLVE Open</p>
            <h2 id="badminton-player-lists-title" className="badminton-modal__title">
              Player eligibility lists
            </h2>
          </div>
          <button
            type="button"
            className="badminton-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="badminton-modal__body">
          <section className="badminton-player-list-block">
            <h3 className="badminton-player-list-block__title">
              List A — Semi-professional
            </h3>
            <p className="badminton-player-list-block__lede">
              May pair only with a Club player.
            </p>
            <PlayerTable players={OPEN_SEMI_PRO_PLAYERS} />
            <ul className="badminton-player-list-notes">
              {OPEN_SEMI_PRO_NOTES.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>

          <section className="badminton-player-list-block">
            <h3 className="badminton-player-list-block__title">
              List B — Professional
            </h3>
            <p className="badminton-player-list-block__lede">
              Cannot participate.
            </p>
            <PlayerTable players={OPEN_PRO_PLAYERS} />
          </section>

          <p className="badminton-player-list-footnote">{OPEN_PLAYER_LIST_NOTE}</p>
          <p className="badminton-player-list-pdf">
            <a
              href={OPEN_PLAYER_LISTS_PDF_PATH}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download official PDF
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ players: { sn: number; name: string; club: string }[] }} props
 */
function PlayerTable({ players }) {
  return (
    <div className="badminton-player-table-wrap">
      <table className="badminton-player-table">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Player</th>
            <th scope="col">Club</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={`${p.sn}-${p.name}-${p.club}`}>
              <td>{p.sn}</td>
              <td>{p.name}</td>
              <td>{p.club}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
