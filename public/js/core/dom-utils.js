// public/js/core/dom-utils.js

import { BREAKPOINTS } from './constants.js';

/**
 * Check if current viewport is mobile
 * @returns {boolean} True if viewport width is below or equal to mobile breakpoint
 */
export function isMobile() {
    return window.matchMedia(`(max-width:${BREAKPOINTS.MOBILE}px)`).matches;
}

/**
 * Center an item within its container (horizontally or vertically based on device)
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement} item - Item to center
 */
export function centerItem(container, item) {
    if (!item || !container) return;

    const rect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    const offset = isMobile()
        ? item.offsetTop - container.offsetTop - (rect.height - itemRect.height) / 2
        : item.offsetLeft - container.offsetLeft - (rect.width - itemRect.width) / 2;

    container.scrollTo({
        top: isMobile() ? offset : 0,
        left: isMobile() ? 0 : offset,
        behavior: 'smooth'
    });
}

/**
 * Create an element with attributes and content
 * @param {string} tag - Element tag name
 * @param {Object} attrs - Element attributes
 * @param {string|HTMLElement|Array} content - Element content (string, element, or array of elements)
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, content = null) {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else {
            element.setAttribute(key, value);
        }
    });

    // Set content
    if (content) {
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(item => {
                if (item instanceof HTMLElement) {
                    element.appendChild(item);
                } else if (typeof item === 'string') {
                    element.appendChild(document.createTextNode(item));
                }
            });
        }
    }

    return element;
}

/**
 * Add event listener with automatic cleanup
 * @param {HTMLElement} element - Element to attach listener to
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event listener options
 * @returns {Function} Function to remove the event listener
 */
export function addEventListenerWithCleanup(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);

    return () => {
        element.removeEventListener(event, handler, options);
    };
}

/**
 * Create a debounced version of a function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;

    return function(...args) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Download a blob as a file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Name for the downloaded file
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Show a status message
 * @param {string} message - Message to display
 * @param {string} type - Message type (error, success, info)
 * @param {number} duration - Duration in milliseconds
 * @returns {HTMLElement} Created message element
 */
export function showStatusMessage(message, type = 'info', duration = 6000) {
    const existingMessage = document.querySelector('.status-message');
    if (existingMessage) {
        document.body.removeChild(existingMessage);
    }

    const messageElement = createElement('div', {
        className: `status-message ${type}`
    }, message);

    document.body.appendChild(messageElement);

    if (duration > 0) {
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.classList.add('fade-out');

                setTimeout(() => {
                    if (messageElement.parentNode) {
                        document.body.removeChild(messageElement);
                    }
                }, 300);
            }
        }, duration);
    }

    return messageElement;
}

/**
 * Get a sanitized filename (remove invalid characters)
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function getSafeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
}