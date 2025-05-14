<?php
class Controller {
    protected function view(string $view, array $data = []): void {
        extract($data);
        $customHead = $data['customHead'] ?? '';
        $pageTitle = $data['pageTitle'] ?? 'RanchBot';

        include __DIR__ . '/../templates/header.php';
        include __DIR__ . '/../public/views/' . $view . '.php';
        include __DIR__ . '/../templates/footer.php';
    }

    protected function json(mixed $data, int $statusCode = 200): never {
        header('Content-Type: application/json');
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }

    protected function redirect(string $url): never {
        header("Location: $url");
        exit;
    }
}
