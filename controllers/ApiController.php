<?php
/**
 * Auth Controller
 *
 * Handles authentication and user management
 */
require_once __DIR__ . '/Controller.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/api-client.php';

class AuthController extends Controller {
    /**
     * Show login form
     *
     * @return void
     */
    public function loginForm() {
        // Redirect if already logged in
        if (is_logged_in()) {
            $redirect_url = session_get('return_to', '/search');
            session_remove('return_to');
            $this->redirect($redirect_url);
        }

        $this->view('login', [
            'customHead' => '<link rel="stylesheet" href="/css/login.css">',
            'pageTitle' => 'Login - RanchBot',
            'login_error' => ''
        ]);
    }

    /**
     * Process login form
     *
     * @return void
     */
    public function login() {
        $login_error = '';

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!handle_login_attempt()) {
                $login_error = 'Nieprawidłowa nazwa użytkownika lub hasło.';
            } else {
                // Login successful, redirect
                $redirect_url = session_get('return_to', '/search');
                session_remove('return_to');
                $this->redirect($redirect_url);
                return;
            }
        }

        // If we get here, login failed
        $this->view('login', [
            'customHead' => '<link rel="stylesheet" href="/css/login.css">',
            'pageTitle' => 'Login - RanchBot',
            'login_error' => $login_error
        ]);
    }

    /**
     * Show registration form
     *
     * @return void
     */
    public function registerForm() {
        $this->view('register', [
            'customHead' => '<link rel="stylesheet" href="/css/register.css">',
            'pageTitle' => 'Registration - RanchBot'
        ]);
    }

    /**
     * Log out user
     *
     * @return void
     */
    public function logout() {
        logout_user();
        $this->redirect('/');
    }

    /**
     * Show forgot password form
     *
     * @return void
     */
    public function forgotPasswordForm() {
        $this->view('forgot-password', [
            'customHead' => '<link rel="stylesheet" href="/css/register.css">',
            'pageTitle' => 'Recover Password - RanchBot'
        ]);
    }
}