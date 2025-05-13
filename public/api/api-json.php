<?php
require_once __DIR__ . '/../../includes/config.php';
require_once __DIR__ . '/../../includes/session.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/logger.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Only POST allowed', 400);
}

$input = json_decode(file_get_contents('php://input'), true);
$endpoint = $input['endpoint'] ?? null;
$args = $input['args'] ?? null;

if (!$endpoint || !is_array($args)) {
    error_response('Missing endpoint or args', 400);
}

$token = get_jwt_token() ?? config('auth.jwt_token');
if (!$token) {
    error_response('JWT token not configured', 500);
}

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

$response = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (function_exists('logger')) {
    logger()->debug("API JSON request", 'api_json.log', [
        'endpoint' => $endpoint,
        'args' => $args,
        'http_code' => $code
    ]);
}

curl_close($ch);

http_response_code($code);
echo $response;
