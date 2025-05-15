import { isMobile, centerItem, downloadBlob } from '../core/dom-utils.js';
import { CLASSES, SELECTORS, MESSAGES } from '../core/constants.js';
import { getVideo } from './api-client.js';
import { createDownloadButton } from './video-utils.js';

const userPausedMap = new WeakMap();

export class ReelNavigator {
    #container;
    #items;
    #activeIndex;
    #videoCache;
    #scrollDebounceTimeout;
    #keyDebounceTimeout;
    #scrollAnimationTimeout;
    #lastKeyPressTime;
    #keyLocked;
    #isScrolling;
    #scrollAnimationDuration;
    #blockingOverlay;

    constructor(containerSelector) {
        this.#container = document.querySelector(containerSelector);
        this.#items = Array.from(this.#container.querySelectorAll(SELECTORS.REEL_ITEM));
        this.#activeIndex = 0;
        this.#videoCache = {};
        this.#scrollDebounceTimeout = null;
        this.#keyDebounceTimeout = null;
        this.#scrollAnimationTimeout = null;
        this.#lastKeyPressTime = 0;
        this.#keyLocked = false;
        this.#isScrolling = false;
        this.#scrollAnimationDuration = 600;
        this.#blockingOverlay = null;

        this.#setupBlockingOverlay();
        this.#attachListeners();
        this.#addDownloadButtons();
        this.activate(0, true);
    }

    get items() { return this.#items; }
    get container() { return this.#container; }
    get activeIndex() { return this.#activeIndex; }
    get isScrolling() { return this.#isScrolling; }

    #setupBlockingOverlay() {
        this.#blockingOverlay = document.createElement('div');
        this.#blockingOverlay.className = 'video-interaction-blocker';
        this.#blockingOverlay.style.cssText =
            'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;display:none;cursor:auto;';
        document.body.appendChild(this.#blockingOverlay);
    }

    #attachListeners() {
        this.#container.addEventListener('scroll', () => {
            clearTimeout(this.#scrollDebounceTimeout);
            this.#scrollDebounceTimeout = setTimeout(() => {
                const idx = this.#getMostCenteredItemIndex();
                if (idx !== this.#activeIndex) {
                    this.activate(idx, true);
                }
            }, 100);
        });
        this.#container.addEventListener('click', e => this.#handleClick(e));
        this.#container.addEventListener('wheel', this.#handleWheel.bind(this), { passive: false });
        window.addEventListener('keydown', e => this.#handleKey(e));
        window.addEventListener('resize', () => this.centerActiveItem());
    }

    #addDownloadButtons() {
        this.#items.forEach(item => {
            if (!item.querySelector(SELECTORS.DOWNLOAD_BUTTON)) {
                const clipIndex = item.dataset.idx;
                const downloadBtn = createDownloadButton(async () => {
                    await this.handleDownload(clipIndex);
                });

                let topRight = item.querySelector('.download-btn-container-top-right');
                if (!topRight) {
                    topRight = document.createElement('div');
                    topRight.className = 'download-btn-container-top-right';
                    topRight.style.position = 'absolute';
                    topRight.style.top = '8px';
                    topRight.style.right = '8px';
                    topRight.style.zIndex = '10';
                    item.style.position = 'relative';
                    item.appendChild(topRight);
                }
                topRight.appendChild(downloadBtn);
            }
        });
    }

    #getMostCenteredItemIndex() {
        const centerX = this.#container.getBoundingClientRect().left + this.#container.offsetWidth / 2;
        let minDist = Infinity, bestIdx = 0;
        this.#items.forEach((item, i) => {
            const box = item.getBoundingClientRect();
            const itemCenter = box.left + box.width / 2;
            const dist = Math.abs(centerX - itemCenter);
            if (dist < minDist) { minDist = dist; bestIdx = i; }
        });
        return bestIdx;
    }

    #pauseAllExcept(idx) {
        this.#items.forEach((item, i) => {
            const vid = item.querySelector('video');
            item.classList.remove(CLASSES.ACTIVE);
            if (vid) {
                vid.pause();
                vid.muted = true;
                if (userPausedMap.has(vid) && i !== idx) {
                    userPausedMap.delete(vid);
                }
            }
        });
    }

    #updateUserPausedState(vid, paused) {
        if (vid) {
            userPausedMap.set(vid, paused);
        }
    }

    activate(idx, forcePlay = true) {
        if (idx < 0 || idx >= this.#items.length) return;
        const isSameItem = idx === this.#activeIndex;
        this.#enableInteractionBlock();
        this.#isScrolling = true;

        this.#pauseAllExcept(idx);

        const item = this.#items[idx];
        const vid = item.querySelector('video');
        item.classList.add(CLASSES.ACTIVE);
        this.#activeIndex = idx;
        this.centerActiveItem();

        clearTimeout(this.#scrollAnimationTimeout);
        this.#scrollAnimationTimeout = setTimeout(() => {
            this.#isScrolling = false;
            this.#disableInteractionBlock();

            if (vid) {
                vid.muted = false;
                vid.volume = 1;
                if (!isSameItem) {
                    vid.currentTime = 0;
                }
                if (forcePlay && !userPausedMap.get(vid)) {
                    vid.play().catch(() => {
                        vid.muted = true;
                        vid.play().catch(() => {});
                    });
                }
            }
        }, this.#scrollAnimationDuration);
    }

    centerActiveItem() {
        const activeItem = this.#items[this.#activeIndex];
        if (!activeItem) return;
        centerItem(this.#container, activeItem);
    }

    #handleClick(e) {
        const clicked = e.target.closest(SELECTORS.REEL_ITEM);
        if (this.#isScrolling) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        const rect = this.#container.getBoundingClientRect();
        if (clicked) {
            const idx = this.#items.indexOf(clicked);
            const isActive = idx === this.#activeIndex;
            const vid = clicked.querySelector('video');
            if (!isActive) {
                this.#isScrolling = true;
                this.activate(idx, true);
            } else {
                if (vid.muted) {
                    vid.muted = false;
                    vid.volume = 1;
                    if (vid.paused) {
                        this.#updateUserPausedState(vid, false);
                        vid.play();
                    }
                } else {
                    if (vid.paused) {
                        this.#updateUserPausedState(vid, false);
                        vid.play();
                    } else {
                        this.#updateUserPausedState(vid, true);
                        vid.pause();
                    }
                }
            }
        } else {
            const y = e.clientY - rect.top;
            const x = e.clientX - rect.left;
            const next = isMobile() ? (y > rect.height / 2) : (x > rect.width / 2);
            this.navigate(next ? 1 : -1);
        }
    }

    #handleKey(e) {
        const now = Date.now();
        if (now - this.#lastKeyPressTime < 500) return;
        this.#lastKeyPressTime = now;
        this.#keyLocked = true;
        clearTimeout(this.#keyDebounceTimeout);
        this.#keyDebounceTimeout = setTimeout(() => {
            this.#keyLocked = false;
        }, 500);

        if (!isMobile()) {
            if (e.key === 'ArrowRight') this.navigate(1);
            if (e.key === 'ArrowLeft') this.navigate(-1);
        } else {
            if (e.key === 'ArrowDown') this.navigate(1);
            if (e.key === 'ArrowUp') this.navigate(-1);
        }
    }

    #handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY || e.deltaX;
        if (Math.abs(delta) < 20) return;
        const direction = delta > 0 ? 1 : -1;
        this.navigate(direction);
    }

    #enableInteractionBlock() {
        this.#blockingOverlay.style.display = 'block';
        this.#items.forEach(item => {
            const vid = item.querySelector('video');
            if (vid) { vid.style.pointerEvents = 'none'; }
        });
    }

    #disableInteractionBlock() {
        this.#blockingOverlay.style.display = 'none';
        this.#items.forEach(item => {
            const vid = item.querySelector('video');
            if (vid) { vid.style.pointerEvents = 'auto'; }
        });
    }

    async handleDownload(clipIndex) {
        if (clipIndex === undefined) return;
        try {
            const blob = await getVideo(parseInt(clipIndex) + 1);
            downloadBlob(blob, `video_${parseInt(clipIndex) + 1}.mp4`);
        } catch (error) {}
    }

    refresh() {
        this.#items = Array.from(this.#container.querySelectorAll(SELECTORS.REEL_ITEM));
        this.#addDownloadButtons();
        this.centerActiveItem();
    }
}
