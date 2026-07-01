# Workspace Sync

Lehetővé teszi, hogy a mentett Obsidian workspace-eid desktopon és
mobilon is használhatóak legyenek, annak ellenére, hogy a sidebar
szerkezete a két platformon nem kompatibilis egymással (`split`
desktopon, `mobile-drawer` mobilon). A megnyitott tab-okhoz a plugin
sosem nyúl — ezek mindig szinkronban maradnak a platformok között,
beleértve az újonnan létrehozott vagy törölt workspace-eket is.

---

## Hogyan működik (minden beállításnál ugyanaz a mechanizmus)

Nincs dokumentált Obsidian API arra, hogy "melyik workspace-bejegyzés
melyik platformhoz tartozik" egy `workspaces.json`-on belül, és nincs
esemény arra se, hogy "egy workspace mentve/létrehozva/törölve lett".
Ezért a plugin mindig **két teljes, azonnal betölthető** másolatát
tartja fenn a `workspaces.json`-nak a vault-odban:

```
<vault>/.workspace-sync/workspaces.pc.json      (minden workspace, a DESKTOP kerettel)
<vault>/.workspace-sync/workspaces.mobile.json  (minden workspace, a MOBIL kerettel)
```

A `.workspace-sync` itt nincs hardcode-olva — az a mappa, amit a
**megosztott keret-fájl útvonalánál** beállítasz a Settings fülön
(alapértelmezetten `.workspace-sync/frameworks.json`). Mindkét
snapshot-fájl mindig ugyanabban a mappában él, közvetlenül a
`frameworks.json` mellett. Ha az útvonalat pl.
`.sajat-sync-mappam/frameworks.json`-ra állítod, a snapshot-ok
`.sajat-sync-mappam/workspaces.pc.json` és
`.sajat-sync-mappam/workspaces.mobile.json` lesznek — nincs külön
beállítás ehhez, a mappanév mindhárom fájlra közös. Ennek a beállításnak
a megváltoztatása azonnal érvénybe lép (nem kell újraindítani Obsidiant);
a **régi** mappában maradt snapshot-fájlok érintetlenül megmaradnak,
ezért használd a "Sync now"-t közvetlenül átnevezés után, hogy az új
mappa is feltöltődjön.

**Időszakosan** (alapértelmezetten 30 másodpercenként, a Settings-ben
állítható), a plugin újraépíti **mindkét** fent említett fájlt a natív
`workspaces.json` jelenlegi állapotából — bármit is mentettél, vettél
fel, vagy töröltél a legutóbbi újraépítés óta. Ez bármelyik platformon
megtörténik, tehát ha desktopon mentesz, az azonnal létrehozza a
mobilra kész verziót is — nem kell előbb mobilon megnyitnod
Obsidiant ahhoz, hogy ez megtörténjen.

A plugin szándékosan **nem** figyel minden layout-változást, amíg
dolgozol (nincs event listener, ami minden tab-váltásra vagy
fájlmegnyitásra lefutna) — ez session közben feleslegesen, állandóan
ellenőrizné a vault-ot, valódi haszon nélkül. Az időzítő, plusz a
manuális **"Sync now"** gomb (Settings, Frameworks alatt), ha azonnal
szeretnéd, hogy valami átkerüljön — ez a két trigger, semmi más.

**Induláskor** a plugin egyáltalán nem merge-el — egyszerűen átmásolja
a jelenlegi platformhoz tartozó, már kész fájlt a natív
`workspaces.json`-ba, amit Obsidian olvas, mert Obsidian csak ezt a
formátumot tudja beolvasni egy valódi config mappából.

Ez ugyanaz a mechanizmus, akár egy közös config mappád van, akár kettő
külön — csak a célútvonal más (lásd alább). Nincs sehol külön
"mód"-kapcsoló: az, hogy a **workspaces.json útvonal** beállítás üres
vagy ki van töltve, ez az egyetlen dolog, ami eldönti, melyik natív
fájlból olvas és melyikbe ír a plugin, minden alkalommal, minden
platformon egymástól függetlenül.

---

## Beállítás

### Egy közös config mappa (a tipikus eset)

Hagyd üresen a **workspaces.json útvonal** mezőt a Settings fülön. A
plugin maga építi fel az útvonalat Obsidian valódi config
mappanevéből (`Vault.configDir`), tehát akkor is működik, ha a
`.obsidian`-t átnevezted valami másra.

### Külön config mappa platformonként

Ha kézzel állítottad be, hogy Obsidian platformonként külön config
mappát használjon (pl. `.windows` desktopon), állítsd a
**workspaces.json útvonalat** az adott platform saját fájljára (pl.
`.windows/workspaces.json`) — ezt **külön, mindegyik platform saját
plugin-telepítésén** kell beállítani, mindig az adott platform saját
fájljára mutatva, sosem a másikéra. Ez a `data.json`-ban tárolódik,
ami a config mappa belsejében él, tehát minden telepítés csak a saját
útvonalát ismeri.

A megosztott mappa, ahol a kész snapshot-ok és a keret-fájl is él,
mindkét esetben ugyanaz — a vault gyökerében van (a neve az, amit a
**megosztott keret-fájl útvonalánál** beállítasz, lásd fent), nem egy
config mappa belsejében, tehát a vault-szinkronod (Git, Obsidian Sync,
iCloud, Syncthing, stb.) ugyanúgy átviszi mindkét platformra, mint
bármelyik más fájlt.

### Keret importálása

Minden, ami egy workspace-ben van, a megnyitott tab-okat kivéve — a
bal/jobb oldali sidebar-ok és a ribbon — az a "framework" (keret". Ezt
egy, a vault-odban már létező fájlból választod ki, platformonként
egyet:

1. Mindegyik platformon állítsd be Obsidiant úgy, hogy a ribbon és a
   sidebar elemei pontosan úgy nézzenek ki, ahogy szeretnéd, hogy
   mindenhol kinézzenek — ez a "kívánt" állapot, amit keretként
   szeretnél használni. Ehhez nem kell külön semmit "elmenteni":
   Obsidian mindig kiírja a legutóbbi sessionödet a `workspace.json`-ba
   desktopon, illetve a `workspace-mobile.json`-ba mobilon — tehát
   amint a layout jónak néz ki a képernyőn, az a fájl már tartalmazza
   azt.
2. Használd a **"Pick file (desktop)"** / **"Pick file (mobile)"**
   gombokat a Settings fülön — ezek csak a pontosan ilyen nevű fájlokat
   listázzák, tehát nincs esély arra, hogy rossz fájlt válassz.

Mindkét keret együtt tárolódik a
`<vault>/.workspace-sync/frameworks.json`-ban (vagy ahová a megosztott
keret-fájl útvonalat beállítottad, lásd fent).

---

## Korlátozás

Mivel nincs event listener, ami session közben figyelné a
változásokat, minden módosítást — workspace mentése, új létrehozása,
törlése — csak az időszakos újraépítés vesz észre (alapértelmezetten
30 másodpercenként). Ha módosítasz valamit, és ezen az ablakon belül
zárod be Obsidiant, az esetleg nem fog megjelenni a snapshot-fájlokban
addig, amíg a következő időszakos újraépítés le nem fut, bármelyik
platformon is történjen ez meg legközelebb. Használd a **"Sync now"**-t
(Settings > Frameworks) közvetlenül egy módosítás után, ha biztos
akarsz lenni benne, hogy az azonnal átkerül.

**A tab-változások szinkronizálásához szükséges a "Save workspace"
parancs futtatása (core Obsidian parancs).** Az Obsidian nem írja
folyamatosan vissza a megnyitott tab-ok állapotát a
`workspaces.json`-ba — egy workspace-bejegyzés csak akkor frissül ott,
ha expliciten elmented. A mi pluginunk időszakos újraépítése ebből a
fájlból olvas, tehát ha megnyitsz egy új tabot, de nem mentesz, a
snapshot még a régi tab-állapotot fogja tartalmazni. A helyes
folyamat: új tab megnyitása → "Save workspace" → (a plugin 30
másodpercen belül felveszi, vagy azonnal a "Sync now"-val) → push.

Ez fejlesztői döntés, nem technikai korlát, amin könnyen lehetne
segíteni. Egyes pluginok (pl. Workspaces Plus) kínáltak
"auto-save workspace-váltáskor" funkciót, de ha a mentés a háttérben,
automatikusan történik, a user elveszíti az irányítást afelett, hogy
mi kerül a `workspaces.json`-ba — egy véletlenszerű állapot
(átszervezés közben, félig bezárt tab-okkal) csendben kiíródhat, és
átkerülhet a másik platformra is. A "Save workspace" mint tudatos,
explicit aktus megtartása ezt elkerüli.

---

## Kizárt workspace-ek

Settings > Excluded Workspaces — azok a nevek, amikhez a plugin sosem
nyúl a snapshot-ok újraépítésekor.

Ezek tipikusan azok a workspace-ek lesznek, amiknek saját, eltérő
ribbon és sidebar beállítása kell egy speciális esethez — pl. egy
külön elrendezés kereséshez, kutatáshoz, íráshoz, vagy egy workspace,
amit több külső monitorhoz állítottál be. Ezekben a workspace-ekben a
fő szempont az, hogy a sidebar/ribbon szerkezete sértetlen maradjon az
adott platformon, nem az, hogy melyik fájl van megnyitva a platformok
között szinkronban.

**A kizárás mellékhatása: a fő tab-csoport (main) sem szinkronizálódik.**
A kizárás egy workspace-en belül mind-vagy-semmi — nincs olyan
beállítás, hogy a megnyitott tab-okat szinkronizáljuk, miközben a
sidebar-t mégis érintetlenül hagyjuk. Egy workspace kizárása teljesen
kihagyja minden jövőbeli snapshot-újraépítésből. Tehát természetesen
egy kizárt workspace-ben a megnyitott fájlok sem kerülnek át desktop
és mobil között — kizárólag az adott workspace szerkezete van védve az
adott platformon.

**Ez teljesen manuális.** A plugin önmagától nem tudja felismerni, hogy
"ennek a workspace-nek speciális sidebar-ja van, hagyjuk békén" — nincs
erre semmilyen automatikus heurisztika, és nem is kellene lennie, mert
ez user-intent kérdés (melyik workspace-eknek kell követnie a közös
keretet, és melyiknek szabad szándékosan eltérnie), nem egy mintázat,
amit a plugin a layout-ból kikövetkeztethetne. Ha hónapokkal később
felvesz egy új workspace-t, aminek saját sidebar/ribbon kell, azt
neked kell kizárnod — a plugin nem fogja észrevenni, és nem fog
rákérdezni.

Egy workspace hozzáadása vagy eltávolítása a kizárt listából a
Settings fülön azonnali újraépítést indít mindkét snapshot-fájlra.
Amikor egy workspace-t felveszel a kizárt listára, a bejegyzése
automatikusan törlődik mindkét snapshot-fájlból ugyanabban az
újraépítésben — tehát ha a sidebar/ribbon-ját korábban már felülírta
egy framework-build, a szennyezett bejegyzés azonnal kitakarításra
kerül. A workspace saját, érintetlen natív állapota marad meg a
diszken, és ez az állapot kerül megőrzésre a továbbiakban.

---

## Parancsok

A legtöbb művelet a Settings fülön gombként él. A Command Palette csak
azt listázza, amihez nincs egy-kattintásos Settings-megfelelő, plusz
az egyetlen, leggyakrabban használt műveletet (gyors, billentyűzetes
eléréshez) — szándékosan rövidre fogva, hogy egy új user ne ütközzön
bele egy csomó számára ismeretlen parancsba.

| Parancs | Mit csinál |
|---|---|
| Sync now | Azonnal újraépíti mindkét snapshot-fájlt. Megegyezik a Settings-ben lévő "Sync now" gombbal — ugyanaz a név, ugyanaz a művelet, csak a Command Palette-ből is elérhető. |
| Reload frameworks from shared file | Újra beolvassa a megosztott frameworks.json-t, anélkül hogy újra kellene indítani Obsidiant. |
| [Debug] Reload core Workspaces registry | Kézzel újraalkalmazza a legutóbb betöltött snapshot-ot Obsidian core Workspaces registry-jébe, újraindítás nélkül. Kizárólag hibakereséshez — nincs Settings UI megfelelője. |

---

## Fejlesztés

```bash
npm install
npm run dev      # watch mode, esbuild
npm run build    # type-check + production build
```

Másold a `main.js` és `manifest.json` fájlokat a vault-od
`.obsidian/plugins/workspace-sync/` mappájába (vagy a saját config
mappád megfelelő helyére).
