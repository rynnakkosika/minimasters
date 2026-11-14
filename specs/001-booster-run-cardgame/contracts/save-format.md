# Contract: Tallennusmuoto

Tallennuspaikka on `localStorage` (selain ja Capacitor WebView). Kaikki luku ja kirjoitus kulkee `src/storage/save.js`:n kautta.

| Avain | Sisältö | Kirjoitetaan |
|-------|---------|--------------|
| `mm.profile.v1` | Profile ([data-model.md](../data-model.md#profile)) | Asetusmuutoksen, uuden nähdyn kortin ja runin päättymisen jälkeen |
| `mm.run.v1` | `{ version: 1, run: Run }` sisältäen `run.match` (MatchState ja RNG-tila) | Jokaisen `applyAction`-, booster- ja pakkamuutoksen jälkeen (FR-022) |

## Säännöt

- Jokaisessa tallenteessa on `version`. Latauksessa ajetaan migraatioketju `migrate[v] → v+1`. Tuntematon tai korruptoitunut tallenne ei kaada peliä: käyttäjälle näytetään ilmoitus, run hylätään ja profiili säilytetään.
- Kun run päättyy, `mm.run.v1` poistetaan ja ennätykset päivitetään profiiliin.
- Tallenteissa ei ole henkilötietoja eikä tunnisteita. Mitään ei lähetetä laitteelta.
- Koko on alle 100 kt. Jos kirjoitus epäonnistuu (tila täynnä), peli jatkuu ja näyttää varoituksen.
