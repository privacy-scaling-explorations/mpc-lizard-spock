import { useState } from 'react';
import './Choose.css';
import Ctx, { GameOption } from './Ctx';
import capitalize from './capitalize';
import getEmoji from './getEmoji';

export default function Choose() {
  const ctx = Ctx.use();
  const [selection, setSelection] = useState<GameOption | undefined>();

  return (
    <div className='choose-page' style={{ WebkitTapHighlightColor: 'transparent' }}>
      <Choice selection={selection} setSelection={setSelection} type='rock' />
      <Choice selection={selection} setSelection={setSelection} type='paper' />
      <Choice selection={selection} setSelection={setSelection} type='scissors' />
      <Choice selection={selection} setSelection={setSelection} type='lizard' />
      <Choice selection={selection} setSelection={setSelection} type='spock' />
      <div style={{ marginBottom: '3em' }}>
        {selection !== undefined && <>
          <button
            className='secondary'
            onClick={() => setSelection(undefined)}
            style={{
              width: '100%',
              lineHeight: '1.1em',
              marginBottom: '1em',
            }}
          >Back to Selection</button>
        </>}
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
  if (selection !== undefined && selection !== type) {
    return <></>;
  }

  return (
    <div
      className={`choice ${selection === type && 'selected'} ${type}`}
      onClick={() => setSelection(selection === type ? undefined : type)}
    ><div style={{ fontSize: '2.2em' }}>{getEmoji(type)}</div></div>
  );
}
