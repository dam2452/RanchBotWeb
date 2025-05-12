import { callApi, callApiForBlob } from '../modules/api-client.js';
import { ReelNavigator } from '../modules/reel-navigator.js';

let loadedClips = 0;
let allResults = [];
let observer;
let loading = false;
let done = false;
let reelNavigatorInstance;

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
            const blob = await callApiForBlob('w', [`${currentOverallIndex + 1}`]);
            const url = URL.createObjectURL(blob);

            const el = document.createElement('div');
            el.className = 'reel-item';
            el.dataset.idx = currentOverallIndex;

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
        const { results } = await callApi('sz', [query]).then(d => d.data);
        allResults = results;

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
        console.error(err);
        reel.innerHTML = `<p>${err.message}</p>`;
        done = true;
        if (observer) observer.disconnect();
    }
});