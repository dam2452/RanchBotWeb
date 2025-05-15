import { SELECTORS, CLASSES, MESSAGES, API, FILE_EXTENSIONS } from '../core/constants.js';
import { createElement, downloadBlob, getSafeFilename } from '../core/dom-utils.js';
import { callApiForBlob, adjustVideo, saveClip as apiSaveClip, getVideo } from './api-client.js';

export class ClipInspector {
    constructor() {
        console.log("Initializing ClipInspector (with preview)...");

        this.clipIndex = -1;
        this.clipUrl = '';
        this.originalClipUrl = '';
        this.leftAdjust = 0;
        this.rightAdjust = 0;

        this.previewUpdateTimeout = null;
        this.currentPreviewUrl = null;
        this.isUpdatingPreview = false;
        this.visible = false;

        this.createInspectorElement();
        this.attachEvents();

        console.log("ClipInspector initialized successfully with preview handling");
    }

    createInspectorElement() {
        console.log("Creating inspector element...");

        const existingInspector = document.querySelector('.clip-inspector');
        if (existingInspector) {
            console.log("Inspector already exists, removing...");
            existingInspector.remove();
        }

        this.element = createElement('div', { className: 'clip-inspector' }, `
      <div class="inspector-overlay"></div>
      <div class="inspector-container">
        <div class="inspector-header">
          <div class="inspector-title">Clip Adjustment</div>
          <button class="close-inspector-btn">×</button>
        </div>
        <div class="inspector-video-container">
          <video controls loop>
            <source src="" type="video/mp4">
          </video>
        </div>
        <div class="inspector-controls">
          <div class="adjustment-controls">
            <div class="time-slider-container">
              <div class="time-slider-label">Left side (+ expand, - trim): <span class="left-adjust-value">0.0s</span></div>
              <input type="range" class="time-slider left-adjust" min="-10" max="10" step="0.5" value="0">
            </div>
            <div class="time-slider-container">
              <div class="time-slider-label">Right side (+ expand, - trim): <span class="right-adjust-value">0.0s</span></div>
              <input type="range" class="time-slider right-adjust" min="-10" max="10" step="0.5" value="0">
            </div>
          </div>
          <div class="save-controls">
            <button class="toggle-save-btn">Save clip</button>
            <div class="save-form">
              <input type="text" class="clip-name-input" placeholder="Enter clip name">
              <button class="save-clip-btn">Save</button>
            </div>
          </div>
          <button class="download-adjusted-clip-btn">Download adjusted clip</button>
        </div>
        <div class="inspector-status"></div>
      </div>
    `);

        document.body.appendChild(this.element);
        console.log("Inspector element created and added to document");

        this.video = this.element.querySelector('video');
        this.leftSlider = this.element.querySelector('.left-adjust');
        this.rightSlider = this.element.querySelector('.right-adjust');
        this.leftValue = this.element.querySelector('.left-adjust-value');
        this.rightValue = this.element.querySelector('.right-adjust-value');
        this.clipNameInput = this.element.querySelector('.clip-name-input');
        this.saveForm = this.element.querySelector('.save-form');
        this.toggleSaveBtn = this.element.querySelector('.toggle-save-btn');
        this.saveClipBtn = this.element.querySelector('.save-clip-btn');
        this.downloadBtn = this.element.querySelector('.download-adjusted-clip-btn');
        this.closeBtn = this.element.querySelector('.close-inspector-btn');
        this.statusEl = this.element.querySelector('.inspector-status');
    }

    attachEvents() {
        console.log("Attaching event handlers (with preview)...");

        this.leftSlider.addEventListener('input', () => {
            this.handleSliderInput(this.leftSlider, 'leftAdjust', this.leftValue);
        });

        this.rightSlider.addEventListener('input', () => {
            this.handleSliderInput(this.rightSlider, 'rightAdjust', this.rightValue);
        });

        this.toggleSaveBtn.addEventListener('click', () => {
            console.log("Save clip button clicked");
            this.saveForm.classList.toggle(CLASSES.VISIBLE);
            if (this.saveForm.classList.contains(CLASSES.VISIBLE)) {
                this.clipNameInput.focus();
            }
        });

        this.saveClipBtn.addEventListener('click', () => {
            console.log("Save button clicked");
            this.saveClip();
        });

        this.downloadBtn.addEventListener('click', () => {
            console.log("Download button clicked");
            this.downloadAdjustedClip();
        });

        this.closeBtn.addEventListener('click', () => {
            console.log("Close button clicked");
            this.hide();
        });

        this.element.querySelector('.inspector-overlay').addEventListener('click', () => {
            console.log("Overlay clicked");
            this.hide();
        });

        this.clipNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log("Enter key pressed in clip name input");
                this.saveClip();
            }
        });

        console.log("Event handlers (with preview) successfully added");
    }

    handleSliderInput(slider, valueProp, labelEl) {
        this[valueProp] = parseFloat(slider.value);
        labelEl.textContent = `${this[valueProp].toFixed(1)}s`;
        this.requestPreviewUpdate();
    }

    show(clipIndex, clipUrl) {
        console.log(`Opening inspector for clip ${clipIndex}, URL: ${clipUrl.substring(0, 50)}`);
        this.clipIndex = clipIndex;
        this.originalClipUrl = clipUrl;

        this.clearPreviewState();

        this.video.src = this.originalClipUrl;
        this.clipUrl = this.originalClipUrl;

        this.resetSliders();

        this.saveForm.classList.remove(CLASSES.VISIBLE);
        this.clipNameInput.value = '';

        this.element.classList.add(CLASSES.VISIBLE);
        this.visible = true;

        this.hideSearchContainer();

        this.setupPlayOnLoad();

        this.updateStatus(`Clip ${clipIndex + 1} loaded. Adjust using sliders.`);
    }

    clearPreviewState() {
        clearTimeout(this.previewUpdateTimeout);
        if (this.currentPreviewUrl) {
            URL.revokeObjectURL(this.currentPreviewUrl);
            this.currentPreviewUrl = null;
        }
        this.isUpdatingPreview = false;
    }

    resetSliders() {
        this.leftAdjust = 0;
        this.rightAdjust = 0;
        this.leftSlider.value = 0;
        this.rightSlider.value = 0;
        this.leftValue.textContent = '0.0s';
        this.rightValue.textContent = '0.0s';
    }

    hideSearchContainer() {
        const searchContainer = document.querySelector(SELECTORS.SEARCH_CONTAINER);
        if (searchContainer) {
            searchContainer.classList.add(CLASSES.HIDDEN);
        }
    }

    setupPlayOnLoad() {
        if (this.playVideoOnCanplay) {
            this.video.removeEventListener('canplay', this.playVideoOnCanplay);
        }

        this.playVideoOnCanplay = () => {
            console.log("Video (original) ready to play");
            this.video.play().catch(err => {
                console.warn("Could not auto-play video:", err);
            });
        };

        this.video.addEventListener('canplay', this.playVideoOnCanplay, { once: true });
    }

    hide() {
        console.log("Closing inspector");
        this.video.pause();
        this.clearPreviewState();

        this.element.classList.remove(CLASSES.VISIBLE);
        this.visible = false;

        const searchContainer = document.querySelector(SELECTORS.SEARCH_CONTAINER);
        if (searchContainer) {
            searchContainer.classList.remove(CLASSES.HIDDEN);
        }
    }

    updateStatus(message) {
        if (this.statusEl) {
            console.log(`Status: ${message}`);
            this.statusEl.textContent = message;
            this.statusEl.classList.add('status-visible');

            if (this.statusTimer) clearTimeout(this.statusTimer);
            this.statusTimer = setTimeout(() => {
                this.statusEl.classList.remove('status-visible');
            }, 6000);
        }
    }

    requestPreviewUpdate() {
        if (this.previewUpdateTimeout) {
            clearTimeout(this.previewUpdateTimeout);
        }
        this.previewUpdateTimeout = setTimeout(() => {
            this.updatePreview();
        }, 1000);
    }

    async updatePreview() {
        if (this.isUpdatingPreview) {
            console.log("Preview update already in progress, skipping.");
            return;
        }

        if (this.leftAdjust === 0 && this.rightAdjust === 0) {
            if (this.video.src !== this.originalClipUrl) {
                console.log("No adjustments, restoring original clip in preview.");
                this.revertToOriginalPreview();
            } else {
                console.log("No adjustments, original already displayed.");
            }
            return;
        }

        this.isUpdatingPreview = true;
        this.updateStatus('Updating preview...');
        console.log(`Starting preview update for L:${this.leftAdjust}, R:${this.rightAdjust}`);

        try {
            const clipIndexForApi = parseInt(this.clipIndex) + 1;
            const previewBlob = await adjustVideo(clipIndexForApi, this.leftAdjust, this.rightAdjust);

            if (!previewBlob || previewBlob.size === 0) {
                throw new Error("API /d returned empty blob for preview.");
            }

            console.log("Received preview blob, size:", previewBlob.size);

            if (this.currentPreviewUrl) {
                console.log("Releasing previous preview URL:", this.currentPreviewUrl.substring(0, 50));
                URL.revokeObjectURL(this.currentPreviewUrl);
            }

            this.currentPreviewUrl = URL.createObjectURL(previewBlob);
            console.log("Created new preview URL:", this.currentPreviewUrl.substring(0, 50));

            const currentTime = this.video.currentTime;
            const isPaused = this.video.paused;

            this.video.src = this.currentPreviewUrl;
            this.clipUrl = this.currentPreviewUrl;
            this.video.load();

            this.video.addEventListener('loadeddata', () => {
                console.log("New video data loaded, restoring time:", currentTime);
                setTimeout(() => {
                    this.video.currentTime = currentTime;
                    if (!isPaused) {
                        this.video.play().catch(e => console.warn("Autoplay failed after preview update:", e));
                    }
                }, 50);
                this.updateStatus('Preview updated.');
                this.isUpdatingPreview = false;
            }, { once: true });

            this.video.addEventListener('error', (e) => {
                console.error("Error loading new preview video source:", e);
                this.updateStatus('Error loading preview.');
                this.revertToOriginalPreview();
                this.isUpdatingPreview = false;
            }, { once: true });

        } catch (error) {
            console.error('Error during preview update:', error);
            this.updateStatus(`Preview update error: ${error.message}`);
            this.isUpdatingPreview = false;
        }
    }

    revertToOriginalPreview() {
        console.log("Reverting to original preview URL:", this.originalClipUrl.substring(0, 50));

        if (this.currentPreviewUrl && this.currentPreviewUrl !== this.originalClipUrl) {
            URL.revokeObjectURL(this.currentPreviewUrl);
            this.currentPreviewUrl = null;
        }

        if (this.video.src !== this.originalClipUrl) {
            const currentTime = this.video.currentTime;
            const isPaused = this.video.paused;

            this.video.src = this.originalClipUrl;
            this.clipUrl = this.originalClipUrl;
            this.video.load();

            this.video.addEventListener('loadeddata', () => {
                console.log("Original video data loaded, restoring time:", currentTime);
                setTimeout(() => {
                    this.video.currentTime = currentTime;
                    if (!isPaused) {
                        this.video.play().catch(e => console.warn("Autoplay failed after restoring original:", e));
                    }
                }, 50);
                this.updateStatus('Original clip restored.');
            }, { once: true });

            this.video.addEventListener('error', (e) => {
                console.error("Error loading original video source:", e);
                this.updateStatus('Error loading original clip.');
            }, { once: true });
        } else {
            this.updateStatus('Original clip already displayed.');
        }
    }

    async saveClip() {
        const clipName = this.clipNameInput.value.trim();
        if (!clipName) {
            this.updateStatus(MESSAGES.CLIP_NAME_REQUIRED);
            return;
        }

        this.updateStatus('Preparing to save...');

        try {
            await this.adjustClip();

            this.updateStatus('Saving clip to server...');
            const response = await apiSaveClip(clipName);
            console.log('API save response (/z):', response);

            if (response && response.status === 'success') {
                this.updateStatus(`Clip "${clipName}" saved successfully!`);
                this.saveForm.classList.remove(CLASSES.VISIBLE);
                this.clipNameInput.value = '';
            } else {
                const errorMessage = response?.message || 'Unknown save error.';
                throw new Error(`Save failed: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error during clip save:', error);
            this.updateStatus(`Save error: ${error.message}`);
        }
    }

    async adjustClip() {
        try {
            if (this.leftAdjust === 0 && this.rightAdjust === 0) {
                console.log("No adjustments, no need to call /d");
                return null;
            }

            const adjustedClipIndex = parseInt(this.clipIndex) + 1;
            const params = [
                adjustedClipIndex.toString(),
                this.leftAdjust.toString(),
                this.rightAdjust.toString()
            ];

            console.log(`Calling /d with parameters:`, params);
            const adjustedBlob = await adjustVideo(adjustedClipIndex, this.leftAdjust, this.rightAdjust);

            if (!adjustedBlob || adjustedBlob.size === 0) {
                throw new Error("API /d returned empty blob during adjustment.")
            }

            console.log("Received adjusted blob from /d (in adjustClip), size:", adjustedBlob.size);
            return adjustedBlob;
        } catch (error) {
            console.error('Error during clip adjustment via /d:', error);
            throw error;
        }
    }

    async downloadAdjustedClip() {
        let blobToDownload;
        let fileName;
        const clipId = parseInt(this.clipIndex) + 1;

        try {
            if (this.leftAdjust === 0 && this.rightAdjust === 0) {
                this.updateStatus('Downloading original clip...');
                console.log("Downloading original clip via /w, index:", clipId);
                blobToDownload = await getVideo(clipId);
                fileName = `clip_${clipId}${FILE_EXTENSIONS.VIDEO}`;
            } else {
                this.updateStatus('Adjusting clip for download...');
                blobToDownload = await this.adjustClip();
                if (!blobToDownload) throw new Error("Could not obtain adjusted clip.");

                this.updateStatus('Preparing adjusted clip for download...');

                const formatAdjust = (val) => val >= 0 ? `+${val.toFixed(1)}` : `${val.toFixed(1)}`;
                fileName = `clip_${clipId}_L${formatAdjust(this.leftAdjust)}_P${formatAdjust(this.rightAdjust)}${FILE_EXTENSIONS.VIDEO}`;
            }

            if (!blobToDownload || blobToDownload.size === 0) {
                throw new Error("Received empty blob for download.");
            }

            console.log(`Preparing for download of blob: ${fileName}, size: ${blobToDownload.size}`);

            downloadBlob(blobToDownload, fileName);
            this.updateStatus('Clip ready for download!');

        } catch (error) {
            console.error('Error during clip download:', error);
            this.updateStatus(`Download error: ${error.message}`);
        }
    }
}