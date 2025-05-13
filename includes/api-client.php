<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/session.php';
require_once __DIR__ . '/logger.php';

function api_request($endpoint, $args = [], $method = 'POST', $headers = [], $returnFullResponse = false) {
    $baseUrl = config('api.base_url');
    $url = $baseUrl . '/' . ltrim($endpoint, '/');

    $token = get_jwt_token();

    $ch = curl_init($url);

    $defaultHeaders = [
        'Content-Type: application/json'
    ];

    if ($token) {
        $defaultHeaders[] = "Authorization: Bearer $token";
    }

    $requestHeaders = array_merge($defaultHeaders, $headers);

    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $requestHeaders,
        CURLOPT_TIMEOUT => config('api.timeout', 30)
    ];

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

    $response = curl_exec($ch);
    $info = curl_getinfo($ch);
    $error = curl_error($ch);
    $httpCode = $info['http_code'];
    curl_close($ch);

    // Zamieniamy wywołanie loggera na warunkowe sprawdzenie czy funkcja logger() istnieje i zwraca obiekt
    if (function_exists('logger') && is_object(logger())) {
        logger()->debug("API request to $url", 'api_requests.log', [
            'method' => $method,
            'args' => $args,
            'http_code' => $httpCode,
            'error' => $error
        ]);
    } else {
        // Alternatywne logowanie, jeśli logger nie jest dostępny
        error_log("API request to $url - HTTP Code: $httpCode");
    }

    if ($returnFullResponse) {
        return [
            'body' => $response,
            'info' => $info,
            'curl_error' => $error,
            'http_code' => $httpCode,
            'content_type' => $info['content_type'] ?? null,
        ];
    }

    if ($httpCode !== 200) {
        // Również zamieniamy drugie wywołanie loggera
        if (function_exists('logger') && is_object(logger())) {
            logger()->error("API request failed: $error", 'api_errors.log', [
                'endpoint' => $endpoint,
                'http_code' => $httpCode,
                'response' => substr($response, 0, 200)
            ]);
        } else {
            error_log("API request failed: $error - Endpoint: $endpoint - HTTP Code: $httpCode");
        }
        return false;
    }

    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        // I trzecie wywołanie loggera
        if (function_exists('logger') && is_object(logger())) {
            logger()->warning("Invalid JSON response", 'api_errors.log', [
                'endpoint' => $endpoint,
                'json_error' => json_last_error_msg(),
                'response' => substr($response, 0, 200)
            ]);
        } else {
            error_log("Invalid JSON response - Endpoint: $endpoint - Error: " . json_last_error_msg());
        }
        return $response;
    }

    return $data;
}

function api_request_raw($endpoint, $args = [], $returnFullResponse = true) {
    return api_request($endpoint, $args, 'POST', [], $returnFullResponse);
}

function get_video_by_name($name) {
    return api_request_raw('wys', [$name]);
}

function get_user_clips() {
    $response = api_request('mk', []);

    if ($response && isset($response['status']) && $response['status'] === 'success' && isset($response['data']['clips'])) {
        return $response['data']['clips'];
    }

    return false;
}

function search_clips($query) {
    $response = api_request('sz', [$query]);

    if ($response && isset($response['status']) && $response['status'] === 'success' && isset($response['data']['results'])) {
        return $response['data']['results'];
    }

    return false;
}

function adjust_clip($clipId, $leftAdjust, $rightAdjust) {
    return api_request_raw('d', [$clipId, $leftAdjust, $rightAdjust]);
}

function save_clip($clipName) {
    return api_request('z', [$clipName]);
}

function delete_clip($clipName) {
    return api_request('uk', [$clipName]);
}