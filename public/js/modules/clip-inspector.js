// public/js/modules/clip-inspector.js

import { CLASSES, SELECTORS, MESSAGES, API, FILE_EXTENSIONS } from '../core/constants.js';
import { createElement, downloadBlob, getSafeFilename } from '../core/dom-utils.js';
import { callApiForBlob, adjustVideo, saveClip as apiSaveClip, getVideo } from './api-client.js';

/**
 * ClipInspector - Manages clip adjustment, preview, and saving
 */
export class ClipInspector {
    constructor() {
        console.log("Inicjalizacja ClipInspector (z podglądem)...");

        // Clip state
        this.clipIndex = -1;
        this.clipUrl = '';
        this.originalClipUrl = '';
        this.leftAdjust = 0;
        this.rightAdjust = 0;

        // Preview state
        this.previewUpdateTimeout = null;
        this.currentPreviewUrl = null;
        this.isUpdatingPreview = false;
        this.visible = false;

        // Create UI
        this.createInspectorElement();
        this.attachEvents();

        console.log("ClipInspector zainicjalizowany pomyślnie z obsługą podglądu");
    }

    /**
     * Create inspector DOM element
     */
    createInspectorElement() {
        console.log("Tworzenie elementu inspektora...");

        // Remove any existing inspector
        const existingInspector = document.querySelector('.clip-inspector');
        if (existingInspector) {
            console.log("Inspektor już istnieje, usuwanie...");
            existingInspector.remove();
        }

        // Create inspector element
        this.element = createElement('div', { className: 'clip-inspector' }, `
      <div class="inspector-overlay"></div>
      <div class="inspector-container">
        <div class="inspector-header">
          <div class="inspector-title">Dostosowanie klipu</div>
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
              <div class="time-slider-label">Lewa strona (+ rozszerza, - przycina): <span class="left-adjust-value">0.0s</span></div>
              <input type="range" class="time-slider left-adjust" min="-10" max="10" step="0.5" value="0">
            </div>
            <div class="time-slider-container">
              <div class="time-slider-label">Prawa strona (+ rozszerza, - przycina): <span class="right-adjust-value">0.0s</span></div>
              <input type="range" class="time-slider right-adjust" min="-10" max="10" step="0.5" value="0">
            </div>
          </div>
          <div class="save-controls">
            <button class="toggle-save-btn">Zapisz klip</button>
            <div class="save-form">
              <input type="text" class="clip-name-input" placeholder="Wprowadź nazwę klipu">
              <button class="save-clip-btn">Zapisz</button>
            </div>
          </div>
          <button class="download-adjusted-clip-btn">Pobierz dostosowany klip</button>
        </div>
        <div class="inspector-status"></div>
      </div>
    `);

        document.body.appendChild(this.element);
        console.log("Element inspektora utworzony i dodany do dokumentu");

        // Store references to elements
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

    /**
     * Attach event handlers
     */
    attachEvents() {
        console.log("Dołączanie procedur obsługi zdarzeń (z podglądem)...");

        // Slider event handlers
        this.leftSlider.addEventListener('input', () => {
            this.handleSliderInput(this.leftSlider, 'leftAdjust', this.leftValue);
        });

        this.rightSlider.addEventListener('input', () => {
            this.handleSliderInput(this.rightSlider, 'rightAdjust', this.rightValue);
        });

        // Toggle save form button
        this.toggleSaveBtn.addEventListener('click', () => {
            console.log("Kliknięto przycisk Zapisz klip");
            this.saveForm.classList.toggle(CLASSES.VISIBLE);
            if (this.saveForm.classList.contains(CLASSES.VISIBLE)) {
                this.clipNameInput.focus();
            }
        });

        // Save clip button
        this.saveClipBtn.addEventListener('click', () => {
            console.log("Kliknięto przycisk zapisywania");
            this.saveClip();
        });

        // Download button
        this.downloadBtn.addEventListener('click', () => {
            console.log("Kliknięto przycisk pobierania");
            this.downloadAdjustedClip();
        });

        // Close button
        this.closeBtn.addEventListener('click', () => {
            console.log("Kliknięto przycisk zamknięcia");
            this.hide();
        });

        // Close on overlay click
        this.element.querySelector('.inspector-overlay').addEventListener('click', () => {
            console.log("Kliknięto overlay");
            this.hide();
        });

        // Enter key in clip name input
        this.clipNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log("Naciśnięto Enter w polu nazwy klipu");
                this.saveClip();
            }
        });

        console.log("Procedury obsługi zdarzeń (z podglądem) dodane pomyślnie");
    }

    /**
     * Handle slider input
     * @param {HTMLInputElement} slider - Slider element
     * @param {string} valueProp - Property name to update
     * @param {HTMLElement} labelEl - Label element to update
     */
    handleSliderInput(slider, valueProp, labelEl) {
        this[valueProp] = parseFloat(slider.value);
        labelEl.textContent = `${this[valueProp].toFixed(1)}s`;
        this.requestPreviewUpdate();
    }

    /**
     * Show the inspector for a clip
     * @param {number} clipIndex - Index of the clip
     * @param {string} clipUrl - URL of the clip
     */
    show(clipIndex, clipUrl) {
        console.log(`Otwieranie inspektora dla klipu ${clipIndex}, URL: ${clipUrl.substring(0, 50)}`);
        this.clipIndex = clipIndex;
        this.originalClipUrl = clipUrl;

        // Reset preview state
        this.clearPreviewState();

        // Set initial video source
        this.video.src = this.originalClipUrl;
        this.clipUrl = this.originalClipUrl;

        // Reset sliders
        this.resetSliders();

        // Hide save form
        this.saveForm.classList.remove(CLASSES.VISIBLE);
        this.clipNameInput.value = '';

        // Show inspector
        this.element.classList.add(CLASSES.VISIBLE);
        this.visible = true;

        // Hide search container
        this.hideSearchContainer();

        // Play video when ready
        this.setupPlayOnLoad();

        this.updateStatus(`Klip ${clipIndex + 1} załadowany. Dostosuj używając suwaków.`);
    }

    /**
     * Clear preview state
     */
    clearPreviewState() {
        clearTimeout(this.previewUpdateTimeout);
        if (this.currentPreviewUrl) {
            URL.revokeObjectURL(this.currentPreviewUrl);
            this.currentPreviewUrl = null;
        }
        this.isUpdatingPreview = false;
    }

    /**
     * Reset sliders to default values
     */
    resetSliders() {
        this.leftAdjust = 0;
        this.rightAdjust = 0;
        this.leftSlider.value = 0;
        this.rightSlider.value = 0;
        this.leftValue.textContent = '0.0s';
        this.rightValue.textContent = '0.0s';
    }

    /**
     * Hide the search container
     */
    hideSearchContainer() {
        const searchContainer = document.querySelector(SELECTORS.SEARCH_CONTAINER);
        if (searchContainer) {
            searchContainer.classList.add(CLASSES.HIDDEN);
        }
    }

    /**
     * Set up play on load logic
     */
    setupPlayOnLoad() {
        // Remove previous listener if exists
        if (this.playVideoOnCanplay) {
            this.video.removeEventListener('canplay', this.playVideoOnCanplay);
        }

        this.playVideoOnCanplay = () => {
            console.log("Wideo (oryginalne) gotowe do odtwarzania");
            this.video.play().catch(err => {
                console.warn("Nie można odtworzyć wideo automatycznie:", err);
            });
        };

        this.video.addEventListener('canplay', this.playVideoOnCanplay, { once: true });
    }

    /**
     * Hide the inspector
     */
    hide() {
        console.log("Zamykanie inspektora");
        this.video.pause();
        this.clearPreviewState();

        this.element.classList.remove(CLASSES.VISIBLE);
        this.visible = false;

        // Show search container
        const searchContainer = document.querySelector(SELECTORS.SEARCH_CONTAINER);
        if (searchContainer) {
            searchContainer.classList.remove(CLASSES.HIDDEN);
        }
    }

    /**
     * Update status message
     * @param {string} message - Message to display
     */
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

    /**
     * Request a preview update with debounce
     */
    requestPreviewUpdate() {
        if (this.previewUpdateTimeout) {
            clearTimeout(this.previewUpdateTimeout);
        }
        this.previewUpdateTimeout = setTimeout(() => {
            this.updatePreview();
        }, 1000);
    }

    /**
     * Update the preview with current adjustments
     */
    async updatePreview() {
        if (this.isUpdatingPreview) {
            console.log("Aktualizacja podglądu już w toku, pomijanie.");
            return;
        }

        // If no adjustments, restore original clip
        if (this.leftAdjust === 0 && this.rightAdjust === 0) {
            if (this.video.src !== this.originalClipUrl) {
                console.log("Brak dostosowań, przywracanie oryginalnego klipu w podglądzie.");
                this.revertToOriginalPreview();
            } else {
                console.log("Brak dostosowań, oryginał już wyświetlany.");
            }
            return;
        }

        this.isUpdatingPreview = true;
        this.updateStatus('Aktualizowanie podglądu...');
        console.log(`Rozpoczynanie aktualizacji podglądu dla L:${this.leftAdjust}, P:${this.rightAdjust}`);

        try {
            const clipIndexForApi = parseInt(this.clipIndex) + 1;
            const previewBlob = await adjustVideo(clipIndexForApi, this.leftAdjust, this.rightAdjust);

            if (!previewBlob || previewBlob.size === 0) {
                throw new Error("API /d zwróciło pusty blob dla podglądu.");
            }

            console.log("Otrzymano blob podglądu, rozmiar:", previewBlob.size);

            // Release previous preview URL
            if (this.currentPreviewUrl) {
                console.log("Zwalnianie poprzedniego URL podglądu:", this.currentPreviewUrl.substring(0, 50));
                URL.revokeObjectURL(this.currentPreviewUrl);
            }

            // Create new URL
            this.currentPreviewUrl = URL.createObjectURL(previewBlob);
            console.log("Utworzono nowy URL podglądu:", this.currentPreviewUrl.substring(0, 50));

            const currentTime = this.video.currentTime;
            const isPaused = this.video.paused;

            this.video.src = this.currentPreviewUrl;
            this.clipUrl = this.currentPreviewUrl;
            this.video.load();

            // Set up loadeddata handler
            this.video.addEventListener('loadeddata', () => {
                console.log("Nowe dane wideo załadowane, przywracanie czasu:", currentTime);
                setTimeout(() => {
                    this.video.currentTime = currentTime;
                    if (!isPaused) {
                        this.video.play().catch(e => console.warn("Autoodtwarzanie po aktualizacji podglądu nie powiodło się:", e));
                    }
                }, 50);
                this.updateStatus('Podgląd zaktualizowany.');
                this.isUpdatingPreview = false;
            }, { once: true });

            this.video.addEventListener('error', (e) => {
                console.error("Błąd ładowania nowego źródła wideo podglądu:", e);
                this.updateStatus('Błąd ładowania podglądu.');
                this.revertToOriginalPreview();
                this.isUpdatingPreview = false;
            }, { once: true });

        } catch (error) {
            console.error('Błąd podczas aktualizacji podglądu:', error);
            this.updateStatus(`Błąd aktualizacji podglądu: ${error.message}`);
            this.isUpdatingPreview = false;
        }
    }

    /**
     * Revert to original video preview
     */
    revertToOriginalPreview() {
        console.log("Przywracanie oryginalnego URL w podglądzie:", this.originalClipUrl.substring(0, 50));

        // Release current preview URL if it exists and is different from original
        if (this.currentPreviewUrl && this.currentPreviewUrl !== this.originalClipUrl) {
            URL.revokeObjectURL(this.currentPreviewUrl);
            this.currentPreviewUrl = null;
        }

        // Set source back to original if different
        if (this.video.src !== this.originalClipUrl) {
            const currentTime = this.video.currentTime;
            const isPaused = this.video.paused;

            this.video.src = this.originalClipUrl;
            this.clipUrl = this.originalClipUrl;
            this.video.load();

            this.video.addEventListener('loadeddata', () => {
                console.log("Oryginalne dane wideo załadowane, przywracanie czasu:", currentTime);
                setTimeout(() => {
                    this.video.currentTime = currentTime;
                    if (!isPaused) {
                        this.video.play().catch(e => console.warn("Autoodtwarzanie po przywróceniu oryginału nie powiodło się:", e));
                    }
                }, 50);
                this.updateStatus('Przywrócono oryginalny klip.');
            }, { once: true });

            this.video.addEventListener('error', (e) => {
                console.error("Błąd ładowania oryginalnego źródła wideo:", e);
                this.updateStatus('Błąd ładowania oryginalnego klipu.');
            }, { once: true });
        } else {
            this.updateStatus('Oryginalny klip jest już wyświetlany.');
        }
    }

    /**
     * Save the current clip
     */
    async saveClip() {
        const clipName = this.clipNameInput.value.trim();
        if (!clipName) {
            this.updateStatus(MESSAGES.CLIP_NAME_REQUIRED);
            return;
        }

        this.updateStatus('Przygotowywanie do zapisu...');

        try {
            // Ensure server has latest version if adjustments were made
            await this.adjustClip();

            // Call save API
            this.updateStatus('Zapisywanie klipu na serwerze...');
            const response = await apiSaveClip(clipName);
            console.log('Odpowiedź z API zapisu (/z):', response);

            // Check save API response
            if (response && response.status === 'success') {
                this.updateStatus(`Klip "${clipName}" został zapisany pomyślnie!`);
                this.saveForm.classList.remove(CLASSES.VISIBLE);
                this.clipNameInput.value = '';
            } else {
                // Better error handling from API
                const errorMessage = response?.message || 'Nieznany błąd zapisu.';
                throw new Error(`Zapis nie powiódł się: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Błąd podczas zapisywania klipu:', error);
            this.updateStatus(`Błąd zapisu: ${error.message}`);
        }
    }

    /**
     * Adjust the clip based on slider values
     * @returns {Promise<Blob|null>} Adjusted blob or null if no adjustments
     */
    async adjustClip() {
        try {
            if (this.leftAdjust === 0 && this.rightAdjust === 0) {
                console.log("Brak dostosowań, nie ma potrzeby wywoływania /d");
                return null;
            }

            const adjustedClipIndex = parseInt(this.clipIndex) + 1;
            const params = [
                adjustedClipIndex.toString(),
                this.leftAdjust.toString(),
                this.rightAdjust.toString()
            ];

            console.log(`Wywołanie /d z parametrami:`, params);
            const adjustedBlob = await adjustVideo(adjustedClipIndex, this.leftAdjust, this.rightAdjust);

            if (!adjustedBlob || adjustedBlob.size === 0) {
                throw new Error("API /d zwróciło pusty blob podczas dostosowywania.")
            }

            console.log("Otrzymano dostosowany blob z /d (w adjustClip), rozmiar:", adjustedBlob.size);
            return adjustedBlob;
        } catch (error) {
            console.error('Błąd podczas dostosowywania klipu przez /d:', error);
            throw error;
        }
    }

    /**
     * Download the adjusted clip
     */
    async downloadAdjustedClip() {
        let blobToDownload;
        let fileName;
        const clipId = parseInt(this.clipIndex) + 1;

        try {
            if (this.leftAdjust === 0 && this.rightAdjust === 0) {
                // Download original clip
                this.updateStatus('Pobieranie oryginalnego klipu...');
                console.log("Pobieranie oryginalnego klipu przez /w, index:", clipId);
                blobToDownload = await getVideo(clipId);
                fileName = `klip_${clipId}${FILE_EXTENSIONS.VIDEO}`;
            } else {
                // Download adjusted clip
                this.updateStatus('Dostosowywanie klipu do pobrania...');
                blobToDownload = await this.adjustClip();
                if (!blobToDownload) throw new Error("Nie udało się uzyskać dostosowanego klipu.");

                this.updateStatus('Przygotowywanie dostosowanego klipu do pobrania...');

                // Format filename with adjustment values
                const formatAdjust = (val) => val >= 0 ? `+${val.toFixed(1)}` : `${val.toFixed(1)}`;
                fileName = `klip_${clipId}_L${formatAdjust(this.leftAdjust)}_P${formatAdjust(this.rightAdjust)}${FILE_EXTENSIONS.VIDEO}`;
            }

            if (!blobToDownload || blobToDownload.size === 0) {
                throw new Error("Otrzymano pusty blob do pobrania.");
            }

            console.log(`Przygotowywanie do pobrania bloba: ${fileName}, rozmiar: ${blobToDownload.size}`);

            // Download the blob
            downloadBlob(blobToDownload, fileName);
            this.updateStatus('Klip został przygotowany do pobrania!');

        } catch (error) {
            console.error('Błąd podczas pobierania klipu:', error);
            this.updateStatus(`Błąd pobierania: ${error.message}`);
        }
    }
}