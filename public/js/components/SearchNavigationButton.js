import { CLASSES } from '../core/constants.js';
import { createElement } from '../core/dom-utils.js';
import { getIconPath } from '../core/icon-utils.js';

export class SearchNavigationButton {
    #container;
    #button;

    constructor(container) {
        this.#container = container;
        this.#button = this.#createButton();
        this.#initialize();
    }

    get button() {
        return this.#button;
    }

    #initialize() {
        this.#addToContainer();
        this.#setupEventListeners();
    }

    #createButton() {
        const button = createElement('a', {
            className: 'search-nav-button',
            href: 'search',
            title: 'Search for quotes'
        });

        const searchIconPath = getIconPath('SEARCH');
        const iconImg = createElement('img', {
            src: searchIconPath,
            alt: 'Search icon',
            className: 'search-icon'
        });

        const textSpan = createElement('span', {}, 'Search for quotes');

        button.appendChild(iconImg);
        button.appendChild(textSpan);

        return button;
    }

    #addToContainer() {
        this.#container.appendChild(this.#button);
    }

    #setupEventListeners() {
        this.#button.addEventListener('mouseenter', () => this.#button.classList.add(CLASSES.HOVER));
        this.#button.addEventListener('mouseleave', () => this.#button.classList.remove(CLASSES.HOVER));
    }
}

export function addSearchNavigationButton(container) {
    return new SearchNavigationButton(container);
}