<?php
class Controller {
    protected function view($view, $data = []) {
        extract($data);
        $customHead = $data['customHead'] ?? '';
        $pageTitle = $data['pageTitle'] ?? 'RanchBot';

        include __DIR__ . '/../templates/header.php';
        include __DIR__ . '/../public/views/' . $view . '.php';
        include __DIR__ . '/../templates/footer.php';
    }

    protected function json($data, $statusCode = 200) {
        header('Content-Type: application/json');
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }

    protected function redirect($url) {
        header("Location: $url");
        exit;
    }
}
