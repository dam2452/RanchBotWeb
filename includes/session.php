<?php
/**
 * Session management
 *
 * Handles user session initialization, validation, and management
 */
require_once __DIR__ . '/config.php';

// Initialize session
session_start();

/**
 * Check if user is logged in
 *
 * @return bool True if user is logged in
 */
function is_logged_in() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Save logged in user data to session
 *
 * @param array $user User data
 * @return void
 */
function login_user($user) {
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['full_name'] = $user['full_name'] ?? '';
    $_SESSION['logged_in'] = true;
    $_SESSION['login_time'] = time();
}

/**
 * Log out user (end session)
 *
 * @return void
 */
function logout_user() {
    // First logout from API if the function exists
    if (function_exists('logout_from_api')) {
        logout_from_api();
    }

    // Clear all session data
    $_SESSION = [];

    // Delete session cookie
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

    // End session
    session_destroy();
}

/**
 * Check if user has access to protected page
 * Redirects to login.php if user is not logged in
 *
 * @return void
 */
function require_login() {
    if (!is_logged_in()) {
        // Save current URL to session to return after login
        $_SESSION['return_to'] = $_SERVER['REQUEST_URI'];

        header('Location: /login.php');
        exit;
    }
}

/**
 * Check if page is publicly accessible without login
 *
 * @param string $currentPage Current page path
 * @return bool True if page is public
 */
function is_public_page($currentPage) {
    $publicPages = config('public_pages', [
        '/index.php',
        '/',
        '/login.php',
        '/register.php'
    ]);

    return in_array($currentPage, $publicPages);
}

/**
 * Store value in session
 *
 * @param string $key Session key
 * @param mixed $value Value to store
 * @return void
 */
function session_set($key, $value) {
    $_SESSION[$key] = $value;
}

/**
 * Get value from session
 *
 * @param string $key Session key
 * @param mixed $default Default value if key doesn't exist
 * @return mixed Value from session or default
 */
function session_get($key, $default = null) {
    return $_SESSION[$key] ?? $default;
}

/**
 * Remove value from session
 *
 * @param string $key Session key
 * @return void
 */
function session_remove($key) {
    if (isset($_SESSION[$key])) {
        unset($_SESSION[$key]);
    }
}

/**
 * Check if session has a key
 *
 * @param string $key Session key
 * @return bool True if key exists in session
 */
function session_has($key) {
    return isset($_SESSION[$key]);
}

/**
 * Get JWT token from session
 *
 * @return string|null JWT token or null if not set
 */
function get_jwt_token() {
    return $_SESSION['jwt_token'] ?? null;
}

/**
 * Set JWT token in session
 *
 * @param string $token JWT token
 * @return void
 */
function set_jwt_token($token) {
    $_SESSION['jwt_token'] = $token;

    // Also set in global $JWT_TOKEN for backward compatibility
    global $JWT_TOKEN;
    $JWT_TOKEN = $token;
}