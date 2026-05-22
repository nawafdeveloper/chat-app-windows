export function generateVideoThumbnailFromUrl(
    videoUrl: string,
    seekTo = 1
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');

        video.crossOrigin = 'anonymous';
        video.src = videoUrl;
        video.muted = true;
        video.playsInline = true;

        video.addEventListener('loadedmetadata', () => {

            video.currentTime = Math.min(seekTo, video.duration || seekTo);
        });

        video.addEventListener('seeked', () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Canvas not supported');

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject('Failed to create thumbnail');
                    resolve(blob);
                },
                'image/jpeg',
                0.8
            );
        });

        video.addEventListener('error', () => {
            reject('Failed to load video');
        });
    });
}
