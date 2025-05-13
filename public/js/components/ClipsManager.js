import { SELECTORS, CLASSES, MESSAGES, CLIP_SETTINGS } from '../core/constants.js';
import { createElement } from '../core/dom-utils.js';
import { callApi } from '../modules/api-client.js';

export class ClipsManager {
    constructor() {
        this.clips = [];
        this.container = document.querySelector(SELECTORS.CLIPS_REEL);
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.isLoading = false;
    }

    async loadClips() {
        this.isLoading = true;

        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'block';
        }

        try {
            const response = await fetch('/api/clips-api.php?action=get_clips');

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received data:', data);

            if (data.status === 'success') {
                if (data.clips && data.clips.length > 0) {
                    this.clips = data.clips;
                    return this.clips;
                } else if (data.data && data.data.clips && data.data.clips.length > 0) {
                    this.clips = data.data.clips;
                    return this.clips;
                }
            }

            console.log('No clips or data error:', data);
            return [];
        } catch (error) {
            console.error('Error loading clips:', error);
            this.showError(`Error loading clips: ${error.message}`);
            return [];
        } finally {
            this.isLoading = false;
            if (this.loadingIndicator) {
                this.loadingIndicator.style.display = 'none';
            }
        }
    }

    formatClipsIntoPages(clips, clipsPerPage = 6) {
        const pages = [];

        for (let i = 0; i < clips.length; i += clipsPerPage) {
            pages.push(clips.slice(i, i + clipsPerPage));
        }

        return pages;
    }

    generatePageElement(pageClips, pageIndex, clipsPerPage = 6) {
        const pageElement = document.createElement('div');
        pageElement.className = 'clips-page';

        pageClips.forEach((clip, clipIndex) => {
            if (!clip.id || !clip.name) {
                console.error('Clip without ID or name:', clip);
                return;
            }

            const globalIndex = pageIndex * clipsPerPage + clipIndex + 1;
            const clipElement = this.createClipElement(clip, globalIndex);
            pageElement.appendChild(clipElement);
        });

        return pageElement;
    }

    createClipElement(clip, index) {
        console.log(`Creating card for clip - Index: ${index}, ID: ${clip.id}, Name: "${clip.name}"`);

        const clipElement = document.createElement('div');
        clipElement.className = 'clip-card';
        clipElement.setAttribute('data-id', clip.id);
        clipElement.setAttribute('data-index', index);
        clipElement.setAttribute('data-name', clip.name);

        clipElement.innerHTML = `
      <div class="video-container" data-clip-id="${clip.id}" data-clip-index="${index}" data-clip-name="${clip.name}">
        <video loop preload="metadata" class="clip-video">
          <source src="/api/api-video.php?endpoint=wys&id=${encodeURIComponent(clip.name)}" type="video/mp4">
        </video>
        <div class="download-btn">Download</div>
      </div>
      <p class="quote">"${clip.name || 'No name'}"</p>
      <button class="delete-clip-btn" title="Delete this clip">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path>
        </svg>
        Delete
      </button>
    `;

        return clipElement;
    }

    renderClips() {
        if (!this.container) return;

        if (this.clips.length === 0) {
            this.showNoClipsMessage();
            return;
        }

        const pagesData = this.formatClipsIntoPages(this.clips);

        pagesData.forEach((pageClips, pageIndex) => {
            const pageElement = this.generatePageElement(pageClips, pageIndex);
            this.container.appendChild(pageElement);
        });

        return this.container.querySelectorAll('.clips-page');
    }

    setupDeleteButtons() {
        if (!this.container) return;

        console.log("Setting up delete button listeners...");

        this.container.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.delete-clip-btn');
            if (!deleteButton) return;

            e.stopPropagation();

            const clipCard = deleteButton.closest('.clip-card');
            const clipName = clipCard?.dataset.name;

            if (!clipName) {
                console.error('Unable to find clip name to delete.');
                alert('Error: Unable to identify clip.');
                return;
            }

            await this.deleteClip(clipName, clipCard, deleteButton);
        });
    }

    async deleteClip(clipName, clipCard, deleteButton) {
        if (!confirm(`Are you sure you want to delete the clip "${clipName}"? This action cannot be undone.`)) {
            console.log('Clip deletion canceled.');
            return;
        }

        console.log(`Starting deletion of clip: ${clipName}`);
        deleteButton.disabled = true;
        const originalButtonContent = deleteButton.innerHTML;
        deleteButton.innerHTML = 'Deleting...';

        try {
            const response = await callApi('uk', [clipName]);

            console.log('Delete API response:', response);

            if (response && (response.status === 'success' || response.code === 'clip_deleted')) {
                console.log(`Clip "${clipName}" deleted successfully.`);
                this.handleSuccessfulDelete(clipCard);
            } else {
                const errorMessage = response?.message || 'Unknown server error.';
                console.error(`Failed to delete clip "${clipName}": ${errorMessage}`);
                alert(`Failed to delete clip: ${errorMessage}`);

                deleteButton.disabled = false;
                deleteButton.innerHTML = originalButtonContent;
            }
        } catch (error) {
            console.error('Error during deletion operation:', error);
            alert(`Network or execution error during deletion: ${error.message}`);

            deleteButton.disabled = false;
            deleteButton.innerHTML = originalButtonContent;
        }
    }

    handleSuccessfulDelete(clipCard) {
        clipCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        clipCard.style.opacity = '0';
        clipCard.style.transform = 'scale(0.95) translateY(-10px)';

        setTimeout(() => {
            const page = clipCard.closest('.clips-page');
            clipCard.remove();

            if (page && page.querySelectorAll('.clip-card').length === 0) {
                console.log("Page is now empty.");
                page.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">This page is now empty.</p>';
            }
        }, 400);
    }

    showError(message) {
        if (!this.container) return;

        this.container.innerHTML = `<div class="error-message">${message}</div>`;
    }

    showNoClipsMessage() {
        if (!this.container) return;

        this.container.innerHTML = `
      <div class="no-clips-message">
        You don’t have any clips yet. Use the quote search to create your first clips!
      </div>
    `;
    }
}
