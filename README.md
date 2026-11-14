# Minimasters (työnimi)

Alkuperäinen keräilykorttipeli puhelimille. Jokainen **run** alkaa tyhjästä: avaat 10 kortin boosterin, kokoat siitä ja ilmaisista perusresursseista minipakan ja kohtaat tekoälyvastustajan. Jokainen voitto antaa uuden boosterin ja vaikeamman vastustajan, ja ensimmäinen häviö päättää runin.

Pelin nimi, maailma, kortit, taide ja säännöt ovat alkuperäisiä. Peli ei käytä minkään olemassa olevan korttipelin nimiä, korttien nimiä, kuvitusta eikä sääntötekstejä (spec FR-025). "Minimasters" on vain sisäinen työnimi.

## Säännöt lyhyesti

- Kummallakin on 20 elämää. Elämät nollaan pudottanut häviää.
- Vuorolla voit pelata yhden **lähteen** (+1 energia pysyvästi). Energia täyttyy jokaisen vuoron alussa.
- Kortin pelaaminen vaatii energiaa ja vähintään yhden saman elementin lähteen (Ahjo, Kallio tai Usva).
- Pöydällä on 3 kaistaa. Olento hyökkää omaan kaistaansa, ja vastakkainen olento puolustaa automaattisesti. Tyhjästä kaistasta vahinko menee pelaajaan.
- Hyökkäys päättää vuoron.
- Jos pakka on tyhjä, jokainen nosto tekee sinulle kasvavaa vahinkoa: 1, 2, 3 …

## Ajo

```bash
powershell -File tools/serve.ps1
```

Avaa <http://localhost:8080/>. Peli käyttää ES-moduuleja, joten se tarvitsee HTTP-palvelimen.

## Testit

```bash
node tests/run-node.mjs
```

Tai selaimessa <http://localhost:8080/tests/>. Korttidatan tarkistus:

```bash
node tools/validate-cards.mjs
```

## Suunnitteludokumentit

Speksi, suunnitelma ja tehtävälista: [specs/001-booster-run-cardgame](specs/001-booster-run-cardgame/).
