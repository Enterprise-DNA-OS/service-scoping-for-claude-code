---
description: Copy a service and its subservices into a draft estimate
---
# Copy a service and its subservices into a draft estimate

Run `npm run scope -- add-line Q-200 --service=S-200 --quantity=1 --acceptance="Customer owner accepts discovery report" --evidence="Workshop agenda and agreed questions" --actor="Actual operator name"`. Substitute the operator's actual records and dates. Add `--json` to inspect every value without display truncation.

Read the affected records first. State the exact change, use the real operator label and run the mutation requested. Read the result back. If a name is ambiguous, show the candidates and ask which one. Missing values stay unknown.

The selected service and each direct subservice are separate estimate lines. Their quantities multiply their own hours, and rates are copied. Later catalogue changes do not silently reprice the scope.
