import { APP, initState, tick, addRefreshLog, get } from './data.js';
import { fetchFxRates, fetchEIACrude, fetchNews, fetchMcx } from './api.js';
import {
  renderCommand, renderCrude, renderProducts, renderPetchem,
  renderCracks, updateWhatIf, updateScenario,
  renderFx, renderLogistics, calcFreight,
  renderNews, renderArchitecture, exportPDF,
} from './render.js';

// ──────────────────────────────────────────────
// SECTION 4: CLOCKS & MARKET STATUS
// ──────────────────────────────────────────────
function updateClocks() {
  const now = new Date();
  const opts = { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false };
  document.getElementById('istTime').textContent = now.toLocaleTimeString('en-GB', {...opts, timeZone:'Asia/Kolkata'});
  document.getElementById('sgtTime').textContent = now.toLocaleTimeString('en-GB', {...opts, timeZone:'Asia/Singapore'});
  document.getElementById('ldnTime').textContent = now.toLocaleTimeString('en-GB', {...opts, timeZone:'Europe/London'});
  document.getElementById('nycTime').textContent = now.toLocaleTimeString('en-GB', {...opts, timeZone:'America/New_York'});
}

function updateMarketStatus() {
  const now = new Date();
  const markets = [
    { name:'NYMEX', tz:'America/New_York', open:9, close:14.5 },
    { name:'ICE', tz:'Europe/London', open:8, close:18 },
    { name:'DME', tz:'Asia/Singapore', open:6.5, close:17.5 },
    { name:'SGX', tz:'Asia/Singapore', open:8, close:18 },
    { name:'MCX', tz:'Asia/Kolkata', open:9, close:23.5 },
  ];
  const el = document.getElementById('marketStatus');
  el.innerHTML = markets.map(m => {
    const h = parseFloat(now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:m.tz}).replace(':','.'));
    const isOpen = h >= m.open && h < m.close && now.getDay()>0 && now.getDay()<6;
    return `<span><span class="dot ${isOpen?'open':'closed'}"></span>${m.name}</span>`;
  }).join('');
}

// ──────────────────────────────────────────────
// SECTION 5: ALERT SYSTEM
// ──────────────────────────────────────────────
const ALERTS = [
  { level:'urgent', text:'OPEC+ ministerial meeting outcome pending — production cut extension under discussion for Q3 2025' },
  { level:'urgent', text:'Red Sea disruption: Houthi attacks escalate; Suez transit insurance premiums surge 150%' },
  { level:'watch', text:'India monsoon forecast: IMD predicts above-normal rainfall — domestic diesel demand seasonally weak' },
  { level:'watch', text:'US SPR release: DoE announces additional 20 MMbbl release over next 60 days' },
  { level:'watch', text:'China Teapot refiners: Shandong independent utilization drops to 58% on weak margins' },
  { level:'urgent', text:'Iran sanctions: EU announces new restrictions on Iranian crude exports effective Aug 1' },
  { level:'watch', text:'Singapore MOPS window: Gasoline assessment firm; multiple buy-side bids in window' },
  { level:'watch', text:'Indian OMC price revision: BPCL, HPCL expected to adjust MS/HSD prices within 48 hrs' },
];
let alertIdx = 0;

function rotateAlert() {
  const a = ALERTS[alertIdx % ALERTS.length];
  const banner = document.getElementById('alertBanner');
  banner.className = 'alert-banner' + (a.level==='watch'?' amber':'');
  document.getElementById('alertTag').className = 'tag ' + (a.level==='urgent'?'urgent':'watch');
  document.getElementById('alertTag').textContent = a.level.toUpperCase();
  document.getElementById('alertTicker').textContent = a.text + '     ●     ' + a.text;
  alertIdx++;
}

// ──────────────────────────────────────────────
// SECTION 6: TAB MANAGEMENT
// ──────────────────────────────────────────────
const TAB_ORDER = ['command','crude','products','petchem','cracks','fx','logistics','news','architecture'];

function switchTab(idx) {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach(b => b.classList.remove('active'));
  contents.forEach(c => c.classList.remove('active'));
  tabs[idx].classList.add('active');
  document.getElementById('tab-' + TAB_ORDER[idx]).classList.add('active');
  tabs[idx].scrollIntoView({block:'nearest',inline:'nearest'});
}

document.querySelectorAll('.tab-btn').forEach((btn, i) => {
  btn.addEventListener('click', () => switchTab(i));
});

document.addEventListener('keydown', e => {
  const n = parseInt(e.key);
  if (n >= 1 && n <= 9 && !e.target.matches('input,select,textarea')) switchTab(n - 1);
});

let compactOn = false;
function toggleCompact() {
  compactOn = !compactOn;
  document.body.classList.toggle('compact', compactOn);
  document.getElementById('compactBtn').classList.toggle('active', compactOn);
}

// ──────────────────────────────────────────────
// SECTION 9: MASTER RENDER & REFRESH LOOP
// ──────────────────────────────────────────────
function renderAll() {
  renderCommand();
  renderCrude();
  renderProducts();
  renderPetchem();
  renderCracks();
  renderFx();
  renderLogistics();
  renderNews();
  renderArchitecture();
  const tsStr = 'Updated: ' + new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Asia/Kolkata'}) + ' IST';
  document.querySelectorAll('.tab-timestamp').forEach(el => el.textContent = tsStr);
  document.getElementById('lastRefresh').textContent = 'Last data refresh: ' + new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Asia/Kolkata'}) + ' IST';
}

function mainLoop() {
  tick();
  const _d = get('crude.dubai').current;
  const _grm = get('products.gasolineMOPS').current*0.35 + get('products.dieselMOPS').current*0.40 +
               get('products.jetMOPS').current*0.10 + get('products.hsfo380').current*0.08 +
               get('products.vlsfo').current*0.07 - _d;
  APP.grmHistory.push(+_grm.toFixed(2));
  if (APP.grmHistory.length > 100) APP.grmHistory.shift();
  renderAll();
  addRefreshLog('Simulation Engine', 'simulated', 'Tick applied to all reference data');
}

// ──────────────────────────────────────────────
// SECTION 10: INITIALIZATION
// ──────────────────────────────────────────────
initState();
renderAll();
rotateAlert();
updateClocks();
updateMarketStatus();

fetchFxRates();
fetchEIACrude();
fetchNews();
fetchMcx();

setInterval(mainLoop, 5000);
setInterval(updateClocks, 1000);
setInterval(updateMarketStatus, 30000);
setInterval(rotateAlert, 12000);
setInterval(fetchFxRates, 60000);
setInterval(fetchEIACrude, 300000);
setInterval(fetchNews, 300000);
setInterval(fetchMcx, 300000);

addRefreshLog('System', 'live', 'Dashboard initialized');
addRefreshLog('Reference Data', 'simulated', 'All crude, product, petchem, freight prices loaded from reference set');

// Expose functions needed by inline HTML event handlers
window.toggleCompact = toggleCompact;
window.exportPDF = exportPDF;
window.updateScenario = updateScenario;
window.updateWhatIf = updateWhatIf;
window.calcFreight = calcFreight;

// ── 4C: Register service worker for PWA offline support ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(() => {});
}
