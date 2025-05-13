<?php
require_once __DIR__ . '/Controller.php';

class SearchController extends Controller {
    public function index() {
        $this->view('search', [
            'customHead' => '<link rel="stylesheet" href="/css/search.css">',
            'pageTitle' => 'Search - RanchBot'
        ]);
    }

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
