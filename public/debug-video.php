<?php
/**
 * Debug-video endpoint
 *
 * Streams video clips by name
 */
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/response.php';
require_once __DIR__ . '/../includes/api-client.php';

// Check if user is logged in
if (!is_logged_in()) {
    error_response('Not authenticated', 401);
}

// Get clip name from GET parameter
$clipName = $_GET['id'] ?? null;

// Validate clip name
if (!$clipName) {
    error_response('No clip name (id parameter) provided', 400);
}

// Get JWT token from session
$token = get_jwt_token();
if (!$token) {
    error_response('No JWT token available in session', 401);
}

// Log request details
logger()->debug('Video request', 'debug_video_requests.log', [
    'clip_name' => $clipName
]);

// Fetch video from backend API
$result = get_video_by_name($clipName);

// Check if API call was successful
if (!$result) {
    error_response('Failed to retrieve video from backend', 404, [
        'requested_clip_name' => $clipName
    ]);
}

// Check if response looks like a valid video
$isSuccess = $result['http_code'] === 200
    && $result['body']
    && (
        // Check if response is likely JSON (error) or a video
    !($result['body'][0] === '{' || $result['body'][0] === '[')
    )
    && $result['content_type']
    && (
        strpos($result['content_type'], 'video') !== false
        || strpos($result['content_type'], 'octet-stream') !== false
    );

if ($isSuccess) {
    // Log successful video retrieval
    logger()->info('Video retrieved successfully', 'debug_video_success.log', [
        'clip_name' => $clipName,
        'content_type' => $result['content_type'],
        'size' => strlen($result['body'])
    ]);

    // Create a safe filename from clip name
    $safeFilename = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $clipName);

    // Add .mp4 extension if missing and content type suggests MP4
    if (strpos($result['content_type'], 'mp4') === false) {
        $safeFilename .= '.mp4';
    }

    // Send video response
    video_response(
        $result['body'],
        $safeFilename,
        $result['content_type'] ?: 'video/mp4'
    );
} else {
    // Determine appropriate error code
    $errorCode = ($result['http_code'] >= 400 && $result['http_code'] < 500)
        ? $result['http_code']
        : 404;

    if ($result['http_code'] >= 500) {
        $errorCode = 502; // Bad Gateway for backend errors
    }

    if (!empty($result['curl_error'])) {
        $errorCode = 504; // Gateway Timeout for connection errors
    }

    // Send error response
    error_response('Failed to retrieve video clip from backend', $errorCode, [
        'requested_clip_name' => $clipName,
        'backend_http_code' => $result['http_code'],
        'backend_curl_error' => $result['curl_error'],
        'backend_response_snippet' => substr($result['body'] ?? '', 0, 200)
    ]);
}