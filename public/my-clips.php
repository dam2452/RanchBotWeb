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

<script type="module" src="js/init/my-clips.js"></script>


<?php include_once __DIR__ . '/../templates/footer.php'; ?>
