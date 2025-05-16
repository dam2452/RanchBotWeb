import { ClipsManager } from '../components/ClipsManager.js';
import { PagedClipsNavigator } from '../components/PagedClipsNavigator.js';
import { initializeVideoContainers } from '../components/VideoContainer.js';

class MyClipsPageManager {
    #pageContainer;
    #clipsManager;
    #navigator;
    #videoManager;
    #searchButton;

    async initialize() {
        console.log('Initializing My Clips page');

        this.#pageContainer = document.querySelector('.my-clips-page');
        if (!this.#pageContainer) {
            console.error('Page container not found');
            return;
        }

        this.#setupUI();
        await this.#loadAndRenderClips();
    }

    #setupUI() {
        // Dodanie logo z nazwą RanchBot
        this.#addLogoWithName();

        // Umieszczenie przycisku wyszukiwania na środku pod nagłówkiem
        this.#setupCenteredSearchButton();

        this.#clipsManager = new ClipsManager();
    }

    #addLogoWithName() {
        // Dodanie logo w lewym górnym rogu
        const logoContainer = document.createElement('a');
        logoContainer.href = '/';
        logoContainer.className = 'site-logo-container';

        const logoImg = document.createElement('img');
        logoImg.src = '/images/branding/logo.svg';
        logoImg.alt = 'Logo strony';
        logoImg.className = 'site-logo';

        const siteName = document.createElement('div');
        siteName.className = 'site-name';
        siteName.textContent = 'RanchBot';

        logoContainer.appendChild(logoImg);
        logoContainer.appendChild(siteName);
        this.#pageContainer.appendChild(logoContainer);
    }

    #setupCenteredSearchButton() {
        // Tworzymy przycisk wyszukiwania ręcznie - wyśrodkowany pod nagłówkiem
        this.#searchButton = document.createElement('a');
        this.#searchButton.href = '/search';
        this.#searchButton.className = 'search-nav-button';

        // Dodajemy ikonę lupy
        const searchIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        searchIcon.setAttribute('width', '20');
        searchIcon.setAttribute('height', '20');
        searchIcon.setAttribute('viewBox', '0 0 24 24');
        searchIcon.setAttribute('fill', 'none');
        searchIcon.setAttribute('stroke', 'currentColor');
        searchIcon.setAttribute('stroke-width', '2');
        searchIcon.setAttribute('stroke-linecap', 'round');
        searchIcon.setAttribute('stroke-linejoin', 'round');

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '11');
        circle.setAttribute('cy', '11');
        circle.setAttribute('r', '8');

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '21');
        line.setAttribute('y1', '21');
        line.setAttribute('x2', '16.65');
        line.setAttribute('y2', '16.65');

        searchIcon.appendChild(circle);
        searchIcon.appendChild(line);

        // Dodajemy tekst
        const searchText = document.createElement('span');
        searchText.textContent = 'Search for quotes';

        this.#searchButton.appendChild(searchIcon);
        this.#searchButton.appendChild(searchText);

        this.#pageContainer.appendChild(this.#searchButton);
    }

    async #loadAndRenderClips() {
        try {
            await this.#clipsManager.loadClips();

            const pages = this.#clipsManager.renderClips();

            if (pages && pages.length > 0) {
                this.#initializeNavigationAndVideo();
                this.#clipsManager.setupDeleteButtons();
            }
        } catch (error) {
            console.error('Error initializing My Clips page:', error);
            this.#showErrorMessage(error);
        }
    }

    #initializeNavigationAndVideo() {
        // Inicjalizacja menedżera wideo, który zapewnia odtwarzanie tylko jednego klipu
        this.#videoManager = initializeVideoContainers();

        this.#navigator = new PagedClipsNavigator({
            container: document.querySelector('.clips-reel'),
            onPageChange: () => this.#videoManager.stopAll()
        });
    }

    #showErrorMessage(error) {
        const container = document.querySelector('.clips-reel');
        if (container) {
            container.innerHTML = `<div class="error-message">Error loading clips: ${error.message}</div>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const myClipsPage = new MyClipsPageManager();
    await myClipsPage.initialize();
});