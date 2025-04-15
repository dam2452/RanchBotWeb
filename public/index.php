<?php include_once __DIR__ . '/../templates/header.php'; ?>
<link rel="stylesheet" href="css/home.css">

<main class="hero">
    <div class="left-col">
        <img src="images/logo.svg" class="logo-img" alt="RanchBot Logo">
        <h1>RanchBot</h1>
        <p class="tagline">Find, cut, and share your favorite Ranczo scene — in seconds.</p>
        <button class="quote-btn" onclick="location.href='login.php'">enter a quote</button>
    </div>
    <!-- Strzałka jako oddzielny sibling -->
    <div class="arrow-wrapper">
        <img src="images/arrow.svg" class="arrow-img" alt="Arrow">
    </div>
    <div class="right-col">
        <img src="images/KusyDworek.png" class="preview-img" alt="Dworek Kusy">
    </div>
</main>

<script src="js/script.js"></script>
<?php include_once __DIR__ . '/../templates/footer.php'; ?>
