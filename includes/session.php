<?php
/**
 * Zarządzanie sesją użytkownika
 */
require_once __DIR__ . '/config.php';

// Inicjalizacja sesji
session_start();

/**
 * Sprawdza, czy użytkownik jest zalogowany
 *
 * @return bool True jeśli użytkownik jest zalogowany, false w przeciwnym razie
 */
function is_logged_in() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Zapisuje dane zalogowanego użytkownika do sesji
 *
 * @param array $user Dane użytkownika
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
 * Wylogowuje użytkownika (kończy sesję)
 *
 * @return void
 */
function logout_user() {
    // Najpierw wyloguj z API - funkcja zostanie zdefiniowana później
    if (function_exists('logout_from_api')) {
        logout_from_api();
    }

    // Usuń wszystkie dane sesji
    $_SESSION = array();

    // Usuń ciasteczko sesji
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }

    // Zakończ sesję
    session_destroy();
}

/**
 * Sprawdza, czy użytkownik ma dostęp do chronionej strony
 * Przekierowuje do login.php, jeśli użytkownik nie jest zalogowany
 *
 * @return void
 */
function require_login() {
    if (!is_logged_in()) {
        // Zapisz aktualny URL do sesji, aby powrócić do niego po zalogowaniu
        $_SESSION['return_to'] = $_SERVER['REQUEST_URI'];

        header('Location: /login.php');
        exit;
    }
}

/**
 * Funkcja sprawdzająca czy strona jest dostępna bez logowania
 *
 * @param string $currentPage Aktualna strona
 * @return bool True jeśli strona jest dostępna bez logowania, false w przeciwnym razie
 */
function is_public_page($currentPage) {
    // Lista stron dostępnych bez logowania
    $publicPages = array(
        '/index.php',
        '/',
        '/login.php', // Dodane aby zapobiec pętli przekierowań
        '/register.php', // Również powinno być dostępne bez logowania
        '/test_login.php', // Strona testowa logowania
        '/session_debug.php' // Strona debugowania sesji
    );

    return in_array($currentPage, $publicPages);
}