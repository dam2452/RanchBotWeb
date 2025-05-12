<?php
/**
 * Uproszczone API do obsługi klipów wideo
 */
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/session.php';

// Sprawdź, czy użytkownik jest zalogowany
if (!is_logged_in()) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

// Określ format odpowiedzi jako JSON
header('Content-Type: application/json');

// Pobierz akcję z parametru GET
$action = $_GET['action'] ?? '';

// Obsługa akcji get_clips - pobieranie listy klipów użytkownika
if ($action === 'get_clips') {
    try {
        // Pobierz token JWT z sesji
        $token = $_SESSION['jwt_token'] ?? null;

        if (!$token) {
            throw new Exception('Brak tokenu JWT w sesji');
        }

        // Utwórz połączenie CURL do API
        $ch = curl_init('http://192.168.1.210:8077/api/v1/mk');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer $token"
            ],
            CURLOPT_POSTFIELDS => '{}' // Pusty obiekt JSON, dokładnie jak w CURL
        ]);

        // Wykonaj zapytanie
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Zapisz informacje do pliku logów
        file_put_contents(__DIR__ . '/../../clips_api.log',
            date('Y-m-d H:i:s') . " - GET CLIPS\n" .
            "HTTP Code: $httpCode\n" .
            "Error: $error\n" .
            "Response: " . substr($response, 0, 100) . "...\n\n",
            FILE_APPEND
        );

        // Sprawdź kod odpowiedzi HTTP
        if ($httpCode !== 200) {
            throw new Exception("Błąd API: HTTP $httpCode");
        }

        // Zdekoduj odpowiedź JSON
        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Nieprawidłowa odpowiedź JSON: ' . json_last_error_msg());
        }

        // Sprawdź strukturę odpowiedzi
        if ($data['status'] !== 'success' || !isset($data['data']['clips'])) {
            throw new Exception('Nieprawidłowa struktura odpowiedzi API');
        }

        // Zwróć klipy jako JSON
        echo json_encode([
            'status' => 'success',
            'clips' => $data['data']['clips']
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

// Nieznana akcja
http_response_code(400);
echo json_encode([
    'status' => 'error',
    'message' => 'Nieznana akcja: ' . $action
]);