import { APP, get, fmt, fmtSgn, cls, sparkHTML, priceCell, CURATED_NEWS } from './data.js';

// ──────────────────────────────────────────────
// SECTION 7: RENDER FUNCTIONS
// ──────────────────────────────────────────────

// Shared dark-theme Chart.js defaults
export const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false, animation: false,
  plugins: { legend: { labels: { color:'#8899aa', font:{ family:"'JetBrains Mono',monospace", size:10 }, boxWidth:12, padding:12 } } },
  scales: {
    x: { grid:{ color:'#1e2a38' }, ticks:{ color:'#8899aa', font:{ size:9 } }, border:{ color:'#1e2a38' } },
    y: { grid:{ color:'#1e2a38' }, ticks:{ color:'#8899aa', font:{ size:9 } }, border:{ color:'#1e2a38' } },
  },
};

// ── 3C: PEARSON CORRELATION ──
export function pearsonCorr(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 1;
  let sA=0,sB=0,sAB=0,sA2=0,sB2=0;
  for (let i=0;i<n;i++){sA+=a[i];sB+=b[i];sAB+=a[i]*b[i];sA2+=a[i]*a[i];sB2+=b[i]*b[i];}
  const num=n*sAB-sA*sB, den=Math.sqrt((n*sA2-sA*sA)*(n*sB2-sB*sB));
  return den===0 ? 1 : Math.max(-1, Math.min(1, num/den));
}

// ── 7a: COMMAND CENTER ──
export function renderCommand() {
  const dubai = get('crude.dubai'), brent = get('crude.brent'), wti = get('crude.wti');
  const usdInr = get('fx.usdInr');
  const gasMOPS = get('products.gasolineMOPS'), dslMOPS = get('products.dieselMOPS');
  const grmVal = ((gasMOPS.current*0.35 + dslMOPS.current*0.40 + get('products.jetMOPS').current*0.10 + get('products.hsfo380').current*0.15) - dubai.current).toFixed(2);

  document.getElementById('kpiStrip').innerHTML = [
    { label:'BRENT', value: fmt(brent.current), delta: fmtSgn(brent.change), c: cls(brent.change) },
    { label:'DUBAI', value: fmt(dubai.current), delta: fmtSgn(dubai.change), c: cls(dubai.change) },
    { label:'WTI', value: fmt(wti.current), delta: fmtSgn(wti.change), c: cls(wti.change) },
    { label:'USD/INR', value: fmt(usdInr.current,2), delta: fmtSgn(usdInr.change,4), c: cls(usdInr.change) },
    { label:'SINGAPORE GRM', value: '$'+grmVal, delta: '', c: parseFloat(grmVal)>0?'up':'down' },
    { label:'MS CRACK', value: fmt(gasMOPS.current - dubai.current), delta: '', c: cls(gasMOPS.current-dubai.current) },
    { label:'HSD CRACK', value: fmt(dslMOPS.current - dubai.current), delta: '', c: cls(dslMOPS.current-dubai.current) },
  ].map(k => `<div class="kpi-item"><div class="kpi-label">${k.label}</div><div class="kpi-value ${k.c}">${k.value}</div><div class="kpi-delta ${k.c}">${k.delta}</div></div>`).join('');

  const benchmarks = [
    { key:'crude.brent', label:'Brent Crude', sub:'ICE Futures Europe' },
    { key:'crude.dubai', label:'Dubai Crude', sub:'Platts / DME' },
    { key:'crude.wti', label:'WTI Crude', sub:'NYMEX' },
    { key:'crude.murban', label:'Murban', sub:'ICE Futures Abu Dhabi' },
  ];
  document.getElementById('commandCards').innerHTML = benchmarks.map(b => {
    const s = get(b.key);
    return `<div class="card"><div class="card-header"><div class="card-title">${b.label}</div><div class="card-badge">${b.sub}</div></div><div class="price-big ${cls(s.change)}">${fmt(s.current)}</div><div class="price-change ${cls(s.change)}"><span class="arrow"></span>${fmtSgn(s.change)} (${fmtSgn(s.pctChange)}%)</div>${sparkHTML(s.history)}</div>`;
  }).join('');

  const cracks = [
    { label:'Gasoline/MS', prod:'products.gasolineMOPS' },
    { label:'Diesel/HSD', prod:'products.dieselMOPS' },
    { label:'Jet/ATF', prod:'products.jetMOPS' },
    { label:'Fuel Oil (HSFO)', prod:'products.hsfo380' },
  ];
  document.getElementById('crackCards').innerHTML = cracks.map(cr => {
    const p = get(cr.prod), d = get('crude.dubai');
    const crack = (p.current - d.current);
    return `<div class="card"><div class="card-header"><div class="card-title">${cr.label} Crack</div><div class="card-badge">vs Dubai</div></div><div class="price-big ${cls(crack)}">${fmtSgn(crack)}</div><div style="font-size:10px;color:var(--text-muted);margin-top:4px">Product: $${fmt(p.current)} — Crude: $${fmt(d.current)}</div></div>`;
  }).join('');

  const arbs = [
    { label:'Gasoline East→West', buy: get('products.gasolineMOPS').current, sell: get('products.gasolineNWE').current, freight: 3.20 },
    { label:'Diesel MOPS→India', buy: get('products.dieselMOPS').current, sell: get('products.dieselMOPS').current + 1.80, freight: 1.50 },
    { label:'Naphtha MOPS→Japan', buy: get('petchem.naphthaMOPS').current / 8.33, sell: get('petchem.naphthaJapan').current / 8.33, freight: 1.80 },
  ];
  document.getElementById('arbCards').innerHTML = arbs.map(a => {
    const margin = a.sell - a.buy - a.freight;
    return `<div class="card"><div class="card-header"><div class="card-title">${a.label}</div><div class="card-badge">${margin>0?'OPEN':'CLOSED'}</div></div><div class="price-med ${cls(margin)}">${fmtSgn(margin)} $/bbl</div><div style="font-size:10px;color:var(--text-muted);margin-top:6px">Buy: $${fmt(a.buy)} · Sell: $${fmt(a.sell)} · Freight: $${fmt(a.freight)}</div></div>`;
  }).join('');

  // ── 3C: Price correlation matrix ──
  const corrSeries = [
    { label:'Brent',    key:'crude.brent' },
    { label:'Dubai',    key:'crude.dubai' },
    { label:'WTI',      key:'crude.wti' },
    { label:'Gas MOPS', key:'products.gasolineMOPS' },
    { label:'Dsl MOPS', key:'products.dieselMOPS' },
  ];
  const hists = corrSeries.map(s => get(s.key).history);
  const lbls  = corrSeries.map(s => s.label);
  function corrBg(r, diag) {
    if (diag) return 'background:var(--bg-secondary)';
    if (r > 0.80) return 'background:rgba(34,197,94,.10)';
    if (r > 0.50) return 'background:rgba(245,158,11,.10)';
    return 'background:rgba(239,68,68,.10)';
  }
  function corrFg(r, diag) {
    if (diag) return 'color:var(--text-muted)';
    if (r > 0.80) return 'color:var(--green)';
    if (r > 0.50) return 'color:var(--amber)';
    return 'color:var(--red)';
  }
  let mx = `<table style="width:100%;border-collapse:collapse;font-family:var(--mono);font-size:11px">`;
  mx += `<tr><td style="padding:7px 10px;font-size:9px;color:var(--text-muted)"></td>`;
  lbls.forEach(l => { mx += `<th style="padding:7px 10px;font-size:9px;color:var(--text-secondary);text-align:center;font-weight:600">${l}</th>`; });
  mx += '</tr>';
  hists.forEach((rowH, i) => {
    mx += `<tr><th style="padding:7px 10px;font-size:9px;color:var(--text-secondary);text-align:left;font-weight:600;white-space:nowrap">${lbls[i]}</th>`;
    hists.forEach((colH, j) => {
      const diag = i === j;
      const r = diag ? 1 : pearsonCorr(rowH, colH);
      mx += `<td style="padding:7px 10px;text-align:center;${corrBg(r,diag)};${corrFg(r,diag)};border:1px solid var(--border)">${diag ? '–' : r.toFixed(2)}</td>`;
    });
    mx += '</tr>';
  });
  mx += '</table><div style="padding:8px 10px;font-size:9px;color:var(--text-muted)">Green &gt;0.80 · Amber 0.50–0.80 · Red &lt;0.50 · history window: 24 ticks</div>';
  document.getElementById('correlMatrix').innerHTML = mx;
}

// ── 7b: CRUDE OIL MARKETS ──
export function renderCrude() {
  const grades = [
    ['Brent','crude.brent'],['WTI','crude.wti'],['Dubai','crude.dubai'],['Oman','crude.oman'],
    ['Murban','crude.murban'],['Basrah Light','crude.basrahLight'],['Arab Light','crude.arabLight'],
    ['Upper Zakum','crude.upperZakum'],['ESPO','crude.espo'],
  ];
  const usdInr = get('fx.usdInr').current || 83.72;
  const mcxRow = (() => {
    if (APP.mcxData && APP.mcxData.price) {
      const inr = APP.mcxData.price;
      const usd = (inr / usdInr).toFixed(2);
      const chg = APP.mcxData.previousClose ? (inr - APP.mcxData.previousClose) : null;
      const chgStr = chg !== null ? `<span class="${chg>=0?'up':'down'}">${chg>=0?'+':''}${chg.toFixed(0)}</span>` : '<span class="flat">—</span>';
      return `<tr><td class="label-cell">MCX Crude <span class="sub" style="display:block">Near-Month Futures</span></td><td><span style="font-family:var(--mono)">₹${Number(inr).toLocaleString('en-IN',{maximumFractionDigits:0})}/bbl</span><br><span class="sub">≈ $${usd}</span></td><td>${chgStr}</td><td class="sub">India (MCX)</td><td class="sub" style="font-size:9px;color:var(--green)">● LIVE</td></tr>`;
    }
    return `<tr title="MCX feed pending"><td class="label-cell">MCX Crude <span class="sub" style="display:block">Near-Month Futures</span></td><td class="flat" title="MCX feed pending">--</td><td class="flat">--</td><td class="sub">India (MCX)</td><td class="flat" style="font-size:9px" title="MCX feed pending">server.py</td></tr>`;
  })();

  document.getElementById('crudeBenchmarks').innerHTML = `<thead><tr><th>Grade</th><th>Price ($/bbl)</th><th>Change</th><th>Region</th><th>Trend (24 ticks)</th></tr></thead><tbody>${grades.map(([name,key]) => {
    const s = get(key);
    return `<tr><td class="label-cell">${name}</td><td>${fmt(s.current)}</td><td class="${cls(s.change)}">${fmtSgn(s.change)} (${fmtSgn(s.pctChange)}%)</td><td class="sub">${s.region}</td><td>${sparkHTML(s.history)}</td></tr>`;
  }).join('')}${mcxRow}</tbody>`;

  const diffs = [
    ['Brent – Dubai', get('crude.brent').current - get('crude.dubai').current],
    ['WTI – Brent', get('crude.wti').current - get('crude.brent').current],
    ['Oman – Dubai', get('crude.oman').current - get('crude.dubai').current],
    ['Murban – Dubai', get('crude.murban').current - get('crude.dubai').current],
    ['ESPO – Dubai', get('crude.espo').current - get('crude.dubai').current],
    ['Brent – WTI', get('crude.brent').current - get('crude.wti').current],
  ];
  document.getElementById('crudeDiffs').innerHTML = `<thead><tr><th>Differential</th><th>Value ($/bbl)</th><th>Signal</th></tr></thead><tbody>${diffs.map(([name,val]) => {
    const signal = Math.abs(val) < 1 ? 'Converging' : val > 2 ? 'Wide premium' : val < -2 ? 'Deep discount' : val > 0 ? 'Premium' : 'Discount';
    return `<tr><td class="label-cell">${name}</td><td class="${cls(val)}">${fmtSgn(val,2)}</td><td class="sub">${signal}</td></tr>`;
  }).join('')}</tbody>`;

  document.getElementById('opecCard').innerHTML = `
    <div style="font-size:11px;line-height:1.7;color:var(--text-secondary)">
      <div style="margin-bottom:8px"><strong style="color:var(--text-primary)">Production Quota:</strong> 36.2 MMbpd (OPEC+)</div>
      <div style="margin-bottom:8px"><strong style="color:var(--text-primary)">Compliance:</strong> ~116% (over-compliance by KSA, UAE)</div>
      <div style="margin-bottom:8px"><strong style="color:var(--text-primary)">Voluntary Cuts:</strong> 2.2 MMbpd extended through Q3 2025</div>
      <div style="margin-bottom:8px"><strong style="color:var(--text-primary)">Next Meeting:</strong> July 2025 (full ministerial)</div>
      <div><strong style="color:var(--text-primary)">Key Risk:</strong> UAE pushing for higher baseline; Libya output volatile</div>
    </div>`;

  const dubaiP = get('crude.dubai').current;
  const brentP = get('crude.brent').current;
  const brentDubaiSpread = brentP - dubaiP;
  document.getElementById('procureCard').innerHTML = `
    <div style="font-size:11px;line-height:1.7;color:var(--text-secondary)">
      <div style="margin-bottom:8px"><strong style="color:var(--text-primary)">Brent-Dubai Spread:</strong> <span class="${cls(brentDubaiSpread)}">${fmtSgn(brentDubaiSpread)}</span> — ${brentDubaiSpread > 2 ? 'Favors sour/medium crude procurement' : 'Neutral spread'}</div>
      <div style="margin-bottom:8px"><strong style="color:var(--text-primary)">Aramco OSP (Aug):</strong> Arab Light OSP Asia at +$1.50/bbl vs Oman/Dubai avg</div>
      <div style="margin-bottom:8px"><strong style="color:var(--text-primary)">Spot Market:</strong> Al-Shaheen, Murban cargoes offered; Upper Zakum tight</div>
      <div><strong style="color:var(--text-primary)">Recommendation:</strong> ${brentDubaiSpread > 1.5 ? 'Consider increasing AG sour crude intake vs dated Brent-linked WAF grades' : 'WAF and AG grades at comparable delivered cost'}</div>
    </div>`;

  // ── 3A: Crude price history chart ──
  const brentH = get('crude.brent').history;
  const dubaiH = get('crude.dubai').history;
  const wtiH   = get('crude.wti').history;
  const tickLabels = brentH.map((_, i) => i === brentH.length - 1 ? 'Now' : String(i - brentH.length + 1));
  if (APP.crudePriceChart) {
    APP.crudePriceChart.data.labels = tickLabels;
    APP.crudePriceChart.data.datasets[0].data = [...brentH];
    APP.crudePriceChart.data.datasets[1].data = [...dubaiH];
    APP.crudePriceChart.data.datasets[2].data = [...wtiH];
    APP.crudePriceChart.update('none');
  } else if (document.getElementById('crudePriceChart') && typeof Chart !== 'undefined') {
    APP.crudePriceChart = new Chart(document.getElementById('crudePriceChart').getContext('2d'), {
      type: 'line',
      data: {
        labels: tickLabels,
        datasets: [
          { label:'Brent', data:[...brentH], borderColor:'#3b82f6', backgroundColor:'transparent', borderWidth:1.5, pointRadius:0, tension:0.3 },
          { label:'Dubai', data:[...dubaiH], borderColor:'#f59e0b', backgroundColor:'transparent', borderWidth:1.5, pointRadius:0, tension:0.3 },
          { label:'WTI',   data:[...wtiH],   borderColor:'#22c55e', backgroundColor:'transparent', borderWidth:1.5, pointRadius:0, tension:0.3 },
        ],
      },
      options: { ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins }, scales: { ...CHART_OPTS.scales,
        y: { ...CHART_OPTS.scales.y, ticks: { ...CHART_OPTS.scales.y.ticks, callback: v => '$'+v.toFixed(1) } },
      }},
    });
  }
}

// ── 7c: FUEL PRODUCTS ──
export function renderProducts() {
  function prodTable(id, rows) {
    document.getElementById(id).innerHTML = `<thead><tr><th>Benchmark</th><th>Region</th><th>Price ($/bbl)</th><th>Change</th><th>Crack vs Dubai</th><th>Trend</th></tr></thead><tbody>${rows.map(([name,key,region]) => {
      const s = get(key), d = get('crude.dubai'), crack = s.current - d.current;
      return `<tr><td class="label-cell">${name}</td><td class="sub">${region}</td><td>${fmt(s.current)}</td><td class="${cls(s.change)}">${fmtSgn(s.change)}</td><td class="${cls(crack)}">${fmtSgn(crack)}</td><td>${sparkHTML(s.history)}</td></tr>`;
    }).join('')}</tbody>`;
  }
  prodTable('tblGasoline', [
    ['MOPS 92 RON','products.gasolineMOPS','Singapore'],
    ['NWE Barges','products.gasolineNWE','NW Europe'],
    ['USGC Pipeline','products.gasolineUSGC','US Gulf Coast'],
  ]);
  prodTable('tblDiesel', [
    ['MOPS 10ppm Gasoil','products.dieselMOPS','Singapore'],
    ['NWE ICE Gasoil','products.dieselNWE','NW Europe'],
    ['USGC ULSD','products.dieselUSGC','US Gulf Coast'],
  ]);
  prodTable('tblJet', [
    ['MOPS Jet/Kero','products.jetMOPS','Singapore'],
    ['NWE CIF Jet','products.jetNWE','NW Europe'],
    ['USGC Jet 54','products.jetUSGC','US Gulf Coast'],
  ]);
  prodTable('tblFuelOil', [
    ['HSFO 380cst','products.hsfo380','Singapore'],
    ['VLSFO 0.5%S','products.vlsfo','Singapore'],
    ['NWE HSFO 3.5%','products.hsfoNWE','NW Europe'],
  ]);
}

// ── 7d: PETROCHEMICALS ──
export function renderPetchem() {
  function petTable(id, rows) {
    document.getElementById(id).innerHTML = `<thead><tr><th>Product</th><th>Region</th><th>Price ($/MT)</th><th>Change</th><th>Trend</th></tr></thead><tbody>${rows.map(([name,key,region]) => {
      const s = get(key);
      return `<tr><td class="label-cell">${name}</td><td class="sub">${region}</td><td>${fmt(s.current,0)}</td><td class="${cls(s.change)}">${fmtSgn(s.change,0)}</td><td>${sparkHTML(s.history)}</td></tr>`;
    }).join('')}</tbody>`;
  }
  petTable('tblNaphtha', [
    ['Naphtha CFR Japan','petchem.naphthaJapan','Japan'],
    ['Naphtha CIF NWE','petchem.naphthaNWE','NW Europe'],
    ['Naphtha MOPS','petchem.naphthaMOPS','Singapore'],
  ]);
  petTable('tblOlefins', [
    ['Ethylene CFR SEA','petchem.ethyleneSEA','SE Asia'],
    ['Ethylene CFR NEA','petchem.ethyleneNEA','NE Asia'],
    ['Propylene CFR SEA','petchem.propyleneSEA','SE Asia'],
    ['Propylene CFR NEA','petchem.propyleneNEA','NE Asia'],
  ]);
  petTable('tblAromatics', [
    ['Benzene FOB Korea','petchem.benzeneFOB','Korea'],
    ['Benzene CFR SEA','petchem.benzeneCFR','SE Asia'],
    ['Toluene FOB SEA','petchem.toluene','SE Asia'],
    ['Paraxylene CFR Asia','petchem.paraxylene','Asia'],
    ['Mixed Xylenes FOB','petchem.mixedXylene','SE Asia'],
  ]);

  const naph = get('petchem.naphthaMOPS').current;
  const eth = get('petchem.ethyleneSEA').current;
  const prop = get('petchem.propyleneSEA').current;
  const benz = get('petchem.benzeneFOB').current;
  // Naphtha cracker: ~0.30 MT eth + 0.16 MT prop + 0.07 MT benzene per MT naphtha feed
  const crackerRevenue = 0.30*eth + 0.16*prop + 0.07*benz;
  const crackerMargin = crackerRevenue - naph;
  const naphBbl = naph / 8.33;
  const dubaiP = get('crude.dubai').current;
  const naphthaFuelCrack = naphBbl - dubaiP;

  document.getElementById('crackerEcon').innerHTML = `
    <div style="font-size:11px;line-height:1.8;color:var(--text-secondary)">
      <div><strong style="color:var(--text-primary)">Naphtha Feed Cost:</strong> $${fmt(naph,0)}/MT ($${fmt(naphBbl)}/bbl)</div>
      <div><strong style="color:var(--text-primary)">Cracker Revenue (per MT feed):</strong> $${fmt(crackerRevenue,0)}/MT</div>
      <div><strong style="color:var(--text-primary)">Naphtha Cracker Margin:</strong> <span class="${cls(crackerMargin)}" style="font-family:var(--mono);font-weight:600">${fmtSgn(crackerMargin,0)} $/MT</span></div>
      <div style="border-top:1px solid var(--border);margin:8px 0;padding-top:8px"><strong style="color:var(--text-primary)">Naphtha as Fuel (Crack vs Dubai):</strong> <span class="${cls(naphthaFuelCrack)}">${fmtSgn(naphthaFuelCrack)} $/bbl</span></div>
      <div><strong style="color:var(--text-primary)">Feed vs Fuel Signal:</strong> ${crackerMargin > 50 ? 'Strong feed value — divert to petchem' : crackerMargin > 0 ? 'Marginal feed economics — monitor' : 'Fuel value dominates — sell as motor gasoline blendstock'}</div>
      <div style="margin-top:6px;font-size:10px;color:var(--text-muted)">Yields assumed: 30% ethylene, 16% propylene, 7% benzene (liquid naphtha cracker)</div>
    </div>`;
}

// ── 7e: CRACKS & MARGINS ──
export function renderCracks() {
  const d = get('crude.dubai').current;
  const prods = [
    ['Gasoline MOPS','products.gasolineMOPS',0.35],
    ['Diesel MOPS','products.dieselMOPS',0.40],
    ['Jet/ATF MOPS','products.jetMOPS',0.10],
    ['HSFO 380','products.hsfo380',0.08],
    ['VLSFO','products.vlsfo',0.07],
    ['Naphtha (as $/bbl)','petchem.naphthaMOPS',0.00],
  ];
  document.getElementById('tblCracks').innerHTML = `<thead><tr><th>Product</th><th>Price $/bbl</th><th>Crack vs Dubai</th><th>GRM Weight</th></tr></thead><tbody>${prods.map(([name,key,wt]) => {
    let p = get(key).current;
    if (key.includes('petchem')) p = p / 8.33;
    const crack = p - d;
    return `<tr><td class="label-cell">${name}</td><td>${fmt(p)}</td><td class="${cls(crack)}">${fmtSgn(crack)}</td><td class="sub">${wt>0?(wt*100).toFixed(0)+'%':'Ref'}</td></tr>`;
  }).join('')}</tbody>`;

  const gas=get('products.gasolineMOPS').current, dsl=get('products.dieselMOPS').current;
  const jet=get('products.jetMOPS').current, hsfo=get('products.hsfo380').current, vlsfo=get('products.vlsfo').current;
  const weightedProduct = gas*0.35 + dsl*0.40 + jet*0.10 + hsfo*0.08 + vlsfo*0.07;
  const grm = weightedProduct - d;
  document.getElementById('grmCard').innerHTML = `
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">Singapore Complex GRM Proxy</div>
      <div class="price-big ${cls(grm)}" style="font-size:36px;margin:8px 0">$${fmt(grm)}</div>
      <div style="font-size:10px;color:var(--text-muted)">per barrel of Dubai crude processed</div>
      <div style="margin-top:10px;font-size:11px;color:var(--text-secondary)">Weighted product basket: $${fmt(weightedProduct)} — Crude: $${fmt(d)}</div>
      <div style="margin-top:4px;font-size:10px;color:var(--text-muted)">Yield split: 35% MS, 40% HSD, 10% ATF, 8% HSFO, 7% VLSFO</div>
    </div>`;

  document.getElementById('whatIfCard').innerHTML = `
    <div>
      <div class="slider-group">
        <div class="slider-label"><span>Crude Cost Adjustment</span><span id="whatIfValue">$0.00</span></div>
        <input type="range" id="whatIfSlider" min="-8" max="8" step="0.25" value="0" oninput="updateWhatIf()">
      </div>
      <div id="whatIfResults" style="font-size:11px;color:var(--text-secondary);line-height:1.8"></div>
    </div>`;
  updateWhatIf();

  const regionalData = [
    ['Singapore Complex', grm, 'Benchmark'],
    ['NWE Complex', (get('products.gasolineNWE').current*0.30+get('products.dieselNWE').current*0.45+get('products.jetNWE').current*0.10+get('products.hsfoNWE').current*0.15) - get('crude.brent').current, 'vs Brent'],
    ['USGC Coking', (get('products.gasolineUSGC').current*0.40+get('products.dieselUSGC').current*0.35+get('products.jetUSGC').current*0.15+get('products.hsfo380').current*0.10) - get('crude.wti').current, 'vs WTI'],
  ];
  document.getElementById('tblRegionalMargins').innerHTML = `<thead><tr><th>Region</th><th>GRM Proxy</th><th>Basis</th></tr></thead><tbody>${regionalData.map(([name,val,basis]) =>
    `<tr><td class="label-cell">${name}</td><td class="${cls(val)}" style="font-weight:600">$${fmt(val)}</td><td class="sub">${basis}</td></tr>`
  ).join('')}</tbody>`;

  // ── 3B: GRM trend chart ──
  if (APP.grmHistory.length > 0) {
    const grmLabels = APP.grmHistory.map((_, i) => i === APP.grmHistory.length - 1 ? 'Now' : '');
    const breakeven = Array(APP.grmHistory.length).fill(0);
    if (APP.grmTrendChart) {
      APP.grmTrendChart.data.labels = grmLabels;
      APP.grmTrendChart.data.datasets[0].data = [...APP.grmHistory];
      APP.grmTrendChart.data.datasets[1].data = breakeven;
      APP.grmTrendChart.update('none');
    } else if (document.getElementById('grmTrendChart') && typeof Chart !== 'undefined') {
      APP.grmTrendChart = new Chart(document.getElementById('grmTrendChart').getContext('2d'), {
        type: 'line',
        data: {
          labels: grmLabels,
          datasets: [
            { label:'GRM $/bbl', data:[...APP.grmHistory], borderColor:'#06b6d4', backgroundColor:'rgba(6,182,212,0.10)', fill:true, borderWidth:1.5, pointRadius:0, tension:0.4 },
            { label:'Breakeven', data: breakeven, borderColor:'rgba(239,68,68,0.45)', backgroundColor:'transparent', borderDash:[5,4], borderWidth:1, pointRadius:0, fill:false },
          ],
        },
        options: { ...CHART_OPTS, scales: { ...CHART_OPTS.scales,
          y: { ...CHART_OPTS.scales.y, ticks: { ...CHART_OPTS.scales.y.ticks, callback: v => '$'+v.toFixed(1) } },
        }},
      });
    }
  }

  // ── 3D: Scenario builder ──
  updateScenario();
}

export function updateWhatIf() {
  const adj = parseFloat(document.getElementById('whatIfSlider').value);
  document.getElementById('whatIfValue').textContent = fmtSgn(adj) + ' $/bbl';
  const d = get('crude.dubai').current + adj;
  const gas=get('products.gasolineMOPS').current, dsl=get('products.dieselMOPS').current;
  const jet=get('products.jetMOPS').current, hsfo=get('products.hsfo380').current, vlsfo=get('products.vlsfo').current;
  const wp = gas*0.35 + dsl*0.40 + jet*0.10 + hsfo*0.08 + vlsfo*0.07;
  const grm = wp - d;
  const baseGrm = wp - get('crude.dubai').current;
  const delta = grm - baseGrm;
  document.getElementById('whatIfResults').innerHTML = `
    <div><strong style="color:var(--text-primary)">Adjusted Crude Cost:</strong> $${fmt(d)}/bbl</div>
    <div><strong style="color:var(--text-primary)">Adjusted GRM:</strong> <span class="${cls(grm)}" style="font-family:var(--mono);font-weight:600">$${fmt(grm)}/bbl</span></div>
    <div><strong style="color:var(--text-primary)">GRM Impact:</strong> <span class="${cls(delta)}">${fmtSgn(delta)}</span> vs current</div>
    <div style="margin-top:8px"><strong style="color:var(--text-primary)">INR Impact:</strong> At ₹${fmt(get('fx.usdInr').current)}/$ → ₹${fmt(grm * get('fx.usdInr').current * 7.33,0)}/MT GRM</div>
    <div style="margin-top:6px;font-size:10px;color:var(--text-muted)">Sensitivity: $1/bbl crude cost change ≈ $1/bbl GRM change (product prices held constant)</div>`;
}

// ── 7f: FX & MACRO ──
export function renderFx() {
  const fxPairs = [
    ['USD / INR','fx.usdInr',2],['EUR / USD','fx.eurUsd',4],['GBP / USD','fx.gbpUsd',4],
    ['CNY / USD','fx.cnyUsd',4],['JPY / USD','fx.jpyUsd',2],
  ];
  document.getElementById('tblFx').innerHTML = `<thead><tr><th>Pair</th><th>Rate</th><th>Change</th><th>Source</th><th>Trend</th></tr></thead><tbody>${fxPairs.map(([name,key,dig]) => {
    const s = get(key);
    return `<tr><td class="label-cell">${name}</td><td>${fmt(s.current,dig)}</td><td class="${cls(s.change)}">${fmtSgn(s.change,dig)}</td><td class="sub">${s.source||'Market'}</td><td>${sparkHTML(s.history)}</td></tr>`;
  }).join('')}</tbody>`;

  const usdInr = get('fx.usdInr').current;
  const baseInr = 83.72;
  const grmUsd = 12.50;
  const grmInrBase = grmUsd * baseInr * 7.33;
  const grmInrCurrent = grmUsd * usdInr * 7.33;
  const fxImpact = grmInrCurrent - grmInrBase;
  document.getElementById('fxImpactCard').innerHTML = `
    <div style="font-size:11px;line-height:1.8;color:var(--text-secondary)">
      <div><strong style="color:var(--text-primary)">USD/INR Reference:</strong> ₹${fmt(baseInr)}</div>
      <div><strong style="color:var(--text-primary)">USD/INR Current:</strong> ₹${fmt(usdInr)}</div>
      <div><strong style="color:var(--text-primary)">GRM (USD):</strong> ~$${fmt(grmUsd)}/bbl (approx)</div>
      <div><strong style="color:var(--text-primary)">GRM (INR) at reference FX:</strong> ₹${fmt(grmInrBase,0)}/MT</div>
      <div><strong style="color:var(--text-primary)">GRM (INR) at current FX:</strong> <span class="${cls(fxImpact)}" style="font-family:var(--mono)">₹${fmt(grmInrCurrent,0)}/MT</span></div>
      <div><strong style="color:var(--text-primary)">FX Impact:</strong> <span class="${cls(fxImpact)}">${fxImpact>0?'+':''}₹${fmt(fxImpact,0)}/MT</span></div>
      <div style="margin-top:6px;font-size:10px;color:var(--text-muted)">Rule of thumb: ₹1 move in USD/INR ≈ ₹90/MT impact on INR GRM (at ~$12/bbl GRM)</div>
    </div>`;

  const macroData = [
    ['India GDP Growth (FY25E)', '6.8%', 'RBI', 'Supportive'],
    ['India Manufacturing PMI', '58.3', 'S&P Global', 'Expansionary'],
    ['US Manufacturing PMI', '49.2', 'ISM', 'Contractionary'],
    ['China Caixin PMI', '51.1', 'Caixin/S&P', 'Neutral'],
    ['India CPI Inflation', '4.75%', 'MOSPI', 'Within target'],
    ['Brent Implied Volatility', '28.5%', 'ICE', 'Moderate'],
  ];
  document.getElementById('tblMacro').innerHTML = `<thead><tr><th>Indicator</th><th>Value</th><th>Source</th><th>Signal</th></tr></thead><tbody>${macroData.map(([name,val,src,sig]) =>
    `<tr><td class="label-cell">${name}</td><td style="font-family:var(--mono)">${val}</td><td class="sub">${src}</td><td class="sub">${sig}</td></tr>`
  ).join('')}</tbody>`;

  const rateData = [
    ['RBI Repo Rate', '6.50%', 'Unchanged since Feb 2024'],
    ['US Fed Funds', '5.25-5.50%', 'Hold; cuts expected H2 2025'],
    ['ECB Main Refi', '4.25%', 'Cut cycle started Jun 2024'],
    ['10Y India G-Sec', '7.05%', 'Stable'],
    ['10Y US Treasury', '4.28%', 'Elevated'],
  ];
  document.getElementById('tblRates').innerHTML = `<thead><tr><th>Rate</th><th>Level</th><th>Context</th></tr></thead><tbody>${rateData.map(([name,val,ctx]) =>
    `<tr><td class="label-cell">${name}</td><td style="font-family:var(--mono)">${val}</td><td class="sub">${ctx}</td></tr>`
  ).join('')}</tbody>`;
}

// ── 7g: LOGISTICS & FREIGHT ──
export function renderLogistics() {
  const routes = [
    ['VLCC AG→East India','freight.vlccAGEast'],['VLCC AG→West India','freight.vlccAGWest'],
    ['Suezmax AG→India','freight.suezmaxAGInd'],['Aframax AG→India','freight.aframaxAGInd'],
    ['MR AG→India','freight.mrAGInd'],['VLCC WAF→India','freight.vlccWAFInd'],
    ['Suezmax WAF→India','freight.suezmaxWAFInd'],['MR Singapore→India','freight.mrSingInd'],
  ];
  document.getElementById('tblFreight').innerHTML = `<thead><tr><th>Route</th><th>Worldscale</th><th>$/MT (est)</th><th>$/bbl (est)</th><th>Trend</th></tr></thead><tbody>${routes.map(([name,key]) => {
    const s = get(key);
    return `<tr><td class="label-cell">${name}</td><td>WS ${fmt(s.current,0)}</td><td>${fmt(s.flatRate)}</td><td>${fmt(s.dollarPerBbl)}</td><td>${sparkHTML(s.history)}</td></tr>`;
  }).join('')}</tbody>`;

  const routeCosts = [
    ['AG → West India (VLCC)', 'Crude', '2M bbl', '8-10 days', get('freight.vlccAGWest').dollarPerBbl],
    ['AG → East India (VLCC)', 'Crude', '2M bbl', '6-8 days', get('freight.vlccAGEast').dollarPerBbl],
    ['WAF → India (Suezmax)', 'Crude', '1M bbl', '25-30 days', get('freight.suezmaxWAFInd').dollarPerBbl],
    ['AG → India (MR)', 'Products', '40K MT', '5-7 days', get('freight.mrAGInd').dollarPerBbl],
    ['Singapore → India (MR)', 'Products/Naphtha', '40K MT', '7-10 days', get('freight.mrSingInd').dollarPerBbl],
  ];
  document.getElementById('tblRoutes').innerHTML = `<thead><tr><th>Route</th><th>Cargo</th><th>Parcel</th><th>Voyage</th><th>Cost $/bbl</th></tr></thead><tbody>${routeCosts.map(([route,cargo,parcel,voyage,cost]) =>
    `<tr><td class="label-cell">${route}</td><td class="sub">${cargo}</td><td class="sub">${parcel}</td><td class="sub">${voyage}</td><td style="font-weight:600">${fmt(cost)}</td></tr>`
  ).join('')}</tbody>`;

  document.getElementById('freightCalcCard').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Vessel Class</div>
        <select class="desk-select" id="calcVessel" style="width:100%">
          <option value="vlcc">VLCC (2M bbl)</option><option value="suezmax">Suezmax (1M bbl)</option>
          <option value="aframax">Aframax (600K bbl)</option><option value="mr">MR (350K bbl)</option>
        </select></div>
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Route</div>
        <select class="desk-select" id="calcRoute" style="width:100%">
          <option value="ag-ind">AG → India</option><option value="waf-ind">WAF → India</option>
          <option value="ag-sing">AG → Singapore</option><option value="sing-ind">Singapore → India</option>
        </select></div>
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Worldscale Rate</div>
        <input class="desk-input" id="calcWS" type="number" value="90" style="width:100%"></div>
      <div><div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">Cargo Size (MT)</div>
        <input class="desk-input" id="calcCargo" type="number" value="270000" style="width:100%"></div>
    </div>
    <button class="desk-btn" onclick="calcFreight()" style="width:100%;margin-bottom:10px">Calculate</button>
    <div id="calcResults" style="font-size:11px;color:var(--text-secondary);line-height:1.7"></div>`;
  calcFreight();

  document.getElementById('portCard').innerHTML = `
    <div style="font-size:11px;line-height:1.8;color:var(--text-secondary)">
      <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text-primary)">Suez Canal:</strong></span><span style="color:var(--amber)">Elevated Risk ⚠</span></div>
      <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text-primary)">Strait of Hormuz:</strong></span><span style="color:var(--green)">Normal</span></div>
      <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text-primary)">Malacca Strait:</strong></span><span style="color:var(--green)">Normal</span></div>
      <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text-primary)">Jamnagar SBM:</strong></span><span style="color:var(--green)">2 day wait</span></div>
      <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text-primary)">Vadinar:</strong></span><span style="color:var(--green)">1 day wait</span></div>
      <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text-primary)">Sikka (RIL):</strong></span><span style="color:var(--amber)">3 day wait ⚠</span></div>
      <div style="display:flex;justify-content:space-between"><span><strong style="color:var(--text-primary)">Mangalore:</strong></span><span style="color:var(--green)">Normal</span></div>
      <div style="margin-top:8px;font-size:10px;color:var(--text-muted)">Port wait times are indicative. Suez risk reflects Houthi disruption scenario.</div>
    </div>`;
}

export function calcFreight() {
  const vessel = document.getElementById('calcVessel').value;
  const route = document.getElementById('calcRoute').value;
  const ws = parseFloat(document.getElementById('calcWS').value) || 90;
  const cargo = parseFloat(document.getElementById('calcCargo').value) || 270000;
  const flatRates = {
    'vlcc-ag-ind': 8.50, 'vlcc-waf-ind': 16.00, 'vlcc-ag-sing': 6.50, 'vlcc-sing-ind': 5.00,
    'suezmax-ag-ind': 12.00, 'suezmax-waf-ind': 20.00, 'suezmax-ag-sing': 9.50, 'suezmax-sing-ind': 7.00,
    'aframax-ag-ind': 16.00, 'aframax-waf-ind': 26.00, 'aframax-ag-sing': 12.50, 'aframax-sing-ind': 9.50,
    'mr-ag-ind': 22.00, 'mr-waf-ind': 34.00, 'mr-ag-sing': 16.00, 'mr-sing-ind': 12.00,
  };
  const key = `${vessel}-${route}`;
  const flatRate = flatRates[key] || 12.00;
  const actualRate = flatRate * (ws / 100);
  const totalCost = actualRate * cargo;
  const costPerBbl = actualRate / 7.33;
  document.getElementById('calcResults').innerHTML = `
    <div><strong style="color:var(--text-primary)">Flat Rate (WS 100):</strong> $${fmt(flatRate)}/MT</div>
    <div><strong style="color:var(--text-primary)">Actual Rate (WS ${ws}):</strong> $${fmt(actualRate)}/MT</div>
    <div><strong style="color:var(--text-primary)">Cost per Barrel:</strong> $${fmt(costPerBbl)}/bbl</div>
    <div><strong style="color:var(--text-primary)">Total Freight Cost:</strong> $${(totalCost/1000000).toFixed(2)}M</div>
    <div><strong style="color:var(--text-primary)">Cargo:</strong> ${(cargo/1000).toFixed(0)}K MT on ${vessel.toUpperCase()}</div>
    <div style="margin-top:6px;font-size:10px;color:var(--text-muted)">Flat rates are reference estimates. Actual rates depend on market conditions, vessel availability, and voyage specifics.</div>`;
}

// ── 7h: NEWS & ALERTS ──
export function renderNews() {
  const newsItems = APP.liveNews || CURATED_NEWS;
  const isLive = !!APP.liveNews;
  const feedLabel = isLive
    ? '<span style="font-family:var(--mono);font-size:9px;color:var(--green);margin-left:6px">● LIVE</span>'
    : '<span style="font-family:var(--mono);font-size:9px;color:var(--amber);margin-left:6px">● SIMULATED</span>';

  document.getElementById('newsFeed').innerHTML =
    `<div style="padding:6px 14px;border-bottom:1px solid var(--border);font-size:10px;color:var(--text-muted)">Source: ${isLive ? 'Google News RSS via /api/news' : 'Curated reference headlines'}${feedLabel}</div>` +
    newsItems.map(n =>
      `<div class="news-item"><div class="news-tag ${n.level}">${n.level}</div><div><div class="news-headline">${n.headline}</div><div class="news-meta">${n.cat} · ${n.time}${n.source ? ' · ' + n.source : ''}</div></div></div>`
    ).join('');

  document.getElementById('eventTracker').innerHTML = newsItems.map(n =>
    `<div class="arch-source"><div class="arch-name" style="font-size:11px">${n.headline.substring(0,80)}...</div><div class="arch-detail" style="font-size:10px"><strong>Market Impact:</strong> ${n.impact || '—'}</div></div>`
  ).join('');

  const categories = [...new Set(newsItems.map(n => n.cat))];
  document.getElementById('newsFilters').innerHTML = categories.map(c =>
    `<button class="desk-btn" style="font-size:10px;padding:4px 10px;background:var(--bg-secondary);color:var(--text-secondary);border:1px solid var(--border)" onclick="this.style.borderColor=this.style.borderColor==='rgb(6, 182, 212)'?'var(--border)':'rgb(6, 182, 212)';this.style.color=this.style.color==='rgb(6, 182, 212)'?'var(--text-secondary)':'rgb(6, 182, 212)'">${c}</button>`
  ).join('');
}

// ── 7i: ARCHITECTURE & DATA ──
export function renderArchitecture() {
  const sources = [
    { name:'Exchange Rate API', url:'open.er-api.com', type:'live', refresh:'Every 60s', covers:'USD/INR, EUR/USD, GBP/USD, CNY/USD, JPY/USD', note:'Free tier, CORS-enabled. Live API call on page load and every 60 seconds.' },
    { name:'EIA Crude Spot Prices (Brent & WTI)', url:'api.eia.gov', type: APP.eiaLive ? 'live' : 'planned', refresh: APP.eiaLive ? 'Every 300s' : 'Requires EIA_API_KEY', covers:'Brent (RBRTE), WTI (RWTC) — daily spot prices', note: APP.eiaLive ? 'Live daily spot prices from EIA Open Data API v2. Brent and WTI updated every 5 minutes.' : 'Set EIA_API_KEY constant in js/data.js to enable. Free key at eia.gov/opendata. Dubai/other benchmarks remain simulated.' },
    { name:'Crude Oil Benchmarks (other grades)', url:'—', type:'simulated', refresh:'Every 5s (sim tick)', covers:'Dubai, Oman, Murban, Basrah Light, Arab Light, Upper Zakum, ESPO', note:'Reference prices seeded from recent Platts/Argus actuals. Simulated tick updates for UX. Production: connect to Platts eWindow, Argus, or ICE API.' },
    { name:'News RSS Feed', url:'/api/news (Flask proxy)', type: APP.liveNews ? 'live' : 'planned', refresh: APP.liveNews ? 'Every 5 min' : 'Requires Flask server', covers:'Oil, refinery, crude, OPEC headlines from Google News RSS', note: APP.liveNews ? 'Live RSS feed via server.py proxy. Run: python3 server.py' : 'Start server.py (Flask) to enable live news. Falls back to curated reference headlines automatically.' },
    { name:'MCX Crude Oil Futures', url:'/api/mcx (Flask proxy → Yahoo Finance)', type: APP.mcxData && APP.mcxData.price ? 'live' : 'planned', refresh: APP.mcxData && APP.mcxData.price ? 'Every 5 min' : 'Requires Flask server', covers:'CRUDEOIL.MCX near-month futures — price in ₹/bbl with USD equivalent at live FX', note: APP.mcxData && APP.mcxData.price ? `Live. Last: ₹${Number(APP.mcxData.price).toLocaleString('en-IN',{maximumFractionDigits:0})}/bbl via Yahoo Finance. Visible in Crude Oil tab benchmarks table.` : 'Start server.py to enable. Price displayed in Crude Oil tab with ₹/bbl and USD equivalent. Shows "--" with tooltip when unavailable.' },
    { name:'Product Prices', url:'—', type:'simulated', refresh:'Every 5s (sim tick)', covers:'Gasoline, Diesel, Jet, Fuel Oil across MOPS/NWE/USGC', note:'Reference prices from recent MOPS/Platts assessments. Production: Platts MOC, Argus, or OPIS feeds.' },
    { name:'Petrochemical Feedstock', url:'—', type:'simulated', refresh:'Every 5s (sim tick)', covers:'Naphtha, Ethylene, Propylene, BTX, Paraxylene', note:'Reference from ICIS/Platts petchem assessments. Production: ICIS, Platts, or Argus petchem data feeds.' },
    { name:'Freight / Tanker Rates', url:'—', type:'simulated', refresh:'Every 5s (sim tick)', covers:'VLCC, Suezmax, Aframax, MR rates on key routes', note:'Reference from Baltic Exchange and Clarksons. Production: Baltic Exchange API, Clarksons SIN.' },
    { name:'OPEC+ Data', url:'—', type:'simulated', refresh:'Manual (static)', covers:'Production quotas, compliance, meeting schedule', note:'Reference data from OPEC Monthly Oil Market Report. Production: OPEC API, Kpler, Vortexa.' },
    { name:'Macro Indicators', url:'—', type:'simulated', refresh:'Manual (static)', covers:'GDP, PMI, CPI, policy rates', note:'Reference from RBI, ISM, NBS. Production: Bloomberg, Reuters Eikon, CEIC.' },
    { name:'Port / Canal Status', url:'—', type:'simulated', refresh:'Manual (static)', covers:'Suez, Hormuz, Malacca, Indian ports', note:'Reference indicators. Production: MarineTraffic API, Kpler port data, vessel AIS tracking.' },
  ];
  document.getElementById('archSources').innerHTML = sources.map(s =>
    `<div class="arch-source"><div style="display:flex;justify-content:space-between;align-items:center"><div class="arch-name">${s.name}</div><span class="arch-status ${s.type}">${s.type.toUpperCase()}</span></div><div class="arch-detail"><strong>Covers:</strong> ${s.covers}<br><strong>Refresh:</strong> ${s.refresh}<br><strong>Note:</strong> ${s.note}</div></div>`
  ).join('');

  document.getElementById('refreshLog').innerHTML = APP.refreshLog.slice(-15).reverse().map(r =>
    `<div style="padding:6px 14px;border-bottom:1px solid var(--border);font-family:var(--mono);font-size:10px;color:var(--text-secondary)"><span style="color:var(--text-muted)">${r.time}</span> — ${r.source}: <span class="arch-status ${r.status}" style="font-size:9px">${r.status.toUpperCase()}</span> ${r.detail}</div>`
  ).join('') || '<div style="padding:14px;color:var(--text-muted);font-size:11px">Log populates as data refreshes...</div>';

  document.getElementById('assumptions').innerHTML = `
    <div style="font-size:12px;line-height:1.7;color:var(--text-secondary)">
      <div class="assumption-item"><strong>GRM Calculation:</strong> Singapore complex GRM proxy uses a simplified product yield split of 35% gasoline, 40% diesel, 10% ATF, 8% HSFO, 7% VLSFO against Dubai crude. Actual GRM varies by crude slate, refinery configuration, and operating mode.</div>
      <div class="assumption-item"><strong>Crack Spreads:</strong> All product crack spreads are calculated vs Dubai crude (MOPS assessment basis). NWE cracks are vs Brent. USGC cracks are vs WTI.</div>
      <div class="assumption-item"><strong>Naphtha Cracker Economics:</strong> Assumed liquid cracker yields: 30% ethylene, 16% propylene, 7% benzene. Actual yields depend on cracker severity, feedstock quality, and co-product recovery.</div>
      <div class="assumption-item"><strong>Freight Costs:</strong> Flat rates are reference estimates based on recent Worldscale publications. $/bbl conversions assume 7.33 bbl/MT for crude. Actual costs depend on vessel specifications, port costs, canal fees, and insurance.</div>
      <div class="assumption-item"><strong>FX Impact:</strong> GRM sensitivity to FX uses linear approximation: ₹1/$ move ≈ ₹90/MT GRM impact at ~$12/bbl GRM level. Actual impact is path-dependent and influenced by hedging positions.</div>
      <div class="assumption-item"><strong>Data Freshness:</strong> Reference prices are seeded from recent market actuals but are NOT live market prices. Simulated ticks add small random variations to demonstrate real-time UX. All simulated data is clearly labeled.</div>
      <div class="assumption-item"><strong>Arbitrage Windows:</strong> Simplified buy-sell-freight comparison. Does not include storage, financing, quality adjustments, demurrage, or credit terms.</div>
      <div class="assumption-item"><strong>Conversion Factors:</strong> Crude: 7.33 bbl/MT. Naphtha: 8.33 bbl/MT. Gasoline: 8.33 bbl/MT. Diesel/Gasoil: 7.46 bbl/MT.</div>
      <div class="assumption-item"><strong>Indian Context:</strong> OMC pricing references are indicative of BPCL/HPCL/IOCL positioning. Private refiner (RIL, Nayara) economics may differ based on export orientation and product mix.</div>
    </div>`;

  document.getElementById('archDiagram').innerHTML = `
    <div style="font-family:var(--mono);font-size:10px;line-height:1.6;color:var(--text-secondary);white-space:pre;overflow-x:auto">
┌─────────────────────────────────────────────────────────────────┐
│                    REFINERYDESK ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  FREE APIs   │  │  PREMIUM     │  │  INTERNAL FEEDS      │   │
│  │              │  │  (Planned)   │  │  (Planned)           │   │
│  │ • ExchRate   │  │ • Platts     │  │ • SAP IS-Oil         │   │
│  │ • EIA Open   │  │ • Argus      │  │ • CTRM System        │   │
│  │ • OWID       │  │ • ICIS       │  │ • Scheduling         │   │
│  │ • RSS News   │  │ • Baltic Exch│  │ • Inventory Mgmt     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
│         ▼                 ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              DATA NORMALIZATION LAYER                    │     │
│  │  • Unit conversion (bbl↔MT, $/bbl↔$/MT)                │     │
│  │  • Currency conversion (USD→INR at live FX)             │     │
│  │  • Timestamp normalization (UTC, IST, SGT)              │     │
│  │  • Quality validation & outlier detection               │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              CALCULATION ENGINE                          │     │
│  │  • Crack spread computation                             │     │
│  │  • GRM proxy calculation                                │     │
│  │  • Arbitrage window detection                           │     │
│  │  • Freight scenario modeling                            │     │
│  │  • FX sensitivity analysis                              │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              PRESENTATION LAYER (This Dashboard)         │     │
│  │  9 Tabs · Auto-refresh · Interactive · Alert System     │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Status: V1.0 — Reference data + simulation + live FX            │
│  Target: V2.0 — Full API integration + backend proxy             │
└─────────────────────────────────────────────────────────────────┘
    </div>`;
}

// ── 3D: SCENARIO BUILDER ──
export function updateScenario() {
  if (!document.getElementById('scen_a_grm')) return;
  const gas=get('products.gasolineMOPS').current, dsl=get('products.dieselMOPS').current;
  const jet=get('products.jetMOPS').current, hsfo=get('products.hsfo380').current, vlsfo=get('products.vlsfo').current;
  const baseProducts = gas*0.35 + dsl*0.40 + jet*0.10 + hsfo*0.08 + vlsfo*0.07;
  const dubai = get('crude.dubai').current;
  if (!APP.scenarioInitted) {
    document.getElementById('scen_b_crude').value = dubai.toFixed(2);
    document.getElementById('scen_c_crude').value = dubai.toFixed(2);
    APP.scenarioInitted = true;
  }
  const grmA = +(baseProducts - dubai).toFixed(2);
  document.getElementById('scen_a_crude').textContent = '$' + fmt(dubai);
  document.getElementById('scen_a_grm').textContent = fmt(grmA);
  document.getElementById('scen_a_grm').className = cls(grmA);
  const crudeB = parseFloat(document.getElementById('scen_b_crude').value) || dubai;
  const adjB   = parseFloat(document.getElementById('scen_b_adj').value)   || 0;
  const freightB = parseFloat(document.getElementById('scen_b_freight').value) || 0;
  const grmB = +(baseProducts*(1+adjB/100) - crudeB - freightB).toFixed(2);
  document.getElementById('scen_b_grm').textContent = fmt(grmB);
  document.getElementById('scen_b_grm').className = cls(grmB);
  const vsB = +(grmB - grmA).toFixed(2);
  document.getElementById('scen_b_vs').textContent = fmtSgn(vsB);
  document.getElementById('scen_b_vs').className = cls(vsB);
  const crudeC = parseFloat(document.getElementById('scen_c_crude').value) || dubai;
  const adjC   = parseFloat(document.getElementById('scen_c_adj').value)   || 0;
  const freightC = parseFloat(document.getElementById('scen_c_freight').value) || 0;
  const grmC = +(baseProducts*(1+adjC/100) - crudeC - freightC).toFixed(2);
  document.getElementById('scen_c_grm').textContent = fmt(grmC);
  document.getElementById('scen_c_grm').className = cls(grmC);
  const vsC = +(grmC - grmA).toFixed(2);
  document.getElementById('scen_c_vs').textContent = fmtSgn(vsC);
  document.getElementById('scen_c_vs').className = cls(vsC);
}

// ── 4D: PDF EXPORT ──
export async function exportPDF() {
  const activeTab = document.querySelector('.tab-content.active');
  const activeBtn = document.querySelector('.tab-btn.active');
  const tabName = (activeBtn ? activeBtn.textContent.trim() : 'Dashboard').replace(/^⬡\s*/, '');
  const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST';
  const btn = document.getElementById('exportPdfBtn');
  btn.textContent = 'CAPTURING…';
  btn.disabled = true;
  try {
    const canvas = await html2canvas(activeTab, {
      backgroundColor: '#0a0e14', scale: 1.5, useCORS: true, logging: false,
    });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const PW = 297, PH = 210, HDR = 18;
    pdf.setFillColor(17, 24, 32);
    pdf.rect(0, 0, PW, HDR, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(6, 182, 212);
    pdf.text('REFINERYDESK  —  ' + tabName.toUpperCase(), 8, 12);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(136, 153, 170);
    pdf.text(timestamp, PW - 8, 12, { align: 'right' });
    const imgW = PW - 10, maxH = PH - HDR - 4;
    const imgH = Math.min(maxH, imgW * (canvas.height / canvas.width));
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 5, HDR + 2, imgW, imgH);
    pdf.save(`refinerydesk-${tabName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
  } catch(e) {
    console.error('PDF export failed:', e);
  } finally {
    btn.textContent = 'EXPORT PDF';
    btn.disabled = false;
  }
}
