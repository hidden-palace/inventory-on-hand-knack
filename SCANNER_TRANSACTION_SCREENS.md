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

Inventory effect: subtract quantity from the source location.

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

## Shared Knack dependencies for the next build

Existing tables/views already mapped:

- Price List: product identity, SKU/barcode, unit cost
- Inventory Locations: location identity and active locations
- Inventory Transactions: immutable inventory ledger
- Transfer Requests and Transfer Request Lines
- Inventory Counts and Inventory Count Lines

Required implementation work:

1. Add secured Knack Add Record views for Inventory Transactions on the future
   scanner transaction pages.
2. Create routes/host Rich Text views for Main Menu, Receive, Transfer, Usage,
   Damage, and Adjustment.
3. Apply role-based visibility and validation to menu choices and forms.
4. Reuse the live Price List scanner lookup and transaction-derived balances.
5. Generate transaction codes without exposing the automatic fields.
6. Connect approved transfer requests to the Transfer form prefill.
7. Add the manager approval path that converts approved count variance into a
   Cycle Count Adjustment.
8. Confirm the Order Number validation/connection decision for Usage.

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
