<?php include_once __DIR__ . '/../templates/header.php'; ?>
<link rel="stylesheet" href="css/search-results.css">

<main class="search-results-page">
    <div class="search-container">
        <input type="text" class="search-input" id="query-input" placeholder="enter a quote" />
        <button class="search-icon-btn" aria-label="Search">
            <img src="images/arrow-circle-right-svgrepo-com.svg" alt="Search" />
        </button>
        <button class="filter-btn">filters</button>
    </div>

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
    const container = document.querySelector('.video-reel');
    const items = Array.from(document.querySelectorAll('.reel-item'));
    let activeIndex = 0;
    let firstPlayedMuted = true;

    function isMobile() {
        return window.matchMedia('(max-width:850px)').matches;
    }

    function centerItem(idx) {
        const item = items[idx];
        const rect = container.getBoundingClientRect();
        if (isMobile()) {
            const offset = item.offsetTop - (rect.height - item.offsetHeight)/2;
            container.scrollTo({ top: offset, behavior: 'smooth' });
        } else {
            const offset = item.offsetLeft - (rect.width - item.offsetWidth)/2;
            container.scrollTo({ left: offset, behavior: 'smooth' });
        }
    }

    function activate(idx) {
        if (idx < 0 || idx >= items.length) return;
        // deactivate old
        const old = items[activeIndex];
        old.classList.remove('active');
        old.querySelector('video').pause();

        // activate new
        activeIndex = idx;
        const current = items[activeIndex];
        const vid = current.querySelector('video');
        current.classList.add('active');

        if (activeIndex === 0 && firstPlayedMuted) {
            vid.muted = true;
            vid.play();
        } else {
            vid.muted = false;
            vid.volume = 1;
            vid.currentTime = 0;
            vid.play();
            firstPlayedMuted = false;
        }

        centerItem(activeIndex);
    }

    // click handler: item or background
    container.addEventListener('click', e => {
        const clicked = e.target.closest('.reel-item');
        if (clicked) {
            const idx = items.indexOf(clicked);
            if (idx === activeIndex) {
                const vid = clicked.querySelector('video');
                if (activeIndex === 0 && vid.muted) {
                    vid.muted = false;
                    vid.volume = 1;
                    firstPlayedMuted = false;
                } else {
                    vid.paused ? vid.play() : vid.pause();
                }
            } else {
                activate(idx);
            }
            return;
        }

        const rect = container.getBoundingClientRect();
        if (isMobile()) {
            const y = e.clientY - rect.top;
            activate(activeIndex + (y > rect.height/2 ? 1 : -1));
        } else {
            const x = e.clientX - rect.left;
            activate(activeIndex + (x > rect.width/2 ? 1 : -1));
        }
    });

    // keyboard navigation
    window.addEventListener('keydown', e => {
        if (!isMobile()) {
            if (e.key === 'ArrowLeft')  activate(activeIndex - 1);
            if (e.key === 'ArrowRight') activate(activeIndex + 1);
        } else {
            if (e.key === 'ArrowUp')   activate(activeIndex - 1);
            if (e.key === 'ArrowDown') activate(activeIndex + 1);
        }
    });

    // on load: restore query & activate first
    window.addEventListener('DOMContentLoaded', () => {
        const q = new URLSearchParams(location.search).get('q');
        if (q) document.getElementById('query-input').value = q;
        activate(0);
    });

    // re-center if viewport flips (mobile↔desktop)
    window.matchMedia('(max-width:850px)')
        .addEventListener('change', () => centerItem(activeIndex));
</script>

<?php include_once __DIR__ . '/../templates/footer.php'; ?>
