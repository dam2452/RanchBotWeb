<?php
/**
 * Response utility functions
 *
 * Helper functions for handling HTTP responses
 */

/**
 * Send a JSON response
 *
 * @param mixed $data Response data
 * @param int $statusCode HTTP status code
 * @param bool $exit Whether to exit after sending response
 * @return void
 */
function json_response($data, $statusCode = 200, $exit = true) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);

    if ($exit) {
        exit;
    }
}

/**
 * Send an error response
 *
 * @param string $message Error message
 * @param int $statusCode HTTP status code
 * @param array $additionalData Additional data to include in response
 * @param bool $exit Whether to exit after sending response
 * @return void
 */
function error_response($message, $statusCode = 400, $additionalData = [], $exit = true) {
    $response = array_merge([
        'status' => 'error',
        'message' => $message
    ], $additionalData);

    json_response($response, $statusCode, $exit);
}

/**
 * Send a success response
 *
 * @param mixed $data Response data
 * @param string $message Success message
 * @param bool $exit Whether to exit after sending response
 * @return void
 */
function success_response($data = null, $message = null, $exit = true) {
    $response = [
        'status' => 'success'
    ];

    if ($data !== null) {
        $response['data'] = $data;
    }

    if ($message !== null) {
        $response['message'] = $message;
    }

    json_response($response, 200, $exit);
}

/**
 * Redirect to URL
 *
 * @param string $url URL to redirect to
 * @param bool $exit Whether to exit after redirect
 * @return void
 */
function redirect($url, $exit = true) {
    header("Location: $url");

    if ($exit) {
        exit;
    }
}

/**
 * Send a file response
 *
 * @param string $content File content
 * @param string $filename Filename
 * @param string $contentType Content type
 * @param bool $exit Whether to exit after sending response
 * @return void
 */
function file_response($content, $filename, $contentType = 'application/octet-stream', $exit = true) {
    // Clean output buffer
    if (ob_get_level()) {
        ob_end_clean();
    }

    // Set headers
    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . strlen($content));
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');

    // Send content
    echo $content;

    if ($exit) {
        exit;
    }
}

/**
 * Send a video response
 *
 * @param string $content Video content
 * @param string $filename Filename
 * @param string $contentType Content type
 * @param bool $exit Whether to exit after sending response
 * @return void
 */
function video_response($content, $filename, $contentType = 'video/mp4', $exit = true) {
    // Clean output buffer
    if (ob_get_level()) {
        ob_end_clean();
    }

    // Set headers
    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . strlen($content));
    header('Content-Disposition: inline; filename="' . $filename . '"');
    header('Accept-Ranges: bytes');
    header('Cache-Control: public, max-age=3600');

    // Send content
    echo $content;

    if ($exit) {
        exit;
    }
}