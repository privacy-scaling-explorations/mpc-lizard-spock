import z from 'zod';
import * as mpcf from 'mpc-framework';
import { EmpWasmBackend } from 'emp-wasm-backend';
import * as summon from 'summon-ts';
import { RtcPairSocket } from 'rtc-pair-socket';
import assert from './assert';
import AsyncQueue from './AsyncQueue';
import { GameOption } from './Ctx';
import getCircuitFiles from './getCircuitFiles';

export default async function runProtocol(
  mode: 'Host' | 'Join',
  socket: RtcPairSocket,
  choice: GameOption,
  onProgress?: (progress: number) => void,
): Promise<'win' | 'lose' | 'draw'> {
  const msgQueue = new AsyncQueue<unknown>();

  const TOTAL_BYTES = 285618;
  let currentBytes = 0;

  socket.on('message', (msg: Uint8Array) => {
    msgQueue.push(msg);

    currentBytes += msg.byteLength;

    if (onProgress) {
      onProgress(currentBytes / TOTAL_BYTES);
    }
  });

  await summon.init();

  const circuitFiles = await getCircuitFiles();
  const circuit = summon.compileBoolean('circuit/main.ts', 3, circuitFiles);

  const mpcSettings = [
    {
      name: 'alice',
      inputs: ['player1'],
      outputs: ['main'],
    },
    {
      name: 'bob',
      inputs: ['player2'],
      outputs: ['main'],
    },
  ];

  const protocol = new mpcf.Protocol(
    circuit,
    mpcSettings,
    new EmpWasmBackend(),
  );

  const party = mode === 'Host' ? 'alice' : 'bob';
  const otherParty = mode === 'Host' ? 'bob' : 'alice';

  const optionMap: Record<GameOption, number> = {
    rock: 1,
    paper: 2,
    scissors: 3,
    lizard: 4,
    spock: 5,
  };

  const input = optionMap[choice];

  const session = protocol.join(
    party,
    party === 'alice' ? { player1: input } : { player2: input },
    (to, msg) => {
      assert(to === otherParty);
      socket.send(msg);

      currentBytes += msg.byteLength;

      if (onProgress) {
        onProgress(currentBytes / TOTAL_BYTES);
      }
    },
  );

  msgQueue.stream(msg => {
    if (!(msg instanceof Uint8Array)) {
      console.error(new Error('Expected Uint8Array'));
      return;
    }

    session.handleMessage(otherParty, msg);
  });

  const Output = z.object({
    main: z.number(),
  });

  const output = Output.parse(await session.output());

  const outputMap: Record<number, 'win' | 'lose' | 'draw' | undefined> = {
    0: 'draw',
    1: party === 'alice' ? 'win' : 'lose',
    2: party === 'alice' ? 'lose' : 'win',
  };

  const result = outputMap[output.main];

  if (result === undefined) {
    throw new Error('Invalid output');
  }

  return result;
}
