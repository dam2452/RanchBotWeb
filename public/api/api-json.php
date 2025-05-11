<?php
require_once __DIR__ . '/../../includes/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(400);
    echo json_encode(['error' => 'Only POST allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$endpoint = $input['endpoint'] ?? null;
$args     = $input['args']     ?? null;

if (!$endpoint || !is_array($args)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing endpoint or args']);
    exit;
}

if (!$JWT_TOKEN) {
    http_response_code(500);
    echo json_encode(['error' => 'JWT token not configured']);
    exit;
}

$ch = curl_init("http://192.168.1.210:8077/api/v1/$endpoint");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        "Authorization: Bearer $JWT_TOKEN",
    ],
    CURLOPT_POSTFIELDS     => json_encode(['args' => $args]),
]);

$response = curl_exec($ch);
$code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($code);
echo $response;
