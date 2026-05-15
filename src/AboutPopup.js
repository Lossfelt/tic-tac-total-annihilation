import React, { useEffect } from 'react';
import './Board.css';

const AboutPopup = ({ onClose }) => {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="popup-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      onClick={onClose}
    >
      <div className="popup" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="popup-close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <h2 id="about-title" className="popup-title">
          About
        </h2>
        <div className="popup-tagline">
          Tic Tac Total Annihilation is not just three in a row.
        </div>

        <section className="popup-section">
          <h3>Background</h3>
          <p>
            After the neo-Amish induced crypto-collapse of '47, USA ceased to
            exist as a nation. Following the discovery in '73 of vast reserves
            of Rareium, the fallen nation again had the world's attention,
            however this time as a resource. The now powerful Mexican Queendom
            and the Pan-Canadia Inuit Alliance are both greedily claiming
            territory. Clashes are unavoidable.
          </p>
        </section>

        <section className="popup-section faction queendom">
          <div className="faction-header">
            <img src="/Queendom_icon.png" alt="Mexican Queendom icon" />
            <h3>The Mexican Queendom</h3>
          </div>
          <img
            className="faction-flag"
            src="/Mexican_Queendom.jpg"
            alt="Mexican Queendom flag"
          />
          <p>
            A matriarchal society where the queen is both head of state, head of
            the church and head of the cartels. A totalitarian regime where the
            queen's word is law, controlling every level of society. Information
            is tightly controlled and dissent is not tolerated. A mix of
            traditional Mexican culture combined with a glorified Roman empire.
            Their land based military is second to none.
          </p>
        </section>

        <section className="popup-section faction canadia">
          <div className="faction-header">
            <img
              src="/Pan-Canadia_icon.png"
              alt="Pan-Canadia Inuit Alliance icon"
            />
            <h3>The Pan-Canadia Inuit Alliance</h3>
          </div>
          <img
            className="faction-flag"
            src="/Pan-Canadia.jpg"
            alt="Pan-Canadia Inuit Alliance flag"
          />
          <p>
            A confederation of Inuit tribes that originally banded together to
            protect their lands. Through deft political manouvering and cunning
            trade deals they have become a major player on the world stage. On
            the surface a democracy, in reality Inuit-led businesses and
            corporations control the government. A mix of traditional Inuit
            culture combined with a modern capitalist society. Their navy is the
            strongest in the world.
          </p>
        </section>

        <section className="popup-section">
          <h3>Rules</h3>
          <p>
            Be the first to claim four cells in a row, column, or diagonal. Each
            turn you may claim an empty cell or attempt to invade an opponent's
            cell (low chance of success). Controlled cells generate Rareium,
            which has a chance to unlock a strategic weapon at the start of your
            turn. Each controlled cell may also rebel.
          </p>
          <ul className="weapons-list">
            <li>
              <span className="weapon-emoji">💥</span>
              <span>
                <strong>Artillery</strong>: destroys the target cell and its
                four orthogonal neighbours.
              </span>
            </li>
            <li>
              <span className="weapon-emoji">✈️</span>
              <span>
                <strong>Air Strike</strong>: destroys three target cells in a
                line (horizontal, vertical or diagonal).
              </span>
            </li>
            <li>
              <span className="weapon-emoji">☣️</span>
              <span>
                <strong>Biological Warfare</strong>: each cell in a 3x3 area
                around the target has a 50% chance to be destroyed.
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AboutPopup;
