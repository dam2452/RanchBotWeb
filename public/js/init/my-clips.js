// public/js/init/my-clips.js

// Dodaj ten import na początku pliku
import { callApi } from '../modules/api-client.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Pobierz referencje do elementów DOM
    const clipsContainer = document.querySelector('.clips-reel');
    const loadingIndicator = document.getElementById('loading-indicator');

    console.log('Inicjalizacja strony My Clips');

    // Dodaj przycisk nawigacyjny do wyszukiwarki
    addSearchNavigationButton();

    // Pokaż wskaźnik ładowania
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    try {
        // Pobierz dane klipów bezpośrednio z API
        console.log('Pobieranie danych klipów z API...');
        // Użyjemy callApi dla spójności, zakładając, że clips-api.php obsługuje GET bez endpoint/args
        // Jeśli nie, wróć do fetch('/api/clips-api.php?action=get_clips')
        // Na razie zostawiam fetch, bo wydaje się dedykowany
        const response = await fetch('/api/clips-api.php?action=get_clips');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Otrzymane dane:', data);

        if (data.status === 'success' && data.clips && data.clips.length > 0) {
            // Podziel klipy na strony (6 klipów na stronę)
            const clipsPerPage = 6;
            const pagesData = []; // Zmień nazwę z pages na pagesData, żeby uniknąć konfliktu z querySelectorAll('.clips-page')

            for (let i = 0; i < data.clips.length; i += clipsPerPage) {
                pagesData.push(data.clips.slice(i, i + clipsPerPage));
            }

            // Generuj HTML dla każdej strony
            pagesData.forEach((pageClips, pageIndex) => {
                const pageElement = document.createElement('div');
                pageElement.className = 'clips-page';

                pageClips.forEach((clip, clipIndex) => {
                    if (!clip.id || !clip.name) {
                        console.error('Clip without ID or name:', clip);
                        return; // Pomiń klip bez ID lub nazwy
                    }
                    const globalIndex = pageIndex * clipsPerPage + clipIndex + 1;

                    console.log(`Tworzenie karty dla klipu - Indeks: ${globalIndex}, ID: ${clip.id}, nazwa: "${clip.name}"`);

                    const clipElement = document.createElement('div');
                    clipElement.className = 'clip-card';
                    clipElement.setAttribute('data-id', clip.id);
                    clipElement.setAttribute('data-index', globalIndex);
                    clipElement.setAttribute('data-name', clip.name);

                    // --- DODANO PRZYCISK USUWANIA ---
                    clipElement.innerHTML = `
                        <div class="video-container" data-clip-id="${clip.id}" data-clip-index="${globalIndex}" data-clip-name="${clip.name}">
                            <video
                                loop
                                preload="metadata"
                                class="clip-video">
                                <source src="debug-video.php?id=${encodeURIComponent(clip.name)}&fallback=1" type="video/mp4">
                            </video>
                            <div class="download-btn">Pobierz</div>
                        </div>
                        <p class="quote">"${clip.name || 'Bez nazwy'}"</p>
                        <button class="delete-clip-btn" title="Usuń ten klip">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path></svg>
                            Usuń
                        </button>
                    `;
                    // --- KONIEC DODAWANIA PRZYCISKU ---

                    pageElement.appendChild(clipElement);
                });

                clipsContainer.appendChild(pageElement);
            });

            // Inicjalizuj nawigację i obsługę klipów (w tym przycisków usuwania)
            initializeClipsNavigationAndActions(); // Zmieniona nazwa funkcji dla jasności

        } else {
            console.log('Brak klipów lub błąd w danych:', data);
            clipsContainer.innerHTML = '<div class="no-clips-message">Nie masz jeszcze żadnych klipów. Użyj wyszukiwarki cytatów, aby stworzyć swoje pierwsze klipy!</div>';
        }
    } catch (error) {
        console.error('Error loading clips:', error);
        clipsContainer.innerHTML = `<div class="error-message">Wystąpił błąd podczas ładowania klipów: ${error.message}</div>`;
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }

    // Funkcja dodająca przycisk nawigacji do wyszukiwarki
    function addSearchNavigationButton() {
        // ... (bez zmian) ...
        // Stwórz przycisk nawigacyjny
        const searchNavButton = document.createElement('a');
        searchNavButton.className = 'search-nav-button';
        searchNavButton.href = 'search.php';
        searchNavButton.title = 'Szukaj cytatów';

        // Ikona wyszukiwania - w stylu podobnym do reszty aplikacji
        searchNavButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Szukaj cytatów</span>
        `;

        // Dodaj do DOM
        document.querySelector('.my-clips-page').appendChild(searchNavButton);

        // Animacja przy najechaniu na przycisk - opcjonalnie
        searchNavButton.addEventListener('mouseenter', () => {
            searchNavButton.classList.add('hover');
        });

        searchNavButton.addEventListener('mouseleave', () => {
            searchNavButton.classList.remove('hover');
        });
    }

    // Zmieniona nazwa funkcji, zawiera teraz setupDeleteButtons
    function initializeClipsNavigationAndActions() {
        const pages = document.querySelectorAll('.clips-page'); // Zmieniono z pagesData na querySelectorAll
        if (pages.length === 0) return;

        console.log(`Inicjalizacja nawigacji i akcji dla ${pages.length} stron`);

        let currentPage = 0;
        let activeVideoContainer = null;
        let videoCompleting = false;
        let autoplayFailed = false;

        // ... (funkcje loadVideo, playVideo, handleVideoLeave, stopAllVideos - bez zmian) ...
        // Funkcja do ładowania wideo i obsługi błędów
        function loadVideo(video, videoContainer) {
            // Jeśli wideo nie jest załadowane, załaduj je
            if (video.readyState === 0) {
                video.load();

                // Obsługa błędu ładowania wideo
                video.addEventListener('error', function onError() {
                    console.error('Błąd ładowania wideo', video.error);

                    // Spróbuj alternatywnego źródła
                    const clipName = videoContainer.dataset.clipName;
                    const clipId = videoContainer.dataset.clipId;
                    const clipIndex = videoContainer.dataset.clipIndex;

                    // Najpierw spróbuj z indeksem
                    const source = video.querySelector('source');
                    source.src = `debug-video.php?id=${clipIndex}&fallback=1`;

                    // Usuń nasłuchiwacz błędu, aby uniknąć zapętlenia
                    video.removeEventListener('error', onError);

                    video.load();
                    video.play().catch(err => {
                        console.error('Nadal błąd odtwarzania', err);

                        // Jako ostateczność spróbuj z ID
                        source.src = `debug-video.php?id=${clipId}&fallback=1`;
                        video.load();
                        video.play().catch(e => console.error('Wszystkie próby nieudane', e));
                    });
                });
            }
        }

        // Funkcja do rozpoczęcia odtwarzania wideo
        function playVideo(videoContainer) {
            const video = videoContainer.querySelector('video');

            // Jeśli już jest aktywne, nic nie rób
            if (activeVideoContainer === videoContainer) {
                videoCompleting = false; // Anuluj ewentualne opóźnione zatrzymanie
                return;
            }

            // Zatrzymaj poprzednie aktywne wideo
            if (activeVideoContainer) {
                const activeVideo = activeVideoContainer.querySelector('video');
                activeVideo.pause();
                activeVideoContainer.classList.remove('active');
            }

            // Aktywuj nowe wideo
            videoContainer.classList.add('active');
            activeVideoContainer = videoContainer;
            videoCompleting = false;

            // Załaduj wideo jeśli potrzeba
            loadVideo(video, videoContainer);

            // Rozpocznij odtwarzanie
            if (video.paused) {
                video.play().catch(err => {
                    console.error('Błąd autoplay:', err);
                    autoplayFailed = true;

                    // Jeśli autoplay nie działa, należy kliknąć, aby odtworzyć
                    const playMessage = document.createElement('div');
                    playMessage.className = 'play-message';
                    playMessage.textContent = 'Kliknij, aby odtworzyć';

                    // Dodaj komunikat tylko jeśli jeszcze nie istnieje
                    if (!videoContainer.querySelector('.play-message')) {
                        videoContainer.appendChild(playMessage);
                    }
                });
            }
        }

        // Funkcja do zatrzymania wideo po opuszczeniu
        function handleVideoLeave(videoContainer) {
            if (activeVideoContainer === videoContainer) {
                videoCompleting = true;

                // Nie zatrzymujemy od razu, pozwolimy wideo zakończyć cykl
                // Obsługa tego jest w zdarzeniu 'ended' poniżej
            }
        }

        // Funkcja do zatrzymania wszystkich wideo
        function stopAllVideos() {
            const allVideos = document.querySelectorAll('.clip-video');
            allVideos.forEach(video => {
                video.pause();
                video.parentElement.classList.remove('active');
            });
            activeVideoContainer = null;
            videoCompleting = false;
        }


        // Dodaj obsługę najechania/opuszczenia i kliknięcia na wideo
        document.querySelectorAll('.video-container').forEach(container => {
            // ... (bez zmian) ...
            // Najechanie myszą - rozpocznij odtwarzanie
            container.addEventListener('mouseenter', () => {
                playVideo(container);
            });

            // Opuszczenie myszą - zaznacz do zatrzymania
            container.addEventListener('mouseleave', () => {
                handleVideoLeave(container);
            });

            // Kliknięcie - przełącz odtwarzanie
            container.addEventListener('click', (e) => {
                // Ignoruj kliknięcia na przycisk pobierania
                if (e.target.classList.contains('download-btn')) {
                    return;
                }

                const video = container.querySelector('video');

                // Jeśli to jest aktywne wideo, przełącz odtwarzanie
                if (activeVideoContainer === container) {
                    if (video.paused) {
                        video.play();
                        container.classList.add('active');

                        // Usuń komunikat o kliknięciu, jeśli istnieje
                        const playMessage = container.querySelector('.play-message');
                        if (playMessage) {
                            playMessage.remove();
                        }
                    } else {
                        video.pause();
                        container.classList.remove('active');
                    }
                } else {
                    // Jeśli to nowe wideo, odtwórz je
                    playVideo(container);
                }
            });

            // Obsługa zdarzenia zakończenia wideo
            const video = container.querySelector('video');

            // Gdy wideo się kończy, sprawdza czy ma być zatrzymane
            video.addEventListener('ended', function() {
                if (videoCompleting) {
                    video.pause();
                    container.classList.remove('active');
                    activeVideoContainer = null;
                    videoCompleting = false;

                    // Usuń komunikat o kliknięciu, jeśli istnieje
                    const playMessage = container.querySelector('.play-message');
                    if (playMessage) {
                        playMessage.remove();
                    }
                }
            });
        });

        // Dodaj obsługę pobierania
        document.querySelectorAll('.download-btn').forEach(btn => {
            // ... (bez zmian) ...
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();

                const container = e.target.closest('.video-container');
                const clipName = container.dataset.clipName;

                // Użyj poprawnej nazwy w komunikacie
                btn.textContent = 'Pobieranie...';
                btn.style.pointerEvents = 'none'; // Wyłącz klikanie podczas pobierania

                try {
                    // Pobierz wideo bezpośrednio z serwera
                    const response = await fetch(`debug-video.php?id=${encodeURIComponent(clipName)}&fallback=1`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);

                    // Stwórz link do pobrania
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${clipName}.mp4`;
                    document.body.appendChild(a);
                    a.click();

                    // Posprzątaj
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        btn.textContent = 'Pobierz'; // Przywróć tekst przycisku
                        btn.style.pointerEvents = 'auto'; // Włącz klikanie z powrotem
                    }, 100);

                } catch (error) {
                    console.error('Błąd podczas pobierania wideo:', error);
                    alert('Przepraszamy, wystąpił błąd podczas pobierania wideo.');
                    btn.textContent = 'Pobierz'; // Przywróć tekst przycisku w razie błędu
                    btn.style.pointerEvents = 'auto'; // Włącz klikanie z powrotem
                }
            });
        });

        // Funkcja do przewijania do określonej strony
        function scrollToPage(pageIndex) {
            // ... (bez zmian) ...
            if (pageIndex < 0 || pageIndex >= pages.length) return;

            console.log(`Przewijanie do strony ${pageIndex + 1} z ${pages.length}`);
            currentPage = pageIndex;

            // Zatrzymaj wszystkie wideo
            stopAllVideos();

            // Przewiń do strony
            const isMobileView = window.innerWidth <= 850;
            const container = document.querySelector('.clips-reel');

            if (isMobileView) {
                // Dla widoku mobilnego przewijamy w pionie
                container.scrollTo({
                    top: pages[pageIndex].offsetTop - container.offsetTop, // Uwzględnij offset kontenera
                    behavior: 'smooth'
                });
            } else {
                // Dla widoku desktopowego przewijamy w poziomie
                container.scrollTo({
                    left: pages[pageIndex].offsetLeft,
                    behavior: 'smooth'
                });
            }


            // Aktualizuj wskaźnik strony
            updatePageIndicator();
        }

        // Dodaj przyciski nawigacji
        const navigationButtons = document.createElement('div');
        navigationButtons.className = 'page-navigation';
        navigationButtons.innerHTML = `
            <button class="prev-page" title="Poprzednia strona">&#10094;</button>
            <span class="page-indicator">Strona <span class="current-page">1</span> z ${pages.length}</span>
            <button class="next-page" title="Następna strona">&#10095;</button>
        `;

        document.querySelector('.my-clips-page').appendChild(navigationButtons);

        // Aktualizuj wskaźnik strony
        function updatePageIndicator() {
            document.querySelector('.current-page').textContent = currentPage + 1;
            document.querySelector('.prev-page').disabled = (currentPage === 0);
            document.querySelector('.next-page').disabled = (currentPage === pages.length - 1);
        }

        // Obsługa przycisków nawigacji
        document.querySelector('.prev-page').addEventListener('click', () => {
            scrollToPage(currentPage - 1);
        });

        document.querySelector('.next-page').addEventListener('click', () => {
            scrollToPage(currentPage + 1);
        });

        // Obsługa kliknięć w obszar strony (poza klipami)
        document.addEventListener('click', function(e) {
            // Sprawdź, czy kliknięcie było poza elementami interaktywnymi karty
            if (!e.target.closest('.clip-card') &&
                !e.target.closest('.page-navigation') &&
                !e.target.closest('.search-nav-button')) {
                stopAllVideos();
            }
        });

        // Obsługa kliknięć w obszar strony do nawigacji (kliknięcie na tło)
        clipsContainer.addEventListener('click', function(e) {
            if (e.target === clipsContainer) { // Kliknięcie bezpośrednio na tło kontenera
                const rect = clipsContainer.getBoundingClientRect();
                const isMobileView = window.innerWidth <= 850;

                if (isMobileView) {
                    const clickY = e.clientY - rect.top;
                    const goForward = clickY > rect.height / 2;
                    scrollToPage(currentPage + (goForward ? 1 : -1));
                } else {
                    const clickX = e.clientX - rect.left;
                    const goForward = clickX > rect.width / 2;
                    scrollToPage(currentPage + (goForward ? 1 : -1));
                }
            }
        });


        // Obsługa klawiszy strzałek
        window.addEventListener('keydown', function(e) {
            // Ignoruj klawisze, jeśli fokus jest w polu tekstowym (gdyby było)
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const isMobileView = window.innerWidth <= 850;

            if (isMobileView) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault(); // Zapobiegaj standardowemu przewijaniu strony
                    scrollToPage(currentPage + 1);
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault(); // Zapobiegaj standardowemu przewijaniu strony
                    scrollToPage(currentPage - 1);
                }
            } else {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    scrollToPage(currentPage + 1);
                }
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    scrollToPage(currentPage - 1);
                }
            }
        });

        // Obsługa zmiany rozmiaru okna (np. obrót telefonu)
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log("Window resized, adjusting scroll position.");
                scrollToPage(currentPage); // Dostosuj przewinięcie po zmianie rozmiaru
            }, 250); // Debounce resize event
        });

        // Aktywuj pierwszą stronę
        scrollToPage(0);

        // --- NOWA FUNKCJA DO OBSŁUGI PRZYCISKÓW USUWANIA ---
        setupDeleteButtons();
    } // Koniec initializeClipsNavigationAndActions

    // --- NOWA FUNKCJA ---
    function setupDeleteButtons() {
        const clipsContainer = document.querySelector('.clips-reel');
        if (!clipsContainer) return;

        console.log("Ustawianie nasłuchiwaczy dla przycisków usuwania...");

        clipsContainer.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.delete-clip-btn');
            if (!deleteButton) return; // Kliknięto poza przyciskiem usuwania

            e.stopPropagation(); // Zatrzymaj propagację, aby nie aktywować odtwarzania itp.

            const clipCard = deleteButton.closest('.clip-card');
            const clipName = clipCard?.dataset.name;

            if (!clipName) {
                console.error('Nie można znaleźć nazwy klipu do usunięcia.');
                alert('Wystąpił błąd: Nie można zidentyfikować klipu.');
                return;
            }

            // Okno dialogowe potwierdzenia
            if (confirm(`Czy na pewno chcesz usunąć klip "${clipName}"? Tej operacji nie można cofnąć.`)) {
                console.log(`Rozpoczęcie usuwania klipu: ${clipName}`);
                deleteButton.disabled = true;
                const originalButtonContent = deleteButton.innerHTML; // Zapisz oryginalną zawartość
                deleteButton.innerHTML = 'Usuwanie...'; // Zmień tekst na czas operacji

                try {
                    // Wywołanie API - używamy callApi, które powinno być zaimportowane
                    const response = await callApi('uk', [clipName]); // Endpoint 'uk' z nazwą klipu

                    console.log('Odpowiedź API usuwania:', response);

                    if (response && (response.status === 'success' || response.code === 'clip_deleted')) {
                        console.log(`Klip "${clipName}" usunięty pomyślnie.`);

                        // Animowane usuwanie karty z DOM
                        clipCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        clipCard.style.opacity = '0';
                        clipCard.style.transform = 'scale(0.95) translateY(-10px)';

                        setTimeout(() => {
                            clipCard.remove();
                            // Opcjonalnie: Sprawdź, czy strona jest pusta i zaktualizuj UI
                            const page = clipCard.closest('.clips-page');
                            if (page && page.querySelectorAll('.clip-card').length === 0) {
                                console.log("Strona została opróżniona.");
                                // Można by odświeżyć listę lub pokazać komunikat
                                // Najprościej: odświeżenie strony
                                // location.reload();
                                // Lub pokazanie komunikatu w miejscu strony
                                page.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">Ta strona jest teraz pusta.</p>';
                            }
                            // Opcjonalnie: Zaktualizuj liczbę stron w nawigacji, jeśli się zmieniła
                            // To wymagałoby bardziej złożonej logiki śledzenia stanu

                        }, 400); // Czas animacji

                        // Nie używamy alertu, status jest widoczny przez usunięcie elementu
                        // alert(`Klip "${clipName}" został usunięty.`);

                    } else {
                        // Błąd zwrócony przez API
                        const errorMessage = response?.message || 'Nieznany błąd serwera.';
                        console.error(`Nie udało się usunąć klipu "${clipName}": ${errorMessage}`);
                        alert(`Nie udało się usunąć klipu: ${errorMessage}`);
                        deleteButton.disabled = false; // Włącz przycisk ponownie
                        deleteButton.innerHTML = originalButtonContent; // Przywróć ikonę i tekst
                    }
                } catch (error) {
                    // Błąd sieci lub inny błąd wykonania
                    console.error('Błąd podczas operacji usuwania:', error);
                    alert(`Wystąpił błąd sieci lub wykonania podczas usuwania: ${error.message}`);
                    deleteButton.disabled = false; // Włącz przycisk ponownie
                    deleteButton.innerHTML = originalButtonContent; // Przywróć ikonę i tekst
                }
            } else {
                console.log('Anulowano usuwanie klipu.');
            }
        });
    } // Koniec setupDeleteButtons

}); // Koniec DOMContentLoaded