# Contract: Näkymät ja siirtymät

Sovellus on pystysuuntainen ja toimii 360 px leveydestä alkaen. Kosketuskohteet ovat vähintään 44 px. Androidin takaisin-painike vie aina edelliseen näkymään, ja ottelussa se avaa tauko- ja luovutusvalikon.

```text
Päävalikko ─┬─ Jatka run ─────────────→ (viimeisin run-näkymä)
            ├─ Uusi run ─(vahvistus jos keskeneräinen)→ Booster
            ├─ Opetus ────────────────→ Opetusottelu → Päävalikko
            ├─ Kokoelma
            ├─ Ennätykset
            ├─ Säännöt
            └─ Asetukset (kieli, animaationopeus, äänet, vihjeet)

Booster → Pakanrakennus → Vastustajan esittely → Ottelu ─┬─ voitto (<7) → Voittoruutu → Booster
                                                         ├─ voitto (=7) → Runin voitto → Yhteenveto
                                                         └─ häviö → Yhteenveto → Päävalikko
```

| Näkymä | Pakolliset elementit | Vaatimukset |
|--------|----------------------|-------------|
| Päävalikko | Jatka (näkyy vain, jos run on kesken), Uusi run, Opetus, Kokoelma, Ennätykset, Säännöt, Asetukset | US4, FR-019 |
| Booster | Korttien paljastus, "Paljasta kaikki" | FR-002 |
| Pakanrakennus | Pooli, pakka, perusresurssien +/- painikkeet, energiakäyrä, elementtijakauma, laskuri 20–30, "Rakenna puolestani", "Pelaa" (pois käytöstä, jos pakka ei kelpaa, ja syy näkyy) | FR-007…011 |
| Ottelu | Molempien elämät ja energiat, 3 kaistaa kummallakin, käsi (pelattavat korostettu), pakan ja poistopinon koot, vuoro- ja vaihenäyttö, "Hyökkää", "Lopeta vuoro", tauko (luovuta, säännöt), animaatioiden nopeutus | FR-012…018, FR-020 |
| Korttinäkymä (napautus) | Iso kortti, sääntöteksti, avainsanojen selitykset | FR-020 |
| Yhteenveto | Voitot, paras kortti, avatut boosterit, ennätys, "Uusi run" | US2 |
| Kokoelma | Nähdyt kortit avattuina, näkemättömät siluetteina, suodatus elementin mukaan | US5 |
