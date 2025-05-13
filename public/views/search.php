<main class="search-page">
    <div class="logo-wrapper">
        <a href="/">
            <img src="/images/branding/logo.svg" class="logo-img" alt="RanchBot Logo" />
        </a>
        <h1 class="title">RanchBot</h1>
    </div>

    <form id="searchForm" class="search-container">
        <input type="text" id="quoteInput" name="query" placeholder="Enter a quote" class="search-input" required />
        <button type="submit" class="search-icon-btn" aria-label="Search">
            <img src="/images/ui/icons/arrow-circle-right.svg" alt="Search" />
        </button>
        <button type="button" class="filter-btn">Filters</button>
    </form>


    <div id="resultsContainer" class="results-container"></div>
    <div id="videoContainer" class="video-container" style="margin-top: 20px;"></div>
</main>

<script type="module" src="/js/init/search-page.js"></script><?php
