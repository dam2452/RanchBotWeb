<?php
require_once __DIR__ . '/Controller.php';

class ClipController extends Controller {
    public function myClips(): void {
        $this->view('my-clips', [
            'customHead' => '<link rel="stylesheet" href="/css/my-clips.css">',
            'pageTitle' => 'My Clips - RanchBot'
        ]);
    }
}
