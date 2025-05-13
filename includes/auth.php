<?php
/**
 * Authentication management
 *
 * Handles user authentication against the API backend
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/session.php';
require_once __DIR__ . '/logger.php';
require_once __DIR__ . '/api-client.php';

/**
 * Authenticate user via API
 *
 * @param string $username Username
 * @param string $password Password
 * @return array|false User data if authenticated, false otherwise
 */
function authenticate_user($username, $password) {
    // Prepare authentication data
    $payload = json_encode([
        'username' => $username,
        'password' => $password
    ]);

    // API URL
    $apiUrl = config('api.base_url') . '/auth/login';

    // Initialize cURL
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HEADER => true
    ]);

    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);

    // Log authentication attempt
    logger()->info("Auth attempt for user: $username", 'auth.log', [
        'http_code' => $httpCode,
        'error' => $error
    ]);

    // Check response
    if ($httpCode !== 200) {
        return false;
    }

    // Split headers from response body
    list($headers, $body) = explode("\r\n\r\n", $response, 2);

    // Parse JWT token
    $data = json_decode($body, true);
    if (!isset($data['access_token'])) {
        return false;
    }

    // Get token and decode payload
    $token = $data['access_token'];
    $tokenParts = explode('.', $token);
    if (count($tokenParts) !== 3) {
        return false;
    }

    // Decode JWT payload
    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
    $userData = json_decode($payload, true);

    // Save JWT token
    set_jwt_token($token);

    // Extract refresh token from cookies if present
    preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $headers, $matches);
    $cookies = [];
    foreach($matches[1] as $cookie) {
        $parts = explode('=', $cookie, 2);
        $cookies[$parts[0]] = $parts[1];
    }

    // Save refresh token if found
    if (isset($cookies['refresh_token'])) {
        session_set('refresh_token', $cookies['refresh_token']);
    }

    return $userData;
}

/**
 * Logout user from API
 *
 * @return bool True if logout succeeded, false otherwise
 */
function logout_from_api() {
    // Skip if no JWT token in session
    if (!session_has('jwt_token')) {
        return true;
    }

    // Get tokens
    $jwtToken = session_get('jwt_token');
    $refreshToken = session_get('refresh_token', '');

    // Set cookie header if refresh token exists
    $cookieHeader = '';
    if ($refreshToken) {
        $cookieHeader = "Cookie: refresh_token=$refreshToken";
    }

    // API URL
    $apiUrl = config('api.base_url') . '/auth/logout';

    // Initialize cURL
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "Authorization: Bearer $jwtToken",
            $cookieHeader
        ]
    ]);

    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Log logout attempt
    logger()->info("Logout attempt", 'auth.log', [
        'http_code' => $httpCode
    ]);

    return $httpCode === 200;
}

/**
 * Handle login attempt
 *
 * @return bool True if login succeeded, false otherwise
 */
function handle_login_attempt() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login']) && isset($_POST['password'])) {
        $username = trim($_POST['login']);
        $password = $_POST['password'];

        $user = authenticate_user($username, $password);

        if ($user) {
            login_user($user);

            // Redirect to return page or default
            $returnTo = session_get('return_to', config('auth.login_redirect', '/search.php'));
            session_remove('return_to');

            header("Location: $returnTo");
            exit;
        }

        return false;
    }

    return false;
}

/**
 * Get user subscription info
 *
 * @return array|false Subscription info or false on error
 */
function get_subscription_info() {
    return api_request('sub', []);
}