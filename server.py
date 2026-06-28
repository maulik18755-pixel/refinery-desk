"""
RefineryDesk Flask proxy server.

Routes:
  GET /                  — serves index.html
  GET /api/news          — proxies Google News RSS, returns JSON [{title, link, pubDate, source}]
  GET /api/fx            — proxies open.er-api.com/v6/latest/USD
  GET /api/mcx           — MCX Crude Oil near-month futures from Yahoo Finance
  GET /api/commodities   — Global futures via Yahoo Finance:
                           BZ=F (Brent), CL=F (WTI), RB=F (RBOB Gasoline),
                           HO=F (Heating Oil/Diesel), NG=F (Natural Gas)

Run:
  pip install flask feedparser requests
  python3 server.py

Then open http://localhost:5000
"""
import os
from flask import Flask, jsonify, send_file
import feedparser
import requests

app = Flask(__name__)

NEWS_RSS = 'https://news.google.com/rss/search?q=oil+refinery+crude+OPEC&hl=en-US&gl=US&ceid=US:en'
FX_URL   = 'https://open.er-api.com/v6/latest/USD'
MCX_URL  = 'https://query1.finance.yahoo.com/v8/finance/chart/CRUDEOIL.MCX'

# Yahoo Finance commodity futures symbols
COMMODITY_SYMBOLS = {
    'brentFutures':  'BZ=F',   # ICE Brent Crude Futures ($/bbl)
    'wtiFutures':    'CL=F',   # NYMEX WTI Crude Futures ($/bbl)
    'gasolineRBOB':  'RB=F',   # NYMEX RBOB Gasoline Futures ($/gallon → ×42 for $/bbl)
    'heatingOil':    'HO=F',   # NYMEX Heating Oil Futures ($/gallon → ×42 for $/bbl)
    'natGas':        'NG=F',   # NYMEX Natural Gas Futures ($/MMBtu)
}

# Yahoo Finance requires a browser-like User-Agent
YF_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
}


def _yf_fetch(symbol):
    """Fetch a single Yahoo Finance symbol. Returns meta dict or raises."""
    resp = requests.get(
        f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}',
        headers=YF_HEADERS,
        params={'interval': '1m', 'range': '1d'},
        timeout=6,
    )
    resp.raise_for_status()
    data = resp.json()
    return data['chart']['result'][0]['meta']


@app.route('/')
def index():
    return send_file('index.html')


@app.route('/api/news')
def news():
    feed = feedparser.parse(NEWS_RSS)
    items = []
    for entry in feed.entries[:20]:
        source = ''
        if hasattr(entry, 'source') and isinstance(entry.source, dict):
            source = entry.source.get('title', '')
        elif hasattr(entry, 'tags') and entry.tags:
            source = entry.tags[0].get('term', '')
        items.append({
            'title':   entry.get('title', ''),
            'link':    entry.get('link', ''),
            'pubDate': entry.get('published', ''),
            'source':  source,
        })
    return jsonify(items)


@app.route('/api/fx')
def fx():
    try:
        resp = requests.get(FX_URL, timeout=5)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 502


@app.route('/api/mcx')
def mcx():
    """
    Fetches MCX Crude Oil near-month futures price from Yahoo Finance.
    MCX crude is quoted in INR per barrel; 1 lot = 100 barrels.
    Returns: {price, previousClose, currency, symbol, source}
    On failure: {price: null, error}  (always HTTP 200)
    """
    try:
        meta = _yf_fetch('CRUDEOIL.MCX')
        return jsonify({
            'price':         meta.get('regularMarketPrice'),
            'previousClose': meta.get('chartPreviousClose'),
            'currency':      meta.get('currency', 'INR'),
            'symbol':        meta.get('symbol', 'CRUDEOIL.MCX'),
            'source':        'Yahoo Finance (MCX)',
        })
    except Exception as e:
        return jsonify({'price': None, 'error': str(e)}), 200


@app.route('/api/commodities')
def commodities():
    """
    Fetches global commodity futures from Yahoo Finance.
    Returns one object per symbol — price, previousClose, currency, symbol.
    Prices are in native units ($/bbl for crude, $/gallon for petroleum products,
    $/MMBtu for natural gas). The client converts $/gallon → $/bbl by × 42.
    Always HTTP 200; failed symbols carry {price: null, error}.
    """
    results = {}
    for name, symbol in COMMODITY_SYMBOLS.items():
        try:
            meta = _yf_fetch(symbol)
            results[name] = {
                'price':         meta.get('regularMarketPrice'),
                'previousClose': meta.get('chartPreviousClose'),
                'currency':      meta.get('currency', 'USD'),
                'symbol':        symbol,
            }
        except Exception as e:
            results[name] = {'price': None, 'error': str(e)}
    return jsonify(results)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, port=port)
