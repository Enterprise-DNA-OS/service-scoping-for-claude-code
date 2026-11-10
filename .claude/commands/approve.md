---
description: Record technical or commercial sign-off
---
# Record technical or commercial sign-off

Run `npm run scope -- approve Q-200 --kind=technical --evidence="Effort and acceptance checked" --actor="Actual operator name"`. Substitute the operator's actual records and dates. Add `--json` to inspect every value without display truncation.

Read the affected records first. State the exact change, use the real operator label and run the mutation requested. Read the result back. If a name is ambiguous, show the candidates and ask which one. Missing values stay unknown.

The reviewer must be a different person from the scope owner. Technical and commercial reviewers must differ. A commercial margin exception needs an explicit reason in --exception=. The actor label is a record, not authentication.
