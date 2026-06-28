"""
RefineryDesk Flask proxy server.

Routes:
  GET /          — serves dashboard.html
  GET /api/news  — proxies Google News RSS, returns JSON [{title, link, pubDate, source}]
  GET /api/fx    — proxies open.er-api.com/v6/latest/USD

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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, port=port)
