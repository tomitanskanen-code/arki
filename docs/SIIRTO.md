# Projektin siirto toiselle koneelle

Arki on rakennettu niin, että kaikki sen toimintaan tarvittava on omissa
henkilökohtaisissa palveluissasi. Työnantajan kone, tunnukset, verkko tai VPN
eivät ole tarpeen sovelluksen kehittämiseen, julkaisuun tai käyttöön.

## Mitä missäkin on

| Asia                      | Sijainti                                       |
| ------------------------- | ---------------------------------------------- |
| Lähdekoodi ja historia    | GitHub: `tomitanskanen-code/arki` (yksityinen) |
| Tietokannan rakenne       | `supabase/migrations/` repossa (vaihe 2)       |
| Tietokannan data          | Henkilökohtainen Supabase-projekti (vaihe 2)   |
| Julkaisu ja salaisuudet   | Henkilökohtainen Vercel-projekti (vaihe 2)     |
| Ympäristömuuttujien malli | `.env.example` repossa                         |
| Kehitysohjeet             | `README.md`, `CLAUDE.md`                       |

## Uudelle koneelle

1. Asenna Node.js LTS ja Git (esim. <https://nodejs.org>, <https://git-scm.com>).
2. Kloonaa repo henkilökohtaisella GitHub-tunnuksella:
   ```bash
   git clone https://github.com/tomitanskanen-code/arki.git
   cd arki
   ```
3. Aseta Git-identiteetti tähän repoon:
   ```bash
   git config user.name "Tomi Tanskanen"
   git config user.email "351939737+tomitanskanen-code@users.noreply.github.com"
   ```
4. Asenna riippuvuudet ja käynnistä:
   ```bash
   npm install
   npm run dev
   ```
5. (Vaiheesta 2 alkaen) Kopioi `.env.example` → `.env.local` ja täytä arvot
   Supabasen ja Vercelin hallintapaneeleista. Vercel CLI:llä:
   `npx vercel link` ja `npx vercel env pull .env.local`.

## Claude Code henkilökohtaisella tilillä

1. Asenna Claude Code ja kirjaudu omalla Claude-tilillä.
2. Avaa projektikansio. `CLAUDE.md` ja `AGENTS.md` ladataan automaattisesti,
   joten arkkitehtuuri ja periaatteet ovat heti käytössä.
3. Paikalliset Claude Code -asetukset (`.claude/settings.local.json`,
   `.claude/launch.json`) eivät ole Gitissä; luo ne tarvittaessa uudelleen.

## Työnantajan koneelta luopuminen

- Varmista, että kaikki on pushattu: `git status` ja `git log origin/main..`
  eivät näytä mitään.
- Poista paikallinen kopio ja kirjaudu ulos henkilökohtaisista palveluista
  (GitHub, Vercel, Supabase) työnantajan koneella.
- Git Credential Managerin tallentamat tunnukset: Windowsin
  Tunnistetietojen hallinta → poista `git:https://github.com`.
