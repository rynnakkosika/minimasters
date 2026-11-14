# Balance notes

Simulaatio: `node tests/balance.sim.js --runs 300`. Pelaajamalli on tekoäly (`searchDepth 2`, `blunderRate 0.1`), joka rakentaa pakkansa "Rakenna puolestani" -toiminnolla jokaisen boosterin jälkeen. Kesto on arvio: pelaajan vuoro 22 s ja tekoälyn vuoro 7 s.

## 2026-11-14 — 30 testikorttia, 7 vastustajaa (US2)

| Mittari | Tulos | Tavoite |
|---------|-------|---------|
| Vastustaja 1 voitetaan | 70 % | yli 75 % (SC-006) |
| Koko run läpäistään | 4 % | 5–15 % (SC-006) |
| Ottelun kesto 5–10 min | 55 %, mediaani 5,3 min, pisin 10,3 min | 80 %, ei yli 15 min (SC-002) |
| Päättymissyy | elämät 79 %, pakka loppui 21 % | — |

Voittoprosentit vastustajittain: 70, 91, 72, 53, 47, 59, 55 (otokset pienenevät loppua kohden).

### Havainnot

1. **Pakan loppuminen ratkaisee liian monta ottelua.** Ensimmäistä vastustajaa vastaan 34/58 tappiosta tuli pakan loppumisesta. 20 kortin pakat loppuvat noin 17. vuorolla, ja automaattisen puolustuksen vuoksi pöytä jumittuu helposti. Vaihtoehtoja:
   - pakan loppuminen ei häviä heti, vaan nosto tyhjästä pakasta tekee kasvavaa vahinkoa
   - minipakan vähimmäiskoko nostetaan 24 korttiin
   - lisää korttisarjaan kortteja, jotka ohittavat puolustajan tai lopettavat jumin (laaja sarja T059–T061)

   Valinta muuttaa speksin sääntöä, joten se jätetään käyttäjän päätettäväksi.
2. **Ensimmäinen pakka on kolmen elementin pakka.** Yhdestä boosterista tulee 10 korttia kolmesta elementistä, ja elementtivaatimus aiheuttaa välillä "väärän lähteen" käsiä. Tämä tasoittuu, kun pooli kasvaa.
3. **Usvalla on heikoin voittoprosentti** (64 % vs. Ahjo 72 % ja Kallio 73 %): paljon nostoa, vähän vahinkoa.
4. Toinen vastustaja (Usva + Ahjo) on selvästi helpompi kuin ensimmäinen, vaikka sen tekoäly on vahvempi. Pakkaresepti kannattaa tarkistaa laajemman korttisarjan myötä.

## 2026-11-14 — kasvava vahinko tyhjästä pakasta

Päätös: nosto tyhjästä pakasta ei enää häviä heti, vaan tekee nostajalle kasvavaa vahinkoa (1, 2, 3 …). Speksin Edge Cases -kohta on päivitetty.

| Mittari | Ennen | Nyt | Tavoite |
|---------|-------|-----|---------|
| Vastustaja 1 voitetaan | 70 % | 79 % | yli 75 % ✓ |
| Koko run läpäistään | 4 % | 5 % | 5–15 % ✓ (alarajalla) |
| Ottelun kesto 5–10 min | 55 % | 57 %, mediaani 5,3 min, pisin 11,2 min | 80 %, ei yli 15 min |
| Päättymissyy | pakka loppui 21 % | elämät 100 % | — |

Voittoprosentit vastustajittain: 79, 89, 72, 55, 49, 60, 58. Elementtien voittoprosentit tasoittuivat: Ahjo 73 %, Kallio 75 %, Usva 69 % (ennen 64 %).

Avoinna:
- **Ottelut ovat arvion mukaan usein alle 5 minuuttia.** Arvio perustuu oletettuun vuoron kestoon, joten se tarkistetaan oikeilla pelaajilla (SC-002).
- **Vastustaja 2 on helpompi kuin 1.** Järjestys kannattaa tarkistaa laajemman korttisarjan myötä.

## 2026-11-14 — täysi sarja: 120 boosterikorttia

Lisätty 90 korttia (30 per elementti) ja yksi kutsuttava olento (Taimi). Jakauma per elementti: 20 tavallista, 12 epätavallista, 6 harvinaista ja 2 myyttistä. Vastustajien tekoälyä ja myöhäisten vastustajien pakkoja kevennettiin hieman.

| Mittari | Tulos (400 runia) | Tavoite |
|---------|-------------------|---------|
| Vastustaja 1 voitetaan | 77 % | yli 75 % ✓ |
| Koko run läpäistään | 5 % | 5–15 % ✓ (alarajalla) |
| Ottelun kesto 5–10 min | 58 %, mediaani 5,3 min, pisin 12,1 min | 80 %, ei yli 15 min |

Voittoprosentit vastustajittain: 77, 89, 69, 57, 59, 58, 54. Elementit: Kallio 74 %, Ahjo 73 %, Usva 68 %.

Havaintoja:
- **Pakan sisältö vaikuttaa enemmän kuin tekoälyn parametrit.** Haun syvyyden ja virheprosentin säätö muutti tuloksia vain muutaman prosenttiyksikön, harvinaisten korttien määrä selvästi enemmän.
- **Vastustaja 2 on edelleen helpompi kuin 1 ja 3.** Ensimmäinen vastustaja on silti tarkoituksella pehmeä, ja pelaajan ensimmäinen pakka on yhden boosterin pakka.
- **Seuraava tarkistus pitää tehdä oikeilla pelaajilla:** ottelun kesto (SC-002) ja aloittelijan läpäisy (SC-003, SC-006).

## 2026-11-14 — ei pakanrakennusta (Minimasters-sääntö)

Käyttäjän pyynnöstä pakkaa ei enää rakenneta: kaikki avatut kortit menevät pakkaan, ja lähteet lisätään automaattisesti (0,7 per kortti, vähintään 20 korttia). Vastustajat pelaavat samalla periaatteella: n:s vastustaja avaa 1–4 boosteria (1, 1, 1, 2, 2, 3, 4) ja pelaa niistä omien elementtiensä kortit. Tekoälyn virheprosentit nostettiin 0,45–0,2:een.

| Mittari | Tulos (500 runia) | Tavoite |
|---------|-------------------|---------|
| Vastustaja 1 voitetaan | 76 % | yli 75 % ✓ |
| Koko run läpäistään | 3 % | 5–15 % ✗ |
| Ottelun kesto 5–10 min | 51 %, mediaani 5,2 min | 80 % |

Voittoprosentit vastustajittain: 76, 85, 75, 70, 45, 51, 37.

Havaintoja:
- **Pakan kokoaminen ei ole enää pelaajan käsissä,** joten vaihtelu kasvoi. Kokeiltiin lähdesuhteita 0,6–1,0, peilattuja vastustajapakkoja ja tekoälyn säätöä. Mikään ei nostanut läpäisyä yli 3 %:n.
- **Loppupäässä pelaajan 50–60 kortin kolmen elementin pakka** häviää vastustajien suppeille kahden elementin pakoille.
- **Mahdollisia jatkokeinoja** (ei toteutettu): lyhyempi run, pakan enimmäiskoko (esimerkiksi viimeisimmät boosterit) tai elementin valinta runin alussa. Näitä kannattaa arvioida oikeiden pelaajien kokemusten perusteella.
