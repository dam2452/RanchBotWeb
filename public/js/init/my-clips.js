import { ClipsManager }     from '../components/ClipsManager.js';
import { PagedClipsNavigator } from '../modules/paged-reel-navigator.js';   // Poprawiona ścieżka
import { initializeVideoContainers } from '../components/VideoContainer.js';

class MyClipsPageManager {
    #pageContainer;
    #clipsManager;
    #navigator;
    #videoManager;
    #searchButton;

    async initialize () {
        this.#pageContainer = document.querySelector('.my-clips-page');
        if (!this.#pageContainer) return;

        this.#setupUI();
        await this.#loadAndRenderClips();
    }

    /* ----------  UI  ---------- */
    #setupUI () {
        this.#addLogoWithName();
        this.#addCenteredSearchButton();
        this.#clipsManager = new ClipsManager();
    }

    #addLogoWithName () {
        const logo = `
            <a href="/" class="site-logo-container">
                <img src="/images/branding/logo.svg" alt="Logo strony" class="site-logo">
                <div class="site-name">RanchBot</div>
            </a>`;
        this.#pageContainer.insertAdjacentHTML('beforeend', logo);
    }

    #addCenteredSearchButton () {
        const btn = `
            <a href="/search" class="search-nav-button">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" fill="none" stroke-width="2"/>
                    <line  x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span>Search for quotes</span>
            </a>`;
        this.#pageContainer.insertAdjacentHTML('beforeend', btn);
    }

    /* ----------  CLIPS  ---------- */
    async #loadAndRenderClips () {
        await this.#clipsManager.loadClips();          // pobranie z API
        this.#clipsManager.renderClips();              // tworzy .clips-page z . clip-card
        this.#initializeNavigationAndVideo();
        this.#clipsManager.setupDeleteButtons();
    }

    /* ----------  NAVIGACJA + WIDEO  ---------- */
    #initializeNavigationAndVideo () {
        // 1 wideo naraz – jak w Search Results
        this.#videoManager = initializeVideoContainers();

        // identyczna nawigacja jak w Search Results
        this.#navigator = new PagedClipsNavigator({
            container   : document.querySelector('.clips-reel'),
            onPageChange: () => this.#videoManager.stopAll()
        });

        this.#decorateActiveClip();
        this.#pauseOnClickOutside();
    }

    /* ----------  UX  ---------- */
    #decorateActiveClip () {
        const cards = document.querySelectorAll('.clip-card');

        cards.forEach(card => {
            const video = card.querySelector('video');
            video.addEventListener('play', () => {
                cards.forEach(c => c.style.boxShadow = '');
                card.style.boxShadow = '0 0 0 4px #f2a94c'; // pomarańczowa ramka
            });
            video.addEventListener('pause', () => { card.style.boxShadow = ''; });
        });
    }

    #pauseOnClickOutside () {
        document.body.addEventListener('click', e => {
            if (!e.target.closest('.clip-card')) this.#videoManager.stopAll();
        });
    }
}

/* ----------  start  ---------- */
document.addEventListener('DOMContentLoaded', () => {
    new MyClipsPageManager().initialize();
});
