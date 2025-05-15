import { addSearchNavigationButton } from '../components/SearchNavigationButton.js';
import { ClipsManager } from '../components/ClipsManager.js';
import { PagedClipsNavigator } from '../components/PagedClipsNavigator.js';
import { initializeVideoContainers } from '../components/VideoContainer.js';

class MyClipsPageManager {
    #pageContainer;
    #clipsManager;
    #navigator;
    #videoManager;

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
        addSearchNavigationButton(this.#pageContainer);
        this.#clipsManager = new ClipsManager();
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