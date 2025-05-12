<?php
require_once __DIR__ . '/../includes/auth.php';

// Obsługa próby logowania
$login_error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!handle_login_attempt()) {
        $login_error = 'Nieprawidłowa nazwa użytkownika lub hasło.';
    }
}

// Jeśli użytkownik jest już zalogowany, przekieruj do search.php
if (is_logged_in()) {
    header('Location: /search.php');
    exit;
}

$customHead = '
    <title>Login – RanchBot</title>
    <link rel="stylesheet" href="css/login.css">
';
include_once __DIR__ . '/../templates/header.php';
?>

    <main>
        <section class="left">
            <a href="index.php">
                <img src="images/logo.svg" class="logo-img" alt="RanchBot Logo" />
            </a>
            <h1>RanchBot</h1>
        </section>

        <section class="right">
            <div class="bench-container">
                <img src="images/bench.svg" alt="Bench Graphic" class="bench-image"/>
                <form class="form-overlay" action="login.php" method="POST">
                    <?php if ($login_error): ?>
                        <div class="error-message"><?php echo htmlspecialchars($login_error); ?></div>
                    <?php endif; ?>
                    <input type="text" name="login" placeholder="login" required />
                    <input type="password" name="password" placeholder="password" required />
                    <button type="submit">continue</button>
                </form>
            </div>

            <div class="actions">
                <button onclick="location.href='register.php'">Create account ?</button>
                <button>Forgot password ?</button>
            </div>
        </section>
    </main>

<?php include_once __DIR__ . '/../templates/footer.php'; ?>