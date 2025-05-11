/* uniwersalny klient – token dołączany w PHP proxy; frontend nic o nim nie wie */

export async function callApi(endpoint, args = []) {
    const res  = await fetch('/api/api-json.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ endpoint, args })
    });

    const txt = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${txt}`);

    return JSON.parse(txt);      //  { status, data, ... }
}

export async function callApiForBlob(endpoint, args = []) {
    // endpoint param tutaj jest ignorowany – zostawiamy dla czytelności
    const res = await fetch('/api/api-video.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ args })   // ⬅️ tylko args!
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    return res.blob();
}
