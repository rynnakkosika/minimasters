---

description: "Task list for 002-friend-play (Pelaa kaverin kanssa)"
---

# Tasks: Pelaa kaverin kanssa

**Input**: Design documents from `specs/002-friend-play/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/net-protocol.md](./contracts/net-protocol.md), [quickstart.md](./quickstart.md)

**Tests**: Mukana. Protokolla ja isännän tarkistus testataan Nodella (`tests/net.test.js`), koko ominaisuus kahden välilehden selaintestillä (quickstart.md).

**Commitit**: Commitoi jokaisen valmiin vaiheen jälkeen (käyttäjän CLAUDE.md). Ei julkaisua eikä pushia.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Voidaan tehdä rinnakkain (eri tiedostot)
- **[Story]**: US1–US5 (spec.md)

---

## Phase 1: Foundational – puhdas protokolla (blocks all stories)

- [X] T001 Luo `src/net/protocol.js`: `PROTOCOL_VERSION`, `makeCode`, `normalizeCode`, `inviteLink`, `codeFromUrl` (contracts/net-protocol.md)
- [X] T002 Lisää `src/net/protocol.js`: `mixSeed`, `friendDecks(seed)`, `createFriendMatch(seed)`, `replay(seed, log)` (data-model.md → MatchStart) [US2]
- [X] T003 Lisää `src/net/protocol.js`: `sanitizeGuestAction`, `hostHandle`, `guestHandle` (research R3, R4) [US3]
- [X] T004 [P] Kirjoita `tests/net.test.js` ja lisää se `tests/suites.js`-listaan: koodit, linkki, pakkojen determinismi ja pelikelpoisuus, aloittajan jakauma, tarkistus (väärä pelaaja, laiton, rikkinäinen, ylimääräiset kentät, peli ohi), act/reject/resync/sync, versio, täysi simuloitu ottelu kahden laitteen välillä (myös yhtäaikaiset mulliganit), replay

**Checkpoint**: `node tests/run-node.mjs` vihreä → commit.

## Phase 2: User Story 1+3 – verkko-ottelu otteluruudussa (P1) 🎯 MVP

- [X] T005 [US1] Luo `src/net/peer.js`: PeerJS-lataus vain pyynnöstä, `host(makeCode, handlers)`, `join(code, handlers)`, ping/katkos, `bye` (research R1, R5; Horse Racerin `src/net/peer.js` ES-moduulina)
- [X] T006 [US1] Muuta `src/ui/screens/match.js`: `session.me`, sarjallistettu `enqueue`-jono, `session.propose`, `session.attach(api)`, `save(state, events, action)`, tekoäly vain jos `session.aiAction` (contracts → Otteluruudun sessio)
- [X] T007 [P] [US1] Muuta `src/ui/components/life.js`: käsikorttien määrä näytetään vastustajalle (`showHand`-valinta), ei kovakoodattua pelaajaa 1
- [X] T008 [US1] Luo `src/ui/screens/friend.js`: valikko (Luo peli / Liity), isäntänäkymä (koodi, linkki, jaa/kopioi, odotus), liittymisnäkymä (koodikenttä), virheet (ei nettiä, peliä ei löytynyt, versio)
- [X] T009 [US1][US3] Lisää `src/ui/screens/friend.js`: isännän ja kaverin verkkosessiot `hostHandle`/`guestHandle`-funktioilla; tulosruudun "Jatka" vie valikkoon ja sulkee yhteyden
- [X] T010 [US1] Muuta `src/ui/screens/menu.js` (painike) ja `src/main.js` (reitti `friend`, `?peli=KOODI`, takaisin-painike ottelussa)
- [X] T011 [P] [US1] Lisää käännökset `data/i18n/fi.json` ja `data/i18n/en.json` (`friend.*`, `menu.friend`) ja tyylit `styles.css`

**Checkpoint**: testit vihreät → commit.

## Phase 3: User Story 4 – katkokset (P2)

- [X] T012 [US4] Isäntä: kaverin katketessa ilmoitus ja `session.aiAction` (keskitason tekoäly) + `api.resume()`; kaveri: ilmoitusikkuna ja "Valikkoon"; ennen ottelua virhe + "Yritä uudelleen"

## Phase 4: User Story 5 + Polish

- [ ] T013 [US5] Varmista, ettei kaveriottelu kutsu `app.setRun`/`saveSettings`-tallennusta eikä yksinpeli tuo `src/net/peer.js`:ää (PeerJS vain dynaamisesti)
- [ ] T014 [P] Päivitä `privacy.html` (PeerJS-välityspalvelin, IP-osoitteet, ei tallennusta) (FR-019)
- [ ] T015 [P] Päivitä `README.md` (Pelaa kaverin kanssa, julkaisuvaatimus, rakenne)
- [ ] T016 Aja `node tools/update-sw.mjs`, `node tests/run-node.mjs` ja `npm run sync` (mobile/)
- [ ] T017 Kahden välilehden selaintesti quickstart.md:n mukaan: täysi ottelu kahden välilehden välillä

**Checkpoint**: commit.

## Dependencies

Phase 1 → Phase 2 → Phase 3 → Phase 4. T004, T007, T011, T014, T015 voi tehdä rinnakkain muiden kanssa.
