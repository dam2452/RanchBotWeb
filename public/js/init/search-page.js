import { ReelNavigator } from '../modules/reel-navigator.js';

window.addEventListener('DOMContentLoaded', () => {
    new ReelNavigator('.video-reel');

    const q = new URLSearchParams(location.search).get('q');
    if (q) document.getElementById('query-input').value = q;
});
