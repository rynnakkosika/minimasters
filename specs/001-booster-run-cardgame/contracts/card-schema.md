# Contract: Korttidata (`data/cards/*.json`)

Tiedosto on JSON-taulukko CardDef-olioita (kentät: [data-model.md](../data-model.md#carddef-korttimääritys)). `src/data/cards.js` ja `tools/validate-cards.mjs` hylkäävät virheellisen datan ja kertovat syyn.

## Esimerkki

```json
{
  "id": "ahjo-kipinasoturi",
  "nameKey": "card.ahjo-kipinasoturi",
  "type": "unit",
  "element": "ahjo",
  "cost": 2,
  "rarity": "common",
  "power": 3,
  "health": 1,
  "keywords": ["kiire"],
  "effects": [],
  "art": "art/ahjo-kipinasoturi.webp"
}
```

```json
{
  "id": "usva-sumuhuntu",
  "nameKey": "card.usva-sumuhuntu",
  "type": "spell",
  "element": "usva",
  "cost": 3,
  "rarity": "uncommon",
  "keywords": [],
  "effects": [
    { "trigger": "onPlay", "op": "bounce", "target": "chosenEnemyUnit" },
    { "trigger": "onPlay", "op": "draw", "amount": 1, "target": "self" }
  ],
  "art": "art/usva-sumuhuntu.webp"
}
```

## Effect

```text
{ trigger, op, target, amount?, condition?, cardId? }
```

| Kenttä | Sallitut arvot |
|--------|----------------|
| `trigger` | `onPlay`, `onDeath`, `onAttack`, `onDamaged`, `startOfTurn`, `endOfTurn` |
| `op` | `damage`, `heal`, `draw`, `discard`, `buff` (amount = `{power, health}`), `debuff`, `destroy`, `bounce`, `summon` (cardId), `gainEnergy`, `shield`, `moveLane`, `copyToHand`, `reduceCost` |
| `target` | `self`, `opponent`, `thisUnit`, `chosenEnemyUnit`, `chosenFriendlyUnit`, `chosenAnyUnit`, `opposingUnit` (sama kaista), `adjacentFriendly`, `allEnemyUnits`, `allFriendlyUnits`, `allUnits`, `randomEnemyUnit` |
| `condition` | valinnainen: `{ "if": "lifeBelow", "value": 10 }`, `{ "if": "controlsElement", "value": "kallio" }`, `{ "if": "laneEmpty" }` |

`chosen*`-kohteet vaativat pelaajalta valinnan kortin pelaamisen yhteydessä (ks. [engine-actions.md](./engine-actions.md)). Jos laillista kohdetta ei ole, korttia ei voi pelata.

## Validointisäännöt

1. `id` on uniikki ja `nameKey` löytyy molemmista kielitiedostoista.
2. `unit` vaatii `power` ja `health`. Muilla tyypeillä niitä ei saa olla.
3. `keywords` ⊆ `keywords.json`, ja `keywords.json` sisältää enintään 8 avainsanaa.
4. Generoitu sääntöteksti on enintään 3 riviä (noin 90 merkkiä) sekä fi- että en-kielellä.
5. Julkaisusarjassa on vähintään 120 boosterikorttia (ei `basic`), noin 40 kutakin elementtiä kohden, sekä harvinaisuusjakauma noin 60 common, 36 uncommon, 18 rare ja 6 mythic.
6. Nimet ja tekstit eivät osu alkuperäisyyden kieltolistaan (`tools/forbidden-terms.txt`).
