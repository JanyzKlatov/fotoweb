# Náhledy portfolia

Pro samostatné spuštění je potřeba Node.js s npm. Po přidání nebo změně fotografie nejprve připravte JPEG náhledy obvyklým postupem a aktualizujte `portfolio.html`. Potom ve složce `tools` spusťte:

```powershell
npm install
npm run portfolio:images
```

Skript vytváří AVIF a WebP varianty z původních fotografií v `images/` a `images/portfolio/`, aktualizuje `<picture>` v `portfolio.html` a ponechává stávající JPEG jako zálohu. Varianty nejsou širší než dosavadní největší JPEG náhled. Vypíše také cestu k místní porovnávací stránce všech fotografií pro kontrolu kvality.

# Fotografie na úvodní stránce

Čtyři snímky v úvodní mozaice používají varianty AVIF/WebP a původní JPEG jako zálohu. Po změně některého z původních snímků spusťte ve složce `tools`:

```powershell
npm install
npm run home:images
```

Skript vytváří varianty v `images/optimized/` a kontroluje rozměry stávajících JPEGů. Pokud se rozměry JPEGů změní, je potřeba upravit také šířky v `generate-home-images.cjs` a `srcset` v `index.html`. Úvodní fotografie se načítají hned; pes Áres má nastavenou vysokou prioritu.

# Cache obrázků

Odkazy na obrázky v HTML a CSS obsahují prvních 16 znaků SHA-256 souboru v parametru `?v=...`. Když se soubor změní, musí se změnit také tento parametr. Vercel dává takovým URL cache na rok (`immutable`); přímé URL bez `v` zůstávají na jedné hodině. Parametr mění URL v prohlížeči, soubory se nekopírují.

Skripty `portfolio:images` a `home:images` po vytvoření variant odkazy aktualizují automaticky. Při sestavení na Vercelu se otisky zkontrolují a případně přepíšou znovu. Po ruční výměně obrázku nebo spuštění `optimize-images.ps1` použijte i místně:

```powershell
npm run images:version
npm run images:check
```

`images:check` jen ověřuje odkazy a skončí chybou, pokud některý otisk chybí nebo neodpovídá souboru. Před nasazením ho spusťte znovu, zejména po změnách fotografií. Původní odkazy uložené mimo HTML a CSS (například v externích příspěvcích) zůstávají funkční, ale mají hodinovou cache.
