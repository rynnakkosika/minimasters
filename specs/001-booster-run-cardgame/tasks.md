---

description: "Task list for the booster-run card game (työnimi Minimasters)"
---

# Tasks: Booster-run-korttipeli (työnimi "Minimasters")

**Input**: Design documents from `specs/001-booster-run-cardgame/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Mukana. Plan.md ja quickstart.md vaativat testit sääntömoottorille, boosterille, runille, tekoälylle, tallennukselle ja korttidatalle sekä tasapainosimulaation (SC-002, SC-006, SC-007). Testit ajetaan sekä Nodella (`node tests/run-node.mjs`) että selaimessa (`tests/index.html`).

**Organization**: Tehtävät on ryhmitelty käyttäjätarinoittain, jotta jokaisen voi toteuttaa ja testata erikseen.

**Commitit**: Commitoi itse jokaisen valmiin vaiheen (checkpoint) jälkeen selkeällä viestillä (käyttäjän CLAUDE.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Voidaan tehdä rinnakkain (eri tiedostot, ei riippuvuutta keskeneräisiin tehtäviin)
- **[Story]**: Mihin käyttäjätarinaan tehtävä kuuluu (US1–US5)
- Polut ovat suhteessa repon juureen `C:\Claude Code\Google Play apps\Minimasters`

## Path Conventions

Yksi projekti ilman build-vaihetta: peli on repon juuressa (`index.html`, `src/`, `data/`, `assets/`), testit `tests/`-kansiossa, työkalut `tools/`-kansiossa ja Android-kääre `mobile/`-kansiossa (ks. plan.md → Project Structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Projektin runko, palvelin ja testiajuri

- [ ] T001 Luo kansiorakenne plan.md:n mukaan (`src/engine`, `src/run`, `src/ai`, `src/data`, `src/storage`, `src/ui/screens`, `src/ui/components`, `src/ui/tutorial`, `data/cards`, `data/i18n`, `assets/art`, `assets/ui`, `assets/audio`, `tests`, `tools`) ja lisää `.gitignore` (`node_modules/`, `mobile/android/app/build/`, `mobile/keys/`, `mobile/dist/`)
- [ ] T002 [P] Luo `index.html` (viewport, pystysuunta, lataa `styles.css` ja `src/main.js` moduulina) ja tyhjä `src/main.js`, joka näyttää "Loading…" ja reitittää näkymiin hash-reitityksellä
- [ ] T003 [P] Luo `styles.css`: CSS-muuttujat elementtiväreille (ahjo, kallio, usva, neutral), vaalea ja tumma teema, kosketuskohteet vähintään 44×44 px ja asettelu, joka toimii 360 px leveydestä alkaen
- [ ] T004 [P] Kopioi `tools/serve.ps1` Horse Racerista (`C:\Claude Code\Google Play apps\Horse Racer\tools\serve.ps1`) ja säädä portiksi 8080
- [ ] T005 [P] Toteuta testiajuri: `tests/runner.js` (`test(name, fn)`, `assert`, `assertEqual`, `assertThrows`; Horse Racerin `tests/runner.js` mallina), `tests/index.html` (ajaa kaikki `*.test.js` selaimessa) ja `tests/run-node.mjs` (ajaa samat testit Nodella, exit-koodi 1 jos jokin epäonnistuu)
- [ ] T006 [P] Luo `README.md`: pelin kuvaus, ajo (`tools/serve.ps1`), testit, alkuperäisyysperiaate (FR-025) ja linkki speksiin

**Checkpoint**: `node tests/run-node.mjs` ajaa (0 testiä) ja `index.html` aukeaa → commit

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Sääntömoottori, korttidata ja i18n, joita kaikki tarinat tarvitsevat

**⚠️ CRITICAL**: Käyttäjätarinoita ei aloiteta ennen kuin tämä vaihe on valmis

### Data ja apukirjastot

- [ ] T007 [P] Toteuta siemennetty generaattori `src/engine/rng.js`: mulberry32, `createRng(seed)`, `next()`, `int(min,max)`, `shuffle(array)`, `pick(array)`. Tila on yksi uint32, joka voidaan serialisoida (R2).
- [ ] T008 [P] Kirjoita `tests/rng.test.js`: sama siemen tuottaa saman sarjan, `shuffle` on deterministinen ja tila voidaan tallentaa ja palauttaa kesken sarjan
- [ ] T009 [P] Luo `data/cards/keywords.json` kahdeksalla avainsanalla data-model.md:n mukaan: `suoja`, `kiire`, `vartija`, `imu`, `lapaisy`, `kaiku`, `piilo`, `kasvu`. Kentät `id`, `nameKey`, `descKey`. Sääntö: "koko pelissä ≤ 8".
- [ ] T010 [P] Luo `data/i18n/fi.json` ja `data/i18n/en.json`: käyttöliittymätekstit, avainsanojen nimet ja selitykset sekä vaikutusprimitiivien tekstipohjat (esim. `effect.damage` = "Tee {amount} vahinkoa: {target}.") ja kohteiden nimet
- [ ] T011 Toteuta `src/data/i18n.js`: `setLocale()` (`navigator.language` → `fi` tai `en`, muut → `en`, FR-027), `t(key, params)` ja `cardText(cardDef)`, joka generoi sääntötekstin `effects`-listasta ja avainsanoista (R3, R9)
- [ ] T012 Toteuta `src/data/cards.js`: lataa `data/cards/*.json` ja `keywords.json` ja validoi [contracts/card-schema.md](./contracts/card-schema.md):n säännöt 1–4 ja 6. Esimerkiksi `unit` vaatii `power`/`health` (0–12), `cost` on int 0–8, `rarity` ∈ `basic|common|uncommon|rare|mythic`, `element` ∈ `ahjo|kallio|usva|neutral` ja generoitu teksti on enintään 3 riviä (noin 90 merkkiä) molemmilla kielillä. Virheellinen kortti hylätään ja syy kerrotaan.
- [ ] T013 [P] Luo `data/cards/set-core.json` aloitussisällöksi: 3 perusresurssia (`basic`, yksi per elementti) ja 30 testikorttia (10 per elementti, eri hinnat 1–6 ja kaikki harvinaisuudet), jotka käyttävät kaikkia avainsanoja ja vähintään 10 eri vaikutusprimitiiviä. Kaikki nimet ovat alkuperäisiä.
- [ ] T014 [P] Luo `tools/forbidden-terms.txt` (tunnettujen korttipelien tavaramerkit, tunnettujen korttien nimet ja tunnusomaiset sääntötermit) ja `tools/validate-cards.mjs`, joka ajaa `src/data/cards.js`:n validoinnin, kieltolistatarkistuksen ja tulostaa yhteenvedon (määrä per elementti ja harvinaisuus) (R7)
- [ ] T015 Kirjoita `tests/cards-data.test.js`: kaikki kortit läpäisevät validoinnin, avainsanoja on enintään 8, tekstit ovat enintään 3 riviä fi/en ja yksikään nimi ei osu kieltolistaan

### Sääntömoottori ([contracts/engine-actions.md](./contracts/engine-actions.md))

- [ ] T016 Toteuta `src/engine/state.js`: `createMatch({ seed, decks, firstPlayer })` luo MatchStaten data-model.md:n mukaan (`life` 20, `energyMax` 0, `lanes[3]` null, 4 kortin aloituskäsi, `phase` = `MULLIGAN`) sekä `cloneState()`
- [ ] T017 Toteuta `src/engine/effects.js`: kaikki card-schema.md:n `op`-primitiivit (`damage`, `heal`, `draw`, `discard`, `buff`, `debuff`, `destroy`, `bounce`, `summon`, `gainEnergy`, `shield`, `moveLane`, `copyToHand`, `reduceCost`), kohteiden ratkaisu (`target`-arvot), `condition`-ehdot ja avainsanojen vaikutukset (`suoja`, `imu`, `lapaisy`, `kaiku`, `piilo`, `kasvu`, `kiire`, `vartija`). Jokainen muutos lisää Eventin.
- [ ] T018 Toteuta `src/engine/combat.js`: hyökkääjä lyö omaa kaistaansa, vastakkainen olento puolustaa automaattisesti (`vartija` voi puolustaa viereistä kaistaa), tyhjästä kaistasta vahinko menee pelaajaan ja `lapaisy` vie ylivahingon pelaajaan (R4)
- [ ] T019 Toteuta `src/engine/turn.js` ja `src/engine/rules.js`: vaiheet `MULLIGAN → DRAW → MAIN → COMBAT → END`, `energyMax` + resurssit ja energian täyttö vuoron alussa, enintään 1 resurssi per vuoro, nosto tyhjästä pakasta = häviö (`decked`), elämät ≤ 0 = häviö (`life`), vuororaja 25 vuoroa per pelaaja (enemmän elämää voittaa, tasatilanteessa `endReason: turnLimit` ja `winner: null` → uusinta) ja mulligan kerran per pelaaja (FR-014, FR-016)
- [ ] T020 Toteuta `src/engine/actions.js` ja `src/engine/index.js`: `legalActions(state, player)` ja `applyAction(state, action)` (ei muuta syötettä, palauttaa `{ state, events }`, laiton toiminto heittää `IllegalActionError`, FR-013) kaikille toiminnoille (`mulligan`, `playResource`, `playUnit`, `playSpell`, `declareAttackers`, `endTurn`, `concede`) sekä `isGameOver()`. Toiminnot kirjataan `state.log`-lokiin.
- [ ] T021 [P] Kirjoita `tests/engine.test.js`: vuorokierto, energia, resurssiraja, kaistan täyttö, laittomat siirrot hylätään, voittoehdot (life, decked, turnLimit, concede), mulligan kerran ja determinismi (sama siemen ja toimintosarja → identtinen tila)
- [ ] T022 [P] Kirjoita `tests/effects.test.js`: jokainen primitiivi, jokainen avainsana, kohteettoman `chosen*`-kortin pelaaminen estyy ja ehdolliset vaikutukset
- [ ] T023 Toteuta tekoäly `src/ai/evaluate.js`, `src/ai/policy.js`, `src/ai/styles.js` ja `src/ai/index.js`: `chooseAction(state, player, aiParams, rngSeed)` generoi vuoron siirtosarjat (`searchWidth`-raja), simuloi ne `cloneState`-kopiolla, pisteyttää tuloksen (elämäero, kaistojen voima, kortit kädessä, energian käyttö; tyylipainot), soveltaa `blunderRate`-virheet ja noudattaa 300 ms aikarajaa. Palauttaa aina laillisen toiminnon (R5).
- [ ] T024 Kirjoita `tests/ai.test.js`: 200 siemennetyssä ottelussa jokainen tekoälyn siirto on `legalActions`-listassa, ottelut päättyvät ja keskimääräinen päätösaika on alle 300 ms

**Checkpoint**: Kaksi tekoälyä pelaa ottelun loppuun Nodella, ja kaikki testit menevät läpi → commit

---

## Phase 3: User Story 1 - Avaa booster, rakenna minipakka ja pelaa yksi ottelu (Priority: P1) 🎯 MVP

**Goal**: Pelaaja avaa boosterin, rakentaa pakan (itse tai automaattisesti) ja pelaa yhden ottelun tekoälyä vastaan loppuun.

**Independent Test**: Uusi run → booster → "Rakenna puolestani" → ottelu pelataan loppuun ja voittaja näytetään (quickstart-skenaariot 1–4).

### Tests for User Story 1

- [ ] T025 [P] [US1] Kirjoita `tests/booster.test.js`: 10 000 siemennettyä boosteria. Jokaisessa on 10 korttia (6 common, 3 uncommon, 1 rare tai mythic), "vähintään 5 olentoa, vähintään 2 elementtiä ja vähintään 4 korttia hinnalla ≤ 3" (FR-003/004), eikä yhdessäkään ole `basic`-kortteja.
- [ ] T026 [P] [US1] Kirjoita `tests/deckbuilder.test.js`: `validateDeck` hylkää alle 20 tai yli 30 kortin pakan ja kortit, joita ei ole poolissa, sekä hyväksyy rajattomat perusresurssit. `autoBuild` tuottaa aina kelvollisen pakan, jossa resursseja on 40–45 % ja energiakäyrä painottuu hintoihin 1–4.

### Implementation for User Story 1

- [ ] T027 [P] [US1] Toteuta `src/run/booster.js`: `openBooster(rng, cardPool)`. Harvinaisuuspaikat 6/3/1, harvinaispaikalla myyttinen 1/8 todennäköisyydellä, koostumussääntöjen tarkistus ja uudelleenarvonta enintään 50 kertaa, sitten tavallisten korttien vaihto (R6).
- [ ] T028 [P] [US1] Toteuta `src/run/deckbuilder.js`: `validateDeck(run, deck)` → `{ ok, errors[] }` (20–30 korttia, vain poolista ja perusresursseista, FR-007) ja `autoBuild(run)` (valitsee 1–2 vahvinta elementtiä poolista ja täyttää perusresursseilla, FR-010)
- [ ] T029 [US1] Luo `data/opponents.json`: ensimmäinen vastustaja (`tier` 1, `style` `midrange`, `aiParams` `searchWidth` pieni ja `blunderRate` 0.25, `deckRecipe`) sekä `src/run/ladder.js`: `opponentFor(run)` kokoaa vastustajan pakan reseptistä runin siemenellä
- [ ] T030 [US1] Toteuta `src/run/run.js` ja `src/run/index.js`: `newRun(seed)`, `openBooster(run)`, `startMatch(run)` ja `finishMatch(run)` data-model.md:n tilakoneen alkuosalle (`OPENING_BOOSTER → DECKBUILDING → IN_MATCH`) ja ottelun lopputulokselle
- [ ] T031 [P] [US1] Toteuta korttikomponentti `src/ui/components/card.js`: nimi, hinta, elementin kehys, kuvitus (paikkamerkki, jos kuvaa ei vielä ole), voima/kestävyys ja generoitu teksti `cardText()`-funktiolla. Koot: käsi, pöytä ja iso näkymä.
- [ ] T032 [P] [US1] Toteuta `src/ui/components/tooltip.js` (iso kortti ja avainsanojen selitykset napautuksella, FR-020) ja `src/ui/components/energy-curve.js` (pylväät hinnan mukaan ja elementtijakauma, FR-009)
- [ ] T033 [P] [US1] Toteuta `src/ui/anim.js`: tapahtumajono, joka toistaa moottorin Eventit järjestyksessä CSS-animaatioina. Nopeudet ovat 1×, 2× ja ohita (FR-018).
- [ ] T034 [US1] Toteuta `src/ui/screens/booster.js`: korttien paljastus yksi kerrallaan napautuksella, "Paljasta kaikki" ja siirtyminen pakanrakennukseen ([contracts/ui-screens.md](./contracts/ui-screens.md))
- [ ] T035 [US1] Toteuta `src/ui/screens/deckbuild.js`: pooli ja pakka rinnakkain, perusresurssien +/- painikkeet, laskuri 20–30, energiakäyrä, "Rakenna puolestani" ja "Pelaa" (pois käytöstä, jos `validateDeck` epäonnistuu, ja syy näkyy). Rakentamisen on onnistuttava alle 60 sekunnissa (FR-011).
- [ ] T036 [US1] Toteuta ottelukomponentit `src/ui/components/board.js` (3 kaistaa kummallakin, kohteiden valinta), `src/ui/components/hand.js` (pelattavat kortit korostettu `legalActions`-listan perusteella, FR-013) ja `src/ui/components/life.js` (elämät, energia, pakan ja poistopinon koot)
- [ ] T037 [US1] Toteuta `src/ui/screens/match.js`: pelaajan toiminnot (mulligan, kortin vetäminen tai napautus kaistaan, kohteen valinta, "Hyökkää" ja kaistojen valinta, "Lopeta vuoro"), tekoälyn vuoro `chooseAction`-kutsuilla niin, että siirtojen välissä on näkyvä viive ja animaatio (FR-015), taukovalikko (luovuta, FR-017) ja ottelun loppuruutu
- [ ] T038 [US1] Toteuta `src/ui/screens/menu.js` ja reititys `src/main.js`:ssä: Päävalikko → "Uusi run" → booster → pakanrakennus → ottelu → tulos → päävalikko. Androidin takaisin-painike käsitellään (`popstate` sekä Capacitorin `backButton` myöhemmin T067:ssä).

**Checkpoint**: Quickstart-skenaariot 1–4 toimivat selaimessa 360 px leveydellä → commit

---

## Phase 4: User Story 2 - Etene runissa (Priority: P1)

**Goal**: Voitto antaa uuden boosterin ja vaikeamman vastustajan. Häviö tai 7 voittoa päättää runin ja näyttää yhteenvedon.

**Independent Test**: Voita ottelu → uusi booster ja pakan muokkaus → vaikeampi vastustaja. Häviä → yhteenveto (quickstart-skenaariot 5–6).

### Tests for User Story 2

- [ ] T039 [P] [US2] Kirjoita `tests/run.test.js`: tilakone `IN_MATCH → OPENING_BOOSTER` (voitto, wins < 7), `→ COMPLETED_VICTORY` (wins = 7) ja `→ COMPLETED_DEFEAT` (häviö tai luovutus), tasapelin (`turnLimit`, `winner: null`) uusinta samoilla pakoilla, poolin kasvu 10 kortilla per voitto ja vastustajan tier, joka ei koskaan laske (FR-006)

### Implementation for User Story 2

- [ ] T040 [US2] Täydennä `data/opponents.json` seitsemään vastustajaan (`tier` 1–7, tyylit `aggro | control | midrange | swarm | tempo`, kasvava `searchWidth`, laskeva `blunderRate` ja vahvempi `deckRecipe`). Jokaisella on oma alkuperäinen nimi, `nameKey` ja `portrait` (paikkamerkki) (FR-006).
- [ ] T041 [US2] Laajenna `src/run/run.js`: `finishMatch` toteuttaa koko tilakoneen (FR-005), pakkaa voi muokata ennen jokaista ottelua (FR-008) ja `src/run/ladder.js` valitsee vastustajan `opponentIndex`-arvon mukaan
- [ ] T042 [P] [US2] Toteuta `src/ui/screens/opponent-intro.js`: vastustajan nimi, muotokuva, tyylin kuvaus ja "ottelu X/7"
- [ ] T043 [P] [US2] Toteuta `src/ui/screens/result.js` (voittoruutu → seuraava booster) ja `src/ui/screens/run-summary.js` (voitot, paras kortti eli eniten vahinkoa tehnyt tai eniten pelattu, avatut boosterit, oma ennätys ja "Uusi run"). Runin voitosta (7/7) näytetään erillinen palkintoruutu.
- [ ] T044 [US2] Kytke runin kulku `src/main.js`:n reititykseen: ottelu → tulos → booster (uusi) → pakanrakennus → vastustajan esittely → ottelu ([contracts/ui-screens.md](./contracts/ui-screens.md))
- [ ] T045 [US2] Kirjoita `tests/balance.sim.js` (`--runs N`): simuloi täydet runit tekoälypelaajalla (`autoBuild` jokaisen boosterin jälkeen) ja raportoi ottelun pituuden vuoroina ja arvioituna kestona, voitto-% vastustajittain, runin läpäisy-% sekä elementtien voittojakauman. Tavoitteet: vastustaja 1 yli 75 %, koko run 5–15 % (SC-006).

**Checkpoint**: Koko run pelattavissa alusta loppuun. Ensimmäinen balanssiraportti → commit

---

## Phase 5: User Story 3 - Opi pelaamaan ilman ennakkotietoa (Priority: P2)

**Goal**: Ohjattu opetusottelu ja pelinaikaiset vihjeet aloittelijalle.

**Independent Test**: Ensimmäinen käynnistys tarjoaa opetuksen. Sen läpäissyt testaaja pelaa normaalin ottelun ilman apua (quickstart-skenaario 8, SC-003).

- [ ] T046 [P] [US3] Luo `src/ui/tutorial/script.js`: kiinteä opetusottelu (kiinteät pakat ja siemen) ja askeleet, joista jokainen esittelee yhden säännön yhdellä lyhyellä ruudulla. Järjestys: kortin nosto, resurssi ja energia, olennon pelaaminen kaistaan, hyökkäys tyhjään kaistaan, automaattinen puolustus, loitsu ja kohde, avainsana, voitto.
- [ ] T047 [US3] Toteuta `src/ui/screens/tutorial.js`: ajaa skriptin match-näkymän päällä, sallii vain skriptin odottaman siirron, korostaa kohteen ja näyttää selitysruudun. Opetuksen voi ohittaa ja käynnistää uudelleen päävalikosta (FR-019).
- [ ] T048 [P] [US3] Toteuta `src/ui/screens/rules.js`: pelin sisäinen sääntösivu (vuoron vaiheet, kaistat, energia, avainsanat `keywords.json`:sta), auki päävalikosta ja taukovalikosta (FR-012)
- [ ] T049 [US3] Lisää vihjeet `src/ui/screens/match.js`:iin: sallittujen hyökkääjien korostus, "Ei pelattavia kortteja – lopeta vuoro" -vihje ja asetus `settings.hints` vihjeiden poistamiseen (US3 skenaario 4)
- [ ] T050 [US3] Näytä opetustarjous ensimmäisellä käynnistyksellä `src/ui/screens/menu.js`:ssä, jos `profile.tutorialDone` on false

**Checkpoint**: Opetus pelattavissa alusta loppuun → commit

---

## Phase 6: User Story 4 - Jatka keskeytynyttä runia (Priority: P2)

**Goal**: Run ja ottelu jatkuvat täsmälleen samasta kohdasta sovelluksen sulkemisen jälkeen.

**Independent Test**: Sulje sovellus kesken ottelun, avaa uudelleen → "Jatka run" palauttaa saman tilan (quickstart-skenaario 7, SC-007).

- [ ] T051 [P] [US4] Kirjoita `tests/save.test.js`: tallenna ja lataa tuottaa identtisen Runin ja MatchStaten (RNG mukaan lukien), korruptoitunut JSON ei kaada vaan palauttaa `null` ja säilyttää profiilin, migraatioketju `migrate[v] → v+1` toimii, täynnä oleva tila antaa varoituksen ilman kaatumista ja ladatusta tilasta jatkettu ottelu etenee samoin kuin keskeytymätön
- [ ] T052 [US4] Toteuta `src/storage/save.js` [contracts/save-format.md](./contracts/save-format.md):n mukaan: avaimet `mm.profile.v1` ja `mm.run.v1`, `version`-kenttä, migraatiot, `saveRun`, `loadRun`, `clearRun`, `saveProfile` ja `loadProfile`. Ei henkilötietoja.
- [ ] T053 [US4] Kutsu `saveRun` jokaisen `applyAction`-kutsun, boosterin avauksen ja pakkamuutoksen jälkeen (`src/ui/screens/match.js`, `booster.js`, `deckbuild.js`) sekä Capacitorin `pause`-tapahtumassa ja `visibilitychange`-tapahtumassa (FR-022)
- [ ] T054 [US4] Päävalikko: "Jatka run" näkyy vain, jos tallennettu run on olemassa, ja palauttaa oikeaan näkymään. "Uusi run" kysyy vahvistuksen ennen keskeneräisen runin hylkäämistä (US4 skenaario 2). Muutokset tiedostoon `src/ui/screens/menu.js`.

**Checkpoint**: Keskeytys ja jatkaminen toimivat jokaisessa näkymässä → commit

---

## Phase 7: User Story 5 - Kokoelma ja ennätykset (Priority: P3)

**Goal**: Nähdyt kortit kokoelmassa ja ennätysten seuranta.

**Independent Test**: Pelaa run → avatut kortit näkyvät kokoelmassa ja ennätykset päivittyvät.

- [ ] T055 [US5] Päivitä profiilia `src/run/run.js`:ssä ja `src/storage/save.js`:ssä: booster lisää kortit `profile.collectionSeen`-listaan, ja runin päättyminen päivittää `records`-tiedot (`bestRunWins`, `runsCompleted`, `runsWon`, `matchesPlayed`) (FR-023)
- [ ] T056 [P] [US5] Toteuta `src/ui/screens/collection.js`: koko sarja, nähdyt avattuina ja näkemättömät siluetteina, suodatus elementin mukaan ja napautus avaa ison kortin
- [ ] T057 [P] [US5] Toteuta `src/ui/screens/records.js`: ennätysluvut profiilista
- [ ] T058 [P] [US5] Toteuta `src/ui/screens/settings.js`: kieli, animaationopeus, äänet ja vihjeet (tallentuvat `profile.settings`-asetuksiin)

**Checkpoint**: Kaikki päävalikon kohdat toimivat → commit

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Täysi sisältö, tasapaino, offline ja Google Play -julkaisu

### Sisältö (FR-024, FR-025)

- [ ] T059 [P] Laajenna `data/cards/set-core.json`: Ahjo-elementti 40 boosterikorttiin (aggressiivinen: kiire, läpäisy, suora vahinko)
- [ ] T060 [P] Laajenna `data/cards/set-core.json`: Kallio-elementti 40 boosterikorttiin (puolustava: vartija, suoja, kasvu, parannus)
- [ ] T061 [P] Laajenna `data/cards/set-core.json`: Usva-elementti 40 boosterikorttiin (ovela: piilo, bounce, nosto, kaiku)
- [ ] T062 Tarkista sarja `node tools/validate-cards.mjs`: vähintään 120 boosterikorttia, jakauma noin 60 common, 36 uncommon, 18 rare ja 6 mythic, käännökset fi/en ja kieltolista puhdas. Säädä korttien arvoja `node tests/balance.sim.js --runs 1000` perusteella, kunnes SC-002 ja SC-006 täyttyvät.
- [ ] T063 [P] Valitse alkuperäinen kauppanimi ja elementtien lopulliset nimet, ja päivitä `data/i18n/*.json`, `index.html` ja `README.md`. Tarkista, ettei nimi ole tunnetun pelin tavaramerkki.
- [ ] T064 [P] Tuota korttien kuvitus kansioon `assets/art/` (WebP, yhtenäinen oma taidesuunta, kehotteissa ei mainita olemassa olevia pelejä tai taiteilijoita) sekä elementtisymbolit ja kehykset kansioon `assets/ui/`
- [ ] T065 [P] Lisää äänet kansioon `assets/audio/` (kortin pelaus, hyökkäys, voitto, häviö, booster) ja mykistys asetuksiin

### Offline ja Android

- [ ] T066 [P] Luo `manifest.webmanifest`, `sw.js` (välimuistiin kaikki `index.html`, `src/`, `data/` ja `assets/` -tiedostot, versioitu välimuistinimi) ja `privacy.html` (tietoja ei kerätä eikä lähetetä) (FR-026)
- [ ] T067 Luo `mobile/` Horse Racerin `mobile/`-kansion mallin mukaan: `package.json` (Capacitor 8.6.0, `@capacitor/app`), `capacitor.config.json` (appId, appName, pystysuunta), `scripts/copy-web.mjs`, `npx cap add android` sekä takaisin-painikkeen ja `pause`-tapahtuman käsittely `src/main.js`:ssä
- [ ] T068 [P] Ikoni ja splash: `mobile/scripts/render-images.mjs` ja `npm run images` (kuten Horse Racerissa)
- [ ] T069 Rakenna debug-APK (`cd mobile && npm run apk`) ja testaa puhelimella tai emulaattorilla: 360 px näyttö, lentokonetila (FR-026), kieli fi/en/de (FR-027) ja keskeytys sekä jatkaminen (SC-007)
- [ ] T070 [P] Kauppamateriaalit kansioon `store/`: kuvaus fi/en, kuvakaappaukset ja ominaisuusgrafiikka, ikäluokituslomakkeen vastaukset (ei rahapelejä, ei oikealla rahalla ostettavia satunnaispalkintoja) ja data safety -vastaukset (ei kerättyä dataa)

### Laatu

- [ ] T071 Suorituskyky: mittaa tekoälyn päätösaika puhelimella (95 % alle 2 s näkyvä viive, SC-008), animaatioiden 60 fps ja kylmäkäynnistys alle 3 s. Optimoi `src/ai/policy.js` tarvittaessa.
- [ ] T072 Aja kaikki [quickstart.md](./quickstart.md):n validointiskenaariot 1–11 ja kirjaa tulokset tiedostoon `specs/001-booster-run-cardgame/checklists/validation.md`
- [ ] T073 Alkuperäisyyskatselmus ennen julkaisua: käy läpi korttien nimet, tekstit, kuvitus ja kauppamateriaalit FR-025:tä vasten ja kirjaa tulos tiedostoon `checklists/validation.md`
- [ ] T074 Rakenna julkaisu-AAB (`npm run bundle`, allekirjoitus `mobile/README.md`:n ohjeen mukaan) ja päivitä `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Ei riippuvuuksia
- **Foundational (Phase 2)**: Vaatii Setupin. Estää kaikki tarinat.
- **US1 (Phase 3)**: Vaatii Phase 2:n. MVP.
- **US2 (Phase 4)**: Vaatii US1:n (käyttää booster-, pakka- ja otteluvirtaa)
- **US3 (Phase 5)**: Vaatii US1:n match-näkymän. Riippumaton US2:sta.
- **US4 (Phase 6)**: Vaatii US1:n. Täysi hyöty US2:n jälkeen (run-tila), mutta testattavissa jo yhden ottelun tasolla.
- **US5 (Phase 7)**: Vaatii US1:n ja tallennuksen (T052)
- **Polish (Phase 8)**: Sisältö (T059–T065) voi alkaa heti Phase 2:n jälkeen. Android ja laatu vaativat valmiit tarinat.

### User Story Dependencies

```text
Setup → Foundational → US1 ─┬→ US2 ─┐
                            ├→ US3  ├→ Polish (Android, laatu)
                            ├→ US4 ─┤
                            └→ US5 ─┘   (US5 tarvitsee T052:n US4:stä)
Foundational → sisältötehtävät T059–T065 (rinnakkain)
```

### Within Each User Story

- Testit kirjoitetaan ensin ja niiden pitää aluksi epäonnistua
- Data ja logiikka (`src/run`, `src/engine`) ennen käyttöliittymää (`src/ui`)
- Commit jokaisen checkpointin jälkeen

### Parallel Opportunities

- Phase 1: T002–T006 rinnakkain
- Phase 2: T007–T010, T013 ja T014 rinnakkain. T021 ja T022 rinnakkain moottorin valmistuttua.
- US1: testit T025–T026, logiikka T027–T028 ja UI-komponentit T031–T033 rinnakkain
- US3, US4 ja US5 voidaan tehdä rinnakkain US1:n jälkeen
- Sisältö T059–T061 (yksi elementti kukin) sekä kuvitus ja äänet T064–T065 rinnakkain

---

## Parallel Example: User Story 1

```text
# Testit yhdessä:
T025 tests/booster.test.js
T026 tests/deckbuilder.test.js

# Logiikka yhdessä:
T027 src/run/booster.js
T028 src/run/deckbuilder.js

# UI-komponentit yhdessä:
T031 src/ui/components/card.js
T032 src/ui/components/tooltip.js + energy-curve.js
T033 src/ui/anim.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational (moottori, testikortit, tekoäly)
3. Phase 3: US1 (yksi pelattava ottelu boosterista)
4. **STOP and VALIDATE**: Pelaa selaimessa puhelimen leveydellä. Onko ottelu hauska ja ymmärrettävä 30 testikortilla?

### Incremental Delivery

1. MVP (US1) → sääntöjen ja hauskuuden testaus
2. US2 → koko run-silmukka ja ensimmäinen balanssiraportti
3. US3 + US4 → aloittelijaystävällisyys ja keskeytysten kestävyys
4. US5 → pitkän aikavälin motivaatio
5. Polish → 120 korttia, taide, Android ja Google Play

---

## Notes

- [P] = eri tiedostot, ei riippuvuuksia
- Moottori, run ja tekoäly eivät saa käyttää DOMia (testattava Nodella)
- Kaikki satunnaisuus kulkee `src/engine/rng.js`:n kautta (determinismi)
- Alkuperäisyys (FR-025) koskee jokaista nimeä, tekstiä ja kuvaa
- Commitoi jokaisen checkpointin jälkeen
