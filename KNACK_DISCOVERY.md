# Verified Knack API discovery

Read-only inspection performed against the Knack application. The private API key is intentionally not stored in this workspace.

## Verified tables

| Table | Object key | Record count at inspection |
|---|---:|---:|
| Product | `object_8` | 1,609 |
| Inventory Locations | `object_27` | 4 |
| Categories | `object_28` | 9 |
| Inventory Transactions | `object_29` | 7 |

## Final inventory item source

The schema inspection established that inventory items come from **Price List** (`object_26`), not Product. The live transaction values `41636` and `UTC-CTR-003` match the following Price List record exactly.

| Field | Key |
|---|---|
| Item Name | `field_721` |
| Supplier SKU / scanned item code | `field_724` |
| OR SKU | `field_725` |
| Description | `field_726` |
| Category | `field_727` |
| Unit Of Measure | `field_728` |
| Size | `field_729` |
| Unit Price Cost | `field_730` |
| Unit Selling Price | `field_731` |
| Item Image | `field_739` |
| Status | `field_738` |
| Supplier | `field_733` |
| Reorder Point | `field_749` |
| Item Image URL | `field_769` |
| Re-Order Quantity | `field_770` |

The Item Image URL is preferred when present, with the original Item Image upload
field retained as a fallback. Both new fields are exposed by the Price List
details view (`scene_464` / `view_1004`) so they can be read safely from the
browser without using the private object API.

Supported view-based sources used by the frontend:

- Price List: `scene_463` / `view_1003`
- Price List Details: `scene_464` / `view_1004`
- Inventory Transactions: `scene_470` / `view_1008`

The prior assumption that `object_9` and `object_10` were Order and Line Item was disproved by record inspection: their records contain client/recipient information. Order and Line Item object keys still require schema enumeration from the Live App or Knack MCP schema service because their supplied exports are empty.

## Inventory Locations (`object_27`)

| Field | Key |
|---|---|
| Location Name | `field_740` |
| Location Record ID | `field_741` |
| Location Code | `field_742` |
| Location Type | `field_743` |
| Status | `field_744` |

## Inventory Transactions (`object_29`)

Mappings below were verified from the live record shapes and sample values.

| Field | Key | Example behavior |
|---|---|---|
| Transaction Code | `field_750` | `CYC`, `ITRN` |
| Record ID | `field_751` | Knack-style record identifier |
| Transaction Number | `field_752` | Numeric transaction number |
| Item Code | `field_753` | Item identifier |
| Source Location | `field_754` | Location name/connection |
| Destination Location | `field_755` | Location name/connection |
| Transaction Type | `field_756` | Cycle Count Adjustment, Inventory Transfer, etc. |
| Quantity | `field_757` | Signed for adjustments; positive for transfers |
| Unit Cost | `field_758` | Currency |
| Transaction Date | `field_759` | Date/time |
| Reference Number | `field_760` | Source reference |
| OR SKU | `field_761` | SKU text |
| Notes | `field_762` | Notes |
| Item Image | `field_763` | Image |
| Created By | `field_764` | User name/connection |

## Product (`object_8`) keys visible in record responses

Confirmed by record values:

| Likely field | Key |
|---|---|
| Product ID | `field_75` |
| Platform Product ID | `field_76` |
| Product Name | `field_28` |
| Description | `field_77` |
| Product Image | `field_78` |
| Active | `field_83` |
| Flower Shop | `field_88` |
| Selling Price | `field_79` |
| Product display/composite value | `field_89` |
| Product Category/Type | `field_389` |
| Cost-related value | `field_81` |

Other Product fields still need their Builder labels confirmed before they are used in production.

## Implementation consequence

Inventory balances can be calculated from `object_29` by applying each transaction to its source and/or destination location. Cycle count adjustments already demonstrate signed quantities. Inventory transfers use a positive quantity that must be subtracted from `field_754` and added to `field_755`.

The private object API must not be called from browser code. Production deployment should use login-protected Knack views and view-based requests, or a server-side proxy that holds the private API key.
