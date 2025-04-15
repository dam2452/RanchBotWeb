<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="color-scheme" content="only light">
    <title>RanchBot</title>
    <link rel="stylesheet" href="css/login.css" />

</head>
<body>
<header>
    <div></div>
    <div class="auth-buttons">
        <button onclick="location.href='#'">Register</button>
        <button onclick="location.href='#'">Login</button>
    </div>
</header>

<main>
    <section class="left">
        <img src="images/logo.svg" class="logo-big" alt="RanchBot Logo" />
        <h1>RanchBot</h1>
    </section>

    <section class="right">
        <div class="bench-container">
            <img src="images/bench.svg" alt="Bench Graphic" class="bench-image"/>
            <form class="form-overlay" action="login.php" method="POST">
                <input type="text" name="login" placeholder="login" required />
                <input type="password" name="password" placeholder="password" required />
                <button type="submit">continue</button>
            </form>
        </div>

        <div class="actions">
            <button >Create account ?</button>
            <button >Forgot password ?</button>
        </div>
    </section>
</main>

<script src="script.js"></script>
</body>
</html>