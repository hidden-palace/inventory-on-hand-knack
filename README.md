# Knack Inventory On-Hand

A responsive inventory on-hand screen connected to live Knack Price List and Inventory Transactions views.

## Features

- Supplier SKU and OR SKU lookup
- On-hand balances calculated from the inventory transaction ledger
- Per-location balances and transaction running balance
- Transaction filters for date, location, type, user, vendor, and reference/PO number
- Hardware barcode-scanner-friendly input
- Responsive desktop and mobile layout
- No bundled demo or fallback inventory records

## Local testing

From this directory, start a local web server:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8765/index.html>.

## Knack configuration

The application ID, view keys, and field mappings are defined in `knack-config.js`. The browser uses supported view-based Knack requests and does not contain the private API key.

See `KNACK_SETUP.md` for the verified mappings, inventory calculations, security notes, and the current reserved-quantity limitation.

## Native Knack deployment

The production target is the Next-Gen Knack page `scene_475`, using Rich Text container `view_1015`. Install `knack-inventory-on-hand.js` and `knack-inventory-on-hand.css` in the corresponding Next-Gen custom-code editors. Both files are scoped to that page and do not modify other Knack screens.
