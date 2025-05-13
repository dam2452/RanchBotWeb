// public/js/components/VideoContainer.js

import { MESSAGES, FILE_EXTENSIONS } from '../core/constants.js';
import { getSafeFilename } from '../core/dom-utils.js';
import { loadVideo, playVideo, removeVideoOverlays } from '../modules/video-utils.js';

/**
 * VideoContainer - Manages video playback, interactions and errors
 */
export class VideoContainer {
    constructor(container) {
        this.container = container;
        this.video = container.querySelector('video');
        this.clipId = container.dataset.clipId;
        this.clipName = container.dataset.clipName;
        this.isActive = false;
        this.isCompleting = false;

        this.init();
    }

    init() {
        // Attach event listeners
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Video event listeners
        this.video.addEventListener('ended', this.handleVideoEnd.bind(this));

        // Container event listeners
        this.container.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.container.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.container.addEventListener('click', this.handleClick.bind(this));

        // Download button listener
        const downloadBtn = this.container.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', this.handleDownload.bind(this));
        }
    }

    async play() {
        removeVideoOverlays(this.container);

        await loadVideo(this.video, this.container);

        if (this.video.paused) {
            await playVideo(this.video, this.container);
        }

        this.isActive = true;
        this.isCompleting = false;
        this.container.classList.add('active');
    }

    pause() {
        this.video.pause();
        this.isActive = false;
        this.container.classList.remove('active');
    }

    handleVideoEnd() {
        if (this.isCompleting && this.isActive) {
            this.pause();
        }
    }

    handleMouseEnter() {
        this.play();
    }

    handleMouseLeave() {
        this.isCompleting = true;
    }

    handleClick(e) {
        // Ignore clicks on download or delete buttons
        if (e.target.classList.contains('download-btn') || e.target.closest('.delete-clip-btn')) {
            return;
        }

        removeVideoOverlays(this.container);

        if (this.isActive) {
            if (this.video.paused) {
                this.play();
            } else {
                this.pause();
            }
        } else {
            this.play();
        }
    }

    async handleDownload(e) {
        e.stopPropagation();
        e.preventDefault();

        if (!this.clipName) {
            alert("Nie można zidentyfikować nazwy klipu do pobrania.");
            return;
        }

        const btn = e.target;
        btn.textContent = 'Pobieranie...';
        btn.style.pointerEvents = 'none';

        try {
            // Zmiana z /debug-video.php na /api/api-video.php
            const response = await fetch(`/api/api-video.php?endpoint=wys&id=${encodeURIComponent(this.clipName)}`);

            if (!response.ok) {
                let errorDetails = `HTTP error! Status: ${response.status}`;
                try {
                    const errorJson = await response.json();
                    errorDetails += ` - ${errorJson.error || 'Unknown server error'}`;
                } catch (jsonError) { /* Ignore */ }
                throw new Error(errorDetails);
            }

            const blob = await response.blob();

            if (!blob.type.startsWith('video/')) {
                console.warn(`Pobrano nieoczekiwany typ MIME: ${blob.type} dla klipu ${this.clipName}.`);
            }

            this.downloadBlob(blob);

        } catch (error) {
            console.error('Błąd podczas pobierania wideo:', error);
            alert(`${MESSAGES.DOWNLOAD_ERROR} ${error.message}`);
        } finally {
            btn.textContent = 'Pobierz';
            btn.style.pointerEvents = 'auto';
        }
    }

    downloadBlob(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeFilename = getSafeFilename(this.clipName) + FILE_EXTENSIONS.VIDEO;
        a.download = safeFilename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
}

/**
 * Create and manage all video containers on the page
 */
export function initializeVideoContainers() {
    const containers = document.querySelectorAll('.video-container');
    const videoContainers = [];
    let activeContainer = null;

    containers.forEach(container => {
        const videoContainer = new VideoContainer(container);
        videoContainers.push(videoContainer);

        // Override methods to manage active state globally
        const originalPlay = videoContainer.play;
        videoContainer.play = function() {
            if (activeContainer && activeContainer !== videoContainer) {
                activeContainer.pause();
            }
            activeContainer = videoContainer;
            originalPlay.call(videoContainer);
        };
    });

    return {
        stopAll: function() {
            if (activeContainer) {
                activeContainer.pause();
                activeContainer = null;
            }
        },
        containers: videoContainers
    };
}