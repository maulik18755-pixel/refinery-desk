"""
RefineryDesk Flask proxy server.

Routes:
  GET /          — serves dashboard.html
  GET /api/news  — proxies Google News RSS, returns JSON [{title, link, pubDate, source}]
  GET /api/fx    — proxies open.er-api.com/v6/latest/USD
  GET /api/mcx   — proxies MCX Crude Oil near-month futures from Yahoo Finance
                   returns JSON {price, currency, symbol, source} or {price: null, error}

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

# Yahoo Finance requires a browser-like User-Agent
YF_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
}


@app.route('/')
def index():
    return send_file('dashboard.html')


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
    Returns: {price, currency, symbol, marketState, source}
    On failure: {price: null, error: <message>}
    """
    try:
        resp = requests.get(
            MCX_URL,
            headers=YF_HEADERS,
            params={'interval': '1m', 'range': '1d'},
            timeout=6,
        )
        resp.raise_for_status()
        data = resp.json()
        result = data['chart']['result'][0]
        meta = result['meta']
        return jsonify({
            'price':       meta.get('regularMarketPrice'),
            'previousClose': meta.get('chartPreviousClose'),
            'currency':    meta.get('currency', 'INR'),
            'symbol':      meta.get('symbol', 'CRUDEOIL.MCX'),
            'marketState': meta.get('currentTradingPeriod', {}).get('regular', {}).get('timezone', ''),
            'source':      'Yahoo Finance (MCX)',
        })
    except Exception as e:
        # Always return 200 so the dashboard can distinguish "server reachable but data unavailable"
        return jsonify({'price': None, 'error': str(e)}), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, port=port)
