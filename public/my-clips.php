<?php include_once __DIR__ . '/../templates/header.php'; ?>
<link rel="stylesheet" href="css/my-clips.css">

<main class="my-clips-page">
    <div class="my-clips-header">
        <h1>My Clips</h1>
    </div>

    <div class="clips-reel">
        <?php for ($i = 1; $i <= 12; $i++): ?>
            <div class="clip-card" data-id="<?= $i ?>">
                <video preload="metadata" poster="images/sample-scene<?= $i % 3 + 1 ?>.png">
                    <source src="videos/scene-00<?= $i % 3 + 1 ?>.mp4" type="video/mp4">
                </video>
                <p class="quote">"Cytat nr <?= $i ?>"</p>
            </div>
        <?php endfor; ?>
    </div>
</main>

<script>
    const reel = document.querySelector('.clips-reel');
    let pages = [], currentPage = 0;

    function regroupPages() {
        const cards = Array.from(document.querySelectorAll('.clip-card'));
        const isMobile = window.matchMedia('(max-width:850px)').matches;
        const perPage = isMobile ? 3 : 6;

        // usuń stare strony
        reel.innerHTML = '';
        // podziel i wstaw nowe strony
        for (let i = 0; i < cards.length; i += perPage) {
            const page = document.createElement('div');
            page.className = 'clips-page';
            cards.slice(i, i + perPage).forEach(c => page.appendChild(c));
            reel.appendChild(page);
        }
        pages = document.querySelectorAll('.clips-page');
        currentPage = 0;
        scrollToPage(0);
    }

    function scrollToPage(idx) {
        if (idx < 0 || idx >= pages.length) return;
        currentPage = idx;
        const isMobile = window.matchMedia('(max-width:850px)').matches;

        reel.scrollTo({
            top:    isMobile ? pages[idx].offsetTop   : 0,
            left:   isMobile ? 0                        : pages[idx].offsetLeft,
            behavior:'smooth'
        });
    }

    // toggle play/pause, ale tylko na aktualnej stronie
    document.addEventListener('click', e => {
        const card = e.target.closest('.clip-card');
        if (!card) return;
        e.stopPropagation();

        const page = card.closest('.clips-page');
        const pageIndex = Array.from(pages).indexOf(page);
        if (pageIndex !== currentPage) {
            scrollToPage(pageIndex);
            return;
        }

        const video = card.querySelector('video');
        document.querySelectorAll('.clip-card video').forEach(v => {
            if (v !== video) v.pause();
        });
        video.paused ? video.play() : video.pause();
    });

    // click on background → switch page
    reel.addEventListener('click', e => {
        if (e.target.closest('.clip-card')) return;
        const isMobile = window.matchMedia('(max-width:850px)').matches;
        const rect = reel.getBoundingClientRect();

        if (isMobile) {
            const y = e.clientY - rect.top;
            scrollToPage(currentPage + (y > rect.height/2 ? 1 : -1));
        } else {
            const x = e.clientX - rect.left;
            scrollToPage(currentPage + (x > rect.width/2 ? 1 : -1));
        }
    });

    // klawisze ←→
    window.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') scrollToPage(currentPage + 1);
        if (e.key === 'ArrowLeft')  scrollToPage(currentPage - 1);
    });

    // wykonaj przy starcie i resize
    window.addEventListener('load',   regroupPages);
    window.addEventListener('resize', regroupPages);
</script>

<?php include_once __DIR__ . '/../templates/footer.php'; ?>
