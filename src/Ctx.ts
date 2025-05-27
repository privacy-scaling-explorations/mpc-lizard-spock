import z from 'zod';
import { createContext, useContext } from 'react';
import UsableField from './UsableField';
import Emitter from './Emitter';
import AsyncQueue from './AsyncQueue';
import runProtocol from './runProtocol';
import { makeZodChannel } from './ZodChannel';
import { MessageInit, MessageReady, MessageStart } from './MessageTypes';
import { Key, RtcPairSocket } from 'rtc-pair-socket';

type PageKind =
  | 'Home'
  | 'Share'
  | 'Host'
  | 'Join'
  | 'Connecting'
  | 'Choose'
  | 'Waiting'
  | 'Calculating'
  | 'Result'
  | 'Error';

export type GameOption = 'rock' | 'paper' | 'scissors' | 'lizard' | 'spock';

const rtcConfig = (() => {
  const envVar = import.meta.env.VITE_RTC_CONFIGURATION;

  if (!envVar) {
    console.log(`Using ${envVar ? 'custom' : 'default'} RTC config`);
    return undefined;
  }

  return JSON.parse(envVar);
})();

export default class Ctx extends Emitter<{ ready(choice: GameOption): void }> {
  page = new UsableField<PageKind>('Home');
  mode: 'Host' | 'Join' = 'Host';
  key = new UsableField(Key.random());
  socket = new UsableField<RtcPairSocket | undefined>(undefined);
  msgQueue = new AsyncQueue<unknown>();
  friendReady = false;
  result = new UsableField<'win' | 'lose' | 'draw' | undefined>(undefined);
  errorMsg = new UsableField<string>('');
  choice = new UsableField<GameOption | undefined>(undefined);
  mpcProgress = new UsableField<number>(0);

  constructor() {
    super();
  }

  async connect(): Promise<RtcPairSocket> {
    if (this.socket.value) {
      if (this.socket.value.pairingCode === this.key.value.base58()) {
        return this.socket.value;
      }

      this.socket.value.close();
    }

    console.log('connecting', this.key.value.base58(), this.mode);

    const socket = new RtcPairSocket(
      this.key.value.base58(),
      this.mode === 'Host' ? 'alice' : 'bob',
      rtcConfig,
    );

    this.socket.set(socket);

    return new Promise<RtcPairSocket>((resolve, reject) => {
      // Only set a timeout if in Join mode
      let connectionTimeout: ReturnType<typeof setTimeout> | undefined;

      if (this.mode === 'Join') {
        // Set a timeout to prevent getting stuck in connecting state
        connectionTimeout = setTimeout(() => {
          console.error('WebRTC connection timeout');
          socket.close();
          reject(new Error('Connection timeout. Please try again.'));
        }, 15000); // 15 seconds timeout
      }

      socket.on('open', () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }

        resolve(socket);
      });

      socket.on('error', err => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }

        console.error('WebRTC connection error:', err);
        reject(err);
      });
    }).catch(error => {
      // Only handle error with UI updates if in Join mode
      if (this.mode === 'Join') {
        this.errorMsg.set(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
        this.page.set('Error');
      }

      throw error;
    });
  }

  async host() {
    this.mode = 'Host';
    const socket = await this.connect();

    socket.removeAllListeners('message');

    socket.on('message', message => {
      if (!MessageInit.safeParse(message).error) {
        socket.send({ from: 'host', type: 'start' });
        this.runProtocol(socket).catch(this.handleProtocolError);
      }
    });
  }

  async join(keyBase58: string) {
    if (this.key.value.base58() === keyBase58) {
      return;
    }

    this.page.set('Connecting');

    this.mode = 'Join';
    this.key.set(Key.fromBase58(keyBase58));
    const socket = await this.connect();
    socket.send({ from: 'joiner', type: 'init' });

    const listener = (message: unknown) => {
      if (!MessageStart.safeParse(message).error) {
        socket.off('message', listener);
        this.runProtocol(socket).catch(this.handleProtocolError);
      }
    };

    socket.on('message', listener);
  }

  async runProtocol(socket: RtcPairSocket) {
    this.page.set('Choose');

    const FriendMsg = z.object({
      from: z.literal(this.mode === 'Host' ? 'joiner' : 'host'),
    });

    const msgListener = (msg: unknown) => {
      if (!FriendMsg.safeParse(msg).error) {
        this.msgQueue.push(msg);
      }
    };

    socket.removeAllListeners('message');
    socket.on('message', msgListener);

    const channel = makeZodChannel(
      (msg: unknown) => socket.send(msg),
      () => this.msgQueue.shift(),
    );

    const [choice, _readyMsg] = await Promise.all([
      new Promise<GameOption>(resolve => {
        this.once('ready', resolve);
      }),
      channel.recv(MessageReady).then(msg => {
        this.friendReady = true;
        return msg;
      }),
    ]);

    this.page.set('Calculating');
    socket.off('message', msgListener);

    const result = await runProtocol(
      this.mode,
      socket,
      choice,
      percentage => {
        this.mpcProgress.set(percentage);
      },
    );

    this.result.set(result);

    // This allows us to capture the ready event for the next game if the next
    // player sets up a new game while we're on the result page.
    socket.on('message', msgListener);

    // Don't close the socket, keep it open for potential replay
    // socket.close();

    this.page.set('Result');
  }

  handleProtocolError = (error: unknown) => {
    console.error('Protocol error:', error);
    this.errorMsg.set(`Protocol error: ${JSON.stringify(error)}`);
    this.page.set('Error');
  };

  async send(choice: GameOption) {
    this.emit('ready', choice);
    this.choice.set(choice);

    if (!this.friendReady) {
      this.page.set('Waiting');
    }

    this.socket.value!.send({
      from: this.mode === 'Host' ? 'host' : 'joiner',
      type: 'ready',
    });
  }

  async playAgain() {
    // Reset game state
    this.friendReady = false;
    this.result.set(undefined);
    this.choice.set(undefined);
    this.mpcProgress.set(0);

    // Check if socket exists and try to use it
    // Determine if we have a valid socket to use
    const useExistingSocket = Boolean(this.socket.value);

    if (useExistingSocket) {
      try {
        // Attempt to restart the protocol with existing socket
        this.runProtocol(this.socket.value!).catch(this.handleProtocolError);
        return; // Early return to avoid the reconnection code
      } catch (error) {
        // Socket exists but unusable, continue to reconnection
        console.log('Error reusing socket, will reconnect:', error);
      }
    }

    // Socket doesn't exist or is unusable, reconnect based on mode
    if (this.mode === 'Host') {
      this.host();
    } else {
      this.join(this.key.value.base58());
    }
  }

  endGame() {
    window.location.reload();
  }

  private static context = createContext<Ctx>(
    {} as Ctx,
  );

  static Provider = Ctx.context.Provider;

  static use() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useContext(Ctx.context);
  }
}
