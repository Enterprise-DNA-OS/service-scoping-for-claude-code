---
description: Create a reusable professional service
---
# Create a reusable professional service

Run `npm run scope -- add-service --code=S-200 --name="Discovery workshop" --lob=Consulting --category=Design --phase=Discover --resource=Consultant --hours=4 --currency=NZD --description="Review the agreed business requirements" --actor="Actual operator name"`. Substitute the operator's actual records and dates. Add `--json` to inspect every value without display truncation.

Read the affected records first. State the exact change, use the real operator label and run the mutation requested. Read the result back. If a name is ambiguous, show the candidates and ask which one. Missing values stay unknown.
