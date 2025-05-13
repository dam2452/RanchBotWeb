<?php
/**
 * Core configuration loader
 *
 * This file handles loading environment variables and setting up global configuration.
 */

// Define project paths
const PROJECT_ROOT = __DIR__ . '/..';
const ENV_FILE = PROJECT_ROOT . '/.env.dev';

/**
 * Load environment variables from .env.dev file
 */
function loadEnvironmentVars() {
    if (file_exists(ENV_FILE)) {
        $lines = file(ENV_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            // Skip comments and invalid lines
            if (empty($line) || $line[0] === '#' || !str_contains($line, '=')) {
                continue;
            }

            // Parse key-value pair
            [$key, $value] = array_map('trim', explode('=', $line, 2));

            // Set environment variable
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

// Load environment variables
loadEnvironmentVars();

// Application configuration
$config = [
    // API configuration
    'api' => [
        'base_url' => 'http://192.168.1.210:8077/api/v1',
        'timeout' => 60,
    ],

    // Authentication settings
    'auth' => [
        'jwt_token' => getenv('DEV_JWT_TOKEN') ?: null,
        'login_redirect' => '/search.php',
    ],

    // Logging configuration
    'logging' => [
        'enabled' => true,
        'level' => 'error', // options: debug, info, warning, error
        'log_dir' => PROJECT_ROOT,
    ],

    // Public pages (accessible without login)
    'public_pages' => [
        '/index.php',
        '/',
        '/login.php',
        '/register.php',
        '/test_login.php',
        '/session_debug.php',
    ],
];

// Global JWT token for backward compatibility
$JWT_TOKEN = $config['auth']['jwt_token'];

if (!$JWT_TOKEN) {
    error_log('[config] DEV_JWT_TOKEN not set – API calls będą odrzucane.');
}

/**
 * Get configuration value
 *
 * @param string $key Configuration key using dot notation (e.g., 'api.base_url')
 * @param mixed $default Default value if key doesn't exist
 * @return mixed Configuration value or default
 */
function config($key, $default = null) {
    global $config;

    $keys = explode('.', $key);
    $value = $config;

    foreach ($keys as $part) {
        if (!isset($value[$part])) {
            return $default;
        }
        $value = $value[$part];
    }

    return $value;
}