import { API_URLS } from '../core/constants.js';

export async function callApi(endpoint, args = []) {
    console.log(`API call ${endpoint} with arguments:`, args);

    try {
        const res = await fetch(API_URLS.JSON, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint, args })
        });

        const txt = await res.text();
        console.log(`API response (${endpoint}):`, txt.substring(0, 200));

        if (!res.ok) {
            console.error(`HTTP error ${res.status} for ${endpoint}:`, txt);
            throw new Error(`HTTP ${res.status}: ${txt}`);
        }

        try {
            return JSON.parse(txt);
        } catch (e) {
            console.warn(`Response ${endpoint} is not JSON:`, txt.substring(0, 200));
            return { text: txt, isRawText: true };
        }
    } catch (error) {
        console.error(`Error during ${endpoint} call:`, error);
        throw error;
    }
}

export async function callApiForBlob(endpoint, args = []) {
    console.log(`API call for blob ${endpoint} with arguments:`, args);

    try {
        const res = await fetch(API_URLS.VIDEO, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint, args })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`HTTP error ${res.status} for ${endpoint}:`, errorText.substring(0, 200));
            throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const blob = await res.blob();
        console.log(`Downloaded blob for ${endpoint}, size:`, blob.size);

        return blob;
    } catch (error) {
        console.error(`Error during ${endpoint} call for blob:`, error);
        throw error;
    }
}

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
            console.log('No clips or error in data:', data);
            return [];
        }
    } catch (error) {
        console.error('Error loading clips:', error);
        throw error;
    }
}

export async function deleteClip(clipName) {
    return callApi('uk', [clipName]);
}

export async function searchClips(query) {
    const response = await callApi('sz', [query]);
    if (response && response.data && response.data.results) {
        return response.data.results;
    }
    return [];
}

export async function getVideo(index) {
    return callApiForBlob('w', [index.toString()]);
}

export async function adjustVideo(clipIndex, leftAdjust, rightAdjust) {
    return callApiForBlob('d', [
        clipIndex.toString(),
        leftAdjust.toString(),
        rightAdjust.toString()
    ]);
}

export async function saveClip(clipName) {
    return callApi('z', [clipName]);
}

export async function getUserClips() {
    try {
        const response = await fetch('/api/clips?action=get_clips');

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 'success' || !data.clips) {
            throw new Error('Invalid API response');
        }

        return data.clips;
    } catch (error) {
        console.error('Failed to get user clips:', error);
        throw error;
    }
}

export function getVideoUrl(clipId) {
    return `/api/video?endpoint=wys&id=${encodeURIComponent(clipId)}`;
}