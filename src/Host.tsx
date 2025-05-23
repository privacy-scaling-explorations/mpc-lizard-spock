import CopyToClipboard from 'react-copy-to-clipboard';
import Ctx from './Ctx';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect } from 'react';

export default function Host() {
  const ctx = Ctx.use();
  const key = ctx.key.use();

  const code = key.base58();

  useEffect(() => {
    ctx.host();
  }, [ctx]);

  return (
    <div>
      <h1>Host</h1>
      <p>
        Get your friend to scan:
      </p>
      <center>
        <QRCodeCanvas
          style={{ width: '100%', height: 'auto' }}
          bgColor='transparent'
          value={`${window.location.origin}${window.location.pathname}#${code}`}
        />
      </center>
      <p>
        Or <CopyToClipboard text={code}>
          <button style={{ padding: '0.5rem' }}>copy</button>
        </CopyToClipboard> it and send.
      </p>
    </div>
  );
}
