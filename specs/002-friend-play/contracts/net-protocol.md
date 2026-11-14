# Contract: kaveripelin protokolla ja otteluruudun sessio

## Viestit (JSON, PeerJS-datakanava, luotettava ja järjestetty)

Kuljetuskerros (`src/net/peer.js`) lisää omat `{ type: 'ping' }` ja `{ type: 'bye' }` -viestinsä eikä välitä niitä eteenpäin.

| Suunta | Viesti | Merkitys |
|--------|--------|----------|
| kaveri → isäntä | `{ t: 'hello', v }` | Liittyminen; `v` = `PROTOCOL_VERSION` |
| isäntä → kaveri | `{ t: 'start', v, seed }` | Ottelu alkaa; molemmat laskevat tilan siemenestä |
| isäntä → kaveri | `{ t: 'version', v }` | Versiot eroavat, yhteys suljetaan |
| kaveri → isäntä | `{ t: 'propose', action }` | Kaverin siirtoehdotus |
| isäntä → kaveri | `{ t: 'act', n, action }` | Hyväksytty siirto (kumman tahansa pelaajan), `n` = järjestysnumero |
| isäntä → kaveri | `{ t: 'reject' }` | Ehdotus hylättiin; kaveri palaa odottamaan omaa siirtoa |
| kaveri → isäntä | `{ t: 'resync' }` | Kaverin tila ei sovi; pyytää historian |
| isäntä → kaveri | `{ t: 'sync', seed, log }` | Koko siirtohistoria |

## Puhtaat funktiot (`src/net/protocol.js`)

- `PROTOCOL_VERSION`, `makeCode(rand)`, `normalizeCode(text)`, `inviteLink(base, code)`, `codeFromUrl(url)`
- `friendDecks(seed)` → `[cardId[], cardId[]]`
- `createFriendMatch(seed)` → `MatchState`
- `replay(seed, log)` → `MatchState`
- `sanitizeGuestAction(state, raw)` → `Action | null`
- `hostHandle(state, msg)` → `{ action?: Action, reply?: Message }` (isäntä: kaverin viesti)
- `guestHandle(state, msg)` → `{ action?: Action, rebuild?: MatchState, reply?: Message, rejected?: true }` (kaveri: isännän viesti)

## Otteluruudun sessio (`renderMatchView(root, app, session)`)

Uudet valinnaiset kentät (yksinpeli ja tutoriaali eivät käytä niitä):

| Kenttä | Kuvaus |
|--------|--------|
| `me` | Paikallisen pelaajan indeksi (oletus 0) |
| `opponent.name` | Vastustajan nimi yläpalkissa |
| `aiAction?` | Jos puuttuu, vastustaja on ihminen eikä ruutu aja tekoälyä |
| `propose?(action)` | Jos on, omat siirrot lähetetään eikä niitä sovelleta heti; ruutu odottaa |
| `attach?(api)` | Kutsutaan kerran. `api.receive(action) → Promise<boolean>`, `api.rebuild(state)`, `api.resume()` (aja tekoäly, jos `aiAction` lisättiin), `api.state()`, `api.idle()` |
| `save(state, events, action)` | Kolmas argumentti on sovellettu siirto |
