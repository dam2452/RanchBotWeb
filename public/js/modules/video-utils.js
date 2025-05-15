import { MESSAGES, FILE_EXTENSIONS } from '../core/constants.js';
import { downloadBlob, getSafeFilename } from '../core/dom-utils.js';

export function loadVideo(video, container) {
    return new Promise((resolve) => {
        if (video.readyState === 0) {
            video.load();

            const errorHandler = (e) => {
                console.error('Video loading error:', video.error?.message || 'Unknown error',
                    'for source:', video.currentSrc, e);

                showVideoErrorOverlay(container);
                resolve(false);
            };

            video.addEventListener('error', errorHandler, { once: true });

            const loadedHandler = () => {
                video.removeEventListener('error', errorHandler);
                resolve(true);
            };

            video.addEventListener('loadeddata', loadedHandler, { once: true });
        } else {
            resolve(true);
        }
    });
}

export function showVideoErrorOverlay(container) {
    if (!container.querySelector('.video-error-overlay')) {
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'video-error-overlay';
        errorOverlay.textContent = MESSAGES.LOADING_ERROR;
        container.appendChild(errorOverlay);
    }
}

export function showPlayMessage(container) {
    if (!container.querySelector('.play-message')) {
        const playMessage = document.createElement('div');
        playMessage.className = 'play-message';
        playMessage.textContent = MESSAGES.PLAY_MESSAGE;
        container.appendChild(playMessage);
    }
}

export function removeVideoOverlays(container) {
    container.querySelector('.play-message')?.remove();
    container.querySelector('.video-error-overlay')?.remove();
}

export async function playVideo(video, container) {
    removeVideoOverlays(container);

    try {
        await video.play();
        return true;
    } catch (error) {
        console.error('Playback error:', error);
        showPlayMessage(container);
        return false;
    }
}

export async function downloadVideoFromUrl(url, filename) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const blob = await response.blob();

        if (!blob.type.startsWith('video/')) {
            console.warn(`Downloaded unexpected MIME type: ${blob.type} for file ${filename}.`);
        }

        downloadBlob(blob, getSafeFilename(filename) + FILE_EXTENSIONS.VIDEO);

        return true;
    } catch (error) {
        console.error('Video download error:', error);
        throw error;
    }
}

export function createDownloadButton(downloadHandler) {
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = 'Download';

    downloadBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = 'Downloading...';
        downloadBtn.style.pointerEvents = 'none';

        try {
            await downloadHandler(e);
        } catch (error) {
            console.error('Download error:', error);
            alert(`${MESSAGES.DOWNLOAD_ERROR} ${error.message}`);
        } finally {
            downloadBtn.textContent = originalText;
            downloadBtn.style.pointerEvents = 'auto';
        }
    });

    return downloadBtn;
}