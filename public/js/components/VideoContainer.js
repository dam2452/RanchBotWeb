import { MESSAGES, FILE_EXTENSIONS } from '../core/constants.js';
import { getSafeFilename } from '../core/dom-utils.js';
import { loadVideo, playVideo, removeVideoOverlays } from '../modules/video-utils.js';

export class VideoContainer {
    #container;
    #video;
    #clipId;
    #clipName;
    #isActive;
    #isCompleting;

    constructor(container) {
        this.#container = container;
        this.#video = container.querySelector('video');
        this.#clipId = container.dataset.clipId;
        this.#clipName = container.dataset.clipName;
        this.#isActive = false;
        this.#isCompleting = false;

        this.#initialize();
    }

    get container() {
        return this.#container;
    }

    get video() {
        return this.#video;
    }

    get isActive() {
        return this.#isActive;
    }

    async play() {
        removeVideoOverlays(this.#container);
        await loadVideo(this.#video, this.#container);

        if (this.#video.paused) {
            await playVideo(this.#video, this.#container);
        }

        this.#isActive = true;
        this.#isCompleting = false;
        this.#container.classList.add('active');
    }

    pause() {
        this.#video.pause();
        this.#isActive = false;
        this.#container.classList.remove('active');
    }

    #initialize() {
        this.#attachEventListeners();
    }

    #attachEventListeners() {
        this.#video.addEventListener('ended', this.#handleVideoEnd.bind(this));
        this.#container.addEventListener('mouseenter', this.#handleMouseEnter.bind(this));
        this.#container.addEventListener('mouseleave', this.#handleMouseLeave.bind(this));
        this.#container.addEventListener('click', this.#handleClick.bind(this));

        const downloadBtn = this.#container.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', this.#handleDownload.bind(this));
        }
    }

    #handleVideoEnd = () => {
        if (this.#isCompleting && this.#isActive) {
            this.pause();
        }
    }

    #handleMouseEnter = () => {
        removeVideoOverlays(this.#container);
        loadVideo(this.#video, this.#container);
    }

    #handleMouseLeave = () => {
        this.#isCompleting = true;
    }

    #handleClick = (e) => {
        if (e.target.classList.contains('download-btn') || e.target.closest('.delete-clip-btn')) {
            return;
        }

        removeVideoOverlays(this.#container);

        if (this.#isActive) {
            this.#togglePlayPause();
        } else {
            this.play();
        }
    }

    #togglePlayPause() {
        if (this.#video.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    #handleDownload = async (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (!this.#validateClipName()) {
            return;
        }

        const btn = e.target;
        this.#setDownloadButtonState(btn, true, 'Downloading...');

        try {
            const blob = await this.#fetchVideoBlob();
            this.#downloadBlob(blob);
        } catch (error) {
            this.#handleDownloadError(error);
        } finally {
            this.#setDownloadButtonState(btn, false, 'Download');
        }
    }

    #validateClipName() {
        if (!this.#clipName) {
            alert("Clip name cannot be identified for download.");
            return false;
        }
        return true;
    }

    #setDownloadButtonState(button, isLoading, text) {
        button.textContent = text;
        button.style.pointerEvents = isLoading ? 'none' : 'auto';
    }

    async #fetchVideoBlob() {
        const response = await fetch(`/api/api-video.php?endpoint=wys&id=${encodeURIComponent(this.#clipName)}`);

        if (!response.ok) {
            throw await this.#createResponseError(response);
        }

        const blob = await response.blob();
        this.#validateBlobType(blob);

        return blob;
    }

    async #createResponseError(response) {
        let errorDetails = `HTTP error! Status: ${response.status}`;
        try {
            const errorJson = await response.json();
            errorDetails += ` - ${errorJson.error || 'Unknown server error'}`;
        } catch (jsonError) {
        }
        return new Error(errorDetails);
    }

    #validateBlobType(blob) {
        if (!blob.type.startsWith('video/')) {
            console.warn(`Downloaded unexpected MIME type: ${blob.type} for clip ${this.#clipName}.`);
        }
    }

    #downloadBlob(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.#getDownloadFilename();
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    #getDownloadFilename() {
        return getSafeFilename(this.#clipName) + FILE_EXTENSIONS.VIDEO;
    }

    #handleDownloadError(error) {
        console.error('Error during video download:', error);
        alert(`${MESSAGES.DOWNLOAD_ERROR} ${error.message}`);
    }
}

export function initializeVideoContainers() {
    const containers = document.querySelectorAll('.video-container');
    const videoContainers = [];
    let activeContainer = null;

    containers.forEach(container => {
        const videoContainer = new VideoContainer(container);
        videoContainers.push(videoContainer);

        const originalPlay = videoContainer.play;
        videoContainer.play = async function() {
            if (activeContainer && activeContainer !== videoContainer) {
                activeContainer.pause();
            }
            activeContainer = videoContainer;
            await originalPlay.call(videoContainer);
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