<?php
require_once __DIR__ . '/Controller.php';

class HomeController extends Controller {
    public function index(): void {
        $this->view('home', [
            'customHead' => '<link rel="stylesheet" href="/css/home.css">',
            'pageTitle' => 'RanchBot - Find, cut, and share your favorite Ranczo scene'
        ]);
    }
}
