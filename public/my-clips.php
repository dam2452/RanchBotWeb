<?php
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
        <div id="loading-indicator" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: rgba(255,255,255,0.8); padding: 20px; border-radius: 10px; text-align: center;">
            <div class="spinner" style="width: 40px; height: 40px; border: 4px solid rgba(0,0,0,0.1); border-radius: 50%; border-top-color: #888; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <div style="margin-top: 15px; font-weight: bold;">Ładowanie klipów...</div>
        </div>

        <!-- Kontener na klipy -->
        <div class="clips-reel"></div>
    </main>

    <style>
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .error-message {
            position: fixed;
            top: 150px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255,0,0,0.1);
            border: 1px solid #ff6b6b;
            color: #d63031;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            max-width: 80%;
            text-align: center;
        }
        .no-clips-message {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255,255,255,0.8);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 900;
            font-size: 18px;
            color: #666;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
    </style>

    <script type="module" src="js/init/my-clips.js"></script>

<?php include_once __DIR__ . '/../templates/footer.php'; ?>