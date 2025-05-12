<?php
// Zapisz ten plik jako public/test_login.php

require_once __DIR__ . '/../includes/config.php';

$result = 'Wprowadź dane logowania';
$userData = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username']) && isset($_POST['password'])) {
    $username = trim($_POST['username']);
    $password = $_POST['password'];

    // Przygotuj dane do zapytania
    $payload = json_encode([
        'username' => $username,
        'password' => $password
    ]);

    // Inicjalizacja CURL
    $ch = curl_init('http://192.168.1.210:8077/api/v1/auth/login');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => $payload
    ]);

    // Wykonaj zapytanie
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);

    $result = "HTTP Code: $httpCode<br>Error: $error<br>";

    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if (isset($data['access_token'])) {
            $token = $data['access_token'];
            $tokenParts = explode('.', $token);
            $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
            $userData = json_decode($payload, true);

            $result .= "Login udany! Token JWT otrzymany.<br>";
        } else {
            $result .= "Token JWT nie znaleziony w odpowiedzi.<br>";
        }
    } else {
        $result .= "Odpowiedź API: " . htmlspecialchars($response) . "<br>";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test logowania</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .result { margin: 20px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        form { margin: 20px 0; }
        label { display: block; margin-bottom: 5px; }
        input { width: 100%; padding: 8px; margin-bottom: 15px; box-sizing: border-box; }
        button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        pre { overflow-x: auto; background: #f8f8f8; padding: 10px; }
    </style>
</head>
<body>
<h1>Test logowania do API</h1>

<form method="POST" action="">
    <div>
        <label for="username">Nazwa użytkownika:</label>
        <input type="text" id="username" name="username" required value="<?= htmlspecialchars($_POST['username'] ?? '') ?>">
    </div>
    <div>
        <label for="password">Hasło:</label>
        <input type="password" id="password" name="password" required>
    </div>
    <button type="submit">Zaloguj</button>
</form>

<div class="result <?= $userData ? 'success' : 'error' ?>">
    <h3>Wynik:</h3>
    <p><?= $result ?></p>

    <?php if ($userData): ?>
        <h3>Dane użytkownika z tokenu JWT:</h3>
        <pre><?= htmlspecialchars(print_r($userData, true)) ?></pre>
    <?php endif; ?>

    <h3>Odpowiedź API:</h3>
    <pre><?= htmlspecialchars($response ?? 'Brak odpowiedzi') ?></pre>
</div>

<p><a href="/">&laquo; Powrót do strony głównej</a></p>
</body>
</html>