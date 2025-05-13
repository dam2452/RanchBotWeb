// public/js/init/search-page.js

import { callApiForBlob } from '../modules/api-client.js';

/**
 * Initialize search page
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG] JS działa");

    // Set up search form handling
    initializeSearchForm();
});

/**
 * Initialize the search form
 */
function initializeSearchForm() {
    const form = document.querySelector('#searchForm');
    const input = document.querySelector('#quoteInput');

    if (!form || !input) return;

    form.addEventListener('submit', e => {
        e.preventDefault();

        const query = input.value.trim();
        if (!query) return;

        // Redirect to results page with query
        window.location.href = `search-results?query=${encodeURIComponent(query)}`;
    });
}

/**
 * Render search results
 * Note: This function is not currently used but kept for reference
 * @param {Array} results - Search results
 */
function renderResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';

    if (!Array.isArray(results) || results.length === 0) {
        resultsContainer.textContent = 'Brak wyników.';
        return;
    }

    results.forEach((result, idx) => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
      <p>${idx + 1}. ${result.text} 
      <small>(S${result.episode_info.season}E${result.episode_info.episode_number})</small></p>
      <button class="clip-btn" data-index="${idx + 1}">Wybierz</button>
    `;
        resultsContainer.appendChild(item);
    });

    document.querySelectorAll('.clip-btn').forEach(btn =>
        btn.addEventListener('click', selectClip)
    );
}

/**
 * Handle clip selection
 * Note: This function is not currently used but kept for reference
 * @param {Event} e - Click event
 */
async function selectClip(e) {
    const index = e.target.dataset.index;
    console.log(`[DEBUG] Wybrano klip: ${index}`);

    const videoContainer = document.getElementById('videoContainer');
    if (!videoContainer) return;

    try {
        const blob = await callApiForBlob('w', [index]);
        const url = URL.createObjectURL(blob);

        videoContainer.innerHTML = `
      <video controls autoplay src="${url}" width="640"></video>
    `;
    } catch (error) {
        alert("Błąd przy pobieraniu klipu: " + error.message);
    }
}