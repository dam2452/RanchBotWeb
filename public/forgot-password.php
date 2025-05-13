<?php
/**
 * Forgot Password page
 *
 * Handles password reset requests
 */
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';

// Set page title and CSS
$pageTitle = "Odzyskiwanie hasła - Niedostępne";
$customHead = '<link rel="stylesheet" href="css/register.css">';

// Include header
include_once __DIR__ . '/../templates/header.php';
?>

    <main class="page-container static-page">
        <div class="message-box info-box">
            <h1>Odzyskiwanie hasła</h1>
            <p class="important-message">
                Funkcja odzyskiwania hasła jest obecnie wyłączona.
            </p>
            <p>
                Trwa zamknięta beta aplikacji. Aby zresetować hasło, prosimy o kontakt z administratorem.
            </p>
            <p class="login-link-container">
                Pamiętasz swoje hasło?
            </p>
            <a href="./login.php" class="action-button">Zaloguj się</a>
        </div>
    </main>

<?php
// Include footer
include_once __DIR__ . '/../templates/footer.php';
?>