# mb-incoming sync
An AWS Lambda function to sync Moneybird incoming docs (purchase invoices and receipts) to an AWS S3 bucket.

The url needs a valid Moneybird admin code. Also, the request header should have a valid access token.

### `POST /mb-incoming-sync/[admin-code]`
Retrieves the latest state from Moneybird, saves the latest version of all docs.

Response body contains unique receipt ids and purchase invoice ids, of only those that are new, changed, or deleted since the last sync:
```json
{
    "receipts": { 
        "added": [
            "12341",
            "12342"
        ],
        "changed": [
            "12345",
            "12346"
        ],
        "deleted": [
            "12347"
        ]
    },
    "purchase_invoices": { 
        "added": [
            "22341",
            "22342"
        ],
        "changed": [
            "22345",
            "22346"
        ],
        "deleted": [
            "22347"
        ]
    },
}
```
NOTE: If a document changes from receipt to purchase invoice or vice versa, it will show up as `deleted` on one, and `new` on the other.

### `GET /mb-incoming-sync/[admin-code]`
Returns the latest sync state, without syncing with Moneybird or saving the sync.

Response body has the same structure as the POST end-point ;)

## Under the hood
The main handler:

- reads `mb-incoming-sync-latest.json` and `mb-incoming-sync-previous.json` from S3
- retrieves the latest versions from all receipts and purchase invoices from Moneybird
    - if error, abort with error response
- if OK:
- created the latest sync from MB (deduped of course). 
- if in POST mode
    - save latest sync as `mb-incoming-latest.json`
    - save latest sync from S3 as `mb-incoming-sync-previous.json` (replacing older version)
- if save return error: abort
- create a diff from:
    - if GET: previous from S3 vs latest from S3 (= cached response)
    - if POST: latest from S3 vs latest from Moneybird (= new diff)
- return this diff as response

File structure of S3 files:
```json
{
    "receipts": [
        { "id": "123", "version": "456" }
    ],
    "purchase_invoices": [
        { "id": "124", "version": "788" }
    ]
}