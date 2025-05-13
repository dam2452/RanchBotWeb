<?php

require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/response.php';

$currentPage = $_SERVER['PHP_SELF'];

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

<?php if (is_logged_in()): ?>
    <script type="module">
    </script>
<?php endif; ?>
</body>
</html>