// public/js/components/SearchNavigationButton.js

/**
 * Creates and manages a search navigation button
 */
export class SearchNavigationButton {
    constructor(container) {
        this.container = container;
        this.button = this.createButton();
        this.addToContainer();
        this.setupEventListeners();
    }

    /**
     * Create the button element
     * @returns {HTMLElement} The created button
     */
    createButton() {
        const button = document.createElement('a');
        button.className = 'search-nav-button';
        button.href = 'search.php';
        button.title = 'Szukaj cytatów';

        button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <span>Szukaj cytatów</span>
    `;

        return button;
    }

    /**
     * Add the button to the container
     */
    addToContainer() {
        this.container.appendChild(this.button);
    }

    /**
     * Set up event listeners for the button
     */
    setupEventListeners() {
        this.button.addEventListener('mouseenter', () => this.button.classList.add('hover'));
        this.button.addEventListener('mouseleave', () => this.button.classList.remove('hover'));
    }
}

/**
 * Create a search navigation button and add it to the specified container
 * @param {HTMLElement} container - Container to add the button to
 * @returns {SearchNavigationButton} The created button instance
 */
export function addSearchNavigationButton(container) {
    return new SearchNavigationButton(container);
}