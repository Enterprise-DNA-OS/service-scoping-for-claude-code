---
description: Write a full private administrative snapshot
---
# Write a full private administrative snapshot

Run `npm run scope -- export --dir=./exports/first-snapshot`. Substitute the operator's actual records and dates. Add `--json` to inspect every value without display truncation.

Read the returned records before writing any explanation. If a name is ambiguous, show the candidates and ask which one. Missing values stay unknown.

The snapshot includes private contacts, costs and approvals. Keep it private. It is an administrative export, not the vendor import format.
