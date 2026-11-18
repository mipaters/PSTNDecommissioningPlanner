# KPI definitions

All values are synthetic and illustrative.

| KPI | Definition |
|---|---|
| Lines migrated % | (Lines on retired switches + migrated share of in-migration switches) ÷ total legacy lines |
| Switches retired | Central offices with status *Decommissioned* ÷ total (42) |
| Savings realised | Annual run-rate savings per retired site (maintenance + site opex + power + real estate) accrued to date, vs. plan |
| Power removed | Sum of `powerKw` of retired switches (50% for in-migration); MWh/yr = kW × 8,760 ÷ 1,000 |
| CO₂e avoided | MWh × 0.03 t/MWh (illustrative blended Canadian grid factor) |
| Real estate freed | Floor sq ft of retired sites; monetisation = sq ft × 50% leasable × $28 × 5 yrs |
| On-time delivery | Share of milestones completed on or before their planned date |
| Critical services at risk | Count of life-safety dependencies (911, alarm, elevator, fire) on sites scheduled for cutover without a verified migration path |
| Churn on migrated lines | Lines lost within 6 months of migration ÷ migrated lines (baseline 9.0%) |
| Readiness score | 0–100 blend of migratable %, IMS/VoLTE coverage, trunk complexity and hidden dependencies. High ≥ 75, Medium 60–74, Low < 60 |
| AI score | 0.4 × readiness + 0.35 × avoidable cost value + 0.25 × keep-risk (spare parts, support status) |
| NPV | 5-year net cash flow discounted at the discount rate (default 8%) |
| IRR | Rate making NPV zero, solved by bisection |
| Payback | Months until cumulative net cash flow turns positive (monthly accrual) |
| Keep-risk index | Residual risk of sites deferred beyond the 36-month horizon |
