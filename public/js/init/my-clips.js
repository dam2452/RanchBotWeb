document.addEventListener('DOMContentLoaded', async function() {
    // Pobierz referencje do elementów DOM
    const clipsContainer = document.querySelector('.clips-reel');
    const loadingIndicator = document.getElementById('loading-indicator');

    console.log('Inicjalizacja strony My Clips');

    // Pokaż wskaźnik ładowania
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    try {
        // Pobierz dane klipów bezpośrednio z API
        console.log('Pobieranie danych klipów z API...');
        const response = await fetch('/api/clips-api.php?action=get_clips');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Otrzymane dane:', data);

        if (data.status === 'success' && data.clips && data.clips.length > 0) {
            // Podziel klipy na strony (6 klipów na stronę)
            const clipsPerPage = 6;
            const pages = [];

            for (let i = 0; i < data.clips.length; i += clipsPerPage) {
                pages.push(data.clips.slice(i, i + clipsPerPage));
            }

            // Generuj HTML dla każdej strony
            pages.forEach((pageClips, pageIndex) => {
                const pageElement = document.createElement('div');
                pageElement.className = 'clips-page';

                pageClips.forEach((clip, clipIndex) => {
                    // Sprawdź czy ID klipu istnieje i jest poprawne
                    if (!clip.id || !clip.name) {
                        console.error('Clip without ID or name:', clip);
                        return; // Pomiń klip bez ID lub nazwy
                    }

                    // Oblicz indeks klipu (1-based) w całej kolekcji
                    const globalIndex = pageIndex * clipsPerPage + clipIndex + 1;

                    console.log(`Tworzenie karty dla klipu - Indeks: ${globalIndex}, ID: ${clip.id}, nazwa: "${clip.name}"`);

                    const clipElement = document.createElement('div');
                    clipElement.className = 'clip-card';
                    clipElement.setAttribute('data-id', clip.id);
                    clipElement.setAttribute('data-index', globalIndex);
                    clipElement.setAttribute('data-name', clip.name);

                    // Używamy struktury podobnej jak w search results
                    clipElement.innerHTML = `
                        <div class="video-container" data-clip-id="${clip.id}" data-clip-index="${globalIndex}" data-clip-name="${clip.name}">
                            <video 
                                loop
                                preload="metadata"
                                class="clip-video">
                                <source src="debug-video.php?id=${encodeURIComponent(clip.name)}&fallback=1" type="video/mp4">
                            </video>
                            <div class="download-btn">Download</div>
                        </div>
                        <p class="quote">"${clip.name || 'Bez nazwy'}"</p>
                    `;

                    pageElement.appendChild(clipElement);
                });

                clipsContainer.appendChild(pageElement);
            });

            // Inicjalizuj nawigację i obsługę odtwarzania klipów
            initializeClipsNavigation();

        } else {
            // Brak klipów lub błąd
            console.log('Brak klipów lub błąd w danych:', data);
            clipsContainer.innerHTML = '<div class="no-clips-message">Nie masz jeszcze żadnych klipów. Użyj wyszukiwarki cytatów, aby stworzyć swoje pierwsze klipy!</div>';
        }
    } catch (error) {
        console.error('Error loading clips:', error);
        clipsContainer.innerHTML = `<div class="error-message">Wystąpił błąd podczas ładowania klipów: ${error.message}</div>`;
    } finally {
        // Ukryj wskaźnik ładowania
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }

    // Funkcja do inicjalizacji nawigacji stron i obsługi odtwarzania klipów
    function initializeClipsNavigation() {
        const pages = document.querySelectorAll('.clips-page');
        if (pages.length === 0) return;

        console.log(`Inicjalizacja nawigacji dla ${pages.length} stron`);

        let currentPage = 0;
        let activeVideoContainer = null;
        let videoCompleting = false; // Flaga wskazująca, czy wideo ma się zatrzymać po zakończeniu
        let autoplayFailed = false; // Flaga wskazująca, czy autoplay się nie powiódł

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
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();

                const container = e.target.closest('.video-container');
                const clipName = container.dataset.clipName;

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
                    }, 100);

                } catch (error) {
                    console.error('Błąd podczas pobierania wideo:', error);
                    alert('Przepraszamy, wystąpił błąd podczas pobierania wideo.');
                }
            });
        });

        // Funkcja do przewijania do określonej strony
        function scrollToPage(pageIndex) {
            if (pageIndex < 0 || pageIndex >= pages.length) return;

            console.log(`Przewijanie do strony ${pageIndex + 1} z ${pages.length}`);
            currentPage = pageIndex;

            // Zatrzymaj wszystkie wideo
            stopAllVideos();

            // Przewiń do strony
            const isMobileView = window.innerWidth <= 850;
            const container = document.querySelector('.clips-reel');

            if (isMobileView) {
                container.scrollTo({
                    top: pages[pageIndex].offsetTop,
                    behavior: 'smooth'
                });
            } else {
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
            <button class="prev-page">&#10094;</button>
            <span class="page-indicator">Strona <span class="current-page">1</span> z ${pages.length}</span>
            <button class="next-page">&#10095;</button>
        `;

        document.querySelector('.my-clips-page').appendChild(navigationButtons);

        // Aktualizuj wskaźnik strony
        function updatePageIndicator() {
            document.querySelector('.current-page').textContent = currentPage + 1;
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
            // Sprawdź, czy kliknięcie było poza klipami
            if (!e.target.closest('.clip-card') && !e.target.closest('.page-navigation') && !e.target.closest('.download-btn')) {
                stopAllVideos();
            }
        });

        // Obsługa kliknięć w obszar strony do nawigacji
        clipsContainer.addEventListener('click', function(e) {
            // Ignoruj kliknięcia na karty klipów
            if (e.target.closest('.clip-card') || e.target.closest('.video-container') || e.target.closest('.download-btn')) return;

            const rect = clipsContainer.getBoundingClientRect();
            const isMobileView = window.innerWidth <= 850;

            if (isMobileView) {
                // W widoku mobilnym przewijamy w górę/dół
                const clickY = e.clientY - rect.top;
                const goForward = clickY > rect.height / 2;
                scrollToPage(currentPage + (goForward ? 1 : -1));
            } else {
                // W widoku desktopowym przewijamy w lewo/prawo
                const clickX = e.clientX - rect.left;
                const goForward = clickX > rect.width / 2;
                scrollToPage(currentPage + (goForward ? 1 : -1));
            }
        });

        // Obsługa klawiszy strzałek
        window.addEventListener('keydown', function(e) {
            const isMobileView = window.innerWidth <= 850;

            if (isMobileView) {
                // W widoku mobilnym używaj strzałek góra/dół
                if (e.key === 'ArrowDown') {
                    scrollToPage(currentPage + 1);
                }
                if (e.key === 'ArrowUp') {
                    scrollToPage(currentPage - 1);
                }
            } else {
                // W widoku desktopowym używaj strzałek lewo/prawo
                if (e.key === 'ArrowRight') {
                    scrollToPage(currentPage + 1);
                }
                if (e.key === 'ArrowLeft') {
                    scrollToPage(currentPage - 1);
                }
            }
        });

        // Obsługa zmiany orientacji urządzenia
        window.addEventListener('resize', function() {
            scrollToPage(currentPage);
        });

        // Aktywuj pierwszą stronę
        scrollToPage(0);
    }
});