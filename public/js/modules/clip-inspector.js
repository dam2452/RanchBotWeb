// Poprawiony clip-inspector.js zgodny z oryginalnym API, z podglądem na żywo
import { callApi, callApiForBlob } from '../modules/api-client.js';

export class ClipInspector {
    constructor() {
        console.log("Inicjalizacja ClipInspector (z podglądem)...");
        this.clipIndex = -1;
        this.clipUrl = '';      // Może być original lub preview URL
        this.originalClipUrl = ''; // URL oryginalnego klipu (zawsze ten sam)
        this.leftAdjust = 0;
        this.rightAdjust = 0;

        // Stan podglądu na żywo
        this.previewUpdateTimeout = null; // ID dla setTimeout debounce
        this.currentPreviewUrl = null;    // URL aktualnego bloba podglądu (do zwolnienia)
        this.isUpdatingPreview = false;   // Flaga zapobiegająca wielokrotnym aktualizacjom

        this.visible = false;

        this.createInspectorElement();
        this.attachEvents(); // Dołączanie zdarzeń przeniesione po utworzeniu elementów

        console.log("ClipInspector zainicjalizowany pomyślnie z obsługą podglądu");
    }

    createInspectorElement() {
        console.log("Tworzenie elementu inspektora...");
        const existingInspector = document.querySelector('.clip-inspector');
        if (existingInspector) {
            console.log("Inspektor już istnieje, usuwanie...");
            existingInspector.remove();
        }

        this.element = document.createElement('div');
        this.element.className = 'clip-inspector';
        this.element.innerHTML = `
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
        `;
        document.body.appendChild(this.element);
        console.log("Element inspektora utworzony i dodany do dokumentu");

        // Referencje do elementów
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
        console.log("Dołączanie procedur obsługi zdarzeń (z podglądem)...");

        // Funkcja pomocnicza do obsługi inputu suwaka
        const handleSliderInput = (slider, valueProp, labelEl) => {
            this[valueProp] = parseFloat(slider.value);
            labelEl.textContent = `${this[valueProp].toFixed(1)}s`;
            this.requestPreviewUpdate(); // Zaplanuj aktualizację podglądu
        };

        // Obsługa lewego suwaka
        this.leftSlider.addEventListener('input', () => {
            handleSliderInput(this.leftSlider, 'leftAdjust', this.leftValue);
        });

        // Obsługa prawego suwaka
        this.rightSlider.addEventListener('input', () => {
            handleSliderInput(this.rightSlider, 'rightAdjust', this.rightValue);
        });

        // Przełącznik formularza zapisu
        this.toggleSaveBtn.addEventListener('click', () => {
            console.log("Kliknięto przycisk Zapisz klip");
            this.saveForm.classList.toggle('visible');
            if (this.saveForm.classList.contains('visible')) {
                this.clipNameInput.focus();
            }
        });

        // Przycisk zapisu klipu
        this.saveClipBtn.addEventListener('click', () => {
            console.log("Kliknięto przycisk zapisywania");
            this.saveClip();
        });

        // Przycisk pobierania
        this.downloadBtn.addEventListener('click', () => {
            console.log("Kliknięto przycisk pobierania");
            this.downloadAdjustedClip();
        });

        // Przycisk zamknięcia
        this.closeBtn.addEventListener('click', () => {
            console.log("Kliknięto przycisk zamknięcia");
            this.hide();
        });

        // Zamknięcie inspektora klikając w overlay
        this.element.querySelector('.inspector-overlay').addEventListener('click', () => {
            console.log("Kliknięto overlay");
            this.hide();
        });

        // Obsługa klawisza Enter w polu nazwy klipu
        this.clipNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log("Naciśnięto Enter w polu nazwy klipu");
                this.saveClip();
            }
        });

        console.log("Procedury obsługi zdarzeń (z podglądem) dodane pomyślnie");
    }

    show(clipIndex, clipUrl) {
        console.log(`Otwieranie inspektora dla klipu ${clipIndex}, URL: ${clipUrl.substring(0, 50)}`);
        this.clipIndex = clipIndex;
        this.originalClipUrl = clipUrl; // Zapisz oryginalny URL

        // Resetuj stan podglądu
        clearTimeout(this.previewUpdateTimeout);
        if (this.currentPreviewUrl) {
            URL.revokeObjectURL(this.currentPreviewUrl);
            this.currentPreviewUrl = null;
        }
        this.isUpdatingPreview = false;

        // Ustaw początkowe źródło wideo na oryginał
        this.video.src = this.originalClipUrl;
        this.clipUrl = this.originalClipUrl; // clipUrl wskazuje na aktualnie wyświetlane źródło

        // Reset ustawień suwaków
        this.leftAdjust = 0;
        this.rightAdjust = 0;
        this.leftSlider.value = 0;
        this.rightSlider.value = 0;
        this.leftValue.textContent = '0.0s';
        this.rightValue.textContent = '0.0s';

        // Ukrycie formularza zapisu
        this.saveForm.classList.remove('visible');
        this.clipNameInput.value = '';

        // Pokazanie inspektora
        this.element.classList.add('visible');
        this.visible = true;

        // Ukrycie paska wyszukiwania
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.classList.add('hidden');
        }

        // Odtworzenie wideo (z listenerem 'canplay')
        // Usuń stary listener, jeśli istnieje, aby uniknąć wielokrotnego dodawania
        if (this.playVideoOnCanplay) {
            this.video.removeEventListener('canplay', this.playVideoOnCanplay);
        }
        this.playVideoOnCanplay = () => { // Zapisz funkcję, aby móc ją usunąć
            console.log("Wideo (oryginalne) gotowe do odtwarzania");
            this.video.play().catch(err => {
                console.warn("Nie można odtworzyć wideo automatycznie:", err);
            });
        };
        this.video.addEventListener('canplay', this.playVideoOnCanplay, { once: true });


        this.updateStatus(`Klip ${clipIndex + 1} załadowany. Dostosuj używając suwaków.`);
    }

    hide() {
        console.log("Zamykanie inspektora");
        this.video.pause();
        clearTimeout(this.previewUpdateTimeout);
        this.isUpdatingPreview = false;

        // Zwolnij URL bloba podglądu, jeśli istnieje
        if (this.currentPreviewUrl) {
            console.log("Zwalnianie URL podglądu przy zamykaniu:", this.currentPreviewUrl.substring(0, 50));
            URL.revokeObjectURL(this.currentPreviewUrl);
            this.currentPreviewUrl = null;
        }

        this.element.classList.remove('visible');
        this.visible = false;

        // Pokazanie paska wyszukiwania
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.classList.remove('hidden');
        }
        // Opcjonalnie: wyczyść src wideo
        // this.video.src = '';
        // this.video.load();
    }

    updateStatus(message) {
        if (this.statusEl) {
            console.log(`Status: ${message}`);
            this.statusEl.textContent = message;
            this.statusEl.classList.add('status-visible');

            if (this.statusTimer) clearTimeout(this.statusTimer);
            this.statusTimer = setTimeout(() => {
                this.statusEl.classList.remove('status-visible');
            }, 6000); // Ukryj status po 6 sekundach
        }
    }

    // --- Metody związane z podglądem na żywo ---

    requestPreviewUpdate() {
        if (this.previewUpdateTimeout) {
            clearTimeout(this.previewUpdateTimeout);
        }
        this.previewUpdateTimeout = setTimeout(() => {
            this.updatePreview();
        }, 1000); // Opóźnienie 1 sekunda
    }

    async updatePreview() {
        if (this.isUpdatingPreview) {
            console.log("Aktualizacja podglądu już w toku, pomijanie.");
            return;
        }

        // Jeśli nie ma żadnych dostosowań, przywróć oryginalny klip
        if (this.leftAdjust === 0 && this.rightAdjust === 0) {
            // Tylko jeśli aktualnie nie jest wyświetlany oryginał
            if(this.video.src !== this.originalClipUrl) {
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
            const params = [
                clipIndexForApi.toString(),
                this.leftAdjust.toString(),
                this.rightAdjust.toString() // Bez negacji dla prawej strony
            ];

            console.log("Wywołanie /d dla podglądu z parametrami:", params);
            const previewBlob = await callApiForBlob('d', params);

            if (!previewBlob || previewBlob.size === 0) {
                throw new Error("API /d zwróciło pusty blob dla podglądu.");
            }

            console.log("Otrzymano blob podglądu, rozmiar:", previewBlob.size);

            // Zwolnij poprzedni URL podglądu
            if (this.currentPreviewUrl) {
                console.log("Zwalnianie poprzedniego URL podglądu:", this.currentPreviewUrl.substring(0, 50));
                URL.revokeObjectURL(this.currentPreviewUrl);
            }

            // Utwórz nowy URL
            this.currentPreviewUrl = URL.createObjectURL(previewBlob);
            console.log("Utworzono nowy URL podglądu:", this.currentPreviewUrl.substring(0, 50));

            const currentTime = this.video.currentTime;
            const isPaused = this.video.paused;

            this.video.src = this.currentPreviewUrl;
            this.clipUrl = this.currentPreviewUrl; // Zaktualizuj clipUrl na nowy podgląd
            this.video.load();

            // Użyj 'loadeddata' aby upewnić się, że wideo jest gotowe
            this.video.addEventListener('loadeddata', () => {
                console.log("Nowe dane wideo załadowane, przywracanie czasu:", currentTime);
                // Czasami ustawienie currentTime od razu zawodzi, małe opóźnienie może pomóc
                setTimeout(() => {
                    this.video.currentTime = currentTime;
                    if (!isPaused) {
                        this.video.play().catch(e => console.warn("Autoodtwarzanie po aktualizacji podglądu nie powiodło się:", e));
                    }
                }, 50); // Małe opóźnienie
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
            // Można rozważyć przywrócenie oryginału
            // this.revertToOriginalPreview();
        }
    }

    revertToOriginalPreview() {
        console.log("Przywracanie oryginalnego URL w podglądzie:", this.originalClipUrl.substring(0,50));
        // Zwolnij bieżący URL podglądu, jeśli istnieje i jest inny niż oryginalny
        if (this.currentPreviewUrl && this.currentPreviewUrl !== this.originalClipUrl) {
            URL.revokeObjectURL(this.currentPreviewUrl);
            this.currentPreviewUrl = null;
        }
        // Ustaw źródło z powrotem na oryginalne, tylko jeśli jest inne
        if(this.video.src !== this.originalClipUrl){
            const currentTime = this.video.currentTime;
            const isPaused = this.video.paused;

            this.video.src = this.originalClipUrl;
            this.clipUrl = this.originalClipUrl; // Zaktualizuj clipUrl
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


    // --- Metody zapisu i pobierania ---

    async saveClip() {
        const clipName = this.clipNameInput.value.trim();
        if (!clipName) {
            this.updateStatus('Proszę wprowadzić nazwę klipu');
            // Używamy statusu zamiast alertu
            // alert('Proszę wprowadzić nazwę klipu');
            return;
        }

        this.updateStatus('Przygotowywanie do zapisu...');

        try {
            // Krok 1: Upewnij się, że serwer ma ostatnią wersję (wywołaj /d, jeśli były zmiany)
            // adjustClip wywoła /d tylko jeśli leftAdjust lub rightAdjust != 0
            // Wynik (blob) nie jest tu potrzebny, liczymy na stan serwera dla /z
            await this.adjustClip(); // Ta funkcja teraz zwraca blob lub null

            // Krok 2: Wywołaj API zapisu (/z)
            this.updateStatus('Zapisywanie klipu na serwerze...');
            const response = await callApi('z', [clipName]);
            console.log('Odpowiedź z API zapisu (/z):', response);

            // Sprawdzenie odpowiedzi API zapisu
            if (response && response.status === 'success') {
                this.updateStatus(`Klip "${clipName}" został zapisany pomyślnie!`);
                // alert(`Klip "${clipName}" został zapisany pomyślnie!`); // Zamiast alertu
                this.saveForm.classList.remove('visible');
                this.clipNameInput.value = '';
            } else {
                // Lepsza obsługa błędów z API
                const errorMessage = response?.message || 'Nieznany błąd zapisu.';
                throw new Error(`Zapis nie powiódł się: ${errorMessage}`);
            }

        } catch (error) {
            console.error('Błąd podczas zapisywania klipu:', error);
            this.updateStatus(`Błąd zapisu: ${error.message}`);
            // alert(`Błąd podczas zapisywania klipu: ${error.message}`); // Zamiast alertu
        }
    }

    // Ta funkcja jest teraz głównie używana przez saveClip i downloadAdjustedClip
    // aby uzyskać blob dostosowanego klipu LUB zasygnalizować brak dostosowań.
    async adjustClip() {
        try {
            if (this.leftAdjust === 0 && this.rightAdjust === 0) {
                console.log("Brak dostosowań, nie ma potrzeby wywoływania /d");
                return null; // Sygnalizuje brak dostosowania
            }

            const adjustedClipIndex = parseInt(this.clipIndex) + 1;
            const params = [
                adjustedClipIndex.toString(),
                this.leftAdjust.toString(),
                this.rightAdjust.toString() // Bez negacji dla prawej strony
            ];

            console.log(`Wywołanie /d z parametrami:`, params);
            // Nie aktualizujemy statusu tutaj, robią to funkcje nadrzędne

            const adjustedBlob = await callApiForBlob('d', params);

            if (!adjustedBlob || adjustedBlob.size === 0) {
                throw new Error("API /d zwróciło pusty blob podczas dostosowywania.")
            }
            console.log("Otrzymano dostosowany blob z /d (w adjustClip), rozmiar:", adjustedBlob.size);
            return adjustedBlob; // Zwróć pobrany blob

        } catch (error) {
            console.error('Błąd podczas dostosowywania klipu przez /d:', error);
            // Rzuć błąd dalej, aby funkcja nadrzędna go obsłużyła
            throw error;
        }
    }

    async downloadAdjustedClip() {
        let blobToDownload;
        let fileName;
        const clipId = parseInt(this.clipIndex) + 1;

        try {
            if (this.leftAdjust === 0 && this.rightAdjust === 0) {
                // Pobierz oryginalny klip
                this.updateStatus('Pobieranie oryginalnego klipu...');
                console.log("Pobieranie oryginalnego klipu przez /w, index:", clipId);
                blobToDownload = await callApiForBlob('w', [clipId.toString()]);
                fileName = `klip_${clipId}.mp4`;
            } else {
                // Dostosuj i pobierz dostosowany klip
                this.updateStatus('Dostosowywanie klipu do pobrania...');
                blobToDownload = await this.adjustClip(); // Pobierz dostosowany blob
                if (!blobToDownload) throw new Error("Nie udało się uzyskać dostosowanego klipu.");

                this.updateStatus('Przygotowywanie dostosowanego klipu do pobrania...');
                // Formatuj nazwę pliku z wartościami dostosowania
                const formatAdjust = (val) => val >= 0 ? `+${val.toFixed(1)}` : `${val.toFixed(1)}`;
                fileName = `klip_${clipId}_L${formatAdjust(this.leftAdjust)}_P${formatAdjust(this.rightAdjust)}.mp4`;
            }

            if (!blobToDownload || blobToDownload.size === 0) {
                throw new Error("Otrzymano pusty blob do pobrania.");
            }

            console.log(`Przygotowywanie do pobrania bloba: ${fileName}, rozmiar: ${blobToDownload.size}`);

            // Utwórz link do pobrania
            const url = URL.createObjectURL(blobToDownload);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();

            // Sprzątanie
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log("Link pobierania usunięty, URL odwołany.");
            }, 100);

            this.updateStatus('Klip został przygotowany do pobrania!');

        } catch (error) {
            console.error('Błąd podczas pobierania klipu:', error);
            this.updateStatus(`Błąd pobierania: ${error.message}`);
            // alert(`Błąd podczas pobierania: ${error.message}`); // Zamiast alertu
        }
    }
}