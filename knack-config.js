window.INVENTORY_CONFIG = {
  applicationId: "6295c09d313de3001ea4047e",
  defaultItem: "UTC-CTR-003",
  currency: "USD",
  locale: "en-US",
  rowsPerPage: 1000,
  locations: ["Palmdale WareHouse", "Santa Monica", "Sherman Oaks"],
  permissions: {
    costRoles: ["General Manager - Admin", "Inventorist", "Dev"],
    showCostsOutsideKnack: true
  },
  views: {
    items: { scene: "scene_463", view: "view_1003" },
    itemDetails: { scene: "scene_464", view: "view_1004" },
    transactions: { scene: "scene_470", view: "view_1008" }
  },
  fields: {
    item: {
      name:"field_721", photo:"field_739", sku:"field_725",
      barcode:"field_724", category:"field_727", vendor:"field_733",
      unit:"field_728", status:"field_738", reorderPoint:"field_749",
      reorderQuantity:"", lastPurchaseCost:"field_730"
    },
    transaction: {
      itemCode:"field_753", sku:"field_761", date:"field_759",
      number:"field_752", code:"field_750", type:"field_756",
      reference:"field_760", source:"field_754", destination:"field_755",
      quantity:"field_757", unitCost:"field_758", user:"field_764",
      notes:"field_762"
    }
  }
};
