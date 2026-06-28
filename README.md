# RefineryDesk — Market Dashboard for Refinery Trading Desks

A real-time market intelligence dashboard built for commercial trading teams at integrated refineries. Covers crude oil, fuel products, petrochemical feedstock, cracks & margins, FX, logistics, and news — all in a single-screen interface.

## Quick Start

```bash
# Option 1: Just open it
open dashboard.html

# Option 2: Local server (avoids CORS issues for live API calls)
python3 -m http.server 8080
# Then visit http://localhost:8080/dashboard.html
```

## What's Inside

| Tab | Covers | Data Source |
|-----|--------|-------------|
| Command Center | KPI strip, benchmarks, cracks, arbitrage windows | Simulated + Live FX |
| Crude Oil | 9 grades, differentials, OPEC+ context, procurement signals | Simulated |
| Fuel Products | Gasoline, diesel, jet, fuel oil across MOPS/NWE/USGC | Simulated |
| Petrochemicals | Naphtha, olefins, aromatics, cracker economics | Simulated |
| Cracks & Margins | Crack spreads, GRM proxy, what-if slider, regional comparison | Calculated |
| FX & Macro | Currency rates, FX-GRM sensitivity, PMI, policy rates | **Live** (FX API) |
| Logistics & Freight | Tanker rates, route costs, freight calculator, port status | Simulated |
| News & Alerts | Categorized headlines with market impact assessment | Curated |
| Architecture & Data | Sources, refresh log, assumptions, system diagram | Documentation |

## Live Data

- **FX Rates**: Fetched from [Open Exchange Rates API](https://open.er-api.com) every 60 seconds (free, no key required)
- **All other data**: Reference prices seeded from recent market actuals with simulated tick updates every 5 seconds

## Architecture

```
FREE APIs ──┐
             ├──▶ Data Normalization ──▶ Calculation Engine ──▶ Dashboard UI
REFERENCE ──┘     (unit/FX/time)        (cracks/GRM/arbs)      (9 tabs)
DATA
```

## Production Upgrade Path

Replace simulated feeds with:
- **Crude/Products**: Platts eWindow, Argus, OPIS, ICE API
- **Petrochemicals**: ICIS, Platts Petrochemicals
- **Freight**: Baltic Exchange API, Clarksons SIN
- **News**: Reuters News API, Bloomberg B-PIPE
- **Internal**: SAP IS-Oil, CTRM system, scheduling

## Tech Stack

- Pure HTML/CSS/JavaScript — no build step, no dependencies
- Google Fonts (Inter + JetBrains Mono)
- Designed for 1920×1080+ trading desk monitors

## License

Internal use.
