import { APP, get, addRefreshLog, EIA_API_KEY, FRED_API_KEY } from './data.js';

// ──────────────────────────────────────────────
// SECTION 8: LIVE DATA FETCH FUNCTIONS
// ──────────────────────────────────────────────

export async function fetchFxRates() {
  try {
    const resp = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!resp.ok) throw new Error('FX API HTTP ' + resp.status);
    const data = await resp.json();
    if (data.rates) {
      if (data.rates.INR && APP.STATE['fx.usdInr']) { APP.STATE['fx.usdInr'].current = +data.rates.INR.toFixed(2); APP.STATE['fx.usdInr'].base = APP.STATE['fx.usdInr'].current; }
      if (data.rates.EUR && APP.STATE['fx.eurUsd']) { APP.STATE['fx.eurUsd'].current = +(1/data.rates.EUR).toFixed(4); APP.STATE['fx.eurUsd'].base = APP.STATE['fx.eurUsd'].current; }
      if (data.rates.GBP && APP.STATE['fx.gbpUsd']) { APP.STATE['fx.gbpUsd'].current = +(1/data.rates.GBP).toFixed(4); APP.STATE['fx.gbpUsd'].base = APP.STATE['fx.gbpUsd'].current; }
      if (data.rates.CNY && APP.STATE['fx.cnyUsd']) { APP.STATE['fx.cnyUsd'].current = +data.rates.CNY.toFixed(4); APP.STATE['fx.cnyUsd'].base = APP.STATE['fx.cnyUsd'].current; }
      if (data.rates.JPY && APP.STATE['fx.jpyUsd']) { APP.STATE['fx.jpyUsd'].current = +data.rates.JPY.toFixed(2); APP.STATE['fx.jpyUsd'].base = APP.STATE['fx.jpyUsd'].current; }
      APP.fxLive = true;
      addRefreshLog('FX API (open.er-api.com)', 'live', 'Rates updated: INR=' + data.rates.INR);
    }
  } catch(e) {
    console.warn('FX fetch failed:', e);
    addRefreshLog('FX API', 'simulated', 'Fetch failed — using reference rates. ' + e.message);
  }
}

// ── 2A: EIA CRUDE SPOT PRICES ──
// Fetches Brent (RBRTE) and WTI (RWTC) daily spot prices from EIA Open Data API v2.
// Requires EIA_API_KEY. Falls back silently to reference data if key missing or CORS/network error.
export async function fetchEIACrude() {
  if (!EIA_API_KEY) return;
  try {
    const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}` +
      `&frequency=daily&data[0]=value` +
      `&facets[series][]=RBRTE&facets[series][]=RWTC` +
      `&sort[0][column]=period&sort[0][direction]=desc&length=5`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('EIA HTTP ' + resp.status);
    const json = await resp.json();
    const rows = json?.response?.data || [];
    const updated = new Set();
    for (const row of rows) {
      const val = parseFloat(row.value);
      if (!val || isNaN(val)) continue;
      if (row.series === 'RBRTE' && !updated.has('brent') && APP.STATE['crude.brent']) {
        APP.STATE['crude.brent'].current = val;
        APP.STATE['crude.brent'].base = val;
        updated.add('brent');
      }
      if (row.series === 'RWTC' && !updated.has('wti') && APP.STATE['crude.wti']) {
        APP.STATE['crude.wti'].current = val;
        APP.STATE['crude.wti'].base = val;
        updated.add('wti');
      }
      if (updated.size === 2) break;
    }
    if (updated.size > 0) {
      APP.eiaLive = true;
      addRefreshLog('EIA API (api.eia.gov)', 'live',
        `Brent: $${APP.STATE['crude.brent'].current.toFixed(2)} · WTI: $${APP.STATE['crude.wti'].current.toFixed(2)}`);
    }
  } catch(e) {
    console.warn('EIA fetch failed (check key / CORS):', e.message, e);
    addRefreshLog('EIA API', 'simulated', 'Fetch failed: ' + e.message);
  }
}

// ── 2B: NEWS RSS FEED (via Flask /api/news proxy) ──
// Classifies headlines by keyword for level/category display
export function classifyNews(title) {
  const t = title.toUpperCase();
  if (/OPEC|PRODUCTION CUT|OUTPUT QUOTA/.test(t))           return { cat:'OPEC',       level:'high' };
  if (/SANCTION|IRAN|RUSSIA|HOUTHI|WAR|CONFLICT/.test(t))  return { cat:'GEOPOLITIC',  level:'high' };
  if (/REFINER|TURNAROUND|MAINTENAN|OUTAGE|SHUTDOWN/.test(t)) return { cat:'REFINERY',  level:'medium' };
  if (/HURRICANE|STORM|WEATHER|FLOOD|TYPHOON/.test(t))      return { cat:'WEATHER',     level:'medium' };
  if (/FEDERAL|FED |ECB|RBI|INTEREST RATE|INFLATION/.test(t)) return { cat:'MACRO',    level:'low' };
  if (/NAPHTHA|ETHYLENE|PROPYLENE|PETCHEM|CRACKER/.test(t)) return { cat:'PETCHEM',    level:'medium' };
  if (/FREIGHT|TANKER|VLCC|VESSEL|SHIP/.test(t))            return { cat:'FREIGHT',     level:'medium' };
  if (/INDIA|BPCL|HPCL|IOCL|RELIANCE|IOC/.test(t))         return { cat:'DOMESTIC',    level:'medium' };
  return { cat:'CRUDE', level:'medium' };
}

export function newsAge(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const h = Math.floor((Date.now() - d) / 3600000);
  return h < 1 ? Math.floor((Date.now() - d) / 60000) + 'm ago' : h < 24 ? h + 'h ago' : Math.floor(h / 24) + 'd ago';
}

export async function fetchNews() {
  try {
    const resp = await fetch('/api/news');
    if (!resp.ok) throw new Error('News proxy HTTP ' + resp.status);
    const items = await resp.json();
    if (Array.isArray(items) && items.length > 0) {
      APP.liveNews = items.map(n => {
        const { cat, level } = classifyNews(n.title || '');
        return { level, cat, headline: n.title || '', time: newsAge(n.pubDate) || 'recent', source: n.source || '', impact: '' };
      });
      addRefreshLog('News RSS (/api/news)', 'live', `${items.length} headlines loaded from Google News RSS`);
    }
  } catch(e) {
    console.warn('News fetch failed (server.py not running?):', e.message);
    addRefreshLog('News RSS', 'simulated', 'Using curated headlines — start server.py to enable live feed');
  }
}

// ── COMMODITIES: Global futures via /api/commodities (Yahoo Finance via server.py) ──
// BZ=F Brent, CL=F WTI, RB=F RBOB Gasoline, HO=F Heating Oil, NG=F Natural Gas
// $/gallon products are converted to $/bbl (×42) client-side
export async function fetchCommodities() {
  try {
    const resp = await fetch('/api/commodities');
    if (!resp.ok) throw new Error('Commodities proxy HTTP ' + resp.status);
    const data = await resp.json();
    const updates = [];

    // Brent futures → crude.brent (if EIA not live)
    if (data.brentFutures?.price && !APP.eiaLive && APP.STATE['crude.brent']) {
      APP.STATE['crude.brent'].current = +data.brentFutures.price.toFixed(2);
      APP.STATE['crude.brent'].base    = APP.STATE['crude.brent'].current;
      updates.push(`Brent $${data.brentFutures.price.toFixed(2)}`);
    }
    // WTI futures → crude.wti (if EIA not live)
    if (data.wtiFutures?.price && !APP.eiaLive && APP.STATE['crude.wti']) {
      APP.STATE['crude.wti'].current = +data.wtiFutures.price.toFixed(2);
      APP.STATE['crude.wti'].base    = APP.STATE['crude.wti'].current;
      updates.push(`WTI $${data.wtiFutures.price.toFixed(2)}`);
    }
    // RBOB Gasoline $/gallon → $/bbl (×42) → products.gasolineUSGC
    if (data.gasolineRBOB?.price && APP.STATE['products.gasolineUSGC']) {
      const bbl = +(data.gasolineRBOB.price * 42).toFixed(2);
      APP.STATE['products.gasolineUSGC'].current = bbl;
      APP.STATE['products.gasolineUSGC'].base    = bbl;
      updates.push(`RBOB $${bbl}/bbl`);
    }
    // Heating Oil $/gallon → $/bbl (×42) → products.dieselUSGC
    if (data.heatingOil?.price && APP.STATE['products.dieselUSGC']) {
      const bbl = +(data.heatingOil.price * 42).toFixed(2);
      APP.STATE['products.dieselUSGC'].current = bbl;
      APP.STATE['products.dieselUSGC'].base    = bbl;
      updates.push(`HO $${bbl}/bbl`);
    }
    // Store raw commodities data for display
    APP.commoditiesData = data;

    if (updates.length > 0) {
      APP.commoditiesLive = true;
      addRefreshLog('Yahoo Finance (/api/commodities)', 'live', updates.join(' · '));
    }
  } catch(e) {
    console.warn('Commodities fetch failed (server.py not running?):', e.message);
    addRefreshLog('Commodities (Yahoo Finance)', 'simulated', 'Fetch failed — start server.py to enable');
  }
}

// ── FRED API: US macro rates (Fed Funds, 10Y Treasury) ──
// Free key at https://fred.stlouisfed.org/docs/api/api_key.html
// Series used: FEDFUNDS (Fed Funds rate), GS10 (10Y Treasury), DTWEXBGS (Dollar Index)
export async function fetchFred() {
  if (!FRED_API_KEY) return;
  const series = [
    { id: 'FEDFUNDS', label: 'Fed Funds Rate' },
    { id: 'GS10',     label: '10Y Treasury' },
  ];
  const results = [];
  try {
    for (const s of series) {
      const url = `https://api.stlouisfed.org/fred/series/observations` +
        `?series_id=${s.id}&api_key=${FRED_API_KEY}&file_type=json` +
        `&sort_order=desc&limit=1`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const json = await resp.json();
      const val = json?.observations?.[0]?.value;
      if (val && val !== '.') {
        results.push(`${s.label}: ${parseFloat(val).toFixed(2)}%`);
        // Store for use in renderFx rate table
        if (!APP.fredData) APP.fredData = {};
        APP.fredData[s.id] = parseFloat(val);
      }
    }
    if (results.length > 0) {
      APP.fredLive = true;
      addRefreshLog('FRED API (St. Louis Fed)', 'live', results.join(' · '));
    }
  } catch(e) {
    console.warn('FRED fetch failed (check key / CORS):', e.message, e);
    addRefreshLog('FRED API', 'simulated', 'Fetch failed: ' + e.message);
  }
}

// ── 2C: MCX CRUDE OIL FUTURES ──
// Fetches near-month MCX crude price (₹/bbl) via Flask /api/mcx proxy (Yahoo Finance).
// Falls back silently — row shows "--" with tooltip when server is not running.
export async function fetchMcx() {
  try {
    const resp = await fetch('/api/mcx');
    if (!resp.ok) throw new Error('MCX proxy HTTP ' + resp.status);
    const data = await resp.json();
    if (data.price) {
      APP.mcxData = data;
      const usdInr = get('fx.usdInr').current || 83.72;
      addRefreshLog('MCX API (/api/mcx)', 'live',
        `CRUDEOIL.MCX ₹${Number(data.price).toLocaleString('en-IN',{maximumFractionDigits:0})}/bbl ≈ $${(data.price/usdInr).toFixed(2)}`);
    }
  } catch(e) {
    console.warn('MCX fetch failed (server.py not running?):', e.message);
  }
}
