import { SELECTORS, CLASSES, MESSAGES, CLIP_SETTINGS } from '../core/constants.js';
import { createElement } from '../core/dom-utils.js';
import { callApi } from '../modules/api-client.js';
import { getIconHTML, getIconPath } from '../core/icon-utils.js';

export class ClipsManager {
    #clips = [];
    #container;
    #loadingIndicator;
    #isLoading = false;

    constructor() {
        this.#container = document.querySelector(SELECTORS.CLIPS_REEL);
        this.#loadingIndicator = document.getElementById('loading-indicator');
    }

    get clips() {
        return this.#clips;
    }

    get isLoading() {
        return this.#isLoading;
    }

    async loadClips() {
        this.#setLoading(true);

        try {
            const data = await this.#fetchClipsData();
            this.#processClipsData(data);
            return this.#clips;
        } catch (error) {
            console.error('Error loading clips:', error);
            this.#showError(`Error loading clips: ${error.message}`);
            return [];
        } finally {
            this.#setLoading(false);
        }
    }

    renderClips() {
        if (!this.#container) return;

        if (this.#clips.length === 0) {
            this.#showNoClipsMessage();
            return;
        }

        const pagesData = this.#formatClipsIntoPages(this.#clips);
        this.#renderClipPages(pagesData);

        return this.#container.querySelectorAll('.clips-page');
    }

    setupDeleteButtons() {
        if (!this.#container) return;

        console.log("Setting up delete button listeners...");
        this.#container.addEventListener('click', this.#handleDeleteButtonClick.bind(this));
    }

    #setLoading(isLoading) {
        this.#isLoading = isLoading;

        if (this.#loadingIndicator) {
            this.#loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    }

    async #fetchClipsData() {
        const response = await fetch('/api/clips-api.php?action=get_clips');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    }

    #processClipsData(data) {
        console.log('Received data:', data);

        if (data.status === 'success') {
            if (data.clips && data.clips.length > 0) {
                this.#clips = data.clips;
            } else if (data.data && data.data.clips && data.data.clips.length > 0) {
                this.#clips = data.data.clips;
            } else {
                console.log('No clips or data error:', data);
                this.#clips = [];
            }
        } else {
            console.log('API returned an error status:', data);
            this.#clips = [];
        }
    }

    #formatClipsIntoPages(clips, clipsPerPage = 6) {
        const pages = [];

        for (let i = 0; i < clips.length; i += clipsPerPage) {
            pages.push(clips.slice(i, i + clipsPerPage));
        }

        return pages;
    }

    #renderClipPages(pagesData) {
        pagesData.forEach((pageClips, pageIndex) => {
            const pageElement = this.#generatePageElement(pageClips, pageIndex);
            this.#container.appendChild(pageElement);
        });
    }

    #generatePageElement(pageClips, pageIndex, clipsPerPage = 6) {
        const pageElement = document.createElement('div');
        pageElement.className = 'clips-page';

        pageClips.forEach((clip, clipIndex) => {
            if (!this.#isValidClip(clip)) {
                return;
            }

            const globalIndex = pageIndex * clipsPerPage + clipIndex + 1;
            const clipElement = this.#createClipElement(clip, globalIndex);
            pageElement.appendChild(clipElement);
        });

        return pageElement;
    }

    #isValidClip(clip) {
        if (!clip.id || !clip.name) {
            console.error('Clip without ID or name:', clip);
            return false;
        }
        return true;
    }

    #createClipElement(clip, index) {
        console.log(`Creating card for clip - Index: ${index}, ID: ${clip.id}, Name: "${clip.name}"`);

        const clipElement = document.createElement('div');
        clipElement.className = 'clip-card';
        clipElement.setAttribute('data-id', clip.id);
        clipElement.setAttribute('data-index', index);
        clipElement.setAttribute('data-name', clip.name);

        clipElement.innerHTML = this.#getClipElementHtml(clip, index);

        return clipElement;
    }

    #getClipElementHtml(clip, index) {
        const downloadIconPath = getIconPath('DOWNLOAD');
        const deleteIconPath = getIconPath('DELETE');

        return `
            <div class="video-container" data-clip-id="${clip.id}" data-clip-index="${index}" data-clip-name="${clip.name}">
                <video loop preload="metadata" class="clip-video">
                    <source src="/api/api-video.php?endpoint=wys&id=${encodeURIComponent(clip.name)}" type="video/mp4">
                </video>
                <div class="download-btn" style="background-image: url('${downloadIconPath}'); background-repeat: no-repeat; background-position: 8px center; background-size: 16px; padding-left: 30px;">
                    Download
                </div>
            </div>
            <p class="quote">"${clip.name || 'No name'}"</p>
            <button class="delete-clip-btn" title="Delete this clip" style="background-image: url('${deleteIconPath}'); background-repeat: no-repeat; background-position: 8px center; background-size: 16px; padding-left: 30px;">
                Delete
            </button>
        `;
    }

    #handleDeleteButtonClick = async (e) => {
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

        await this.#deleteClip(clipName, clipCard, deleteButton);
    }

    async #deleteClip(clipName, clipCard, deleteButton) {
        if (!this.#confirmDeletion(clipName)) {
            return;
        }

        console.log(`Starting deletion of clip: ${clipName}`);
        const originalButtonContent = this.#disableDeleteButton(deleteButton);

        try {
            const response = await callApi('uk', [clipName]);
            this.#processDeleteResponse(response, clipName, clipCard, deleteButton, originalButtonContent);
        } catch (error) {
            this.#handleDeleteError(error, deleteButton, originalButtonContent);
        }
    }

    #confirmDeletion(clipName) {
        return confirm(`Are you sure you want to delete the clip "${clipName}"? This action cannot be undone.`);
    }

    #disableDeleteButton(deleteButton) {
        const originalButtonContent = deleteButton.innerHTML;
        deleteButton.disabled = true;
        deleteButton.innerHTML = 'Deleting...';
        deleteButton.style.backgroundImage = 'none';
        return originalButtonContent;
    }

    #processDeleteResponse(response, clipName, clipCard, deleteButton, originalButtonContent) {
        console.log('Delete API response:', response);

        if (response && (response.status === 'success' || response.code === 'clip_deleted')) {
            console.log(`Clip "${clipName}" deleted successfully.`);
            this.#handleSuccessfulDelete(clipCard);
        } else {
            const errorMessage = response?.message || 'Unknown server error.';
            console.error(`Failed to delete clip "${clipName}": ${errorMessage}`);
            alert(`Failed to delete clip: ${errorMessage}`);

            this.#resetDeleteButton(deleteButton, originalButtonContent);
        }
    }

    #handleDeleteError(error, deleteButton, originalButtonContent) {
        console.error('Error during deletion operation:', error);
        alert(`Network or execution error during deletion: ${error.message}`);
        this.#resetDeleteButton(deleteButton, originalButtonContent);
    }

    #resetDeleteButton(deleteButton, originalButtonContent) {
        deleteButton.disabled = false;
        deleteButton.innerHTML = originalButtonContent;
    }

    #handleSuccessfulDelete(clipCard) {
        this.#animateClipRemoval(clipCard);

        setTimeout(() => {
            const page = clipCard.closest('.clips-page');
            clipCard.remove();
            this.#checkEmptyPage(page);
        }, 400);
    }

    #animateClipRemoval(clipCard) {
        clipCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        clipCard.style.opacity = '0';
        clipCard.style.transform = 'scale(0.95) translateY(-10px)';
    }

    #checkEmptyPage(page) {
        if (page && page.querySelectorAll('.clip-card').length === 0) {
            console.log("Page is now empty.");
            page.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">This page is now empty.</p>';
        }
    }

    #showError(message) {
        if (!this.#container) return;

        this.#container.innerHTML = `<div class="error-message">${message}</div>`;
    }

    #showNoClipsMessage() {
        if (!this.#container) return;

        this.#container.innerHTML = `
            <div class="no-clips-message">
                You don't have any clips yet. Use the quote search to create your first clips!
            </div>
        `;
    }
}