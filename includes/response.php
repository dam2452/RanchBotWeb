<?php

function json_response($data, $statusCode = 200, $exit = true) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);

    if ($exit) {
        exit;
    }
}

function error_response($message, $statusCode = 400, $additionalData = [], $exit = true) {
    $response = array_merge([
        'status' => 'error',
        'message' => $message
    ], $additionalData);

    json_response($response, $statusCode, $exit);
}

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

function redirect($url, $exit = true) {
    header("Location: $url");

    if ($exit) {
        exit;
    }
}

function file_response($content, $filename, $contentType = 'application/octet-stream', $exit = true) {
    if (ob_get_level()) {
        ob_end_clean();
    }

    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . strlen($content));
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');

    echo $content;

    if ($exit) {
        exit;
    }
}

function video_response($content, $filename, $contentType = 'video/mp4', $exit = true) {
    if (ob_get_level()) {
        ob_end_clean();
    }

    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . strlen($content));
    header('Content-Disposition: inline; filename="' . $filename . '"');
    header('Accept-Ranges: bytes');
    header('Cache-Control: public, max-age=3600');

    echo $content;

    if ($exit) {
        exit;
    }
}
