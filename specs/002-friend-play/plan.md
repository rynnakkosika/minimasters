# Implementation Plan: Pelaa kaverin kanssa

**Branch**: `002-friend-play` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-friend-play/spec.md`

## Summary

Kaksi pelaajaa pelaa yhden ottelun omilla laitteillaan. Lähestymistapa on sama kuin Horse Racerin "Play with a friend" -tilassa: PeerJS-kirjasto (WebRTC-datakanava) ladataan vasta, kun kaverivalikko avataan; isäntä saa 6-merkkisen koodin ja kutsulinkin; isännän selain on erotuomari.

Ero Horse Raceriin: Minimastersin moottori on deterministinen (`createMatch({ seed, decks })` + `applyAction(state, action)`), joten laitteet eivät lähetä pelitilaa vaan **siirtoja**. Isäntä lähettää vain siemenen; molemmat laskevat siitä samat boosterit, pakat ja sekoitukset. Isäntä hyväksyy kaverin siirron vain, jos se löytyy `legalActions(state, 1)`-listasta, ja lähettää jokaisen hyväksytyn siirron järjestysnumeron kanssa takaisin. Kaveri soveltaa siirtoja vain isännän järjestyksessä (myös omat siirtonsa), joten yhtä aikaa tehdyt aloituskäsivalinnat eivät voi erkaannuttaa tiloja.

Otteluruutu (`renderMatchView(root, app, session)`) on jo session varassa. Sitä laajennetaan:

- `session.me` (0 tai 1): kaveri pelaa pelaajana 1 mutta näkee itsensä alhaalla.
- `session.attach(api)`: verkkosessio voi syöttää ulkopuolisia siirtoja (`api.receive`) ja rakentaa tilan uudelleen (`api.rebuild`).
- `session.propose(action)`: kaverin omat siirrot lähetetään isännälle eikä niitä sovelleta heti.
- `session.save(state, events, action)`: isäntä lähettää jokaisen sovelletun siirron.
- `session.aiAction` voi puuttua (vastustaja on ihminen) ja ilmestyä myöhemmin (kaveri katosi → tekoäly jatkaa).

Kaikki ruudun tilamuutokset sarjallistetaan yhteen lupausjonoon, jotta verkosta tulevat siirrot ja omat siirrot eivät mene ristiin animaatioiden aikana.

## Technical Context

**Language/Version**: JavaScript (ES2022, natiivit ES-moduulit), ei build-vaihetta

**Primary Dependencies**: PeerJS 1.5.4 (unpkg, ladataan ajonaikaisesti vain kaverivalikossa; sama versio kuin Horse Racerissa). Ei muita uusia riippuvuuksia.

**Storage**: Ei uutta tallennusta. Kaveriottelua ei tallenneta (FR-017).

**Testing**: Nykyinen testiajuri (`node tests/run-node.mjs` ja `tests/index.html`). Uusi `tests/net.test.js`: protokolla, koodit, pakkojen determinismi, isännän tarkistus ja simuloitu täysi ottelu kahden "laitteen" välillä ilman verkkoa. Lopuksi kahden välilehden selaintesti.

**Target Platform**: Sama kuin 001: Android 8+ (Capacitor) ja selaimet. WebRTC toimii Android WebView'ssa ja nykyisissä selaimissa.

**Project Type**: Mobiilipeli (selainpeli + Android-kääre)

**Performance Goals**: Siirto näkyy vastapuolella alle 1 s (SC-004). Viestit ovat pieniä (yksi siirto ≈ 100 tavua).

**Constraints**: Yksinpeli ei saa koskea verkkoon (FR-006). Katkos havaitaan ≤ 12 s pingillä (FR-014). Vain yksi kaveri per peli (FR-005).

**Scale/Scope**: 2 uutta moduulia (`src/net/protocol.js`, `src/net/peer.js`), 1 uusi näkymä (`src/ui/screens/friend.js`), muutokset `match.js`, `menu.js`, `main.js`, `life.js`, käännökset, `privacy.html`, README, `sw.js`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` on edelleen täyttämätön pohja. Noudatetaan samoja periaatteita kuin 001:ssä:

| Periaate | Tila | Huomio |
|----------|------|--------|
| Alkuperäisyys | PASS | Ei uutta sisältöä, vain pelitila |
| Offline ja yksityisyys | PASS (perusteltu poikkeus) | Verkko vain kaverivalikossa, kun pelaaja itse valitsee sen. Ei tilejä eikä analytiikkaa. Tietosuojaseloste päivitetään (PeerJS-välityspalvelin, IP-osoitteet). |
| Testattavuus | PASS | Protokolla on puhdas moduuli, jota testataan Nodella ilman DOMia tai verkkoa |
| Yksinkertaisuus | PASS | Sama PeerJS-ratkaisu kuin Horse Racerissa, ei omaa palvelinta |
| Commitoi jokaisen työvaiheen jälkeen | PASS | Tehtävälistassa |

*Uudelleenarviointi Phase 1:n jälkeen*: Protokolla lähettää vain siemenen ja siirtoja; yhtään henkilötietoa ei siirry. PASS.

## Project Structure

### Documentation (this feature)

```text
specs/002-friend-play/
├── plan.md              # Tämä tiedosto
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── net-protocol.md  # Viestit ja otteluruudun session-sopimus
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── net/
│   ├── protocol.js      # Puhdas: koodit, pakat siemenestä, viestien tarkistus, isännän/kaverin käsittely, replay
│   └── peer.js          # PeerJS-kuljetus: lataus tarvittaessa, host/join, ping ja katkos
├── ui/screens/
│   ├── friend.js        # Kaverivalikko (Luo peli / Liity) ja verkkosessiot
│   └── match.js         # session.me, attach/propose, sarjallistettu jono
├── ui/components/life.js # vastustajan käsikortit näkyvät oikealle pelaajalle
└── main.js              # reitti 'friend', ?peli=KOODI -kutsulinkki
tests/net.test.js
privacy.html, README.md, sw.js (tools/update-sw.mjs)
```

**Structure Decision**: Verkko omaan `src/net/`-kansioon kuten Horse Racerissa. Moottoriin ei kosketa: kaikki tarvittava (`createMatch`, `applyAction`, `legalActions`, `actionKey`) on jo julkista.

## Complexity Tracking

Ei perusteltavia poikkeamia.
