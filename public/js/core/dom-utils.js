import { BREAKPOINTS } from './constants.js';

export function isMobile() {
    return window.matchMedia(`(max-width:${BREAKPOINTS.MOBILE}px)`).matches;
}

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

export function createElement(tag, attrs = {}, content = null) {
    const element = document.createElement(tag);

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

export function addEventListenerWithCleanup(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);

    return () => {
        element.removeEventListener(event, handler, options);
    };
}

export function debounce(func, delay) {
    let timeoutId;

    return function(...args) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

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

export function getSafeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
}