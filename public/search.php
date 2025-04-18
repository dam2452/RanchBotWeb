<?php include_once __DIR__ . '/../templates/header.php'; ?>
<link rel="stylesheet" href="css/search.css">

<main class="search-page">
    <div class="logo-wrapper">
        <img src="images/logo.svg" alt="RanchBot Logo" class="logo-img" />
        <h1 class="title">RanchBot</h1>
    </div>

    <div class="search-container">
        <input type="text" placeholder="enter a quote" class="search-input" />
        <button class="filter-btn">filters</button>
    </div>
</main>

<script src="js/search.js"></script>
<?php include_once __DIR__ . '/../templates/footer.php'; ?>
