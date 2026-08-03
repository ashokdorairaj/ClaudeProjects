# Stock Advisor — Weekly Run Instructions

This project produces a weekly stock report: ~3 S&P 500 buy recommendations plus
SELL/HOLD verdicts on current holdings, published to a static HTML dashboard.
It is run by a scheduled Claude agent (and can also be run manually in Claude Code).

⚠️ This is an educational tool. Every output must keep the "not financial advice" disclaimer.

## Weekly cycle (execute these steps in order)

### 1. Screen
```
pip install -r stock-advisor/scripts/requirements.txt
python stock-advisor/scripts/screen.py
```
This writes `data/candidates.json`: the top ~10 S&P 500 candidates by a composite
momentum/quality/value score (already excludes tickers held in `data/portfolio.json`),
plus current quotes for portfolio holdings. If the script fails (Yahoo outage),
retry once; if still failing, stop and report the error instead of inventing data.

### 2. Analyze candidates (SecDiver)
Take the **top 5–6 candidates** from `candidates.json`. For each, produce the full
6-section SecDiver analysis using the exact template in `prompts/secdiver.md`.
- Ground Sections 1–4 in the fetched fundamentals in `candidates.json` (mark
  estimates with `*` per the template).
- Use WebSearch for Section 5 (near-term catalysts, sentiment, news) and to fill
  revenue-segment history in Section 1.
- Section 6 must show the fair-price math (target multiple × forward estimate).

### 3. Pick 3
Select the 3 strongest candidates by SecDiver Section 6 rating (prefer STRONG BUY,
then BUY; break ties with the composite score). Diversify: avoid all 3 picks coming
from the same GICS sector unless conviction is overwhelming.

### 4. Review holdings
For each position in `data/portfolio.json` (use `portfolio_quotes` from
candidates.json for last prices): run an abbreviated SecDiver check — is the thesis
intact, is valuation stretched vs. fair price, any deterioration or better use of
capital? Output **SELL** or **HOLD** with a 1–2 sentence reason. Do not recommend
selling purely on short-term price movement.

### 5. Publish
a. Write `data/history/YYYY-MM-DD.json` (use today's date) with this shape:
```json
{
  "week": "YYYY-MM-DD",
  "generated": "<ISO timestamp>",
  "picks": [
    {
      "ticker": "", "name": "", "price": 0, "rating": "STRONG BUY|BUY",
      "lynchCategory": "", "tags": [], "thesis": "<one sentence>",
      "fairValue": "Undervalued|Fairly Valued|Overvalued",
      "fairPrice3y": 0, "fairPrice5y": 0, "fairPrice7y": 0,
      "analysisMd": "<full 6-section SecDiver markdown>"
    }
  ],
  "holdingsReview": [
    { "ticker": "", "verdict": "HOLD|SELL", "verdictReason": "", "lastPrice": 0 }
  ],
  "candidatesConsidered": ["..."]
}
```
b. Regenerate the dashboard:
```
python stock-advisor/scripts/publish.py
```
This reads all history files + `portfolio.json`, refreshes last prices via
yfinance (rolling up every past pick into the scoreboard), and rewrites
`dashboard/data.js`. Do not hand-write `data.js`.
c. Sync the public dashboard site (https://ashokdorairaj.github.io/stock-dashboard/):
   use the `stock-dashboard` checkout if one exists in the workspace, otherwise
   `git clone https://github.com/ashokdorairaj/stock-dashboard`. Copy
   `dashboard/index.html`, `style.css`, `app.js`, and `data.js` into its root,
   commit `update dashboard YYYY-MM-DD`, and push to its `main`.
d. Commit with message `stock-advisor: weekly report YYYY-MM-DD` and push.

## Portfolio file format (`data/portfolio.json`)
```json
{
  "positions": [
    { "ticker": "AAPL", "shares": 10, "cost_basis": 190.50, "buy_date": "2026-08-04" }
  ],
  "trade_log": [
    { "date": "2026-08-04", "action": "BUY", "ticker": "AAPL", "shares": 10, "price": 190.50 }
  ]
}
```
The user records executed trades here (manually or by asking Claude Code). When
asked to record a trade: append to `trade_log`, then add/update/remove the
position (average up cost basis on adds; remove position when fully sold).

## Guardrails
- Never fabricate prices or fundamentals — everything numeric comes from
  candidates.json, yfinance, or a cited web source; mark estimates with `*`.
- If fewer than 3 candidates earn BUY or better, recommend fewer and say why.
- Keep each `analysisMd` self-contained markdown (headings, tables) — the
  dashboard renders it with a minimal markdown parser (headings, bold, tables,
  lists only; no nested lists or code blocks).
