# Quickstart: ajo ja validointi

## Esivaatimukset

- Node.js (testit ja työkalut), PowerShell
- Android-paketointiin: JDK 21 ja Android SDK (kuten Horse Racerissa)

## Aja peli selaimessa

```bash
powershell -File tools/serve.ps1
```

Avaa `http://localhost:8080/`. Pelin voi avata myös suoraan `index.html`-tiedostosta, mutta service worker ja PWA vaativat HTTP:n.

## Aja testit

```bash
node tests/run-node.mjs
```

Tai selaimessa: `http://localhost:8080/tests/`. Testit kattavat moottorin, vaikutukset, boosterin koostumuksen, pakan validoinnin, runin tilakoneen, tekoälyn laillisuuden, tallennuksen ja korttidatan ([contracts/card-schema.md](./contracts/card-schema.md)).

```bash
node tools/validate-cards.mjs
```

```bash
node tests/balance.sim.js --runs 1000
```

## Validointiskenaariot

| # | Skenaario | Odotettu tulos | Speksi |
|---|-----------|----------------|--------|
| 1 | Uusi run → avaa booster | 10 korttia: 6/3/1, vähintään 5 olentoa, vähintään 2 elementtiä, vähintään 4 korttia hinnalla ≤ 3 | FR-003/004 |
| 2 | Pakanrakennus 19 tai 31 kortilla | "Pelaa" ei ole käytössä, ja syy näkyy | FR-007 |
| 3 | "Rakenna puolestani" → Pelaa | Kelvollinen pakka, ottelu alkaa | FR-010 |
| 4 | Pelaa ottelu loppuun | Voittaja näytetään; kesto 5–10 min | US1, SC-002 |
| 5 | Voita ottelu | Uusi booster, pakkaa voi muokata, seuraava vastustaja on vaikeampi | US2 |
| 6 | Häviä tai luovuta | Run päättyy, yhteenveto ja ennätys päivittyvät | US2, FR-017 |
| 7 | Sulje sovellus kesken ottelun ja avaa uudelleen | "Jatka run" palauttaa täsmälleen saman tilan | US4, SC-007 |
| 8 | Ensimmäinen käynnistys | Opetusta tarjotaan, ja sen voi ohittaa | US3, FR-019 |
| 9 | Lentokonetila päällä | Kaikki toimii | FR-026 |
| 10 | Puhelimen kieli fi / en / de | Suomi / englanti / englanti | FR-027 |
| 11 | Balanssisimulaatio | Vastustaja 1 voitetaan yli 75 %:ssa, koko run läpäistään 5–15 %:ssa | SC-006 |

## Android-paketointi

```bash
cd mobile && npm install && npm run apk
```

Debug-APK: `mobile/android/app/build/outputs/apk/debug/`. Julkaisu-AAB: `npm run bundle` (allekirjoitus kuten Horse Racerissa, `mobile/README.md`).
