// public/js/init/my-clips.js

import { addSearchNavigationButton } from '../components/SearchNavigationButton.js';
import { ClipsManager } from '../components/ClipsManager.js';
import { PagedClipsNavigator } from '../components/PagedClipsNavigator.js';
import { initializeVideoContainers } from '../components/VideoContainer.js';

/**
 * Initialize the My Clips page
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicjalizacja strony My Clips');

    // Get page container
    const pageContainer = document.querySelector('.my-clips-page');

    // Add search navigation button
    addSearchNavigationButton(pageContainer);

    // Initialize clips manager
    const clipsManager = new ClipsManager();

    try {
        // Load clips data
        await clipsManager.loadClips();

        // Render clips to the DOM
        const pages = clipsManager.renderClips();

        // If we have clips pages, initialize navigation and playback
        if (pages && pages.length > 0) {
            // Initialize clips navigation
            const videoManager = initializeVideoContainers();

            // Initialize paged navigation
            const navigator = new PagedClipsNavigator({
                container: document.querySelector('.clips-reel'),
                onPageChange: () => videoManager.stopAll()
            });

            // Set up delete buttons
            clipsManager.setupDeleteButtons();
        }
    } catch (error) {
        console.error('Error initializing My Clips page:', error);
    }
});