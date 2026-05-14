import React from 'react';
import './Board.css';

const AboutPopup = ({ onClose }) => {
  return (
    <div className="popup">
      <div className="popup-content">
        <button onClick={onClose} className="close-button">
          Close
        </button>
        <h2>Background</h2>
        <p>
          After the neo-Amish induced crypto-collapse of '47, USA ceased to
          exist as a nation. Following the discovery in '73 of vast reserves of
          Rareium, the fallen nation again had the world's attention, however
          this time as a resource. The now powerful Mexican queendom and the
          Pan-Canadia Inuit Alliance are both greedily claiming territory.
          Clashes are unavoidable.
        </p>
        <h2>The Mexican Queendom</h2>
        <img
          style={{ width: '50%' }}
          src="/Mexican_Queendom.jpg"
          alt="Mexican Queendom flag"
        />
        <img
          style={{ width: '20%' }}
          src="/Queendom_icon.png"
          alt="Mexican Queendom icon"
        />
        <p>
          The Mexican Queendom is a matriarchal society where the queen is both
          the head of state, the head of the church and the head of the cartels.
          It's a totalitarian regime where the queen's word is law, controlling
          every level of society. Information is tightly controlled and dissent
          is not tolerated. The Mexican Queendom is a mix of traditional Mexican
          culture combined with a glorified roman empire. Their land based
          military is second to none.
        </p>
        <h2>The Pan-Canadia Inuit Alliance</h2>
        <img
          style={{ width: '50%' }}
          src="/Pan-Canadia.jpg"
          alt="Pan-Canadia Inuit Alliance flag"
        />
        <img
          style={{ width: '20%' }}
          src="/Pan-Canadia_icon.png"
          alt="Pan-Canadia Inuit Alliance icon"
        />
        <p>
          The Pan-Canadia Inuit Alliance is a confederation of Inuit tribes that
          originally banded together to protect their lands. The Alliance has
          through deft political manouvering and cunning trade deals managed to
          become a major player on the world stage. On the surface it's a
          democracy, but in reality the Inuit-led businesses and corporations
          control the government. The Pan-Canadia Inuit Alliance is a mix of
          traditional Inuit culture combined with a modern capitalist society.
          Their navy is the strongest in the world.
        </p>
        <h2>Rules</h2>
        <p>
          In this game, you will play as either the Mexican Queendom or the
          Pan-Canadia Inuit Alliance. Your goal is to be the first to have four
          of your faction's flag in a row, either horizontally, vertically, or
          diagonally.
        </p>
        <p>
          Like regular Tic Tac Toe, play proceeds turn-based, each player able
          to claim a square on the board. Unlike Tic Tac Toe, however, players
          may try to claim the oppononts squares (with low probability of
          success). Also, each controlled square has a small chance each round
          of rebelling, causing the controlling player to loose that square.
          Additionally, each square controlled gives the player 1 unit of the
          resource Rareium per round. Rareium, in turn, has a chance to unlock
          the use of strategic weapons.
        </p>
        <p>The available strategic weapons are:</p>
        <ul>
          <li>
            Artillery: destroys target square and the four orthogonal neighbours
          </li>
          <li>
            Air Strike: destroys three target squares in a line (vertical,
            horizontal or diagonal, must be next to each other)
          </li>
          <li>
            Biological Warfare: each square in a three by three area around the
            target has a 50% chance to be destroyed
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AboutPopup;
