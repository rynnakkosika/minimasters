# Research: Pelaa kaverin kanssa

## R1 – Yhteys kahden puhelimen välillä

- **Decision**: PeerJS 1.5.4 (WebRTC-datakanava) ilmaisella julkisella PeerJS-välityspalvelimella. Kirjasto ladataan `<script>`-tagilla unpkg:stä vasta, kun kaverivalikossa painetaan "Luo peli" tai "Liity". Peer-tunnus = `minimasters-` + 6-merkkinen koodi.
- **Rationale**: Sama, jo toimivaksi todettu ratkaisu kuin Horse Racerissa. Ei omaa palvelinta, ei tilejä. Välityspalvelin vain esittelee laitteet; siirrot kulkevat suoraan.
- **Alternatives**: Oma WebSocket-palvelin (ylläpito, kustannus); Firebase (tili, henkilötietoja); paikallinen Bluetooth (ei selaimessa).

## R2 – Synkronointi: tila vai siirrot

- **Decision**: Lähetetään siirtoja. Isäntä arpoo 32-bittisen siemenen ja lähettää sen `start`-viestissä. Molemmat laskevat `friendDecks(seed)` → kaksi boosteria (`openBoosterCards(mix(seed, p), allCards())`) → `autoBuild` → `deckList`, ja `createMatch({ seed, decks, firstPlayer: seed & 1 })`.
- **Rationale**: Moottori on deterministinen ja tila on usean kilotavun JSON; siirto on ≈ 100 tavua. Siemen + siirtohistoria palauttaa minkä tahansa tilan (`replay`), mikä antaa myös yksinkertaisen uudelleensynkronoinnin.
- **Alternatives**: Koko tilan lähettäminen jokaisen siirron jälkeen (Horse Racer tekee näin): turhan iso eikä tarpeen. Optimistinen soveltaminen kaverilla: aloituskäsivalinnat (mulligan) käyttävät yhteistä satunnaislukugeneraattoria, joten järjestyksen on oltava sama molemmilla → kaveri odottaa isännän vahvistuksen.

## R3 – Isännän tarkistus

- **Decision**: `sanitizeGuestAction(state, raw)` hyväksyy vain objektin, jonka `player === 1` ja jonka `actionKey` löytyy `legalActions(state, 1)`-listasta; palautetaan listan oma, puhdas siirto-objekti (ylimääräiset kentät karsiutuvat). Lopullinen vartija on `applyAction`, joka heittää `IllegalActionError`, jos tila ehti muuttua.
- **Rationale**: Käyttää moottorin omaa sääntölähdettä; mitään sääntöä ei kopioida.

## R4 – Järjestysnumerot ja uudelleensynkronointi

- **Decision**: Isäntä lähettää `{ t: 'act', n, action }`, jossa `n` = siirron indeksi `state.log`-listassa. Kaveri soveltaa vain, jos `n === state.log.length`; muuten (tai jos `applyAction` heittää) se lähettää `{ t: 'resync' }` ja isäntä vastaa `{ t: 'sync', seed, log }`. Kaveri rakentaa tilan `replay(seed, log)`.
- **Rationale**: Datakanava on luotettava ja järjestetty, joten uudelleensynkronointia tarvitaan vain poikkeustilanteissa, mutta se on halpa varmistus (SC-002).

## R5 – Katkokset

- **Decision**: Ping 3 s välein, katkos 12 s hiljaisuuden jälkeen (Horse Racerin arvot) + `bye`-viesti `pagehide`-tapahtumassa. Isäntä: ilmoitus + `session.aiAction` asetetaan (keskitason tekoäly, `style: 'midrange'`) ja ruutu jatkaa. Kaveri: ilmoitusikkuna ja "Valikkoon".
- **Rationale**: WebRTC ei usein huomaa suljettua välilehteä; ping tekee katkoksesta varman (FR-014).

## R6 – Otteluruudun muutos

- **Decision**: `renderMatchView` saa `session.me`-kentän (oletus 0) ja kaikki tilaa muuttavat toimet kulkevat yhden lupausjonon kautta (`enqueue`). Verkkosessio saa `attach(api)`-kutsun, jossa `api.receive(action)`, `api.rebuild(state)`, `api.resume()` ja `api.state()`.
- **Rationale**: Yksinpeli ja tutoriaali toimivat ennallaan (ne eivät käytä uusia kenttiä), ja jono estää kilpatilanteet animaatioiden aikana.

## R7 – Kutsulinkki

- **Decision**: `index.html?peli=KOODI`. `main.js` lukee parametrin käynnistyksessä, poistaa sen osoiteriviltä (`history.replaceState`) ja avaa kaverinäkymän liittymistilassa. Jakopainike käyttää `navigator.share`, muuten leikepöytää.
- **Huomio**: Linkki localhostiin toimii vain samalla koneella; verkkoversio pitää julkaista (käyttäjän päätös).
