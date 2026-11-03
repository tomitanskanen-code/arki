@AGENTS.md

# Arki – ohjeet Claude Codelle

Perheen yksityinen arjenhallinta-PWA. Käyttäjinä kaksi vanhempaa, mukana kahden
kouluikäisen lapsen tietoja. Käyttöliittymän kieli on **suomi**. Koodin
kommentit suomeksi, tunnisteet (muuttujat, funktiot) englanniksi.

## Komennot

- `npm run dev` – kehityspalvelin, http://localhost:3000
- `npm run check` – lint + `next typegen && tsc` + Vitest. Aja ennen committia.
- `npm run build` – tuotantobuild (tarkistaa myös Cache Components -säännöt)

## Arkkitehtuuri

Yksi Next.js-sovellus (App Router). Ei mikropalveluita, ei monorepoa.

Kerrokset (riippuvuudet vain alaspäin):

1. `src/app`, `src/features`, `src/components` – käyttöliittymä
2. `src/domain` – tietomalli (`types.ts`) ja puhdas liiketoimintalogiikka.
   Ei Reactia, ei I/O:ta. Kaikelle logiikalle yksikkötestit (`*.test.ts`).
3. `src/data` – tietokerros. `repositories.ts` määrittelee rajapinnat;
   `server.ts` (palvelin, `import "server-only"`) ja `client.ts` (selain)
   valitsevat toteutuksen (`data/mock/` tai `data/supabase/`).
4. `src/integrations` – ulkoiset rajapinnat (Open-Meteo; vaiheessa 3 ICS,
   Google). Vain palvelinpuolella.

Tietokannan muutokset aina uutena tiedostona `supabase/migrations/`
(aikaleima + kuvaava nimi). Älä muokkaa jo ajettua migraatiota.

Käyttöliittymä ei koskaan tuo `data/mock`-moduuleja suoraan, vaan aina
`data/server` tai `data/client`.

## Keskeiset periaatteet

- **Aika:** ajanhetket UTC-ISO-merkkijonoina, kalenteripäivät `LocalDate`
  ("YYYY-MM-DD") Europe/Helsinki-aikaa. Käytä aina `src/lib/dates.ts`-funktioita,
  älä `new Date().getDate()` tms. (palvelin on UTC:ssä). Testit ajetaan UTC:ssä.
- **Koko päivän tapahtumat:** `endDate` on ensimmäinen päivä, jota tapahtuma ei
  koske (iCal-käytäntö).
- **Cache Components on päällä:** pyynnön aikaan sidottu data (tänään, cookies,
  searchParams) haetaan `<Suspense>`-rajan sisällä; `await connection()` ennen
  `new Date()`-käyttöä palvelinkomponentissa.
- **Tyyli:** pohjoismainen, rauhallinen. Osiot ja ohuet viivat korttien sijaan.
  Värit vain tokeneista (`globals.css`), jäsenvärit `bg-member-*`.
  Kosketusalueet ≥ 44 px. Safe area: `pt-safe`, `pb-safe`.
- **Yksinkertaisuus:** toimiva ja ylläpidettävä ratkaisu ennen hienostelua.
  Ei tarpeettomia ominaisuuksia (esim. kauppalistaan ei tuoterekisteriä).

## Tietoturva ja yksityisyys

- Ei salaisuuksia Gitiin. Mallipohja `.env.example`; arvot `.env.local`-tiedostoon
  ja Verceliin. Älä koskaan pyydä käyttäjää liittämään salaisuuksia keskusteluun.
- iCal/ICS-tilauslinkit ovat salaisuuksia: haetaan vain palvelimella, salataan
  tietokannassa (AES-GCM, `FEED_ENCRYPTION_KEY`), ei koskaan selaimeen.
- Ulkoisten URL-osoitteiden haku: vain https, sallittujen palvelinten lista,
  yksityisten IP-osoitteiden esto (SSRF), aikakatkaisu ja kokoraja.
- Service worker tallentaa välimuistiin vain staattisen rungon – ei HTML:ää,
  API-vastauksia eikä kalenteritietoja.
- Supabase: kaikissa tauluissa RLS, käytäntö "vain oman perheen rivit".
  Itserekisteröinti pois päältä, käyttäjät kutsutaan.

## Riippumattomuus työnantajan ympäristöstä

Kehitetään työnantajan koneella, mutta sovellus on täysin henkilökohtainen:
GitHub-tili `tomitanskanen-code` (yksityinen repo), henkilökohtaiset Vercel-,
Supabase- ja Google Cloud -projektit. Ei organisaation tunnuksia, Azurea, Entra
ID:tä tai VPN-riippuvuuksia. Sovelluksella ei ole Claude API -riippuvuutta.
Git-identiteetti on asetettu vain tähän repoon. Projekti ei ole OneDrivessa.

## Riippuvuudet

Uudet npm-paketit vain tunnetuista, ylläpidetyistä lähteistä. Kerro käyttäjälle
mitä ja miksi, ja aja `npm audit` asennuksen jälkeen. Järjestelmätason
ohjelmia ei asenneta ilman käyttäjän erillistä hyväksyntää.

## Päätösloki

- 2026-11 (päivitetty vaiheessa 2): Kirjautuminen sähköpostilla ja
  salasanalla. Tunnukset luodaan ylläpitäjänä Supabasessa (Auto Confirm),
  ei rekisteröitymistä eikä sähköpostien lähetystä. Alkuperäinen
  sähköpostikoodi (OTP) hylättiin: Supabasen ilmaistason pohjat ovat
  lukittuja ilman omaa SMTP:tä, ja linkit eivät toimi iOS:n
  kotinäyttösovelluksessa (Safari ei jaa evästeitä).
- 2026-11: Google-kalenteri ensin "salaisena iCal-osoitteena" (sama ICS-lukija
  kuin Wilma ja myClub); OAuth vasta, jos tarvitaan kirjoitusta.
- 2026-11: Kalenterisyötteet päivitetään tarvittaessa (TTL ~15 min), ei
  ajastettuna – Vercel Hobbyn cron on rajoitettu.
- 2026-11: Kauppalista vaiheessa 1 localStoragessa; vaiheessa 2 Supabase +
  Realtime samaan `ShoppingListRepository`-rajapintaan.
- 2026-11: Kotipaikkakunta vaiheessa 1 evästeessä; vaiheessa 2 families-tauluun.
- 2026-11: Kehityspalvelimen ESLint/shadcn-CLI:n epäsuorat `minimatch`- ja
  `deepmerge`-löydökset hyväksytty (vain kehitystyökaluissa, ei tuotannossa;
  `npm audit --omit=dev` = 0). Tarkistetaan uudelleen päivitysten yhteydessä.
- 2026-11: Tumma tila siirretty vaiheeseen 4; tokenit valmiina.
- 2026-11 (vaihe 2): Ilman Supabase-ympäristömuuttujia sovellus toimii
  esittelytilassa (mock-data, ei kirjautumista). Valinta `src/data/server.ts`
  ja `src/data/client.ts` – `isSupabaseConfigured`.
- 2026-11 (vaihe 2): Vain publishable key (selain + palvelin käyttäjän
  istunnolla). Secret keytä ei käytetä; kaikki kyselyt kulkevat RLS:n läpi.
  Perheen ja jäsenten luonti ylläpitäjänä SQL-editorissa.
- 2026-11 (vaihe 2): Istunto päivitetään vain `src/proxy.ts`:ssä
  (`getClaims`), ei palvelinkomponenteissa (refresh-tokenin uudelleenkäyttö).
- 2026-11 (vaihe 2): Kalenteri on yhä mock-dataa; `data/mock/remap.ts` liittää
  esimerkkitapahtumat oikeisiin jäseniin roolin/järjestyksen mukaan. Poistetaan
  vaiheessa 3.
- 2026-11 (vaihe 2): iOS-kotinäyttösovellus vaatii `apple-mobile-web-app-capable`
  -merkinnän (`metadata.other` layoutissa); Next.js tuottaa vain
  etuliitteettömän. Uusissa iOS-versioissa myös "Avaa verkkoappina" -kytkin
  päälle kuvaketta lisättäessä.
- 2026-11 (vaihe 2): Kauppalistan Realtime: muutosilmoitus → lista luetaan
  uudelleen (yksinkertainen ja luotettava). Lisäksi luku, kun sovellus palaa
  taustalta (iOS katkaisee websocketin).
