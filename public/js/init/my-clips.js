import { addSearchNavigationButton } from '../components/SearchNavigationButton.js';
import { ClipsManager } from '../components/ClipsManager.js';
import { PagedClipsNavigator } from '../components/PagedClipsNavigator.js';
import { initializeVideoContainers } from '../components/VideoContainer.js';

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing My Clips page');

    const pageContainer = document.querySelector('.my-clips-page');

    addSearchNavigationButton(pageContainer);

    const clipsManager = new ClipsManager();

    try {
        await clipsManager.loadClips();

        const pages = clipsManager.renderClips();

        if (pages && pages.length > 0) {
            const videoManager = initializeVideoContainers();

            const navigator = new PagedClipsNavigator({
                container: document.querySelector('.clips-reel'),
                onPageChange: () => videoManager.stopAll()
            });

            clipsManager.setupDeleteButtons();
        }
    } catch (error) {
        console.error('Error initializing My Clips page:', error);
    }
});
