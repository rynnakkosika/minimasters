# Data Model: Booster-run-korttipeli

Kaikki entiteetit ovat serialisoitavaa JSON-dataa. Staattinen sisältö (kortit, avainsanat, vastustajat) on `data/`-kansiossa. Pelaajan tila tallennetaan `localStorage`en (ks. [contracts/save-format.md](./contracts/save-format.md)).

## Staattinen sisältö

### CardDef (korttimääritys)

| Kenttä | Tyyppi | Säännöt |
|--------|--------|---------|
| `id` | string | Uniikki, kebab-case, esim. `ahjo-kipinasoturi` |
| `nameKey` | string | i18n-avain |
| `type` | `"resource" \| "unit" \| "spell"` | |
| `element` | `"ahjo" \| "kallio" \| "usva" \| "neutral"` | Perusresurssit ovat oman elementtinsä kortteja |
| `cost` | int 0–8 | Resursseilla 0 |
| `rarity` | `"basic" \| "common" \| "uncommon" \| "rare" \| "mythic" \| "token"` | `basic` = ilmainen perusresurssi ja `token` = kutsuttu olento; kumpikaan ei tule boostereista |
| `power` / `health` | int 0–12 | Vain `unit` |
| `keywords` | string[] | Vain `data/cards/keywords.json`:n avainsanoja; koko pelissä ≤ 8 (FR-021) |
| `effects` | Effect[] | Ks. [contracts/card-schema.md](./contracts/card-schema.md) |
| `art` | string | Polku `assets/art/` |

Validointi: generoitu sääntöteksti on enintään 3 riviä (noin 90 merkkiä) molemmilla kielillä, ja nimen on läpäistävä alkuperäisyyden kieltolista (R7).

### KeywordDef
`id`, `nameKey`, `descKey`. Avainsanoja on enintään 8. Ehdotus: `Suoja` (estää ensimmäisen vahingon), `Kiire` (hyökkää heti), `Vartija` (puolustaa viereistäkin kaistaa), `Imu` (tehty vahinko parantaa), `Läpäisy` (ylivahinko pelaajaan), `Kaiku` (vaikutus myös kuollessa), `Piilo` (ei voi kohdistaa ennen kuin hyökkää), `Kasvu` (+1/+1 vuoron alussa).

### OpponentDef
`id`, `nameKey`, `portrait`, `tier` (1–7), `style` (`aggro | control | midrange | swarm | tempo`), `aiParams` (`searchWidth`, `blunderRate`, `weights`), `deckRecipe` (elementit ja harvinaisuuskiintiöt, jotka arvotaan runin siemenellä).

## Ajonaikainen tila

### Booster
`{ seed, cards: CardId[10] }`. Koostumus: 6 common, 3 uncommon, 1 rare tai mythic. Vähintään 5 olentoa, vähintään 2 elementtiä ja vähintään 4 korttia, joiden hinta on enintään 3 (FR-003, FR-004).

### Run
| Kenttä | Tyyppi | Huomio |
|--------|--------|--------|
| `id`, `seed` | string, uint32 | |
| `status` | RunStatus | ks. tilakone |
| `pool` | CardId[] | Kaikki runissa avatut kortit (ei perusresursseja) |
| `deck` | `{ cards: CardId[], basics: { ahjo, kallio, usva } }` | 20–30 korttia yhteensä (FR-007) |
| `wins` | int 0–7 | |
| `opponentIndex` | int 0–6 | |
| `boosters` | Booster[] | Avausjärjestyksessä |
| `match` | MatchState \| null | Keskeneräinen ottelu |
| `startedAt` | ISO-aikaleima | |

**Run-tilakone**:

```text
OPENING_BOOSTER → DECKBUILDING → IN_MATCH ─┬─ voitto, wins < 7 → OPENING_BOOSTER
                                           ├─ voitto, wins = 7 → COMPLETED_VICTORY
                                           └─ häviö/luovutus  → COMPLETED_DEFEAT
```

Uusi run keskeneräisen päälle vaatii vahvistuksen ja hylkää vanhan (US4).

### MatchState
| Kenttä | Kuvaus |
|--------|--------|
| `rng` | Generaattorin tila (uint32) |
| `turn` | Vuoronumero; `activePlayer` 0 \| 1 |
| `phase` | `MULLIGAN \| DRAW \| MAIN \| COMBAT \| END \| GAME_OVER` |
| `players[2]` | PlayerState |
| `winner` | 0 \| 1 \| null; `endReason`: `life \| decked \| turnLimit \| concede` |
| `log` | Toimintoloki (toistettavuus ja vianetsintä) |

### PlayerState
`life` (alussa 20), `energyMax`, `energy`, `resourcePlayedThisTurn`, `deck` (CardInstance[], järjestetty), `hand`, `discard`, `lanes[3]` (UnitInstance | null), `mulliganUsed`.

### CardInstance / UnitInstance
`uid` (ottelun sisäinen), `cardId`. Olennoilla lisäksi `damage`, `buffs` (power/health-muutokset), `status` (`summoningSick`, `shielded`, `hidden`, …).

**Vuoron vaiheet**: `DRAW` (nosto; jos pakka on tyhjä → häviö) → `MAIN` (enintään 1 resurssi, kortit energialla, olennot tyhjiin kaistoihin) → `COMBAT` (pelaaja valitsee hyökkäävät olennot; kukin hyökkää omaan kaistaansa) → `END` (vaikutukset; vuororaja: kun kumpikin on pelannut 25 vuoroa, enemmän elämää voittaa ja tasatilanteessa ottelu uusitaan).

### Profile
`version`, `records` (`bestRunWins`, `runsCompleted`, `runsWon`, `matchesPlayed`), `collectionSeen` (CardId[]), `settings` (`locale`, `animSpeed`, `sound`, `hints`), `tutorialDone` (bool).

## Suhteet

```text
Profile 1 ── 0..1 Run (keskeneräinen)
Run 1 ── * Booster ── 10 CardDef
Run 1 ── 1 Deck ── * CardDef
Run 1 ── 0..1 MatchState ── 2 PlayerState ── * CardInstance → CardDef
Run → OpponentDef (opponentIndex)
```
