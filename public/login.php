<?php
$customHead = '
    <title>Login – RanchBot</title>
    <link rel="stylesheet" href="css/login.css">
    <script src="script.js" defer></script>
';
include_once __DIR__ . '/../templates/header.php';
?>

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
            <button>Create account ?</button>
            <button>Forgot password ?</button>
        </div>
    </section>
</main>

<?php include_once __DIR__ . '/../templates/footer.php'; ?>
