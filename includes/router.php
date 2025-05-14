<?php
class Router {
    private array $routes = [
        'GET' => [],
        'POST' => []
    ];

    private ?Closure $notFoundCallback = null;

    public function get(string $path, string $callback, bool $requireAuth = false): void {
        $this->routes['GET'][$path] = [
            'callback' => $callback,
            'requireAuth' => $requireAuth
        ];
    }

    public function post(string $path, string $callback, bool $requireAuth = false): void {
        $this->routes['POST'][$path] = [
            'callback' => $callback,
            'requireAuth' => $requireAuth
        ];
    }

    public function notFound(callable $callback): void {
        $this->notFoundCallback = $callback;
    }

    private function isAsset(string $path): bool {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        return in_array($ext, ['ico','png','jpg','jpeg','gif','svg','css','js','map','woff','woff2','ttf']);
    }

    public function dispatch(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $path   = $this->getPath();

        if (!is_public_page_auth($path) && !is_logged_in()) {
            if (!$this->isAsset($path)) {
                session_set('return_to', $_SERVER['REQUEST_URI']);
            }
            header('Location: /login');
            exit;
        }

        try {
            if (isset($this->routes[$method][$path])) {
                $route = $this->routes[$method][$path];

                if ($route['requireAuth'] && !is_logged_in()) {
                    session_set('return_to', $_SERVER['REQUEST_URI']);
                    header('Location: /login');
                    exit;
                }

                $this->callController($route['callback']);
            } else {
                $route = $this->matchDynamicRoute($method, $path);

                if ($route) {
                    if ($route['requireAuth'] && !is_logged_in()) {
                        session_set('return_to', $_SERVER['REQUEST_URI']);
                        header('Location: /login');
                        exit;
                    }

                    $this->callController($route['callback'], $route['params']);
                } else {
                    if ($this->notFoundCallback) {
                        call_user_func($this->notFoundCallback);
                    } else {
                        header("HTTP/1.0 404 Not Found");
                        include __DIR__ . '/../public/views/404.php';
                    }
                }
            }
        } catch (Throwable $e) {
            error_log("Router dispatch error: " . $e->getMessage());
            http_response_code(500);
            echo "Internal Server Error";
        }
    }

    private function getPath(): string {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        return rtrim($path, '/') ?: '/';
    }

    private function matchDynamicRoute(string $method, string $path): array|false {
        foreach ($this->routes[$method] as $routePath => $route) {
            if (!str_contains($routePath, ':')) {
                continue;
            }

            $pattern = preg_replace('/:[a-zA-Z0-9_]+/', '([^/]+)', $routePath);
            $pattern = '@^' . $pattern . '$@';

            if (preg_match($pattern, $path, $matches)) {
                preg_match_all('/:([a-zA-Z0-9_]+)/', $routePath, $paramNames);
                array_shift($matches);

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

    private function callController(string $callback, array $params = []): void {
        [$controller, $method] = explode('@', $callback);

        if (!str_contains($controller, 'Controller')) {
            $controller .= 'Controller';
        }

        $controllerFile = __DIR__ . '/../controllers/' . $controller . '.php';

        if (!file_exists($controllerFile)) {
            throw new RuntimeException("Controller file not found: $controllerFile");
        }

        require_once $controllerFile;

        if (!class_exists($controller)) {
            throw new RuntimeException("Controller class $controller not found in file.");
        }

        $controllerInstance = new $controller();

        if (!method_exists($controllerInstance, $method)) {
            throw new RuntimeException("Method $method not found in controller $controller.");
        }

        call_user_func_array([$controllerInstance, $method], $params);
    }
}
