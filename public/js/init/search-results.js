// Przywrócona i rozszerzona wersja search-results.js
import { callApi, callApiForBlob } from '../modules/api-client.js';
import { ReelNavigator } from '../modules/reel-navigator.js';
import { ClipInspector } from '../modules/clip-inspector.js';

let loadedClips = 0;
let allResults = [];
let observer;
let loading = false;
let done = false;
let reelNavigatorInstance;
let clipInspectorInstance;
// Przechowuj odwołania do URL-i blob-ów wideo
let videoCache = {};

async function loadNextClips(batchSize = 3) {
    if (loading || done) return;
    loading = true;

    const reel = document.querySelector('.video-reel');
    let itemsAddedInThisBatch = 0;

    for (let i = 0; i < batchSize; i++) {
        const currentOverallIndex = loadedClips + i;

        if (currentOverallIndex >= allResults.length) {
            done = true;
            break;
        }
        const itemData = allResults[currentOverallIndex];

        try {
            // WAŻNE: Używamy oryginalnego podejścia - pobieranie przez /w z indeksem
            const blob = await callApiForBlob('w', [`${currentOverallIndex + 1}`]);
            const url = URL.createObjectURL(blob);

            // Zapisz URL w pamięci podręcznej dla późniejszego użycia
            videoCache[currentOverallIndex] = url;

            console.log(`Zapisano URL dla klipu ${currentOverallIndex} w pamięci podręcznej`);

            const el = document.createElement('div');
            el.className = 'reel-item';
            el.dataset.idx = currentOverallIndex;

            // Dodajemy wideo
            el.innerHTML = `
                <video loop preload="metadata">
                    <source src="${url}" type="video/mp4">
                </video>`;
            reel.appendChild(el);
            itemsAddedInThisBatch++;
        } catch (e) {
            console.error(`Error loading clip ${currentOverallIndex + 1}:`, e);
        }
    }

    loadedClips += itemsAddedInThisBatch;

    if (itemsAddedInThisBatch > 0 && reelNavigatorInstance) {
        reelNavigatorInstance.refresh();

        // Dodajemy przyciski inspekcji do każdego elementu
        console.log("Dodawanie przycisków Dostosuj...");
        document.querySelectorAll('.reel-item').forEach(item => {
            // Sprawdź, czy przycisk już istnieje
            if (!item.querySelector('.inspect-btn')) {
                const inspectBtn = document.createElement('button');
                inspectBtn.className = 'inspect-btn';
                inspectBtn.textContent = 'Dostosuj';

                inspectBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Zapobiegamy propagacji kliknięcia

                    // Pobierz indeks klipu
                    const clipIndex = parseInt(item.dataset.idx);
                    if (isNaN(clipIndex)) {
                        console.error("Nieprawidłowy indeks klipu!");
                        return;
                    }

                    console.log(`Kliknięto przycisk Dostosuj dla klipu o indeksie ${clipIndex}`);

                    // Użyj zapisanego URL z pamięci podręcznej
                    if (videoCache[clipIndex]) {
                        console.log(`Znaleziono URL w pamięci podręcznej: ${videoCache[clipIndex].substring(0, 50)}...`);
                        clipInspectorInstance.show(clipIndex, videoCache[clipIndex]);
                    } else {
                        // Jeśli nie ma w pamięci podręcznej, spróbuj pobrać z DOM
                        const video = item.querySelector('video');
                        if (video && video.src) {
                            console.log(`Pobrano URL z elementu wideo: ${video.src.substring(0, 50)}...`);
                            clipInspectorInstance.show(clipIndex, video.src);
                        } else {
                            console.error("Nie znaleziono URL wideo w pamięci podręcznej ani w DOM!");
                        }
                    }
                });

                item.appendChild(inspectBtn);
            }
        });
    }

    if (loadedClips >= allResults.length) {
        done = true;
    }

    if (!done) {
        setupIntersectionObserver();
    } else if (observer) {
        observer.disconnect();
    }
    loading = false;
}

function setupIntersectionObserver() {
    if (observer) observer.disconnect();

    const reel = document.querySelector('.video-reel');
    const items = reel.querySelectorAll('.reel-item');
    const lastItem = items[items.length - 1];

    if (!lastItem || done) {
        if (observer) observer.disconnect();
        return;
    }

    observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !loading) {
            loadNextClips();
        }
    }, { rootMargin: '100px' });

    observer.observe(lastItem);
}

// Funkcja do ustawienia wartości zapytania w polu wyszukiwania
function setSearchQuery() {
    const query = new URLSearchParams(location.search).get('query');
    if (!query) return;

    const queryInput = document.getElementById('query-input');
    if (queryInput) {
        queryInput.value = query;
    }
}

// Funkcja do obsługi wysyłania formularza wyszukiwania
function setupSearchForm() {
    const queryInput = document.getElementById('query-input');
    const searchBtn = document.querySelector('.search-icon-btn');

    if (queryInput && searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = queryInput.value.trim();
            if (query) {
                window.location.href = `/search-results.php?query=${encodeURIComponent(query)}`;
            }
        });

        queryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = queryInput.value.trim();
                if (query) {
                    window.location.href = `/search-results.php?query=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Inicjalizacja strony wyników wyszukiwania...");

    try {
        // Inicjalizacja inspektora klipów
        console.log("Tworzenie instancji ClipInspector...");
        clipInspectorInstance = new ClipInspector();
        console.log("Instancja ClipInspector utworzona pomyślnie");
    } catch (error) {
        console.error("Błąd podczas inicjalizacji ClipInspector:", error);
    }

    // Ustaw wartość zapytania w polu wyszukiwania
    setSearchQuery();

    // Skonfiguruj obsługę formularza wyszukiwania
    setupSearchForm();

    const query = new URLSearchParams(location.search).get('query');
    if (!query) {
        return;
    }

    const reelContainerSelector = '.video-reel';
    const reel = document.querySelector(reelContainerSelector);
    if (!reel) {
        console.error('Container .video-reel not found!');
        return;
    }

    try {
        console.log(`Wyszukiwanie: ${query}`);
        // WAŻNE: Używamy dokładnie oryginalnego kodu do pobierania wyników wyszukiwania
        const { results } = await callApi('sz', [query]).then(d => d.data);
        allResults = results;

        console.log("Wyniki wyszukiwania:", results);

        if (!allResults || allResults.length === 0) {
            reel.innerHTML = '<p>Brak wyników do wyświetlenia.</p>';
            done = true;
            if (observer) observer.disconnect();
            return;
        }

        reel.innerHTML = '';
        reelNavigatorInstance = new ReelNavigator(reelContainerSelector);

        await loadNextClips();

        if (reelNavigatorInstance && reelNavigatorInstance.items.length > 0) {
            reelNavigatorInstance.activate(0);
        }

    } catch (err) {
        console.error("Błąd podczas wyszukiwania:", err);
        reel.innerHTML = `<p>${err.message}</p>`;
        done = true;
        if (observer) observer.disconnect();
    }

    // Obsługa klawisza Escape dla zamknięcia inspektora
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && clipInspectorInstance && clipInspectorInstance.visible) {
            clipInspectorInstance.hide();
        }
    });
});