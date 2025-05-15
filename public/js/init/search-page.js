import { callApiForBlob } from '../modules/api-client.js';

class SearchPageManager {
    initialize() {
        console.log("[DEBUG] JS is working");
        this.#initializeSearchForm();
    }

    #initializeSearchForm() {
        const form = document.querySelector('#searchForm');
        const input = document.querySelector('#quoteInput');

        if (!form || !input) return;

        form.addEventListener('submit', e => {
            e.preventDefault();

            const query = input.value.trim();
            if (!query) return;

            window.location.href = `search-results?query=${encodeURIComponent(query)}`;
        });
    }

    renderResults(results) {
        const resultsContainer = document.getElementById('resultsContainer');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';

        if (!Array.isArray(results) || results.length === 0) {
            resultsContainer.textContent = 'No results found.';
            return;
        }

        results.forEach((result, idx) => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <p>${idx + 1}. ${result.text} 
                <small>(S${result.episode_info.season}E${result.episode_info.episode_number})</small></p>
                <button class="clip-btn" data-index="${idx + 1}">Select</button>
            `;
            resultsContainer.appendChild(item);
        });

        document.querySelectorAll('.clip-btn').forEach(btn =>
            btn.addEventListener('click', e => this.#handleClipSelect(e))
        );
    }

    async #handleClipSelect(e) {
        const index = e.target.dataset.index;
        console.log(`[DEBUG] Selected clip: ${index}`);

        const videoContainer = document.getElementById('videoContainer');
        if (!videoContainer) return;

        try {
            const blob = await callApiForBlob('w', [index]);
            const url = URL.createObjectURL(blob);

            videoContainer.innerHTML = `
                <video controls autoplay src="${url}" width="640"></video>
            `;
        } catch (error) {
            alert("Error while fetching the clip: " + error.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchPage = new SearchPageManager();
    searchPage.initialize();
});