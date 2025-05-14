<?php

function json_response(mixed $data, int $statusCode = 200, bool $exit = true): void {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);

    if ($exit) {
        exit;
    }
}

function error_response(string $message, int $statusCode = 400, array $additionalData = [], bool $exit = true): void {
    $response = array_merge([
        'status' => 'error',
        'message' => $message
    ], $additionalData);

    json_response($response, $statusCode, $exit);
}

function success_response(mixed $data = null, ?string $message = null, bool $exit = true): void {
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

function redirect(string $url, bool $exit = true): void {
    header("Location: $url");

    if ($exit) {
        exit;
    }
}

function file_response(string $content, string $filename, string $contentType = 'application/octet-stream', bool $exit = true): void {
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

function video_response(string $content, string $filename, string $contentType = 'video/mp4', bool $exit = true): void {
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
