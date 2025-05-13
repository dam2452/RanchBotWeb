<?php
/**
 * Header template
 *
 * Common header for all pages
 */
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';

// Check if current page is accessible without login
$currentPage = $_SERVER['PHP_SELF'];

// Redirect to login page if user is not logged in and page is not public
if ($currentPage !== '/login.php' && !is_public_page($currentPage) && !is_logged_in()) {
    session_set('return_to', $_SERVER['REQUEST_URI']);
    redirect('/login.php');
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
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
            <span class="user-welcome" id="user-welcome-link" title="Kliknij, aby sprawdzić subskrypcję">
                Witaj, <?= htmlspecialchars(session_get('username')) ?>
            </span>
            <div id="subscription-tooltip" class="subscription-tooltip"></div>
            <button onclick="location.href='/my-clips.php'">My Clips</button>
            <button onclick="location.href='/logout.php'">Logout</button>
        <?php else: ?>
            <button onclick="location.href='/login.php'">Login</button>
            <button onclick="location.href='/register.php'">Register</button>
        <?php endif; ?>
    </div>
</header>

<!-- Load the subscription tooltip component only when user is logged in -->
<?php if (is_logged_in()): ?>
    <script type="module">
        import SubscriptionTooltip from '/js/components/SubscriptionTooltip.js';
        // Component is initialized automatically via its DOMContentLoaded event handler
    </script>
<?php endif; ?>
</body>
</html>