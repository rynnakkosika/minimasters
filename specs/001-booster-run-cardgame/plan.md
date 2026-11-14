# Implementation Plan: Booster-run-korttipeli (työnimi "Minimasters")

**Branch**: `001-booster-run-cardgame` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-booster-run-cardgame/spec.md`

## Summary

Yksinpelattava, offline-tilassa toimiva keräilykorttipeli, jossa pelaaja etenee runissa: avaa 10 kortin boosterin, kokoaa 20–30 kortin minipakan ja kohtaa seitsemän yhä vaikeampaa tekoälyvastustajaa. Häviö päättää runin.

Tekninen lähestymistapa on sama kuin pinon aiemmissa peleissä (Horse Racer / Travbana):

- **Peli:** pelkkää HTML:ää, CSS:ää ja JavaScriptin ES-moduuleja ilman build-vaihetta. Peli toimii selaimessa ja asennettavana verkkosovelluksena (PWA).
- **Android:** sama koodi paketoidaan Capacitorilla Google Playhin.
- **Moottori:** pelisäännöt on erotettu puhtaaksi, deterministiseksi tilakoneeksi (`src/engine`), joka ei tiedä käyttöliittymästä mitään. Kaikki satunnaisuus tulee siemennetystä satunnaislukugeneraattorista.
- **Tekoäly ja käyttöliittymä:** tekoäly (`src/ai`) ja käyttöliittymä (`src/ui`) puhuvat moottorille samalla toimintosopimuksella.
- **Kortit:** korttisarja on dataa (JSON) eikä koodia. Korttien vaikutukset kootaan pienestä joukosta valmiita vaikutusprimitiivejä.

## Technical Context

**Language/Version**: JavaScript (ES2022, natiivit ES-moduulit), HTML5, CSS3; ei TypeScriptiä eikä bundleria (JSDoc-tyypit editorin avuksi)

**Primary Dependencies**: Ei ajonaikaisia kirjastoja itse pelissä. Android-kääre: Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/app`), kehitystyökaluina `@capacitor/assets`, `sharp` ja `puppeteer-core` (kuvakkeiden ja kauppakuvien renderöintiin)

**Storage**: `localStorage` (versioitu JSON: profiili, asetukset, keskeneräinen run ja ottelun tila). Tallennus tehdään jokaisen valmiin toiminnon jälkeen.

**Testing**: Selaimessa ajettava oma testiajuri (`tests/index.html` + `tests/runner.js`) kuten Horse Racerissa. Lisäksi samat testit voi ajaa Nodella (`node tests/run-node.mjs`), koska moottori ja tekoäly eivät käytä DOMia. Tasapainosimulaatio pelaa 1000 tekoäly vastaan tekoäly -ottelua.

**Target Platform**: Android 8+ (API 26+) Google Playn kautta, pystysuunta. Lisäksi nykyiset mobiili- ja työpöytäselaimet PWA:na.

**Project Type**: Mobiilipeli (selainpohjainen peli + Android-kääre)

**Performance Goals**: 60 fps animaatioissa keskitason puhelimella. Tekoälyn siirtopäätös alle 300 ms (näkyvä viive enintään 2 s, SC-008). Kylmäkäynnistys päävalikkoon alle 3 s.

**Constraints**: Toimii täysin offline (FR-026). APK/AAB alle 40 Mt. Ei verkkopyyntöjä, ei analytiikkaa, ei henkilötietoja. Kosketuskohteet vähintään 44×44 px, ja pelin on toimittava 360 px leveällä näytöllä. Kaikki sisältö on alkuperäistä (FR-025).

**Scale/Scope**: Noin 10 näkymää, 120+ korttia, 7 vastustajaa ja enintään 8 avainsanaa. Kielinä suomi ja englanti.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Projektin `.specify/memory/constitution.md` on vielä täyttämätön pohja, joten projektikohtaisia portteja ei ole. Suunnitelma noudattaa seuraavia käyttäjän yleisiä ja speksistä johdettuja periaatteita. Kaikki ovat **PASS**:

| Periaate | Tila | Huomio |
|----------|------|--------|
| Alkuperäisyys (FR-025): ei olemassa olevan pelin nimiä, kortteja, taidetta tai sääntötekstejä | PASS | Korttidatan tarkistusskripti ja sisältökatselmus (research R7) |
| Offline ja yksityisyys: ei verkkoa, ei tiliä, ei henkilötietoja | PASS | Ei verkkokoodia. Tietosuojaseloste kertoo, ettei tietoja kerätä. |
| Testattavuus: säännöt testataan ilman käyttöliittymää | PASS | Moottori on puhdas ja deterministinen (siemen + toimintoloki) |
| Yksinkertaisuus: ei build-vaihetta eikä ylimääräisiä kirjastoja | PASS | Sama pino kuin Horse Racerissa |
| Commitoi itse jokaisen valmiin työvaiheen jälkeen (CLAUDE.md) | PASS | Huomioidaan tehtävälistassa |

*Uudelleenarviointi Phase 1:n jälkeen*: Data-malli ja sopimukset eivät tuo verkkoyhteyksiä, tilejä eivätkä uusia riippuvuuksia, joten kaikki portit ovat edelleen PASS.

## Project Structure

### Documentation (this feature)

```text
specs/001-booster-run-cardgame/
├── plan.md              # Tämä tiedosto
├── research.md          # Phase 0: tekniset päätökset
├── data-model.md        # Phase 1: entiteetit, tilat ja validointi
├── quickstart.md        # Phase 1: ajo- ja validointiohje
├── contracts/
│   ├── card-schema.md       # Korttidatan JSON-muoto ja vaikutusprimitiivit
│   ├── engine-actions.md    # Moottorin toiminto- ja tapahtumasopimus (UI ↔ moottori ↔ AI)
│   ├── save-format.md       # Tallennusmuoto ja versiointi
│   └── ui-screens.md        # Näkymät ja siirtymät
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
index.html               # Sovelluksen kuori: lataa src/main.js
manifest.webmanifest     # PWA
sw.js                    # Service worker: offline-välimuisti
styles.css
privacy.html

data/
├── cards/
│   ├── set-core.json        # Korttisarja (120+ korttia)
│   └── keywords.json        # Enintään 8 avainsanaa ja niiden selitykset
├── opponents.json           # 7 vastustajaa: tyyli, vaikeus, pakkaresepti
└── i18n/
    ├── fi.json
    └── en.json

assets/
├── art/                     # Korttien kuvitus (WebP)
├── ui/                      # Kehykset, elementtisymbolit, ikonit
└── audio/

src/
├── main.js                  # Käynnistys, reititys näkymien välillä
├── engine/                  # Puhdas sääntömoottori, ei DOMia
│   ├── rng.js               # Siemennetty satunnaislukugeneraattori (mulberry32)
│   ├── state.js             # Ottelun tilan luonti ja kloonaus
│   ├── actions.js           # Toimintojen validointi ja soveltaminen
│   ├── effects.js           # Vaikutusprimitiivit
│   ├── combat.js            # Hyökkäys ja puolustus
│   ├── turn.js              # Vuoron vaiheet ja vuororaja
│   └── rules.js             # Voittoehdot, mulligan
├── run/                     # Runin logiikka, ei DOMia
│   ├── booster.js           # Boosterin arvonta koostumussäännöillä (FR-003/004)
│   ├── deckbuilder.js       # Pakan validointi + "Rakenna puolestani"
│   ├── ladder.js            # Vastustajien järjestys ja vaikeuskäyrä
│   └── run.js               # Runin tilakone
├── ai/
│   ├── evaluate.js          # Tilan arviointifunktio
│   ├── policy.js            # Siirtojen haku (ahne + matala lookahead)
│   └── styles.js            # Vastustajien pelityylipainot
├── data/
│   ├── cards.js             # Korttidatan lataus ja validointi
│   └── i18n.js
├── storage/
│   └── save.js              # Versioitu tallennus ja migraatiot
└── ui/
    ├── screens/             # menu, booster, deckbuild, match, result, run-summary,
    │                        # collection, records, tutorial, settings, rules
    ├── components/          # card, hand, board, life, tooltip, energy-curve
    ├── tutorial/            # Opetusottelun skripti
    └── anim.js              # Animaatiojono (ohitettava, FR-018)

tests/
├── index.html               # Selaimessa ajettava testiajuri
├── runner.js
├── run-node.mjs             # Samat testit Nodella
├── engine.test.js
├── effects.test.js
├── booster.test.js
├── deckbuilder.test.js
├── run.test.js
├── ai.test.js
├── save.test.js
├── cards-data.test.js       # Skeema, avainsanaraja, tekstin pituus, originaalisuuslista
└── balance.sim.js           # 1000 ottelun simulaatio (SC-002, SC-006)

tools/
├── serve.ps1                # Paikallinen HTTP-palvelin
└── validate-cards.mjs       # Korttidatan tarkistus

mobile/                      # Capacitor-kääre (kopio Horse Racerin mallista)
├── package.json
├── capacitor.config.json
├── scripts/copy-web.mjs
└── android/
```

**Structure Decision**: Valittiin yksi projekti, jonka juuressa on itse peli ilman build-vaihetta, ja `mobile/`-kansiossa Android-kääre. Rakenne vastaa Horse Raceria, joten julkaisuputki, ikonityökalut ja testiajuri voidaan kopioida sieltä. Moottori ja runin logiikka eivät käytä DOMia, joten ne testataan Nodella ja simuloidaan nopeasti.

## Complexity Tracking

Ei perustuslakirikkeitä, joita pitäisi perustella.
