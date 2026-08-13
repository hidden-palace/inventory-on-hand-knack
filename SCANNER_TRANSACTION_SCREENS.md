# Scanner Transaction Screens

Implementation reference for screens 1–6 in
`OR_Scanner_Design_v2.1 With Ahmed's Screens.docx`.

## Shared scanner design contract

- Maximum interface width: 600px; fluid down to the scanner viewport width.
- One continuous white panel on a light gray page background.
- Navy header with uppercase screen type, large screen title, and a short
  user/location or role subtitle.
- Controls are single-column, touch-friendly, and at least 44px high.
- Product entry is barcode-first, with an outlined green scan control.
- After a scan, show product name, OR SKU/item code, and current on-hand value.
- Primary save actions are full-width green buttons.
- Do not expose fields that are derived automatically.
- Do not use demo records. Product, location, order, request, user, and balance
  values must come from Knack.

## Screen 1 — Main Menu

Purpose: landing screen after login and the entry point to all scanner
functions.

Header:

- `MENU UI`
- `Main Menu`
- Logged-in user and assigned location

Menu:

1. New Transaction
2. Inventory Lookup
3. Transfer Requests
4. Inventory Count
5. Print Labels
6. Reports & Dashboard

New Transaction opens a role-filtered selector:

- Receive Stock
- Transfer Out
- Record Usage
- Report Damage
- Adjust Inventory

Role behavior:

- Florist: Usage
- Warehouse/store staff: Receive, Transfer, Damage
- Manager: Adjustment and approval actions

## Screen 2 — Receive Stock

Ledger type: `Receiving Transaction`

Required on-screen fields:

- Location (receive into)
- Product scan
- Quantity received

Optional on-screen field:

- Reference number (PO/invoice)

Automatically mapped:

- Transaction Type = Receiving Transaction
- Source Location = blank
- Destination Location = selected location
- Item Code / OR SKU / Barcode = scanned Price List item
- Unit Cost = Price List product cost
- Transaction Date = current date/time
- Created By = logged-in user
- Transaction Code = generated `RCV-####`-style code
- Notes = blank unless supplied by the workflow

Inventory effect: add quantity to the destination location.

## Screen 3 — Transfer Out

Ledger type: `Inventory Transfer`

Required on-screen fields:

- Source location
- Destination location
- Product scan
- Quantity to transfer

Automatically mapped:

- Transaction Type = Inventory Transfer
- Source/Destination = selected locations
- Item Code / OR SKU / Barcode = scanned Price List item
- Unit Cost = Price List product cost
- Transaction Date = current date/time
- Created By = logged-in user
- Transaction Code = generated `TRF-####`-style code
- Reference Number = approved transfer request code when launched from a
  request

Validation:

- Source and destination must be different.
- Quantity must be greater than zero.
- Source on-hand must be sufficient.

Inventory effect: subtract from source and add to destination.

Approved-request behavior:

- Pre-fill source, destination, reference, item code, and requested quantity.
- The request itself does not move inventory.
- Only saving the resulting Inventory Transfer writes the ledger movement.

## Screen 4 — Record Usage

Ledger type: `Order Usage`

Required on-screen fields:

- Location (used from)
- Product scan
- Quantity used
- Order number

Optional on-screen field:

- Substituted for — select the product the recipe originally required. Leave
  blank when the scanned product is not a substitute.

Automatically mapped:

- Transaction Type = Order Usage
- Source Location = selected location
- Destination Location = blank
- Reference Number = entered order number
- Item Code / OR SKU / Barcode = scanned Price List item
- Unit Cost = Price List product cost
- Transaction Date = current date/time
- Created By = logged-in user
- Transaction Code = generated `USE-####`-style code
- Substituted For = connected Price List record when supplied

Inventory effect: subtract quantity only from the scanned product at the source
location. The optional substituted product is stored for traceability and does
not create a second inventory movement.

Dependency:

- Confirm whether the order number remains validated text in Reference Number
  or requires a Knack connection to the Order table.

## Screen 5 — Report Damage

Ledger type: `Damage`

Required on-screen fields:

- Location (written off from)
- Product scan
- Quantity damaged
- Damage reason

Automatically mapped:

- Transaction Type = Damage
- Source Location = selected location
- Destination Location = blank
- Notes = damage reason
- Item Code / OR SKU / Barcode = scanned Price List item
- Unit Cost = Price List product cost
- Transaction Date = current date/time
- Created By = logged-in user
- Transaction Code = generated `DMG-####`-style code

Inventory effect: subtract quantity from the source location.

## Screen 6 — Adjust Inventory

Ledger type: `Cycle Count Adjustment`

Required on-screen fields:

- Location being corrected
- Product scan
- Signed adjustment quantity
- Adjustment reason

Automatically mapped:

- Transaction Type = Cycle Count Adjustment
- Source/Destination behavior must preserve the signed quantity calculation
  used by the existing ledger.
- Notes = adjustment reason
- Item Code / OR SKU / Barcode = scanned Price List item
- Unit Cost = Price List product cost
- Transaction Date = current date/time
- Created By = logged-in user
- Transaction Code = generated `ADJ-####`-style code

Validation:

- Manager-only access.
- Adjustment cannot be zero.
- Reason is mandatory.

Inventory effect: apply the signed adjustment to the selected location.

Count approval behavior:

- An approved inventory-count variance creates this ledger transaction
  automatically.
- An unapproved count never changes on-hand.

## Knack implementation status

Implemented and deployed:

- Scanner Menu page: `scene_488`
- Scanner interface host: `view_1049`
- Secured Inventory Transaction write form: `scene_470` / `view_1012`
- Live Price List, location, and transaction reads: `scene_481` /
  `view_1023`, `view_1025`, and `view_1024`
- Main Menu plus Receive, Transfer, Usage, Damage, and Adjustment modes
- Barcode/item-code lookup, live on-hand display, generated transaction codes,
  automatic unit cost/date/user mapping, and role-aware transaction choices
- Validation for product, quantity, source/destination, available stock, order
  number, damage reason, and adjustment reason

Remaining workflow integrations for a later phase:

1. Launch Transfer Out from an approved transfer request with the request,
   source, destination, item, and requested quantity prefilled.
2. Convert an approved inventory-count variance into a Cycle Count Adjustment
   automatically.
3. Confirm whether Usage should continue storing the entered order number in
   Reference Number or use a new connection field to the Order table.

## Current screens 7–10 readiness

- Inventory Lookup: deployed; scanner layout, live filtering, and New
  Transaction selector verified.
- Transfer Requests: deployed; empty state and creation form verified. The
  populated line layout is prepared to display item code and requested
  quantity when records exist.
- Inventory Count: deployed; empty state and count-start form verified. A live
  active-count visual test requires count header/line data.
- Print Labels: deployed; scanner lookup, quantity changes, queue reset,
  Code 128 preview, and print totals verified.
