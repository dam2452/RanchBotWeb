<?php
/**
 * Auth functions for user authentication
 */
require_once __DIR__ . '/session.php';

/**
 * Check if a page is public (accessible without login)
 *
 * @param string $page Page path to check
 * @return bool True if page is public
 */
function is_public_page_auth($page) {
    $publicPages = [
        '/index.php',
        '/register.php',
        '/forgot-password.php',
        // API endpoints for non-authenticated actions
        '/api/api-json.php',
    ];

    return in_array($page, $publicPages);
}

/**
 * Handle login attempt
 *
 * @return bool True if login successful
 */
function handle_login_attempt() {
    if (empty($_POST['login']) || empty($_POST['password'])) {
        return false;
    }

    $login = $_POST['login'];
    $password = $_POST['password'];

    // Use API client to validate credentials
    $result = verify_credentials($login, $password);

    if ($result && isset($result['user_id'])) {
        // Store user data in session
        session_set('user_id', $result['user_id']);
        session_set('username', $result['username']);
        session_set('jwt_token', $result['token']);
        return true;
    }

    return false;
}

/**
 * Verify user credentials using API
 *
 * @param string $login User login
 * @param string $password User password
 * @return array|false User data or false if invalid
 */
function verify_credentials($login, $password) {
    // API client should be properly initialized
    require_once __DIR__ . '/api-client.php';

    // Call API to verify credentials
    $response = call_auth_api($login, $password);

    if ($response && isset($response['status']) && $response['status'] === 'success') {
        return [
            'user_id' => $response['data']['user_id'] ?? null,
            'username' => $response['data']['username'] ?? $login,
            'token' => $response['data']['token'] ?? null
        ];
    }

    return false;
}

/**
 * Call authentication API
 *
 * @param string $login User login
 * @param string $password User password
 * @return array|false API response or false on error
 */
function call_auth_api($login, $password) {
    // Implementation depends on your API client
    try {
        return api_request('/auth', [
            'login' => $login,
            'password' => $password
        ]);
    } catch (Exception $e) {
        error_log('Auth API error: ' . $e->getMessage());
        return false;
    }
}

/**
 * Logout current user
 *
 * This function replaces the logout_user in session.php
 */
function logout_user_auth() {
    session_remove('user_id');
    session_remove('username');
    session_remove('jwt_token');
    session_destroy();
}

/**
 * Require login to access a page
 *
 * @param string $redirect_url URL to redirect to if not logged in
 */
function require_login_auth($redirect_url = '/login.php') {
    if (!is_logged_in()) {
        redirect_auth($redirect_url);
    }
}

/**
 * Redirect to a URL
 *
 * @param string $url URL to redirect to
 */
function redirect_auth($url) {
    header('Location: ' . $url);
    exit;
}