# CLAUDE.md — RefineryDesk

## Project Context
Market intelligence dashboard for integrated refinery trading desks. Single HTML file (dashboard.html) with embedded CSS and JavaScript. No build step, no framework dependencies.

## Hard Rules
1. **Never break the single-file architecture** — dashboard.html must remain self-contained and runnable by opening in a browser.
2. **All simulated data must be clearly labeled** — in the Architecture tab and in code comments. Never present simulated data as live.
3. **Reference prices must be realistic** — seeded from recent market actuals, not random numbers.
4. **GRM calculation must use documented yield split** — currently 35% MS, 40% HSD, 10% ATF, 8% HSFO, 7% VLSFO vs Dubai. Any change must be reflected in the Assumptions section.
5. **Conversion factors are fixed** — Crude: 7.33 bbl/MT. Naphtha: 8.33 bbl/MT. Gasoline: 8.33 bbl/MT. Diesel/Gasoil: 7.46 bbl/MT.
6. **FX API is the only live data source in V1** — open.er-api.com. Do not add API keys or paid services without explicit approval.
7. **Dark theme is mandatory** — trading desk aesthetic. No light mode in V1.
8. **All 9 tabs must remain functional** after any edit. Test by clicking through every tab.

## File Structure
```
dashboard.html    — The entire application
README.md         — Documentation
CLAUDE.md         — This file (AI coding guard rails)
```

## Coding Conventions
- JavaScript: vanilla ES6+, no frameworks
- CSS: custom properties (--var) for all colors, defined in :root
- Data model: REF object holds reference prices, STATE holds live/simulated state
- All render functions named render[TabName]()
- Price formatting: fmt(n, decimals), fmtSgn(n, decimals) for signed
- Direction classes: .up (green), .down (red), .flat (muted)

## Key Functions
- initState() — builds STATE from REF
- tick() — applies simulated price movements
- fetchFxRates() — live API call to open.er-api.com
- renderAll() — calls all tab render functions
- mainLoop() — tick + renderAll, runs every 5s

## When Adding New Data Sources
1. Add reference data to REF object
2. Update initState() walk if new structure
3. Add render logic in appropriate tab function
4. Document in Architecture tab (source, status, refresh rate)
5. Add to assumptions if methodology involved
