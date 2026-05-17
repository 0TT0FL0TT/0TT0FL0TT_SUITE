# Global Search or Replace — Obsidian Plugin

Vault-szintű keresés és csere regex-szel, frontmatter-szűrőkkel, AI-asszisztált keresési módokkal és tömeges fájlműveletekkel.

---

## Telepítés

Mivel a plugin nem szerepel az Obsidian Community Plugins tárában, manuálisan kell telepíteni:

1. Másold a fájlokat (`main.js`, `manifest.json`, `styles.css`) a vaultod `.obsidian/plugins/global-search-or-replace/` mappájába.
2. Indítsd újra az Obsidiant, vagy kapcsold be a plugint a **Settings → Community Plugins** menüben.

---

## Indítás

A plugin kétféleképpen nyitható meg:

- A bal oldali **szalagmenü (ribbon)** kereső ikonján kattintva.
- A parancspalettán (`Ctrl/Cmd + P`) a **„Open Search-Replacer Modal"** (Globális kereső/csere ablak megnyitása) paranccsal.

---

## Keresési módok

A főmodálban három üzemmód érhető el egymást kiegészítve.

### Egyszerű szöveges keresés

Alapértelmezett mód. A beírt szöveg literálisan szerepel a keresési mintában — a regex-speciális karakterek automatikusan escape-elődnek.

### Regex mód

A **Regex Mode** kapcsolóval aktiválható. Bekapcsolt állapotban a keresési mező teljes reguláris kifejezést fogad el, például:

```
\b(kutyát|kutya)\b
```

A mód állapota mentésre kerül a plugin state-fájljába, és újraindítás után is megmarad.

### AI mód

Ld. az [AI-asszisztált keresés](#ai-asszisztált-keresés) fejezetet.

### Keresés teljesítménye

**Obsidian indulás után az első keresés lassú lehet**, különösen nagy vault-oknál és mobil eszközökön. Ez azért van, mert a plugin az Obsidian beépített keresési cache-ét használja, ami az első használatkor töltődik be. **A második és további keresések már gyorsak**, éppúgy ahogy az Obsidian beépített keresőjénél.  

---

## Frontmatter-szűrők

A keresőmodál tartalmaz egy frontmatter-alapú szűrőpanelt, amellyel még a keresés megkezdése előtt leszűkítheted, hogy a plugin mely fájlokat vizsgáljon át.

A szűrhető és rendezhető property-k listáját a Settings oldalon lehet konfigurálni (ld. alább). A beépített alapértelmezett property-k:

| Tulajdonság | Típus |
|---|---|
| `collection` | list |
| `tags` | list |
| `status` | text |
| `mtime` | date |
| `ctime` | date |
| `date_modified` | date |
| `date_created` | date |

*(Megjegyzés: az alapértelmezett lista testreszabható a Settings-ben)*

**Dátum-szűrők** esetén egy naptárfelület jelenik meg, ahol „before" és „after" irányban adhatsz meg határt.

**Lista- és szövegtípusú** property-knél az adott mezőben előforduló összes értéket összegyűjti a plugin, és ezek közül lehet többet is kijelölni jelölőnégyzetekkel (OR logika).

Ha csak frontmatter-szűrőt adsz meg keresőminta nélkül, a plugin **property-only módban** fut, és a szűrőnek megfelelő fájlok listáját adja vissza (fájlnév szerinti nézetben, nem egyezések szerint).

---

## Eredménypanel

A keresés eredményei egy lebegő panelben jelennek meg, amely:

- **Áthelyezhető** (a fejlécénél fogva húzható).
- **Minimalizálható és maximalizálható** a panel jobb felső sarkában lévő gombokkal.

### Húzás (drag) viselkedés

**Asztali módon:** A panel a fejlécénél fogva húzható új pozícióba. A panel nem hagyhatja el teljesen a képernyőt (legalább 100px látható marad az alján, és 48px az oldalakon).

**Mobil módon (≤768px szélesség):** A panel a fejléc mellett a görgethető tartalmi területről is húzható — ezzel könnyebb megragadni nagyobb ujjal. A húzás csak akkor indul, ha nem interaktív elemre (gomb, input, link, stb.) kattintasz.

### Rendezés

Az eredmények a panel tetején lévő **Rendezés** legördülővel és az **Növekvő/Csökkenő** gombbal rendezhetők a konfigurált rendezhető tulajdonságok szerint (alapértelmezetten: basename, mtime, ctime, date\_modified, date\_created).

### Szűrés az eredményeken belül

A panel **Találatok szűrése** mezője tovább szűkíti a megjelenített találatokat. Regex-et is elfogad. A szűrő az egyező fájl elérési útjára és a találatok tartalmára egyaránt hat.

### Eredmények megjelenítése

Minden találatnál látható:

- A fájl elérési útja és a sor száma.
- A sor tartalma Markdown-renderelve, a keresési kifejezés sárga kiemeléssel.
- Belső Obsidian-linkek kattinthatók: új lapon nyílnak meg.

### Másolási módok

A **Másolási mód** választógombokkal választható ki, hogy az **Összes másolása** gomb mit másoljon:

| Mód | Mit másol |
|---|---|
| Csak az egyező sorok | Csak az egyező sorokat (keresési mód) |
| Fájlútvonal + név | Fájlelérési utakat (property-only módban az alapértelmezett) |
| Fájltartalom YAML nélkül | A fájlok teljes tartalmát frontmatter nélkül |
| Fájltartalom YAML-lal | A fájlok teljes tartalmát frontmatterrel együtt |

### „Ugrás találatokhoz" gomb

Megnyitja az összes talált fájlt (vagy a szűrt részhalmazát) új lapokon. Ha a megnyitandó fájlok száma meghaladja a **Max. megnyitás jóváhagyás nélkül** beállítást (alapértelmezés: 50), a plugin megerősítést kér.

---

## Csere (Replace) mód

### Aktiválás

A főmodálban a **Csere mód bekapcsolása** jelölőnégyzettel kapcsolható be. Bekapcsolt állapotban megjelenik a **Helyettesítő szöveg** beviteli mező, és a **Keresés** gomb helyét az **Előnézet** veszi át.

### Előnézet

Az **Előnézet** gombra kattintva egy új lebegő modál nyílik, amely fájlonként csoportosítva mutatja:

- az érintett fájl elérési útját és az egyező sor számát,
- az **Előtte** nézetet (az eredeti sorral, a találat kiemelve),
- az **Utána** nézetet (a csere utáni sorral, a módosítás kiemelve).

A megjelenítés átkapcsolható **raw** (nyers szöveg) és **rendered** (Markdown-renderelt) nézet között.

**Húzás viselkedés:** Az előnézet-modál ugyanúgy húzható, mint az eredménypanel — asztali módon a fejlécnél, mobil módon a görgethető tartalmi területről is.

Minden egyezés előtt jelölőnégyzet áll — csak a bepipált sorokra hajtódik végre a csere. Az **Összes kijelölése / Kijelölés törlése** gombokkal tömegesen kezelhetők a kijelölések.

### Csere végrehajtása

A **Kijelöltek cseréje** gombra kattintva a plugin elvégzi a cserét a kijelölt sorokban. Támogatja a regex visszareferenciákat (`$1`, `$2` stb.) a csere szövegben.

Ha a csere futása között a fájl tartalma megváltozott (pl. egy másik szerkesztőben módosítottad), a plugin kihagyja az elavult egyezéseket, és értesítőben jelzi a kihagyottak számát.

### Dátum automatikus frissítése

Csere után a plugin opcionálisan frissíti a módosított fájlok frontmatter-jében a `date_modified` (vagy a beállított) mező értékét. Ld. a [Dátumkezelés](#dátumkezelés) fejezetet.

---

## AI-asszisztált keresés

Az AI mód a főmodálban az **Enable AI** kapcsolóval aktiválható. Az állapota a regex-módhoz hasonlóan megmarad a munkamenetek között.

### 🔐 Biztonsági megjegyzés – API kulcsok tárolása

Az AI szolgáltatásokhoz szükséges API kulcsok külön fájlban, a **`keys.json`**-ben tárolódnak (nem a `data.json`-ban). Ez lehetővé teszi, hogy:

- A kulcsokat **kizárd az Obsidian Sync szinkronizációból** (a Sync beállításokban add hozzá az exclusions listához)
- Külön kezeld a bizalmas adatokat a többi beállítástól

A `keys.json` a plugin mappájában található (pl. `.obsidian/plugins/global-search-or-replace/keys.json`).

---

A plugin három különböző AI-alapú keresési stratégiát alkalmaz, amelyek automatikusan aktiválódnak a beírt szöveg alapján.

### AI módok áttekintése

| Mód | Korábbi név | Fókusz | Temporal | Meta-szó szűrés |
|-----|-------------|--------|----------|-----------------|
| **AI2 (Smart Mode)** | Near Search | Proximity patternek (~200 karakter) | ✅ Teljes | Nincs explicit |
| **AI3 (Concept Mode)** | Wide Search | Dokumentum-szintű keresés (~500 karakter) | ✅ Kifinomult | Igen ("írtam", "jegyzet", "keresek" kiszűrése) |

> **Megjegyzés a nyelvről:** A beépített promptok magyar és angol szinonimákat egyaránt tartalmaznak. A promptok **teljesen cserélhetők** tetszőleges nyelvre – lásd a [Testreszabhatóság](#testreszabhatóság) fejezetet.

### AI2 (Smart Mode) — Kontextus keresés

**Mikor aktiválódik:** ha a keresőmező a **Cue Word** beállításban megadott szóval kezdődik (alapértelmezés: `smart`, `near`, `close`, `keresek`, `keresem`, `searching`).

**Hogyan működik:** a kulcsszó után írt természetes nyelvű keresési szándékot elküldi az AI-nak. Az AI kinyeri a két legfontosabb fogalmat, bővíti szinonimákkal (magyar és angol egyaránt), majd pairwise regex-mintákat generál, ahol az egyik fogalom előfordulásától számított ~200 karakteren belül kell a másiknak megjelennie.

**Temporal támogatás:** AI2 is kezeli az időhatározókat (pl. `"2-3 hete"`, `"múlt héten"`). Lásd: [Temporal keresés](#temporal-keresés).

**Eredmény:** legfeljebb 12 pipe-szeparált regex-minta, amelyeket a plugin automatikusan futtat. A generált regex a vágólapra is másolódik.

**Példa:**
```
smart görög kutya
→ (görög|greek|hellén).{0,200}?(kutya|eb|dog|kutyus)|(kutya|eb|dog|kutyus).{0,200}?(görög|greek|hellén)
```

### AI3 (Concept Mode) — Dokumentum-szintű keresés

**Mikor aktiválódik:** ha a beírt szöveg tartalmazza a **Cue Word**-öt (alapértelmezés: `concept`, `wide`, `anywhere`, `téma`), vagy több szóból áll és nem tartalmaz AI2 kulcsszót.

**Hogyan működik:** az AI 2–4 kulcsfogalmat von ki a keresőszövegből, mindegyikhez 3–5 szinonimát generál, majd ezeket dokumentumszintű regex-be fűzi össze `[\s\S]*?` elválasztókkal — ez olyan egyezéseket talál, ahol a fogalmak egy dokumentumon belül **bárhol** szerepelhetnek.

**Meta-szó szűrés:** AI3 expliciten kiszűri a dokumentum-típus jelzőket, meta-igéket és **vague, nem tematikus töltelék szavakat**:
- **Dokumentum-típusok:** `"jegyzet"`, `"note"`, `"feljegyzés"`, `"írás"`, `"cikk"`, `"article"`, `"file"` — nem keres ezekre, mert a tartalomban nem szerepelnek
- **Írás-action igék:** `"írtam"`, `"write"`, `"készítettem"`, `"created"`, `"szerkesztettem"`, `"edited"`
- **Keresés igék:** `"keresek"`, `"searching"`, `"looking for"`, `"find"`
- **Vague, nem tematikus töltelékek:** `"valami"`, `"valamilyen"`, `"bizonyos"`, `"dolog"`, `"érdekes"`, `"mindenféle"`, `"stb"`, `"something"`, `"certain"`, `"interesting"`, `"stuff"`, `"thing"` — ezekre SEM keres a rendszer

Ez azt jelenti, hogy ha `"múlt héten írtam valami érdekeset görög filozófiáról"`-t keresel, az AI3 csak a `"görög"` és `"filozófia"` koncepciókat használja, minden mást figyelmen kívül hagy.

**Temporal támogatás:** AI3 ugyanúgy kezeli az időhatározókat mint AI2. Lásd: [Temporal keresés](#temporal-keresés).

**Eredmény:** egyetlen, hosszabb regex, amelyet a plugin vált ki, és a vágólapra másol.

### Temporal keresés

Mindkét AI mód (AI2 és AI3) támogatja az időalapú szűrést. Az AI kinyeri a temporal adatokat a keresőszövegből, majd a plugin dátum-intervallumra szűri a fájlokat **mielőtt** a regex keresés elindulna.

#### Emberi memória buffer (±3 nap tolerancia)

Az emberek pontatlanul emlékeznek: `"2-3 hete"` lehet valójában 18 napja, vagy 25 napja. A rendszer ±3 nap ráhagyással keres:

| Input | AI értelmezés | Szűrési intervallum (ma: 2026-04-28) |
|-------|---------------|-------------------------------------|
| `"2 hete"` | 14 nap | 2026-04-11 – 2026-04-24 |
| `"2-3 hete"` | 14-21 nap | 2026-04-04 – 2026-04-17 |
| `"múlt héten"` | 7-14 nap | 2026-04-11 – 2026-04-24 |
| `"egy hónappal ezelőtt"` | 28-31 nap | 2026-03-27 – 2026-04-30 |
| `"fél éve"` | 150-180 nap | 2025-10-28 – 2026-04-19 |

**Fontos:** A szűrés **NEM** a mai napig tart, hanem a megadott intervallum végéig + buffer. Ha `"2-3 hete"`-et mondanak, akkor nem ma keressük, hanem 14-21 nappal ezelőtt ±3 nap.

#### Automatikus rendezés temporal kereséskor

Ha a keresés tartalmaz időbeli információt (pl. `"3 hete"`), az eredmények automatikusan a beállított **AI Temporal Date Source** szerint rendeződnek **csökkenő** sorrendben (legfrissebb elöl):

| AI Temporal Date Source | Alapértelmezett rendezés |
|-------------------------|--------------------------|
| `mtime` (fájl módosítás ideje) | `Mtime` – descending |
| `frontmatter` (frontmatter dátum) | A beállított frontmatter kulcs (pl. `Date_modified`) – descending |

Ez a viselkedés kizárólag **temporal kereséskor** aktiválódik. Ha a felhasználó manuálisan váltja a rendezési mezőt vagy irányt, az automatikus rendezés törlődik.

#### Támogatott időkifejezések

A beépített promptok a következő magyar és angol időkifejezéseket ismerik fel:

| Magyar | Angol | Jelentés |
|--------|-------|----------|
| `"2 hete"` | `"2 weeks ago"` | Pontosan 14 nap |
| `"2-3 hete"` | `"2-3 weeks ago"` | 14-21 nap |
| `"múlt héten"` | `"last week"` | 7-14 nap |
| `"egy hónappal ezelőtt"` | `"a month ago"` | ~30 nap |
| `"fél éve"` | `"half a year ago"` | ~180 nap |
| `"mostanában"`, `"nemrég"` | `"recently"` | 1-7 nap |
| `"januárban"`, `"2024 nyarán"` | `"in January"`, `"summer 2024"` | Abszolút dátumok |

> **Megjegyzés:** A magyar példák csak a beépített promptokban szerepelnek. Ha saját nyelvű promptot adsz meg, az AI az általad definiált időkifejezéseket fogja használni.

### Beállítás: AI szolgáltató

A plugin az alábbi AI-szolgáltatókat támogatja, amelyek közül egy aktív egyszerre:

| Szolgáltató | Beállítandó |
|---|---|
| **Gemini** (alapértelmezett) | API-kulcs, modell neve (pl. `gemini-2.5-flash-lite`) |
| **OpenRouter** | API-kulcs, modell neve (pl. `anthropic/claude-3.5-sonnet`) |
| **OpenAI** | API-kulcs, base URL, modell neve |
| **Anthropic** | API-kulcs, base URL (`https://api.anthropic.com`), modell neve |
| **Groq** | API-kulcs, modell neve (pl. `openai/gpt-oss-120b`) |
| **Ollama** | Base URL (pl. `http://127.0.0.1:11434/v1`), modell neve, opcionális API-kulcs |
| **NVIDIA** | API-kulcs, modell neve (pl. `deepseek-ai/deepseek-v3.2`) |

### AI közös beállítások

| Beállítás | Leírás | Alapértelmezés |
|---|---|---|
| AI Timeout (ms) | Mennyi ideig várjon az AI válaszára | 30 000 |
| AI Max Tokens | Az AI válasz maximális hossza (nem a prompt!) | 4 048 |
| AI Temporal Date Source | Temporal szűrés dátum forrása: `mtime` (fájl módosítás) vagy `frontmatter` | `mtime` |

Az **AI Max Tokens** értékét érdemes megemelni (pl. 4096-ra), ha az AI kimenet csonkítva jelenik meg.

### Testreszabhatóság

A plugin teljesen testreszabható. Minden prompt, cue word és funkciónév módosítható a Settings UI-ban.

#### 1. AI Funkciók Nevei (Feature Names)

| Alapérték | Beállítás kulcs | Testreszabható |
|-----------|-----------------|----------------|
| `"Smart Search"` (Okos keresés) | `aiSmartModeName` | ✅ Pl.: `"Okos Keresés"`, `"Közelségi keresés"` |
| `"Concept Search"` (Témakeresés) | `aiConceptModeName` | ✅ Pl.: `"Témakeresés"`, `"Szemantikus keresés"` |

A nevek dinamikusan használódnak az értesítésekben és a Settings UI-ban.

#### 2. Cue Word-ök (Aktiváló Szavak)

| Alapérték | Beállítás kulcs | Testreszabható |
|-----------|-----------------|----------------|
| `"smart"` | `aiSmartCueWord` | ✅ Pl.: `"okos"`, `"közel"`, `"távolság"` |
| `"concept"` | `aiConceptCueWord` | ✅ Pl.: `"téma"`, `"széles"`, `"bárhol"` |

**Használat:**
```
"smart bika ökör" → cue="smart", pattern="bika ökör"
"téma görög filozófia" → ha át van állítva "téma"-ra
```

#### 3. Promptok Teljes Csere

| Alapérték | Beállítás kulcs | Leírás |
|-----------|-----------------|--------|
| `DEFAULT_AI_REGEX_SMART_PROMPT_TEXT` | `aiPromptSmart` | AI2 (Smart/Okos) prompt – teljesen cserélhető |
| `DEFAULT_AI_SEMANTIC_PROMPT_TEXT` | `aiPromptSemantic` | AI3 (Concept/Téma) prompt – teljesen cserélhető |

**Fontos:** A felhasználó **bármilyen nyelvre** lecserélheti a promptokat! A beépített magyar példák és időkifejezések teljesen eltávolíthatók, ha tiszta angol (vagy más nyelvű) keresést szeretnél.

```typescript
// A plugin a settings-ből tölti a promptot,
// vagy az alapértelmezettet használja ha üres
const prompt = pluginSettings.aiPromptSmart || DEFAULT_AI_REGEX_SMART_PROMPT_TEXT;
```

### Hogyan fogalmazzunk?

Az AI **nem** egy beszélgetőpartner. Precíz utasításokat vár, nem pedig kérdéseket vagy bizonytalan fogalmazást.

#### ❌ Kerülendő – Mi nem működik jól?

| Rossz példa | Probléma |
|-------------|----------|
| `"smart nemrég volt egy bika vagy ökör téma?"` | Kérdőjel, `"volt"`, `"téma"` – a prompt kifejezést vár, nem kérdést |
| `"concept valami érdekes zsidó szokásról volt szó 2-3 hete?"` | `"valami érdekes"` túl homályos – az AI nem tudja kitalálni, mi érdekes |
| `"smart keress nekem görög mitológia, légyszi"` | Udvariassági formulák és meta-igék (`"keress"`) csak zajt adnak |
| `"concept hogyan kell ezt csinálni 2 hete írtam"` | `"ezt"`, `"csinálni"` – túl pontatlan referenciák |

#### ✅ Javasolt – Hogyan fogalmazzunk hatékonyan?

| Jó példa | Mód | Miért működik? |
|----------|-----|----------------|
| `"smart bika ökör görög mitológia 2-3 hete"` | AI2 | Cue word + konkrét fogalmak + idő. Nincs kérdőjel, nincs meta-szó. |
| `"concept zsidó szokás rituálé 2-3 hete"` | AI3 | Cue word + konkrét tartalmi szavak + idő. Az AI3 kiszűri a kitöltő szavakat. |
| `"smart arab csillagászat megfigyelés"` | AI2 | Egyszerű, száraz felsorolás. Az AI a szinonimákat maga generálja. |
| `"concept görög filozófia socrates platon"` | AI3 | Kulcsszó-alapú, de a concept mód érti a kontextust. |

#### Aranyszabályok

1. **Ne kérdezz, hanem mondd** ❌ `"smart van valami görög téma?"` → ✅ `"smart görög mitológia istenek"`
2. **Konkrét fogalmak** ❌ `"valami érdekes"` → ✅ `"arab csillagászat"`
3. **Időt világosan** ❌ `"nemrég"` → ✅ `"2-3 hete"` vagy `"múlt héten"`
4. **Nincs meta-keret** ❌ `"írtam"`, `"jegyzet"`, `"keresek"`, `"volt szó"` → Ezeket az AI3 kiszűri, de zavarhatnak
5. **Cue word elöl** `"smart ..."` vagy `"concept ..."` mindig a keresés elején legyen!

#### Melyik módot válasszam?

| Ha ez a helyzet... | Használd... | Példa |
|-------------------|-------------|-------|
| Két konkrét dolog kapcsolatát keresem | **AI2 (smart)** | `"smart arab csillagászat megfigyelés"` – a két fogalom közel van egymáshoz |
| Egy témakör összes előfordulását keresem | **AI3 (concept)** | `"concept görög filozófia"` – szélesebb, dokumentum-szintű keresés |
| Időkorlát is van | **Mindkettő működik** | `"smart ... 2 hete"` vagy `"concept ... januárban"` |
| Nem vagyok benne biztos, mi a pontos kifejezés | **AI3 (concept)** | `"concept víz folyó természet"` – a szinonimákat is megtalálja |

> **Fontos:** Az AI **prompt-alapú**. A te feladatod **igazodni a promptokhoz**, nem a promptoknak igazodniuk hozzád. Ha a keresés nem hoz eredményt, próbáld meg: (1) eltávolítani a kérdőjeleket, (2) konkrétabb kulcsszavakat használni, (3) egyértelmű időhatározókat írni, (4) kipróbálni mindkét módot.

---

## Keresési előzmények

A plugin menti a korábbi keresési mintákat. Az előzmények a keresőmodálban egy legördülő listán érhetők el.

- **Rögzítés (pin):** az előzmény-elemek mellett lévő gombbal az adott keresés a lista tetejére rögzíthető. Rögzített elemek külön korlátja (alapértelmezés: 30), a többi elemé szintén konfigurálható (alapértelmezés: 100).
- **Törlés:** az előzmény-elemek egyenként törölhetők.

Az előzmények, valamint a regex- és AI-mód állapota a `.obsidian/plugins/global-search-or-replace/state.json` fájlban tárolódik.

---

## Egyéb beállítások

### Nyelvi beállítás felülírása

| Beállítás | Leírás | Alapértelmezés |
|---|---|---|
| **Locale Override** | Nyelvi beállítás felülírása (pl. `hu`, `en`, `de`). Üres érték esetén az Obsidian nyelvezete használható. | *(üres)* |

### AI modellek

| Beállítás | Leírás | Alapértelmezés |
|---|---|---|
| **aiGeminiModel2** | Másodlagos Gemini modell (fallback) | `gemini-2.5-flash` |

---

## Beállítások részletes leírása

A plugin beállításai a **Settings → Global Search Or Replace** menüpont alatt találhatók.

### Általános korlátok

| Beállítás | Leírás | Alapértelmezés |
|---|---|---|
| Max History Items | Eltárolt keresési előzmények maximális száma | 100 |
| Max Pinned History Items | Rögzített előzmények maximális száma | 30 |
| Excluded Folders | Vesszővel elválasztott mappa-nevek, amelyeket a keresés kihagya | `templates, SYSTEM` |
| Max open results without confirm | E felett megerősítést kér a „To Results" | 50 |
| Max copy files without confirm | E felett megerősítést kér a tömeges másolás | 500 |

### Keresési korlátok — Desktop

| Beállítás | Alapértelmezés |
|---|---|
| Result Limit | 2 000 |
| Batch Size | 500 |

### Keresési korlátok — Mobil

| Beállítás | Alapértelmezés |
|---|---|
| Mobile Result Limit | 200 |
| Mobile Batch Size | 50 |

### Méretezés

| Beállítás | Leírás | Alapértelmezés |
|---|---|---|
| Desktop Modal Scale | A főmodál és az eredménypanel méretarány-korrekciója | 1.0 |
| Mobile Main Modal Scale | Főmodál skálázása mobilon | 0.83 |
| Mobile Preview Modal Scale | Előnézet-modál skálázása mobilon | 1.0 |

A plugin alapértelmezett méretei **100%-os Obsidian Zoom** (alapértelmezett megjelenés) beállításhoz vannak kalibrálva. Ha a rendszered eltérő zoom-szinten fut, itt állíthatod be a helyes arányt.  

**iPadOS ajánlott beállítások:** A nagyobb kijelző miatt ajánlott értékek: **Főmodál: 0.75-0.80**, **Előnézet: 0.90-0.95**.

### Szűrhető property-k (Filterable Properties)

Azok a frontmatter-mezők, amelyek a keresőmodál szűrőpaneljén megjelennek. Minden bejegyzéshez meg kell adni:

- **Field:** a frontmatter-kulcs neve (pl. `tags`, `status`)
- **Type:** az érték típusa — `list`, `text`, `date`, `datetime`, `number`, `checkbox`, vagy `aliases`

A sorrendük módosítható a fel/le nyilakkal, és bármelyik törölhető vagy új vehető fel.

### Rendezhető property-k (Sortable Properties)

Azok a mezők, amelyek az eredménypanel **Rendezés** legördülőjében megjelennek. Csak a mező nevét és típusát kell megadni (típus itt csak a rendezési logikát befolyásolja, `date` típusnál csökkenő, `text` típusnál növekvő az alapértelmezett sorrend).

### Debug és üzenetek

| Beállítás | Leírás |
|---|---|
| Debug Mode | Részletes naplózás a böngésző konzolra (teljesítménnyel kapcsolatos adatokat is tartalmaz) |
| Suppress Messages | Elnyomja az értesítőket (Notice-okat) |

---

## Dátumkezelés

### Frontmatter-kulcs és formátum

A plugin képes automatikusan frissíteni egy frontmatter-mező értékét fájlmódosítás után (elsősorban csere-művelet esetén).

| Beállítás | Leírás | Alapértelmezés |
|---|---|---|
| Date Frontmatter Key | Melyik frontmatter-mezőt frissítse | `date_modified` |
| Date Format | A dátum formátuma a frontmatterben | `YYYY-MM-DDTHH:mm` |

**Megjegyzés a formátumhoz:** a plugin saját token-térképet használ, ahol a kisbetűs `hh` 24 órás formátumot jelent (nem a Luxon-féle `HH`).

### Filter Date Replacer

Ha ez a kapcsoló **be van kapcsolva**, a dátum-frissítés csak azokra a fájlokra vonatkozik, amelyek frontmattere megfelel legalább egy **Date Update Condition** feltételnek.

**Példa feltétel:** `field: status`, `value: dg_uploaded` — csak a `status: dg_uploaded` frontmatterrel rendelkező fájloknál frissíti a dátumot.

Ha a kapcsoló **ki van kapcsolva**, a plugin minden módosított fájlnál frissíti a dátumot.

A Date Update Conditions lista a Settings oldalon szerkeszthető: mező-érték párok adhatók hozzá, törölhetők.

---

## Ismert viselkedések és megjegyzések

- A keresés csak `.md` fájlokra terjed ki.
- A konfigurált **Excluded Folders** mappa-nevei kizárásra kerülnek a keresésből (nem elérési út alapján, hanem a mappa neve alapján).
- Ha a csere futása során a fájl közben megváltozott, az érintett sorok kihagyódnak és értesítő jelzi ezt.
- A block ID generálás (6 karakter, alfanumerikus) automatikusan kezeli a listák, blockquote-ok és kódblokkokat követő pozíciókat.
- Az eredménypanel és a preview-modál állapota (kijelölések, szűrők, oldalszám) nem marad meg, ha bezárod és újra megnyitod.
- A lebegő panelek húzásakor viewport-korlátok érvényesülnek: a panel legalább 100px látható marad az alján, 48px az oldalakon, és nem húzható a képernyő teteje fölé.
