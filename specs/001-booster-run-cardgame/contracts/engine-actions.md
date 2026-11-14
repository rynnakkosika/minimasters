# Contract: Moottorin toiminnot ja tapahtumat

Käyttöliittymä ja tekoäly käyttävät moottoria vain tämän rajapinnan kautta (`src/engine/index.js`). Moottori ei koske DOMiin.

## Funktiot

```text
createMatch({ seed, decks: [Deck, Deck], firstPlayer? }) → MatchState
legalActions(state, player) → Action[]
applyAction(state, action) → { state, events: Event[] }   // ei muuta syötettä
isGameOver(state) → { over: bool, winner, reason }
```

- `applyAction` heittää `IllegalActionError`-virheen, jos toiminto ei ole `legalActions`-listassa (FR-013).
- Sama siemen, samat pakat ja sama toimintosarja tuottavat aina saman tilan ja tapahtumat (determinismi).

## Action

| `type` | Kentät | Milloin |
|--------|--------|---------|
| `mulligan` | `keep: bool` | `MULLIGAN`, kerran per pelaaja (FR-014) |
| `playResource` | `uid` | `MAIN`, enintään 1 per vuoro |
| `playUnit` | `uid`, `lane` 0–2, `targets?` | `MAIN`, kaistan oltava tyhjä ja energiaa riittävästi |
| `playSpell` | `uid`, `targets?` | `MAIN` |
| `declareAttackers` | `lanes: int[]` (ei tyhjä) | `MAIN`. Taistelu ratkaistaan ja vuoro päättyy samalla. |
| `endTurn` | — | `MAIN`, ilman hyökkäystä |
| `concede` | — | Milloin tahansa (FR-017) |

`targets` on yhden alkion lista: `uid` tai `"player:N"`. Kortilla on enintään yksi `chosen*`-kohdetyyppi, ja kaikki sen `chosen*`-vaikutukset kohdistuvat samaan kohteeseen.

**Elementtivaatimus:** kortin pelaaminen vaatii energian lisäksi vähintään yhden saman elementin lähteen pelissä (neutraalit kortit eivät vaadi).

## Event (käyttöliittymän animaatioita varten)

`cardDrawn`, `cardPlayed`, `resourcePlayed`, `unitSummoned`, `attackDeclared`, `damageDealt`, `unitDied`, `healed`, `buffed`, `cardBounced`, `energyChanged`, `turnStarted`, `phaseChanged`, `gameOver`.

Jokaisessa tapahtumassa on `type`, asianomaiset `uid`:t ja pelaaja sekä numerot. Käyttöliittymä toistaa tapahtumat järjestyksessä ja voi ohittaa ne (FR-018). Tekoälyn siirrot näytetään samoina tapahtumina (FR-015).

## Tekoälyrajapinta (`src/ai/index.js`)

```text
chooseAction(state, player, aiParams, rngSeed) → Action
```

Funktio palauttaa aina laillisen toiminnon. Aikaraja on 300 ms; jos se ylittyy, palautetaan siihen mennessä paras löydetty siirto.

## Runin rajapinta (`src/run/index.js`)

```text
newRun(seed) → Run
openBooster(run) → { run, booster }
validateDeck(run, deck) → { ok, errors[] }        // 20–30 korttia, vain poolista + perusresursseja
autoBuild(run) → Deck                              // FR-010
startMatch(run) → Run                              // luo MatchState vastustajaa opponentIndex vastaan
finishMatch(run) → Run                             // päivittää wins/status tilakoneen mukaan
```
