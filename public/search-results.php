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

<script type="module" src="js/init/search-page.js"></script>

<?php include_once __DIR__ . '/../templates/footer.php'; ?>
