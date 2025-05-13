<?php
/**
 * Login page
 *
 * Handles user login
 */
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/session.php';

// Handle login attempt
$login_error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!handle_login_attempt()) {
        $login_error = 'Nieprawidłowa nazwa użytkownika lub hasło.';
    }
}

// Redirect if already logged in
if (is_logged_in()) {
    $redirect_url = session_get('return_to', '/search.php');
    session_remove('return_to');
    redirect($redirect_url);
}

// Set page title and CSS
$customHead = '
    <title>Login – RanchBot</title>
    <link rel="stylesheet" href="css/login.css">
';

// Include header
include_once __DIR__ . '/../templates/header.php';
?>

    <main>
        <section class="left">
            <a href="index.php">
                <img src="images/branding/logo.svg" class="logo-img" alt="RanchBot Logo" />
            </a>
            <h1>RanchBot</h1>
        </section>

        <section class="right">
            <div class="bench-container">
                <img src="images/others/bench.svg" alt="Bench Graphic" class="bench-image"/>
                <form class="form-overlay" action="login.php" method="POST">
                    <?php if (!empty($login_error)): ?>
                        <div class="error-message"><?= htmlspecialchars($login_error) ?></div>
                    <?php endif; ?>
                    <input type="text" name="login" placeholder="login" required autofocus />
                    <input type="password" name="password" placeholder="password" required />
                    <button type="submit">Zaloguj się</button>
                </form>
            </div>

            <div class="actions">
                <button onclick="location.href='/register.php'">Create account ?</button>
                <button onclick="location.href='/forgot-password.php'">Forgot password ?</button>
            </div>
        </section>
    </main>

<?php include_once __DIR__ . '/../templates/footer.php'; ?>