<?php include_once __DIR__ . '/../templates/header.php'; ?>
<link rel="stylesheet" href="css/search-results.css">

<main class="search-results-page">
    <div class="video-reel">
        <!-- Reel Item 1 -->
        <div class="reel-item active" data-id="0">
            <video muted loop preload="metadata" poster="images/sample-scene.png">
                <source src="videos/scene-001.mp4" type="video/mp4">
            </video>
        </div>

        <!-- Reel Item 2 -->
        <div class="reel-item" data-id="1">
            <video muted loop preload="metadata" poster="images/sample-scene2.png">
                <source src="videos/scene-002.mp4" type="video/mp4">
            </video>
        </div>

        <!-- Reel Item 3 -->
        <div class="reel-item" data-id="2">
            <video muted loop preload="metadata" poster="images/sample-scene3.png">
                <source src="videos/scene-003.mp4" type="video/mp4">
            </video>
        </div>
    </div>
</main>

<script>
    const isMobile = window.matchMedia("(max-width: 850px)").matches;
    const items = document.querySelectorAll('.reel-item');
    let activeIndex = 0;

    function activate(index) {
        if (index < 0 || index >= items.length) return;

        items[activeIndex].classList.remove('active');
        items[activeIndex].querySelector('video').pause();

        activeIndex = index;
        items[activeIndex].classList.add('active');
        const video = items[activeIndex].querySelector('video');
        video.currentTime = 0;
        video.play();

        const offset = isMobile
            ? items[activeIndex].offsetTop - 20
            : items[activeIndex].offsetLeft - 20;

        const container = document.querySelector('.video-reel');
        container.scrollTo({
            top: isMobile ? offset : 0,
            left: isMobile ? 0 : offset,
            behavior: 'smooth'
        });
    }

    document.querySelector('.video-reel').addEventListener('click', (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickPos = isMobile ? e.clientY - rect.top : e.clientX - rect.left;
        const half = isMobile ? rect.height / 2 : rect.width / 2;

        if (clickPos > half) {
            activate(activeIndex + 1);
        } else {
            activate(activeIndex - 1);
        }
    });

    window.addEventListener('DOMContentLoaded', () => {
        items[0].querySelector('video').play();
    });
</script>

<?php include_once __DIR__ . '/../templates/footer.php'; ?>
