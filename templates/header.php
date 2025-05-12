<?php
require_once __DIR__ . '/../includes/session.php';

// Sprawdź, czy bieżąca strona jest dostępna bez logowania
$currentPage = $_SERVER['PHP_SELF'];

// Nie sprawdzaj dostępu dla strony logowania, aby uniknąć pętli przekierowań
if ($currentPage !== '/login.php' && !is_public_page($currentPage) && !is_logged_in()) {
    $_SESSION['return_to'] = $_SERVER['REQUEST_URI'];
    header('Location: /login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="color-scheme" content="only light">
    <link rel="stylesheet" href="/css/header.css">
    <?= $customHead ?? '' ?>
</head>
<body>
<header>
    <div class="auth-buttons">
        <?php if (is_logged_in()): ?>
            <span class="user-welcome">Witaj, <?= htmlspecialchars($_SESSION['username']) ?></span>
            <button onclick="location.href='/my-clips.php'">My Clips</button>
            <button onclick="location.href='/logout.php'">Logout</button>
        <?php else: ?>
            <button onclick="location.href='/login.php'">Login</button>
            <button onclick="location.href='/register.php'">Register</button>
        <?php endif; ?>
    </div>
</header>