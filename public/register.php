<?php

require_once __DIR__ . '/../includes/session.php';

$pageTitle = "Rejestracja - Niedostępna";
$customHead = '<link rel="stylesheet" href="css/register.css">';

include_once __DIR__ . '/../templates/header.php';
?>

    <main class="page-container static-page">
        <div class="message-box info-box">
            <h1>Rejestracja</h1>
            <p class="important-message">
                Rejestracja nowych użytkowników jest obecnie wyłączona.
            </p>
            <p>
                Trwa zamknięta beta aplikacji. Aby uzyskać dostęp, prosimy o kontakt z administratorem.
            </p>
            <p class="login-link-container">
                Posiadasz już konto?
            </p>
            <a href="./login.php" class="action-button">Zaloguj się</a>
        </div>
    </main>

<?php

include_once __DIR__ . '/../templates/footer.php';
?>