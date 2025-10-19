<?php
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/session.php';

header('Content-Type: application/json');

if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

echo json_encode([
    'status' => 'success',
    'user' => [
        'id' => session_get('user_id'),
        'username' => session_get('username'),
        'email' => ''
    ]
]);
