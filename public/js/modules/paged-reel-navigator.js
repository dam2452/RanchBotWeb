import { isMobile } from '../core/dom-utils.js';

export class PagedReelNavigator {
    #container;
    #cards;
    #pages;
    #currentPage;
    #perPage;

    constructor(containerSelector, itemSelector = '.clip-card', perPage = { mobile: 3, desktop: 6 }) {
        this.#container = document.querySelector(containerSelector);
        this.#cards = Array.from(this.#container.querySelectorAll(itemSelector));
        this.#pages = [];
        this.#currentPage = 0;
        this.#perPage = perPage;

        this.regroupPages();
        this.attachEvents();
    }

    get container() {
        return this.#container;
    }

    get cards() {
        return this.#cards;
    }

    get pages() {
        return this.#pages;
    }

    get currentPage() {
        return this.#currentPage;
    }

    regroupPages() {
        const perPageCount = isMobile() ? this.#perPage.mobile : this.#perPage.desktop;
        this.#container.querySelectorAll('.clips-page').forEach(p => p.remove());

        for (let i = 0; i < this.#cards.length; i += perPageCount) {
            const page = document.createElement('div');
            page.className = 'clips-page';
            this.#cards.slice(i, i + perPageCount).forEach(card => page.appendChild(card));
            this.#container.appendChild(page);
        }

        this.#pages = Array.from(this.#container.querySelectorAll('.clips-page'));
        this.#currentPage = 0;
        this.scrollToPage(0);
    }

    scrollToPage(idx) {
        if (idx < 0 || idx >= this.#pages.length) return;
        this.#currentPage = idx;
        document.querySelectorAll('.clip-card video').forEach(v => v.pause());

        this.#container.scrollTo({
            top: isMobile() ? this.#pages[idx].offsetTop : 0,
            left: isMobile() ? 0 : this.#pages[idx].offsetLeft,
            behavior: 'smooth'
        });
    }

    handleCardClick(card) {
        const page = card.closest('.clips-page');
        const pageIndex = this.#pages.indexOf(page);

        if (pageIndex !== this.#currentPage) {
            this.scrollToPage(pageIndex);
            return;
        }

        const video = card.querySelector('video');
        document.querySelectorAll('.clip-card video').forEach(v => {
            if (v !== video) v.pause();
        });

        video.paused ? video.play() : video.pause();
    }

    attachEvents() {
        window.addEventListener('resize', () => this.regroupPages());
        window.addEventListener('load', () => this.regroupPages());

        this.#container.addEventListener('click', e => {
            const card = e.target.closest('.clip-card');
            if (card) {
                this.handleCardClick(card);
                return;
            }

            const rect = this.#container.getBoundingClientRect();
            const forward = isMobile()
                ? (e.clientY - rect.top > rect.height / 2)
                : (e.clientX - rect.left > rect.width / 2);

            this.scrollToPage(this.#currentPage + (forward ? 1 : -1));
        });

        window.addEventListener('keydown', e => {
            if (!isMobile()) {
                if (e.key === 'ArrowRight') this.scrollToPage(this.#currentPage + 1);
                if (e.key === 'ArrowLeft')  this.scrollToPage(this.#currentPage - 1);
            } else {
                if (e.key === 'ArrowDown') this.scrollToPage(this.#currentPage + 1);
                if (e.key === 'ArrowUp')   this.scrollToPage(this.#currentPage - 1);
            }
        });
    }
}