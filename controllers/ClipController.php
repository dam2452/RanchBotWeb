<?php
/**
 * Clip Controller
 *
 * Handles clip management
 */
require_once __DIR__ . '/Controller.php';

class ClipController extends Controller {
    /**
     * Show user's clips
     *
     * @return void
     */
    public function myClips() {
        $this->view('my-clips', [
            'customHead' => '<link rel="stylesheet" href="/css/my-clips.css">',
            'pageTitle' => 'My Clips - RanchBot'
        ]);
    }
}