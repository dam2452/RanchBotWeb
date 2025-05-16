import { isMobile } from '../core/dom-utils.js';

export class PagedClipsNavigator {
    #container;
    #pages;
    #currentPage;
    #onPageChange;
    #isScrolling = false;

    constructor({ container, onPageChange }) {
        this.#container = container;
        this.#pages = Array.from(container.querySelectorAll('.clips-page'));
        this.#currentPage = 0;
        this.#onPageChange = onPageChange;

        this.attachEvents();
        this.scrollToPage(0);
    }

    attachEvents() {
        this.#container.addEventListener('click', this.#handleClick.bind(this));
        window.addEventListener('keydown', this.#handleKey.bind(this));
        this.#container.addEventListener('wheel', this.#handleWheel.bind(this), { passive: false });
    }

    #handleClick(e) {
        const clipCard = e.target.closest('.clip-card');
        if (clipCard) {
            const currentPage = this.#pages[this.#currentPage];
            if (currentPage && currentPage.contains(clipCard)) {
                return;
            }
        }

        const rect = this.#container.getBoundingClientRect();
        const isForward = (e.clientX - rect.left) > rect.width / 2;
        this.navigate(isForward ? 1 : -1);
    }

    #handleKey(e) {
        if (e.key === 'ArrowRight') {
            this.navigate(1);
        } else if (e.key === 'ArrowLeft') {
            this.navigate(-1);
        }
    }

    #handleWheel(e) {
        e.preventDefault();

        if (this.#isScrolling) return;

        const delta = e.deltaY || e.deltaX;
        if (Math.abs(delta) < 20) return;

        const direction = delta > 0 ? 1 : -1;
        this.navigate(direction);
    }

    navigate(direction) {
        const newPage = this.#currentPage + direction;
        if (newPage < 0 || newPage >= this.#pages.length) return;
        this.scrollToPage(newPage);
    }

    scrollToPage(index) {
        if (index < 0 || index >= this.#pages.length) return;

        this.#isScrolling = true;
        this.#currentPage = index;

        const page = this.#pages[index];
        this.#container.scrollTo({
            left: page.offsetLeft,
            behavior: 'smooth'
        });

        if (typeof this.#onPageChange === 'function') {
            this.#onPageChange();
        }

        setTimeout(() => {
            this.#isScrolling = false;
        }, 600);
    }
}