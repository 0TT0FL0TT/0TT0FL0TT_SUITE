# Workspace Sync

Lehetővé teszi, hogy az Obsidianben elmentett munkaterületeid ugyanúgy használhatók maradjanak asztali gépen és mobilon is, annak ellenére, hogy a két platform oldalsáv-struktúrája nem kompatibilis egymással (`split` asztali gépen, `mobile-drawer` mobilon). A megnyitott fülek mindig érintetlenek maradnak — és platformok között is szinkronban maradnak, beleértve az újonnan létrehozott vagy törölt munkaterületeket is.

---

## Hogyan működik (minden beállítás esetén ugyanazzal a mechanizmussal)

Az Obsidianhez nem tartozik dokumentált API arra, hogy egy `workspaces.json` fájlban meg lehessen állapítani, melyik munkaterület-bejegyzés melyik platformhoz tartozik, és nincs esemény sem arra, hogy „egy munkaterület el lett mentve / hozzá lett adva / törölve lett”. Ezért a plugin mindig **két teljes, azonnal betölthető** másolatot tart fenn a `workspaces.json` fájlból:

```text
<vault>/.workspace-sync/workspaces.pc.json      (minden munkaterület, ASZTALI keretrendszerrel)
<vault>/.workspace-sync/workspaces.mobile.json  (minden munkaterület, MOBIL keretrendszerrel)
```

A `.workspace-sync` itt nincs beégetve — mindig azt a mappát jelenti, amelyet a Beállításokban a **megosztott keretrendszerfájl elérési útjaként** állítottál be (alapértelmezés szerint `.workspace-sync/frameworks.json`). Mindkét pillanatképfájl mindig ugyanebben a mappában található, közvetlenül a `frameworks.json` mellett. Ha például úgy döntesz, hogy az útvonal legyen `.my-sync-folder/frameworks.json`, akkor a pillanatképek neve automatikusan:

`.my-sync-folder/workspaces.pc.json`

és

`.my-sync-folder/workspaces.mobile.json`

lesz. Ehhez nincs külön beállítás; ugyanazt a mappát használja mindhárom fájl. Ennek a beállításnak a módosítása azonnal életbe lép (újraindítás nélkül); a régi mappában lévő pillanatképfájlok érintetlenül megmaradnak, ezért átnevezés után érdemes rögtön a **Sync now** gombot használni, hogy az új mappa is feltöltődjön.

**Időszakosan** (alapértelmezés szerint 30 másodpercenként, ez a Beállításokban módosítható) a plugin újraépíti a fenti **mindkét** fájlt a natív `workspaces.json` aktuális állapotából — vagyis minden olyan munkaterület alapján, amelyet az előző újraépítés óta elmentettél, létrehoztál vagy töröltél. Ez attól függetlenül megtörténik, hogy melyik platformon dolgozol, így ha asztali gépen mentesz egy munkaterületet, abból automatikusan elkészül a használatra kész mobilos változat is — ehhez nem szükséges előbb megnyitni az Obsidiant mobilon.

A plugin szándékosan **nem** figyeli folyamatosan az elrendezés minden változását munka közben (nincs olyan eseményfigyelő, amely minden fülváltásnál vagy fájlmegnyitásnál lefutna), mert ez a munkamenet során folyamatos ellenőrzést jelentene a tárolón, valódi előny nélkül. Az időszakos időzítő, valamint a kézi **Sync now** gomb (Beállítások → Keretrendszerek), amikor azt szeretnéd, hogy valami azonnal továbbterjedjen, elegendő egyetlen frissítési mechanizmusként.

**Indításkor** a plugin egyáltalán nem végez összevonást — egyszerűen bemásolja az aktuális platformhoz tartozó előre elkészített fájlt abba a natív `workspaces.json` fájlba, amelyből az Obsidian olvas, mert az Obsidian kizárólag ezt a formátumot tudja valódi konfigurációs mappából betölteni.

Ez ugyanaz a működési mechanizmus akkor is, ha egyetlen közös konfigurációs mappát használsz, és akkor is, ha kettőt külön-külön — csak a célfájl elérési útja változik (lásd lentebb). Nincs külön „mód” kapcsoló: kizárólag az dönti el, hogy a plugin melyik natív fájlból olvas és melyikbe ír minden alkalommal, minden platformon külön-külön, hogy a **`workspaces.json` path** beállítás üres-e vagy ki van töltve.

---

## Beállítás

### Egyetlen közös konfigurációs mappa (ez a leggyakoribb)

Hagyd üresen a Beállításokban a **`workspaces.json` path** mezőt. A plugin ilyenkor maga állítja elő az útvonalat az Obsidian tényleges konfigurációs mappanevéből (`Vault.configDir`), ezért akkor is működik, ha a `.obsidian` mappát átnevezted valami másra.

### Platformonként külön konfigurációs mappák

Ha kézzel úgy állítottad be az Obsidian-t, hogy platformonként külön konfigurációs mappát használjon (például `.windows` asztali gépen), akkor a **`workspaces.json` path** mezőbe az adott platform saját fájlját add meg (például `.windows/workspaces.json`). Ezt **minden platform plugintelepítésében külön-külön** kell beállítani, mindig az adott platform saját fájljára mutatva, soha nem a másikéra. Ez a beállítás a konfigurációs mappában található `data.json` fájlban tárolódik, ezért minden telepítés csak a saját útvonalát ismeri.

A megosztott mappa, amelyben mindkét használatra kész pillanatkép és a keretrendszerfájl található, mindkét esetben ugyanaz marad — a tároló gyökerében helyezkedik el (a neve az, amit a Beállításokban a **megosztott keretrendszerfájl elérési útjaként** megadtál; lásd fentebb), nem pedig valamelyik konfigurációs mappában. Így a tároló szinkronizálása (Git, Obsidian Sync, iCloud, Syncthing stb.) ugyanúgy átviszi mindkét platformra, mint bármely más fájlt.

### Keretrendszer importálása

A munkaterület minden része, kivéve a megnyitott füleket — vagyis a bal és jobb oldali oldalsáv, valamint a szalag — alkotja a „keretrendszert”. Ezt egy, a tárolódban található fájlból választod ki.

1. Győződj meg róla, hogy rendelkezésre áll a kívánt asztali `workspace.json` és mobilos `workspace-mobile.json` fájl (ezek az egyedi fájlok mindig az adott platform legutóbbi munkamenetét tükrözik). A „kívánt” alatt azt értjük, hogy az Obsidian bezárása előtt állítsd be a szalagot és az oldalsávokat pontosan úgy, ahogyan szeretnéd, hogy a keretrendszerfájlokban szerepeljenek.
2. A Beállításokban használd a **"Pick file (desktop)"** illetve **"Pick file (mobile)"** gombot — ezek kizárólag pontosan ilyen nevű fájlokat jelenítenek meg, így nem lehet véletlenül rosszat kiválasztani.

Mindkét keretrendszer a következő fájlban kerül tárolásra:

`<vault>/.workspace-sync/frameworks.json`

---

## Korlátozás

Mivel nincs eseményfigyelő, amely munkamenet közben követné a változásokat, minden módosítás — munkaterület mentése, új létrehozása vagy törlése — csak a következő időszakos újraépítéskor kerül feldolgozásra (alapértelmezés szerint 30 másodpercenként). Ha végrehajtasz egy módosítást, majd ezen időablakon belül bezárod az Obsidian-t, előfordulhat, hogy a pillanatképfájlok csak a következő, valamelyik platformon lefutó időszakos újraépítés során frissülnek. Ha biztosra szeretnél menni, közvetlenül a módosítás után használd a **Sync now** gombot (Beállítások → Keretrendszerek), hogy a változás azonnal továbbterjedjen.

---

## Kizárt munkaterületek

Beállítások → Kizárt munkaterületek — azoknak a munkaterületeknek a nevei, amelyeket a plugin a pillanatképek újraépítése során soha nem módosít.

Ezek tipikusan olyan munkaterületek lesznek, amelyek speciális célra eltérő szalag- és oldalsáv-elrendezést használnak (például külön nézet kereséshez, kutatáshoz vagy íráshoz, illetve több külső monitorhoz kialakított munkaterületek). Ezeknél a munkaterületeknél az elsődleges cél nem az, hogy a fő fülcsoport megnyitott lapjai platformok között szinkronban maradjanak, hanem hogy az oldalsávok szerkezete változatlan maradjon. Természetesen ezeknél a munkaterületeknél a fő fülcsoport elemei emiatt nem szinkronizálhatók.

---

## Parancsok

| Parancs                                              | Mit csinál                                                                                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Push native workspaces.json to platform snapshot now | Azonnal újraépíti mindkét pillanatképfájlt. Ugyanazt végzi, mint a Beállításokban található **Sync now** gomb.                                            |
| Import framework from vault file (desktop / mobile)  | Fájl kiválasztása keretrendszerként való használatra.                                                                                                     |
| Exclude current workspace from sync                  | A jelenleg megnyitott munkaterület hozzáadása a kizárt listához.                                                                                          |
| Reload frameworks from shared file                   | Újraolvassa a megosztott `frameworks.json` fájlt.                                                                                                         |
| [Debug] Reload core Workspaces registry              | Újraindítás nélkül kézzel újraalkalmazza az utoljára betöltött pillanatképet az Obsidian beépített Workspaces nyilvántartására. Kizárólag hibakereséshez. |

---

## Fejlesztés

```bash
npm install
npm run dev      # figyelő mód, esbuild
npm run build    # típusellenőrzés + production build
```

Másold a `main.js` és `manifest.json` fájlokat a tárolód `.obsidian/plugins/workspace-sync/` mappájába (vagy a saját konfigurációs mappád megfelelő plugin könyvtárába).
