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
