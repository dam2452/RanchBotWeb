import { callApi, callApiForBlob } from '../modules/api-client.js';
import { ReelNavigator } from '../modules/reel-navigator.js';

let loadedClips = 0;     // Licznik załadowanych klipów z allResults
let allResults = [];
let observer;
let loading = false;
let done = false;
let reelNavigatorInstance; // Zmienna do przechowywania instancji ReelNavigator

async function loadNextClips(batchSize = 3) {
    if (loading || done) return;
    loading = true;

    const reel = document.querySelector('.video-reel');
    let itemsAddedInThisBatch = 0;

    // Pętla iteruje tyle razy, ile wynosi batchSize, lub dopóki są elementy w allResults
    for (let i = 0; i < batchSize; i++) {
        const currentOverallIndex = loadedClips + i; // Aktualny globalny indeks klipu

        if (currentOverallIndex >= allResults.length) {
            done = true; // Nie ma więcej klipów do załadowania z allResults
            break;
        }
        const itemData = allResults[currentOverallIndex]; // Dane dla klipu

        try {
            // API `w` oczekuje indeksu 1-based, a currentOverallIndex jest 0-based
            const blob = await callApiForBlob('w', [`${currentOverallIndex + 1}`]);
            const url = URL.createObjectURL(blob);

            const el = document.createElement('div');
            el.className = 'reel-item';
            el.dataset.idx = currentOverallIndex; // Użyj globalnego indeksu

            // Usuwamy 'autoplay muted' stąd. ReelNavigator.activate() zarządza tym.
            el.innerHTML = `
                <video loop preload="metadata">
                    <source src="${url}" type="video/mp4">
                </video>`;
            reel.appendChild(el);
            itemsAddedInThisBatch++;
        } catch (e) {
            console.error(`Error loading clip ${currentOverallIndex + 1}:`, e);
            // Można rozważyć, czy błąd ładowania jednego klipu powinien zatrzymać ładowanie partii
        }
    }

    loadedClips += itemsAddedInThisBatch; // Aktualizuj licznik na podstawie faktycznie dodanych klipów

    if (itemsAddedInThisBatch > 0 && reelNavigatorInstance) {
        reelNavigatorInstance.refresh(); // Odśwież listę klipów w nawigatorze!
    }

    if (loadedClips >= allResults.length) {
        done = true;
    }

    if (!done) {
        setupIntersectionObserver(); // Resetuj obserwatora na ostatni klip
    } else if (observer) {
        observer.disconnect(); // Jeśli wszystko załadowane, odłącz obserwatora
    }
    loading = false;
}

function setupIntersectionObserver() {
    if (observer) observer.disconnect();

    const reel = document.querySelector('.video-reel');
    const items = reel.querySelectorAll('.reel-item');
    const lastItem = items[items.length - 1];

    if (!lastItem || done) { // Jeśli nie ma ostatniego elementu lub zakończono ładowanie
        if (observer) observer.disconnect();
        return;
    }

    observer = new IntersectionObserver(entries => {
        // Dodatkowe sprawdzenie !loading, aby uniknąć wielokrotnych wywołań
        if (entries[0].isIntersecting && !loading) {
            loadNextClips();
        }
    }, { rootMargin: '100px' });

    observer.observe(lastItem);
}

document.addEventListener('DOMContentLoaded', async () => {
    const query = new URLSearchParams(location.search).get('query');
    if (!query) {
        // Opcjonalnie: wyświetl komunikat, jeśli brak zapytania
        return;
    }

    const reelContainerSelector = '.video-reel';
    const reel = document.querySelector(reelContainerSelector);
    if (!reel) {
        console.error('Container .video-reel not found!');
        return;
    }

    // Inicjalizuj ReelNavigator PRZED pierwszym ładowaniem, ale po upewnieniu się, że kontener jest pusty
    // lub przekażemy mu wiedzę o tym, że będzie dynamicznie wypełniany.
    // W tym przypadku, inicjujemy go po pierwszym załadowaniu, co jest OK,
    // ale musimy przekazać instancję do loadNextClips (pośrednio przez reelNavigatorInstance).

    try {
        const { results } = await callApi('sz', [query]).then(d => d.data);
        allResults = results;

        if (!allResults || allResults.length === 0) {
            reel.innerHTML = '<p>Brak wyników do wyświetlenia.</p>';
            done = true;
            if (observer) observer.disconnect();
            // Jeśli ReelNavigator zostałby zainicjowany wcześniej na pustym kontenerze:
            // if (reelNavigatorInstance) reelNavigatorInstance.refresh();
            return;
        }

        reel.innerHTML = ''; // Usuń placeholdery

        // WAŻNE: Utwórz instancję ReelNavigator TUTAJ, przed pierwszym `loadNextClips`,
        // LUB po pierwszym `loadNextClips`, ale upewnij się, że `reelNavigatorInstance` jest ustawione.
        // Prostsze jest utworzenie go PO pierwszym załadowaniu, jeśli `loadNextClips` nie zależy od niego
        // przy pierwszym uruchomieniu. W naszym przypadku `loadNextClips` teraz wywołuje `refresh` na
        // `reelNavigatorInstance`, więc musi być ono zdefiniowane.

        // Scenariusz 1: Tworzymy instancję, potem ładujemy i ona sama się odświeża.
        reelNavigatorInstance = new ReelNavigator(reelContainerSelector); // Inicjalizuje z PUSTĄ listą items
        // activate(0) w konstruktorze nic nie zrobi.

        await loadNextClips(); // Załaduj pierwszą partię klipów.
                               // Wewnątrz loadNextClips: reel.appendChild, a potem reelNavigatorInstance.refresh()
                               // Po refresh(), reelNavigatorInstance.items będzie zawierać pierwszą partię.

        // Po pierwszym załadowaniu i odświeżeniu, aktywuj pierwszy element, jeśli istnieje.
        if (reelNavigatorInstance && reelNavigatorInstance.items.length > 0) {
            // Jeśli konstruktor ReelNavigator nie aktywuje (bo items było puste), zrób to tutaj.
            // Metoda activate w ReelNavigator już ma logikę dla firstPlayedMuted.
            reelNavigatorInstance.activate(0);
        }
        // setupIntersectionObserver jest już wołany na końcu loadNextClips.

    } catch (err) {
        console.error(err);
        reel.innerHTML = `<p>${err.message}</p>`; // Poprawiony komunikat błędu
        done = true;
        if (observer) observer.disconnect();
    }
});