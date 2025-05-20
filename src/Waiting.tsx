import { useEffect, useState } from 'react';
import Ctx from './Ctx';

export default function Waiting() {
  const ctx = Ctx.use();
  const [timeLeft, setTimeLeft] = useState(180); // 180 second timeout
  const [message, setMessage] = useState('Waiting for other player...');

  useEffect(() => {
    // Check if socket exists
    if (!ctx.socket.value) {
      setMessage('Connection lost. The other player may have left the game.');
      setTimeout(() => ctx.endGame(), 18000); // Return to home after 3 seconds
      return;
    }

    // Set up timeout countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setMessage('The other player is not responding. Returning to home...');

          // Return to home after showing message
          setTimeout(() => ctx.endGame(), 18000);
          return 0;
        }
        // eslint-disable-next-line padding-line-between-statements
        return prev - 1;
      });
    }, 1000);

    // Set up connection closed listener

    const handleConnectionLost = () => {
      clearInterval(timer);
      setMessage('Connection closed. The other player has left the game.');
      setTimeout(() => ctx.endGame(), 18000); // Return to home after showing message
    };

    // Add event listener for connection close
    if (ctx.socket.value) {
      ctx.socket.value.on('close', handleConnectionLost);
      ctx.socket.value.on('error', handleConnectionLost);
    }

    return () => {
      clearInterval(timer);
      if (ctx.socket.value) {
        ctx.socket.value.off('close', handleConnectionLost);
        ctx.socket.value.off('error', handleConnectionLost);
      }
    };
  }, [ctx]);

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>{message}</h2>
      {timeLeft > 0 && (
        <p>Timeout in: {timeLeft} seconds</p>
      )}
      {timeLeft <= 0 && (
        <p>Returning to home screen...</p>
      )}
      <button
        onClick={() => ctx.endGame()}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          borderRadius: '8px',
          backgroundColor: '#f44336',
          color: 'white',
          cursor: 'pointer',
          border: 'none',
        }}
      >
        Cancel and Return Home
      </button>
    </div>
  );
}
