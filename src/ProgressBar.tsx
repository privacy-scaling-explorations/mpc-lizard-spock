import './ProgressBar.css';

export default function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className='progress-bar'>
      <div style={{ width: `${progress * 100}%` }}></div>
    </div>
  );
}
