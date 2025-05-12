<?php
// Plik: public/register.php

// NAJPIERW załaduj i wystartuj sesję!
require_once __DIR__ . '/../includes/session.php'; // Upewnij się, że to jest PIERWSZA linia PHP

// Reszta kodu PHP przed HTMLem
$pageTitle = "Rejestracja - Niedostępna";
// Upewnij się, że linkujesz poprawny plik CSS. Jeśli używasz stylów z register.css:
$customHead = '<link rel="stylesheet" href="css/register.css">';
// Jeśli style są w static-page.css:
// $customHead = '<link rel="stylesheet" href="css/static-page.css">';

// Dołącz nagłówek strony (on też może wołać session.php, ale require_once to obsłuży)
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
            <a href="/login.php" class="action-button">Zaloguj się</a>
        </div>
    </main>

<?php
// Dołącz stopkę strony
include_once __DIR__ . '/../templates/footer.php';
?>