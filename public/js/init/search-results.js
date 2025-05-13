// public/js/init/search-results.js

import { SELECTORS, CLASSES, MESSAGES } from '../core/constants.js';
import { createElement, downloadBlob } from '../core/dom-utils.js';
import { searchClips, getVideo } from '../modules/api-client.js';
import { ReelNavigator } from '../modules/reel-navigator.js';
import { ClipInspector } from '../modules/clip-inspector.js';

/**
 * Search Results page initialization
 */
// State variables
let loadedClips = 0;
let allResults = [];
let observer;
let loading = false;
let done = false;
let reelNavigatorInstance;
let clipInspectorInstance;
let videoCache = {};  // Cache for video URLs

/**
 * Load the next batch of clips
 * @param {number} batchSize - Number of clips to load
 */
async function loadNextClips(batchSize = 3) {
    if (loading || done) return;
    loading = true;

    const reel = document.querySelector(SELECTORS.VIDEO_REEL);
    let itemsAddedInThisBatch = 0;

    for (let i = 0; i < batchSize; i++) {
        const currentOverallIndex = loadedClips + i;

        if (currentOverallIndex >= allResults.length) {
            done = true;
            break;
        }

        const itemData = allResults[currentOverallIndex];

        try {
            // Get video blob
            const blob = await getVideo(currentOverallIndex + 1);
            const url = URL.createObjectURL(blob);

            // Cache URL for later use
            videoCache[currentOverallIndex] = url;
            console.log(`Zapisano URL dla klipu ${currentOverallIndex} w pamięci podręcznej`);

            // Create reel item
            const el = createElement('div', {
                className: 'reel-item',
                dataset: { idx: currentOverallIndex }
            }, `
        <video loop preload="metadata">
          <source src="${url}" type="video/mp4">
        </video>
      `);

            reel.appendChild(el);
            itemsAddedInThisBatch++;
        } catch (e) {
            console.error(`Error loading clip ${currentOverallIndex + 1}:`, e);
        }
    }

    loadedClips += itemsAddedInThisBatch;

    if (itemsAddedInThisBatch > 0 && reelNavigatorInstance) {
        reelNavigatorInstance.refresh();
        addInspectButtons();
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

/**
 * Add inspect buttons to reel items
 */
function addInspectButtons() {
    console.log("Dodawanie przycisków Dostosuj...");

    document.querySelectorAll(SELECTORS.REEL_ITEM).forEach(item => {
        // Check if button already exists
        if (!item.querySelector(SELECTORS.INSPECT_BUTTON)) {
            const inspectBtn = createElement('button', {
                className: 'inspect-btn'
            }, 'Dostosuj');

            inspectBtn.addEventListener('click', function(e) {
                e.stopPropagation();

                // Get clip index
                const clipIndex = parseInt(item.dataset.idx);
                if (isNaN(clipIndex)) {
                    console.error(MESSAGES.CLIP_ID_NOT_FOUND);
                    return;
                }

                console.log(`Kliknięto przycisk Dostosuj dla klipu o indeksie ${clipIndex}`);

                // Use cached URL if available
                if (videoCache[clipIndex]) {
                    console.log(`Znaleziono URL w pamięci podręcznej: ${videoCache[clipIndex].substring(0, 50)}...`);
                    clipInspectorInstance.show(clipIndex, videoCache[clipIndex]);
                } else {
                    // Try to get URL from DOM
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

/**
 * Set up intersection observer for lazy loading
 */
function setupIntersectionObserver() {
    if (observer) observer.disconnect();

    const reel = document.querySelector(SELECTORS.VIDEO_REEL);
    const items = reel.querySelectorAll(SELECTORS.REEL_ITEM);
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

/**
 * Set search query in input field
 */
function setSearchQuery() {
    const query = new URLSearchParams(location.search).get('query');
    if (!query) return;

    const queryInput = document.getElementById('query-input');
    if (queryInput) {
        queryInput.value = query;
    }
}

/**
 * Set up search form handling
 */
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

/**
 * Initialize the search results page
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Inicjalizacja strony wyników wyszukiwania...");

    try {
        // Initialize clip inspector
        console.log("Tworzenie instancji ClipInspector...");
        clipInspectorInstance = new ClipInspector();
        console.log("Instancja ClipInspector utworzona pomyślnie");
    } catch (error) {
        console.error("Błąd podczas inicjalizacji ClipInspector:", error);
    }

    // Set up search form and query
    setSearchQuery();
    setupSearchForm();

    const query = new URLSearchParams(location.search).get('query');
    if (!query) {
        return;
    }

    const reel = document.querySelector(SELECTORS.VIDEO_REEL);
    if (!reel) {
        console.error(`Container ${SELECTORS.VIDEO_REEL} not found!`);
        return;
    }

    try {
        console.log(`Wyszukiwanie: ${query}`);
        allResults = await searchClips(query);
        console.log("Wyniki wyszukiwania:", allResults);

        if (!allResults || allResults.length === 0) {
            reel.innerHTML = '<p>Brak wyników do wyświetlenia.</p>';
            done = true;
            if (observer) observer.disconnect();
            return;
        }

        reel.innerHTML = '';
        reelNavigatorInstance = new ReelNavigator(SELECTORS.VIDEO_REEL);

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

    // Handle Escape key to close inspector
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && clipInspectorInstance && clipInspectorInstance.visible) {
            clipInspectorInstance.hide();
        }
    });
});