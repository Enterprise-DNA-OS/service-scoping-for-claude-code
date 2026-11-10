---
description: Start a client-specific labour estimate
---
# Start a client-specific labour estimate

Run `npm run scope -- create-scope --code=Q-200 --name="Example discovery" --client=C-200 --owner="Operator" --currency=NZD --due=2027-02-01 --tax-note="Estimate excludes GST" --exclusions="Implementation excluded" --actor="Actual operator name"`. Substitute the operator's actual records and dates. Add `--json` to inspect every value without display truncation.

Read the affected records first. State the exact change, use the real operator label and run the mutation requested. Read the result back. If a name is ambiguous, show the candidates and ask which one. Missing values stay unknown.
