#!/usr/bin/env python3
"""S&P 500 quantitative screen -> shortlist for Ashok's Driver Model analysis.

Pipeline:
  1. Load S&P 500 constituents (Wikipedia, cached to data/sp500_tickers.csv).
  2. Price screen on the full universe (12-month history): momentum + trend filter.
  3. Fetch fundamentals for the top momentum names only.
  4. Composite score (momentum 40% / quality 35% / value 25%), exclude held tickers.
  5. Write data/candidates.json with the top candidates + quotes for portfolio holdings.

Usage: python scripts/screen.py
"""

import json
import sys
import time
import datetime as dt
from pathlib import Path

import pandas as pd
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
TICKER_CACHE = DATA / "sp500_tickers.csv"
PORTFOLIO_FILE = DATA / "portfolio.json"
OUT_FILE = DATA / "candidates.json"

MOMENTUM_SHORTLIST = 60  # fetch fundamentals only for this many names
FINAL_COUNT = 10
MIN_MARKET_CAP = 10e9

WIKI_URL = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"

FUNDAMENTAL_FIELDS = [
    "shortName", "sector", "industry", "marketCap", "trailingPE", "forwardPE",
    "priceToSalesTrailing12Months", "returnOnEquity", "profitMargins",
    "grossMargins", "operatingMargins", "revenueGrowth", "earningsGrowth",
    "freeCashflow", "operatingCashflow", "totalCash", "totalDebt",
    "dividendYield", "sharesOutstanding", "totalRevenue", "trailingEps",
    "forwardEps", "pegRatio",
]


def load_sp500() -> pd.DataFrame:
    try:
        tables = pd.read_html(WIKI_URL, storage_options={"User-Agent": "Mozilla/5.0"})
        df = tables[0][["Symbol", "Security", "GICS Sector"]].copy()
        df.columns = ["ticker", "name", "sector"]
        # Yahoo uses dashes for share classes (BRK.B -> BRK-B)
        df["ticker"] = df["ticker"].str.replace(".", "-", regex=False)
        df.to_csv(TICKER_CACHE, index=False)
        print(f"Loaded {len(df)} S&P 500 tickers from Wikipedia (cache refreshed)")
        return df
    except Exception as e:
        print(f"Wikipedia fetch failed ({e}); falling back to cache")
        if TICKER_CACHE.exists():
            df = pd.read_csv(TICKER_CACHE)
            print(f"Loaded {len(df)} tickers from cache")
            return df
        raise SystemExit("No ticker cache available; cannot continue")


def load_portfolio() -> dict:
    if PORTFOLIO_FILE.exists():
        return json.loads(PORTFOLIO_FILE.read_text())
    return {"positions": [], "trade_log": []}


def price_screen(tickers: list[str]) -> pd.DataFrame:
    """Momentum + trend screen on 12 months of daily closes."""
    print(f"Downloading 12-month price history for {len(tickers)} tickers...")
    px = yf.download(
        tickers, period="1y", interval="1d",
        auto_adjust=True, progress=True, threads=True,
    )["Close"]
    if isinstance(px, pd.Series):  # single-ticker edge case
        px = px.to_frame(tickers[0])

    # Drop tickers with sparse history (recent additions, data gaps)
    px = px.dropna(axis=1, thresh=int(len(px) * 0.9)).ffill()
    if len(px) < 130:
        raise SystemExit(f"Only {len(px)} trading days of history; data looks broken")

    last = px.iloc[-1]
    ret_1m = last / px.iloc[-21] - 1
    ret_3m = last / px.iloc[-63] - 1
    ret_6m = last / px.iloc[-126] - 1
    ma200 = px.rolling(200, min_periods=150).mean().iloc[-1]
    high_52w = px.max()

    df = pd.DataFrame({
        "price": last,
        "ret_1m": ret_1m,
        "ret_3m": ret_3m,
        "ret_6m": ret_6m,
        "above_200dma": last > ma200,
        "pct_off_52w_high": last / high_52w - 1,
    }).dropna()

    # Trend filter: uptrend only
    df = df[df["above_200dma"] & (df["ret_6m"] > 0)]
    df["mom_pct"] = (df["ret_3m"].rank(pct=True) + df["ret_6m"].rank(pct=True)) / 2
    df = df.sort_values("mom_pct", ascending=False)
    print(f"{len(df)} tickers pass the trend filter; taking top {MOMENTUM_SHORTLIST} by momentum")
    return df


def fetch_fundamentals(tickers: list[str]) -> dict[str, dict]:
    print(f"Fetching fundamentals for {len(tickers)} tickers...")
    out = {}
    for i, t in enumerate(tickers, 1):
        try:
            info = yf.Ticker(t).info
            out[t] = {f: info.get(f) for f in FUNDAMENTAL_FIELDS}
        except Exception as e:
            print(f"  {t}: fundamentals failed ({e})")
        if i % 20 == 0:
            print(f"  ...{i}/{len(tickers)}")
        time.sleep(0.25)  # be polite to Yahoo
    return out


def composite_score(price_df: pd.DataFrame, fundamentals: dict[str, dict]) -> pd.DataFrame:
    rows = []
    for t, f in fundamentals.items():
        if t not in price_df.index:
            continue
        mcap = f.get("marketCap") or 0
        if mcap < MIN_MARKET_CAP:
            continue
        fcf = f.get("freeCashflow")
        rows.append({
            "ticker": t,
            "roe": f.get("returnOnEquity"),
            "profit_margin": f.get("profitMargins"),
            "revenue_growth": f.get("revenueGrowth"),
            "forward_pe": f.get("forwardPE"),
            "fcf_yield": (fcf / mcap) if fcf and mcap else None,
        })
    df = pd.DataFrame(rows).set_index("ticker")

    quality = (
        df["roe"].rank(pct=True).fillna(0.5)
        + df["profit_margin"].rank(pct=True).fillna(0.5)
        + df["revenue_growth"].rank(pct=True).fillna(0.5)
    ) / 3
    # Lower forward P/E is better; missing values get a neutral rank
    value = (
        (1 - df["forward_pe"].rank(pct=True)).fillna(0.5)
        + df["fcf_yield"].rank(pct=True).fillna(0.5)
    ) / 2
    momentum = price_df.loc[df.index, "mom_pct"]

    df["quality_pct"] = quality
    df["value_pct"] = value
    df["momentum_pct"] = momentum
    df["score"] = 0.40 * momentum + 0.35 * quality + 0.25 * value
    return df.sort_values("score", ascending=False)


def portfolio_quotes(positions: list[dict], price_df: pd.DataFrame) -> dict[str, float]:
    quotes = {}
    missing = []
    for pos in positions:
        t = pos["ticker"].upper()
        if t in price_df.index:
            quotes[t] = round(float(price_df.loc[t, "price"]), 2)
        else:
            missing.append(t)
    if missing:
        try:
            px = yf.download(missing, period="5d", auto_adjust=True, progress=True)["Close"]
            if isinstance(px, pd.Series):
                px = px.to_frame(missing[0])
            for t in missing:
                if t in px.columns and not px[t].dropna().empty:
                    quotes[t] = round(float(px[t].dropna().iloc[-1]), 2)
        except Exception as e:
            print(f"Quote fetch for holdings failed ({e})")
    return quotes


def main() -> None:
    sp500 = load_sp500()
    portfolio = load_portfolio()
    held = {p["ticker"].upper() for p in portfolio.get("positions", [])}

    price_df = price_screen(sp500["ticker"].tolist())
    shortlist = [t for t in price_df.index[:MOMENTUM_SHORTLIST] if t not in held]
    fundamentals = fetch_fundamentals(shortlist)
    scored = composite_score(price_df, fundamentals)

    meta = sp500.set_index("ticker")
    candidates = []
    for t in scored.index[:FINAL_COUNT]:
        f = fundamentals[t]
        p = price_df.loc[t]
        candidates.append({
            "ticker": t,
            "name": f.get("shortName") or (meta.loc[t, "name"] if t in meta.index else t),
            "sector": f.get("sector") or (meta.loc[t, "sector"] if t in meta.index else None),
            "industry": f.get("industry"),
            "price": round(float(p["price"]), 2),
            "score": round(float(scored.loc[t, "score"]), 4),
            "momentum_pct": round(float(scored.loc[t, "momentum_pct"]), 3),
            "quality_pct": round(float(scored.loc[t, "quality_pct"]), 3),
            "value_pct": round(float(scored.loc[t, "value_pct"]), 3),
            "ret_1m": round(float(p["ret_1m"]), 4),
            "ret_3m": round(float(p["ret_3m"]), 4),
            "ret_6m": round(float(p["ret_6m"]), 4),
            "pct_off_52w_high": round(float(p["pct_off_52w_high"]), 4),
            "fundamentals": f,
        })

    out = {
        "generated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "universe_size": int(len(sp500)),
        "passed_trend_filter": int(len(price_df)),
        "candidates": candidates,
        "portfolio_quotes": portfolio_quotes(portfolio.get("positions", []), price_df),
    }
    OUT_FILE.write_text(json.dumps(out, indent=2))
    print(f"\nWrote {len(candidates)} candidates to {OUT_FILE}")
    for c in candidates:
        print(f"  {c['ticker']:6s} {c['name'][:30]:30s} score={c['score']:.3f} "
              f"3m={c['ret_3m']:+.1%} fwdPE={c['fundamentals'].get('forwardPE')}")


if __name__ == "__main__":
    main()
