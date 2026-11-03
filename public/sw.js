/*
 * Arki – service worker
 *
 * Tietoturvaperiaate: välimuistiin tallennetaan VAIN sovelluksen staattinen
 * runko (JavaScript, CSS, fontit ja ikonit). Sivuja, API-vastauksia tai
 * kalenteritietoja ei koskaan tallenneta välimuistiin. Ilman verkkoyhteyttä
 * näytetään yksinkertainen ilmoitussivu.
 */
const CACHE = "arki-shell-v1"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/pwa-icon/") ||
    url.pathname.startsWith("/apple-icon") ||
    url.pathname.startsWith("/icon")
  )
}

const OFFLINE_HTML = `<!doctype html>
<html lang="fi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Ei yhteyttä · Arki</title>
<style>
  body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;
  background:#f7f4ee;color:#1e2320;font:17px/1.5 system-ui,-apple-system,sans-serif;text-align:center;padding:24px}
  h1{font-weight:300;font-size:28px;margin:0 0 8px} p{color:#66625a;margin:0 0 24px}
  button{font:inherit;font-size:15px;border:0;border-radius:12px;padding:12px 20px;background:#2f3b35;color:#f7f4ee}
</style></head>
<body><main><h1>Ei verkkoyhteyttä</h1><p>Arki tarvitsee yhteyden näyttääkseen ajantasaiset tiedot.</p>
<button onclick="location.reload()">Yritä uudelleen</button></main></body></html>`

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (isStaticAsset(url)) {
    // Staattiset tiedostot: välimuisti ensin (tiedostonimissä on versiotunniste).
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      }),
    )
    return
  }

  if (request.mode === "navigate") {
    // Sivut: aina verkosta. Virhetilanteessa näytetään offline-ilmoitus.
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(OFFLINE_HTML, {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }),
      ),
    )
  }
})
