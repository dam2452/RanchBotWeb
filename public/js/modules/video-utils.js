// public/js/modules/video-utils.js

import { MESSAGES, FILE_EXTENSIONS } from '../core/constants.js';
import { downloadBlob, getSafeFilename } from '../core/dom-utils.js';

/**
 * Load a video element and handle errors
 * @param {HTMLVideoElement} video - Video element
 * @param {HTMLElement} container - Container element for error messages
 * @returns {Promise<boolean>} True if loading succeeded
 */
export function loadVideo(video, container) {
    return new Promise((resolve) => {
        if (video.readyState === 0) {
            video.load();

            const errorHandler = (e) => {
                console.error('Błąd ładowania wideo:', video.error?.message || 'Nieznany błąd',
                    'dla źródła:', video.currentSrc, e);

                showVideoErrorOverlay(container);
                resolve(false);
            };

            video.addEventListener('error', errorHandler, { once: true });

            // Set up success handler
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

/**
 * Show video error overlay
 * @param {HTMLElement} container - Container element
 */
export function showVideoErrorOverlay(container) {
    if (!container.querySelector('.video-error-overlay')) {
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'video-error-overlay';
        errorOverlay.textContent = MESSAGES.LOADING_ERROR;
        container.appendChild(errorOverlay);
    }
}

/**
 * Show play message overlay
 * @param {HTMLElement} container - Container element
 */
export function showPlayMessage(container) {
    if (!container.querySelector('.play-message')) {
        const playMessage = document.createElement('div');
        playMessage.className = 'play-message';
        playMessage.textContent = MESSAGES.PLAY_MESSAGE;
        container.appendChild(playMessage);
    }
}

/**
 * Remove all video overlays
 * @param {HTMLElement} container - Container element
 */
export function removeVideoOverlays(container) {
    container.querySelector('.play-message')?.remove();
    container.querySelector('.video-error-overlay')?.remove();
}

/**
 * Play a video element with error handling
 * @param {HTMLVideoElement} video - Video element
 * @param {HTMLElement} container - Container element for error messages
 * @returns {Promise<boolean>} True if playback started successfully
 */
export async function playVideo(video, container) {
    removeVideoOverlays(container);

    try {
        await video.play();
        return true;
    } catch (error) {
        console.error('Błąd odtwarzania:', error);
        showPlayMessage(container);
        return false;
    }
}

/**
 * Download a video from a given URL
 * @param {string} url - URL of the video to download
 * @param {string} filename - Name for the downloaded file
 * @returns {Promise<void>}
 */
export async function downloadVideoFromUrl(url, filename) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const blob = await response.blob();

        if (!blob.type.startsWith('video/')) {
            console.warn(`Pobrano nieoczekiwany typ MIME: ${blob.type} dla pliku ${filename}.`);
        }

        downloadBlob(blob, getSafeFilename(filename) + FILE_EXTENSIONS.VIDEO);

        return true;
    } catch (error) {
        console.error('Błąd podczas pobierania wideo:', error);
        throw error;
    }
}

/**
 * Create a video download button
 * @param {Function} downloadHandler - Function to handle download
 * @returns {HTMLButtonElement} Download button
 */
export function createDownloadButton(downloadHandler) {
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn';
    downloadBtn.textContent = 'Pobierz';

    downloadBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = 'Pobieranie...';
        downloadBtn.style.pointerEvents = 'none';

        try {
            await downloadHandler(e);
        } catch (error) {
            console.error('Błąd podczas pobierania:', error);
            alert(`${MESSAGES.DOWNLOAD_ERROR} ${error.message}`);
        } finally {
            downloadBtn.textContent = originalText;
            downloadBtn.style.pointerEvents = 'auto';
        }
    });

    return downloadBtn;
}