import { callApi, callApiForBlob } from '../modules/api-client.js';
console.log("[DEBUG] JS działa");

document.addEventListener('DOMContentLoaded', () => {
    const form  = document.querySelector('#searchForm');
    const input = document.querySelector('#quoteInput');
    if (!form || !input) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const q = input.value.trim();
        if (!q) return;
        window.location.href = `search-results.php?query=${encodeURIComponent(q)}`;
    });
});



    function renderResults(results) {
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

    async function selectClip(e) {
        const index = e.target.dataset.index;
        console.log(`[DEBUG] Wybrano klip: ${index}`);

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
