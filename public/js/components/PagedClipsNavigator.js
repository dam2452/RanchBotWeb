import { CLASSES, SELECTORS, UI } from '../core/constants.js';
import { isMobile, debounce } from '../core/dom-utils.js';

export class PagedClipsNavigator {
    constructor(options) {
        this.container = options.container;
        this.pages = Array.from(this.container.querySelectorAll(SELECTORS.CLIPS_PAGE));
        this.currentPage = 0;
        this.isMobile = window.innerWidth <= 850;
        this.onPageChange = options.onPageChange || (() => {});

        this.createNavigation();
        this.initEventListeners();
        this.scrollToPage(0);
    }

    createNavigation() {
        this.navigationElement = document.createElement('div');
        this.navigationElement.className = 'page-navigation';

        this.navigationElement.innerHTML = `
      <button class="prev-page" title="Previous page">&#10094;</button>
      <span class="page-indicator">Page <span class="current-page">1</span> of ${this.pages.length}</span>
      <button class="next-page" title="Next page">&#10095;</button>
    `;

        this.container.parentNode.insertBefore(this.navigationElement, this.container.nextSibling);

        this.prevButton = this.navigationElement.querySelector('.prev-page');
        this.nextButton = this.navigationElement.querySelector('.next-page');
        this.pageIndicator = this.navigationElement.querySelector('.current-page');

        this.prevButton.addEventListener('click', () => this.scrollToPage(this.currentPage - 1));
        this.nextButton.addEventListener('click', () => this.scrollToPage(this.currentPage + 1));
    }

    initEventListeners() {
        this.container.addEventListener('click', this.handleContainerClick.bind(this));
        window.addEventListener('keydown', this.handleKeyNavigation.bind(this));

        const handleResize = debounce(() => {
            this.isMobile = window.innerWidth <= 850;
            this.adjustAfterResize();
        }, UI.DEBOUNCE_DELAY);

        window.addEventListener('resize', handleResize);
    }

    handleContainerClick(e) {
        if (e.target === this.container || e.target.classList.contains('clips-reel')) {
            const rect = this.container.getBoundingClientRect();

            if (this.isMobile) {
                const clickY = e.clientY - rect.top;
                const goForward = clickY > rect.height / 2;
                this.scrollToPage(this.currentPage + (goForward ? 1 : -1));
            } else {
                const clickX = e.clientX - rect.left;
                const goForward = clickX > rect.width / 2;
                this.scrollToPage(this.currentPage + (goForward ? 1 : -1));
            }
        }
    }

    handleKeyNavigation(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        let handled = false;

        if (this.isMobile) {
            if (e.key === 'ArrowDown') {
                handled = true;
                this.scrollToPage(this.currentPage + 1);
            } else if (e.key === 'ArrowUp') {
                handled = true;
                this.scrollToPage(this.currentPage - 1);
            }
        } else {
            if (e.key === 'ArrowRight') {
                handled = true;
                this.scrollToPage(this.currentPage + 1);
            } else if (e.key === 'ArrowLeft') {
                handled = true;
                this.scrollToPage(this.currentPage - 1);
            }
        }

        if (handled) {
            e.preventDefault();
        }
    }

    scrollToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.pages.length) return;

        console.log(`Scrolling to page ${pageIndex + 1} of ${this.pages.length}`);
        this.currentPage = pageIndex;

        this.onPageChange();

        const targetPage = this.pages[pageIndex];
        if (!targetPage) {
            console.error(`Page with index ${pageIndex} does not exist in DOM.`);
            return;
        }

        if (this.isMobile) {
            this.container.scrollTo({
                top: targetPage.offsetTop - this.container.offsetTop,
                behavior: 'smooth'
            });
        } else {
            this.container.scrollTo({
                left: targetPage.offsetLeft,
                behavior: 'smooth'
            });
        }

        this.updatePageIndicator();
    }

    updatePageIndicator() {
        if (this.pageIndicator) {
            this.pageIndicator.textContent = this.currentPage + 1;
        }

        if (this.prevButton) {
            this.prevButton.disabled = (this.currentPage === 0);
        }

        if (this.nextButton) {
            this.nextButton.disabled = (this.currentPage >= this.pages.length - 1);
        }
    }

    adjustAfterResize() {
        console.log("Window resized, adjusting scroll position.");
        const targetPage = this.pages[this.currentPage];

        if (targetPage) {
            if (this.isMobile) {
                this.container.scrollTop = targetPage.offsetTop - this.container.offsetTop;
            } else {
                this.container.scrollLeft = targetPage.offsetLeft;
            }
        }
    }
}
