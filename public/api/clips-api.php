<?php
/**
 * Clips API - API for managing user clips
 */
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/session.php';

// Check if user is logged in
if (!is_logged_in()) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

// Specify response format as JSON
header('Content-Type: application/json');

// Get action from GET parameter
$action = $_GET['action'] ?? '';

// Handle get_clips action
if ($action === 'get_clips') {
    try {
        // Get JWT token from session
        $token = $_SESSION['jwt_token'] ?? null;

        if (!$token) {
            throw new Exception('Brak tokenu JWT w sesji');
        }

        // Create CURL connection to API
        $ch = curl_init('http://192.168.1.210:8077/api/v1/mk');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                "Authorization: Bearer $token"
            ],
            CURLOPT_POSTFIELDS => '{}' // Empty JSON object
        ]);

        // Execute request
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Log information
        file_put_contents(__DIR__ . '/../../clips_api.log',
            date('Y-m-d H:i:s') . " - GET CLIPS\n" .
            "HTTP Code: $httpCode\n" .
            "Error: $error\n" .
            "Response: " . substr($response, 0, 100) . "...\n\n",
            FILE_APPEND
        );

        // Check HTTP response code
        if ($httpCode !== 200) {
            throw new Exception("Błąd API: HTTP $httpCode");
        }

        // Decode JSON response
        $data = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Nieprawidłowa odpowiedź JSON: ' . json_last_error_msg());
        }

        // Check response structure
        if ($data['status'] !== 'success' || !isset($data['data']['clips'])) {
            throw new Exception('Nieprawidłowa struktura odpowiedzi API');
        }

        // FIXED: Return clips directly in the response for compatibility
        echo json_encode([
            'status' => 'success',
            'clips' => $data['data']['clips'],
            'data' => $data['data']  // Include the original data structure too for backwards compatibility
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

// Unknown action
http_response_code(400);
echo json_encode([
    'status' => 'error',
    'message' => 'Nieznana akcja: ' . $action
]);