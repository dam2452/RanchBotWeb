const BASE_SVG_PATH = '/images/ui/icons/';

export const ICON_PATHS = {
    DELETE: 'delete.svg',
    DOWNLOAD: 'download.svg',
    PLAY: 'play.svg',
    PAUSE: 'pause.svg',
    SEARCH: 'search.svg',
    CLOSE: 'close.svg',
    EDIT: 'edit.svg',
    SETTINGS: 'settings.svg',
    ARROW_RIGHT: 'arrow-circle-right.svg',
    ARROW_LEFT: 'arrow-left.svg',
    ARROW_UP: 'arrow-up.svg',
    ARROW_DOWN: 'arrow-down.svg',
};

export function getIconPath(iconKey) {
    const iconFileName = ICON_PATHS[iconKey];
    if (!iconFileName) {
        console.warn(`Icon "${iconKey}" not found in the icon map`);
        return null;
    }

    return `${BASE_SVG_PATH}${iconFileName}`;
}

export function createIconImg(iconKey, attributes = {}) {
    const path = getIconPath(iconKey);
    if (!path) return null;

    const img = document.createElement('img');
    img.src = path;
    img.alt = `${iconKey} icon`;
    img.className = 'icon';

    Object.entries(attributes).forEach(([attr, value]) => {
        img.setAttribute(attr, value);
    });

    return img;
}

export function createIconObject(iconKey, attributes = {}) {
    const path = getIconPath(iconKey);
    if (!path) return null;

    const obj = document.createElement('object');
    obj.type = 'image/svg+xml';
    obj.data = path;
    obj.className = 'icon';

    Object.entries(attributes).forEach(([attr, value]) => {
        obj.setAttribute(attr, value);
    });

    return obj;
}

export function getIconHTML(iconKey, className = '') {
    const path = getIconPath(iconKey);
    if (!path) return '';

    const classes = className ? `icon ${className}` : 'icon';
    return `<img src="${path}" alt="${iconKey} icon" class="${classes}" style="vertical-align: middle; margin-right: 4px; width: 16px; height: 16px;">`;
}