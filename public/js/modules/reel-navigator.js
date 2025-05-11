import { isMobile, centerItem } from '../core/dom-utils.js';

export class ReelNavigator {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.items = Array.from(this.container.querySelectorAll('.reel-item'));
        this.activeIndex = 0;
        this.firstPlayedMuted = true;

        this.attachListeners();
        this.activate(0);
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
    }
}
