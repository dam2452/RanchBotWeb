export const BREAKPOINTS = {
    MOBILE: 850,
};

export const UI = {
    ANIMATION_DURATION: 400,
    DEBOUNCE_DELAY: 250,
};

export const API = {
    SEARCH: 'sz',
    GET_VIDEO: 'w',
    ADJUST_VIDEO: 'd',
    SAVE_CLIP: 'z',
    DELETE_CLIP: 'uk',
};

export const API_URLS = {
    JSON: '/api/api-json.php',
    VIDEO: '/api/api-video.php',
    CLIPS: '/api/clips-api.php',
};

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

export const CLASSES = {
    ACTIVE: 'active',
    VISIBLE: 'visible',
    HIDDEN: 'hidden',
    ERROR: 'error-message',
    NO_CLIPS: 'no-clips-message',
    HOVER: 'hover',
};

export const MESSAGES = {
    NO_CLIPS: 'You don’t have any clips yet. Use the quote search to create your first clips!',
    EMPTY_PAGE: 'This page is currently empty.',
    DELETE_CONFIRM: (name) => `Are you sure you want to delete the clip "${name}"? This action cannot be undone.`,
    DELETE_ERROR: 'Failed to delete clip:',
    DOWNLOAD_ERROR: 'Sorry, an error occurred while downloading the video:',
    LOADING_ERROR: 'Loading error',
    CLIP_NAME_REQUIRED: 'Please enter a clip name',
    CLIP_ID_NOT_FOUND: 'Clip index not found',
    LOADING_CLIPS: 'Loading clips...',
    PLAY_MESSAGE: 'Click to play',
};

export const FILE_EXTENSIONS = {
    VIDEO: '.mp4',
};

export const CLIP_SETTINGS = {
    CLIPS_PER_PAGE: {
        MOBILE: 3,
        DESKTOP: 6,
    },
};
