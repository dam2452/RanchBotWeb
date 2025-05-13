<main>
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
            <button onclick="location.href='/register'">Create account ?</button>
            <button onclick="location.href='/forgot-password'">Forgot password ?</button>
        </div>
    </section>
</main>