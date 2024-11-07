import Ctx from './Ctx';
import { QRCodeCanvas } from 'qrcode.react';

export default function Host() {
  const ctx = Ctx.use();

  return (
    <div>
      <h1>Share</h1>
      <p>
        Send your friend this url:<br />
        <a href='https://voltrevo.github.io/mpc-lizard-spock'>
          https://voltrevo.github.io/mpc-lizard-spock
        </a>
      </p>
      <p>
        Or have them scan:
      </p>
      <center>
        <QRCodeCanvas
          style={{ width: '100%', height: 'auto' }}
          bgColor='transparent'
          value='https://voltrevo.github.io/mpc-lizard-spock'
        />
      </center>
      <p>
        Once they have the app, return home and host a session.
      </p>
      <div className='main buttons'>
        <button onClick={() => ctx.page.set('Home')}>
          Home
        </button>
      </div>
    </div>
  );
}
