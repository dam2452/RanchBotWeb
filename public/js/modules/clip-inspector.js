import { SELECTORS, CLASSES, MESSAGES, API, FILE_EXTENSIONS } from '../core/constants.js';
import { createElement, downloadBlob, getSafeFilename } from '../core/dom-utils.js';
import { callApiForBlob, adjustVideo, saveClip as apiSaveClip, getVideo } from './api-client.js';

export class ClipInspector {
    #targetClipElement = null;
    #controlsContainer = null;
    #video = null;
    #leftSlider = null;
    #rightSlider = null;
    #leftValue = null;
    #rightValue = null;
    #clipNameInput = null;
    #saveForm = null;
    #toggleSaveBtn = null;
    #saveClipBtn = null;
    #downloadBtn = null;
    #closeBtn = null;
    #statusEl = null;

    #clipIndex = -1;
    #clipUrl = '';
    #originalClipUrl = '';
    #leftAdjust = 0;
    #rightAdjust = 0;

    #previewUpdateTimeout = null;
    #currentPreviewUrl = null;
    #isUpdatingPreview = false;
    #statusTimer = null;
    #playVideoOnCanplay = null;
    #visible = false;
    #reelNavigatorInstance = null;
    #backdrop = null;
    #resizeObserver = null;

    constructor() {
        console.log("Initializing ClipInspector (in-place transformation)...");
        this.#createBackdrop();
        this.#setupResizeObserver();
        console.log("ClipInspector initialization completed successfully");
    }

    get visible() {
        return this.#visible;
    }

    setReelNavigator(reelNavigator) {
        this.#reelNavigatorInstance = reelNavigator;
    }

    #createBackdrop() {
        this.#backdrop = createElement('div', {
            className: 'clip-editor-backdrop'
        });

        this.#backdrop.addEventListener('click', (e) => {
            if (e.target === this.#backdrop) {
                this.hide();
            }
        });

        document.body.appendChild(this.#backdrop);
    }

    #setupResizeObserver() {
        this.#resizeObserver = new ResizeObserver(entries => {
            if (this.#visible && this.#targetClipElement) {
                this.#ensureVisibility();
            }
        });
    }

    #ensureVisibility() {
        if (!this.#targetClipElement) return;

        const rect = this.#targetClipElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.bottom > windowHeight) {
            const scrollAdjustment = rect.bottom - windowHeight + 20;
            window.scrollBy({
                top: scrollAdjustment,
                behavior: 'smooth'
            });
        }

        if (this.#controlsContainer) {
            this.#controlsContainer.style.display = 'block';
            this.#controlsContainer.style.opacity = '1';
        }
    }

    show(clipIndex, clipUrl, clipElement) {
        console.log(`Opening editor for clip ${clipIndex}, URL: ${clipUrl.substring(0, 50)}`);
        this.#clipIndex = clipIndex;
        this.#originalClipUrl = clipUrl;
        this.#targetClipElement = clipElement;

        this.#targetClipElement.classList.add('editing-mode');

        this.#video = this.#targetClipElement.querySelector('video');
        if (this.#video) {
            this.#clipUrl = this.#video.src;
            this.#video.play().catch(err => {
                console.warn("Unable to autoplay video:", err);
            });
        }

        if (this.#controlsContainer) {
            if (this.#targetClipElement.contains(this.#controlsContainer)) {
                this.#targetClipElement.removeChild(this.#controlsContainer);
            }
            this.#controlsContainer = null;
        }

        this.#createControlsContainer();
        this.#targetClipElement.appendChild(this.#controlsContainer);

        this.#resizeObserver.observe(document.body);

        this.#backdrop.classList.add('visible');

        if (this.#reelNavigatorInstance) {
            if (this.#reelNavigatorInstance.disableNavigation) {
                this.#reelNavigatorInstance.disableNavigation();
            }
        }

        this.resetSliders();

        if (this.#saveForm) {
            this.#saveForm.classList.remove(CLASSES.VISIBLE);
        }

        if (this.#clipNameInput) {
            this.#clipNameInput.value = '';
        }

        this.#visible = true;
        this.updateStatus(`Clip ${clipIndex + 1} loaded. Adjust with sliders.`);

        setTimeout(() => this.#ensureVisibility(), 100);
    }

    #createControlsContainer() {
        this.#controlsContainer = createElement('div', {
            className: 'clip-controls-container'
        });

        const header = createElement('div', {
            className: 'clip-editor-header'
        });

        const title = createElement('div', {
            className: 'clip-editor-title'
        }, 'Clip Adjustment');

        this.#closeBtn = createElement('button', {
            className: 'close-editor-btn'
        }, '×');

        header.appendChild(title);
        header.appendChild(this.#closeBtn);
        this.#controlsContainer.appendChild(header);

        const adjustmentControls = createElement('div', {
            className: 'adjustment-controls'
        });

        const leftSliderContainer = createElement('div', {
            className: 'time-slider-container'
        });

        const leftLabel = createElement('div', {
            className: 'time-slider-label'
        }, 'Left side (+ extend, - trim): ');

        this.#leftValue = createElement('span', {
            className: 'left-adjust-value'
        }, '0.0s');

        leftLabel.appendChild(this.#leftValue);

        this.#leftSlider = createElement('input', {
            type: 'range',
            className: 'time-slider left-adjust',
            min: '-10',
            max: '10',
            step: '0.5',
            value: '0'
        });

        leftSliderContainer.appendChild(leftLabel);
        leftSliderContainer.appendChild(this.#leftSlider);
        adjustmentControls.appendChild(leftSliderContainer);

        const rightSliderContainer = createElement('div', {
            className: 'time-slider-container'
        });

        const rightLabel = createElement('div', {
            className: 'time-slider-label'
        }, 'Right side (+ extend, - trim): ');

        this.#rightValue = createElement('span', {
            className: 'right-adjust-value'
        }, '0.0s');

        rightLabel.appendChild(this.#rightValue);

        this.#rightSlider = createElement('input', {
            type: 'range',
            className: 'time-slider right-adjust',
            min: '-10',
            max: '10',
            step: '0.5',
            value: '0'
        });

        rightSliderContainer.appendChild(rightLabel);
        rightSliderContainer.appendChild(this.#rightSlider);
        adjustmentControls.appendChild(rightSliderContainer);

        this.#controlsContainer.appendChild(adjustmentControls);

        const saveControls = createElement('div', {
            className: 'save-controls'
        });

        this.#toggleSaveBtn = createElement('button', {
            className: 'toggle-save-btn'
        }, 'Save clip');

        this.#saveForm = createElement('div', {
            className: 'save-form'
        });

        this.#clipNameInput = createElement('input', {
            type: 'text',
            className: 'clip-name-input',
            placeholder: 'Enter clip name'
        });

        this.#saveClipBtn = createElement('button', {
            className: 'save-clip-btn'
        }, 'Save');

        this.#saveForm.appendChild(this.#clipNameInput);
        this.#saveForm.appendChild(this.#saveClipBtn);

        saveControls.appendChild(this.#toggleSaveBtn);
        saveControls.appendChild(this.#saveForm);
        this.#controlsContainer.appendChild(saveControls);

        this.#downloadBtn = createElement('button', {
            className: 'download-adjusted-clip-btn'
        }, 'Download adjusted clip');

        this.#controlsContainer.appendChild(this.#downloadBtn);

        this.#statusEl = createElement('div', {
            className: 'clip-editor-status'
        });

        this.#controlsContainer.appendChild(this.#statusEl);

        this.attachEvents();

        setTimeout(() => {
            if (this.#controlsContainer) {
                this.#controlsContainer.style.opacity = '1';
                this.#controlsContainer.style.maxHeight = '500px';
            }
        }, 50);
    }

    attachEvents() {
        if (this.#leftSlider) {
            this.#leftSlider.addEventListener('input', () => {
                this.handleSliderInput(this.#leftSlider, 'leftAdjust', this.#leftValue);
            });
        }

        if (this.#rightSlider) {
            this.#rightSlider.addEventListener('input', () => {
                this.handleSliderInput(this.#rightSlider, 'rightAdjust', this.#rightValue);
            });
        }

        if (this.#toggleSaveBtn) {
            this.#toggleSaveBtn.addEventListener('click', () => {
                console.log("Save clip button pressed");
                this.#saveForm.classList.toggle(CLASSES.VISIBLE);
                if (this.#saveForm.classList.contains(CLASSES.VISIBLE)) {
                    this.#clipNameInput.focus();
                }
            });
        }

        if (this.#saveClipBtn) {
            this.#saveClipBtn.addEventListener('click', () => {
                console.log("Save button pressed");
                this.saveClip();
            });
        }

        if (this.#downloadBtn) {
            this.#downloadBtn.addEventListener('click', () => {
                console.log("Download button pressed");
                this.downloadAdjustedClip();
            });
        }

        if (this.#closeBtn) {
            this.#closeBtn.addEventListener('click', () => {
                console.log("Close button pressed");
                this.hide();
            });
        }

        if (this.#clipNameInput) {
            this.#clipNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log("Enter pressed in clip name input");
                    this.saveClip();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.#visible) {
                this.hide();
            }
        });
    }

    handleSliderInput(slider, valueProp, labelEl) {
        if (valueProp === 'leftAdjust') {
            this.#leftAdjust = parseFloat(slider.value);
            labelEl.textContent = `${this.#leftAdjust.toFixed(1)}s`;
        } else if (valueProp === 'rightAdjust') {
            this.#rightAdjust = parseFloat(slider.value);
            labelEl.textContent = `${this.#rightAdjust.toFixed(1)}s`;
        }
        this.requestPreviewUpdate();
    }

    clearPreviewState() {
        clearTimeout(this.#previewUpdateTimeout);
        if (this.#currentPreviewUrl) {
            URL.revokeObjectURL(this.#currentPreviewUrl);
            this.#currentPreviewUrl = null;
        }
        this.#isUpdatingPreview = false;
    }

    resetSliders() {
        this.#leftAdjust = 0;
        this.#rightAdjust = 0;

        if (this.#leftSlider) {
            this.#leftSlider.value = 0;
        }

        if (this.#rightSlider) {
            this.#rightSlider.value = 0;
        }

        if (this.#leftValue) {
            this.#leftValue.textContent = '0.0s';
        }

        if (this.#rightValue) {
            this.#rightValue.textContent = '0.0s';
        }
    }

    hide() {
        console.log("Closing clip editor");

        this.#resizeObserver.disconnect();

        if (this.#video) {
        }

        this.clearPreviewState();

        this.#backdrop.classList.remove('visible');

        if (this.#targetClipElement) {
            this.#targetClipElement.classList.remove('editing-mode');

            if (this.#controlsContainer && this.#targetClipElement.contains(this.#controlsContainer)) {
                this.#targetClipElement.removeChild(this.#controlsContainer);
            }
        }

        if (this.#reelNavigatorInstance) {
            if (this.#reelNavigatorInstance.enableNavigation) {
                this.#reelNavigatorInstance.enableNavigation();
            }
        }

        this.#visible = false;
    }

    updateStatus(message) {
        if (this.#statusEl) {
            console.log(`Status: ${message}`);
            this.#statusEl.textContent = message;
            this.#statusEl.classList.add('status-visible');

            if (this.#statusTimer) clearTimeout(this.#statusTimer);
            this.#statusTimer = setTimeout(() => {
                this.#statusEl.classList.remove('status-visible');
            }, 6000);
        }
    }

    requestPreviewUpdate() {
        if (this.#previewUpdateTimeout) {
            clearTimeout(this.#previewUpdateTimeout);
        }
        this.#previewUpdateTimeout = setTimeout(() => {
            this.updatePreview();
        }, 1000);
    }

    async updatePreview() {
        if (this.#isUpdatingPreview || !this.#video) {
            console.log("Preview update already in progress or no video, skipping.");
            return;
        }

        if (this.#leftAdjust === 0 && this.#rightAdjust === 0) {
            if (this.#video.src !== this.#originalClipUrl) {
                console.log("No adjustments, reverting to original clip preview.");
                this.revertToOriginalPreview();
            } else {
                console.log("No adjustments, original already shown.");
            }
            return;
        }

        this.#isUpdatingPreview = true;
        this.updateStatus('Updating preview...');
        console.log(`Starting preview update for L:${this.#leftAdjust}, R:${this.#rightAdjust}`);

        try {
            const clipIndexForApi = parseInt(this.#clipIndex) + 1;
            const previewBlob = await adjustVideo(clipIndexForApi, this.#leftAdjust, this.#rightAdjust);

            if (!previewBlob || previewBlob.size === 0) {
                throw new Error("API /d returned empty blob for preview.");
            }

            console.log("Received preview blob, size:", previewBlob.size);

            if (this.#currentPreviewUrl) {
                console.log("Releasing previous preview URL:", this.#currentPreviewUrl.substring(0, 50));
                URL.revokeObjectURL(this.#currentPreviewUrl);
            }

            this.#currentPreviewUrl = URL.createObjectURL(previewBlob);
            console.log("Created new preview URL:", this.#currentPreviewUrl.substring(0, 50));

            const currentTime = this.#video.currentTime;
            const isPaused = this.#video.paused;

            this.#video.src = this.#currentPreviewUrl;
            this.#clipUrl = this.#currentPreviewUrl;
            this.#video.load();

            this.#video.addEventListener('loadeddata', () => {
                console.log("New video data loaded, restoring time:", currentTime);
                setTimeout(() => {
                    this.#video.currentTime = currentTime;
                    if (!isPaused) {
                        this.#video.play().catch(e => console.warn("Autoplay failed after preview update:", e));
                    }
                }, 50);
                this.updateStatus('Preview updated.');
                this.#isUpdatingPreview = false;

                // Ensure controls remain visible after video update
                this.#ensureVisibility();
            }, { once: true });

            this.#video.addEventListener('error', (e) => {
                console.error("Error loading new preview video source:", e);
                this.updateStatus('Preview loading error.');
                this.revertToOriginalPreview();
                this.#isUpdatingPreview = false;
            }, { once: true });

        } catch (error) {
            console.error('Error during preview update:', error);
            this.updateStatus(`Preview update error: ${error.message}`);
            this.#isUpdatingPreview = false;
        }
    }

    revertToOriginalPreview() {
        if (!this.#video) return;

        console.log("Reverting to original preview URL:", this.#originalClipUrl.substring(0, 50));

        if (this.#currentPreviewUrl && this.#currentPreviewUrl !== this.#originalClipUrl) {
            URL.revokeObjectURL(this.#currentPreviewUrl);
            this.#currentPreviewUrl = null;
        }

        if (this.#video.src !== this.#originalClipUrl) {
            const currentTime = this.#video.currentTime;
            const isPaused = this.#video.paused;

            this.#video.src = this.#originalClipUrl;
            this.#clipUrl = this.#originalClipUrl;
            this.#video.load();

            this.#video.addEventListener('loadeddata', () => {
                console.log("Original video data loaded, restoring time:", currentTime);
                setTimeout(() => {
                    this.#video.currentTime = currentTime;
                    if (!isPaused) {
                        this.#video.play().catch(e => console.warn("Autoplay failed after reverting to original:", e));
                    }
                }, 50);
                this.updateStatus('Original clip restored.');

                this.#ensureVisibility();
            }, { once: true });

            this.#video.addEventListener('error', (e) => {
                console.error("Error loading original video source:", e);
                this.updateStatus('Error loading original clip.');
            }, { once: true });
        } else {
            this.updateStatus('Original clip already displayed.');
        }
    }

    async saveClip() {
        if (!this.#clipNameInput) return;

        const clipName = this.#clipNameInput.value.trim();
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
                if (this.#saveForm) {
                    this.#saveForm.classList.remove(CLASSES.VISIBLE);
                }
                this.#clipNameInput.value = '';
            } else {
                const errorMessage = response?.message || 'Unknown save error.';
                throw new Error(`Save failed: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error saving clip:', error);
            this.updateStatus(`Save error: ${error.message}`);
        }
    }

    async adjustClip() {
        try {
            if (this.#leftAdjust === 0 && this.#rightAdjust === 0) {
                console.log("No adjustments, no need to call /d");
                return null;
            }

            const adjustedClipIndex = parseInt(this.#clipIndex) + 1;
            const params = [
                adjustedClipIndex.toString(),
                this.#leftAdjust.toString(),
                this.#rightAdjust.toString()
            ];

            console.log(`Calling /d with params:`, params);
            const adjustedBlob = await adjustVideo(adjustedClipIndex, this.#leftAdjust, this.#rightAdjust);

            if (!adjustedBlob || adjustedBlob.size === 0) {
                throw new Error("API /d returned empty blob during adjustment.");
            }

            console.log("Received adjusted blob from /d (in adjustClip), size:", adjustedBlob.size);
            return adjustedBlob;
        } catch (error) {
            console.error('Error adjusting clip via /d:', error);
            throw error;
        }
    }

    async downloadAdjustedClip() {
        let blobToDownload;
        let fileName;
        const clipId = parseInt(this.#clipIndex) + 1;

        try {
            if (this.#leftAdjust === 0 && this.#rightAdjust === 0) {
                this.updateStatus('Downloading original clip...');
                console.log("Downloading original clip via /w, index:", clipId);
                blobToDownload = await getVideo(clipId);
                fileName = `clip_${clipId}${FILE_EXTENSIONS.VIDEO}`;
            } else {
                this.updateStatus('Adjusting clip for download...');
                blobToDownload = await this.adjustClip();
                if (!blobToDownload) throw new Error("Unable to obtain adjusted clip.");

                this.updateStatus('Preparing adjusted clip for download...');

                const formatAdjust = (val) => val >= 0 ? `+${val.toFixed(1)}` : `${val.toFixed(1)}`;
                fileName = `clip_${clipId}_L${formatAdjust(this.#leftAdjust)}_R${formatAdjust(this.#rightAdjust)}${FILE_EXTENSIONS.VIDEO}`;
            }

            if (!blobToDownload || blobToDownload.size === 0) {
                throw new Error("Received empty blob for download.");
            }

            console.log(`Preparing to download blob: ${fileName}, size: ${blobToDownload.size}`);

            downloadBlob(blobToDownload, fileName);
            this.updateStatus('Clip ready for download!');

        } catch (error) {
            console.error('Error downloading clip:', error);
            this.updateStatus(`Download error: ${error.message}`);
        }
    }
}
