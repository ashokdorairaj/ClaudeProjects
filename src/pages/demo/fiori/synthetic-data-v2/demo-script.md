# Demo Script — SAP Synthetic Data & Experiment Accelerator v2

**Duration:** 5 minutes  
**Audience:** Product managers, data scientists, FDE team leads, SAP stakeholders  
**Demo company:** Northstar Manufacturing (fictional)

---

## Setup (before the demo)

```bash
npm run dev
# Open: http://localhost:5173/?page=demo/fiori/synthetic-data-v2
```

Keep the browser at the Overview screen.

---

## Script

### 1. Overview (30 seconds)

*Navigate to: Overview screen (default)*

**Say:**
> "This is the SAP Enterprise Synthetic Data & Experiment Accelerator. The idea is simple: when an Autonomous Assistant team starts a new engagement, they shouldn't have to wait for production data before they can start experimenting."

> "We have a validated Collections & Disputes pack here — think of it as a reusable recipe. And a Procurement pack that's in draft, which shows the concept extends beyond Finance."

> "The flywheel on the right is the core product idea: every engagement adds learnings back into the pack, so the next customer starts further ahead."

**Point to:** The flywheel steps and the KPI tiles (Datasets Generated, Experiments Run — these will update live as you demo).

---

### 2. Collections Pack (45 seconds)

*Click the "Collections & Disputes" card, or click "Collections Pack" in the sidebar.*

**Say:**
> "Let me show you what's in the pack. This is the entity graph for the Collections scenario."

*Point to the SVG entity graph.*

> "Business Partner flows down to Receivable, which connects to Payment, Dunning, and Dispute. This is the standard FSCM + S/4 AR object model."

*Click on "RECEIVABLE" in the graph.*

> "Click any entity to inspect the schema. You can see the SAP table names, field types, which fields are primary keys and which are foreign keys. This is the structural knowledge in the pack."

*Switch to the "Pack Definition" tab.*

> "The pack definition tab shows the business problem, the SAP product mapping, and the 12 business constraints that the generated data must satisfy — things like 'every dunning record must reference an overdue open receivable.'"

---

### 3. Generate Data (90 seconds)

*Click "Generate with this Pack"*

**Say:**
> "Now let's generate a dataset. The wizard has four levels. Level 1 requires no customer data — it uses SAP defaults."

*Point to the L1 form.*

> "I'll generate 2,000 business partners and 20,000 receivables. I can change the late payment rate, dispute rate, currency, and the random seed for reproducibility."

*Click "Generate Dataset"*

> "Watch the generation progress — business partners first, then receivables with correlated risk signals, then payments, dunning, and disputes. Foreign-key integrity is enforced throughout."

*Wait for generation (3–5 seconds). After completion, demo navigates to Dataset Preview.*

> "20,000 receivables, referential integrity verified. Let me show you the data."

*Switch tabs in the DatasetPreview: Business Partners → Receivables → Disputes.*

> "Every receivable has a late_payment_flag — that's our experiment target. High-risk business partners are more likely to have it set, which means XGBoost should actually learn something from this data."

---

### 4. Quality Report (45 seconds)

*Click "Run Quality Check"*

**Say:**
> "The quality report tells us whether the generated data meets the pack's constraints before we run any experiments."

*Point to the checks.*

> "Referential integrity is 100% — no orphan records. All business rules pass: due dates are after invoice dates, dunning is only on overdue items, dispute amounts don't exceed invoice amounts."

> "The distribution comparison shows how close the generated rates are to what we configured. The late payment rate is within tolerance."

*Point to the readiness banner.*

> "Level 1 gives us 'Ready for Prototyping.' If we were at Level 3 with a customer profile, we'd see 'Ready for Early ML Experimentation.'"

---

### 5. Experiment Lab (75 seconds)

*Click "Run Experiments"*

**Say:**
> "Now the interesting part: what approach is worth taking forward?"

*Click "Run Rules Baseline"*

> "The rules baseline predicts late payment if the business partner is high-risk, has 3 or more prior late payments, or has long payment terms and a high invoice amount. Computed directly from the data — real F1 and AUC scores."

*Show the metrics.*

> "Now let's run XGBoost."

*Click "Train XGBoost"*

> "This sends the feature matrix to our Express server, which spawns a Python process running real scikit-learn or XGBoost. Training on 80% of the data, testing on 20%."

*Wait for result. Show metrics.*

> "XGBoost beat the rules baseline. You can see the feature importances — prior late payment count and risk segment are the top predictors, which is exactly what we'd expect."

*Click "Run RPT Adapter"*

> "The RPT adapter is clearly labeled as simulated — it uses a logistic regression proxy because live SAP-RPT integration is outside V0 scope. But the product experience is preserved: you'd plug in the real RPT endpoint here."

*Point to the comparison table.*

> "The recommendation engine is simple: if the ML model beats the rules by more than 5 AUC points, we recommend the ML approach. Otherwise, rules are simpler and easier to explain. This is evidence-based, not a guess."

---

### 6. Reusable Learnings + Flywheel (45 seconds)

*Click "Save Results & Capture Learnings"*

**Say:**
> "The last step in the flywheel: what did we learn that's reusable?"

*Toggle three learnings to "Proposed".*

> "I'm proposing three learnings for Pack v1.1 — things like 'prior late payment count is the top feature.' These are generalized findings, not tied to Northstar's data."

*Click "Propose Pack v1.1"*

*PackVersioning screen opens.*

> "Pack v1.1 is now in Draft status with the change history. The customer's transactional data is not in here — only the generalized learning."

*Click "Validate Pack v1.1"*

> "Validated. The next Collections engagement will start with these learnings already in the pack. This is the flywheel: customer data stays isolated, reusable knowledge improves the starting point."

---

## Closing

> "The core idea: SAP's advantage isn't building a better random-data generator. It's that we already know the business objects, the relationships, and the constraints for these domains. We can turn that knowledge into a reusable recipe, and every engagement makes the recipe better."

---

## Frequently Asked Questions

**Q: Is this connected to a real SAP system?**  
A: No — this is a pure demo using SAP domain knowledge to structure synthetic data. The schema references (FSCM, KNA1, BKPF) are real SAP concepts, but no live system is connected.

**Q: Is the XGBoost real?**  
A: Yes, if Python is installed. The Express server spawns a real scikit-learn/XGBoost process. If Python isn't available, a JavaScript fallback runs instead (labeled clearly).

**Q: Is the RPT real?**  
A: No — it's clearly labeled "Simulated Adapter." The UI preserves the product experience while being honest that live SAP-RPT integration is V1+ scope.

**Q: What happens to customer data?**  
A: Nothing. The demo generates entirely synthetic data. No customer data enters the system at any point. The pack only stores generalized learnings, not customer-specific distributions.
