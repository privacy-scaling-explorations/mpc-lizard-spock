import { useEffect, useState } from 'react';
import Ctx from './Ctx';

export default function Waiting() {
  const ctx = Ctx.use();
  const [message, setMessage] = useState('Waiting for other player...');

  useEffect(() => {
    // Check if socket exists
    if (!ctx.socket.value) {
      setMessage('Connection lost. The other player may have left the game.');
      setTimeout(() => ctx.endGame(), 18000); // Return to home after 3 seconds
      return;
    }

    const handleConnectionLost = () => {
      setMessage('Connection closed. The other player has left the game.');
      setTimeout(() => ctx.endGame(), 18000); // Return to home after showing message
    };

    // Add event listener for connection close
    if (ctx.socket.value) {
      ctx.socket.value.on('close', handleConnectionLost);
      ctx.socket.value.on('error', handleConnectionLost);
    }

    return () => {
      if (ctx.socket.value) {
        ctx.socket.value.off('close', handleConnectionLost);
        ctx.socket.value.off('error', handleConnectionLost);
      }
    };
  }, [ctx]);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>{message}</h2>
      <button
        onClick={() => ctx.endGame()}
        className='secondary'
      >
        Cancel and Return Home
      </button>
    </div>
  );
}
