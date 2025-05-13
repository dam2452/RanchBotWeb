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
    <style>
        /* User welcome tooltip styles */
        #user-welcome-link {
            cursor: pointer;
            text-decoration: underline;
            text-decoration-style: dotted;
            position: relative;
            display: inline-block;
        }

        .subscription-tooltip {
            visibility: hidden;
            opacity: 0;
            position: absolute;
            background-color: #333;
            color: #fff;
            text-align: left;
            padding: 8px 12px;
            border-radius: 6px;
            z-index: 101;
            min-width: 220px;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            transition: opacity 0.3s ease, visibility 0s linear 0.3s;
            font-size: 0.9em;
            line-height: 1.4;
            bottom: -10px;
            left: 50%;
            transform: translate(-50%, 100%);
        }

        .subscription-tooltip::after {
            content: "";
            position: absolute;
            bottom: 100%;
            left: 50%;
            margin-left: -6px;
            border-width: 6px;
            border-style: solid;
            border-color: transparent transparent #333 transparent;
        }

        .subscription-tooltip.visible {
            visibility: visible;
            opacity: 1;
            transition: opacity 0.3s ease;
        }
    </style>
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

<script type="module">
    // API client for subscription data
    async function fetchApi(endpoint, args = []) {
        console.log(`Header: Wywołanie API ${endpoint} z argumentami:`, args);
        try {
            const response = await fetch('/api/api-json.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint, args })
            });

            // Check response
            const responseText = await response.text();
            if (!response.ok) {
                console.error(`Header: Błąd HTTP ${response.status} dla ${endpoint}:`, responseText);
                try {
                    const errorJson = JSON.parse(responseText);
                    throw new Error(errorJson.message || `Błąd serwera ${response.status}`);
                } catch(e) {
                    throw new Error(`Błąd serwera ${response.status}: ${responseText.substring(0,100)}`);
                }
            }

            // Parse JSON response
            try {
                const jsonData = JSON.parse(responseText);
                console.log(`Header: Odpowiedź API (${endpoint}) JSON:`, jsonData);
                return jsonData;
            } catch (e) {
                console.error(`Header: Odpowiedź ${endpoint} nie jest poprawnym JSON-em:`, responseText);
                throw new Error("Otrzymano nieprawidłową odpowiedź z serwera.");
            }
        } catch (error) {
            console.error(`Header: Błąd podczas wywołania ${endpoint}:`, error);
            throw error;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const welcomeLink = document.getElementById('user-welcome-link');
        const tooltip = document.getElementById('subscription-tooltip');

        // Check if elements exist (user is logged in)
        if (welcomeLink && tooltip) {
            let isTooltipVisible = false;
            let isLoading = false;

            // Handle welcome link click
            welcomeLink.addEventListener('click', async (e) => {
                e.stopPropagation();

                if (isLoading) return;

                if (isTooltipVisible) {
                    // Hide tooltip if visible
                    tooltip.classList.remove('visible');
                    isTooltipVisible = false;
                } else {
                    // Show tooltip and load data
                    isLoading = true;
                    tooltip.innerHTML = 'Sprawdzanie subskrypcji...';
                    tooltip.classList.add('visible');
                    isTooltipVisible = true;

                    try {
                        // Get subscription data
                        const response = await fetchApi('sub', []);

                        if (response && response.status === 'success' && response.data) {
                            const data = response.data;
                            const endDate = data.subscription_end || 'Brak danych';
                            const daysLeft = data.days_remaining;
                            let daysText = 'Nieznana';

                            // Format days text
                            if (typeof daysLeft === 'number' && !isNaN(daysLeft)) {
                                if (daysLeft > 1) {
                                    daysText = `Kończy się za ${daysLeft} dni`;
                                } else if (daysLeft === 1) {
                                    daysText = `Kończy się jutro`;
                                } else if (daysLeft === 0) {
                                    daysText = 'Kończy się dzisiaj';
                                } else {
                                    daysText = `Wygasła ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'dzień' : 'dni'} temu`;
                                }
                            } else {
                                daysText = '(Brak informacji o pozostałych dniach)';
                            }

                            // Format date
                            let formattedEndDate = endDate;
                            try {
                                const dateObj = new Date(endDate);
                                if (!isNaN(dateObj.getTime())) {
                                    formattedEndDate = dateObj.toLocaleDateString('pl-PL', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    });
                                }
                            } catch (dateError) {
                                console.warn("Nie można sformatować daty:", endDate);
                            }

                            // Update tooltip content
                            tooltip.innerHTML = `Subskrypcja aktywna do: <strong>${formattedEndDate}</strong><br>${daysText}`;
                        } else {
                            const errorMsg = response?.message || 'Nie udało się pobrać danych subskrypcji.';
                            tooltip.innerHTML = `Błąd: ${errorMsg}`;
                        }
                    } catch (error) {
                        console.error("Błąd podczas pobierania danych subskrypcji:", error);
                        tooltip.innerHTML = `Błąd: ${error.message}`;
                    } finally {
                        isLoading = false;
                    }
                }
            });

            // Hide tooltip when clicking outside
            document.addEventListener('click', (e) => {
                if (isTooltipVisible && !tooltip.contains(e.target) && e.target !== welcomeLink) {
                    tooltip.classList.remove('visible');
                    isTooltipVisible = false;
                }
            });
        }
    });
</script>
</body>
</html>