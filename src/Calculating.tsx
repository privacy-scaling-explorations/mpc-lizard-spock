import Ctx from './Ctx';
import ProgressBar from './ProgressBar';

export default function Calculating() {
  const ctx = Ctx.use();
  const mpcProgress = ctx.mpcProgress.use();

  // Small function to adjust the computation progress.
  // The first 20% of progress is amplified to take significantly more time,
  // while the remaining 80% is compressed to progress faster.
  function getEasedProgress(progress: number) {
    const t = Math.min(1, Math.max(0, progress));

    if (t < 0.2) {
      return t * 10;
    }

    return (1 + (t - 0.2) * 0.1);
  }

  return <div>
    <ProgressBar progress={getEasedProgress(mpcProgress)} />
  </div>;
}
