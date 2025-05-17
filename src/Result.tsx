import capitalize from './capitalize';
import Ctx from './Ctx';
import getEmoji from './getEmoji';
import { useState } from 'react';

export default function Result() {
  const ctx = Ctx.use();
  const result = ctx.result.use();
  const choice = ctx.choice.use();

  const opponentMap = {
    win: {
      rock: 'scissors, lizard',
      paper: 'rock, spock',
      scissors: 'paper, lizard',
      lizard: 'spock, paper',
      spock: 'rock, scissors',
    },
    lose: {
      rock: 'paper, spock',
      paper: 'scissors, lizard',
      scissors: 'rock, spock',
      lizard: 'rock, scissors',
      spock: 'paper, lizard',
    },
    draw: {
      rock: 'rock',
      paper: 'paper',
      scissors: 'scissors',
      lizard: 'lizard',
      spock: 'spock',
    },
  };

  let opponentOptions = '';

  if (result !== undefined && choice !== undefined) {
    opponentOptions = opponentMap[result][choice];
  }

  const [loading, setLoading] = useState(false);

  const handlePlayAgain = async () => {
    setLoading(true);
    try {
      await ctx.playAgain();
    } catch (error) {
      console.error('Error playing again:', error);
      setLoading(false);
    }
  };

  return (
    <div className='result'>
      <center style={{ fontSize: 'calc(0.3 * var(--aw))' }}>{capitalize(result ?? '')}</center>
      <div style={{ display: 'flex', placeContent: 'center', fontSize: '2em' }}>
        <table>
          <tbody>
            <tr>
              <td style={{ width: '6ch' }}>You:</td>
              <td>{getEmoji(choice ?? '')}</td>
            </tr>
            <tr>
              <td style={{ width: '6ch' }}>Them:</td>
              <td>{opponentOptions.split(', ').map(getEmoji).join(' or ')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{
        marginTop: '2rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
      }}>
        <button
          className='button-primary'
          onClick={handlePlayAgain}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1.1rem',
            borderRadius: '8px',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            backgroundColor: '#4CAF50', // Green color for play again
          }}
        >
          {loading ? 'Setting up new game...' : 'Play Again'}
        </button>

        <button
          className='button-secondary'
          onClick={() => ctx.endGame()}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1.1rem',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            backgroundColor: '#f44336', // Red color for end game
            color: 'white',
          }}
        >
          End Game
        </button>
      </div>
    </div>
  );
}
