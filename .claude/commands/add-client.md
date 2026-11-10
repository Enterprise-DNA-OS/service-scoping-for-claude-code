---
description: Record a client and a contact-retention purpose
---
# Record a client and a contact-retention purpose

Run `npm run scope -- add-client --code=C-200 --name="Example Co" --contact="owner@example.invalid" --purpose="Active scoping engagement" --review-due=2027-02-01 --actor="Actual operator name"`. Substitute the operator's actual records and dates. Add `--json` to inspect every value without display truncation.

Read the affected records first. State the exact change, use the real operator label and run the mutation requested. Read the result back. If a name is ambiguous, show the candidates and ask which one. Missing values stay unknown.
