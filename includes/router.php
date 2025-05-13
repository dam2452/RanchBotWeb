<?php
/**
 * Router class
 *
 * Handles routing of requests to appropriate controllers
 */
class Router {
    private $routes = [
        'GET' => [],
        'POST' => []
    ];

    private $notFoundCallback;

    /**
     * Register a GET route
     *
     * @param string $path Route path
     * @param string $callback Controller and method (e.g. 'HomeController@index')
     * @param bool $requireAuth Whether route requires authentication
     * @return void
     */
    public function get($path, $callback, $requireAuth = false) {
        $this->routes['GET'][$path] = [
            'callback' => $callback,
            'requireAuth' => $requireAuth
        ];
    }

    /**
     * Register a POST route
     *
     * @param string $path Route path
     * @param string $callback Controller and method (e.g. 'HomeController@index')
     * @param bool $requireAuth Whether route requires authentication
     * @return void
     */
    public function post($path, $callback, $requireAuth = false) {
        $this->routes['POST'][$path] = [
            'callback' => $callback,
            'requireAuth' => $requireAuth
        ];
    }

    /**
     * Set a callback for when a route is not found
     *
     * @param callable $callback Function to call when route not found
     * @return void
     */
    public function notFound($callback) {
        $this->notFoundCallback = $callback;
    }

    /**
     * Dispatch the current request to the appropriate controller
     *
     * @return void
     */
    public function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $this->getPath();

        // Check if route exists
        if (isset($this->routes[$method][$path])) {
            $route = $this->routes[$method][$path];

            // Check if authentication is required
            if ($route['requireAuth'] && !is_logged_in()) {
                // Save current URL to session to return after login
                session_set('return_to', $_SERVER['REQUEST_URI']);
                header('Location: /login');
                exit;
            }

            // Call the controller method
            $this->callController($route['callback']);
        } else {
            // Look for dynamic routes with parameters
            $route = $this->matchDynamicRoute($method, $path);

            if ($route) {
                // Check if authentication is required
                if ($route['requireAuth'] && !is_logged_in()) {
                    // Save current URL to session to return after login
                    session_set('return_to', $_SERVER['REQUEST_URI']);
                    header('Location: /login');
                    exit;
                }

                // Call the controller method with parameters
                $this->callController($route['callback'], $route['params']);
            } else {
                // Route not found
                if ($this->notFoundCallback) {
                    call_user_func($this->notFoundCallback);
                } else {
                    header("HTTP/1.0 404 Not Found");
                    include __DIR__ . '/../public/views/404.php';
                }
            }
        }
    }

    /**
     * Get the current path from the request URI
     *
     * @return string Current path
     */
    private function getPath() {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        return rtrim($path, '/') ?: '/';
    }

    /**
     * Match dynamic routes with parameters
     *
     * @param string $method HTTP method
     * @param string $path Current path
     * @return array|false Route data or false if no match
     */
    private function matchDynamicRoute($method, $path) {
        foreach ($this->routes[$method] as $routePath => $route) {
            // Skip if not a dynamic route
            if (strpos($routePath, ':') === false) {
                continue;
            }

            // Convert route to regex
            $pattern = preg_replace('/:[a-zA-Z0-9_]+/', '([^/]+)', $routePath);
            $pattern = '@^' . $pattern . '$@';

            if (preg_match($pattern, $path, $matches)) {
                // Extract parameter names
                preg_match_all('/:([a-zA-Z0-9_]+)/', $routePath, $paramNames);
                array_shift($matches); // Remove the first match (full string)

                // Create parameters array
                $params = [];
                foreach ($paramNames[1] as $index => $name) {
                    $params[$name] = $matches[$index];
                }

                return [
                    'callback' => $route['callback'],
                    'requireAuth' => $route['requireAuth'],
                    'params' => $params
                ];
            }
        }

        return false;
    }

    /**
     * Call a controller method
     *
     * @param string $callback Controller and method (e.g. 'HomeController@index')
     * @param array $params Optional parameters to pass to the method
     * @return void
     */
    private function callController($callback, $params = []) {
        // Split controller and method
        [$controller, $method] = explode('@', $callback);

        // Add 'Controller' suffix if not present
        if (strpos($controller, 'Controller') === false) {
            $controller .= 'Controller';
        }

        // Include controller file
        $controllerFile = __DIR__ . '/../controllers/' . $controller . '.php';

        if (file_exists($controllerFile)) {
            require_once $controllerFile;

            // Create controller instance
            $controllerInstance = new $controller();

            // Call method with parameters
            call_user_func_array([$controllerInstance, $method], $params);
        } else {
            throw new Exception("Controller file not found: $controllerFile");
        }
    }
}