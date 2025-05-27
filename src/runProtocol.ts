import z from 'zod';
import * as mpcf from 'mpc-framework';
import { EmpWasmEngine } from 'emp-wasm-engine';
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

  const TOTAL_BYTES = 265148;
  let currentBytes = 0;

  socket.on('message', (msg: Uint8Array) => {
    msgQueue.push(msg);

    currentBytes += msg.byteLength;

    if (onProgress) {
      onProgress(currentBytes / TOTAL_BYTES);
    }
  });

  await summon.init();

  const { circuit } = summon.compile({
    path: 'circuit/main.ts',
    boolifyWidth: 3,
    files: await getCircuitFiles(),
  });

  const protocol = new mpcf.Protocol(circuit, new EmpWasmEngine());

  const party = mode === 'Host' ? 'player1' : 'player2';
  const otherParty = mode === 'Host' ? 'player2' : 'player1';

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
    { [party]: input },
    (to, msg) => {
      assert(to === otherParty);
      socket.send(msg);

      currentBytes += msg.byteLength;

      if (onProgress) {
        onProgress(currentBytes / TOTAL_BYTES);
      }
    },
  );

  const streamHandle = msgQueue.stream(msg => {
    if (!(msg instanceof Uint8Array)) {
      console.error(new Error('Expected Uint8Array'));
      return;
    }

    session.handleMessage(otherParty, msg);
  });

  const Output = z.object({
    result: z.number(),
  });

  const output = Output.parse(await session.output());

  streamHandle.stop();

  if (currentBytes !== TOTAL_BYTES) {
    console.error(
      [
        'Bytes sent & received was not equal to TOTAL_BYTES.',
        ' This causes incorrect progress calculations.',
        ` To fix, updated TOTAL_BYTES to ${currentBytes}.`,
      ].join(''),
    );
  }

  const outputMap: Record<number, 'win' | 'lose' | 'draw' | undefined> = {
    0: 'draw',
    1: party === 'player1' ? 'win' : 'lose',
    2: party === 'player1' ? 'lose' : 'win',
  };

  const result = outputMap[output.result];

  if (result === undefined) {
    throw new Error('Invalid output');
  }

  return result;
}
