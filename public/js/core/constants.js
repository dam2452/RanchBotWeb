// public/js/core/constants.js

/**
 * Application-wide constants
 */

// Media query breakpoints
export const BREAKPOINTS = {
    MOBILE: 850, // Mobile breakpoint in pixels
};

// UI-related constants
export const UI = {
    ANIMATION_DURATION: 400, // Standard animation duration in ms
    DEBOUNCE_DELAY: 250,    // Default debounce delay for resize events
};

// API endpoints
export const API = {
    SEARCH: 'sz',           // Search endpoint
    GET_VIDEO: 'w',         // Get video endpoint
    ADJUST_VIDEO: 'd',      // Adjust video endpoint
    SAVE_CLIP: 'z',         // Save clip endpoint
    DELETE_CLIP: 'uk',      // Delete clip endpoint
};

// API URLs
export const API_URLS = {
    JSON: '/api/api-json.php',
    VIDEO: '/api/api-video.php',
    CLIPS: '/api/clips-api.php',
};

// Element selectors
export const SELECTORS = {
    VIDEO_REEL: '.video-reel',
    CLIPS_REEL: '.clips-reel',
    CLIP_CARD: '.clip-card',
    REEL_ITEM: '.reel-item',
    VIDEO_CONTAINER: '.video-container',
    CLIPS_PAGE: '.clips-page',
    SEARCH_CONTAINER: '.search-container',
    LOADING_INDICATOR: '#loading-indicator',
    DOWNLOAD_BUTTON: '.download-btn',
    DELETE_BUTTON: '.delete-clip-btn',
    ERROR_MESSAGE: '.error-message',
    INSPECT_BUTTON: '.inspect-btn',
};

// CSS classes
export const CLASSES = {
    ACTIVE: 'active',
    VISIBLE: 'visible',
    HIDDEN: 'hidden',
    ERROR: 'error-message',
    NO_CLIPS: 'no-clips-message',
    HOVER: 'hover',
};

// Messages
export const MESSAGES = {
    NO_CLIPS: 'Nie masz jeszcze żadnych klipów. Użyj wyszukiwarki cytatów, aby stworzyć swoje pierwsze klipy!',
    EMPTY_PAGE: 'Ta strona jest teraz pusta.',
    DELETE_CONFIRM: (name) => `Czy na pewno chcesz usunąć klip "${name}"? Tej operacji nie można cofnąć.`,
    DELETE_ERROR: 'Nie udało się usunąć klipu:',
    DOWNLOAD_ERROR: 'Przepraszamy, wystąpił błąd podczas pobierania wideo:',
    LOADING_ERROR: 'Błąd ładowania',
    CLIP_NAME_REQUIRED: 'Proszę wprowadzić nazwę klipu',
    CLIP_ID_NOT_FOUND: 'Nie znaleziono indeksu klipu',
    LOADING_CLIPS: 'Ładowanie klipów...',
    PLAY_MESSAGE: 'Kliknij, aby odtworzyć',
};

// File extensions
export const FILE_EXTENSIONS = {
    VIDEO: '.mp4',
};

// Clipping settings
export const CLIP_SETTINGS = {
    CLIPS_PER_PAGE: {
        MOBILE: 3,
        DESKTOP: 6,
    },
};