# Research: Booster-run-korttipeli

Kaikki Technical Contextin avoimet kohdat on ratkaistu alla.

## R1. Alusta ja teknologia

- **Decision**: Peli tehdään HTML:llä, CSS:llä ja JavaScriptin ES-moduuleilla ilman build-vaihetta. Se toimii PWA:na ja paketoidaan Capacitor 8 -kääreellä Google Playhin.
- **Rationale**: Sama pino toimii jo Horse Racerissa (Travbana), josta saadaan valmiina Capacitor-kääre, ikoni- ja splash-skriptit, testiajuri ja allekirjoitusprosessi. Korttipeli on vuoropohjainen ja kevyt, joten DOM ja CSS-animaatiot riittävät 60 fps:ään. Kehityssykli on nopea: tallenna ja lataa sivu uudelleen.
- **Alternatives considered**:
  - *Godot*: hyvä 2D-moottori, mutta asentamaton ja vieras tälle pinolle, eikä tekstipainotteinen käyttöliittymä hyödy siitä.
  - *Unity*: raskas, ja APK kasvaa suureksi.
  - *Kotlin + Jetpack Compose*: natiivi, mutta peliä ei voisi testata selaimessa eikä jakaa PWA:na.
  - *Flutter*: ei asennettu, ja se toisi uuden kielen.

## R2. Sääntömoottorin arkkitehtuuri

- **Decision**: Moottori on puhdas, deterministinen tilakone: `applyAction(state, action) → { state, events }`. Tila on serialisoitavaa JSON-dataa, ja kaikki satunnaisuus tulee tilaan tallennetusta siemennetystä generaattorista (mulberry32). Käyttöliittymä toistaa tapahtumat animaatioina.
- **Rationale**: Determinismi mahdollistaa toistettavat testit, keskeytyksen jälkeisen jatkamisen (FR-022, SC-007), tekoälyn simuloinnin (kloonaa tila ja kokeile siirtoa) sekä bugien toistamisen toimintolokista. Tapahtumavirta pitää animaatiot erillään säännöistä.
- **Alternatives considered**: Olio-pohjainen malli, jossa korttiolioilla on metodeja. Se on vaikeampi serialisoida ja kloonata tekoälyä varten.

## R3. Korttien vaikutukset datana

- **Decision**: Kortit ovat JSON-dataa. Kortin vaikutus on lista primitiivejä (`damage`, `heal`, `draw`, `buff`, `summon`, `destroy`, `gainEnergy`, `bounce`, …), joihin liittyy laukaisin (`onPlay`, `onDeath`, `onAttack`, `startOfTurn`) ja kohde (`chosenEnemyUnit`, `allEnemyUnits`, `self`, `opponent`, …). Avainsanoja on enintään 8, ja ne toteutetaan moottorissa erikseen.
- **Rationale**: 120 korttia on liikaa käsin koodattavaksi, mutta noin 15 primitiiviä kattaa ne. Data voidaan validoida automaattisesti (FR-021: tekstin pituus, avainsanaraja), ja tasapainoa voidaan säätää koskematta koodiin. Kortin sääntöteksti generoidaan primitiiveistä i18n-pohjilla, joten teksti ja toiminta pysyvät aina samoina.
- **Alternatives considered**: Jokaiselle kortille oma skriptifunktio. Se olisi joustavampi, mutta vaikea testata ja kääntää.

## R4. Alkuperäiset säännöt (ero olemassa oleviin peleihin)

- **Decision**: Moottori toteuttaa omat sääntönsä. Niiden suunnitteluvalinnat poikkeavat tarkoituksella tutuista peleistä:
  - **Energia:** resurssikortti antaa pysyvästi +1 energiaa, ja energia täyttyy vuoron alussa.
  - **Ei pinoa eikä vastaliikkeitä:** vastustajan vuorolla ei pelata mitään, joten peli on aloittelijalle yksinkertainen ja ottelut nopeita.
  - **Kaistat:** pöydällä on 3 kaistaa. Olento hyökkää omassa kaistassaan, ja vastakkainen olento puolustaa automaattisesti. Tyhjästä kaistasta vahinko menee pelaajaan.
  - **Elementit:** kolme alkuperäistä elementtiä, joiden työnimet ovat Ahjo (aggressiivinen), Kallio (puolustava) ja Usva (ovela). Lopulliset nimet päätetään taidesuunnan yhteydessä.
  - **Lyhyt peli:** aloituskäsi 4 korttia, 20 elämää ja vuororaja 25 vuoroa pelaajaa kohden.
- **Rationale**: Kaistat ja automaattinen puolustus poistavat monimutkaisimmat päätökset (puolustajien valinta, pino), jotka hidastavat ja hämmentävät aloittelijaa. Samalla ne tekevät pelistä selvästi oman. Mekaniikat sinänsä (energia, olennot, loitsut) ovat genren yleisiä eivätkä kenenkään omaisuutta. Nimet, tekstit ja taide ovat uusia.
- **Alternatives considered**: Vapaa hyökkäys ja puolustajien valinta. Se olisi syvällisempi, mutta hitaampi ja lähempänä olemassa olevia pelejä.

## R5. Tekoäly

- **Decision**: Tekoäly on hakupohjainen. Se generoi lailliset siirtosarjat yhdelle vuorolle (rajattu leveys), simuloi ne kloonatulla tilalla ja pisteyttää lopputilan arviointifunktiolla (elämäero, pöydän voima kaistoittain, kortit kädessä, energian käyttö). Vastustajien tyylit ovat painovektoreita (aggressiivinen, puolustava, ahne). Vaikeutta säädetään hakuleveydellä, satunnaisella virheprosentilla ja pakkareseptin voimakkuudella.
- **Rationale**: Hakupohjainen tekoäly on helposti viritettävissä, deterministinen siemenellä ja nopea (vuorossa on vähän siirtoja kaistojen ansiosta). Alle 300 ms riittää keskitason puhelimella.
- **Alternatives considered**:
  - *Sääntöpohjainen tekoäly*: hauras ja paljon käsityötä.
  - *MCTS*: tarpeettoman raskas näin lyhyelle pelille.

## R6. Boosterin arvonta ja runin vaikeuskäyrä

- **Decision**: Booster arvotaan harvinaisuusslotteihin (6 tavallista, 3 epätavallista, 1 harvinainen; harvinaispaikalla 1/8 todennäköisyydellä myyttinen). Jos koostumussäännöt (FR-004) eivät täyty, booster arvotaan uudelleen enintään 50 kertaa. Viimeisenä keinona vaihdetaan yksittäisiä tavallisia kortteja. Vastustajat 1–7 on järjestetty kiinteästi vaikeuden mukaan, ja pakat kootaan resepteistä runin siemenellä. Vastustajan pakan koko ja harvinaisuus kasvavat voittojen myötä.
- **Rationale**: Uudelleenarvonta on yksinkertainen ja tilastollisesti reilu. Kiinteä vastustajajärjestys tekee etenemisestä luettavaa, ja siemenellä saadaan silti vaihtelua (SC-005).
- **Alternatives considered**: Painotettu arvonta, joka "korjaa" boosterin. Se on monimutkaisempi testata.

## R7. Alkuperäisyyden varmistus

- **Decision**: `tools/validate-cards.mjs` tarkistaa korttidatan kieltolistaa vasten (tunnettujen korttipelien tavaramerkit, tunnetut korttien nimet ja tunnusomaiset termit). Ennen julkaisua tehdään lisäksi manuaalinen sisältökatselmus. Kuvitus tuotetaan omana taidesuuntana, eikä kehotteissa mainita olemassa olevia pelejä tai taiteilijoita.
- **Rationale**: FR-025 on julkaisun kannalta kriittinen (Google Playn käytännöt ja tekijänoikeudet). Automaattinen tarkistus estää vahingot.
- **Alternatives considered**: Pelkkä manuaalinen katselmus. Se on altis unohduksille.

## R8. Tallennus ja jatkaminen

- **Decision**: `localStorage`-avaimet `mm.profile.v1` ja `mm.run.v1`. Run-tallennus sisältää runin tilan ja ottelun tilan (sis. RNG-tilan) ja kirjoitetaan jokaisen moottoritoiminnon jälkeen. Formaatissa on `version`-kenttä ja migraatioketju. Capacitorissa WebView:n localStorage säilyy sovelluspäivityksissä.
- **Rationale**: Tila on pieni (alle 50 kt), joten synkroninen kirjoitus on nopea. Determinismin ansiosta myös toimintoloki voidaan tallentaa vianetsintää varten.
- **Alternatives considered**: IndexedDB tai Capacitor Preferences. Ne ovat tarpeettomia näin pienelle datalle; vaihto on mahdollinen myöhemmin save.js:n takana.

## R9. Lokalisointi

- **Decision**: Käytössä ovat `data/i18n/fi.json` ja `en.json`. Kieli valitaan `navigator.language`-arvosta, ja muut kielet näytetään englanniksi. Korttitekstit generoidaan primitiiveistä kielikohtaisilla pohjilla.
- **Rationale**: FR-027, ja generoitu teksti pysyy aina samana kuin kortin toiminta.

## R10. Testaus ja tasapaino

- **Decision**: Testit ajetaan selaimessa ja Nodella. Tasapainosimulaatio (`balance.sim.js`) pelaa 1000 runia tekoälypelaajalla ja raportoi ottelun pituuden vuoroina ja arvioituna kestona, voittoprosentin vastustajittain, runin läpäisyprosentin sekä elementtien voittojakauman.
- **Rationale**: Mittaa suoraan SC-002:ta ja SC-006:ta ennen pelaajatestejä.
