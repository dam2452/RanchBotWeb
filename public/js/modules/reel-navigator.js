import { isMobile, centerItem } from '../core/dom-utils.js';

export class ReelNavigator {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.items = Array.from(this.container.querySelectorAll('.reel-item'));
        this.activeIndex = 0;
        this.firstPlayedMuted = true;

        this.attachListeners();
        this.activate(0);

        // Add download buttons to each reel item
        this.items.forEach(item => {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = 'Download';

            downloadBtn.addEventListener('click', async (e) => {
                e.stopPropagation();

                const video = item.querySelector('video');
                if (!video) return;

                // Pobierz indeks klipu z atrybutu data-idx elementu rodzica
                const clipIndex = item.dataset.idx;

                if (clipIndex === undefined) {
                    console.error('Nie znaleziono indeksu klipu');
                    return;
                }

                try {
                    // Importujemy funkcję callApiForBlob z api-client.js
                    const { callApiForBlob } = await import('../modules/api-client.js');

                    // Pobieramy wideo bezpośrednio z API - tak samo jak w search-results.js
                    const blob = await callApiForBlob('w', [`${parseInt(clipIndex) + 1}`]);

                    // Tworzymy URL dla pobranego blob
                    const url = URL.createObjectURL(blob);

                    // Tworzymy link do pobrania
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `video_${parseInt(clipIndex) + 1}.mp4`;
                    document.body.appendChild(a);
                    a.click();

                    // Sprzątamy
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);

                } catch (error) {
                    console.error('Błąd podczas pobierania wideo:', error);
                    alert('Przepraszamy, wystąpił błąd podczas pobierania wideo.');
                }
            });

            item.appendChild(downloadBtn);
        });
    }

    activate(idx) {
        if (idx < 0 || idx >= this.items.length) return;
        const old = this.items[this.activeIndex];
        const newItem = this.items[idx];

        old.classList.remove('active');
        old.querySelector('video').pause();

        const vid = newItem.querySelector('video');
        newItem.classList.add('active');
        this.activeIndex = idx;

        if (idx === 0 && this.firstPlayedMuted) {
            vid.muted = true;
            vid.play();
        } else {
            vid.muted = false;
            vid.volume = 1;
            vid.currentTime = 0;
            vid.play();
            this.firstPlayedMuted = false;
        }

        centerItem(this.container, newItem);
    }

    handleClick(e) {
        const clicked = e.target.closest('.reel-item');
        const rect = this.container.getBoundingClientRect();

        if (clicked) {
            const idx = this.items.indexOf(clicked);
            const vid = clicked.querySelector('video');

            if (idx === this.activeIndex) {
                if (this.activeIndex === 0 && vid.muted) {
                    vid.muted = false;
                    vid.volume = 1;
                    this.firstPlayedMuted = false;
                } else {
                    vid.paused ? vid.play() : vid.pause();
                }
            } else {
                this.activate(idx);
            }
        } else {
            const y = e.clientY - rect.top;
            const x = e.clientX - rect.left;
            const next = isMobile() ? (y > rect.height / 2) : (x > rect.width / 2);
            this.activate(this.activeIndex + (next ? 1 : -1));
        }
    }

    handleKey(e) {
        if (!isMobile()) {
            if (e.key === 'ArrowRight') this.activate(this.activeIndex + 1);
            if (e.key === 'ArrowLeft')  this.activate(this.activeIndex - 1);
        } else {
            if (e.key === 'ArrowDown') this.activate(this.activeIndex + 1);
            if (e.key === 'ArrowUp')   this.activate(this.activeIndex - 1);
        }
    }

    attachListeners() {
        this.container.addEventListener('click', e => this.handleClick(e));
        window.addEventListener('keydown', e => this.handleKey(e));
        window.matchMedia('(max-width:850px)').addEventListener('change', () => {
            centerItem(this.container, this.items[this.activeIndex]);
        });
    }

    refresh() {
        this.items = Array.from(this.container.querySelectorAll('.reel-item'));

        // Add download buttons to each reel item
        this.items.forEach(item => {
            if (!item.querySelector('.download-btn')) {
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-btn';
                downloadBtn.textContent = 'Download';

                downloadBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();

                    const video = item.querySelector('video');
                    if (!video) return;

                    // Pobierz indeks klipu z atrybutu data-idx elementu rodzica
                    const clipIndex = item.dataset.idx;

                    if (clipIndex === undefined) {
                        console.error('Nie znaleziono indeksu klipu');
                        return;
                    }

                    try {
                        // Importujemy funkcję callApiForBlob z api-client.js
                        const { callApiForBlob } = await import('../modules/api-client.js');

                        // Pobieramy wideo bezpośrednio z API - tak samo jak w search-results.js
                        const blob = await callApiForBlob('w', [`${parseInt(clipIndex) + 1}`]);

                        // Tworzymy URL dla pobranego blob
                        const url = URL.createObjectURL(blob);

                        // Tworzymy link do pobrania
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `video_${parseInt(clipIndex) + 1}.mp4`;
                        document.body.appendChild(a);
                        a.click();

                        // Sprzątamy
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        }, 100);

                    } catch (error) {
                        console.error('Błąd podczas pobierania wideo:', error);
                        alert('Przepraszamy, wystąpił błąd podczas pobierania wideo.');
                    }
                });

                item.appendChild(downloadBtn);
            }
        });
    }
}

// Pomocnicza funkcja do dodawania przycisków pobierania
export function addDownloadButtons() {
    // Find all reel items
    const reelItems = document.querySelectorAll('.reel-item');

    reelItems.forEach(item => {
        // Create download button if it doesn't exist yet
        if (!item.querySelector('.download-btn')) {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = 'Download';

            // Add download functionality
            downloadBtn.addEventListener('click', async (e) => {
                e.stopPropagation();

                const video = item.querySelector('video');
                if (!video) return;

                // Pobierz indeks klipu z atrybutu data-idx elementu rodzica
                const clipIndex = item.dataset.idx;

                if (clipIndex === undefined) {
                    console.error('Nie znaleziono indeksu klipu');
                    return;
                }

                try {
                    // Importujemy funkcję callApiForBlob z api-client.js
                    const { callApiForBlob } = await import('../modules/api-client.js');

                    // Pobieramy wideo bezpośrednio z API - tak samo jak w search-results.js
                    const blob = await callApiForBlob('w', [`${parseInt(clipIndex) + 1}`]);

                    // Tworzymy URL dla pobranego blob
                    const url = URL.createObjectURL(blob);

                    // Tworzymy link do pobrania
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `video_${parseInt(clipIndex) + 1}.mp4`;
                    document.body.appendChild(a);
                    a.click();

                    // Sprzątamy
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);

                } catch (error) {
                    console.error('Błąd podczas pobierania wideo:', error);
                    alert('Przepraszamy, wystąpił błąd podczas pobierania wideo.');
                }
            });

            // Add to the reel item
            item.appendChild(downloadBtn);
        }
    });
}

// Funkcja do aktualizacji klasy ReelNavigator
export function patchReelNavigator() {
    // Find the original ReelNavigator class
    const originalRefresh = ReelNavigator.prototype.refresh;

    // Patch the refresh method to add download buttons
    ReelNavigator.prototype.refresh = function() {
        // Call the original refresh method first
        originalRefresh.call(this);

        // Then add download buttons
        addDownloadButtons();
    };

    // Also patch the constructor to add download buttons on initialization
    const originalConstructor = ReelNavigator.prototype.constructor;

    ReelNavigator.prototype.constructor = function(containerSelector) {
        // Call the original constructor
        originalConstructor.call(this, containerSelector);

        // Add download buttons
        addDownloadButtons();
    };
}