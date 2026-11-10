---
description: Change draft effort, rates, evidence or acceptance criteria
---
# Change draft effort, rates, evidence or acceptance criteria

Run `npm run scope -- set-line L-101 --hours=10 --evidence="Revised estimate from workshop" --actor="Actual operator name"`. Substitute the operator's actual records and dates. Add `--json` to inspect every value without display truncation.

Read the affected records first. State the exact change, use the real operator label and run the mutation requested. Read the result back. If a name is ambiguous, show the candidates and ask which one. Missing values stay unknown.
