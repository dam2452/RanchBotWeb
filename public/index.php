<?php

require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/router.php';

$router = new Router();

$router->get('/', 'HomeController@index');
$router->get('/search', 'SearchController@index');
$router->get('/search-results', 'SearchController@results');
$router->get('/login', 'AuthController@loginForm');
$router->post('/login', 'AuthController@login');
$router->get('/logout', 'AuthController@logout');
$router->get('/register', 'AuthController@registerForm');
$router->get('/my-clips', 'ClipController@myClips', true);
$router->get('/forgot-password', 'AuthController@forgotPasswordForm');

$router->post('/api/clips', 'ApiController@clips');
$router->post('/api/video', 'ApiController@video');
$router->post('/api/json', 'ApiController@json');

$router->dispatch();