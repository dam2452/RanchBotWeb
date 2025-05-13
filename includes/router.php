<?php
class Router {
    private $routes = [
        'GET' => [],
        'POST' => []
    ];

    private $notFoundCallback;

    public function get($path, $callback, $requireAuth = false) {
        $this->routes['GET'][$path] = [
            'callback' => $callback,
            'requireAuth' => $requireAuth
        ];
    }

    public function post($path, $callback, $requireAuth = false) {
        $this->routes['POST'][$path] = [
            'callback' => $callback,
            'requireAuth' => $requireAuth
        ];
    }

    public function notFound($callback) {
        $this->notFoundCallback = $callback;
    }
    private function isAsset($path) {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        return in_array($ext, ['ico','png','jpg','jpeg','gif','svg','css','js','map','woff','woff2','ttf']);
    }
    public function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path   = $this->getPath();

        if (!is_public_page_auth($path) && !is_logged_in()) {
            if (!$this->isAsset($path)) {          //  <-- klucz
                session_set('return_to', $_SERVER['REQUEST_URI']);
            }
            header('Location: /login');
            exit;
        }

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
    }

    private function getPath() {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        return rtrim($path, '/') ?: '/';
    }

    private function matchDynamicRoute($method, $path) {
        foreach ($this->routes[$method] as $routePath => $route) {
            if (strpos($routePath, ':') === false) {
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

    private function callController($callback, $params = []) {
        [$controller, $method] = explode('@', $callback);

        if (strpos($controller, 'Controller') === false) {
            $controller .= 'Controller';
        }

        $controllerFile = __DIR__ . '/../controllers/' . $controller . '.php';

        if (file_exists($controllerFile)) {
            require_once $controllerFile;

            $controllerInstance = new $controller();
            call_user_func_array([$controllerInstance, $method], $params);
        } else {
            throw new Exception("Controller file not found: $controllerFile");
        }
    }
}
