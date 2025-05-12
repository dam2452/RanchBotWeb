<?php
/**
 * Autentykacja użytkownika poprzez RanchBot API
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/session.php';

/**
 * Uwierzytelnia użytkownika przez API RanchBot
 *
 * @param string $username Nazwa użytkownika
 * @param string $password Hasło użytkownika
 * @return array|false Dane użytkownika w przypadku powodzenia, false w przypadku niepowodzenia
 */
function authenticate_user($username, $password) {
    // Przygotuj dane do zapytania
    $payload = json_encode([
        'username' => $username,
        'password' => $password
    ]);

    // Inicjalizacja CURL
    $ch = curl_init('http://192.168.1.210:8077/api/v1/auth/login');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HEADER => true
    ]);

    // Wykonaj zapytanie
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    // Zapisz informacje debugowania
    $error = curl_error($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);

    // Utwórz plik debug.log
    file_put_contents(
        __DIR__ . '/../debug.log',
        date('Y-m-d H:i:s') . " - Auth attempt for user: $username\n" .
        "HTTP Code: $httpCode\n" .
        "Error: $error\n" .
        "Info: " . print_r($info, true) . "\n" .
        "Response: " . substr($response, 0, 1000) . "\n\n",
        FILE_APPEND
    );

    // Sprawdź odpowiedź
    if ($httpCode !== 200) {
        return false;
    }

    // Rozdziel nagłówki od treści odpowiedzi
    list($headers, $body) = explode("\r\n\r\n", $response, 2);

    // Parsuj JWT token
    $data = json_decode($body, true);
    if (!isset($data['access_token'])) {
        return false;
    }

    // Zdekoduj JWT aby uzyskać dane użytkownika
    $token = $data['access_token'];
    $tokenParts = explode('.', $token);
    if (count($tokenParts) !== 3) {
        return false;
    }

    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
    $userData = json_decode($payload, true);

    // Zapisz token JWT do globalnej zmiennej
    global $JWT_TOKEN;
    $JWT_TOKEN = $token;

    // Zapisz token do sesji
    $_SESSION['jwt_token'] = $token;

    // Szukaj cookie refresh_token w nagłówkach
    preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $headers, $matches);
    $cookies = [];
    foreach($matches[1] as $cookie) {
        $parts = explode('=', $cookie, 2);
        $cookies[$parts[0]] = $parts[1];
    }

    // Jeśli znaleziono refresh_token, zapisz go do sesji
    if (isset($cookies['refresh_token'])) {
        $_SESSION['refresh_token'] = $cookies['refresh_token'];
    }

    return $userData;
}

/**
 * Wylogowuje użytkownika z API
 *
 * @return bool True jeśli wylogowanie powiodło się, false w przeciwnym razie
 */
function logout_from_api() {
    // Jeśli nie ma tokena JWT, nie ma potrzeby wylogowywania z API
    if (!isset($_SESSION['jwt_token'])) {
        return true;
    }

    // Utwórz cookies z refresh_token, jeśli jest w sesji
    $cookieHeader = '';
    if (isset($_SESSION['refresh_token'])) {
        $cookieHeader = "Cookie: refresh_token=" . $_SESSION['refresh_token'];
    }

    // Inicjalizacja CURL
    $ch = curl_init('http://192.168.1.210:8077/api/v1/auth/logout');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "Authorization: Bearer " . $_SESSION['jwt_token'],
            $cookieHeader
        ]
    ]);

    // Wykonaj zapytanie
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Zapisz informacje debugowania
    file_put_contents(
        __DIR__ . '/../debug.log',
        date('Y-m-d H:i:s') . " - Logout attempt\n" .
        "HTTP Code: $httpCode\n" .
        "Response: " . $response . "\n\n",
        FILE_APPEND
    );

    return $httpCode === 200;
}

/**
 * Obsługa próby logowania
 *
 * @return bool True jeśli logowanie zakończone sukcesem, false w przeciwnym razie
 */
function handle_login_attempt() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login']) && isset($_POST['password'])) {
        $username = trim($_POST['login']);
        $password = $_POST['password'];

        $user = authenticate_user($username, $password);

        if ($user) {
            login_user($user);

            // Jeśli jest strona powrotu, przekieruj do niej
            if (isset($_SESSION['return_to'])) {
                $returnTo = $_SESSION['return_to'];
                unset($_SESSION['return_to']);
                header("Location: $returnTo");
            } else {
                header('Location: /search.php');
            }
            exit;
        } else {
            return false; // Nieudane logowanie
        }
    }

    return false; // Nie było próby logowania
}

/**
 * Funkcja pomocnicza do wykonywania zapytań do API z tokenem JWT
 *
 * @param string $endpoint Endpoint API
 * @param array|object|null $data Dane do wysłania (opcjonalne)
 * @param bool $emptyObject Czy wysłać pusty obiekt {} zamiast przekształconych danych
 * @return array|false Odpowiedź API lub false w przypadku błędu
 */
function call_api_with_auth($endpoint, $data = null, $emptyObject = false) {
    $token = $_SESSION['jwt_token'] ?? null;
    if (!$token) {
        error_log("Brak tokenu JWT w sesji");
        return false;
    }

    $url = "http://192.168.1.210:8077/api/v1/$endpoint";
    $ch = curl_init($url);

    $headers = [
        'Content-Type: application/json',
        "Authorization: Bearer $token"
    ];

    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => $headers
    ];

    // Ustaw dane do wysłania
    if ($emptyObject) {
        // Wyślij dokładnie {} - pusty obiekt JSON
        $options[CURLOPT_POSTFIELDS] = '{}';
    } else if ($data !== null) {
        // Domyślna struktura API: {"args": [dane]}
        if (is_array($data) && !isset($data['args'])) {
            $postData = ['args' => $data];
        } else {
            $postData = $data;
        }
        $options[CURLOPT_POSTFIELDS] = json_encode($postData);
    } else {
        // Brak danych - wyślij pusty obiekt JSON
        $options[CURLOPT_POSTFIELDS] = '{}';
    }

    curl_setopt_array($ch, $options);

    // Wykonaj zapytanie
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    // Logowanie do debugowania
    error_log("API call to $url with data: " . $options[CURLOPT_POSTFIELDS]);
    error_log("HTTP Code: $httpCode");
    if ($error) {
        error_log("CURL Error: $error");
    }

    if ($httpCode !== 200) {
        error_log("API call failed with HTTP code $httpCode: " . substr($response, 0, 500));
        return false;
    }

    $decoded = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Failed to decode JSON response: " . json_last_error_msg());
        return false;
    }

    return $decoded;
}