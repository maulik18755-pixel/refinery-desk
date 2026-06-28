# CLAUDE.md — RefineryDesk

## Project Context
Market intelligence dashboard for integrated refinery trading desks. Multi-file architecture (index.html + css/ + js/) with no build step and no framework dependencies.

## Hard Rules
1. **index.html is the entry point** — dashboard.html redirects to it for backward compatibility. Keep `index.html` + `css/style.css` + `js/*.js` in sync.
2. **All simulated data must be clearly labeled** — in the Architecture tab and in code comments. Never present simulated data as live.
3. **Reference prices must be realistic** — seeded from recent market actuals, not random numbers.
4. **GRM calculation must use documented yield split** — currently 35% MS, 40% HSD, 10% ATF, 8% HSFO, 7% VLSFO vs Dubai. Any change must be reflected in the Assumptions section.
5. **Conversion factors are fixed** — Crude: 7.33 bbl/MT. Naphtha: 8.33 bbl/MT. Gasoline: 8.33 bbl/MT. Diesel/Gasoil: 7.46 bbl/MT.
6. **FX API is the only live data source in V1** — open.er-api.com. Do not add API keys or paid services without explicit approval.
7. **Dark theme is mandatory** — trading desk aesthetic. No light mode in V1.
8. **All 9 tabs must remain functional** after any edit. Test by clicking through every tab.

## File Structure
```
index.html              — HTML shell (links css/style.css + js/main.js)
dashboard.html          — Backward-compat redirect to index.html
css/
  style.css             — All CSS (dark theme, grid, cards, responsive)
js/
  data.js               — REF, APP state, initState, tick, utility functions
  api.js                — fetchFxRates, fetchEIACrude, fetchNews, fetchMcx
  render.js             — All renderXxx(), updateScenario(), exportPDF(), CHART_OPTS
  main.js               — Entry point: tab mgmt, alerts, renderAll, mainLoop, init
manifest.json           — PWA manifest
service-worker.js       — Cache-first offline support
icon.svg                — App icon (hexagon + R, cyan on dark)
server.py               — Flask proxy for /api/news, /api/fx, /api/mcx
requirements.txt        — Flask dependencies
README.md               — Documentation
CLAUDE.md               — This file (AI coding guard rails)
.github/workflows/
  deploy.yml            — GitHub Pages deployment workflow
```

## Coding Conventions
- JavaScript: vanilla ES6+, no frameworks
- CSS: custom properties (--var) for all colors, defined in :root
- Data model: REF object holds reference prices, STATE holds live/simulated state
- All render functions named render[TabName]()
- Price formatting: fmt(n, decimals), fmtSgn(n, decimals) for signed
- Direction classes: .up (green), .down (red), .flat (muted)

## Key Functions
- initState() — builds APP.STATE from REF (js/data.js)
- tick() — applies simulated price movements (js/data.js)
- fetchFxRates() — live API call to open.er-api.com (js/api.js)
- renderAll() — calls all tab render functions (js/main.js)
- mainLoop() — tick + renderAll, runs every 5s (js/main.js)
- APP — shared mutable state object, imported across all modules (js/data.js)

## ES6 Module Notes
- All JS files use ES6 modules (`type="module"`); no globals except window.* exposure in main.js
- Inline HTML handlers (onclick, oninput) require: window.toggleCompact, window.exportPDF, window.updateScenario, window.updateWhatIf, window.calcFreight — all set at bottom of main.js
- Mutable state (STATE, grmHistory, chart instances, etc.) lives on the APP object so ES6 live bindings work correctly across modules

## When Adding New Data Sources
1. Add reference data to REF object
2. Update initState() walk if new structure
3. Add render logic in appropriate tab function
4. Document in Architecture tab (source, status, refresh rate)
5. Add to assumptions if methodology involved
