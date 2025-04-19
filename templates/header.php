<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="color-scheme" content="only light">
    <link rel="stylesheet" href="/css/header.css">
    <?= $customHead ?? '' ?>
</head>
<body>
<header>
    <div class="auth-buttons">
        <button onclick="location.href='/login.php'">Login</button>
        <button onclick="location.href='/register.php'">Register</button>
    </div>
</header>
