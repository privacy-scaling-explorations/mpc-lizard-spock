import capitalize from './capitalize';
import Ctx from './Ctx';

export default function Result() {
  const ctx = Ctx.use();
  const result = ctx.result.use();
  const choice = ctx.choice.use();

  const opponentMap = {
    win: {
      rock: 'Scissors or Lizard',
      paper: 'Rock or Spock',
      scissors: 'Paper or Lizard',
      lizard: 'Spock or Paper',
      spock: 'Rock or Scissors',
    },
    lose: {
      rock: 'Paper or Spock',
      paper: 'Scissors or Lizard',
      scissors: 'Rock or Spock',
      lizard: 'Rock or Scissors',
      spock: 'Paper or Lizard',
    },
    draw: {
      rock: 'Rock',
      paper: 'Paper',
      scissors: 'Scissors',
      lizard: 'Lizard',
      spock: 'Spock',
    },
  };

  let opponentOptions = '';

  if (result !== undefined && choice !== undefined) {
    opponentOptions = opponentMap[result][choice];
  }

  return (
    <div className='result'>
      <center style={{ fontSize: 'calc(0.4 * var(--aw))' }}>{capitalize(result ?? '')}</center>
      <div style={{ display: 'flex', placeContent: 'center' }}>
        <table>
          <tr>
            <td style={{ width: '10ch' }}>You:</td>
            <td>{capitalize(choice ?? '')}</td>
          </tr>
          <tr>
            <td style={{ width: '10ch' }}>Opponent:</td>
            <td>{opponentOptions}</td>
          </tr>
        </table>
      </div>
    </div>
  );
}
