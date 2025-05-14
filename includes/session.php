<?php
require_once __DIR__ . '/config.php';

session_start();

function is_logged_in(): bool {
    return !empty($_SESSION['user_id']);
}

function login_user(array $user): void {
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['full_name'] = $user['full_name'] ?? '';
    $_SESSION['logged_in'] = true;
    $_SESSION['login_time'] = time();
}

function logout_user(): void {
    if (function_exists('logout_from_api')) {
        logout_from_api();
    }

    $_SESSION = [];

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    session_destroy();
}

function require_login(): void {
    if (!is_logged_in()) {
        $_SESSION['return_to'] = $_SERVER['REQUEST_URI'];
        header('Location: /login.php');
        exit;
    }
}

function is_public_page(string $currentPage): bool {
    $publicPages = config('public_pages', [
        '/index.php',
        '/',
        '/login.php',
        '/register.php'
    ]);

    return in_array($currentPage, $publicPages, true);
}

function session_set(string $key, mixed $value): void {
    $_SESSION[$key] = $value;
}

function session_get(string $key, mixed $default = null): mixed {
    return $_SESSION[$key] ?? $default;
}

function session_remove(string $key): void {
    unset($_SESSION[$key]);
}

function session_has(string $key): bool {
    return isset($_SESSION[$key]);
}

function get_jwt_token(): ?string {
    return $_SESSION['jwt_token'] ?? null;
}

function set_jwt_token(string $token): void {
    $_SESSION['jwt_token'] = $token;

    global $JWT_TOKEN;
    $JWT_TOKEN = $token;
}
