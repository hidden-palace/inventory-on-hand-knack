# Inventory workflow screens

The four workflow pages are protected by the shared Inventory login and are
limited in Knack to General Manager - Admin, Inventorist, and Dev roles.

| Screen | Page | Host | Live data and forms |
|---|---|---|---|
| Inventory Lookup | `scene_481` | `view_1022` | Price List `view_1023`, Transactions `view_1024`, Locations `view_1025` |
| Transfer Requests | `scene_482` | `view_1026` | Headers `view_1027`, Lines `view_1028`, Add Header `view_1029`, Add Line `view_1030` |
| Inventory Count | `scene_483` | `view_1031` | Headers `view_1032`, Lines `view_1033`, Add Header `view_1034`, Add Line `view_1035` |
| Print Labels | `scene_484` | `view_1036` | Logs `view_1037`, Add Log `view_1038`, Price List `view_1039`, Transactions `view_1040` |
| Scanner Menu & Transactions | `scene_488` | `view_1049` | Reads Price List/Transactions/Locations from `scene_481`; writes through Inventory Transaction form `scene_470` / `view_1012` |

Secured update forms:

- Transfer Request details: `scene_486` / `view_1045`
- Inventory Count details: `scene_487` / `view_1047`

The browser integration uses `X-Knack-REST-API-Key: knack` and the logged-in
user token. It does not use the private application API key. Native table and
form elements remain on each page as the access-controlled API surface, while
the custom interface mounts into the first Rich Text element.

## Transaction and print behavior

- Lookup balances are derived from immutable Inventory Transaction records.
- A transfer request snapshots source-location availability when each line is
  added.
- A count line stores the counted quantity, system snapshot, and variance.
- Count submission and transfer approval update through secured Edit Record
  forms.
- Label printing uses the browser print dialog for the installed Zebra printer
  and records each print/reprint in Inventory Label Print Logs.
- Silent direct Zebra printing requires a separately approved local bridge such
  as QZ Tray or PrintNode; no browser-only page can bypass the print dialog.
