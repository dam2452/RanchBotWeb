<?php

header("Content-Type: text/plain");

$endpoint = $_GET['endpoint'] ?? 'sz';
$args = $_GET['args'] ?? 'geniusz';

$jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMDE1MzQ0OTUxLCJ1c2VybmFtZSI6ImRhbTI0NTIiLCJmdWxsX25hbWUiOiJEYW1pYW4gS290ZXJiYSIsImV4cCI6MTc0NzUxMzAzNS4yODA1MTcsImlhdCI6MTc0NjkwODIzNS4yODA1MTcsImlzcyI6IlJhbmNoQm90IiwiYXVkIjoiQ0xJIn0.zT-cbssAvyZZGEfvBYVWxN9XQhcl9lnouHmHP9IwndE'; // ← Twój token

$payload = json_encode([
    'args' => [$args]
]);

$url = "http://192.168.1.210:8077/api/v1/$endpoint";

$options = [
    "http" => [
        "method" => "POST",
        "header" => [
            "Content-Type: application/json",
            "Authorization: Bearer $jwt"
        ],
        "content" => $payload
    ]
];

$ctx = stream_context_create($options);
$response = file_get_contents($url, false, $ctx);

if ($response === false) {
    echo "Błąd zapytania!\n";
    var_dump(error_get_last());
    exit;
}

echo $response;
