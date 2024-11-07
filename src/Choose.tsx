import { useState } from 'react';
import './Choose.css';
import Ctx, { GameOption } from './Ctx';

export default function Choose() {
  const ctx = Ctx.use();
  const [selection, setSelection] = useState<GameOption | undefined>();

  return (
    <div className='choose-page'>
      <Choice selection={selection} setSelection={setSelection} type='rock' />
      <Choice selection={selection} setSelection={setSelection} type='paper' />
      <Choice selection={selection} setSelection={setSelection} type='scissors' />
      <Choice selection={selection} setSelection={setSelection} type='lizard' />
      <Choice selection={selection} setSelection={setSelection} type='spock' />
      <div style={{ marginBottom: '3em' }}>
        <button
          disabled={selection === undefined}
          style={{ width: '100%', lineHeight: '1.1em' }}
          className={selection}
          onClick={() => {
            if (selection === undefined) {
              return;
            }

            ctx.send(selection);
          }}
        >{buttonText(selection)}</button>
      </div>
    </div>
  );
}

function buttonText(selection: GameOption | undefined) {
  if (selection === undefined) {
    return '(Choose then Confirm)';
  }

  return `Send ${capitalize(selection)}`;
}

function Choice({ selection, setSelection, type }: {
  selection: GameOption | undefined;
  setSelection: (selection: GameOption | undefined) => void;
  type: GameOption;
}) {
  return (
    <div
      className={`choice ${selection === type && 'selected'} ${type}`}
      onClick={() => setSelection(selection === type ? undefined : type)}
    ><div>{capitalize(type)}</div></div>
  );
}

function capitalize(s: string) {
  return s[0].toUpperCase() + s.slice(1);
}
