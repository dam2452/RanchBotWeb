// public/js/components/PagedClipsNavigator.js

/**
 * PagedClipsNavigator - Manages navigation between pages of clips
 */
export class PagedClipsNavigator {
    constructor(options) {
        this.container = options.container;
        this.pages = Array.from(this.container.querySelectorAll('.clips-page'));
        this.currentPage = 0;
        this.isMobile = window.innerWidth <= 850;
        this.onPageChange = options.onPageChange || (() => {});

        // Create navigation UI
        this.createNavigation();

        // Initialize event listeners
        this.initEventListeners();

        // Show first page
        this.scrollToPage(0);
    }

    createNavigation() {
        // Create navigation container
        this.navigationElement = document.createElement('div');
        this.navigationElement.className = 'page-navigation';

        // Add navigation buttons and indicator
        this.navigationElement.innerHTML = `
      <button class="prev-page" title="Poprzednia strona">&#10094;</button>
      <span class="page-indicator">Strona <span class="current-page">1</span> z ${this.pages.length}</span>
      <button class="next-page" title="Następna strona">&#10095;</button>
    `;

        // Add navigation below the clips container
        this.container.parentNode.insertBefore(this.navigationElement, this.container.nextSibling);

        // Store references to elements
        this.prevButton = this.navigationElement.querySelector('.prev-page');
        this.nextButton = this.navigationElement.querySelector('.next-page');
        this.pageIndicator = this.navigationElement.querySelector('.current-page');

        // Add navigation button event listeners
        this.prevButton.addEventListener('click', () => this.scrollToPage(this.currentPage - 1));
        this.nextButton.addEventListener('click', () => this.scrollToPage(this.currentPage + 1));
    }

    initEventListeners() {
        // Handle click events on the container's background
        this.container.addEventListener('click', this.handleContainerClick.bind(this));

        // Handle keyboard navigation
        window.addEventListener('keydown', this.handleKeyNavigation.bind(this));

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.isMobile = window.innerWidth <= 850;
                this.adjustAfterResize();
            }, 250);
        });
    }

    handleContainerClick(e) {
        // Only handle clicks directly on the container background, not on cards
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
        // Skip if focus is on input fields
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
        // Validate page index
        if (pageIndex < 0 || pageIndex >= this.pages.length) return;

        console.log(`Przewijanie do strony ${pageIndex + 1} z ${this.pages.length}`);
        this.currentPage = pageIndex;

        // Call the page change callback
        this.onPageChange();

        const targetPage = this.pages[pageIndex];
        if (!targetPage) {
            console.error(`Strona o indeksie ${pageIndex} nie istnieje w DOM.`);
            return;
        }

        // Scroll to the target page with appropriate axis
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

        // Update page indicator
        this.updatePageIndicator();
    }

    updatePageIndicator() {
        // Update page number and button states
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