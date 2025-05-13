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