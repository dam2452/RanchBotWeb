<?php
require_once __DIR__ . '/../../includes/config.php';
require_once __DIR__ . '/../../includes/session.php';

// Pobierz token JWT z sesji lub zmiennej globalnej
$token = $_SESSION['jwt_token'] ?? $JWT_TOKEN ?? null;

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Włącz logowanie błędów
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../api_video_errors.log');

// Logowanie zapytania
$log_data = [
    'time' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'query' => $_GET,
    'token_exists' => !empty($token),
    'token_prefix' => substr($token, 0, 20) . '...'
];
file_put_contents(__DIR__ . '/../../api_video_requests.log', json_encode($log_data) . "\n", FILE_APPEND);

// Obsługa żądania GET dla endpointu "wys" (odtwarzanie klipów)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['endpoint']) && $_GET['endpoint'] === 'wys' && isset($_GET['id'])) {
    $clipId = $_GET['id'];

    // Przygotowanie pustego obiektu JSON z argumentami
    $postData = json_encode(['args' => [$clipId]]);

    // Log przygotowanego zapytania
    file_put_contents(__DIR__ . '/../../api_video_debug.log', "Prepared request: $postData\n", FILE_APPEND);

    // API wymaga metody POST ze strukturą {"args": ["ID"]}
    $ch = curl_init("http://192.168.1.210:8077/api/v1/wys");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "Authorization: Bearer $token",
        ],
        CURLOPT_POSTFIELDS => $postData,
        CURLOPT_TIMEOUT => 30, // Zwiększamy timeout do 30 sekund
    ]);

    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $info = curl_getinfo($ch);

    // Szczegółowe logowanie odpowiedzi API
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
        // Zapisz początek odpowiedzi do debugowania
        $responsePreview = substr($response, 0, 500);
        file_put_contents(__DIR__ . '/../../api_video_errors.log',
            "Error for clip $clipId: HTTP $code\nResponse: $responsePreview\n", FILE_APPEND);

        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Error fetching video',
            'code' => $code,
            'message' => $error,
            'response' => substr($response, 0, 200) // Pokaż część odpowiedzi dla debugowania
        ]);
        exit;
    }

    // Sprawdź, czy odpowiedź to wideo
    if (strpos($response, '{') === 0) {
        // To prawdopodobnie JSON z błędem, a nie wideo
        file_put_contents(__DIR__ . '/../../api_video_errors.log',
            "JSON response instead of video for clip $clipId: $response\n", FILE_APPEND);

        http_response_code(500);
        header('Content-Type: application/json');
        echo $response;
        exit;
    }

    // Sprawdź, czy odpowiedź nie jest pusta
    if (empty($response)) {
        file_put_contents(__DIR__ . '/../../api_video_errors.log',
            "Empty response for clip $clipId\n", FILE_APPEND);

        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Empty video response']);
        exit;
    }

    // Ustaw odpowiednie nagłówki dla wideo
    header('Content-Type: video/mp4');
    header('Content-Length: ' . strlen($response));
    header('Content-Disposition: inline; filename="clip_' . $clipId . '.mp4"');
    echo $response;
    exit;
}
// Obsługa żądania POST dla innych endpointów
else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
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