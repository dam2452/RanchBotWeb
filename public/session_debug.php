<?php

// Dodaj ten plik jako session_debug.php do katalogu public

header('Content-Type: text/plain');

echo "SESSION DEBUG INFO\n";
echo "=================\n\n";

echo "SESSION DATA:\n";
print_r($_SESSION);

echo "\n\nSERVER DATA:\n";
echo "PHP_SELF: " . $_SERVER['PHP_SELF'] . "\n";
echo "REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "SCRIPT_NAME: " . $_SERVER['SCRIPT_NAME'] . "\n";

echo "\n\nCOOKIES:\n";
print_r($_COOKIE);

echo "\n\nSESSION STATUS:\n";
echo "session_status: " . session_status() . "\n";
echo "session_id: " . session_id() . "\n";
echo "session_name: " . session_name() . "\n";

echo "\n\nIS_LOGGED_IN: " . (is_logged_in() ? 'true' : 'false') . "\n";
echo "IS_PUBLIC_PAGE: " . (is_public_page($_SERVER['PHP_SELF']) ? 'true' : 'false') . "\n";

function is_logged_in()
{
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function is_public_page($currentPage)
{
    $publicPages = array(
        '/index.php',
        '/',
        '/login.php',
        '/register.php',
        '/session_debug.php'
    );

    return in_array($currentPage, $publicPages);
}