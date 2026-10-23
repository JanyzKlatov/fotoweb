# Náhledy portfolia

Pro samostatné spuštění je potřeba Node.js s npm. Po přidání nebo změně fotografie nejprve připravte JPEG náhledy obvyklým postupem a aktualizujte `portfolio.html`. Potom ve složce `tools` spusťte:

```powershell
npm install
npm run portfolio:images
```

Skript vytváří AVIF a WebP varianty z původních fotografií v `images/` a `images/portfolio/`, aktualizuje `<picture>` v `portfolio.html` a ponechává stávající JPEG jako zálohu. Varianty nejsou širší než dosavadní největší JPEG náhled. Vypíše také cestu k místní porovnávací stránce všech fotografií pro kontrolu kvality.
