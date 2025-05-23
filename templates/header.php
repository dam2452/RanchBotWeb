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
        <link rel="stylesheet" href="/css/pages/header.css">
        <link rel="stylesheet" href="/css/components/user-button.css">
        <?= $customHead ?? '' ?>
    </head>
<body>
    <header>
        <div class="auth-buttons">
            <?php if (is_logged_in()): ?>
                <div class="tooltip-container">
                    <button id="user-welcome-link" title="Click to check your subscription">
                        Hi, <?= htmlspecialchars(session_get('username')) ?>
                    </button>
                    <div id="subscription-tooltip" class="subscription-tooltip"></div>
                </div>
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
        import { initSubscriptionTooltip } from '/js/components/SubscriptionTooltip.js';
        document.addEventListener('DOMContentLoaded', () => {
            initSubscriptionTooltip();
        });
    </script>
<?php endif; ?>