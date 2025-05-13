<?php
require_once __DIR__ . '/../../includes/config.php';
require_once __DIR__ . '/../../includes/session.php';

$token = $_SESSION['jwt_token'] ?? $JWT_TOKEN ?? null;

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../api_video_errors.log');

$log_data = [
    'time' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'query' => $_GET,
    'token_exists' => !empty($token),
    'token_prefix' => substr($token, 0, 20) . '...'
];
file_put_contents(__DIR__ . '/../../api_video_requests.log', json_encode($log_data) . "\n", FILE_APPEND);

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['endpoint']) && $_GET['endpoint'] === 'wys' && isset($_GET['id'])) {
    $clipId = $_GET['id'];

    $postData = json_encode(['args' => [$clipId]]);

    file_put_contents(__DIR__ . '/../../api_video_debug.log', "Prepared request: $postData\n", FILE_APPEND);

    $ch = curl_init("http://192.168.1.210:8077/api/v1/wys");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "Authorization: Bearer $token",
        ],
        CURLOPT_POSTFIELDS => $postData,
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $info = curl_getinfo($ch);

    $response_log = [
        'time' => date('Y-m-d H:i:s'),
        'endpoint' => 'wys',
        'clip_id' => $clipId,
        'http_code' => $code,
        'error' => $error,
        'response_size' => strlen($response),
        'curl_info' => $info
    ];
    file_put_contents(__DIR__ . '/../../api_video_responses.log', json_encode($response_log, JSON_PRETTY_PRINT) . "\n", FILE_APPEND);

    curl_close($ch);

    if ($code !== 200) {
        $responsePreview = substr($response, 0, 500);
        file_put_contents(__DIR__ . '/../../api_video_errors.log',
            "Error for clip $clipId: HTTP $code\nResponse: $responsePreview\n", FILE_APPEND);

        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Error fetching video',
            'code' => $code,
            'message' => $error,
            'response' => substr($response, 0, 200)
        ]);
        exit;
    }

    if (strpos($response, '{') === 0) {
        file_put_contents(__DIR__ . '/../../api_video_errors.log',
            "JSON response instead of video for clip $clipId: $response\n", FILE_APPEND);

        http_response_code(500);
        header('Content-Type: application/json');
        echo $response;
        exit;
    }

    if (empty($response)) {
        file_put_contents(__DIR__ . '/../../api_video_errors.log',
            "Empty response for clip $clipId\n", FILE_APPEND);

        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Empty video response']);
        exit;
    }

    header('Content-Type: video/mp4');
    header('Content-Length: ' . strlen($response));
    header('Content-Disposition: inline; filename="clip_' . $clipId . '.mp4"');
    echo $response;
    exit;
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $args = $input['args'] ?? null;
    $endpoint = $input['endpoint'] ?? 'w';

    if (!$args || !is_array($args)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing args']);
        exit;
    }

    $ch = curl_init("http://192.168.1.210:8077/api/v1/$endpoint");
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
    curl_close($ch);

    http_response_code($code);
    echo $response;
    exit;
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request method or missing parameters']);
    exit;
}
