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
        const response = await fetch('/api/clips-api.php?action=get_clips');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Otrzymane dane:', data);

        if (data.status === 'success' && data.clips && data.clips.length > 0) {
            // Podziel klipy na strony (6 klipów na stronę)
            const clipsPerPage = 6;
            const pagesData = [];

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
                        return;
                    }
                    const globalIndex = pageIndex * clipsPerPage + clipIndex + 1;

                    console.log(`Tworzenie karty dla klipu - Indeks: ${globalIndex}, ID: ${clip.id}, nazwa: "${clip.name}"`);

                    const clipElement = document.createElement('div');
                    clipElement.className = 'clip-card';
                    clipElement.setAttribute('data-id', clip.id);
                    clipElement.setAttribute('data-index', globalIndex);
                    clipElement.setAttribute('data-name', clip.name);

                    clipElement.innerHTML = `
                        <div class="video-container" data-clip-id="${clip.id}" data-clip-index="${globalIndex}" data-clip-name="${clip.name}">
                            <video
                                loop
                                preload="metadata"
                                class="clip-video">
                                <source src="/debug-video.php?id=${encodeURIComponent(clip.name)}" type="video/mp4"> 
                            </video>
                            <div class="download-btn">Pobierz</div>
                        </div>
                        <p class="quote">"${clip.name || 'Bez nazwy'}"</p>
                        <button class="delete-clip-btn" title="Usuń ten klip">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path></svg>
                            Usuń
                        </button>
                    `;

                    pageElement.appendChild(clipElement);
                });

                clipsContainer.appendChild(pageElement);
            });

            // Inicjalizuj nawigację i obsługę klipów
            initializeClipsNavigationAndActions();

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
        const searchNavButton = document.createElement('a');
        searchNavButton.className = 'search-nav-button';
        searchNavButton.href = 'search.php';
        searchNavButton.title = 'Szukaj cytatów';

        searchNavButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Szukaj cytatów</span>
        `;

        document.querySelector('.my-clips-page').appendChild(searchNavButton);

        searchNavButton.addEventListener('mouseenter', () => searchNavButton.classList.add('hover'));
        searchNavButton.addEventListener('mouseleave', () => searchNavButton.classList.remove('hover'));
    }

    // Główna funkcja inicjalizująca nawigację i akcje
    function initializeClipsNavigationAndActions() {
        const pages = document.querySelectorAll('.clips-page');
        if (pages.length === 0) return;

        console.log(`Inicjalizacja nawigacji i akcji dla ${pages.length} stron`);

        let currentPage = 0;
        let activeVideoContainer = null;
        let videoCompleting = false;
        let autoplayFailedOnce = false;

        // Funkcja do ładowania wideo (uproszczona)
        function loadVideo(video, videoContainer) {
            if (video.readyState === 0) {
                video.load();
                video.addEventListener('error', function onError(e) {
                    console.error('Błąd ładowania wideo:', video.error?.message || 'Nieznany błąd', 'dla źródła:', video.currentSrc, e);
                    const errorOverlay = document.createElement('div');
                    errorOverlay.className = 'video-error-overlay';
                    errorOverlay.textContent = 'Błąd ładowania';
                    if (!videoContainer.querySelector('.video-error-overlay')) {
                        videoContainer.appendChild(errorOverlay);
                    }
                    video.removeEventListener('error', onError);
                }, { once: true });
            }
        }

        // Funkcja do rozpoczęcia odtwarzania wideo
        function playVideo(videoContainer) {
            const video = videoContainer.querySelector('video');
            videoContainer.querySelector('.video-error-overlay')?.remove();

            if (activeVideoContainer === videoContainer) {
                videoCompleting = false;
                return;
            }

            if (activeVideoContainer) {
                handleVideoLeave(activeVideoContainer, true);
            }

            videoContainer.classList.add('active');
            activeVideoContainer = videoContainer;
            videoCompleting = false;

            loadVideo(video, videoContainer);

            if (video.paused) {
                video.play().catch(err => {
                    console.error('Błąd autoplay:', err);
                    if (!autoplayFailedOnce) {
                        autoplayFailedOnce = true;
                    }
                    const playMessage = document.createElement('div');
                    playMessage.className = 'play-message';
                    playMessage.textContent = 'Kliknij, aby odtworzyć';
                    if (!videoContainer.querySelector('.play-message')) {
                        videoContainer.appendChild(playMessage);
                    }
                });
            }
        }

        // Funkcja do obsługi opuszczenia kontenera wideo
        function handleVideoLeave(videoContainer, forceStop = false) {
            if (activeVideoContainer === videoContainer) {
                if (forceStop) {
                    const video = videoContainer.querySelector('video');
                    video.pause();
                    videoContainer.classList.remove('active');
                    activeVideoContainer = null;
                    videoCompleting = false;
                    videoContainer.querySelector('.play-message')?.remove();
                    videoContainer.querySelector('.video-error-overlay')?.remove();
                } else {
                    videoCompleting = true;
                }
            }
        }

        // Funkcja do zatrzymania wszystkich wideo
        function stopAllVideos() {
            document.querySelectorAll('.video-container.active').forEach(container => {
                handleVideoLeave(container, true);
            });
        }

        // Dodaj obsługę najechania/opuszczenia i kliknięcia na wideo
        document.querySelectorAll('.video-container').forEach(container => {
            container.addEventListener('mouseenter', () => playVideo(container));
            container.addEventListener('mouseleave', () => handleVideoLeave(container));
            container.addEventListener('click', (e) => {
                if (e.target.classList.contains('download-btn') || e.target.closest('.delete-clip-btn')) {
                    return;
                }

                const video = container.querySelector('video');
                container.querySelector('.play-message')?.remove();
                container.querySelector('.video-error-overlay')?.remove();

                if (activeVideoContainer === container) {
                    if (video.paused) {
                        video.play().catch(err => console.error("Błąd odtwarzania po kliknięciu:", err));
                        container.classList.add('active');
                    } else {
                        video.pause();
                    }
                } else {
                    playVideo(container);
                }
            });

            const video = container.querySelector('video');
            video.addEventListener('ended', function() {
                if (videoCompleting && activeVideoContainer === container) {
                    handleVideoLeave(container, true);
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

                if (!clipName) {
                    alert("Nie można zidentyfikować nazwy klipu do pobrania.");
                    return;
                }

                btn.textContent = 'Pobieranie...';
                btn.style.pointerEvents = 'none';

                try {
                    const response = await fetch(`/debug-video.php?id=${encodeURIComponent(clipName)}`);
                    if (!response.ok) {
                        let errorDetails = `HTTP error! Status: ${response.status}`;
                        try {
                            const errorJson = await response.json();
                            errorDetails += ` - ${errorJson.error || 'Unknown server error'}`;
                        } catch (jsonError) { /* Ignoruj */ }
                        throw new Error(errorDetails);
                    }

                    const blob = await response.blob();

                    if (!blob.type.startsWith('video/')) {
                        console.warn(`Pobrano nieoczekiwany typ MIME: ${blob.type} dla klipu ${clipName}.`);
                    }

                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const safeFilename = clipName.replace(/[^a-zA-Z0-9_.-]/g, '_') + '.mp4';
                    a.download = safeFilename;
                    document.body.appendChild(a);
                    a.click();

                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        btn.textContent = 'Pobierz';
                        btn.style.pointerEvents = 'auto';
                    }, 100);

                } catch (error) {
                    console.error('Błąd podczas pobierania wideo:', error);
                    alert(`Przepraszamy, wystąpił błąd podczas pobierania wideo: ${error.message}`);
                    btn.textContent = 'Pobierz';
                    btn.style.pointerEvents = 'auto';
                }
            });
        });

        // Funkcja do przewijania do określonej strony
        function scrollToPage(pageIndex) {
            if (pageIndex < 0 || pageIndex >= pages.length) return;

            console.log(`Przewijanie do strony ${pageIndex + 1} z ${pages.length}`);
            currentPage = pageIndex;

            stopAllVideos();

            const isMobileView = window.innerWidth <= 850;
            const container = document.querySelector('.clips-reel');
            const targetPage = pages[pageIndex];

            if (!targetPage) {
                console.error(`Strona o indeksie ${pageIndex} nie istnieje w DOM.`);
                return;
            }

            if (isMobileView) {
                container.scrollTo({
                    top: targetPage.offsetTop - container.offsetTop,
                    behavior: 'smooth'
                });
            } else {
                container.scrollTo({
                    left: targetPage.offsetLeft,
                    behavior: 'smooth'
                });
            }

            updatePageIndicator();
        }

        // Dodaj przyciski nawigacji stron
        const navigationContainer = document.querySelector('.my-clips-page');
        const navigationButtons = document.createElement('div');
        navigationButtons.className = 'page-navigation';
        navigationButtons.innerHTML = `
            <button class="prev-page" title="Poprzednia strona">&#10094;</button>
            <span class="page-indicator">Strona <span class="current-page">1</span> z ${pages.length}</span>
            <button class="next-page" title="Następna strona">&#10095;</button>
        `;

        // Dodaj nawigację POD kontenerem z klipami
        clipsContainer.parentNode.insertBefore(navigationButtons, clipsContainer.nextSibling);

        // Aktualizuj wskaźnik strony
        function updatePageIndicator() {
            const currentPageSpan = document.querySelector('.current-page');
            const prevButton = document.querySelector('.prev-page');
            const nextButton = document.querySelector('.next-page');

            if(currentPageSpan) currentPageSpan.textContent = currentPage + 1;
            if(prevButton) prevButton.disabled = (currentPage === 0);
            if(nextButton) nextButton.disabled = (currentPage >= pages.length - 1);
        }

        // Obsługa przycisków nawigacji
        document.querySelector('.prev-page')?.addEventListener('click', () => scrollToPage(currentPage - 1));
        document.querySelector('.next-page')?.addEventListener('click', () => scrollToPage(currentPage + 1));

        // --- ZMIENIONA OBSŁUGA KLIKNIĘĆ NA TLE ---
        // Obsługa kliknięć w obszar strony (poza klipami i przyciskami)
        document.addEventListener('click', function(e) {
            // Sprawdź, czy kliknięcie było poza elementami interaktywnymi karty ORAZ poza nawigacją
            const clickedOnCard = e.target.closest('.clip-card');
            const clickedOnNav = e.target.closest('.page-navigation');
            const clickedOnSearchBtn = e.target.closest('.search-nav-button');

            if (!clickedOnCard && !clickedOnNav && !clickedOnSearchBtn) {
                // Jeśli kliknięto gdzie indziej, zatrzymaj wideo
                stopAllVideos();

                // Sprawdź, czy kliknięcie było WEWNĄTRZ kontenera .clips-reel (ale nie na karcie)
                const clipsReelContainer = document.querySelector('.clips-reel');
                if (clipsReelContainer && clipsReelContainer.contains(e.target)) {
                    // Kliknięto na tło wewnątrz kontenera
                    const rect = clipsReelContainer.getBoundingClientRect();
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
            }
        });
        // --- KONIEC ZMIENIONEJ OBSŁUGI KLIKNIĘĆ NA TLE ---


        // Obsługa klawiszy strzałek
        window.addEventListener('keydown', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const isMobileView = window.innerWidth <= 850;
            let handled = false;

            if (isMobileView) {
                if (e.key === 'ArrowDown') { handled = true; scrollToPage(currentPage + 1); }
                else if (e.key === 'ArrowUp') { handled = true; scrollToPage(currentPage - 1); }
            } else {
                if (e.key === 'ArrowRight') { handled = true; scrollToPage(currentPage + 1); }
                else if (e.key === 'ArrowLeft') { handled = true; scrollToPage(currentPage - 1); }
            }
            if (handled) {
                e.preventDefault();
            }
        });

        // Obsługa zmiany rozmiaru okna
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log("Window resized, adjusting scroll position.");
                const targetPage = pages[currentPage];
                if (targetPage) {
                    const isMobileView = window.innerWidth <= 850;
                    const container = document.querySelector('.clips-reel');
                    if(container){ // Dodatkowe sprawdzenie czy kontener istnieje
                        if (isMobileView) container.scrollTop = targetPage.offsetTop - container.offsetTop;
                        else container.scrollLeft = targetPage.offsetLeft;
                    }
                }
            }, 250);
        });

        // Aktywuj pierwszą stronę i zaktualizuj wskaźnik
        scrollToPage(0);
        updatePageIndicator();

        // Ustaw nasłuchiwacze dla przycisków usuwania
        setupDeleteButtons();
    } // Koniec initializeClipsNavigationAndActions

    // Funkcja do obsługi przycisków usuwania
    function setupDeleteButtons() {
        const clipsReelContainer = document.querySelector('.clips-reel');
        if (!clipsReelContainer) return;

        console.log("Ustawianie nasłuchiwaczy dla przycisków usuwania...");

        clipsReelContainer.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.delete-clip-btn');
            if (!deleteButton) return;

            e.stopPropagation();

            const clipCard = deleteButton.closest('.clip-card');
            const clipName = clipCard?.dataset.name;

            if (!clipName) {
                console.error('Nie można znaleźć nazwy klipu do usunięcia.');
                alert('Wystąpił błąd: Nie można zidentyfikować klipu.');
                return;
            }

            if (confirm(`Czy na pewno chcesz usunąć klip "${clipName}"? Tej operacji nie można cofnąć.`)) {
                console.log(`Rozpoczęcie usuwania klipu: ${clipName}`);
                deleteButton.disabled = true;
                const originalButtonContent = deleteButton.innerHTML;
                deleteButton.innerHTML = 'Usuwanie...';

                try {
                    const response = await callApi('uk', [clipName]);

                    console.log('Odpowiedź API usuwania:', response);

                    if (response && (response.status === 'success' || response.code === 'clip_deleted')) {
                        console.log(`Klip "${clipName}" usunięty pomyślnie.`);

                        clipCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        clipCard.style.opacity = '0';
                        clipCard.style.transform = 'scale(0.95) translateY(-10px)';

                        setTimeout(() => {
                            const page = clipCard.closest('.clips-page');
                            clipCard.remove();
                            if (page && page.querySelectorAll('.clip-card').length === 0) {
                                console.log("Strona została opróżniona.");
                                page.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">Ta strona jest teraz pusta.</p>';
                                // TODO: Aktualizacja nawigacji po usunięciu całej strony
                            }
                            // TODO: Aktualizacja liczby stron w nawigacji
                        }, 400);

                    } else {
                        const errorMessage = response?.message || 'Nieznany błąd serwera.';
                        console.error(`Nie udało się usunąć klipu "${clipName}": ${errorMessage}`);
                        alert(`Nie udało się usunąć klipu: ${errorMessage}`);
                        deleteButton.disabled = false;
                        deleteButton.innerHTML = originalButtonContent;
                    }
                } catch (error) {
                    console.error('Błąd podczas operacji usuwania:', error);
                    alert(`Wystąpił błąd sieci lub wykonania podczas usuwania: ${error.message}`);
                    deleteButton.disabled = false;
                    deleteButton.innerHTML = originalButtonContent;
                }
            } else {
                console.log('Anulowano usuwanie klipu.');
            }
        });
    } // Koniec setupDeleteButtons

}); // Koniec DOMContentLoaded