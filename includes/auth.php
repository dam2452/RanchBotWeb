<?php
require_once __DIR__ . '/session.php';

function is_public_page_auth(string $page): bool {
    $publicPages = [
        '/',
        '/login',
        '/register',
        '/forgot-password'
    ];
    return in_array($page, $publicPages, true);
}

function handle_login_attempt(): bool {
    if (empty($_POST['login']) || empty($_POST['password'])) {
        return false;
    }

    $login = $_POST['login'];
    $password = $_POST['password'];

    $result = verify_credentials($login, $password);

    if ($result && isset($result['user_id'])) {
        session_set('user_id', $result['user_id']);
        session_set('username', $result['username']);
        session_set('jwt_token', $result['token']);
        return true;
    }

    return false;
}

function verify_credentials(string $login, string $password): array|false {
    require_once __DIR__ . '/api-client.php';

    $response = call_auth_api($login, $password);

    if ($response && isset($response['access_token'])) {
        $token = $response['access_token'];
        $jwt_parts = explode('.', $token);
        $userData = [];

        if (count($jwt_parts) >= 2) {
            try {
                $payload = json_decode(base64_decode($jwt_parts[1]), true);
                $userData = [
                    'user_id' => $payload['user_id'] ?? null,
                    'username' => $payload['username'] ?? $login,
                    'token' => $token
                ];
            } catch (Exception $e) {
                error_log('Error decoding JWT: ' . $e->getMessage());
                $userData = [
                    'user_id' => mt_rand(10000, 99999),
                    'username' => $login,
                    'token' => $token
                ];
            }
        } else {
            $userData = [
                'user_id' => mt_rand(10000, 99999),
                'username' => $login,
                'token' => $token
            ];
        }

        return $userData;
    }

    return false;
}

function call_auth_api(string $login, string $password): array|false {
    try {
        $baseUrl = config('api.base_url');
        $url = $baseUrl . '/auth/login';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode([
                'username' => $login,
                'password' => $password
            ])
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Auth API error: HTTP $httpCode - $error");
            return false;
        }

        error_log("Auth response: " . substr((string)$response, 0, 100) . "...");

        return json_decode($response, true);
    } catch (Exception $e) {
        error_log('Auth API error: ' . $e->getMessage());
        return false;
    }
}

function logout_user_auth(): void {
    session_remove('user_id');
    session_remove('username');
    session_remove('jwt_token');
    session_destroy();
}

function require_login_auth(string $redirect_url = '/login.php'): void {
    if (!is_logged_in()) {
        redirect_auth($redirect_url);
    }
}

function redirect_auth(string $url): never {
    header('Location: ' . $url);
    exit;
}
