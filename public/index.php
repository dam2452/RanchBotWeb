<?php
$customHead = '<link rel="stylesheet" href="css/home.css">';
include_once __DIR__ . '/../templates/header.php';
?>

<main class="hero">
    <div class="left-col">
        <a href="index.php">
            <img src="images/logo.svg" class="logo-img" alt="RanchBot Logo" />
        </a>
        <h1>RanchBot</h1>
        <p class="tagline">Find, cut, and share your favorite Ranczo scene — in seconds.</p>
        <button class="quote-btn" onclick="location.href='search.php'">enter a quote</button>
    </div>

    <div class="arrow-wrapper">
        <img src="images/arrow.svg" class="arrow-img" alt="Arrow">
    </div>
    <div class="right-col">
        <img src="images/KusyDworek.png" class="preview-img" alt="Dworek Kusy">
    </div>
</main>


<?php include_once __DIR__ . '/../templates/footer.php'; ?>
