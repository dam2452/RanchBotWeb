// Poprawiony clip-inspector.js zgodny z oryginalnym API
import { callApi, callApiForBlob } from '../modules/api-client.js';

export class ClipInspector {
    constructor() {
        console.log("Inicjalizacja ClipInspector...");
        this.clipIndex = -1;
        this.clipUrl = '';
        this.leftAdjust = 0;
        this.rightAdjust = 0;
        this.originalClipUrl = ''; // URL oryginalnego klipu
        this.previewMode = false; // Czy jesteśmy w trybie podglądu
        this.createInspectorElement();
        this.attachEvents();
        this.visible = false;
        console.log("ClipInspector zainicjalizowany pomyślnie");
    }

    createInspectorElement() {
        console.log("Tworzenie elementu inspektora...");

        // Sprawdź, czy element już istnieje
        const existingInspector = document.querySelector('.clip-inspector');
        if (existingInspector) {
            console.log("Inspektor już istnieje, usuwanie...");
            existingInspector.remove();
        }

        // Tworzenie elementu inspektora
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
        console.log("Dołączanie procedur obsługi zdarzeń...");

        // Obsługa suwaków
        this.leftSlider.addEventListener('input', () => {
            this.leftAdjust = parseFloat(this.leftSlider.value);
            this.leftValue.textContent = `${this.leftAdjust.toFixed(1)}s`;
            this.previewMode = false; // Reset trybu podglądu po zmianie ustawień

            const leftAction = this.leftAdjust > 0 ? 'rozszerzone' : 'przycięte';
            const rightAction = this.rightAdjust > 0 ? 'rozszerzone' : 'przycięte';
            this.updateStatus(`Ustawienia: z lewej ${leftAction} o ${Math.abs(this.leftAdjust)}s, z prawej ${rightAction} o ${Math.abs(this.rightAdjust)}s`);
        });

        this.rightSlider.addEventListener('input', () => {
            this.rightAdjust = parseFloat(this.rightSlider.value);
            this.rightValue.textContent = `${this.rightAdjust.toFixed(1)}s`;
            this.previewMode = false; // Reset trybu podglądu po zmianie ustawień

            const leftAction = this.leftAdjust > 0 ? 'rozszerzone' : 'przycięte';
            const rightAction = this.rightAdjust > 0 ? 'rozszerzone' : 'przycięte';
            this.updateStatus(`Ustawienia: z lewej ${leftAction} o ${Math.abs(this.leftAdjust)}s, z prawej ${rightAction} o ${Math.abs(this.rightAdjust)}s`);
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

        console.log("Procedury obsługi zdarzeń dodane pomyślnie");
    }

    show(clipIndex, clipUrl) {
        console.log(`Otwieranie inspektora dla klipu o indeksie: ${clipIndex}, URL: ${clipUrl}`);
        this.clipIndex = clipIndex;
        this.clipUrl = clipUrl;
        this.originalClipUrl = clipUrl;
        this.video.src = clipUrl;
        this.previewMode = false;

        // Reset ustawień
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

        // Odtworzenie wideo
        this.video.addEventListener('canplay', () => {
            console.log("Wideo gotowe do odtwarzania");
            this.video.play().catch(err => {
                console.warn("Nie można odtworzyć wideo automatycznie:", err);
            });
        }, { once: true });

        this.updateStatus(`Klip ${clipIndex + 1} gotowy do dostosowania`);
    }

    hide() {
        console.log("Zamykanie inspektora");
        this.element.classList.remove('visible');
        this.visible = false;
        this.video.pause();

        // Pokazanie paska wyszukiwania
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.classList.remove('hidden');
        }
    }

    updateStatus(message) {
        if (this.statusEl) {
            console.log(`Status: ${message}`);
            this.statusEl.textContent = message;
            this.statusEl.classList.add('status-visible');

            // Ukryj status po 6 sekundach
            if (this.statusTimer) clearTimeout(this.statusTimer);
            this.statusTimer = setTimeout(() => {
                this.statusEl.classList.remove('status-visible');
            }, 6000);
        }
    }

    async saveClip() {
        const clipName = this.clipNameInput.value.trim();
        if (!clipName) {
            this.updateStatus('Proszę wprowadzić nazwę klipu');
            alert('Proszę wprowadzić nazwę klipu');
            return;
        }

        try {
            this.updateStatus('Dostosowywanie klipu...');

            // Najpierw dostosuj klip za pomocą endpointu /d
            await this.adjustClip();

            this.updateStatus('Zapisywanie klipu...');

            // Następnie zapisz klip z podaną nazwą używając endpointu /z
            const response = await callApi('z', [clipName]);

            console.log('Odpowiedź z API zapisu:', response);

            this.updateStatus(`Klip "${clipName}" został zapisany pomyślnie!`);
            alert(`Klip "${clipName}" został zapisany pomyślnie!`);
            this.saveForm.classList.remove('visible');
            this.clipNameInput.value = '';

        } catch (error) {
            console.error('Błąd podczas zapisywania klipu:', error);
            this.updateStatus('Błąd podczas zapisywania klipu');
            alert(`Błąd podczas zapisywania klipu: ${error.message}`);
        }
    }

    async adjustClip() {
        try {
            // Sprawdzenie, czy jakiekolwiek dostosowanie jest potrzebne
            if (this.leftAdjust === 0 && this.rightAdjust === 0) {
                console.log("Brak dostosowań, nie ma potrzeby wywoływania /d");
                // Zwracamy null, aby zasygnalizować, że nie wykonano wywołania API /d
                // Funkcja nadrzędna (downloadAdjustedClip) musi obsłużyć ten przypadek
                return null;
            }

            // Przygotowanie parametrów dla API /d
            const adjustedClipIndex = parseInt(this.clipIndex) + 1; // Indeks +1 dla API
            const params = [
                adjustedClipIndex.toString(), // Indeks klipu (zaczynając od 1)
                this.leftAdjust.toString(),   // Wartość dostosowania lewej strony (bez zmian)
                this.rightAdjust.toString()    // Wartość dostosowania prawej strony (bezpośrednio z suwaka, BEZ odwracania znaku)
            ];

            console.log(`Wywołanie /d z parametrami: index=${params[0]}, left_adjust=${params[1]}, right_adjust=${params[2]}`);
            this.updateStatus('Dostosowywanie klipu przez API /d...');

            // Wywołanie API /d i pobranie zmodyfikowanego bloba
            const adjustedBlob = await callApiForBlob('d', params);

            // Sprawdzenie, czy otrzymano blob
            if (!adjustedBlob || adjustedBlob.size === 0) {
                console.error("API /d zwróciło pusty lub nieprawidłowy blob.");
                throw new Error("Serwer nie zwrócił poprawnych danych klipu po dostosowaniu.");
            }

            console.log("Otrzymano dostosowany blob z /d, rozmiar:", adjustedBlob.size);
            this.updateStatus('Dostosowany klip otrzymany z API.');

            // Zwrócenie pobranego, zmodyfikowanego bloba
            return adjustedBlob;

        } catch (error) {
            console.error('Błąd podczas dostosowywania klipu przez /d:', error);
            // Przekazanie bardziej szczegółowego komunikatu o błędzie, jeśli jest dostępny
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.updateStatus(`Błąd podczas dostosowywania klipu: ${errorMessage}`);
            // Rzucenie błędu dalej, aby funkcja nadrzędna mogła go obsłużyć
            throw error;
        }
    }

    async downloadAdjustedClip() {
        try {
            let blobToDownload; // Zmienna na blob do pobrania

            if (this.leftAdjust === 0 && this.rightAdjust === 0) {
                // Jeśli nie ma dostosowań, pobierz oryginalny klip bezpośrednio z URL
                // (lub jeśli URL blobowy wygasł, można by ponownie użyć /w)
                this.updateStatus('Pobieranie oryginalnego klipu (brak dostosowań)...');
                console.log("Brak dostosowań, pobieranie z oryginalnego URL:", this.originalClipUrl);

                // Jeśli originalClipUrl to Blob URL, może wygasnąć. Bezpieczniej pobrać ponownie.
                // Sprawdźmy, czy originalClipUrl to blob url
                if (this.originalClipUrl.startsWith('blob:')) {
                    console.log("Oryginalny URL to blob, pobieranie przez /w dla pewności...");
                    const originalIndex = parseInt(this.clipIndex) + 1;
                    blobToDownload = await callApiForBlob('w', [originalIndex.toString()]);
                } else {
                    // Jeśli to zwykły URL, spróbuj fetch
                    const response = await fetch(this.originalClipUrl);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    blobToDownload = await response.blob();
                }

                if (!blobToDownload) throw new Error("Nie udało się pobrać oryginalnego klipu.");

            } else {
                // Jeśli są dostosowania, wywołaj adjustClip i użyj zwróconego bloba
                this.updateStatus('Dostosowywanie klipu...');
                blobToDownload = await this.adjustClip(); // Pobierz dostosowany blob

                if (!blobToDownload) {
                    // adjustClip mógł zwrócić null jeśli np. błąd lub inne warunki
                    throw new Error("Dostosowywanie klipu nie zwróciło danych do pobrania.");
                }
                this.updateStatus('Przygotowywanie dostosowanego klipu do pobrania...');
            }

            // Teraz mamy blobToDownload (oryginalny lub dostosowany)
            console.log(`Przygotowywanie do pobrania bloba, rozmiar: ${blobToDownload.size}`);

            // Utwórz link do pobrania z uzyskanego bloba
            const url = URL.createObjectURL(blobToDownload);
            const a = document.createElement('a');
            a.href = url;
            // Zmień nazwę pliku w zależności od tego, czy był dostosowany
            const fileName = (this.leftAdjust === 0 && this.rightAdjust === 0)
                ? `klip_${parseInt(this.clipIndex) + 1}.mp4`
                : `dostosowany_klip_${parseInt(this.clipIndex) + 1}_L${this.leftAdjust}_P${this.rightAdjust}.mp4`;
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
            this.updateStatus(`Błąd podczas pobierania: ${error.message}`);
            // Usunięto alert, bo updateStatus jest już widoczny
        }
    }
}