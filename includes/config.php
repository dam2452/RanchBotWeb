<?php
/**
 * Centralne ładowanie zmiennych z .env.dev
 * i udostępnianie JWT wewnątrz aplikacji.
 */

const PROJECT_ROOT = __DIR__ . '/..';                // katalog projektu
const ENV_FILE     = PROJECT_ROOT . '/.env.dev';     // ścieżka do .env.dev

// ─── Parsujemy ręcznie .env.dev ────────────────────────────────────────────────
if (file_exists(ENV_FILE)) {
    $lines = file(ENV_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $l) {
        if ($l[0] === '#' || !str_contains($l, '=')) continue; // komentarze
        [$k, $v] = array_map('trim', explode('=', $l, 2));
        putenv("$k=$v");   // zapis do $_ENV i getenv()
        $_ENV[$k] = $v;    // fallback
    }
}

$JWT_TOKEN = getenv('DEV_JWT_TOKEN') ?: null;
if (!$JWT_TOKEN) {
    error_log('[config] DEV_JWT_TOKEN not set – API calls będą odrzucane.');
}
