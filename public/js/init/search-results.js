// Modyfikacja search-results.js, aby zintegrować nową wersję ClipInspector



import { SELECTORS, CLASSES, MESSAGES } from '../core/constants.js';

import { createElement, downloadBlob } from '../core/dom-utils.js';

import { searchClips, getVideo } from '../modules/api-client.js';

import { ReelNavigator } from '../modules/reel-navigator.js';

import { ClipInspector } from '../modules/clip-inspector.js';



class SearchResultsManager {

    #loadedClips = 0;

    #allResults = [];

    #observer = null;

    #loading = false;

    #done = false;

    #reelNavigatorInstance = null;

    #clipInspectorInstance = null;

    #videoCache = {};

    #reel = null;



    constructor() {

        this.#reel = document.querySelector(SELECTORS.VIDEO_REEL);

    }



    async initialize() {

        console.log("Initializing search results page...");



        try {

            this.#initializeClipInspector();

            this.#setSearchQuery();

            this.#setupSearchForm();

            await this.#loadSearchResults();

        } catch (error) {

            console.error("Error during initialization:", error);

        }



        this.#setupKeyboardHandlers();

    }



    #initializeClipInspector() {

        console.log("Creating ClipInspector instance...");

        try {

            this.#clipInspectorInstance = new ClipInspector();



            // Jeśli mamy ReelNavigator, przekazujemy go do ClipInspector

            if (this.#reelNavigatorInstance) {

                this.#clipInspectorInstance.setReelNavigator(this.#reelNavigatorInstance);

            }



            console.log("ClipInspector instance created successfully");

        } catch (error) {

            console.error("Error initializing ClipInspector:", error);

        }

    }



    #setSearchQuery() {

        const query = new URLSearchParams(location.search).get('query');

        if (!query) return;



        const queryInput = document.getElementById('query-input');

        if (queryInput) {

            queryInput.value = query;

        }

    }



    #setupSearchForm() {

        const queryInput = document.getElementById('query-input');

        const searchBtn = document.querySelector('.search-icon-btn');



        if (queryInput && searchBtn) {

            searchBtn.addEventListener('click', () => this.#handleSearch(queryInput));

            queryInput.addEventListener('keypress', (e) => {

                if (e.key === 'Enter') {

                    this.#handleSearch(queryInput);

                }

            });

        }

    }



    #handleSearch(queryInput) {

        const query = queryInput.value.trim();

        if (query) {

            window.location.href = `/search-results?query=${encodeURIComponent(query)}`;

        }

    }



    #setupKeyboardHandlers() {

        window.addEventListener('keydown', (e) => {

            if (e.key === 'Escape' && this.#clipInspectorInstance && this.#clipInspectorInstance.visible) {

                this.#clipInspectorInstance.hide();

            }

        });

    }



    async #loadSearchResults() {

        const query = new URLSearchParams(location.search).get('query');

        if (!query) return;



        if (!this.#reel) {

            console.error(`Container ${SELECTORS.VIDEO_REEL} not found!`);

            return;

        }



        try {

            console.log(`Searching: ${query}`);

            this.#allResults = await searchClips(query);

            console.log("Search results:", this.#allResults);



            if (!this.#allResults || this.#allResults.length === 0) {

                this.#showNoResultsMessage();

                return;

            }



            this.#reel.innerHTML = '';

            this.#reelNavigatorInstance = new ReelNavigator(SELECTORS.VIDEO_REEL);



            // Aktualizacja referencji do ReelNavigator w ClipInspector

            if (this.#clipInspectorInstance) {

                this.#clipInspectorInstance.setReelNavigator(this.#reelNavigatorInstance);

            }



            await this.#loadNextClips();



            if (this.#reelNavigatorInstance && this.#reelNavigatorInstance.items.length > 0) {

                this.#reelNavigatorInstance.activate(0);

            }

        } catch (err) {

            console.error("Error during search:", err);

            this.#showErrorMessage(err.message);

        }

    }



    #showNoResultsMessage() {

        this.#reel.innerHTML = '<p>No results to display.</p>';

        this.#done = true;

        if (this.#observer) this.#observer.disconnect();

    }



    #showErrorMessage(message) {

        this.#reel.innerHTML = `<p>${message}</p>`;

        this.#done = true;

        if (this.#observer) this.#observer.disconnect();

    }



    async #loadNextClips(batchSize = 3) {

        if (this.#loading || this.#done) return;

        this.#loading = true;



        let itemsAddedInThisBatch = 0;



        for (let i = 0; i < batchSize; i++) {

            const currentOverallIndex = this.#loadedClips + i;



            if (currentOverallIndex >= this.#allResults.length) {

                this.#done = true;

                break;

            }



            try {

                await this.#loadAndAddClip(currentOverallIndex);

                itemsAddedInThisBatch++;

            } catch (e) {

                console.error(`Error loading clip ${currentOverallIndex + 1}:`, e);

            }

        }



        this.#loadedClips += itemsAddedInThisBatch;

        this.#updateAfterClipsLoaded(itemsAddedInThisBatch);

    }



    async #loadAndAddClip(index) {

        const itemData = this.#allResults[index];

        const blob = await getVideo(index + 1);

        const url = URL.createObjectURL(blob);



        this.#videoCache[index] = url;

        console.log(`Saved URL for clip ${index} in cache`);



        const el = this.#createClipElement(index, url);

        this.#reel.appendChild(el);

    }



    #createClipElement(index, url) {

        return createElement('div', {

            className: 'reel-item',

            dataset: { idx: index }

        }, `

            <video loop preload="metadata">

                <source src="${url}" type="video/mp4">

            </video>

        `);

    }



    #updateAfterClipsLoaded(itemsAdded) {

        if (itemsAdded > 0 && this.#reelNavigatorInstance) {

            this.#reelNavigatorInstance.refresh();

            this.#addControlButtons();

        }



        this.#checkIfAllLoaded();

        this.#loading = false;

    }



    #checkIfAllLoaded() {

        if (this.#loadedClips >= this.#allResults.length) {

            this.#done = true;

            if (this.#observer) {

                this.#observer.disconnect();

            }

        } else if (!this.#done) {

            this.#setupIntersectionObserver();

        }

    }



    #setupIntersectionObserver() {

        if (this.#observer) this.#observer.disconnect();



        const items = this.#reel.querySelectorAll(SELECTORS.REEL_ITEM);

        const lastItem = items[items.length - 1];



        if (!lastItem || this.#done) {

            if (this.#observer) this.#observer.disconnect();

            return;

        }



        this.#observer = new IntersectionObserver(entries => {

            if (entries[0].isIntersecting && !this.#loading) {

                this.#loadNextClips();

            }

        }, { rootMargin: '100px' });



        this.#observer.observe(lastItem);

    }



    #addControlButtons() {

        console.log("Adding control buttons...");



        document.querySelectorAll(SELECTORS.REEL_ITEM).forEach(item => {

            this.#addInspectButton(item);

            this.#addDownloadButton(item);

        });

    }



    #addInspectButton(item) {

        if (!item.querySelector(SELECTORS.INSPECT_BUTTON)) {

            const inspectBtn = createElement('button', {

                className: 'inspect-btn'

            }, 'Adjust');



            inspectBtn.addEventListener('click', (e) => this.#handleInspectButtonClick(e, item));

            item.appendChild(inspectBtn);

        }

    }



    #handleInspectButtonClick(e, item) {

        e.stopPropagation();



        // Sprawdź, czy inny klip jest już w trybie edycji

        const editingClip = document.querySelector('.reel-item.editing-mode');

        if (editingClip && editingClip !== item && this.#clipInspectorInstance) {

            // Zakończ edycję tego klipu przed rozpoczęciem nowej

            this.#clipInspectorInstance.hide();

        }



        const clipIndex = parseInt(item.dataset.idx);

        if (isNaN(clipIndex)) {

            console.error(MESSAGES.CLIP_ID_NOT_FOUND);

            return;

        }



        console.log(`Adjust button clicked for clip index ${clipIndex}`);



        if (this.#videoCache[clipIndex]) {

            console.log(`Found URL in cache: ${this.#videoCache[clipIndex].substring(0, 50)}...`);

            this.#clipInspectorInstance.show(clipIndex, this.#videoCache[clipIndex], item);

        } else {

            const video = item.querySelector('video');

            if (video && video.src) {

                console.log(`Fetched URL from video element: ${video.src.substring(0, 50)}...`);

                this.#clipInspectorInstance.show(clipIndex, video.src, item);

            } else {

                console.error("No video URL found in cache or DOM!");

            }

        }

    }



    #addDownloadButton(item) {

        if (!item.querySelector('.top-download-btn')) {

            const clipIndex = parseInt(item.dataset.idx);

            const topDownloadBtn = createElement('button', {

                className: 'top-download-btn'

            }, 'Download');



            topDownloadBtn.addEventListener('click', (e) => this.#handleDownloadButtonClick(e, clipIndex, topDownloadBtn));

            item.appendChild(topDownloadBtn);

        }

    }



    async #handleDownloadButtonClick(e, clipIndex, button) {

        e.stopPropagation();



        if (isNaN(clipIndex)) {

            console.error(MESSAGES.CLIP_ID_NOT_FOUND);

            return;

        }



        try {

            button.textContent = 'Downloading...';

            button.disabled = true;



            const blob = await getVideo(clipIndex + 1);

            downloadBlob(blob, `video_${clipIndex + 1}.mp4`);



        } catch (error) {

            console.error('Error during download:', error);

            alert('Download failed: ' + error.message);

        } finally {

            button.textContent = 'Download';

            button.disabled = false;

        }

    }

}



document.addEventListener('DOMContentLoaded', async () => {

    const searchResults = new SearchResultsManager();

    await searchResults.initialize();

});