# Feature Specification: Booster-run-korttipeli (työnimi "Minimasters")

**Feature Branch**: `001-booster-run-cardgame`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Alkuperäinen keräilykorttipeli (ei Magic: the Gathering -kopio: omat kortit, nimi, maailma, taide ja säännöt) Android-puhelimille Google Playhin, joka on suunniteltu Minimasters-formaatin hengessä: pelaaja avaa yhden pienen boosterin, rakentaa siitä ja ilmaisista perusresursseista nopeasti minipakan ja pelaa lyhyen ottelun (noin 5–10 min) tekoälyvastustajaa vastaan. Voitoista ansaitaan uusia boostereita, joilla minipakkaa kasvatetaan saman 'run'-kierroksen aikana; häviön jälkeen run päättyy. Painopiste: nopea pelattavuus, selkeät säännöt aloittelijalle, uudelleenpelattavuus satunnaisista boostereista."

## Pelin ydinidea

Pelaaja aloittaa jokaisen **runin** tyhjästä: hän avaa yhden pienen **boosterin** (satunnaisia kortteja), täydentää sen ilmaisilla **perusresursseilla** minipakaksi ja pelaa nopean kaksintaistelun tekoälyä vastaan. Jokaisesta voitosta saa uuden boosterin, jonka korteilla pakkaa vahvistetaan ennen seuraavaa, vaikeampaa vastustajaa. Ensimmäinen häviö päättää runin. Tavoite on edetä mahdollisimman pitkälle.

Peli on täysin alkuperäinen: oma nimi, maailma, korttisarja, taide, terminologia ja säännöt. Peli ei käytä minkään olemassa olevan korttipelin nimiä, korttien nimiä, kuvitusta, symboleja eikä sääntötekstejä. "Minimasters" on vain sisäinen työnimi, ja kauppanimi valitaan erikseen.

### Sääntöjen perusrunko (suunnittelutavoite, ei lopullinen tasapaino)

- Kummallakin pelaajalla on **20 elämäpistettä**; elämät nollaan pudottanut häviää.
- Korttityyppejä on kolme: **resurssikortit** (antavat energiaa), **olennot** (jäävät pöytään, hyökkäävät ja puolustavat) ja **loitsut** (kertakäyttöinen vaikutus).
- Kortit kuuluvat **kolmeen alkuperäiseen elementtiin**; jokaisella elementillä on oma pelityylinsä (esim. aggressiivinen, puolustava, ovela). Perusresursseja on yksi kutakin elementtiä kohden.
- Vuoron rakenne on yksinkertainen: nosta kortti → pelaa enintään yksi resurssi → pelaa kortteja energialla → hyökkää → vuoro päättyy.
- Kortin teksti on lyhyt ja käyttää pientä määrää avainsanoja (enintään noin 8 koko pelissä), joiden selitys näkyy napautuksella.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Avaa booster, rakenna minipakka ja pelaa yksi ottelu (Priority: P1)

Pelaaja käynnistää uuden runin, avaa boosterin animaation kera, valitsee siitä kortit pakkaansa, lisää perusresursseja ja pelaa yhden ottelun tekoälyvastustajaa vastaan, kunnes toinen voittaa.

**Why this priority**: Tämä on koko pelin ydinsilmukka. Ilman sitä ei ole peliä; sen avulla voidaan testata, onko pelaaminen hauskaa ja ymmärrettävää.

**Independent Test**: Testataan aloittamalla uusi run ja pelaamalla ottelu loppuun. Arvoa syntyy jo yhdestä täydestä ottelusta.

**Acceptance Scenarios**:

1. **Given** pelaaja on päävalikossa, **When** hän valitsee "Uusi run", **Then** hänelle avataan yksi booster ja sen kortit näytetään yksi kerrallaan tai kerralla rinnakkain.
2. **Given** booster on avattu, **When** pelaaja siirtyy pakanrakennukseen, **Then** kaikki boosterin kortit ovat valittavissa ja perusresursseja voi lisätä rajattomasti kunnes pakan koko on sallittu.
3. **Given** pelaaja ei halua rakentaa itse, **When** hän valitsee "Rakenna puolestani", **Then** peli kokoaa pelikelpoisen pakan, jossa on järkevä resurssimäärä ja elementtijakauma.
4. **Given** pakka on pelikelpoinen, **When** pelaaja aloittaa ottelun, **Then** ottelu alkaa, molemmat nostavat aloituskäden ja vuorot etenevät sääntöjen mukaan.
5. **Given** ottelu on käynnissä, **When** jommankumman elämät putoavat nollaan, **Then** ottelu päättyy ja voittaja näytetään selkeästi.

---

### User Story 2 - Etene runissa: voita, ansaitse booster ja vahvista pakkaa (Priority: P1)

Voiton jälkeen pelaaja saa uuden boosterin, lisää siitä kortteja pakkaansa (ja voi poistaa heikompia) ja kohtaa seuraavan, hieman vaikeamman vastustajan. Häviö päättää runin ja näyttää yhteenvedon.

**Why this priority**: Run-rakenne antaa pelille uudelleenpelattavuuden ja "vielä yksi kierros" -tunteen, joka on käyttäjän pyytämä keskeinen ominaisuus.

**Independent Test**: Voitetaan ottelu ja varmistetaan, että uusi booster avautuu, pakka muokkautuu ja seuraava vastustaja on eri ja vaikeampi; hävitään ja varmistetaan, että run päättyy.

**Acceptance Scenarios**:

1. **Given** pelaaja voittaa ottelun, **When** voittoruutu suljetaan, **Then** hänelle avataan uusi booster ja hän pääsee muokkaamaan pakkaansa ennen seuraavaa ottelua.
2. **Given** pelaaja on voittanut N ottelua, **When** seuraava ottelu alkaa, **Then** vastustajan vaikeustaso (pakan voimakkuus ja/tai tekoälyn taso) on vähintään yhtä suuri kuin edellisellä.
3. **Given** pelaaja häviää ottelun, **When** häviöruutu näytetään, **Then** run päättyy ja näkyvissä on yhteenveto: voitot, paras kortti, avatut boosterit ja oma ennätys.
4. **Given** pelaaja voittaa runin viimeisen (7.) ottelun, **When** ottelu päättyy, **Then** run päättyy voittoon ja siitä näytetään erillinen palkintoruutu.

---

### User Story 3 - Opi pelaamaan ilman ennakkotietoa (Priority: P2)

Aloittelija, joka ei ole pelannut keräilykorttipelejä, pelaa ohjatun opetusottelun, jossa säännöt esitellään vaihe kerrallaan, ja saa pelin aikana vihjeitä laillisista siirroista.

**Why this priority**: Käyttäjä painotti selkeitä sääntöjä aloittelijalle. Ilman opetusta suuri osa uusista pelaajista lopettaa ensimmäisen ottelun aikana.

**Independent Test**: Uusi käyttäjä, joka ei tunne peliä, pelaa opetuksen läpi ja pystyy sen jälkeen pelaamaan normaalin ottelun ilman apua.

**Acceptance Scenarios**:

1. **Given** peli käynnistetään ensimmäistä kertaa, **When** päävalikko avautuu, **Then** pelaajalle tarjotaan opetusottelua (jonka voi ohittaa).
2. **Given** opetusottelu on käynnissä, **When** uusi sääntö tulee ensimmäistä kertaa vastaan, **Then** se selitetään yhdellä lyhyellä ruudulla ja pelaaja tekee siirron itse.
3. **Given** normaali ottelu on käynnissä, **When** pelaaja napauttaa korttia tai avainsanaa, **Then** näkyviin tulee selitys selkokielellä.
4. **Given** pelaajan vuoro on käynnissä, **When** hän katsoo kättään, **Then** pelattavissa olevat kortit ja sallitut hyökkääjät on korostettu.

---

### User Story 4 - Jatka keskeytynyttä runia (Priority: P2)

Puhelinpelissä keskeytykset ovat yleisiä. Pelaaja voi sulkea sovelluksen kesken ottelun tai runin ja jatkaa myöhemmin täsmälleen samasta kohdasta.

**Why this priority**: 5–10 minuutin otteluissa ja usean ottelun runeissa keskeytys on todennäköinen; edistymisen menetys turhauttaa.

**Independent Test**: Suljetaan sovellus kesken ottelun, avataan uudelleen ja todetaan, että tila on sama.

**Acceptance Scenarios**:

1. **Given** pelaaja on kesken ottelun, **When** sovellus suljetaan tai puhelin käynnistetään uudelleen, **Then** seuraavalla avauskerralla päävalikossa on "Jatka run" ja ottelu jatkuu samasta tilasta.
2. **Given** keskeneräinen run on olemassa, **When** pelaaja valitsee "Uusi run", **Then** häneltä kysytään vahvistus ennen kuin vanha run hylätään.

---

### User Story 5 - Kokoelma ja ennätykset (Priority: P3)

Pelaaja näkee kaikki korttisarjan kortit, joista runien aikana nähdyt on avattu katseltaviksi, sekä ennätyksensä (pisin run, voitetut runit, pelatut ottelut).

**Why this priority**: Pitkän aikavälin motivaatio ja keräilyn tunne, mutta peli toimii ilman tätä.

**Independent Test**: Pelataan muutama run ja tarkistetaan, että nähdyt kortit näkyvät kokoelmassa ja ennätykset päivittyvät.

**Acceptance Scenarios**:

1. **Given** pelaaja on avannut kortin boosterista ensimmäistä kertaa, **When** hän avaa kokoelman, **Then** kortti näkyy siellä avattuna; näkemättömät kortit näkyvät siluetteina.
2. **Given** run päättyy, **When** pelaaja avaa ennätykset, **Then** luvut on päivitetty.

---

### Edge Cases

- Booster sisältää lähes pelkkiä yhden elementin kortteja tai vain kalliita kortteja: boosterin koostumussäännöt (ks. FR-004) estävät pelikelvottomat boosterit, ja automaattinen rakennus tuottaa silti pelattavan pakan.
- Pelaaja yrittää aloittaa ottelun liian pienellä tai liian suurella pakalla: aloitus estetään ja syy kerrotaan.
- Kumpikaan pelaaja ei voi tai halua edetä (esim. molemmat vain passaavat): ottelulla on vuororaja (25 vuoroa per pelaaja), jonka jälkeen enemmän elämää omaava voittaa; tasatilanteessa ottelu uusitaan samoilla pakoilla.
- Pakka loppuu: jokainen nosto tyhjästä pakasta tekee nostajalle kasvavaa vahinkoa (1, 2, 3 …). Ottelu ratkeaa siis aina elämien kautta, eikä pöydän jumittuminen johda arpapeliin siitä, kenen pakka loppuu ensin. (Päätetty 2026-11-14 tasapainosimulaation perusteella; aiemmin tyhjästä nostaminen hävisi heti.)
- Aloituskäsi on huono (ei resursseja tai pelkkiä resursseja): pelaaja saa kerran ottelun alussa vaihtaa koko käden uuteen.
- Sovellus kaatuu tai akku loppuu kesken siirron: tila palautetaan viimeisestä valmiista toiminnosta.
- Puhelimen kieli on muu kuin tuettu kieli: peli näytetään englanniksi.
- Hyvin pieni tai suuri näyttö, tabletti: kortit ja tekstit pysyvät luettavina ja kosketettavina.

## Requirements *(mandatory)*

### Functional Requirements

**Runi ja boosterit**

- **FR-001**: Pelaajan MUST pystyä aloittamaan uusi run päävalikosta; run alkaa aina tyhjästä kokoelmasta (aiempien runien kortit eivät siirry).
- **FR-002**: Jokaisen runin alussa MUST avata yksi booster, ja jokaisen voitetun ottelun jälkeen MUST avata yksi uusi booster.
- **FR-003**: Boosterissa MUST olla 10 korttia: 6 tavallista, 3 epätavallista ja 1 harvinainen tai sitä harvinaisempi.
- **FR-004**: Boosterin koostumuksen MUST taata pelattavuus: vähintään 5 olentoa, vähintään kahta elementtiä, ja vähintään 4 korttia, joiden hinta on 3 energiaa tai vähemmän.
- **FR-005**: Run MUST päättyä ensimmäiseen häviöön tai seitsemänteen voittoon.
- **FR-006**: Jokaisen ottelun vastustajan MUST olla vaikeampi tai yhtä vaikea kuin edellinen; vastustajia MUST olla vähintään 7 erilaista, ja kullakin oma nimi, ulkoasu ja pelityyli.

**Pakanrakennus**

- **FR-007**: Minipakan koon MUST olla 20–30 korttia, ja perusresursseja MUST olla rajattomasti saatavilla ilmaiseksi.
- **FR-008**: Pelaajan MUST voida lisätä ja poistaa kortteja pakasta vapaasti ennen jokaista ottelua runin sisällä.
- **FR-009**: Pakanrakennuksessa MUST näkyä energiakäyrä (korttien määrä hinnan mukaan) ja elementtijakauma.
- **FR-010**: Pelin MUST tarjota "Rakenna puolestani" -toiminto, joka tuottaa pelikelpoisen pakan pelaajan senhetkisistä korteista.
- **FR-011**: Pakanrakennuksen MUST olla mahdollista suorittaa alle 60 sekunnissa myös ilman automaattista rakennusta.

**Ottelu**

- **FR-012**: Ottelun MUST noudattaa kohdan "Sääntöjen perusrunko" kuvaamia sääntöjä; säännöt kuvataan yhdessä pelin sisäisessä sääntösivussa.
- **FR-013**: Peli MUST estää kaikki laittomat siirrot ja korostaa pelaajalle sallitut siirrot.
- **FR-014**: Pelaajan MUST pystyä vaihtamaan aloituskätensä kerran ottelun alussa.
- **FR-015**: Tekoälyvastustajan MUST tehdä siirtonsa niin nopeasti, ettei pelaaja joudu odottamaan yli 2 sekuntia yksittäistä siirtoa; tekoälyn siirrot MUST näyttää selvästi (mitä pelattiin ja mihin kohdistui).
- **FR-016**: Ottelussa MUST olla vuororaja ja ratkaisusääntö (ks. Edge Cases), jotta ottelu ei jatku loputtomiin.
- **FR-017**: Pelaajan MUST voida luovuttaa ottelu; luovutus lasketaan häviöksi.
- **FR-018**: Pelaajan MUST voida nopeuttaa tai ohittaa animaatioita.

**Opetus ja selkeys**

- **FR-019**: Pelin MUST tarjota ohjattu opetusottelu ensimmäisellä käynnistyskerralla; opetuksen MUST voida ohittaa ja käynnistää uudelleen myöhemmin.
- **FR-020**: Jokaisen avainsanan ja korttitekstin MUST olla napautettavissa selitykseksi selkokielellä.
- **FR-021**: Avainsanoja MUST olla koko pelissä enintään 8, ja yksittäisen kortin sääntöteksti MUST mahtua enintään kolmelle riville.

**Tallennus ja edistyminen**

- **FR-022**: Keskeneräisen runin ja ottelun tilan MUST tallentua jokaisen valmiin toiminnon jälkeen, ja sen MUST voida jatkaa sovelluksen uudelleenkäynnistyksen jälkeen.
- **FR-023**: Pelin MUST pitää kirjaa ennätyksistä (pisin run, voitetut runit, pelatut ottelut) ja kokoelmasta (nähdyt kortit).

**Sisältö ja alkuperäisyys**

- **FR-024**: Korttisarjassa MUST olla julkaisussa vähintään 120 erilaista korttia kolmessa elementissä.
- **FR-025**: Kaikki nimet, kortit, kuvitus, symbolit, terminologia ja sääntötekstit MUST olla alkuperäisiä; peli EI SAA käyttää olemassa olevien korttipelien tavaramerkkejä, korttien nimiä, kuvitusta tai tunnistettavaa visuaalista tyyliä.
- **FR-026**: Pelin MUST toimia kokonaan ilman verkkoyhteyttä.
- **FR-027**: Pelin tekstien MUST olla saatavilla suomeksi ja englanniksi.

### Key Entities

- **Kortti**: Korttisarjan yksittäinen kortti. Ominaisuudet: nimi, tyyppi (resurssi, olento, loitsu), elementti, hinta energiana, harvinaisuus, voima ja kestävyys (olennoilla), avainsanat, sääntöteksti, kuvitus.
- **Korttisarja**: Kaikkien pelin korttien joukko, josta boosterit arvotaan.
- **Booster**: 10 kortin satunnainen nippu, jonka koostumus noudattaa harvinaisuus- ja pelattavuussääntöjä.
- **Run**: Yksi pelikierros alusta häviöön tai 7 voittoon. Sisältää runin kortit, nykyisen pakan, voittojen määrän ja kohdatut vastustajat.
- **Minipakka**: Runin korteista ja perusresursseista koottu 20–30 kortin pakka.
- **Vastustaja**: Tekoälyhahmo, jolla on nimi, ulkoasu, pelityyli, vaikeustaso ja pakka.
- **Ottelu**: Kahden pelaajan kaksintaistelu; sisältää elämät, kädet, pöydän, pakat, poistopinot ja vuorohistorian.
- **Pelaajaprofiili**: Ennätykset, kokoelman nähdyt kortit, asetukset ja opetuksen tila.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uusi pelaaja pääsee sovelluksen avaamisesta ensimmäiseen otteluvuoroon alle 3 minuutissa (opetus mukaan lukien alle 6 minuutissa).
- **SC-002**: 80 % otteluista kestää 5–10 minuuttia, eikä mikään ottelu kestä yli 15 minuuttia.
- **SC-003**: Vähintään 85 % testaajista, joilla ei ole kokemusta keräilykorttipeleistä, pelaa opetuksen jälkeen ottelun loppuun ilman ulkopuolista apua.
- **SC-004**: Vähintään 60 % testaajista aloittaa uuden runin heti ensimmäisen runinsa päätyttyä.
- **SC-005**: Kahdessa peräkkäisessä runissa vähintään 70 % boostereista avautuvista korteista on eri kortteja (riittävä vaihtelu).
- **SC-006**: Ensimmäisen vastustajan voittaa yli 75 % pelaajista ja koko runin (7 voittoa) 5–15 % runeista.
- **SC-007**: Keskeytyksen jälkeen 100 % keskeneräisistä otteluista jatkuu samasta tilasta.
- **SC-008**: Tekoälyn siirto kestää pelaajan näkökulmasta enintään 2 sekuntia 95 %:ssa siirroista.

## Assumptions

- Peli on yksinpeli tekoälyä vastaan; verkkomoninpeli, kaverihaasteet ja tulostaulukot rajataan pois ensimmäisestä versiosta.
- Ensimmäisessä versiossa ei ole sovelluksen sisäisiä ostoja eikä mainoksia; ansaintamalli päätetään myöhemmin erillisenä ominaisuutena.
- Boostereita ei voi ostaa eikä siirtää runista toiseen; jokainen run on itsenäinen ja kaikilla pelaajilla on samat lähtökohdat.
- Kohdealusta on Android-puhelimet (pystysuunta), julkaisu Google Playssa; tabletit tuetaan skaalautuvana näkymänä.
- Pelaaja ei tarvitse käyttäjätiliä; kaikki tieto tallennetaan vain laitteelle, eikä henkilötietoja kerätä.
- Ikäluokitus tavoitellaan kaikille sopivaksi (ei realistista väkivaltaa, ei rahapelimekaniikkaa oikealla rahalla).
- Taide tuotetaan erikseen; alkuperäisyysvaatimus (FR-025) koskee myös tekoälyllä tuotettua kuvitusta.
- Sääntöjen perusrungon numeroarvot (elämät, pakan koko, boosterin koko, runin pituus) ovat lähtöarvoja, joita tasapainotetaan pelitestauksen perusteella.
