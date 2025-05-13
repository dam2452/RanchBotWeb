// public/js/components/VideoContainer.js

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

    loadVideo() {
        if (this.video.readyState === 0) {
            this.video.load();
            this.video.addEventListener('error', this.handleVideoError.bind(this), { once: true });
        }
    }

    handleVideoError(e) {
        console.error('Błąd ładowania wideo:', this.video.error?.message || 'Nieznany błąd',
            'dla źródła:', this.video.currentSrc, e);

        this.showErrorOverlay();
    }

    showErrorOverlay() {
        if (!this.container.querySelector('.video-error-overlay')) {
            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'video-error-overlay';
            errorOverlay.textContent = 'Błąd ładowania';
            this.container.appendChild(errorOverlay);
        }
    }

    removeOverlays() {
        this.container.querySelector('.play-message')?.remove();
        this.container.querySelector('.video-error-overlay')?.remove();
    }

    play() {
        this.removeOverlays();
        this.loadVideo();

        if (this.video.paused) {
            this.video.play().catch(this.handlePlayError.bind(this));
        }

        this.isActive = true;
        this.isCompleting = false;
        this.container.classList.add('active');
    }

    handlePlayError(err) {
        console.error('Błąd odtwarzania:', err);

        const playMessage = document.createElement('div');
        playMessage.className = 'play-message';
        playMessage.textContent = 'Kliknij, aby odtworzyć';

        if (!this.container.querySelector('.play-message')) {
            this.container.appendChild(playMessage);
        }
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

        this.removeOverlays();

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
            const response = await fetch(`/debug-video.php?id=${encodeURIComponent(this.clipName)}`);

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
            alert(`Przepraszamy, wystąpił błąd podczas pobierania wideo: ${error.message}`);
        } finally {
            btn.textContent = 'Pobierz';
            btn.style.pointerEvents = 'auto';
        }
    }

    downloadBlob(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeFilename = this.clipName.replace(/[^a-zA-Z0-9_.-]/g, '_') + '.mp4';
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