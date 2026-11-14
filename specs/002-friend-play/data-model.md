# Data Model: Pelaa kaverin kanssa

Kaikki on muistissa; mitään ei tallenneta (FR-017).

## FriendGame (kaverinäkymän tila)

| Kenttä | Tyyppi | Kuvaus |
|--------|--------|--------|
| role | `'host' \| 'guest'` | Isäntä on pelaaja 0, kaveri pelaaja 1 |
| code | string(6) | Merkit `ABCDEFGHJKMNPQRSTUVWXYZ23456789` |
| link | Link | `peer.js`:n yhteysolio (`send`, `close`, `connected`) |
| seed | uint32 | Isännän arpoma ottelun siemen |
| status | `'loading' \| 'waiting' \| 'connecting' \| 'playing' \| 'lost' \| 'error'` | Näkymän tila |

## MatchStart (johdettu siemenestä)

- `boosters[p] = openBoosterCards(mixSeed(seed, p), allCards())`
- `decks[p] = deckList(autoBuild(boosters[p]))` – aina pelikelpoinen (`validateDeck`)
- `firstPlayer = seed & 1`
- `state = createMatch({ seed, decks, firstPlayer })`

## Action message

`{ t: 'act', n: number, action: Action }` – `Action` on moottorin siirto (contracts/engine-actions.md 001:ssä). `n` = indeksi `state.log`-listassa ennen siirtoa.

## Tilasiirtymät (kaveri)

```text
loading → connecting → (hello/start) → playing → GAME_OVER → menu
                     ↘ error (notfound / version / network)
playing → lost (isäntä katosi) → menu
```

## Tilasiirtymät (isäntä)

```text
loading → waiting (koodi näkyy) → hello saapui → start lähetetty → playing → GAME_OVER → menu
playing → kaveri katosi → playing (tekoäly pelaa pelaajaa 1)
```

## Validointisäännöt

- Kaverin siirto: objekti, `player === 1`, `actionKey` ∈ `legalActions(state, 1)`.
- Isännän `act`-viesti kaverilla: `n === state.log.length` ja `applyAction` onnistuu; muuten resync.
- `hello.v` ja `start.v` on oltava `PROTOCOL_VERSION`; muuten `{ t: 'version' }` ja virheviesti.
