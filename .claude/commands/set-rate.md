---
description: Review and activate a service with cost and sell rates
---
# Review and activate a service with cost and sell rates

Run `npm run scope -- set-rate S-200 --cost-cents=10000 --sell-cents=20000 --date=2026-11-10 --actor="Actual operator name"`. Substitute the operator's actual records and dates. Add `--json` to inspect every value without display truncation.

Read the affected records first. State the exact change, use the real operator label and run the mutation requested. Read the result back. If a name is ambiguous, show the candidates and ask which one. Missing values stay unknown.
