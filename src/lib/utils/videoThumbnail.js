/**
 * Capture a frame from a video file using HTML5 Video + Canvas.
 * Used when backend (FFmpeg) doesn't return a thumbnail - e.g. FFmpeg not installed.
 * @param {File} videoFile
 * @param {number} [seekTime=1] - seconds into video to capture
 * @returns {Promise<File|null>} JPEG File or null on failure
 */
export function captureVideoFrame(videoFile, seekTime = 1) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const url = URL.createObjectURL(videoFile);
    video.src = url;

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    video.onloadeddata = () => {
      if (video.duration > 0 && seekTime < video.duration) {
        video.currentTime = seekTime;
      } else {
        video.currentTime = Math.min(0.5, video.duration / 2);
      }
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (canvas.width === 0 || canvas.height === 0) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              const name = videoFile.name.replace(/\.[^.]+$/, '') + '_thumb.jpg';
              resolve(new File([blob], name, { type: 'image/jpeg' }));
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (e) {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };

    video.load();
  });
}
