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

Arki käyttää kirjautumiseen sähköpostia ja salasanaa. Rekisteröitymistä ei
ole, eikä sovellus lähetä sähköposteja, joten erillistä SMTP-palvelua tai
sähköpostipohjia ei tarvita.

1. **Authentication → Sign In / Providers**
   - **Allow new users to sign up: pois päältä.** Tunnuksia voi luoda vain
     ylläpitäjä hallintapaneelista.
   - Email-provider päällä.
   - Salasanan vähimmäispituudeksi vähintään 12 merkkiä, jos asetus on
     tarjolla.

## 4. Käyttäjät ja perhe

1. **Authentication → Users → Add user → Create new user** kummallekin
   vanhemmalle:
   - Email: vanhemman sähköposti
   - Password: vahva salasana (esim. salasanojen hallinnan luoma). Tallenna
     se salasanojen hallintaan ja välitä puolisolle turvallisesti – ei
     tähän keskusteluun eikä repoon.
   - **Auto Confirm User: päällä** (muuten tunnus jää vahvistamattomaksi).
   - Jos olet aiemmin kutsunut itsesi "Send invitation" -toiminnolla, poista
     se vahvistamaton tunnus ensin ja luo tilalle uusi yllä olevalla tavalla.
2. **SQL Editor**: kopioi `supabase/seed-family.example.sql`, korvaa
   `<...>`-kohdat (perheen nimi, jäsenten nimet, vanhempien sähköpostit) ja
   aja. Täytettyä versiota **ei tallenneta repoon**.
   - Jos perhe on jo luotu aiemmin mutta tunnus luotiin uudelleen, liitä
     uusi tunnus perheenjäseneen:
     ```sql
     update public.family_members
     set user_id = (select id from auth.users where email = '<osoite>')
     where display_name = '<nimi>';
     ```
   - Salasanan voi vaihtaa myöhemmin: Authentication → Users → käyttäjä →
     "Send password recovery" vaatii sähköpostin, joten helpompaa on poistaa
     ja luoda tunnus uudelleen ja ajaa yllä oleva liitoskysely.

## 5. Paikallinen testaus

1. Supabase → **Project Settings → API Keys**: kopioi
   - Project URL (Project Settings → Data API), muotoa
     `https://<tunnus>.supabase.co`
   - **Publishable key** (`sb_publishable_…`)
2. Projektikansiossa: kopioi `.env.example` → `.env.local` ja täytä
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   Ilman lainausmerkkejä ja kulmasulkeita. Publishable key on tarkoitettu
   selaimeen; suojaus perustuu RLS:ään. **Secret keytä ei tarvita** eikä
   sitä laiteta mihinkään.
3. Käynnistä `npm run dev` uudelleen → <http://localhost:3000> ohjaa
   kirjautumiseen → sähköposti ja salasana.
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
5. Jokainen push `main`-haaraan julkaisee uuden version automaattisesti.

## 7. iPhonen kotinäytölle

1. Avaa Vercel-osoite **Safarissa** ja kirjaudu.
2. Jaa-painike → **Lisää Koti-valikkoon** → Lisää.
3. Käynnistä Arki kotinäytön kuvakkeesta. Kotinäytön sovellus ja Safari
   eivät jaa kirjautumista, joten kirjaudu sovelluksessa vielä kerran.
   iPhone tarjoaa tallentamaan salasanan avainnippuun.

## 8. Kalenterit (vaihe 3)

Tee kohdat **tässä järjestyksessä**: tietokanta ja avain ensin, sitten
julkaisu, lopuksi syötteet.

1. **Migraatio:** Supabase → SQL Editor → aja
   `supabase/migrations/20261104120000_kalenterit.sql`.
2. **Salausavain:** aja projektikansiossa
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   ja lisää tulos
   - `.env.local`-tiedostoon riville `FEED_ENCRYPTION_KEY=…`
   - Verceliin: Settings → Environment Variables → `FEED_ENCRYPTION_KEY`
     (Production ja Preview).
     Tallenna avain myös salasanojen hallintaan. **Älä liitä sitä
     keskusteluun.** Jos avain katoaa, syötteet pitää lisätä uudelleen.
3. **Julkaisu:** kun 1–2 on tehty, uusi versio voidaan pushata (Vercel
   julkaisee automaattisesti). Uudelleenjulkaisu tarvitaan joka tapauksessa,
   jotta Vercel ottaa uuden ympäristömuuttujan käyttöön.
4. **Syötteet:** Arki → Asetukset → Kalenterit → **Lisää kalenterisyöte**:
   - **Wilma:** Wilma → Työjärjestys → kalenterin vienti / tilauslinkki.
   - **myClub:** ryhmän kalenteri → "Tilaa tapahtumat kalenteriisi".
   - **Google:** Google Kalenteri → Asetukset → kalenteri → Integroi
     kalenteri → **Salainen osoite iCal-muodossa**.
     Valitse kenelle kalenteri kuuluu. Osoite salataan eikä sitä näytetä
     uudelleen. Liitä osoitteet **vain sovellukseen**, ei keskusteluun.
5. **Viikkorytmi:** Asetukset → Viikkorytmi (esim. esikoulu: päivät ja
   kellonajat).

Syötteet päivittyvät automaattisesti, kun sovellus avataan ja edellisestä
hausta on yli 15 minuuttia. Asetuksissa näkyy jokaisen syötteen tila; ↻
päivittää heti.

## Varmuuskopiot

Supabasen ilmaistasossa ei ole ladattavia varmuuskopioita. Rakenne on
tallessa migraatioina. Datan voi tarvittaessa viedä: Table Editor → taulu →
Export to CSV. Ilmaisprojekti keskeytyy viikon käyttämättömyyden jälkeen;
päivittäisessä käytössä tätä ei tapahdu.
