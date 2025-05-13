// public/js/modules/api-client.js

import { API_URLS } from '../core/constants.js';

/**
 * Call the JSON API
 * @param {string} endpoint - API endpoint
 * @param {Array} args - API arguments
 * @returns {Promise<Object>} API response
 */
export async function callApi(endpoint, args = []) {
    console.log(`Wywołanie API ${endpoint} z argumentami:`, args);

    try {
        const res = await fetch(API_URLS.JSON, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint, args })
        });

        const txt = await res.text();
        console.log(`Odpowiedź API (${endpoint}):`, txt.substring(0, 200));

        if (!res.ok) {
            console.error(`Błąd HTTP ${res.status} dla ${endpoint}:`, txt);
            throw new Error(`HTTP ${res.status}: ${txt}`);
        }

        try {
            return JSON.parse(txt);
        } catch (e) {
            console.warn(`Odpowiedź ${endpoint} nie jest JSON:`, txt.substring(0, 200));
            return { text: txt, isRawText: true };
        }
    } catch (error) {
        console.error(`Błąd podczas wywołania ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Call the Video API to get a blob
 * @param {string} endpoint - API endpoint
 * @param {Array} args - API arguments
 * @returns {Promise<Blob>} API response as blob
 */
export async function callApiForBlob(endpoint, args = []) {
    console.log(`Wywołanie API dla blob ${endpoint} z argumentami:`, args);

    try {
        const res = await fetch(API_URLS.VIDEO, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint, args })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Błąd HTTP ${res.status} dla ${endpoint}:`, errorText.substring(0, 200));
            throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const blob = await res.blob();
        console.log(`Pobrano blob dla ${endpoint}, rozmiar:`, blob.size);

        return blob;
    } catch (error) {
        console.error(`Błąd podczas wywołania ${endpoint} dla blob:`, error);
        throw error;
    }
}

/**
 * Get clips from the API
 * @returns {Promise<Array>} Array of clips
 */
export async function getClips() {
    try {
        const response = await fetch(`${API_URLS.CLIPS}?action=get_clips`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success' && data.clips && data.clips.length > 0) {
            return data.clips;
        } else {
            console.log('Brak klipów lub błąd w danych:', data);
            return [];
        }
    } catch (error) {
        console.error('Error loading clips:', error);
        throw error;
    }
}

/**
 * Delete a clip by name
 * @param {string} clipName - Name of the clip to delete
 * @returns {Promise<Object>} API response
 */
export async function deleteClip(clipName) {
    return callApi('uk', [clipName]);
}

/**
 * Search for clips
 * @param {string} query - Search query
 * @returns {Promise<Array>} Search results
 */
export async function searchClips(query) {
    const { data } = await callApi('sz', [query]);
    return data.results || [];
}

/**
 * Get a video by index
 * @param {number} index - Video index
 * @returns {Promise<Blob>} Video blob
 */
export async function getVideo(index) {
    return callApiForBlob('w', [index.toString()]);
}

/**
 * Adjust a video clip
 * @param {number} clipIndex - Clip index
 * @param {number} leftAdjust - Left adjustment in seconds
 * @param {number} rightAdjust - Right adjustment in seconds
 * @returns {Promise<Blob>} Adjusted video blob
 */
export async function adjustVideo(clipIndex, leftAdjust, rightAdjust) {
    return callApiForBlob('d', [
        clipIndex.toString(),
        leftAdjust.toString(),
        rightAdjust.toString()
    ]);
}

/**
 * Save a clip
 * @param {string} clipName - Name for the clip
 * @returns {Promise<Object>} API response
 */
export async function saveClip(clipName) {
    return callApi('z', [clipName]);
}