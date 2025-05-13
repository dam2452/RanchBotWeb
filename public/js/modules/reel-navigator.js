import { isMobile, centerItem, downloadBlob } from '../core/dom-utils.js';
import { CLASSES, SELECTORS, MESSAGES } from '../core/constants.js';
import { getVideo } from './api-client.js';
import { createDownloadButton } from './video-utils.js';

export class ReelNavigator {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.items = Array.from(this.container.querySelectorAll(SELECTORS.REEL_ITEM));
        this.activeIndex = 0;
        this.firstPlayedMuted = true;
        this.videoCache = {};

        this.attachListeners();
        this.addDownloadButtons();
        this.activate(0);
    }

    addDownloadButtons() {
        this.items.forEach(item => {
            if (!item.querySelector(SELECTORS.DOWNLOAD_BUTTON)) {
                const clipIndex = item.dataset.idx;
                const downloadBtn = createDownloadButton(async () => {
                    await this.handleDownload(clipIndex);
                });

                item.appendChild(downloadBtn);
            }
        });
    }

    activate(idx) {
        if (idx < 0 || idx >= this.items.length) return;

        const oldItem = this.items[this.activeIndex];
        oldItem.classList.remove(CLASSES.ACTIVE);
        oldItem.querySelector('video').pause();

        const newItem = this.items[idx];
        const vid = newItem.querySelector('video');
        newItem.classList.add(CLASSES.ACTIVE);
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
        const clicked = e.target.closest(SELECTORS.REEL_ITEM);
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
        window.matchMedia(`(max-width:${850}px)`).addEventListener('change', () => {
            centerItem(this.container, this.items[this.activeIndex]);
        });
    }

    async handleDownload(clipIndex) {
        if (clipIndex === undefined) {
            console.error(MESSAGES.CLIP_ID_NOT_FOUND);
            return;
        }

        try {
            const blob = await getVideo(parseInt(clipIndex) + 1);
            downloadBlob(blob, `video_${parseInt(clipIndex) + 1}.mp4`);
        } catch (error) {
            console.error('Error during video download:', error);
            throw error;
        }
    }

    refresh() {
        this.items = Array.from(this.container.querySelectorAll(SELECTORS.REEL_ITEM));
        this.addDownloadButtons();
    }
}

export function addDownloadButtons() {
    const reelItems = document.querySelectorAll(SELECTORS.REEL_ITEM);

    reelItems.forEach(item => {
        if (!item.querySelector(SELECTORS.DOWNLOAD_BUTTON)) {
            const clipIndex = item.dataset.idx;

            const downloadBtn = createDownloadButton(async (e) => {
                e.stopPropagation();

                if (clipIndex === undefined) {
                    console.error(MESSAGES.CLIP_ID_NOT_FOUND);
                    return;
                }

                try {
                    const blob = await getVideo(parseInt(clipIndex) + 1);
                    downloadBlob(blob, `video_${parseInt(clipIndex) + 1}.mp4`);
                } catch (error) {
                    console.error('Error during video download:', error);
                    throw error;
                }
            });

            item.appendChild(downloadBtn);
        }
    });
}

export function patchReelNavigator() {
    const originalRefresh = ReelNavigator.prototype.refresh;
    const originalConstructor = ReelNavigator.prototype.constructor;

    ReelNavigator.prototype.refresh = function() {
        originalRefresh.call(this);
        addDownloadButtons();
    };

    ReelNavigator.prototype.constructor = function(containerSelector) {
        originalConstructor.call(this, containerSelector);
        addDownloadButtons();
    };
}
