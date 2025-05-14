<?php
require_once __DIR__ . '/Controller.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/session.php';

class AuthController extends Controller {
    public function loginForm(): void {
        if (is_logged_in()) {
            $redirect_url = session_get('return_to', '/search');
            session_remove('return_to');
            $this->redirect($redirect_url);
        }

        $this->view('login', [
            'customHead' => '<link rel="stylesheet" href="/css/pages/login.css">',
            'pageTitle' => 'Login - RanchBot',
            'login_error' => ''
        ]);
    }

    public function login(): void {
        $login_error = '';

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!handle_login_attempt()) {
                $login_error = 'Invalid username or password.';
            } else {
                $redirect_url = session_get('return_to', '/search');
                session_remove('return_to');
                $this->redirect($redirect_url);
            }
        }

        $this->view('login', [
            'customHead' => '<link rel="stylesheet" href="/css/pages/login.css">',
            'pageTitle' => 'Login - RanchBot',
            'login_error' => $login_error
        ]);
    }

    public function registerForm(): void {
        $this->view('register', [
            'customHead' => '<link rel="stylesheet" href="/css/pages/register.css">',
            'pageTitle' => 'Registration - RanchBot'
        ]);
    }

    public function logout(): void {
        logout_user();
        $this->redirect('/');
    }

    public function forgotPasswordForm(): void {
        $this->view('forgot-password', [
            'customHead' => '<link rel="stylesheet" href="/css/pages/register.css">',
            'pageTitle' => 'Recover Password - RanchBot'
        ]);
    }
}
