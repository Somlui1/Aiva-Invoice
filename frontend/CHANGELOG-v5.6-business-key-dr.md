# v5.6 — Business-key duplicate resolution (ingestion)

Fixes production ingestion so that a re-scan of an invoice is compared with the **current** document of that
invoice. Before this change `ingestEngineResult` only upserted by DMS id: DR-01…DR-07 existed only in the
client-side simulator (`SimContext` / `InvoiceContext`), never on the server. The Document Status Model is unchanged.

## Business key
| identity | receive_id | key used to find the earlier document |
|---|---|---|
| RESOLVED | required, `^[A-Z0-9-]{4,30}$` | **primary** — `receive_id` (a previous NOT_FOUND row is found by the secondary key) |
| NOT_FOUND | must be `null` | **secondary** — `supplier_tax_id + invoice_num` (normalised) |
| UNRESOLVED | must be `null`, `missing_keys` required | none — never matched automatically |

The Engine may send an `identity` block (Portal standard). Engines that do not (the v6.6 corpus) are handled by
deriving it from `oracle_snapshot` (receipt found → RESOLVED, keys readable → NOT_FOUND, else UNRESOLVED).
A violation is a `422` and nothing is written.

## Rules (`src/server/duplicateResolution.ts`)
Engine ranking: Auto-pass > Review > Hold > Manual Review. The comparison target is the *current* document:
Duplicate / Superseded / Rejected rows are ignored; an AP-protected row wins; then best rank; newest row only breaks ties.

| rule | situation | result |
|---|---|---|
| DR-01 / DR-02 | new better / equal | old → Superseded, new = Engine status |
| DR-03 | new worse | old stays, new = Duplicate |
| DR-04 | old Confirmed / Sent / Posted / Import Failed (or locked) | never superseded, new = Duplicate |
| DR-05 | only history rows match | new = Engine status |
| DR-07 | no match, or UNRESOLVED | new document; UNRESOLVED = Manual Review, owner Unknown, APR only |

## Other behaviour changes
- `Document.id` / `dmsDocId` stay the only unique keys. `receiveId`, `secondaryKey` (and the existing `receiptNum`) are plain indexed columns.
- Same DMS id + new `validation_id`: re-validated in place **only** while the document is still in an Engine state and not locked; otherwise `409 DOCUMENT_NOT_REVALIDATABLE`. A lower `validation_round` than stored → `409 STALE_VALIDATION_ROUND`.
- Ingest runs inside one transaction under an in-process lock; the response gains `identity_status`, `applied_rule`, `matched_by`, `supersedes`, `duplicate_of`.
- UNRESOLVED documents: server (`/api/documents/:id/actions`) and queue (`allowedActionFor`) allow **Reject by APR only**; Confirm and all other moves are refused.
- Queue detail shows the existing Superseded / Duplicate links (`supersedes`, `supersededBy`, `duplicate_of`, `supRule`, `dupRule`) from real data.

## Upgrade
`npx prisma db push` (SQLite) adds nullable columns + two indexes. Rows written before v5.6 have no business keys and are not matched; re-ingest them (`npm run db:reset -- --yes --seed …`) if they must take part.

## Known limits
- The lock is per Node process. Multiple API instances need a database-level lock (SQL Server `sp_getapplock` / serializable) before scaling out.
- Only the first Oracle receipt (`receipt_nums[0]`) becomes `receive_id` when the Engine sends no identity block.
