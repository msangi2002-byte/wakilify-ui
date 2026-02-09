/**
 * Visual progress bar for chunked uploads.
 * Watumiaji wanaona asilimia inavyoongezeka wakati wa kupakia faili kubwa.
 */
export function UploadProgressBar({ progress = 0, label = 'Uploading...' }) {
  const pct = Math.min(100, Math.max(0, Number(progress)));
  return (
    <div className="upload-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="upload-progress-track">
        <div className="upload-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="upload-progress-label">{label} {Math.round(pct)}%</span>
    </div>
  );
}
