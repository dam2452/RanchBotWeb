<?php include_once __DIR__ . '/../templates/header.php'; ?>
<link rel="stylesheet" href="css/search-results.css">

<main class="search-results-page">
    <!-- Pole wyszukiwania -->
    <div class="search-container">
        <input type="text" class="search-input" id="query-input" placeholder="enter a quote" />
        <button class="search-icon-btn" aria-label="Search">
            <img src="images/arrow-circle-right-svgrepo-com.svg" alt="Search" />
        </button>
        <button class="filter-btn">filters</button>
    </div>

    <!-- ROLKA VIDEO -->
    <div class="video-reel">
        <div class="reel-item active" data-id="0">
            <video autoplay muted loop preload="metadata">
                <source src="videos/scene-001.mp4" type="video/mp4">
            </video>
        </div>

        <div class="reel-item" data-id="1">
            <video loop preload="metadata">
                <source src="videos/scene-002.mp4" type="video/mp4">
            </video>
        </div>

        <div class="reel-item" data-id="2">
            <video loop preload="metadata">
                <source src="videos/scene-003.mp4" type="video/mp4">
            </video>
        </div>
    </div>
</main>

<script>
    const isMobile = window.matchMedia("(max-width: 850px)").matches;
    const items = document.querySelectorAll('.reel-item');
    let activeIndex = 0;
    let firstPlayedMuted = true;

    function activate(index) {
        if (index < 0 || index >= items.length) return;

        const oldItem = items[activeIndex];
        const oldVideo = oldItem.querySelector('video');

        oldItem.classList.remove('active');
        oldVideo.pause();

        activeIndex = index;

        const newItem = items[activeIndex];
        const newVideo = newItem.querySelector('video');

        newItem.classList.add('active');

        // Jeśli pierwszy raz na index 0 → zmutowany autoplay już działa
        if (activeIndex === 0 && firstPlayedMuted) {
            // nic nie robimy, autoplay muted leci
        } else {
            newVideo.muted = false;
            newVideo.volume = 1.0;
            newVideo.currentTime = 0;
            newVideo.play();
        }

        const offset = isMobile
            ? newItem.offsetTop - 20
            : newItem.offsetLeft - 20;

        document.querySelector('.video-reel').scrollTo({
            top: isMobile ? offset : 0,
            left: isMobile ? 0 : offset,
            behavior: 'smooth'
        });
    }

    document.querySelector('.video-reel').addEventListener('click', (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const half = isMobile ? rect.height / 2 : rect.width / 2;

        const activeVideo = items[activeIndex].querySelector('video');
        const clickedItem = e.target.closest('.reel-item');

        // Klik w aktywny element
        if (clickedItem && clickedItem.classList.contains('active')) {
            if (activeIndex === 0 && activeVideo.muted) {
                // odmutuj pierwszy przy kliknięciu
                activeVideo.muted = false;
                activeVideo.volume = 1.0;
                activeVideo.play();
                firstPlayedMuted = false;
            } else {
                if (activeVideo.paused) {
                    activeVideo.play();
                } else {
                    activeVideo.pause();
                }
            }
            return;
        }

        // Przejście L/P lub G/D
        if (isMobile) {
            clickY > half ? activate(activeIndex + 1) : activate(activeIndex - 1);
        } else {
            clickX > half ? activate(activeIndex + 1) : activate(activeIndex - 1);
        }
    });

    window.addEventListener('DOMContentLoaded', () => {
        // query z URL
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        if (query) {
            document.getElementById('query-input').value = query;
        }
    });
</script>

<?php include_once __DIR__ . '/../templates/footer.php'; ?>
