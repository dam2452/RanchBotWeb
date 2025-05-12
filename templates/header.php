<?php
require_once __DIR__ . '/../includes/session.php';

// Sprawdź, czy bieżąca strona jest dostępna bez logowania
$currentPage = $_SERVER['PHP_SELF'];

// Nie sprawdzaj dostępu dla strony logowania, aby uniknąć pętli przekierowań
if ($currentPage !== '/login.php' && !is_public_page($currentPage) && !is_logged_in()) {
    $_SESSION['return_to'] = $_SERVER['REQUEST_URI'];
    header('Location: /login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="pl"> <!- Zmieniono lang na "pl" -->
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="color-scheme" content="only light">
    <link rel="stylesheet" href="/css/header.css">
    <?= $customHead ?? '' ?>
    <style>
        /* Style dla elementu wyzwalającego tooltip */
        #user-welcome-link {
            cursor: pointer;
            text-decoration: underline;
            text-decoration-style: dotted;
            position: relative; /* Potrzebne dla pozycjonowania tooltipa */
            display: inline-block; /* Umożliwia pozycjonowanie */
        }

        /* Podstawowy styl tooltipa */
        .subscription-tooltip {
            visibility: hidden; /* Ukryty domyślnie */
            opacity: 0;
            position: absolute;
            background-color: #333; /* Ciemne tło */
            color: #fff; /* Biały tekst */
            text-align: left; /* Wyrównanie tekstu */
            padding: 8px 12px;
            border-radius: 6px;
            z-index: 101; /* Wyżej niż inne elementy nagłówka */
            min-width: 220px; /* Minimalna szerokość */
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            transition: opacity 0.3s ease, visibility 0s linear 0.3s; /* Animacja zanikania */
            font-size: 0.9em; /* Mniejsza czcionka */
            line-height: 1.4;

            /* Pozycjonowanie pod elementem "Witaj, ..." */
            bottom: -10px; /* Zacznij nieco poniżej */
            left: 50%;
            transform: translate(-50%, 100%); /* Przesuń w dół i wycentruj */
        }

        /* Mała strzałka wskazująca w górę */
        .subscription-tooltip::after {
            content: "";
            position: absolute;
            bottom: 100%; /* Na górze tooltipa */
            left: 50%;
            margin-left: -6px; /* Połowa szerokości strzałki */
            border-width: 6px;
            border-style: solid;
            border-color: transparent transparent #333 transparent; /* Strzałka w dół (kolor tła tooltipa) */
        }

        /* Stan widoczny tooltipa */
        .subscription-tooltip.visible {
            visibility: visible;
            opacity: 1;
            transition: opacity 0.3s ease; /* Płynne pojawienie się */
        }
    </style>
</head>
<body>
<header>
    <div class="auth-buttons">
        <?php if (is_logged_in()): ?>
            <span class="user-welcome" id="user-welcome-link" title="Kliknij, aby sprawdzić subskrypcję">Witaj, <?= htmlspecialchars($_SESSION['username']) ?></span>
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
    // Prosta funkcja do wywoływania API, zakładając, że sesja/ciasteczka załatwiają autoryzację w przeglądarce
    // Jeśli używasz `api-client.js` globalnie, możesz pominąć tę definicję i użyć tamtej `callApi`
    async function fetchApi(endpoint, args = []) {
        console.log(`Header: Wywołanie API ${endpoint} z argumentami:`, args);
        try {
            const response = await fetch('/api/api-json.php', { // Używamy ścieżki jak w innych częściach aplikacji
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint, args })
            });

            // Sprawdzenie odpowiedzi tekstowej najpierw, bo błędy mogą nie być JSON-em
            const responseText = await response.text();
            if (!response.ok) {
                console.error(`Header: Błąd HTTP ${response.status} dla ${endpoint}:`, responseText);
                // Spróbuj sparsować jako JSON, może zawierać szczegóły błędu
                try {
                    const errorJson = JSON.parse(responseText);
                    throw new Error(errorJson.message || `Błąd serwera ${response.status}`);
                } catch(e) {
                    // Jeśli nie JSON, rzuć ogólny błąd
                    throw new Error(`Błąd serwera ${response.status}: ${responseText.substring(0,100)}`);
                }
            }

            // Jeśli odpowiedź jest OK, spróbuj sparsować jako JSON
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
            // Rzuć błąd dalej, aby został złapany w głównym bloku try-catch
            throw error;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const welcomeLink = document.getElementById('user-welcome-link');
        const tooltip = document.getElementById('subscription-tooltip');

        // Sprawdź, czy elementy istnieją (np. użytkownik jest zalogowany)
        if (welcomeLink && tooltip) {
            let isTooltipVisible = false;
            let isLoading = false;

            welcomeLink.addEventListener('click', async (e) => {
                e.stopPropagation(); // Zapobiegaj propagacji do document

                if (isLoading) return; // Nie rób nic, jeśli już ładuje

                if (isTooltipVisible) {
                    // Ukryj tooltip, jeśli jest widoczny
                    tooltip.classList.remove('visible');
                    isTooltipVisible = false;
                } else {
                    // Pokaż tooltip i załaduj dane
                    isLoading = true;
                    tooltip.innerHTML = 'Sprawdzanie subskrypcji...'; // Stan ładowania
                    tooltip.classList.add('visible');
                    isTooltipVisible = true;

                    try {
                        // Wywołaj API dla endpointu 'sub'
                        const response = await fetchApi('sub', []); // Używamy zdefiniowanej funkcji fetchApi

                        if (response && response.status === 'success' && response.data) {
                            const data = response.data;
                            const endDate = data.subscription_end || 'Brak danych';
                            const daysLeft = data.days_remaining;
                            let daysText = 'Nieznana';

                            // Sprawdź, czy days_remaining jest liczbą
                            if (typeof daysLeft === 'number' && !isNaN(daysLeft)) {
                                if (daysLeft > 1) {
                                    daysText = `Kończy się za ${daysLeft} dni`;
                                } else if (daysLeft === 1) {
                                    daysText = `Kończy się jutro`;
                                } else if (daysLeft === 0) {
                                    daysText = 'Kończy się dzisiaj';
                                } else { // daysLeft < 0
                                    daysText = `Wygasła ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'dzień' : 'dni'} temu`;
                                }
                            } else {
                                daysText = '(Brak informacji o pozostałych dniach)';
                            }


                            // Formatowanie daty (opcjonalnie, jeśli chcesz inny format niż YYYY-MM-DD)
                            let formattedEndDate = endDate;
                            try {
                                const dateObj = new Date(endDate);
                                // Sprawdź czy data jest poprawna
                                if (!isNaN(dateObj.getTime())) {
                                    // Możesz sformatować np. na DD.MM.YYYY
                                    formattedEndDate = dateObj.toLocaleDateString('pl-PL', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    });
                                }
                            } catch (dateError) {
                                console.warn("Nie można sformatować daty:", endDate);
                            }


                            // Zaktualizuj treść tooltipa
                            tooltip.innerHTML = `Subskrypcja aktywna do: <strong>${formattedEndDate}</strong><br>${daysText}`;
                        } else {
                            // Obsługa błędu zwróconego w odpowiedzi API
                            const errorMsg = response?.message || 'Nie udało się pobrać danych subskrypcji.';
                            tooltip.innerHTML = `Błąd: ${errorMsg}`;
                        }
                    } catch (error) {
                        // Obsługa błędów sieciowych lub innych rzuconych przez fetchApi
                        console.error("Błąd podczas pobierania danych subskrypcji:", error);
                        tooltip.innerHTML = `Błąd: ${error.message}`;
                    } finally {
                        isLoading = false; // Zakończono ładowanie (sukces lub błąd)
                    }
                }
            });

            // Ukryj tooltip po kliknięciu gdziekolwiek indziej na stronie
            document.addEventListener('click', (e) => {
                // Sprawdź, czy tooltip jest widoczny i czy kliknięcie było POZA tooltipem ORAZ POZA linkiem wyzwalającym
                if (isTooltipVisible && !tooltip.contains(e.target) && e.target !== welcomeLink) {
                    tooltip.classList.remove('visible');
                    isTooltipVisible = false;
                }
            });
        } // koniec if (welcomeLink && tooltip)
    }); // koniec DOMContentLoaded
</script>

</body>
</html>