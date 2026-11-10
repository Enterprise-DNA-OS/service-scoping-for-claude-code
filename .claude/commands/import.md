---
description: Import native ScopeStack professional-service CSV rows
---
# Import native ScopeStack professional-service CSV rows

Run `npm run scope -- import scopestack --file=./fixtures/scopestack-services.csv --currency=NZD --dry-run --actor="Actual operator name"`. Substitute the operator's actual records and dates. Add `--json` to inspect every value without display truncation.

Read the affected records first. State the exact change, use the real operator label and run the mutation requested. Read the result back. If a name is ambiguous, show the candidates and ask which one. Missing values stay unknown.

Export professional services from Settings > Content in ScopeStack. Preserve custom language columns. Run the dry run first, review the counts and then omit --dry-run to import. All imported services return to pending until their rate and content review. This does not import project history or approvals.
