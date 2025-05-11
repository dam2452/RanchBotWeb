import { callApi, callApiForBlob } from '../modules/api-client.js';
import { ReelNavigator } from '../modules/reel-navigator.js';

let loadedClips = 0;
let allResults = [];
let observer;
let loading = false;
let done = false;

async function loadNextClips(batchSize = 3) {
    if (loading || done) return;
    loading = true;

    const reel = document.querySelector('.video-reel');

    for (let i = loadedClips; i < loadedClips + batchSize; i++) {
        const item = allResults[i];
        if (!item) {
            done = true;
            break;
        }

        try {
            const blob = await callApiForBlob('w', [`${i + 1}`]); // 1-indexed
            const url = URL.createObjectURL(blob);

            const el = document.createElement('div');
            el.className = 'reel-item';
            el.dataset.idx = i;
            el.innerHTML = `
                <video ${i === 0 ? 'autoplay muted' : ''} loop preload="metadata">
                    <source src="${url}" type="video/mp4">
                </video>`;
            reel.appendChild(el);
        } catch (e) {
            console.error(`Error loading clip ${i + 1}:`, e);
        }
    }

    loadedClips += batchSize;
    setupIntersectionObserver(); // reset watcher na ostatni klip
    loading = false;
}

function setupIntersectionObserver() {
    if (observer) observer.disconnect();

    const reel = document.querySelector('.video-reel');
    const items = reel.querySelectorAll('.reel-item');
    const lastItem = items[items.length - 1];

    if (!lastItem) return;

    observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) loadNextClips();
    }, { rootMargin: '100px' });

    observer.observe(lastItem);
}

document.addEventListener('DOMContentLoaded', async () => {
    const query = new URLSearchParams(location.search).get('query');
    if (!query) return;

    const reel = document.querySelector('.video-reel');
    if (!reel) return;

    try {
        const { results } = await callApi('sz', [query]).then(d => d.data);
        allResults = results;

        reel.innerHTML = ''; // usuń placeholdery
        await loadNextClips(); // pierwsze 3 klipy
        new ReelNavigator('.video-reel');
    } catch (err) {
        console.error(err);
        reel.innerHTML = `<p>${err.message}</p>`;
    }
});
