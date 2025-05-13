<?php
// public/my-clips.php (Refactored)
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/session.php';

// Sprawdź, czy użytkownik jest zalogowany
require_login();

// Ustawienie własnego nagłówka
$customHead = '<link rel="stylesheet" href="css/my-clips.css">';

include_once __DIR__ . '/../templates/header.php';
?>

    <main class="my-clips-page">
        <div class="my-clips-header">
            <h1>My Clips</h1>
        </div>

        <!-- Wskaźnik ładowania -->
        <div id="loading-indicator">
            <div class="spinner"></div>
            <div style="margin-top: 15px; font-weight: bold;">Ładowanie klipów...</div>
        </div>

        <!-- Kontener na klipy -->
        <div class="clips-reel"></div>
    </main>

    <script type="module" src="js/init/my-clips.js"></script>

<?php include_once __DIR__ . '/../templates/footer.php'; ?>