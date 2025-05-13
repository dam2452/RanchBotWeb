<?php
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';
?>
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="color-scheme" content="only light">
        <title><?= $pageTitle ?? 'RanchBot' ?></title>
        <link rel="stylesheet" href="/css/header.css">
        <?= $customHead ?? '' ?>
    </head>
<body>
    <header>
        <div class="auth-buttons">
            <?php if (is_logged_in()): ?>
                <span class="user-welcome" id="user-welcome-link" title="Kliknij, aby sprawdzić subskrypcję">
                Witaj, <?= htmlspecialchars(session_get('username')) ?>
            </span>
                <div id="subscription-tooltip" class="subscription-tooltip"></div>
                <button onclick="location.href='/my-clips'">My Clips</button>
                <button onclick="location.href='/logout'">Logout</button>
            <?php else: ?>
                <button onclick="location.href='/login'">Login</button>
                <button onclick="location.href='/register'">Register</button>
            <?php endif; ?>
        </div>
    </header>

<?php if (is_logged_in()): ?>
    <script type="module">
        // Add any authentication-related JavaScript here
        import { initSubscriptionTooltip } from '/js/components/SubscriptionTooltip.js';
        document.addEventListener('DOMContentLoaded', () => {
            initSubscriptionTooltip();
        });
    </script>
<?php endif; ?>