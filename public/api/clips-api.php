<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/session.php';
require_once __DIR__ . '/../../includes/config.php';

if (!is_logged_in()) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action === 'get_clips') {
    try {
        $token = $_SESSION['jwt_token'] ?? null;

        if (!$token) {
            throw new Exception('Missing JWT token in session');
        }

        $apiBaseUrl = rtrim(config('api.base_url'), '/');
        $url = "$apiBaseUrl/mk";

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer $token"
            ],
            CURLOPT_POSTFIELDS => '{}',
            CURLOPT_TIMEOUT => 30
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        file_put_contents(__DIR__ . '/../../clips_api.log',
            date('Y-m-d H:i:s') . " - GET CLIPS\n" .
            "URL: $url\n" .
            "HTTP Code: $httpCode\n" .
            "Error: $error\n" .
            "Response: " . substr($response, 0, 100) . "...\n\n",
            FILE_APPEND
        );

        if ($httpCode !== 200) {
            throw new Exception("API Error: HTTP $httpCode");
        }

        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON response: ' . json_last_error_msg());
        }

        if (($data['status'] ?? '') !== 'success' || !isset($data['data']['clips'])) {
            throw new Exception('Invalid API response structure');
        }

        echo json_encode([
            'status' => 'success',
            'clips' => $data['data']['clips'],
            'data' => $data['data']
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }
    exit;
}

http_response_code(400);
echo json_encode([
    'status' => 'error',
    'message' => 'Unknown action: ' . $action
]);
