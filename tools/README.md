# Náhledy portfolia

Pro samostatné spuštění je potřeba Node.js s npm. Po přidání nebo změně fotografie nejprve připravte JPEG náhledy obvyklým postupem a aktualizujte `portfolio.html`. Potom ve složce `tools` spusťte:

```powershell
npm install
npm run portfolio:images
```

Skript vytváří AVIF a WebP varianty z původních fotografií v `images/` a `images/portfolio/`, aktualizuje `<picture>` v `portfolio.html` a ponechává stávající JPEG jako zálohu. Varianty nejsou širší než dosavadní největší JPEG náhled. Vypíše také cestu k místní porovnávací stránce všech fotografií pro kontrolu kvality.

## Prompt pro Codex: přidání fotografií do portfolia

Zkopírujte následující prompt a doplňte údaje v hranatých závorkách. Cesty mohou ukazovat na soubory v projektu nebo na přiložené fotografie.

```text
Přidej nové fotografie do portfolia tohoto webu.

Fotografie: [cesty k souborům nebo názvy příloh]
Kategorie pro každou fotografii: [mazlicci / auta / portrety / pary / udalosti / ostatni]
Pořadí v kategorii: [např. na konec, nebo za konkrétní fotografii]
Popis pro alt: [volitelné; pokud chybí, vytvoř výstižný popis podle fotografie]

Nejprve zkontroluj tools/README.md, portfolio.html,
tools/optimize-images.ps1 a tools/generate-portfolio-images.cjs.
Ověř, že vstupní fotografie existují, prohlédni je a zjisti jejich rozměry.
Když chybí soubor nebo není jasná kategorie, požádej mě o upřesnění.

1. Ulož nové zdrojové fotografie do images/portfolio/<kategorie>/
   s jedinečnými, čitelnými názvy .jpg. Pokud je potřeba převod,
   zachovej původní soubor a převeď jen kopii. Nepřepisuj jiné fotografie.
2. Připrav pro každou novou fotografii JPEG do images/thumbs/,
   images/thumbs-mobile/ a images/display/ ve stejné podadresářové
   struktuře. Dodrž rozměry a kvalitu podle tools/optimize-images.ps1.
   Pokud spustíš hromadný skript, zkontroluj i jeho dopad na stávající soubory.
3. Přidej položky do správné části portfolio.html. Zachovej stávající
   strukturu odkazu GLightbox, data-gallery, data-categories a funkci
   filtrů. U obrázku nastav skutečné width a height, výstižný alt,
   JPEG srcset a odpovídající sizes podle sousedních položek.
   Zachovej lazy loading; priority prvních obrázků měň jen s důvodem.
4. Ve složce tools spusť npm install, pokud chybí závislosti, potom
   npm run portfolio:images a npm run images:check. Generátor vytvoří
   AVIF/WebP, doplní <picture> a aktualizuje verzované URL obrázků.
5. Prohlédni vygenerovanou místní porovnávací stránku JPEG/AVIF/WebP.
   Ověř ostrost, barvy a kompresní artefakty nových fotografií.
   Pokud je dostupný prohlížeč, zkontroluj portfolio na mobilu i desktopu,
   filtry kategorií, otevření a přepínání v GLightboxu, lazy loading
   a chybějící soubory. Pokud něco nelze ověřit, napiš proč.

Na závěr stručně vypiš přidané fotografie, vytvořené varianty,
provedené kontroly a případná omezení. Zachovej vzhled webu.
Nic necommituj, nevytvářej Pull Request a nic nenasazuj ani nenahrávej.
```

# Fotografie na úvodní stránce

Čtyři snímky v úvodní mozaice používají varianty AVIF/WebP a původní JPEG jako zálohu. Po změně některého z původních snímků spusťte ve složce `tools`:

```powershell
npm install
npm run home:images
```

Skript vytváří varianty v `images/optimized/` a kontroluje rozměry stávajících JPEGů. Pokud se rozměry JPEGů změní, je potřeba upravit také šířky v `generate-home-images.cjs` a `srcset` v `index.html`. Úvodní fotografie se načítají hned; pes Áres má nastavenou vysokou prioritu.

# Portrét a náhledy poukazu

Stránky `about.html` a `voucher.html` používají menší AVIF/WebP varianty a původní JPEG jako zálohu. Po výměně portrétu nebo náhledů poukazu spusťte ve složce `tools`:

```powershell
npm install
npm run page:images
```

Skript vytvoří varianty v `images/optimized/` a aktualizuje otisky v odkazech. Pokud se změní šířka zdrojového souboru, upravte šířky v `generate-page-images.cjs` a `srcset` v příslušné HTML stránce.

# Cache obrázků

Odkazy na obrázky v HTML a CSS obsahují prvních 16 znaků SHA-256 souboru v parametru `?v=...`. Když se soubor změní, musí se změnit také tento parametr. Vercel dává takovým URL cache na rok (`immutable`); přímé URL bez `v` zůstávají na jedné hodině. Parametr mění URL v prohlížeči, soubory se nekopírují.

Skripty `portfolio:images`, `home:images` a `page:images` po vytvoření variant odkazy aktualizují automaticky. Při sestavení na Vercelu se otisky zkontrolují a případně přepíšou znovu. Po ruční výměně obrázku nebo spuštění `optimize-images.ps1` použijte i místně:

```powershell
npm run images:version
npm run images:check
```

`images:check` jen ověřuje odkazy a skončí chybou, pokud některý otisk chybí nebo neodpovídá souboru. Před nasazením ho spusťte znovu, zejména po změnách fotografií. Původní odkazy uložené mimo HTML a CSS (například v externích příspěvcích) zůstávají funkční, ale mají hodinovou cache.
