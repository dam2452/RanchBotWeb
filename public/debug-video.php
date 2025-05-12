<?php
/**
 * Finalna wersja debug-video.php obsługująca ID, indeksy i nazwy klipów
 */
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/session.php';

// Włącz wyświetlanie wszystkich błędów
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Sprawdź, czy użytkownik jest zalogowany
if (!is_logged_in()) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Pobierz parametr identyfikujący klip (ID, indeks lub nazwa)
$clip_param = $_GET['id'] ?? null;
$fallback = isset($_GET['fallback']) ? true : false;

if (!$clip_param) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['error' => 'No clip parameter provided']);
    exit;
}

// Użyj tokenu JWT z sesji lub zmiennej globalnej
$token = $_SESSION['jwt_token'] ?? $JWT_TOKEN ?? null;

if (!$token) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'No JWT token available']);
    exit;
}

// Zapisz informacje do pliku logów przed zapytaniem
$pre_log = [
    'time' => date('Y-m-d H:i:s'),
    'clip_param' => $clip_param,
    'fallback' => $fallback ? 'true' : 'false',
];
file_put_contents(__DIR__ . '/../debug_video_requests.log', json_encode($pre_log) . "\n", FILE_APPEND);

// Pobierz listę wszystkich klipów z API
function getClipsData() {
    global $token;
    $ch = curl_init("http://192.168.1.210:8077/api/v1/mk");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "Authorization: Bearer $token",
        ],
        CURLOPT_POSTFIELDS => '{}',
        CURLOPT_TIMEOUT => 30,
    ]);

    $response = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);

    if ($info['http_code'] === 200 && $response) {
        $data = json_decode($response, true);
        if (isset($data['data']['clips']) && is_array($data['data']['clips'])) {
            return $data['data']['clips'];
        }
    }
    return [];
}

// Funkcja do pobierania wideo
function fetchVideo($id, $token) {
    // Przygotuj zapytanie CURL
    $ch = curl_init("http://192.168.1.210:8077/api/v1/wys");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "Authorization: Bearer $token",
        ],
        CURLOPT_POSTFIELDS => json_encode(['args' => ["$id"]]), // Konwertuj na string
        CURLOPT_TIMEOUT => 60, // Timeout 60 sekund
    ]);

    // Wykonaj zapytanie
    $response = curl_exec($ch);
    $info = curl_getinfo($ch);
    $error = curl_error($ch);
    curl_close($ch);

    // Zapisz informacje do pliku logów
    $log_data = [
        'time' => date('Y-m-d H:i:s'),
        'clip_parameter' => $id,
        'http_code' => $info['http_code'],
        'curl_error' => $error,
        'content_type' => $info['content_type'] ?? 'unknown',
        'response_size' => $response ? strlen($response) : 0,
        'is_json' => $response && substr($response, 0, 1) === '{',
    ];
    file_put_contents(__DIR__ . '/../debug_video_responses.log', json_encode($log_data) . "\n", FILE_APPEND);

    // Zwróć odpowiedź i informacje
    return [
        'response' => $response,
        'info' => $info,
        'error' => $error,
        'is_json' => $response && substr($response, 0, 1) === '{',
        'is_video' => $info['content_type'] && (
                strpos($info['content_type'], 'video') !== false ||
                strpos($info['content_type'], 'octet-stream') !== false
            )
    ];
}

// Pobierz listę klipów i utwórz różne mapowania
$clips = getClipsData();

// Utwórz mapowania: indeks->ID, ID->nazwa, nazwa->ID
$index_to_id = [];
$id_to_name = [];
$name_to_id = [];
$all_ids = [];
$all_names = [];

$index = 1; // Indeks zaczyna się od 1 w API Telegram
foreach ($clips as $clip) {
    if (isset($clip['id'])) {
        $index_to_id[$index] = $clip['id'];
        $all_ids[] = $clip['id'];

        if (isset($clip['name']) && !empty($clip['name'])) {
            $id_to_name[$clip['id']] = $clip['name'];
            $name_to_id[$clip['name']] = $clip['id'];
            $all_names[] = $clip['name'];
        }

        $index++;
    }
}

// Ustal metodę dostępu do klipu i parametry do wypróbowania
$possible_params = [];

// 1. Sprawdź, czy parametr to indeks (1-10)
if (is_numeric($clip_param) && $clip_param >= 1 && $clip_param <= count($index_to_id)) {
    if (isset($index_to_id[$clip_param])) {
        $possible_params[] = $index_to_id[$clip_param]; // ID z mapy indeksów

        // Dodaj nazwę klipu, jeśli jest dostępna
        $id = $index_to_id[$clip_param];
        if (isset($id_to_name[$id])) {
            $possible_params[] = $id_to_name[$id]; // Nazwa klipu
        }

        // Dodaj także oryginalny parametr (indeks)
        $possible_params[] = $clip_param;
    }
}
// 2. Sprawdź, czy parametr to ID klipu
else if (is_numeric($clip_param) && in_array($clip_param, $all_ids)) {
    $possible_params[] = $clip_param; // ID klipu

    // Dodaj nazwę klipu, jeśli jest dostępna
    if (isset($id_to_name[$clip_param])) {
        $possible_params[] = $id_to_name[$clip_param]; // Nazwa klipu
    }
}
// 3. Sprawdź, czy parametr to nazwa klipu
else if (in_array($clip_param, $all_names)) {
    $possible_params[] = $clip_param; // Nazwa klipu

    // Dodaj ID klipu
    if (isset($name_to_id[$clip_param])) {
        $possible_params[] = $name_to_id[$clip_param]; // ID klipu
    }
}
// 4. W przeciwnym razie, spróbujmy bezpośrednio z parametrem
else {
    $possible_params[] = $clip_param;
}

// Dodaj indeksy 1, 2, 3, które wiemy, że działają
if ($fallback) {
    for ($i = 1; $i <= 5; $i++) {
        // Dodaj indeks jako string
        if (!in_array("$i", $possible_params)) {
            $possible_params[] = "$i";
        }

        // Dodaj odpowiadające ID
        if (isset($index_to_id[$i]) && !in_array($index_to_id[$i], $possible_params)) {
            $possible_params[] = $index_to_id[$i];
        }

        // Dodaj odpowiadającą nazwę
        if (isset($index_to_id[$i]) && isset($id_to_name[$index_to_id[$i]]) &&
            !in_array($id_to_name[$index_to_id[$i]], $possible_params)) {
            $possible_params[] = $id_to_name[$index_to_id[$i]];
        }
    }

    // Dodaj wszystkie nazwy klipów jako ostateczny fallback, ponieważ nazwy działają dobrze
    foreach ($all_names as $name) {
        if (!in_array($name, $possible_params)) {
            $possible_params[] = $name;
        }
    }
}

// Usuń duplikaty i puste wartości
$possible_params = array_unique(array_filter($possible_params));

// Zapisz listę parametrów do wypróbowania do logów
file_put_contents(__DIR__ . '/../debug_params_to_try.log',
    "Original param: $clip_param\nParams to try: " . implode(', ', $possible_params) . "\n",
    FILE_APPEND);

// Spróbuj pobrać wideo dla każdego parametru
$successful_param = null;
$successful_response = null;

foreach ($possible_params as $param) {
    $result = fetchVideo($param, $token);

    // Jeśli odpowiedź jest filmem wideo, zapisz ją i parametr
    if ($result['info']['http_code'] === 200 && !$result['is_json'] && $result['response'] &&
        ($result['is_video'] || $result['info']['content_type'] === 'application/octet-stream')) {

        $successful_param = $param;
        $successful_response = $result['response'];
        break;
    }
}

// Jeśli znaleźliśmy działające wideo, zwróć je
if ($successful_response) {
    // Zapisz do logów informacje o sukcesie
    $success_log = [
        'time' => date('Y-m-d H:i:s'),
        'requested_param' => $clip_param,
        'successful_param' => $successful_param,
        'is_fallback' => ($clip_param != $successful_param) ? 'true' : 'false',
    ];
    file_put_contents(__DIR__ . '/../debug_video_success.log', json_encode($success_log) . "\n", FILE_APPEND);

    // Ustaw odpowiednie nagłówki dla wideo
    header('Content-Type: video/mp4');
    header('Content-Length: ' . strlen($successful_response));
    header('Cache-Control: public, max-age=3600'); // Cache na 1 godzinę
    header('Content-Disposition: inline; filename="clip_' . $successful_param . '.mp4"');
    echo $successful_response;
    exit;
}

// Jako ostateczność, zwróć błąd w formacie JSON
header('Content-Type: application/json');
http_response_code(404);
echo json_encode([
    'error' => 'No working video found',
    'requested_param' => $clip_param,
    'tried_params' => $possible_params
]);
exit;