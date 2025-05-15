import { CLASSES, SELECTORS, UI } from '../core/constants.js';
import { isMobile, debounce } from '../core/dom-utils.js';

export class PagedClipsNavigator {
    #container;
    #pages;
    #currentPage;
    #isMobile;
    #onPageChange;
    #navigationElement;
    #prevButton;
    #nextButton;
    #pageIndicator;

    constructor(options) {
        this.#container = options.container;
        this.#pages = Array.from(this.#container.querySelectorAll(SELECTORS.CLIPS_PAGE));
        this.#currentPage = 0;
        this.#isMobile = window.innerWidth <= 850;
        this.#onPageChange = options.onPageChange || (() => {});

        this.#initialize();
    }

    get currentPage() {
        return this.#currentPage;
    }

    get pages() {
        return this.#pages;
    }

    scrollToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.#pages.length) return;

        console.log(`Scrolling to page ${pageIndex + 1} of ${this.#pages.length}`);
        this.#currentPage = pageIndex;

        this.#onPageChange();
        this.#performScrollToPage(pageIndex);
        this.#updatePageIndicator();
    }

    #initialize() {
        this.#createNavigation();
        this.#initEventListeners();
        this.scrollToPage(0);
    }

    #createNavigation() {
        this.#navigationElement = document.createElement('div');
        this.#navigationElement.className = 'page-navigation';
        this.#navigationElement.innerHTML = this.#getNavigationHtml();

        this.#container.parentNode.insertBefore(this.#navigationElement, this.#container.nextSibling);

        this.#cacheNavigationElements();
        this.#attachNavigationEvents();
    }

    #getNavigationHtml() {
        return `
            <button class="prev-page" title="Previous page">&#10094;</button>
            <span class="page-indicator">Page <span class="current-page">1</span> of ${this.#pages.length}</span>
            <button class="next-page" title="Next page">&#10095;</button>
        `;
    }

    #cacheNavigationElements() {
        this.#prevButton = this.#navigationElement.querySelector('.prev-page');
        this.#nextButton = this.#navigationElement.querySelector('.next-page');
        this.#pageIndicator = this.#navigationElement.querySelector('.current-page');
    }

    #attachNavigationEvents() {
        this.#prevButton.addEventListener('click', () => this.scrollToPage(this.#currentPage - 1));
        this.#nextButton.addEventListener('click', () => this.scrollToPage(this.#currentPage + 1));
    }

    #initEventListeners() {
        this.#container.addEventListener('click', this.#handleContainerClick.bind(this));
        window.addEventListener('keydown', this.#handleKeyNavigation.bind(this));
        window.addEventListener('resize', this.#createResizeHandler());
    }

    #createResizeHandler() {
        return debounce(() => {
            this.#isMobile = window.innerWidth <= 850;
            this.#adjustAfterResize();
        }, UI.DEBOUNCE_DELAY);
    }

    #handleContainerClick(e) {
        if (e.target === this.#container || e.target.classList.contains('clips-reel')) {
            const rect = this.#container.getBoundingClientRect();

            if (this.#isMobile) {
                this.#handleVerticalClick(e, rect);
            } else {
                this.#handleHorizontalClick(e, rect);
            }
        }
    }

    #handleVerticalClick(e, rect) {
        const clickY = e.clientY - rect.top;
        const goForward = clickY > rect.height / 2;
        this.scrollToPage(this.#currentPage + (goForward ? 1 : -1));
    }

    #handleHorizontalClick(e, rect) {
        const clickX = e.clientX - rect.left;
        const goForward = clickX > rect.width / 2;
        this.scrollToPage(this.#currentPage + (goForward ? 1 : -1));
    }

    #handleKeyNavigation(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        let handled = false;

        if (this.#isMobile) {
            handled = this.#handleMobileKeyNavigation(e);
        } else {
            handled = this.#handleDesktopKeyNavigation(e);
        }

        if (handled) {
            e.preventDefault();
        }
    }

    #handleMobileKeyNavigation(e) {
        if (e.key === 'ArrowDown') {
            this.scrollToPage(this.#currentPage + 1);
            return true;
        } else if (e.key === 'ArrowUp') {
            this.scrollToPage(this.#currentPage - 1);
            return true;
        }
        return false;
    }

    #handleDesktopKeyNavigation(e) {
        if (e.key === 'ArrowRight') {
            this.scrollToPage(this.#currentPage + 1);
            return true;
        } else if (e.key === 'ArrowLeft') {
            this.scrollToPage(this.#currentPage - 1);
            return true;
        }
        return false;
    }

    #performScrollToPage(pageIndex) {
        const targetPage = this.#pages[pageIndex];
        if (!targetPage) {
            console.error(`Page with index ${pageIndex} does not exist in DOM.`);
            return;
        }

        if (this.#isMobile) {
            this.#scrollVertically(targetPage);
        } else {
            this.#scrollHorizontally(targetPage);
        }
    }

    #scrollVertically(targetPage) {
        this.#container.scrollTo({
            top: targetPage.offsetTop - this.#container.offsetTop,
            behavior: 'smooth'
        });
    }

    #scrollHorizontally(targetPage) {
        this.#container.scrollTo({
            left: targetPage.offsetLeft,
            behavior: 'smooth'
        });
    }

    #updatePageIndicator() {
        if (this.#pageIndicator) {
            this.#pageIndicator.textContent = this.#currentPage + 1;
        }

        this.#updateNavigationButtonStates();
    }

    #updateNavigationButtonStates() {
        if (this.#prevButton) {
            this.#prevButton.disabled = (this.#currentPage === 0);
        }

        if (this.#nextButton) {
            this.#nextButton.disabled = (this.#currentPage >= this.#pages.length - 1);
        }
    }

    #adjustAfterResize() {
        console.log("Window resized, adjusting scroll position.");
        const targetPage = this.#pages[this.#currentPage];

        if (targetPage) {
            if (this.#isMobile) {
                this.#container.scrollTop = targetPage.offsetTop - this.#container.offsetTop;
            } else {
                this.#container.scrollLeft = targetPage.offsetLeft;
            }
        }
    }
}