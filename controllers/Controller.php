<?php
/**
 * Base Controller
 * 
 * Parent class for all controllers
 */
class Controller {
    /**
     * Render a view with data
     * 
     * @param string $view View name
     * @param array $data Data to pass to the view
     * @return void
     */
    protected function view($view, $data = []) {
        // Extract data to make variables available in view
        extract($data);
        
        // Custom head content for templates
        $customHead = $data['customHead'] ?? '';
        
        // Set page title
        $pageTitle = $data['pageTitle'] ?? 'RanchBot';
        
        // Include header template
        include __DIR__ . '/../templates/header.php';
        
        // Poprawiona ścieżka do widoków - bezpośrednio w public/views
        include __DIR__ . '/../public/views/' . $view . '.php';
        
        // Include footer template
        include __DIR__ . '/../templates/footer.php';
    }
    
    /**
     * Send a JSON response
     * 
     * @param mixed $data Data to send as JSON
     * @param int $statusCode HTTP status code
     * @return void
     */
    protected function json($data, $statusCode = 200) {
        header('Content-Type: application/json');
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }
    
    /**
     * Redirect to a URL
     * 
     * @param string $url URL to redirect to
     * @return void
     */
    protected function redirect($url) {
        header("Location: $url");
        exit;
    }
}
