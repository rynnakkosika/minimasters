# Minimasters (työnimi)

Alkuperäinen keräilykorttipeli puhelimille. Jokainen **run** alkaa tyhjästä: avaat 10 kortin boosterin, kokoat siitä ja ilmaisista perusresursseista minipakan ja kohtaat tekoälyvastustajan. Jokainen voitto antaa uuden boosterin ja vaikeamman vastustajan, ja ensimmäinen häviö päättää runin.

Pelin nimi, maailma, kortit, taide ja säännöt ovat alkuperäisiä. Peli ei käytä minkään olemassa olevan korttipelin nimiä, korttien nimiä, kuvitusta eikä sääntötekstejä (spec FR-025). "Minimasters" on vain sisäinen työnimi.

## Pelaa

**Selaimessa:** <https://rynnakkosika.github.io/minimasters/> – toimii puhelimella ja tietokoneella. Puhelimella valitse selaimen valikosta *Lisää aloitusnäyttöön*, niin peli aukeaa kuin sovellus ja toimii myös ilman verkkoa.

Sivu päivittyy automaattisesti, kun `main`-haaraan pushataan.

## Pelaa kaverin kanssa

Valitse **Pelaa kaverin kanssa → Luo peli**. Saat 6-merkkisen pelikoodin ja kutsulinkin (`?peli=KOODI`). Kaveri avaa linkin tai valitsee **Liity** ja kirjoittaa koodin, ja ottelu alkaa kummallakin. Kumpikin saa uuden boosterin, josta pakka kootaan automaattisesti; boosterit ja sekoitukset lasketaan yhteisestä ottelun siemenestä.

- Isännän laite on erotuomari: kaverin siirto hyväksytään vain, jos se kuuluu sillä hetkellä sallittuihin siirtoihin. Laitteet lähettävät toisilleen vain siirtoja, eivät pelitilaa.
- Jos kaveri katoaa, isännälle näytetään ilmoitus ja tekoäly pelaa ottelun loppuun kaverin puolesta. Jos isäntä katoaa, kaveri palaa valikkoon.
- Yhteys on vertaisyhteys (WebRTC). Ilmainen julkinen PeerJS-palvelin vain esittelee laitteet toisilleen, ja PeerJS-kirjasto ladataan vasta kun peli luodaan tai siihen liitytään. Yksinpeli ei käytä verkkoa.
- Kaveriottelu ei vaikuta runiin, ennätyksiin eikä tallennuksiin.
- Kaverin on päästävä peliin verkosta, joten pelin verkkoversion pitää olla julkaistu. Linkki `localhost`-osoitteeseen toimii vain omalla koneella (kahdella välilehdellä voi testata).

Speksi: [specs/002-friend-play](specs/002-friend-play/). Koodi: `src/net/protocol.js` (puhdas protokolla ja erotuomari), `src/net/peer.js` (PeerJS-yhteys), `src/ui/screens/friend.js` (näkymä ja verkkosessiot).

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

Speksi, suunnitelma ja tehtävälista: [specs/001-booster-run-cardgame](specs/001-booster-run-cardgame/) (yksinpeli) ja [specs/002-friend-play](specs/002-friend-play/) (kaveripeli).
