<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/session.php';

// Wyloguj użytkownika z API, a następnie lokalnie
logout_user();

// Przekieruj do strony głównej
header('Location: /index.php');
exit;