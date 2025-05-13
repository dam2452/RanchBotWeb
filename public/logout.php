<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/response.php';

// Wyloguj użytkownika
// Używamy funkcji logout_user z session.php
logout_user();

// Przekieruj do strony głównej
// Używamy funkcji redirect z response.php
redirect('/index.php');