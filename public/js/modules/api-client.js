// Przywrócona wersja api-client.js z dodatkowym logowaniem
export async function callApi(endpoint, args = []) {
    console.log(`Wywołanie API ${endpoint} z argumentami:`, args);

    try {
        const res = await fetch('/api/api-json.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint, args })
        });

        const txt = await res.text();
        console.log(`Odpowiedź API (${endpoint}):`, txt.substring(0, 200));

        if (!res.ok) {
            console.error(`Błąd HTTP ${res.status} dla ${endpoint}:`, txt);
            throw new Error(`HTTP ${res.status}: ${txt}`);
        }

        try {
            return JSON.parse(txt);
        } catch (e) {
            console.warn(`Odpowiedź ${endpoint} nie jest JSON:`, txt.substring(0, 200));
            return { text: txt, isRawText: true };
        }
    } catch (error) {
        console.error(`Błąd podczas wywołania ${endpoint}:`, error);
        throw error;
    }
}

export async function callApiForBlob(endpoint, args = []) {
    console.log(`Wywołanie API dla blob ${endpoint} z argumentami:`, args);

    try {
        // WAŻNE: Przywracamy oryginalne zachowanie
        const res = await fetch('/api/api-video.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint, args })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Błąd HTTP ${res.status} dla ${endpoint}:`, errorText.substring(0, 200));
            throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const blob = await res.blob();
        console.log(`Pobrano blob dla ${endpoint}, rozmiar:`, blob.size);

        return blob;
    } catch (error) {
        console.error(`Błąd podczas wywołania ${endpoint} dla blob:`, error);
        throw error;
    }
}