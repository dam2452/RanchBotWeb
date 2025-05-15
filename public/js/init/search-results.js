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
    #reelNavigator = null;
    #clipInspector = null;
    #videoCache = {};
    #reel = null;

    constructor() {
        this.#reel = document.querySelector(SELECTORS.VIDEO_REEL);
    }

    async initialize() {
        this.#initializeClipInspector();
        this.#setInitialQuery();
        this.#setupSearchForm();
        await this.#loadSearchResults();
        this.#setupEscapeHandler();
    }

    #initializeClipInspector() {
        this.#clipInspector = new ClipInspector();
        if (this.#reelNavigator) {
            this.#clipInspector.setReelNavigator(this.#reelNavigator);
        }
    }

    #setInitialQuery() {
        const query = new URLSearchParams(location.search).get('query');
        if (!query) return;
        const queryInput = document.getElementById('query-input');
        if (queryInput) queryInput.value = query;
    }

    #setupSearchForm() {
        const queryInput = document.getElementById('query-input');
        const searchBtn = document.querySelector('.search-icon-btn');
        if (queryInput && searchBtn) {
            searchBtn.addEventListener('click', () => this.#handleSearch(queryInput));
            queryInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.#handleSearch(queryInput);
            });
        }
    }

    #handleSearch(queryInput) {
        const query = queryInput.value.trim();
        if (query) window.location.href = `/search-results?query=${encodeURIComponent(query)}`;
    }

    #setupEscapeHandler() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.#clipInspector && this.#clipInspector.visible) {
                this.#clipInspector.hide();
            }
        });
    }

    async #loadSearchResults() {
        const query = new URLSearchParams(location.search).get('query');
        if (!query || !this.#reel) return;

        try {
            this.#allResults = await searchClips(query);
            if (!this.#allResults || this.#allResults.length === 0) {
                this.#showNoResultsMessage();
                return;
            }
            this.#reel.innerHTML = '';
            this.#reelNavigator = new ReelNavigator(SELECTORS.VIDEO_REEL);
            if (this.#clipInspector) {
                this.#clipInspector.setReelNavigator(this.#reelNavigator);
            }
            await this.#loadNextClips();
            if (this.#reelNavigator && this.#reelNavigator.items.length > 0) {
                this.#reelNavigator.activate(0, true);
            }
        } catch (err) {
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
        let itemsAdded = 0;
        for (let i = 0; i < batchSize; i++) {
            const idx = this.#loadedClips + i;
            if (idx >= this.#allResults.length) {
                this.#done = true;
                break;
            }
            try {
                await this.#addClipToReel(idx);
                itemsAdded++;
            } catch {}
        }
        this.#loadedClips += itemsAdded;
        this.#afterClipsLoaded(itemsAdded);
    }

    async #addClipToReel(index) {
        const blob = await getVideo(index + 1);
        const url = URL.createObjectURL(blob);
        this.#videoCache[index] = url;
        const element = this.#createClipElement(index, url);
        this.#reel.appendChild(element);
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

    #afterClipsLoaded(itemsAdded) {
        if (itemsAdded > 0 && this.#reelNavigator) {
            this.#reelNavigator.refresh();
            this.#addControlButtons();
        }
        this.#checkIfAllLoaded();
        this.#loading = false;
    }

    #checkIfAllLoaded() {
        if (this.#loadedClips >= this.#allResults.length) {
            this.#done = true;
            if (this.#observer) this.#observer.disconnect();
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
        document.querySelectorAll(SELECTORS.REEL_ITEM).forEach(item => {
            this.#addInspectButton(item);
            this.#addDownloadButton(item);
        });
    }

    #addInspectButton(item) {
        if (!item.querySelector(SELECTORS.INSPECT_BUTTON)) {
            const inspectBtn = createElement('button', { className: 'inspect-btn' }, 'Adjust');
            inspectBtn.addEventListener('click', (e) => this.#handleInspectClick(e, item));
            item.appendChild(inspectBtn);
        }
    }

    #handleInspectClick(e, item) {
        e.stopPropagation();
        const editingClip = document.querySelector('.reel-item.editing-mode');
        if (editingClip && editingClip !== item && this.#clipInspector) {
            this.#clipInspector.hide();
        }
        const clipIndex = parseInt(item.dataset.idx);
        if (isNaN(clipIndex)) return;
        if (this.#videoCache[clipIndex]) {
            this.#clipInspector.show(clipIndex, this.#videoCache[clipIndex], item);
        } else {
            const video = item.querySelector('video');
            if (video && video.src) {
                this.#clipInspector.show(clipIndex, video.src, item);
            }
        }
    }

    #addDownloadButton(item) {
        if (!item.querySelector('.top-download-btn')) {
            const clipIndex = parseInt(item.dataset.idx);
            const btn = createElement('button', { className: 'top-download-btn' }, 'Download');
            btn.addEventListener('click', (e) => this.#handleDownloadClick(e, clipIndex, btn));
            item.appendChild(btn);
        }
    }

    async #handleDownloadClick(e, clipIndex, button) {
        e.stopPropagation();
        if (isNaN(clipIndex)) return;
        try {
            button.textContent = 'Downloading...';
            button.disabled = true;
            const blob = await getVideo(clipIndex + 1);
            downloadBlob(blob, `video_${clipIndex + 1}.mp4`);
        } catch (error) {
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
