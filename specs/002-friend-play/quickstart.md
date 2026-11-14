# Quickstart: Pelaa kaverin kanssa

## Yksikkötestit

```bash
node tests/run-node.mjs
```

`tests/net.test.js` kattaa: koodit ja kutsulinkin, pakkojen determinismin ja pelikelpoisuuden, isännän tarkistuksen (väärä pelaaja, laiton siirto, rikkinäinen viesti, ylimääräiset kentät), järjestysnumerot ja resyncin sekä täyden simuloidun ottelun kahden "laitteen" välillä, jonka lopussa tilat ovat identtiset.

## Kahden välilehden testi (tällä koneella)

1. `powershell -File tools/serve.ps1` ja avaa kaksi välilehteä osoitteeseen <http://localhost:8080/>.
2. Välilehti A: **Pelaa kaverin kanssa → Luo peli**. Koodi ja linkki näkyvät.
3. Välilehti B: **Pelaa kaverin kanssa → Liity**, kirjoita koodi (tai avaa linkki). Ottelu alkaa molemmissa.
4. Pelaa ottelu loppuun vuorotellen. Odotus: sama elämä/pöytä molemmissa; lopussa toinen näkee voiton, toinen häviön.
5. Katkos: aloita uusi peli ja sulje B kesken. Odotus: A näyttää "Kaveri poistui" ja tekoäly jatkaa ≤ 15 s kuluessa.

## Puhelimilla

Kaveri tarvitsee pelin verkkoversion (esim. GitHub Pages). Linkki `localhost`-osoitteeseen toimii vain samalla koneella. Julkaisu on käyttäjän päätös.
