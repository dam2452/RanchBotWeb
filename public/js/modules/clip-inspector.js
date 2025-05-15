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
        console.log("Inicjalizacja ClipInspector (transformacja w miejscu)...");
        this.#createBackdrop();
        this.#setupResizeObserver();
        console.log("Inicjalizacja ClipInspector zakończona pomyślnie");
    }

    get visible() {
        return this.#visible;
    }

    setReelNavigator(reelNavigator) {
        this.#reelNavigatorInstance = reelNavigator;
    }

    #createBackdrop() {
        // Tworzenie przyciemnionego tła, które blokuje interakcje
        this.#backdrop = createElement('div', {
            className: 'clip-editor-backdrop'
        });

        // Dodaj obsługę kliknięcia na tło, aby zamknąć edytor
        this.#backdrop.addEventListener('click', (e) => {
            // Prevent clicks on the backdrop from closing if they're actually on the controls
            if (e.target === this.#backdrop) {
                this.hide();
            }
        });

        document.body.appendChild(this.#backdrop);
    }

    #setupResizeObserver() {
        // Create a resize observer to ensure controls remain visible when window is resized
        this.#resizeObserver = new ResizeObserver(entries => {
            if (this.#visible && this.#targetClipElement) {
                // Ensure the clip is fully visible within the viewport
                this.#ensureVisibility();
            }
        });
    }

    #ensureVisibility() {
        if (!this.#targetClipElement) return;

        // Make sure the editing clip and its controls are visible in the viewport
        const rect = this.#targetClipElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // If the clip extends beyond the bottom of the viewport, scroll it into view
        if (rect.bottom > windowHeight) {
            const scrollAdjustment = rect.bottom - windowHeight + 20; // add padding
            window.scrollBy({
                top: scrollAdjustment,
                behavior: 'smooth'
            });
        }

        // If the controls container exists, ensure it's visible
        if (this.#controlsContainer) {
            // Force display to ensure visibility
            this.#controlsContainer.style.display = 'block';
            this.#controlsContainer.style.opacity = '1';
        }
    }

    show(clipIndex, clipUrl, clipElement) {
        console.log(`Otwieranie edytora dla klipu ${clipIndex}, URL: ${clipUrl.substring(0, 50)}`);
        this.#clipIndex = clipIndex;
        this.#originalClipUrl = clipUrl;
        this.#targetClipElement = clipElement;

        // Dodawanie klasy do klipu, aby go powiększyć
        this.#targetClipElement.classList.add('editing-mode');

        // Znajdź wideo element
        this.#video = this.#targetClipElement.querySelector('video');
        if (this.#video) {
            this.#clipUrl = this.#video.src;
            // Zapewniamy, że wideo jest odtwarzane
            this.#video.play().catch(err => {
                console.warn("Nie można automatycznie odtworzyć wideo:", err);
            });
        }

        // Jeśli już istnieje kontener kontrolek, usuń go
        if (this.#controlsContainer) {
            if (this.#targetClipElement.contains(this.#controlsContainer)) {
                this.#targetClipElement.removeChild(this.#controlsContainer);
            }
            this.#controlsContainer = null;
        }

        // Dodaj kontrolki edycji do klipu
        this.#createControlsContainer();
        this.#targetClipElement.appendChild(this.#controlsContainer);

        // Start observing for resize events
        this.#resizeObserver.observe(document.body);

        // Pokaż przyciemnione tło, które blokuje interakcje
        this.#backdrop.classList.add('visible');

        // Jeśli mamy referencję do ReelNavigator
        if (this.#reelNavigatorInstance) {
            // Wyłączamy nawigację, aby nie kolidowała z edycją
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
        this.updateStatus(`Klip ${clipIndex + 1} załadowany. Dostosuj za pomocą suwaków.`);

        // Ensure the clip and controls are visible
        setTimeout(() => this.#ensureVisibility(), 100);
    }

    #createControlsContainer() {
        // Utwórz kontener kontrolek
        this.#controlsContainer = createElement('div', {
            className: 'clip-controls-container'
        });

        // Dodaj nagłówek z przyciskiem zamknięcia
        const header = createElement('div', {
            className: 'clip-editor-header'
        });

        const title = createElement('div', {
            className: 'clip-editor-title'
        }, 'Dostosowanie klipu');

        this.#closeBtn = createElement('button', {
            className: 'close-editor-btn'
        }, '×');

        header.appendChild(title);
        header.appendChild(this.#closeBtn);
        this.#controlsContainer.appendChild(header);

        // Dodaj kontrolki dostosowania
        const adjustmentControls = createElement('div', {
            className: 'adjustment-controls'
        });

        // Lewy suwak
        const leftSliderContainer = createElement('div', {
            className: 'time-slider-container'
        });

        const leftLabel = createElement('div', {
            className: 'time-slider-label'
        }, 'Lewa strona (+ rozszerz, - przytnij): ');

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

        // Prawy suwak
        const rightSliderContainer = createElement('div', {
            className: 'time-slider-container'
        });

        const rightLabel = createElement('div', {
            className: 'time-slider-label'
        }, 'Prawa strona (+ rozszerz, - przytnij): ');

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

        // Dodaj kontrolki zapisywania
        const saveControls = createElement('div', {
            className: 'save-controls'
        });

        this.#toggleSaveBtn = createElement('button', {
            className: 'toggle-save-btn'
        }, 'Zapisz klip');

        this.#saveForm = createElement('div', {
            className: 'save-form'
        });

        this.#clipNameInput = createElement('input', {
            type: 'text',
            className: 'clip-name-input',
            placeholder: 'Podaj nazwę klipu'
        });

        this.#saveClipBtn = createElement('button', {
            className: 'save-clip-btn'
        }, 'Zapisz');

        this.#saveForm.appendChild(this.#clipNameInput);
        this.#saveForm.appendChild(this.#saveClipBtn);

        saveControls.appendChild(this.#toggleSaveBtn);
        saveControls.appendChild(this.#saveForm);
        this.#controlsContainer.appendChild(saveControls);

        // Dodaj przycisk pobierania
        this.#downloadBtn = createElement('button', {
            className: 'download-adjusted-clip-btn'
        }, 'Pobierz dostosowany klip');

        this.#controlsContainer.appendChild(this.#downloadBtn);

        // Dodaj element statusu
        this.#statusEl = createElement('div', {
            className: 'clip-editor-status'
        });

        this.#controlsContainer.appendChild(this.#statusEl);

        // Dodaj nasłuchiwanie zdarzeń
        this.attachEvents();

        // Force initial visibility
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
                console.log("Przycisk zapisu klipu naciśnięty");
                this.#saveForm.classList.toggle(CLASSES.VISIBLE);
                if (this.#saveForm.classList.contains(CLASSES.VISIBLE)) {
                    this.#clipNameInput.focus();
                }
            });
        }

        if (this.#saveClipBtn) {
            this.#saveClipBtn.addEventListener('click', () => {
                console.log("Przycisk zapisu naciśnięty");
                this.saveClip();
            });
        }

        if (this.#downloadBtn) {
            this.#downloadBtn.addEventListener('click', () => {
                console.log("Przycisk pobierania naciśnięty");
                this.downloadAdjustedClip();
            });
        }

        if (this.#closeBtn) {
            this.#closeBtn.addEventListener('click', () => {
                console.log("Przycisk zamknięcia naciśnięty");
                this.hide();
            });
        }

        if (this.#clipNameInput) {
            this.#clipNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log("Naciśnięto Enter w polu nazwy klipu");
                    this.saveClip();
                }
            });
        }

        // Dodaj obsługę klawisza Escape do zamknięcia
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
        console.log("Zamykanie edytora klipu");

        // Stop observing resize events
        this.#resizeObserver.disconnect();

        if (this.#video) {
            // Pozostawiamy odtwarzanie wideo, ponieważ to będzie znów normalny klip
        }

        this.clearPreviewState();

        // Ukryj backdrop
        this.#backdrop.classList.remove('visible');

        // Usuń tryb edycji
        if (this.#targetClipElement) {
            this.#targetClipElement.classList.remove('editing-mode');

            // Usuń kontener kontrolek, jeśli istnieje
            if (this.#controlsContainer && this.#targetClipElement.contains(this.#controlsContainer)) {
                this.#targetClipElement.removeChild(this.#controlsContainer);
            }
        }

        // Jeśli mamy referencję do ReelNavigator
        if (this.#reelNavigatorInstance) {
            // Włączamy z powrotem nawigację
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
            console.log("Aktualizacja podglądu już w toku lub brak wideo, pomijanie.");
            return;
        }

        if (this.#leftAdjust === 0 && this.#rightAdjust === 0) {
            if (this.#video.src !== this.#originalClipUrl) {
                console.log("Brak dostosowań, przywracanie oryginalnego klipu w podglądzie.");
                this.revertToOriginalPreview();
            } else {
                console.log("Brak dostosowań, oryginał już wyświetlony.");
            }
            return;
        }

        this.#isUpdatingPreview = true;
        this.updateStatus('Aktualizacja podglądu...');
        console.log(`Rozpoczynanie aktualizacji podglądu dla L:${this.#leftAdjust}, R:${this.#rightAdjust}`);

        try {
            const clipIndexForApi = parseInt(this.#clipIndex) + 1;
            const previewBlob = await adjustVideo(clipIndexForApi, this.#leftAdjust, this.#rightAdjust);

            if (!previewBlob || previewBlob.size === 0) {
                throw new Error("API /d zwróciło pusty blob dla podglądu.");
            }

            console.log("Otrzymano blob podglądu, rozmiar:", previewBlob.size);

            if (this.#currentPreviewUrl) {
                console.log("Zwalnianie poprzedniego URL podglądu:", this.#currentPreviewUrl.substring(0, 50));
                URL.revokeObjectURL(this.#currentPreviewUrl);
            }

            this.#currentPreviewUrl = URL.createObjectURL(previewBlob);
            console.log("Utworzono nowy URL podglądu:", this.#currentPreviewUrl.substring(0, 50));

            const currentTime = this.#video.currentTime;
            const isPaused = this.#video.paused;

            this.#video.src = this.#currentPreviewUrl;
            this.#clipUrl = this.#currentPreviewUrl;
            this.#video.load();

            this.#video.addEventListener('loadeddata', () => {
                console.log("Nowe dane wideo załadowane, przywracanie czasu:", currentTime);
                setTimeout(() => {
                    this.#video.currentTime = currentTime;
                    if (!isPaused) {
                        this.#video.play().catch(e => console.warn("Automatyczne odtwarzanie nie powiodło się po aktualizacji podglądu:", e));
                    }
                }, 50);
                this.updateStatus('Podgląd zaktualizowany.');
                this.#isUpdatingPreview = false;

                // Ensure controls remain visible after video update
                this.#ensureVisibility();
            }, { once: true });

            this.#video.addEventListener('error', (e) => {
                console.error("Błąd ładowania nowego źródła wideo podglądu:", e);
                this.updateStatus('Błąd ładowania podglądu.');
                this.revertToOriginalPreview();
                this.#isUpdatingPreview = false;
            }, { once: true });

        } catch (error) {
            console.error('Błąd podczas aktualizacji podglądu:', error);
            this.updateStatus(`Błąd aktualizacji podglądu: ${error.message}`);
            this.#isUpdatingPreview = false;
        }
    }

    revertToOriginalPreview() {
        if (!this.#video) return;

        console.log("Przywracanie oryginalnego URL podglądu:", this.#originalClipUrl.substring(0, 50));

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
                console.log("Oryginalne dane wideo załadowane, przywracanie czasu:", currentTime);
                setTimeout(() => {
                    this.#video.currentTime = currentTime;
                    if (!isPaused) {
                        this.#video.play().catch(e => console.warn("Automatyczne odtwarzanie nie powiodło się po przywróceniu oryginału:", e));
                    }
                }, 50);
                this.updateStatus('Oryginalny klip przywrócony.');

                // Ensure controls remain visible after video reset
                this.#ensureVisibility();
            }, { once: true });

            this.#video.addEventListener('error', (e) => {
                console.error("Błąd ładowania oryginalnego źródła wideo:", e);
                this.updateStatus('Błąd ładowania oryginalnego klipu.');
            }, { once: true });
        } else {
            this.updateStatus('Oryginalny klip już wyświetlony.');
        }
    }

    async saveClip() {
        if (!this.#clipNameInput) return;

        const clipName = this.#clipNameInput.value.trim();
        if (!clipName) {
            this.updateStatus(MESSAGES.CLIP_NAME_REQUIRED);
            return;
        }

        this.updateStatus('Przygotowanie do zapisania...');

        try {
            await this.adjustClip();

            this.updateStatus('Zapisywanie klipu na serwerze...');
            const response = await apiSaveClip(clipName);
            console.log('Odpowiedź API zapisu (/z):', response);

            if (response && response.status === 'success') {
                this.updateStatus(`Klip "${clipName}" zapisany pomyślnie!`);
                if (this.#saveForm) {
                    this.#saveForm.classList.remove(CLASSES.VISIBLE);
                }
                this.#clipNameInput.value = '';
            } else {
                const errorMessage = response?.message || 'Nieznany błąd zapisu.';
                throw new Error(`Zapis nie powiódł się: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Błąd podczas zapisywania klipu:', error);
            this.updateStatus(`Błąd zapisu: ${error.message}`);
        }
    }

    async adjustClip() {
        try {
            if (this.#leftAdjust === 0 && this.#rightAdjust === 0) {
                console.log("Brak dostosowań, nie ma potrzeby wywoływania /d");
                return null;
            }

            const adjustedClipIndex = parseInt(this.#clipIndex) + 1;
            const params = [
                adjustedClipIndex.toString(),
                this.#leftAdjust.toString(),
                this.#rightAdjust.toString()
            ];

            console.log(`Wywołanie /d z parametrami:`, params);
            const adjustedBlob = await adjustVideo(adjustedClipIndex, this.#leftAdjust, this.#rightAdjust);

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

    async downloadAdjustedClip() {
        let blobToDownload;
        let fileName;
        const clipId = parseInt(this.#clipIndex) + 1;

        try {
            if (this.#leftAdjust === 0 && this.#rightAdjust === 0) {
                this.updateStatus('Pobieranie oryginalnego klipu...');
                console.log("Pobieranie oryginalnego klipu przez /w, indeks:", clipId);
                blobToDownload = await getVideo(clipId);
                fileName = `clip_${clipId}${FILE_EXTENSIONS.VIDEO}`;
            } else {
                this.updateStatus('Dostosowywanie klipu do pobrania...');
                blobToDownload = await this.adjustClip();
                if (!blobToDownload) throw new Error("Nie można uzyskać dostosowanego klipu.");

                this.updateStatus('Przygotowanie dostosowanego klipu do pobrania...');

                const formatAdjust = (val) => val >= 0 ? `+${val.toFixed(1)}` : `${val.toFixed(1)}`;
                fileName = `clip_${clipId}_L${formatAdjust(this.#leftAdjust)}_R${formatAdjust(this.#rightAdjust)}${FILE_EXTENSIONS.VIDEO}`;
            }

            if (!blobToDownload || blobToDownload.size === 0) {
                throw new Error("Otrzymano pusty blob do pobrania.");
            }

            console.log(`Przygotowanie do pobrania bloba: ${fileName}, rozmiar: ${blobToDownload.size}`);

            downloadBlob(blobToDownload, fileName);
            this.updateStatus('Klip gotowy do pobrania!');

        } catch (error) {
            console.error('Błąd podczas pobierania klipu:', error);
            this.updateStatus(`Błąd pobierania: ${error.message}`);
        }
    }
}