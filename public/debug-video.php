<?php
/**
 * Uproszczona wersja debug-video.php używająca tylko nazwy klipu.
 */
require_once __DIR__ . '/../includes/auth.php'; // Zakładamy, że ten plik definiuje is_logged_in()
require_once __DIR__ . '/../includes/session.php'; // Zakładamy, że ten plik startuje sesję i zarządza tokenem

// Włącz wyświetlanie błędów (dla debugowania, wyłącz na produkcji)
// ini_set('display_errors', 1); // Możesz to włączyć podczas testów
// error_reporting(E_ALL); // Możesz to włączyć podczas testów

// Sprawdź, czy użytkownik jest zalogowany
if (!is_logged_in()) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Pobierz NAZWĘ klipu z parametru GET 'id'
// Frontend (my-clips.js) MUSI wysyłać nazwę jako ten parametr
$clip_name = $_GET['id'] ?? null;

if (!$clip_name) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => 'No clip name (id parameter) provided']);
    exit;
}

// Użyj tokenu JWT z sesji
$token = $_SESSION['jwt_token'] ?? null; // Dostosuj, jeśli token jest przechowywany inaczej

if (!$token) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'No JWT token available in session']);
    exit;
}

// Zapisz informacje do pliku logów przed zapytaniem
$pre_log = [
    'time' => date('Y-m-d H:i:s'),
    'requested_clip_name' => $clip_name, // Logujemy nazwę
];
// Opcjonalne logowanie żądania
// file_put_contents(__DIR__ . '/../debug_video_requests.log', json_encode($pre_log) . "\n", FILE_APPEND);

// --- Funkcja do pobierania wideo z API backendu ---
function fetchVideoByName($name, $token) {
    $backend_api_url = "http://192.168.1.210:8077/api/v1/wys"; // URL API backendu

    // Przygotuj zapytanie CURL
    $ch = curl_init($backend_api_url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, // Zwróć odpowiedź jako string
        CURLOPT_POST => true,           // Metoda POST
        CURLOPT_HTTPHEADER => [         // Nagłówki
            'Content-Type: application/json',
            "Authorization: Bearer $token",
        ],
        CURLOPT_POSTFIELDS => json_encode(['args' => [$name]]), // Wyślij nazwę w argumencie
        CURLOPT_TIMEOUT => 60,          // Timeout 60 sekund
        CURLOPT_FAILONERROR => false,   // Nie traktuj błędów HTTP jako błędów cURL (chcemy kod statusu)
        CURLOPT_HEADER => false,        // Nie dołączaj nagłówków odpowiedzi do wyniku $response_body
    ]);

    // Wykonaj zapytanie
    $response_body = curl_exec($ch);
    $info = curl_getinfo($ch);
    $curl_error = curl_error($ch);
    curl_close($ch);

    // Zwróć wynik
    return [
        'body' => $response_body,
        'info' => $info,
        'curl_error' => $curl_error,
        'http_code' => $info['http_code'] ?? 0,
        'content_type' => $info['content_type'] ?? null,
    ];
}
// --- Koniec funkcji fetchVideoByName ---

// Wywołaj funkcję, aby pobrać wideo używając nazwy
$result = fetchVideoByName($clip_name, $token);

// Zapisz odpowiedź do logów (opcjonalne)
$log_data = [
    'time' => date('Y-m-d H:i:s'),
    'requested_clip_name' => $clip_name,
    'http_code' => $result['http_code'],
    'content_type' => $result['content_type'],
    'response_size' => $result['body'] ? strlen($result['body']) : 0,
    'curl_error' => $result['curl_error'],
    // Sprawdź, czy odpowiedź wygląda jak JSON (może być błąd z backend API)
    'is_likely_json_error' => $result['body'] && isset($result['body'][0]) && ($result['body'][0] === '{' || $result['body'][0] === '['),
];
// file_put_contents(__DIR__ . '/../debug_video_responses.log', json_encode($log_data) . "\n", FILE_APPEND);


// Sprawdź, czy pobieranie się powiodło i czy otrzymaliśmy dane wideo
// Zakładamy, że sukces to kod 200 i content-type związany z wideo lub octet-stream
// ORAZ że odpowiedź NIE jest JSONem (bo JSON z /wys oznaczałby błąd)
$is_success = $result['http_code'] === 200 && $result['body'] && !$log_data['is_likely_json_error'] && $result['content_type'] &&
    (strpos($result['content_type'], 'video') !== false || strpos($result['content_type'], 'octet-stream') !== false);


if ($is_success) {
    // Sukces - zwróć dane wideo przeglądarce

    // Zapisz info o sukcesie do osobnego logu (opcjonalne)
    $success_log = [
        'time' => date('Y-m-d H:i:s'),
        'clip_name' => $clip_name,
        'content_type' => $result['content_type'],
        'size' => strlen($result['body'])
    ];
    // file_put_contents(__DIR__ . '/../debug_video_success.log', json_encode($success_log) . "\n", FILE_APPEND);

    // Ustaw odpowiednie nagłówki dla wideo
    // Użyj content-type zwróconego przez backend API lub domyślnego video/mp4
    $contentType = $result['content_type'] ?: 'video/mp4';
    header('Content-Type: ' . $contentType);
    header('Content-Length: ' . strlen($result['body']));
    header('Accept-Ranges: bytes'); // Dodaj obsługę zakresów, jeśli player jej potrzebuje
    header('Cache-Control: public, max-age=3600'); // Cache na 1 godzinę
    // Użyj nazwy pliku, usuwając znaki specjalne dla bezpieczeństwa
    $safe_filename = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $clip_name);
    // Dodaj rozszerzenie .mp4 jeśli go brakuje w Content-Type
    if (strpos($contentType, 'mp4') === false) {
        $safe_filename .= '.mp4';
    }
    header('Content-Disposition: inline; filename="' . $safe_filename . '"');

    // Wyślij ciało odpowiedzi (dane wideo)
    // Wyłącz buforowanie wyjścia dla strumieniowania dużych plików (opcjonalnie, ale zalecane)
    if (ob_get_level()) {
        ob_end_clean();
    }
    echo $result['body'];
    exit;

} else {
    // Błąd - nie udało się pobrać wideo lub backend zwrócił błąd

    // Zwróć błąd 404 Not Found (lub inny odpowiedni kod)
    $error_code = ($result['http_code'] >= 400 && $result['http_code'] < 500) ? $result['http_code'] : 404; // Użyj kodu błędu backendu jeśli to błąd klienta
    if ($result['http_code'] >= 500) $error_code = 502; // Błąd po stronie backendu -> Bad Gateway
    if (!empty($result['curl_error'])) $error_code = 504; // Błąd połączenia -> Gateway Timeout

    header('Content-Type: application/json');
    http_response_code($error_code);
    echo json_encode([
        'error' => 'Failed to retrieve video clip from backend.',
        'requested_clip_name' => $clip_name,
        'backend_http_code' => $result['http_code'],
        'backend_curl_error' => $result['curl_error'],
        // Możesz dodać fragment odpowiedzi backendu, jeśli była to np. wiadomość JSON
        'backend_response_snippet' => substr($result['body'] ?? '', 0, 200)
    ]);
    exit;
}