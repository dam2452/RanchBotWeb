<?php
/**
 * Search Controller
 *
 * Handles search functionality
 */
require_once __DIR__ . '/Controller.php';

class SearchController extends Controller {
    /**
     * Show the search page
     *
     * @return void
     */
    public function index() {
        $this->view('search', [
            'customHead' => '<link rel="stylesheet" href="/css/search.css">',
            'pageTitle' => 'Search - RanchBot'
        ]);
    }

    /**
     * Show search results
     *
     * @return void
     */
    public function results() {
        $this->view('search-results', [
            'customHead' => '
                <link rel="stylesheet" href="/css/search-results.css">
                <link rel="stylesheet" href="/css/clip-inspector.css">
            ',
            'pageTitle' => 'Search Results - RanchBot'
        ]);
    }
}