<?php
require_once __DIR__ . '/config.php';

session_start();

function is_logged_in() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function login_user($user) {
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['full_name'] = $user['full_name'] ?? '';
    $_SESSION['logged_in'] = true;
    $_SESSION['login_time'] = time();
}

function logout_user() {
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

function require_login() {
    if (!is_logged_in()) {
        $_SESSION['return_to'] = $_SERVER['REQUEST_URI'];

        header('Location: /login.php');
        exit;
    }
}

function is_public_page($currentPage) {
    $publicPages = config('public_pages', [
        '/index.php',
        '/',
        '/login.php',
        '/register.php'
    ]);

    return in_array($currentPage, $publicPages);
}

function session_set($key, $value) {
    $_SESSION[$key] = $value;
}

function session_get($key, $default = null) {
    return $_SESSION[$key] ?? $default;
}

function session_remove($key) {
    if (isset($_SESSION[$key])) {
        unset($_SESSION[$key]);
    }
}

function session_has($key) {
    return isset($_SESSION[$key]);
}

function get_jwt_token() {
    return $_SESSION['jwt_token'] ?? null;
}

function set_jwt_token($token) {
    $_SESSION['jwt_token'] = $token;

    global $JWT_TOKEN;
    $JWT_TOKEN = $token;
}
