# mb-incoming sync
An AWS Lambda function to sync Moneybird incoming docs (purchase invoices and receipts) to an AWS S3 bucket.

The url needs a valid Moneybird admin code. Also, the request header should have a valid access token.

Tests:

- [x] dedupe a list of ids
- [ ] store a Moneybird sync object on S3
- [ ] get a Moneybird sync from S3
- [ ] get a sync from Moneybird
- [ ] get new and changed from old + new list of ids, versions
- [ ] coverage for receipts changed to purchase invoices and vv
- [ ] get deleted from old + new list of ids


### `GET /mb-incoming-sync/[admin-code]`
Retrieves the latest state from Moneybird, saves the latest version of all docs.

Response body contains unique receipt ids and purchase invoice ids, of only those that are new, changed, or deleted since the last sync:
```json
{
    "receipts": { 
        "new": [
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
        "new": [
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
### `GET /mb-incoming-sync/[admin-code]/sim`
Returns the latest sync state, without syncing with Moneybird.

Response body has the same structure as the other end-point ;)

## Under the hood
The regular API end-point:

- retrieves the latest versions from all receipts and purchase invoices from Moneybird
    - if error, returns an error response
- if all OK:
- read the file `mb-incoming-sync-latest.json` from S3 and store as `mb-incoming-sync-previous.json`
- deduplicate response from Moneybird, and save as `mb-incoming-latest.json`
- send deduped Moneybird response to `sim-func`

For the `/sim` API:

- start with a (deduplicated) latest version, get from S3
- run `sim-func`

The `sim-func`:
- get `mb-incoming-sync-previous.json`
- filter latest version, to only keep those
    - that did not exist previously (as new)
    - with a newer version number (as changed)
- add deleted ids: that did exist in previous, but not in latest
- return json response

File structure:
```json
{
    "receipts": [
        { "id": "123", "version": "456" }
    ],
    "purchase_invoices": [
        { "id": "124", "version": "788" }
    ]
}