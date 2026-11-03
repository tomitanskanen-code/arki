# Arki

Perheen yksityinen, mobiililähtöinen arjenhallintasovellus (PWA). Kokoaa yhteen
päivän menot, lasten koulupäivät ja harrastukset, sään, kouluruokalistan ja
yhteisen kauppalistan.

> **Tila: vaihe 1.** Käyttöliittymä toimii esimerkkidatalla. Kirjautumista,
> tietokantaa ja oikeita kalenteri-integraatioita ei vielä ole.

## Käynnistys

Vaatimukset: Node.js 20.9 tai uudempi (kehityksessä 24 LTS) ja Git.

```bash
npm install
npm run dev
```

Avaa selaimessa <http://localhost:3000>. Mobiilinäkymän saat selaimen
kehitystyökaluista (esim. Chrome: F12 → laitetila → iPhone).

### Puhelimella samassa lähiverkossa

```bash
npm run dev -- --hostname 0.0.0.0
```

Avaa puhelimessa `http://<tietokoneen-ip>:3000`. Kotinäytölle lisääminen ja
service worker vaativat HTTPS:n, joten ne testataan vasta Vercel-julkaisusta
(vaihe 2).

## Komennot

| Komento          | Tarkoitus                               |
| ---------------- | --------------------------------------- |
| `npm run dev`    | Kehityspalvelin (http://localhost:3000) |
| `npm run build`  | Tuotantobuild                           |
| `npm start`      | Tuotantobuildin ajo paikallisesti       |
| `npm run check`  | Lint + tyyppitarkistus + testit         |
| `npm test`       | Yksikkötestit (Vitest)                  |
| `npm run format` | Koodin muotoilu (Prettier)              |

## Teknologiat

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 ·
shadcn/ui (Base UI) · date-fns · Vitest. Tulossa: Supabase (PostgreSQL, Auth,
Realtime) ja Vercel.

## Rakenne

```
src/
  app/            Reitit: / (Tänään), /kalenteri, /kauppalista, /asetukset,
                  manifest, ikonit, virhesivut
  components/     Yleiset UI-osat (layout/, ui/ = shadcn)
  features/       Näkymäkohtaiset komponentit (today, calendar, shopping, …)
  domain/         Tietomalli ja liiketoimintalogiikka (puhdas TS, testattu)
  data/           Tietokerros: rajapinnat, server.ts / client.ts, mock/
  lib/            Apufunktiot (aika ja Helsinki-aikavyöhyke)
public/sw.js      Service worker (vain staattinen sovellusrunko)
docs/             Siirto-ohje ja muu dokumentaatio
```

Tarkempi arkkitehtuuri ja periaatteet: [CLAUDE.md](CLAUDE.md).
Siirto toiselle koneelle: [docs/SIIRTO.md](docs/SIIRTO.md).

## Toteutusvaiheet

1. **Käyttöliittymä ja perusta** – valmis (esimerkkidata)
2. Supabase-tietokanta, kirjautuminen, reaaliaikainen kauppalista,
   Open-Meteo-sää, Vercel-julkaisu
3. Kalenteri-integraatiot: Google (iCal / OAuth), Wilma iCal, myClub iCal
4. Kouluruokalistan integraatio, viimeistely, testaus iOS-laitteilla

## Ympäristömuuttujat

Vaihe 1 ei tarvitse ympäristömuuttujia. Malli: [.env.example](.env.example).
Salaisuudet kuuluvat vain tiedostoon `.env.local` (ei Gitiin) ja Vercelin
asetuksiin.
