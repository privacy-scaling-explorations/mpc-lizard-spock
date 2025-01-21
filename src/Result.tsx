import capitalize from './capitalize';
import Ctx from './Ctx';
import getEmoji from './getEmoji';

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
    </div>
  );
}
