# Käyttöönotto: Supabase ja Vercel (vaihe 2)

Kaikki palvelut perustetaan **henkilökohtaisilla tunnuksilla** (GitHub-tili
`tomitanskanen-code`). Älä käytä työnantajan tunnuksia, äläkä liitä avaimia
tai salasanoja keskusteluun Clauden kanssa: ne kirjoitetaan vain
`.env.local`-tiedostoon ja palveluiden omiin asetuksiin.

Ilman näitä asetuksia sovellus toimii **esittelytilassa** (esimerkkidata, ei
kirjautumista), joten kehitystä voi jatkaa missä vaiheessa tahansa.

---

## 1. Supabase-projekti

1. Avaa <https://supabase.com> → **Sign in with GitHub** → valitse
   henkilökohtainen tili `tomitanskanen-code`.
2. Luo organisaatio (Free) ja projekti:
   - Name: `arki`
   - Region: **Europe** (esim. Frankfurt tai Stockholm)
   - Database password: anna Supabasen luoda, tallenna salasanojen hallintaan.

## 2. Tietokannan rakenne

1. Supabase → **SQL Editor** → **New query**.
2. Kopioi sinne koko tiedosto
   `supabase/migrations/20261103120000_perusrakenne.sql` ja paina **Run**.
3. Tarkista: **Table Editor** näyttää taulut `families`, `family_members`,
   `user_preferences` ja `shopping_list_items`, ja jokaisessa lukee
   "RLS enabled".

> Jatkossa jokainen tietokantamuutos tulee uutena tiedostona
> `supabase/migrations/`-kansioon, ja ne ajetaan järjestyksessä.

## 3. Kirjautumisen asetukset

1. **Authentication → Sign In / Providers**
   - **Allow new users to sign up: pois päältä** (vain kutsutut käyttäjät).
   - Email-provider päällä. Email OTP length: 6.
2. **Authentication → Emails → Templates → Magic Link**: vaihda sisältö
   näyttämään koodi linkin sijaan, esim.:

   ```html
   <h2>Arki – kirjautumiskoodi</h2>
   <p>Kirjautumiskoodisi on:</p>
   <p style="font-size:28px;letter-spacing:4px">
     <strong>{{ .Token }}</strong>
   </p>
   <p>
     Koodi on voimassa rajoitetun ajan. Jos et yrittänyt kirjautua, voit ohittaa
     viestin.
   </p>
   ```

   Aihe esim. `Arki – kirjautumiskoodi`.

3. **Sähköpostin lähetys.** Supabasen oma sähköpostipalvelu on tarkoitettu
   vain kokeiluun: se lähettää viestejä ainoastaan Supabase-organisaatiosi
   tiimin jäsenille ja vain muutaman tunnissa. Oma osoitteesi toimii siis
   heti. **Toista vanhempaa varten** tarvitaan oma SMTP-palvelu
   (Authentication → Emails → SMTP Settings). Valitaan ja otetaan käyttöön
   erikseen ennen kuin puoliso alkaa käyttää sovellusta.

## 4. Käyttäjät ja perhe

1. **Authentication → Users → Add user → Send invitation**: kutsu oma
   osoitteesi (ja myöhemmin puolisosi). Kutsulinkkiä ei tarvitse avata:
   kirjautuminen tehdään sovelluksessa koodilla.
2. **SQL Editor**: kopioi `supabase/seed-family.example.sql`, korvaa
   `<...>`-kohdat (perheen nimi, jäsenten nimet, vanhempien sähköpostit) ja
   aja. Täytettyä versiota **ei tallenneta repoon**.
   - Jos toista vanhempaa ei ole vielä kutsuttu, hänen `user_id`:nsä jää
     tyhjäksi. Liitä myöhemmin:
     ```sql
     update public.family_members
     set user_id = (select id from auth.users where email = '<osoite>')
     where display_name = '<nimi>';
     ```

## 5. Paikallinen testaus

1. Supabase → **Project Settings → API Keys**: kopioi
   - Project URL
   - **Publishable key** (`sb_publishable_…`)
2. Projektikansiossa: kopioi `.env.example` → `.env.local` ja täytä
   ```
   NEXT_PUBLIC_SUPABASE_URL=…
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…
   ```
   Publishable key on tarkoitettu selaimeen; suojaus perustuu RLS:ään.
   **Secret keytä ei tarvita** eikä sitä laiteta mihinkään.
3. Käynnistä `npm run dev` uudelleen → <http://localhost:3000> ohjaa
   kirjautumiseen → sähköposti → koodi.
4. Kokeile kauppalistaa kahdessa selainikkunassa: muutos näkyy toisessa
   ilman päivitystä.

## 6. Julkaisu Verceliin

1. <https://vercel.com> → **Continue with GitHub** → tili
   `tomitanskanen-code` → **Hobby**-tili.
2. **Add New → Project → Import** `arki`. Anna GitHub-sovellukselle pääsy
   vain tähän repoon ("Only select repositories").
3. Ennen julkaisua: **Environment Variables** – lisää samat kaksi
   muuttujaa kuin `.env.local`-tiedostossa (Production ja Preview).
4. **Deploy**. Saat osoitteen muotoa `https://arki-….vercel.app`.
5. Supabase → **Authentication → URL Configuration → Site URL**: aseta
   Vercel-osoite.
6. Jokainen push `main`-haaraan julkaisee uuden version automaattisesti.

## 7. iPhonen kotinäytölle

1. Avaa Vercel-osoite **Safarissa** ja kirjaudu.
2. Jaa-painike → **Lisää Koti-valikkoon** → Lisää.
3. Käynnistä Arki kotinäytön kuvakkeesta. Kotinäytön sovellus ja Safari
   eivät jaa kirjautumista, joten kirjaudu sovelluksessa vielä kerran
   koodilla.

## Varmuuskopiot

Supabasen ilmaistasossa ei ole ladattavia varmuuskopioita. Rakenne on
tallessa migraatioina. Datan voi tarvittaessa viedä: Table Editor → taulu →
Export to CSV. Ilmaisprojekti keskeytyy viikon käyttämättömyyden jälkeen;
päivittäisessä käytössä tätä ei tapahdu.
