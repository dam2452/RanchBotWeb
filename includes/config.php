<?php

const PROJECT_ROOT = __DIR__ . '/..';
const ENV_FILE = PROJECT_ROOT . '/.env.dev';

function loadEnvironmentVars(): void {
    if (file_exists(ENV_FILE)) {
        $lines = file(ENV_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            if (empty($line) || $line[0] === '#' || !str_contains($line, '=')) {
                continue;
            }

            [$key, $value] = array_map('trim', explode('=', $line, 2));

            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

loadEnvironmentVars();

$config = [
    'api' => [
        'base_url' => rtrim(getenv('EXISTING_RANCHBOT_API_ADDRESS'), '/') . '/api/v1',
        'timeout' => 60,
    ],

    'auth' => [
        'jwt_token' => getenv('DEV_JWT_TOKEN') ?: null,
        'login_redirect' => '/search',
    ],

    'logging' => [
        'enabled' => true,
        'level' => 'error',
        'log_dir' => PROJECT_ROOT,
    ],

    'public_pages' => [
        '/',
        '/login',
        '/register',
        '/test_login',
        '/session_debug',
    ],
];


$JWT_TOKEN = $config['auth']['jwt_token'];

if (!$JWT_TOKEN) {
    error_log('[config] DEV_JWT_TOKEN not set – API calls will be rejected.');
}

function config(string $key, mixed $default = null): mixed {
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
