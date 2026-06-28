// ──────────────────────────────────────────────
// SECTION 1: REFERENCE DATA MODEL
// All prices are reference values seeded from recent market actuals.
// In production, these would be replaced by live API feeds.
// ──────────────────────────────────────────────
export const REF = {
  crude: {
    brent:       { price: 74.85, unit: '$/bbl', source: 'ICE Futures', region: 'Global' },
    wti:         { price: 70.23, unit: '$/bbl', source: 'NYMEX', region: 'US' },
    dubai:       { price: 73.10, unit: '$/bbl', source: 'Platts/DME', region: 'Asia' },
    oman:        { price: 73.45, unit: '$/bbl', source: 'DME', region: 'ME' },
    murban:      { price: 74.20, unit: '$/bbl', source: 'IFAD', region: 'UAE' },
    basrahLight: { price: 71.80, unit: '$/bbl', source: 'Iraq SOMO', region: 'Iraq' },
    arabLight:   { price: 73.60, unit: '$/bbl', source: 'Aramco OSP', region: 'KSA' },
    upperZakum: { price: 73.90, unit: '$/bbl', source: 'ADNOC', region: 'UAE' },
    espo:        { price: 72.50, unit: '$/bbl', source: 'Platts', region: 'Russia' },
  },
  products: {
    gasolineMOPS:  { price: 86.40, unit: '$/bbl', region: 'Singapore' },
    gasolineNWE:   { price: 88.10, unit: '$/bbl', region: 'NW Europe' },
    gasolineUSGC:  { price: 84.20, unit: '$/bbl', region: 'US Gulf' },
    dieselMOPS:    { price: 90.50, unit: '$/bbl', region: 'Singapore' },
    dieselNWE:     { price: 92.30, unit: '$/bbl', region: 'NW Europe' },
    dieselUSGC:    { price: 88.70, unit: '$/bbl', region: 'US Gulf' },
    jetMOPS:       { price: 88.60, unit: '$/bbl', region: 'Singapore' },
    jetNWE:        { price: 90.40, unit: '$/bbl', region: 'NW Europe' },
    jetUSGC:       { price: 86.90, unit: '$/bbl', region: 'US Gulf' },
    hsfo380:       { price: 58.40, unit: '$/bbl', region: 'Singapore' },
    vlsfo:         { price: 76.20, unit: '$/bbl', region: 'Singapore' },
    hsfoNWE:       { price: 56.80, unit: '$/bbl', region: 'NW Europe' },
  },
  petchem: {
    naphthaJapan:  { price: 618, unit: '$/MT', region: 'Japan CFR' },
    naphthaNWE:    { price: 605, unit: '$/MT', region: 'NWE CIF' },
    naphthaMOPS:   { price: 612, unit: '$/MT', region: 'Singapore' },
    ethyleneSEA:   { price: 910, unit: '$/MT', region: 'SE Asia CFR' },
    ethyleneNEA:   { price: 935, unit: '$/MT', region: 'NE Asia CFR' },
    propyleneSEA:  { price: 830, unit: '$/MT', region: 'SE Asia CFR' },
    propyleneNEA:  { price: 855, unit: '$/MT', region: 'NE Asia CFR' },
    benzeneFOB:    { price: 845, unit: '$/MT', region: 'Korea FOB' },
    benzeneCFR:    { price: 870, unit: '$/MT', region: 'SE Asia CFR' },
    toluene:       { price: 760, unit: '$/MT', region: 'SE Asia FOB' },
    paraxylene:    { price: 920, unit: '$/MT', region: 'Asia CFR' },
    mixedXylene:   { price: 780, unit: '$/MT', region: 'SE Asia FOB' },
  },
  fx: {
    usdInr: { rate: 83.72, source: 'RBI Reference' },
    eurUsd: { rate: 1.0890, source: 'ECB' },
    gbpUsd: { rate: 1.2710, source: 'BoE' },
    cnyUsd: { rate: 7.2450, source: 'PBoC' },
    jpyUsd: { rate: 154.80, source: 'BoJ' },
  },
  freight: {
    vlccAGEast:     { ws: 48,  flatRate: 9.80,  dollarPerBbl: 1.65, route: 'AG → East India' },
    vlccAGWest:     { ws: 52,  flatRate: 10.20, dollarPerBbl: 1.72, route: 'AG → West India' },
    suezmaxAGInd:   { ws: 92,  flatRate: 14.50, dollarPerBbl: 2.10, route: 'AG → India' },
    aframaxAGInd:   { ws: 128, flatRate: 18.20, dollarPerBbl: 2.85, route: 'AG → India' },
    mrAGInd:        { ws: 195, flatRate: 22.80, dollarPerBbl: 3.60, route: 'AG → India' },
    vlccWAFInd:     { ws: 55,  flatRate: 18.50, dollarPerBbl: 3.10, route: 'WAF → India' },
    suezmaxWAFInd:  { ws: 98,  flatRate: 22.00, dollarPerBbl: 3.45, route: 'WAF → India' },
    mrSingInd:      { ws: 160, flatRate: 12.50, dollarPerBbl: 1.98, route: 'Singapore → India' },
  },
};

// EIA API key — free at https://www.eia.gov/opendata/  (takes ~1 min to register)
// Enables live Brent & WTI daily spot prices
export const EIA_API_KEY = '8LNlhkIfu8vNodT6Gbm6626BJCBSeZlakc6KwmHD';

// FRED API key — free at https://fred.stlouisfed.org/docs/api/api_key.html  (~1 min)
// Enables live US Fed Funds rate, 10Y Treasury yield, DXY dollar index
export const FRED_API_KEY = '8894355ca737e11c6cb1026ec1964847';

// Curated reference headlines — used as fallback when live news is unavailable
// SIMULATED: these are static reference examples, not live feed data
export const CURATED_NEWS = [
  { level:'critical', cat:'OPEC', headline:'OPEC+ extends 2.2 MMbpd voluntary cuts through Q3 2025; next review at July ministerial', time:'2h ago', impact:'Bullish crude — supports $70+ floor on Brent. Reduces spot availability of Arab Medium/Heavy grades.' },
  { level:'critical', cat:'GEOPOLITICAL', headline:'Houthi drone strike damages Greek-flagged Aframax in southern Red Sea; crew evacuated', time:'4h ago', impact:'Freight surge on AG-West routes. Suez diversion adds 10-14 days and $2-3/bbl on WAF-to-India routes via Cape.' },
  { level:'high', cat:'REFINERY', headline:'PetroChina Dalian 400K bpd refinery begins planned turnaround — 45-day maintenance window', time:'6h ago', impact:'Bearish crude demand from NEA. Bullish regional product cracks (gasoil, naphtha tightening).' },
  { level:'high', cat:'POLICY', headline:'India cuts windfall tax on crude to zero; diesel export tax maintained at ₹1/litre', time:'8h ago', impact:'Positive for Indian E&P. Marginal negative for private refiner product export economics.' },
  { level:'high', cat:'WEATHER', headline:'Hurricane season: Tropical Storm approaching USGC — Phillips 66 Sweeny, Motiva Port Arthur on watch', time:'10h ago', impact:'Bullish USGC gasoline and diesel. Could create transatlantic arb opportunities. Watch Colonial Pipeline nominations.' },
  { level:'medium', cat:'PETCHEM', headline:'Asia naphtha crack recovers to 6-week high as steam crackers restart post-turnaround season', time:'12h ago', impact:'Naphtha demand strengthening. Supports naphtha-as-feed economics over fuel pooling.' },
  { level:'medium', cat:'TRADE', headline:'India-Russia crude trade: ESPO blend discount narrows to $4/bbl below Brent from $8 in Q1', time:'14h ago', impact:'Reduced cost advantage of Russian grades. Indian refiners may shift marginal barrels back to AG sour.' },
  { level:'low', cat:'MACRO', headline:'China PBoC holds LPR unchanged at 3.45%; industrial output growth slows to 5.0% YoY', time:'16h ago', impact:'Mildly bearish demand outlook. Supports range-bound pricing rather than breakout.' },
  { level:'medium', cat:'FREIGHT', headline:'VLCC fleet utilization hits 92% — newbuild delivery schedule shows 18 vessels in H2 2025', time:'18h ago', impact:'Tight vessel supply supports elevated freight rates through summer. Long-haul routes most impacted.' },
  { level:'low', cat:'STORAGE', headline:'Fujairah oil product stocks drop 8% WoW — middle distillate draws lead decline', time:'20h ago', impact:'Regional diesel/gasoil tightness. Supports MOPS gasoil assessment.' },
  { level:'high', cat:'SANCTIONS', headline:'EU finalizes 14th sanctions package against Russia — targets shadow fleet insurance and STS transfers', time:'22h ago', impact:'Increases cost of Russian crude procurement. Benefits compliant refiners; tightens Urals supply to non-sanctioned buyers.' },
  { level:'medium', cat:'DOMESTIC', headline:'BPCL, HPCL signal MS/HSD price adjustment within 48 hours amid rising OMC under-recoveries', time:'1d ago', impact:'May improve retail margins if passed through. Watch for demand elasticity response in Indian market.' },
];

// ──────────────────────────────────────────────
// SECTION 2: MUTABLE APP STATE
// All mutable state lives on this object so ES6 module imports share the same reference.
// ──────────────────────────────────────────────
export const APP = {
  STATE: {},
  refreshLog: [],
  fxLive: null,
  eiaLive: false,
  commoditiesLive: false,
  fredLive: false,
  liveNews: null,
  mcxData: null,
  grmHistory: [],
  crudePriceChart: null,
  grmTrendChart: null,
  scenarioInitted: false,
};

export function initState() {
  APP.STATE = {};
  function walk(obj, path='') {
    for (const [k,v] of Object.entries(obj)) {
      const p = path ? `${path}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v) && ('price' in v || 'rate' in v || 'ws' in v)) {
        const base = v.price || v.rate || v.ws;
        APP.STATE[p] = { base, current: base, change: 0, pctChange: 0, history: Array(24).fill(base), unit: v.unit||'', source: v.source||'', region: v.region||'', route: v.route||'', flatRate: v.flatRate||0, dollarPerBbl: v.dollarPerBbl||0 };
      } else if (v && typeof v === 'object') {
        walk(v, p);
      }
    }
  }
  walk(REF);
}

export function tick() {
  for (const [k,s] of Object.entries(APP.STATE)) {
    const volatility = k.includes('petchem') ? 0.004 : k.includes('freight') ? 0.006 : k.includes('fx') ? 0.001 : 0.003;
    const delta = s.base * volatility * (Math.random() - 0.5);
    s.current = +(s.current + delta).toFixed(k.includes('fx') ? 4 : 2);
    s.change = +(s.current - s.base).toFixed(k.includes('fx') ? 4 : 2);
    s.pctChange = +((s.change / s.base) * 100).toFixed(2);
    s.history.push(s.current);
    if (s.history.length > 24) s.history.shift();
  }
}

// ──────────────────────────────────────────────
// SECTION 3: UTILITY FUNCTIONS
// ──────────────────────────────────────────────
export function fmt(n, d=2) { return n == null ? '--' : Number(n).toFixed(d); }
export function fmtSgn(n, d=2) { return n == null ? '--' : (n>=0?'+':'') + Number(n).toFixed(d); }
export function cls(n) { return n > 0.005 ? 'up' : n < -0.005 ? 'down' : 'flat'; }
export function priceCell(val, chg, pct, digits=2) {
  const c = cls(chg);
  return `<span class="price-sm">${fmt(val,digits)}</span> <span class="price-change ${c}"><span class="arrow"></span>${fmtSgn(chg,digits)} (${fmtSgn(pct,2)}%)</span>`;
}
export function sparkHTML(history) {
  const mn = Math.min(...history), mx = Math.max(...history), range = mx - mn || 1;
  return '<div class="sparkline-container">' + history.map((v,i) => {
    const h = 4 + ((v - mn)/range)*26;
    const c = i>0 ? (v >= history[i-1] ? 'up' : 'down') : 'up';
    return `<div class="spark-bar ${c}" style="height:${h}px"></div>`;
  }).join('') + '</div>';
}
export function get(path) { return APP.STATE[path]; }

export function addRefreshLog(source, status, detail) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Asia/Kolkata'});
  APP.refreshLog.push({ time, source, status, detail });
  if (APP.refreshLog.length > 50) APP.refreshLog.shift();
}
