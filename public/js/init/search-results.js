import { SELECTORS, CLASSES, MESSAGES } from '../core/constants.js';
import { createElement, downloadBlob } from '../core/dom-utils.js';
import { searchClips, getVideo } from '../modules/api-client.js';
import { ReelNavigator } from '../modules/reel-navigator.js';
import { ClipInspector } from '../modules/clip-inspector.js';

let loadedClips = 0;
let allResults = [];
let observer;
let loading = false;
let done = false;
let reelNavigatorInstance;
let clipInspectorInstance;
let videoCache = {};

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
            const blob = await getVideo(currentOverallIndex + 1);
            const url = URL.createObjectURL(blob);

            videoCache[currentOverallIndex] = url;
            console.log(`Saved URL for clip ${currentOverallIndex} in cache`);

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
        addControlButtons();
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

function addControlButtons() {
    console.log("Adding control buttons...");

    document.querySelectorAll(SELECTORS.REEL_ITEM).forEach(item => {
        if (!item.querySelector(SELECTORS.INSPECT_BUTTON)) {
            const inspectBtn = createElement('button', {
                className: 'inspect-btn'
            }, 'Adjust');

            inspectBtn.addEventListener('click', function(e) {
                e.stopPropagation();

                const clipIndex = parseInt(item.dataset.idx);
                if (isNaN(clipIndex)) {
                    console.error(MESSAGES.CLIP_ID_NOT_FOUND);
                    return;
                }

                console.log(`Adjust button clicked for clip index ${clipIndex}`);

                if (videoCache[clipIndex]) {
                    console.log(`Found URL in cache: ${videoCache[clipIndex].substring(0, 50)}...`);
                    clipInspectorInstance.show(clipIndex, videoCache[clipIndex]);
                } else {
                    const video = item.querySelector('video');
                    if (video && video.src) {
                        console.log(`Fetched URL from video element: ${video.src.substring(0, 50)}...`);
                        clipInspectorInstance.show(clipIndex, video.src);
                    } else {
                        console.error("No video URL found in cache or DOM!");
                    }
                }
            });

            item.appendChild(inspectBtn);
        }

        if (!item.querySelector('.top-download-btn')) {
            const clipIndex = parseInt(item.dataset.idx);
            const topDownloadBtn = createElement('button', {
                className: 'top-download-btn'
            }, 'Download');

            topDownloadBtn.addEventListener('click', async function(e) {
                e.stopPropagation();

                if (isNaN(clipIndex)) {
                    console.error(MESSAGES.CLIP_ID_NOT_FOUND);
                    return;
                }

                try {
                    topDownloadBtn.textContent = 'Downloading...';
                    topDownloadBtn.disabled = true;

                    const blob = await getVideo(clipIndex + 1);
                    downloadBlob(blob, `video_${clipIndex + 1}.mp4`);

                } catch (error) {
                    console.error('Error during download:', error);
                    alert('Download failed: ' + error.message);
                } finally {
                    topDownloadBtn.textContent = 'Download';
                    topDownloadBtn.disabled = false;
                }
            });

            item.appendChild(topDownloadBtn);
        }
    });
}

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

function setSearchQuery() {
    const query = new URLSearchParams(location.search).get('query');
    if (!query) return;

    const queryInput = document.getElementById('query-input');
    if (queryInput) {
        queryInput.value = query;
    }
}

function setupSearchForm() {
    const queryInput = document.getElementById('query-input');
    const searchBtn = document.querySelector('.search-icon-btn');

    if (queryInput && searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = queryInput.value.trim();
            if (query) {
                window.location.href = `/search-results?query=${encodeURIComponent(query)}`;
            }
        });

        queryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = queryInput.value.trim();
                if (query) {
                    window.location.href = `/search-results?query=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Initializing search results page...");

    try {
        console.log("Creating ClipInspector instance...");
        clipInspectorInstance = new ClipInspector();
        console.log("ClipInspector instance created successfully");
    } catch (error) {
        console.error("Error initializing ClipInspector:", error);
    }

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
        console.log(`Searching: ${query}`);
        allResults = await searchClips(query);
        console.log("Search results:", allResults);

        if (!allResults || allResults.length === 0) {
            reel.innerHTML = '<p>No results to display.</p>';
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
        console.error("Error during search:", err);
        reel.innerHTML = `<p>${err.message}</p>`;
        done = true;
        if (observer) observer.disconnect();
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && clipInspectorInstance && clipInspectorInstance.visible) {
            clipInspectorInstance.hide();
        }
    });
});