# Feature Specification: Pelaa kaverin kanssa

**Feature Branch**: `002-friend-play`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Pelaa kaverin kanssa: kaksi pelaajaa pelaa omilla puhelimillaan yhden Minimasters-ottelun toisiaan vastaan internetin yli. Isäntä luo pelin ja saa 6-merkkisen koodin ja kutsulinkin; kaveri avaa linkin tai kirjoittaa koodin. Isännän laite toimii erotuomarina ja tarkistaa jokaisen vastaanotetun siirron sääntöjen mukaisiksi. Kumpikin saa oman, yhteisestä ottelun siemenestä arvotun boosterin ja Rakenna puolestani -pakan. Yhteyden katketessa näytetään viesti; isäntä voi pelata ottelun loppuun tekoälyä vastaan, kaveri palaa valikkoon. Kaveriottelut eivät vaikuta runeihin, ennätyksiin eivätkä tallennuksiin. Tietosuojaselosteeseen lisätään maininta yhteyden välittäjäpalvelusta ja IP-osoitteiden näkymisestä."

## Ominaisuuden ydinidea

Versio 1 oli pelkkä yksinpeli. Nyt kaksi kaveria voi pelata yhden ottelun toisiaan vastaan kumpikin omalla puhelimellaan. Ottelu käyttää täsmälleen samoja sääntöjä ja samaa otteluruutua kuin yksinpeli; ainoa ero on, että vastustajan siirrot tekee toinen ihminen tekoälyn sijaan.

Jotta ottelu olisi reilu ja nopea aloittaa, kumpikaan ei rakenna pakkaa itse: kumpikin saa yhden uuden boosterin ja siitä automaattisesti kootun pakan. Boosterit arvotaan ottelun yhteisestä siemenestä, joten kumpikin laite tietää täsmälleen samat pakat ilman että niitä tarvitsee lähettää.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Luo peli ja pelaa kaveria vastaan (Priority: P1)

Isäntä valitsee päävalikosta "Pelaa kaverin kanssa" → "Luo peli". Hän saa 6-merkkisen pelikoodin ja kutsulinkin, jonka hän voi jakaa. Kaveri avaa linkin (tai valitsee "Liity" ja kirjoittaa koodin). Kun kaveri on yhdistänyt, ottelu alkaa kummallakin automaattisesti ja pelataan loppuun.

**Why this priority**: Tämä on koko ominaisuus. Ilman sitä kaverit eivät voi pelata keskenään.

**Independent Test**: Avataan peli kahdessa selainikkunassa, luodaan peli toisessa ja liitytään koodilla toisessa; pelataan ottelu loppuun ja varmistetaan, että molemmat näkevät saman pelitilanteen ja saman lopputuloksen.

**Acceptance Scenarios**:

1. **Given** isäntä on päävalikossa, **When** hän valitsee "Pelaa kaverin kanssa" → "Luo peli", **Then** näytetään 6-merkkinen koodi, kutsulinkki, jakopainike ja teksti "Odotetaan kaveria…".
2. **Given** kaveri on saanut koodin, **When** hän valitsee "Liity", kirjoittaa koodin ja vahvistaa, **Then** yhteys muodostuu ja kummallakin alkaa sama ottelu.
3. **Given** kaveri on saanut kutsulinkin, **When** hän avaa sen, **Then** peli avautuu suoraan liittymisruutuun koodi valmiiksi täytettynä ja yhdistää ilman lisävalintoja.
4. **Given** ottelu on käynnissä, **When** vuorossa oleva pelaaja tekee siirron, **Then** sama siirto näkyy toisen pelaajan laitteella (vastustajan siirtona isolla, kuten yksinpelissä) ja pelitilanne on kummallakin sama.
5. **Given** ottelu on käynnissä, **When** vuorossa ei ole pelaaja itse, **Then** hän ei voi pelata kortteja eikä hyökätä, ja ruudulla lukee, että vastustaja on vuorossa.
6. **Given** ottelu päättyy, **When** tulosruutu näytetään, **Then** voittaja näkee voiton ja häviäjä häviön; jatkopainike vie päävalikkoon.

---

### User Story 2 - Reilut pakat ilman pakanrakennusta (Priority: P1)

Kumpikin pelaaja saa ottelun alussa oman, uuden boosterin, josta peli kokoaa pakan "Rakenna puolestani" -säännöillä. Molemmat laitteet päätyvät samoihin pakkoihin.

**Why this priority**: Ilman pakkoja ottelua ei voi pelata, ja oma pakanrakennus kahdella laitteella hidastaisi aloitusta ja vaatisi lisää synkronointia.

**Independent Test**: Lasketaan sama ottelun siemen kahdesti ja varmistetaan, että molemmat pakat ovat identtiset ja pelikelpoiset (pakan sääntöjen mukaiset).

**Acceptance Scenarios**:

1. **Given** ottelu alkaa, **When** pakat muodostetaan, **Then** kummallakin pelaajalla on eri booster ja pelikelpoinen pakka, jossa on 20–30 korttia ja resursseja.
2. **Given** sama ottelun siemen, **When** pakat muodostetaan kahdella laitteella, **Then** pakat ja aloituskädet ovat molemmilla laitteilla täsmälleen samat.
3. **Given** ottelu alkaa, **When** aloittaja arvotaan, **Then** aloittaja on yhtä todennäköisesti isäntä tai kaveri.

---

### User Story 3 - Isäntä erotuomarina: virheelliset siirrot eivät mene läpi (Priority: P1)

Isännän laite on ottelun erotuomari. Jokainen kaverilta saapuva siirto tarkistetaan sääntöjä vasten ennen kuin se hyväksytään; sääntöjen vastainen, väärän pelaajan tai rikkinäinen viesti hylätään eikä se muuta pelitilannetta.

**Why this priority**: Ilman tarkistusta yksi virheellinen tai muokattu viesti voisi rikkoa ottelun tai antaa epäreilun edun.

**Independent Test**: Syötetään erotuomarille sääntöjen vastaisia, väärän pelaajan nimissä tehtyjä ja rikkinäisiä viestejä ja varmistetaan, että ne hylätään ja pelitilanne pysyy ennallaan.

**Acceptance Scenarios**:

1. **Given** on kaverin vuoro, **When** kaverin laitteelta tulee sääntöjen mukainen siirto, **Then** isäntä hyväksyy sen ja välittää sen takaisin vahvistuksena.
2. **Given** kaverin laitteelta tulee siirto isännän nimissä, sääntöjen vastainen siirto tai tunnistamaton viesti, **When** isäntä käsittelee sen, **Then** se hylätään, pelitilanne ei muutu ja kaverin laite palaa odottamaan omaa siirtoa.
3. **Given** laitteiden pelitilanteet ovat jostain syystä eronneet, **When** kaverin laite huomaa, ettei saapunut siirto sovi sen tilanteeseen, **Then** se pyytää isännältä koko ottelun siirtohistorian ja palauttaa saman tilanteen.

---

### User Story 4 - Yhteys katkeaa (Priority: P2)

Jos yhteys katkeaa kesken ottelun, kumpikin saa selkeän ilmoituksen. Isäntä voi pelata ottelun loppuun tekoälyä vastaan (tekoäly ottaa kaverin puolen). Kaveri palaa päävalikkoon.

**Why this priority**: Mobiiliyhteydet katkeavat usein; ilman käsittelyä peli jäisi jumiin odottamaan.

**Independent Test**: Suljetaan kaverin ikkuna kesken ottelun ja varmistetaan, että isäntä saa ilmoituksen ja tekoäly jatkaa; suljetaan isännän ikkuna ja varmistetaan, että kaveri saa ilmoituksen ja pääsee valikkoon.

**Acceptance Scenarios**:

1. **Given** ottelu on käynnissä, **When** kaverin yhteys katkeaa, **Then** isäntä näkee viestin "Kaveri poistui – tekoäly jatkaa hänen puolestaan" ja ottelu jatkuu tekoälyä vastaan.
2. **Given** ottelu on käynnissä, **When** isännän yhteys katkeaa, **Then** kaveri näkee viestin yhteyden katkeamisesta ja painikkeen, joka vie päävalikkoon.
3. **Given** kumpikaan ei ole vielä yhdistänyt, **When** koodia ei löydy tai yhteys ei muodostu, **Then** näytetään ymmärrettävä virheilmoitus ja mahdollisuus yrittää uudelleen.

---

### User Story 5 - Yksinpeli pysyy ennallaan (Priority: P2)

Kaveriottelu ei koske meneillään olevaan runiin, ennätyksiin eikä kokoelmaan, eikä yksinpeli käytä verkkoa lainkaan.

**Why this priority**: Pelaajan tallennettu run ja ennätykset eivät saa kadota tai muuttua kaveripelin takia, ja peli toimii edelleen täysin ilman verkkoa.

**Independent Test**: Aloitetaan run, pelataan välissä kaveriottelu ja varmistetaan, että run jatkuu samasta kohdasta ja ennätykset ovat ennallaan; tarkistetaan, ettei yksinpeli lataa verkosta mitään.

**Acceptance Scenarios**:

1. **Given** pelaajalla on keskeneräinen run, **When** hän pelaa kaveriottelun ja palaa valikkoon, **Then** "Jatka runia" jatkaa samasta kohdasta.
2. **Given** pelaaja ei avaa kaverivalikkoa, **When** hän pelaa yksinpeliä, **Then** peli ei ota yhteyttä mihinkään palveluun.

### Edge Cases

- Kolmas laite yrittää liittyä samaan peliin: se ei pääse mukaan, ottelu jatkuu kahden kesken.
- Kaveri luovuttaa (taukovalikko → Luovuta): ottelu päättyy isännän voittoon molemmilla.
- Molemmat valitsevat aloituskäden (uusi käsi / pidä) yhtä aikaa: valinnat käsitellään aina samassa järjestyksessä, joten tilanne on molemmilla sama.
- Kaveri lähettää siirron juuri, kun vuoro vaihtui: siirto hylätään eikä tilanne muutu.
- Kutsulinkki avataan, kun peliä ei enää ole: näytetään "Peliä ei löytynyt".
- Pelikoodi kirjoitetaan pienillä kirjaimilla tai välilyönneillä: koodi siistitään automaattisesti.
- Verkkokirjastoa ei saada ladattua (ei nettiä): kerrotaan, että kaveripeli vaatii internetyhteyden.
- Peliä ajetaan omalta koneelta (localhost) ja kutsulinkki jaetaan: linkki toimii vain samalla koneella; ohjeissa kerrotaan, että pelin verkkoversio on julkaistava.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Päävalikossa MUST olla painike "Pelaa kaverin kanssa", josta pääsee valitsemaan "Luo peli" tai "Liity".
- **FR-002**: "Luo peli" MUST näyttää 6-merkkisen pelikoodin (ilman sekaantuvia merkkejä kuten O/0 ja I/1), kutsulinkin sekä jakopainikkeen.
- **FR-003**: "Liity" MUST ottaa vastaan pelikoodin; koodi MUST siistiä isoiksi kirjaimiksi ja poistaa muut merkit.
- **FR-004**: Kutsulinkin avaaminen MUST viedä suoraan liittymiseen koodi valmiiksi täytettynä.
- **FR-005**: Peliin MUST päästä tasan kaksi pelaajaa; myöhemmät liittyjät MUST torjua.
- **FR-006**: Verkkoyhteyden tarvitsema kirjasto MUST ladata vasta, kun kaverivalikko avataan; yksinpeli MUST toimia ilman verkkoa.
- **FR-007**: Laitteiden välinen yhteys MUST olla suora (vertaisyhteys); välittäjäpalvelua MUST käyttää vain laitteiden esittelyyn toisilleen.
- **FR-008**: Ottelu MUST käyttää samoja sääntöjä ja samaa otteluruutua kuin yksinpeli; kumpikin näkee itsensä alhaalla ja vastustajan ylhäällä.
- **FR-009**: Ottelun MUST alkaa yhteisestä siemenestä, jonka isäntä arpoo; siemenestä MUST johtaa kummankin pelaajan booster, pakka (Rakenna puolestani -säännöillä), sekoitus ja aloittaja.
- **FR-010**: Laitteet MUST synkronoida ottelun lähettämällä siirtoja, ei koko pelitilannetta; jokaisella siirrolla MUST olla järjestysnumero.
- **FR-011**: Isännän laite MUST olla erotuomari: kaverin siirto MUST hyväksyä vain, jos se on kaverin oma ja kuuluu sillä hetkellä sallittuihin siirtoihin; muut MUST hylätä muuttamatta pelitilannetta.
- **FR-012**: Kaverin laite MUST soveltaa siirrot vain isännän vahvistamassa järjestyksessä (myös omat siirtonsa), jotta molempien tilanne pysyy samana.
- **FR-013**: Jos kaverin laitteen tilanne ei sovi saapuneeseen siirtoon, sen MUST pyytää isännältä koko siirtohistoria ja rakentaa tilanne uudelleen siitä.
- **FR-014**: Yhteyden katkeaminen MUST havaita viimeistään noin 15 sekunnissa myös silloin, kun toinen laite vain katoaa.
- **FR-015**: Kun kaveri katoaa, isännän MUST nähdä ilmoitus, ja tekoälyn MUST jatkaa kaverin puolesta ottelun loppuun.
- **FR-016**: Kun isäntä katoaa, kaverin MUST nähdä ilmoitus ja painike päävalikkoon.
- **FR-017**: Kaveriottelu MUST NOT muuttaa meneillään olevaa runia, ennätyksiä, kokoelmaa eikä tallennuksia.
- **FR-018**: Molempien laitteiden pelin MUST olla samaa protokollaversiota; eri versioiden kohdatessa MUST näyttää viesti "Päivitä peli".
- **FR-019**: Tietosuojaselosteessa MUST kertoa, että kaveripeli käyttää yhteyden muodostamiseen ulkopuolista välittäjäpalvelua ja että vertaisyhteydessä laitteet näkevät toistensa IP-osoitteet; pelin sisältöä ei tallenneta mihinkään.
- **FR-020**: Kaikki uudet tekstit MUST olla suomeksi ja englanniksi kuten muukin peli.

### Key Entities

- **Kaveripeli (FriendGame)**: pelikoodi, rooli (isäntä/kaveri), yhteyden tila, ottelun siemen, protokollaversio.
- **Siirtoviesti**: järjestysnumero ja yksi pelin siirto (sama muoto, jota pelimoottori käyttää).
- **Ottelun alku**: siemen, josta molempien pakat, sekoitus ja aloittaja lasketaan.
- **Siirtohistoria**: kaikki hyväksytyt siirrot järjestyksessä; siemen + historia riittää palauttamaan tilanteen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kaksi pelaajaa pääsee pelikoodin jakamisesta ottelun alkuun alle 30 sekunnissa toimivalla yhteydellä.
- **SC-002**: Täyden ottelun lopussa molempien laitteiden pelitilanne ja lopputulos ovat identtiset 100 %:ssa testiotteluista.
- **SC-003**: 100 % sääntöjen vastaisista, väärän pelaajan tai rikkinäisistä testiviesteistä hylätään ilman tilanteen muutosta.
- **SC-004**: Vastustajan siirto näkyy omalla laitteella alle sekunnissa normaalilla yhteydellä (ennen animaatiota).
- **SC-005**: Yhteyden katkeamisesta ilmoitetaan alle 15 sekunnissa, eikä kumpikaan pelaaja jää jumiin.
- **SC-006**: Yksinpelin tallennukset ja ennätykset ovat kaveriottelun jälkeen bitilleen ennallaan.

## Assumptions

- Molemmat pelaajat käyttävät samaa pelin versiota (verkkoversio tai Android-sovellus), ja pelin verkkoversio on julkaistu verkkoon, jotta kaveri voi avata kutsulinkin. Julkaisu on käyttäjän oma päätös eikä kuulu tähän ominaisuuteen.
- Laitteiden esittelyyn käytetään ilmaista julkista välittäjäpalvelua; ottelun siirrot kulkevat suoraan laitteiden välillä.
- Kaveripeli on yksi ottelu kerrallaan, ei runia eikä otteluhistoriaa. Kaveriottelusta ei jää tallennusta: jos sovellus suljetaan, ottelu päättyy.
- Kummallakin laitteella ajetaan sama pelimoottori, joten vastustajan käsi ja pakka ovat teknisesti laitteen muistissa. Kaveripeli on luottamuksellinen leikki kavereiden kesken, joten tämä hyväksytään; ruudulla vastustajan kortit pysyvät piilossa kuten yksinpelissä.
- Pelaajat eivät nimeä itseään; vastustaja näkyy nimellä "Kaveri".
- Tekoäly, joka jatkaa katkenneen kaverin puolesta, käyttää yksinpelin keskitason tekoälyä.
