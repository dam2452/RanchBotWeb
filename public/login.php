<?php
require_once __DIR__ . '/../includes/auth.php'; // Zakładam, że ten plik też woła session_start() lub session.php

// Obsługa próby logowania
$login_error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!handle_login_attempt()) { // Zakładam, że ta funkcja obsługuje logowanie i sesję
        $login_error = 'Nieprawidłowa nazwa użytkownika lub hasło.';
    }
    // Jeśli logowanie się powiodło w handle_login_attempt(), powinno nastąpić przekierowanie wewnątrz tej funkcji
}

// Sprawdź, czy użytkownik jest zalogowany PO próbie logowania
// require_once __DIR__ . '/../includes/session.php'; // Upewnij się, że sesja jest dostępna
if (is_logged_in()) {
    // Domyślne przekierowanie po zalogowaniu lub jeśli już zalogowany
    $redirect_url = $_SESSION['return_to'] ?? '/search.php'; // Przekieruj tam, skąd przyszedł lub do search.php
    unset($_SESSION['return_to']); // Usuń zapamiętany URL
    header('Location: ' . $redirect_url);
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
                    <?php if (!empty($login_error)): ?>
                        <div class="error-message"><?php echo htmlspecialchars($login_error); ?></div>
                    <?php endif; ?>
                    <input type="text" name="login" placeholder="login" required autofocus />
                    <input type="password" name="password" placeholder="password" required />
                    <button type="submit">Zaloguj się</button>
                </form>
            </div>

            <div class="actions">
                <button onclick="location.href='/register.php'">Create account ?</button>
                <button onclick="location.href='/register.php'">Forgot password ?</button>
            </div>
        </section>
    </main>

<?php include_once __DIR__ . '/../templates/footer.php'; ?>