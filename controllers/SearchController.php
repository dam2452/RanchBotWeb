<?php
require_once __DIR__ . '/Controller.php';

class SearchController extends Controller {
    public function index(): void {
        $this->view('search', [
            'customHead' => '<link rel="stylesheet" href="/css/pages/search.css">',
            'pageTitle' => 'Search - RanchBot'
        ]);
    }

    public function results(): void {
        $this->view('search-results', [
            'customHead' => '
                <link rel="stylesheet" href="/css/pages/search-results.css">
                <link rel="stylesheet" href="/css/components/clip-inspector.css">
            ',
            'pageTitle' => 'Search Results - RanchBot'
        ]);
    }
}
