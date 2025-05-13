<?php
/**
 * API JSON endpoint
 *
 * Handles JSON API requests
 */
require_once __DIR__ . '/../../includes/config.php';
require_once __DIR__ . '/../../includes/session.php';
require_once __DIR__ . '/../../includes/response.php';
// Add logger import
require_once __DIR__ . '/../../includes/logger.php';

// Set response content type
header('Content-Type: application/json');

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Only POST allowed', 400);
}

// Parse request body
$input = json_decode(file_get_contents('php://input'), true);
$endpoint = $input['endpoint'] ?? null;
$args = $input['args'] ?? null;

// Validate request parameters
if (!$endpoint || !is_array($args)) {
    error_response('Missing endpoint or args', 400);
}

// Get JWT token from configuration or session
$token = get_jwt_token() ?? config('auth.jwt_token');
if (!$token) {
    error_response('JWT token not configured', 500);
}

// Make API request
$apiUrl = config('api.base_url') . '/' . $endpoint;

$ch = curl_init($apiUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        "Authorization: Bearer $token",
    ],
    CURLOPT_POSTFIELDS => json_encode(['args' => $args]),
]);

// Execute request
$response = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Log API request
if (function_exists('logger')) {
    logger()->debug("API JSON request", 'api_json.log', [
        'endpoint' => $endpoint,
        'args' => $args,
        'http_code' => $code
    ]);
}

curl_close($ch);

// Send response with original status code
http_response_code($code);
echo $response;