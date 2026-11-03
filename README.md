# Arki

Perheen yksityinen, mobiililähtöinen arjenhallintasovellus (PWA). Kokoaa yhteen
päivän menot, lasten koulupäivät ja harrastukset, sään, kouluruokalistan ja
yhteisen kauppalistan.

> **Tila: vaihe 2.** Kirjautuminen sähköpostikoodilla, perhe ja reaaliaikainen
> kauppalista Supabasessa, sää Open-Meteosta. Kalenterit ja ruokalista ovat
> vielä esimerkkidataa. Ilman Supabase-asetuksia sovellus käynnistyy
> esittelytilaan. Käyttöönotto: [docs/KAYTTOONOTTO.md](docs/KAYTTOONOTTO.md).

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
shadcn/ui (Base UI) · date-fns · Vitest · Supabase (PostgreSQL, Auth,
Realtime) · Open-Meteo · Vercel.

## Rakenne

```
src/
  app/            Reitit: / (Tänään), /kalenteri, /kauppalista, /asetukset,
                  manifest, ikonit, virhesivut
  components/     Yleiset UI-osat (layout/, ui/ = shadcn)
  features/       Näkymäkohtaiset komponentit (today, calendar, shopping, …)
  domain/         Tietomalli ja liiketoimintalogiikka (puhdas TS, testattu)
  data/           Tietokerros: rajapinnat, server.ts / client.ts, mock/, supabase/
  integrations/   Ulkoiset palvelut (open-meteo/), vain palvelimella
  lib/            Apufunktiot (aika, Supabase-asiakkaat)
  proxy.ts        Istunnon päivitys ja ohjaus kirjautumiseen
public/sw.js      Service worker (vain staattinen sovellusrunko)
supabase/         Tietokantamigraatiot ja perheen luontipohja
docs/             Siirto-ohje ja muu dokumentaatio
```

Tarkempi arkkitehtuuri ja periaatteet: [CLAUDE.md](CLAUDE.md).
Siirto toiselle koneelle: [docs/SIIRTO.md](docs/SIIRTO.md).

## Toteutusvaiheet

1. **Käyttöliittymä ja perusta** – valmis
2. **Supabase-tietokanta, kirjautuminen, reaaliaikainen kauppalista,
   Open-Meteo-sää, Vercel-julkaisu** – koodi valmis, käyttöönotto kesken
3. Kalenteri-integraatiot: Google (iCal / OAuth), Wilma iCal, myClub iCal
4. Kouluruokalistan integraatio, viimeistely, testaus iOS-laitteilla

## Ympäristömuuttujat

Malli: [.env.example](.env.example). Ilman arvoja sovellus toimii
esittelytilassa.
Salaisuudet kuuluvat vain tiedostoon `.env.local` (ei Gitiin) ja Vercelin
asetuksiin.
