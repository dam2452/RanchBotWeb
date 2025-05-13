// public/js/components/ClipsManager.js

import { callApi } from '../modules/api-client.js';

/**
 * ClipsManager - Handles clip data loading and deletion
 */
export class ClipsManager {
    constructor() {
        this.clips = [];
        this.container = document.querySelector('.clips-reel');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.isLoading = false;
    }

    /**
     * Load clips from the API
     */
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
            console.log('Otrzymane dane:', data);

            if (data.status === 'success' && data.clips && data.clips.length > 0) {
                this.clips = data.clips;
                return this.clips;
            } else {
                console.log('Brak klipów lub błąd w danych:', data);
                return [];
            }
        } catch (error) {
            console.error('Error loading clips:', error);
            this.showError(`Wystąpił błąd podczas ładowania klipów: ${error.message}`);
            return [];
        } finally {
            this.isLoading = false;
            if (this.loadingIndicator) {
                this.loadingIndicator.style.display = 'none';
            }
        }
    }

    /**
     * Format clips into pages
     * @param {Array} clips - Array of clip objects
     * @param {Number} clipsPerPage - Number of clips per page
     * @returns {Array} Array of pages with clips
     */
    formatClipsIntoPages(clips, clipsPerPage = 6) {
        const pages = [];

        for (let i = 0; i < clips.length; i += clipsPerPage) {
            pages.push(clips.slice(i, i + clipsPerPage));
        }

        return pages;
    }

    /**
     * Generate HTML for a page of clips
     * @param {Array} pageClips - Clips for a single page
     * @param {Number} pageIndex - Index of the page
     * @returns {HTMLElement} Page element with clips
     */
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

    /**
     * Create HTML element for a single clip
     * @param {Object} clip - Clip data
     * @param {Number} index - Global index of the clip
     * @returns {HTMLElement} Clip card element
     */
    createClipElement(clip, index) {
        console.log(`Tworzenie karty dla klipu - Indeks: ${index}, ID: ${clip.id}, nazwa: "${clip.name}"`);

        const clipElement = document.createElement('div');
        clipElement.className = 'clip-card';
        clipElement.setAttribute('data-id', clip.id);
        clipElement.setAttribute('data-index', index);
        clipElement.setAttribute('data-name', clip.name);

        clipElement.innerHTML = `
      <div class="video-container" data-clip-id="${clip.id}" data-clip-index="${index}" data-clip-name="${clip.name}">
        <video loop preload="metadata" class="clip-video">
          <source src="/debug-video.php?id=${encodeURIComponent(clip.name)}" type="video/mp4">
        </video>
        <div class="download-btn">Pobierz</div>
      </div>
      <p class="quote">"${clip.name || 'Bez nazwy'}"</p>
      <button class="delete-clip-btn" title="Usuń ten klip">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path>
        </svg>
        Usuń
      </button>
    `;

        return clipElement;
    }

    /**
     * Render clips to the container
     */
    renderClips() {
        if (!this.container) return;

        if (this.clips.length === 0) {
            this.showNoClipsMessage();
            return;
        }

        // Format clips into pages
        const pagesData = this.formatClipsIntoPages(this.clips);

        // Generate HTML for each page
        pagesData.forEach((pageClips, pageIndex) => {
            const pageElement = this.generatePageElement(pageClips, pageIndex);
            this.container.appendChild(pageElement);
        });

        return this.container.querySelectorAll('.clips-page');
    }

    /**
     * Set up delete button functionality
     */
    setupDeleteButtons() {
        if (!this.container) return;

        console.log("Ustawianie nasłuchiwaczy dla przycisków usuwania...");

        this.container.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.delete-clip-btn');
            if (!deleteButton) return;

            e.stopPropagation();

            const clipCard = deleteButton.closest('.clip-card');
            const clipName = clipCard?.dataset.name;

            if (!clipName) {
                console.error('Nie można znaleźć nazwy klipu do usunięcia.');
                alert('Wystąpił błąd: Nie można zidentyfikować klipu.');
                return;
            }

            await this.deleteClip(clipName, clipCard, deleteButton);
        });
    }

    /**
     * Delete a clip
     * @param {String} clipName - Name of the clip to delete
     * @param {HTMLElement} clipCard - Card element of the clip
     * @param {HTMLElement} deleteButton - Delete button element
     */
    async deleteClip(clipName, clipCard, deleteButton) {
        if (!confirm(`Czy na pewno chcesz usunąć klip "${clipName}"? Tej operacji nie można cofnąć.`)) {
            console.log('Anulowano usuwanie klipu.');
            return;
        }

        console.log(`Rozpoczęcie usuwania klipu: ${clipName}`);
        deleteButton.disabled = true;
        const originalButtonContent = deleteButton.innerHTML;
        deleteButton.innerHTML = 'Usuwanie...';

        try {
            const response = await callApi('uk', [clipName]);

            console.log('Odpowiedź API usuwania:', response);

            if (response && (response.status === 'success' || response.code === 'clip_deleted')) {
                console.log(`Klip "${clipName}" usunięty pomyślnie.`);
                this.handleSuccessfulDelete(clipCard);
            } else {
                const errorMessage = response?.message || 'Nieznany błąd serwera.';
                console.error(`Nie udało się usunąć klipu "${clipName}": ${errorMessage}`);
                alert(`Nie udało się usunąć klipu: ${errorMessage}`);

                deleteButton.disabled = false;
                deleteButton.innerHTML = originalButtonContent;
            }
        } catch (error) {
            console.error('Błąd podczas operacji usuwania:', error);
            alert(`Wystąpił błąd sieci lub wykonania podczas usuwania: ${error.message}`);

            deleteButton.disabled = false;
            deleteButton.innerHTML = originalButtonContent;
        }
    }

    /**
     * Handle successful clip deletion
     * @param {HTMLElement} clipCard - Card element of the deleted clip
     */
    handleSuccessfulDelete(clipCard) {
        clipCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        clipCard.style.opacity = '0';
        clipCard.style.transform = 'scale(0.95) translateY(-10px)';

        setTimeout(() => {
            const page = clipCard.closest('.clips-page');
            clipCard.remove();

            // Check if the page is now empty
            if (page && page.querySelectorAll('.clip-card').length === 0) {
                console.log("Strona została opróżniona.");
                page.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">Ta strona jest teraz pusta.</p>';
            }
        }, 400);
    }

    /**
     * Show error message
     * @param {String} message - Error message to show
     */
    showError(message) {
        if (!this.container) return;

        this.container.innerHTML = `<div class="error-message">${message}</div>`;
    }

    /**
     * Show message when no clips are available
     */
    showNoClipsMessage() {
        if (!this.container) return;

        this.container.innerHTML = `
      <div class="no-clips-message">
        Nie masz jeszcze żadnych klipów. Użyj wyszukiwarki cytatów, aby stworzyć swoje pierwsze klipy!
      </div>
    `;
    }
}