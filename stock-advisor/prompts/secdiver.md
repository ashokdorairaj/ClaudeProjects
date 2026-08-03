# The "SecDiver" Master Prompt

**Role:** Act as an elite financial equity analyst and portfolio manager. Perform a comprehensive fundamental and valuation analysis on the following stock ticker using the "SecDiver" framework.

**Target Ticker:** [INSERT TICKER HERE]

**Instructions:**
Do not provide a generic summary. You must output the analysis strictly using the following 6 sections, utilizing Markdown tables and bold text for readability. If exact real-time data is unavailable, provide the most accurate Trailing Twelve Months (TTM) or consensus estimates available, marking estimates with an asterisk (*).

**1. SEGMENT: REVENUE REPORT**
* Create a table showing Total Revenue and the breakdown of core business segments for the current year (estimated/TTM) and the past 4-5 fiscal years.
* Include Current Market Price and Market Cap above the table.
* Add a brief note explaining the revenue narrative (e.g., what segment is driving growth or dragging).

**2. GROWTH & QUALITY SCORECARD**
* Classify the stock using Peter Lynch's categories (Fast Grower, Stalwart, Slow Grower, Cyclical, Turnaround, or Asset Play).
* Provide a list of "Tags" defining the business (e.g., [Moat:Wide, SaaS, CashRich]).
* State the overall Revenue and EPS CAGR, Gross Margin trend, and a "Business Quality Score" (1 to 10) based on ROIC and moat durability.

**3. HISTORICAL CAGR (Compound Annual Growth Rate)**
* Create a table with columns: Metric, YoY, 3Y, 5Y, and Trend.
* Include rows for: Revenue, EPS (Diluted or Non-GAAP), Free Cash Flow, Shares Outstanding (noting dilution vs. buybacks), and Stock Price.

**4. YIELDS & VALUATION CHECKS**
* Create a table calculating what an investor gets at the current price.
* Include columns: Metric, Value (TTM), Per Share, Yield (Yield/Price), and Valuation Signal.
* Include rows for: Revenue (Price-to-Sales), Net Income/EPS (P/E), Free Cash Flow (FCF Yield), and Dividend Yield (if applicable).

**5. WALL STREET DRIVERS & DURABILITY**
* **Wall Street Drivers:** List 2-3 specific near-term catalysts, sentiment drivers, or macro headwinds moving the stock right now.
* **Business Durability:** List 2-3 points assessing the balance sheet (cash/debt), competitive moat, and switching costs.

**6. FAIR PRICE & CONCLUSION**
* **Valuation Model:** State whether the stock is Undervalued, Fairly Valued, or Overvalued. Show the math for a "Predicted Fair Price" using a reasonable Target P/E or P/S multiple applied to forward estimates.
* **Fair Price Ranges:** Provide estimated fair price targets for 3Y, 5Y, and 7Y periods.
* **Summary Gauge:** Give a final rating [STRONG BUY / BUY / HOLD / AVOID].
* **Buy vs Wait Take:** Provide a clear, balanced recommendation split by investor type (e.g., Long-Term/Value vs. Short-Term/Momentum).

---

## Framework logic (reference)

* **The Peter Lynch Anchor (Section 2):** Prevents valuing a "Slow Grower" the same way as a "Fast Grower." Sets the context for the multiples used later.
* **The Dilution Check (Section 3):** Forcing the "Shares Outstanding" CAGR exposes companies growing revenue but destroying shareholder value through stock-based compensation.
* **The Yield Flip (Section 4):** Viewing valuation as a *Yield* (Earnings Yield, FCF Yield) allows direct comparison to the risk-free rate (10-year Treasury). If a stock's FCF yield is lower than a treasury bond, it better have massive growth to justify the price.
* **The Mathematical Floor (Section 6):** Forcing the math (Target Multiple × Projected Earnings = Fair Price) removes vague bullish sentiment and anchors the recommendation to a concrete, testable formula.
