#!/bin/bash

# Skrypt do aktualizacji ścieżek URL w plikach JavaScript
echo "=== Aktualizacja ścieżek URL w plikach JavaScript ==="
echo ""

# Sprawdzenie czy plik constants.js istnieje
CONSTANTS_FILE="public/js/core/constants.js"
if [ -f "$CONSTANTS_FILE" ]; then
    echo "Aktualizacja pliku $CONSTANTS_FILE..."
    sed -i 's/search\.php/search/g' "$CONSTANTS_FILE"
    sed -i 's/login\.php/login/g' "$CONSTANTS_FILE"
    sed -i 's/index\.php/\//g' "$CONSTANTS_FILE"
    sed -i 's/my-clips\.php/my-clips/g' "$CONSTANTS_FILE"
    sed -i 's/search-results\.php/search-results/g' "$CONSTANTS_FILE"
    echo "Plik constants.js zaktualizowany."
else
    echo "Plik $CONSTANTS_FILE nie istnieje!"
fi

# Lista plików JS do zaktualizowania
JS_FILES=(
    "public/js/components/SearchNavigationButton.js"
    "public/js/init/my-clips.js"
    "public/js/init/search-page.js"
    "public/js/init/search-results.js"
    "public/js/components/ClipsManager.js"
    "public/js/components/PagedClipsNavigator.js"
)

# Aktualizacja każdego pliku
for FILE in "${JS_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        echo "Aktualizacja pliku $FILE..."
        sed -i 's/search\.php/search/g' "$FILE"
        sed -i 's/login\.php/login/g' "$FILE"
        sed -i 's/index\.php/\//g' "$FILE"
        sed -i 's/my-clips\.php/my-clips/g' "$FILE"
        sed -i 's/search-results\.php/search-results/g' "$FILE"
        echo "Plik $FILE zaktualizowany."
    else
        echo "Plik $FILE nie istnieje. Pomijanie."
    fi
done

echo ""
echo "=== Aktualizacja ścieżek URL w plikach HTML ==="
echo ""

# Aktualizacja plików HTML w widokach
VIEW_FILES=(
    "public/views/home.php"
    "public/views/login.php"
    "public/views/search.php"
    "public/views/search-results.php"
    "public/views/my-clips.php"
    "public/views/register.php"
    "public/views/forgot-password.php"
)

for FILE in "${VIEW_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        echo "Aktualizacja pliku $FILE..."
        sed -i 's/search\.php/search/g' "$FILE"
        sed -i 's/login\.php/login/g' "$FILE"
        sed -i 's/index\.php/\//g' "$FILE"
        sed -i 's/my-clips\.php/my-clips/g' "$FILE"
        sed -i 's/search-results\.php/search-results/g' "$FILE"
        echo "Plik $FILE zaktualizowany."
    else
        echo "Plik $FILE nie istnieje. Pomijanie."
    fi
done

echo ""
echo "=== Aktualizacja zakończona ==="
echo ""
echo "Zrestartuj serwer Caddy, aby zmiany weszły w życie."