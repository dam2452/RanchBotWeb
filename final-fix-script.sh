#!/bin/bash

echo "=== RanchBot Modern Router - Skrypt naprawczy ==="
echo ""

# 1. Naprawiamy klasę Controller
echo "1. Poprawianie klasy Controller..."
cat > controllers/Controller.php << 'EOF'
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
EOF
echo "Klasa Controller została zaktualizowana."
echo ""

# 2. Upewniamy się, że katalog views istnieje
echo "2. Tworzenie katalogów i plików widoków..."
mkdir -p public/views

# Funkcja do tworzenia plików widoków
create_view_file() {
  local file="public/views/$1.php"
  local content="$2"
  
  if [ ! -f "$file" ]; then
    echo "   Tworzenie pliku widoku: $file"
    echo "$content" > "$file"
  else
    echo "   Plik widoku już istnieje: $file"
  fi
}

# Home view
create_view_file "home" '<main class="hero">
    <div class="left-col">
        <a href="/">
            <img src="/images/branding/logo.svg" class="logo-img" alt="RanchBot Logo" />
        </a>
        <h1>RanchBot</h1>
        <p class="tagline">Find, cut, and share your favorite Ranczo scene — in seconds.</p>
        <button class="quote-btn" onclick="location.href=\'/search\'">enter a quote</button>
    </div>

    <div class="arrow-wrapper">
        <img src="/images/ui/icons/arrow.svg" class="arrow-img" alt="Arrow">
    </div>
    <div class="right-col">
        <img src="/images/others/KusyDworek.png" class="preview-img" alt="Dworek Kusy">
    </div>
</main>'

# Search view
create_view_file "search" '<main class="search-page">
    <div class="logo-wrapper">
        <a href="/">
            <img src="/images/branding/logo.svg" class="logo-img" alt="RanchBot Logo" />
        </a>
        <h1 class="title">RanchBot</h1>
    </div>

    <form id="searchForm" class="search-container">
        <input type="text" id="quoteInput" name="query" placeholder="Enter a quote" class="search-input" required />
        <button type="submit" class="search-icon-btn" aria-label="Search">
            <img src="/images/ui/icons/arrow-circle-right.svg" alt="Search" />
        </button>
        <button type="button" class="filter-btn">Filters</button>
    </form>

    <!-- AJAX wyniki -->
    <div id="resultsContainer" class="results-container"></div>
    <div id="videoContainer" class="video-container" style="margin-top: 20px;"></div>
</main>

<script type="module" src="/js/init/search-page.js"></script>'

# Search results view
create_view_file "search-results" '<main class="search-results-page">
    <div class="search-container">
        <input type="text" class="search-input" id="query-input" placeholder="enter a quote" />
        <button class="search-icon-btn" aria-label="Search">
            <img src="/images/ui/icons/arrow-circle-right.svg" alt="Search" />
        </button>
        <button class="filter-btn">filters</button>
    </div>

    <div class="video-reel"></div>
</main>

<script type="module" src="/js/modules/clip-inspector.js"></script>
<script type="module" src="/js/init/search-results.js"></script>'

# Login view
create_view_file "login" '<main>
    <section class="left">
        <a href="/">
            <img src="/images/branding/logo.svg" class="logo-img" alt="RanchBot Logo" />
        </a>
        <h1>RanchBot</h1>
    </section>

    <section class="right">
        <div class="bench-container">
            <img src="/images/others/bench.svg" alt="Bench Graphic" class="bench-image"/>
            <form class="form-overlay" action="/login" method="POST">
                <?php if (!empty($login_error)): ?>
                    <div class="error-message"><?= htmlspecialchars($login_error) ?></div>
                <?php endif; ?>
                <input type="text" name="login" placeholder="login" required autofocus />
                <input type="password" name="password" placeholder="password" required />
                <button type="submit">Zaloguj się</button>
            </form>
        </div>

        <div class="actions">
            <button onclick="location.href=\'/register\'">Create account ?</button>
            <button onclick="location.href=\'/forgot-password\'">Forgot password ?</button>
        </div>
    </section>
</main>'

# Register view
create_view_file "register" '<main class="page-container static-page">
    <div class="message-box info-box">
        <h1>Rejestracja</h1>
        <p class="important-message">
            Rejestracja nowych użytkowników jest obecnie wyłączona.
        </p>
        <p>
            Trwa zamknięta beta aplikacji. Aby uzyskać dostęp, prosimy o kontakt z administratorem.
        </p>
        <p class="login-link-container">
            Posiadasz już konto?
        </p>
        <a href="/login" class="action-button">Zaloguj się</a>
    </div>
</main>'

# Forgot password view
create_view_file "forgot-password" '<main class="page-container static-page">
    <div class="message-box info-box">
        <h1>Odzyskiwanie hasła</h1>
        <p class="important-message">
            Funkcja odzyskiwania hasła jest obecnie wyłączona.
        </p>
        <p>
            Trwa zamknięta beta aplikacji. Aby zresetować hasło, prosimy o kontakt z administratorem.
        </p>
        <p class="login-link-container">
            Pamiętasz swoje hasło?
        </p>
        <a href="/login" class="action-button">Zaloguj się</a>
    </div>
</main>'

# My clips view
create_view_file "my-clips" '<main class="my-clips-page">
    <div class="my-clips-header">
        <h1>My Clips</h1>
    </div>

    <!-- Wskaźnik ładowania -->
    <div id="loading-indicator">
        <div class="spinner"></div>
        <div style="margin-top: 15px; font-weight: bold;">Ładowanie klipów...</div>
    </div>

    <!-- Kontener na klipy -->
    <div class="clips-reel"></div>
</main>

<script type="module" src="/js/init/my-clips.js"></script>'

# 404 view
create_view_file "404" '<main class="error-page">
    <div class="message-box error-box">
        <h1>404 - Strona nie znaleziona</h1>
        <p>
            Strona, której szukasz, nie istnieje lub została przeniesiona.
        </p>
        <a href="/" class="action-button">Strona główna</a>
    </div>
</main>'

echo "Pliki widoków zostały utworzone."
echo ""

# 3. Aktualizacja .htaccess
echo "3. Aktualizacja .htaccess..."
cat > public/.htaccess << 'EOF'
# Enable rewrite engine
RewriteEngine On

# Set the base directory
RewriteBase /

# Allow direct access to existing files and directories
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Handle API requests explicitly
RewriteRule ^api/clips api/clips-api.php [L]
RewriteRule ^api/video api/api-video.php [L]
RewriteRule ^api/json api/api-json.php [L]

# Send everything else to index.php
RewriteRule ^(.*)$ index.php [QSA,L]
EOF
echo "Plik .htaccess został zaktualizowany."
echo ""

# 4. Aktualizacja Caddyfile
echo "4. Aktualizacja Caddyfile..."
cat > Caddyfile << 'EOF'
{
    debug
    auto_https off
}

http://localhost {
    @api_matcher path /api/v1/*
    handle @api_matcher {
        reverse_proxy {$EXISTING_RANCHBOT_API_ADDRESS}
    }

    # Obsługa API
    @api_request {
        path /api/clips /api/video /api/json
    }
    handle @api_request {
        uri replace /api/clips /api/clips-api.php
        uri replace /api/video /api/api-video.php
        uri replace /api/json /api/api-json.php
        php_fastcgi php-dev:9000 {
            root /srv/php-app/public
        }
    }

    # Statyczne pliki
    @static {
        path *.css *.js *.svg *.png *.jpg *.jpeg *.gif *.ico *.mp4
    }
    handle @static {
        root * /srv/php-app/public
        file_server
    }

    # Wszystko inne
    handle {
        root * /srv/php-app/public
        try_files {path} /index.php?{query}
        php_fastcgi php-dev:9000 {
            root /srv/php-app/public
        }
    }
    
    log {
        output stdout
        format console
    }
    
    encode gzip zstd
}
EOF
echo "Plik Caddyfile został zaktualizowany."
echo ""

# 5. Upewnij się, że index.php ma właściwą zawartość
echo "5. Sprawdzanie pliku index.php..."
if grep -q "Router" public/index.php; then
    echo "Plik index.php już zawiera router. Pomijanie."
else
    echo "Aktualizacja pliku index.php..."
    cat > public/index.php << 'EOF'
<?php
// public/index.php - Main entry point for all requests
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/router.php';

// Initialize the router
$router = new Router();

// Define routes
$router->get('/', 'HomeController@index');
$router->get('/search', 'SearchController@index');
$router->get('/search-results', 'SearchController@results');
$router->get('/login', 'AuthController@loginForm');
$router->post('/login', 'AuthController@login');
$router->get('/logout', 'AuthController@logout');
$router->get('/register', 'AuthController@registerForm');
$router->get('/my-clips', 'ClipController@myClips', true); // true = requires authentication
$router->get('/forgot-password', 'AuthController@forgotPasswordForm');

// API routes
$router->post('/api/clips', 'ApiController@clips');
$router->post('/api/video', 'ApiController@video');
$router->post('/api/json', 'ApiController@json');

// Handle the current request
$router->dispatch();
EOF
    echo "Plik index.php został zaktualizowany."
fi
echo ""

# 6. Sprawdź pliki kontrolerów
echo "6. Sprawdzanie plików kontrolerów..."

# Dodatkowe sprawdzenie Router.php
if [ ! -f "includes/router.php" ]; then
    echo "Brak pliku Router.php. Tworzenie..."
    cat > includes/router.php << 'EOF'
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
EOF
    echo "Plik router.php został utworzony."
else
    echo "Plik router.php już istnieje. Pomijanie."
fi
echo ""

# 7. Podsumowanie i porady
echo "====================== PODSUMOWANIE ======================"
echo "Zakończono naprawę systemu routingu. Struktura katalogów i pliki zostały poprawione."
echo ""
echo "PAMIĘTAJ:"
echo "1. Zrestartuj serwer Caddy, aby zastosować zmiany."
echo "2. Testuj wszystkie ścieżki, zaczynając od strony głównej (/)."
echo "3. Po potwierdzeniu, że wszystko działa poprawnie, możesz usunąć stare pliki PHP z katalogu public/."
echo ""
echo "Lista starych plików PHP, które mogą zostać usunięte po testach:"
ls -1 public/*.php | grep -v index.php
echo ""
echo "============================================================="
echo ""
echo "Gotowe!"
