<?php
/**
 * API client for interacting with the backend API
 *
 * Provides methods to make requests to the backend API with proper authentication
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/session.php';
require_once __DIR__ . '/logger.php';

/**
 * Make an API request
 *
 * @param string $endpoint API endpoint path (without base URL)
 * @param array $args Request arguments
 * @param string $method HTTP method (POST, GET, etc.)
 * @param array $headers Additional headers
 * @param bool $returnFullResponse Whether to return full response info
 * @return array|string|false Response data or full response info
 */
function api_request($endpoint, $args = [], $method = 'POST', $headers = [], $returnFullResponse = false) {
    $baseUrl = config('api.base_url');
    $url = $baseUrl . '/' . ltrim($endpoint, '/');

    // Get JWT token from session
    $token = get_jwt_token();

    // Prepare CURL request
    $ch = curl_init($url);

    // Default headers
    $defaultHeaders = [
        'Content-Type: application/json'
    ];

    // Add Authorization header if token exists
    if ($token) {
        $defaultHeaders[] = "Authorization: Bearer $token";
    }

    // Merge with additional headers
    $requestHeaders = array_merge($defaultHeaders, $headers);

    // Set CURL options
    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $requestHeaders,
        CURLOPT_TIMEOUT => config('api.timeout', 30)
    ];

    // Set method and request body
    if ($method === 'POST') {
        $options[CURLOPT_POST] = true;
        $options[CURLOPT_POSTFIELDS] = json_encode(['args' => $args]);
    } elseif ($method !== 'GET') {
        $options[CURLOPT_CUSTOMREQUEST] = $method;
        if (!empty($args)) {
            $options[CURLOPT_POSTFIELDS] = json_encode(['args' => $args]);
        }
    }

    curl_setopt_array($ch, $options);

    // Execute request
    $response = curl_exec($ch);
    $info = curl_getinfo($ch);
    $error = curl_error($ch);
    $httpCode = $info['http_code'];
    curl_close($ch);

    // Log request
    logger()->debug("API request to $url", 'api_requests.log', [
        'method' => $method,
        'args' => $args,
        'http_code' => $httpCode,
        'error' => $error
    ]);

    // Return full response info if requested
    if ($returnFullResponse) {
        return [
            'body' => $response,
            'info' => $info,
            'curl_error' => $error,
            'http_code' => $httpCode,
            'content_type' => $info['content_type'] ?? null,
        ];
    }

    // Check for errors
    if ($httpCode !== 200) {
        logger()->error("API request failed: $error", 'api_errors.log', [
            'endpoint' => $endpoint,
            'http_code' => $httpCode,
            'response' => substr($response, 0, 200)
        ]);
        return false;
    }

    // Try to parse JSON response
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        logger()->warning("Invalid JSON response", 'api_errors.log', [
            'endpoint' => $endpoint,
            'json_error' => json_last_error_msg(),
            'response' => substr($response, 0, 200)
        ]);
        return $response;
    }

    return $data;
}

/**
 * Make a raw API request that returns a binary response
 *
 * @param string $endpoint API endpoint
 * @param array $args Request arguments
 * @param bool $returnFullResponse Whether to return full response info
 * @return array|string|false Response data or full response info
 */
function api_request_raw($endpoint, $args = [], $returnFullResponse = true) {
    return api_request($endpoint, $args, 'POST', [], $returnFullResponse);
}

/**
 * Get video from API by ID
 *
 * @param int|string $id Video ID
 * @return array|false Response with video data or false on error
 */
function get_video_by_id($id) {
    return api_request_raw('wys', [$id]);
}

/**
 * Get video from API by name
 *
 * @param string $name Video name
 * @return array|false Response with video data or false on error
 */
function get_video_by_name($name) {
    return api_request_raw('wys', [$name]);
}

/**
 * Get user clips
 *
 * @return array|false List of user clips or false on error
 */
function get_user_clips() {
    $response = api_request('mk', []);

    if ($response && isset($response['status']) && $response['status'] === 'success' && isset($response['data']['clips'])) {
        return $response['data']['clips'];
    }

    return false;
}

/**
 * Search clips
 *
 * @param string $query Search query
 * @return array|false Search results or false on error
 */
function search_clips($query) {
    $response = api_request('sz', [$query]);

    if ($response && isset($response['status']) && $response['status'] === 'success' && isset($response['data']['results'])) {
        return $response['data']['results'];
    }

    return false;
}

/**
 * Adjust clip
 *
 * @param int|string $clipId Clip ID
 * @param float $leftAdjust Left adjustment in seconds
 * @param float $rightAdjust Right adjustment in seconds
 * @return array|false Adjusted clip data or false on error
 */
function adjust_clip($clipId, $leftAdjust, $rightAdjust) {
    return api_request_raw('d', [$clipId, $leftAdjust, $rightAdjust]);
}

/**
 * Save clip
 *
 * @param string $clipName Clip name
 * @return array|false Response data or false on error
 */
function save_clip($clipName) {
    return api_request('z', [$clipName]);
}

/**
 * Delete clip
 *
 * @param string $clipName Clip name
 * @return array|false Response data or false on error
 */
function delete_clip($clipName) {
    return api_request('uk', [$clipName]);
}