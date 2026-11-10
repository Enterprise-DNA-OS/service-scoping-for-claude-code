---
description: Record a dependency that must be resolved
---
# Record a dependency that must be resolved

Run `npm run scope -- add-assumption Q-200 --code=A-200 --name="Confirm access" --owner="Operator" --due=2027-01-20 --actor="Actual operator name"`. Substitute the operator's actual records and dates. Add `--json` to inspect every value without display truncation.

Read the affected records first. State the exact change, use the real operator label and run the mutation requested. Read the result back. If a name is ambiguous, show the candidates and ask which one. Missing values stay unknown.
