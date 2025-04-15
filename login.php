<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $login = trim($_POST['login'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($login === 'admin' && $password === 'admin') {
        echo "Welcome, $login!";
    } else {
        echo "Invalid login or password.";
    }
}
?>
