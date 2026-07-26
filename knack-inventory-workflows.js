(function () {
  "use strict";

  const APP_ID = "6295c09d313de3001ea4047e";
  const PAGE = {
    lookup: {
      scene: "scene_481", host: "view_1022",
      items: { scene: "scene_481", view: "view_1023" },
      transactions: { scene: "scene_481", view: "view_1024" },
      locations: { scene: "scene_481", view: "view_1025" },
      hidden: ["view_1023", "view_1024", "view_1025"]
    },
    transfers: {
      scene: "scene_482", host: "view_1026",
      requests: { scene: "scene_482", view: "view_1027" },
      lines: { scene: "scene_482", view: "view_1028" },
      addRequest: { scene: "scene_482", view: "view_1029" },
      addLine: { scene: "scene_482", view: "view_1030" },
      editRequest: { scene: "scene_486", view: "view_1045" },
      hidden: ["view_1027", "view_1028", "view_1029", "view_1030"]
    },
    counts: {
      scene: "scene_483", host: "view_1031",
      counts: { scene: "scene_483", view: "view_1032" },
      lines: { scene: "scene_483", view: "view_1033" },
      addCount: { scene: "scene_483", view: "view_1034" },
      addLine: { scene: "scene_483", view: "view_1035" },
      editCount: { scene: "scene_487", view: "view_1047" },
      hidden: ["view_1032", "view_1033", "view_1034", "view_1035"]
    },
    labels: {
      scene: "scene_484", host: "view_1036",
      logs: { scene: "scene_484", view: "view_1037" },
      addLog: { scene: "scene_484", view: "view_1038" },
      items: { scene: "scene_484", view: "view_1039" },
      transactions: { scene: "scene_484", view: "view_1040" },
      hidden: ["view_1037", "view_1038", "view_1039", "view_1040"]
    }
  };
  const FIELD = {
    item: {
      name: "field_721", supplierSku: "field_724", sku: "field_725",
      category: "field_727", unit: "field_728", cost: "field_730",
      image: "field_739", status: "field_738", reorder: "field_749",
      imageUrl: "field_769", reorderQuantity: "field_770", barcode: "field_771"
    },
    transaction: {
      code: "field_750", number: "field_752", itemCode: "field_753",
      source: "field_754", destination: "field_755", type: "field_756",
      quantity: "field_757", cost: "field_758", date: "field_759",
      reference: "field_760", sku: "field_761", notes: "field_762",
      image: "field_763", user: "field_764", barcode: "field_772"
    },
    location: {
      name: "field_740", code: "field_742", type: "field_743", status: "field_744"
    },
    request: {
      code: "field_773", source: "field_783", destination: "field_784",
      status: "field_785", needed: "field_786", requestedBy: "field_787",
      requestedDate: "field_788", approvedBy: "field_789",
      approvalDate: "field_790", rejection: "field_791",
      fulfilledDate: "field_792", notes: "field_793"
    },
    requestLine: {
      code: "field_775", request: "field_794", sku: "field_795",
      supplierSku: "field_796", name: "field_797", requested: "field_798",
      available: "field_799", fulfilled: "field_800"
    },
    count: {
      code: "field_777", location: "field_801", scope: "field_802",
      details: "field_803", status: "field_804", blind: "field_805",
      startedBy: "field_806", startedDate: "field_807",
      submittedBy: "field_808", submittedDate: "field_809",
      approvedBy: "field_810", approvedDate: "field_811", notes: "field_812"
    },
    countLine: {
      code: "field_779", count: "field_813", sku: "field_814",
      supplierSku: "field_815", name: "field_816", counted: "field_817",
      system: "field_818", variance: "field_819", scannedAt: "field_820"
    },
    label: {
      code: "field_781", sourceType: "field_821", source: "field_822",
      sku: "field_823", supplierSku: "field_824", name: "field_825",
      quantity: "field_826", size: "field_827", printer: "field_828",
      printedBy: "field_829", printedAt: "field_830", reprint: "field_831"
    }
  };

  const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

  function raw(record, key) {
    const value = record?.[key + "_raw"] ?? record?.[key];
    if (Array.isArray(value)) {
      if (value.length === 1) return value[0]?.identifier ?? value[0]?.id ?? value[0];
      return value.map(item => item?.identifier ?? item?.id ?? item).join(", ");
    }
    if (value && typeof value === "object") {
      return value.identifier ?? value.url ?? value.value ?? value.iso_timestamp ??
        value.proper_iso_timestamp ?? value.date_formatted ?? value.date ?? value.id;
    }
    return value;
  }
  function connectionId(record, key) {
    const value = record?.[key + "_raw"] ?? record?.[key];
    const first = Array.isArray(value) ? value[0] : value;
    return first?.id ?? first;
  }
  function numeric(value) {
    const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function imageUrl(record) {
    for (const key of [FIELD.item.imageUrl, FIELD.item.image, FIELD.transaction.image]) {
      const value = record?.[key + "_raw"] ?? record?.[key];
      const first = Array.isArray(value) ? value[0] : value;
      const url = first?.url || first?.thumb_url || (typeof first === "string" && /^https?:/i.test(first) ? first : "");
      if (url) return url;
    }
    return "";
  }
  function html(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }
  function code(prefix) {
    const stamp = new Date().toISOString().replace(/\D/g, "").slice(2, 14);
    return `${prefix}-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
  }
  function dateText(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? (value || "-") :
      new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }
  function knackDate(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    const hours = date.getHours();
    const hour = hours % 12 || 12;
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${hour}:${minute} ${hours >= 12 ? "pm" : "am"}`;
  }
  async function token() {
    if (globalThis.Knack?.getUserToken) return await globalThis.Knack.getUserToken();
    return "";
  }
  async function currentUser() {
    try {
      const user = await globalThis.Knack?.getUser?.();
      return user?.name || user?.email || user?.values?.name || user?.values?.email || "Current user";
    } catch {
      return "Current user";
    }
  }
  async function request(view, options = {}) {
    if (!view?.scene || !view?.view) throw new Error("This Knack view has not been configured.");
    const userToken = await token();
    const id = options.id ? `/${options.id}` : "";
    const query = new URLSearchParams({ page: "1", rows_per_page: "1000" });
    if (options.filters?.length) query.set("filters", JSON.stringify({ match: "and", rules: options.filters }));
    const response = await fetch(
      `https://api.knack.com/v1/pages/${view.scene}/views/${view.view}/records${id}${options.method ? "" : `?${query}`}`,
      {
        method: options.method || "GET",
        headers: {
          "X-Knack-Application-Id": APP_ID,
          "X-Knack-REST-API-Key": "knack",
          ...(userToken ? { Authorization: userToken } : {}),
          ...(options.method ? { "Content-Type": "application/json" } : {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      }
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.errors?.[0]?.message || payload?.message || `Knack request failed (${response.status}).`;
      throw new Error(message);
    }
    return options.method ? payload : (payload.records || []);
  }
  const records = (view, filters) => request(view, { filters });
  const create = (view, body) => request(view, { method: "POST", body });
  const update = (view, id, body) => request(view, { method: "PUT", id, body });

  function item(record) {
    return {
      id: record.id,
      name: raw(record, FIELD.item.name) || "Unnamed item",
      sku: String(raw(record, FIELD.item.sku) || "").trim(),
      supplierSku: String(raw(record, FIELD.item.supplierSku) || "").trim(),
      barcode: String(raw(record, FIELD.item.barcode) || raw(record, FIELD.item.supplierSku) || "").trim(),
      category: raw(record, FIELD.item.category),
      unit: raw(record, FIELD.item.unit),
      cost: numeric(raw(record, FIELD.item.cost)),
      status: raw(record, FIELD.item.status),
      reorder: numeric(raw(record, FIELD.item.reorder)),
      reorderQuantity: numeric(raw(record, FIELD.item.reorderQuantity)),
      image: imageUrl(record)
    };
  }
  function transaction(record) {
    return {
      id: record.id,
      code: raw(record, FIELD.transaction.code),
      number: raw(record, FIELD.transaction.number),
      itemCode: String(raw(record, FIELD.transaction.itemCode) || "").trim(),
      sku: String(raw(record, FIELD.transaction.sku) || "").trim(),
      barcode: String(raw(record, FIELD.transaction.barcode) || "").trim(),
      source: raw(record, FIELD.transaction.source),
      destination: raw(record, FIELD.transaction.destination),
      type: raw(record, FIELD.transaction.type),
      quantity: numeric(raw(record, FIELD.transaction.quantity)),
      cost: numeric(raw(record, FIELD.transaction.cost)),
      date: raw(record, FIELD.transaction.date),
      reference: raw(record, FIELD.transaction.reference),
      user: raw(record, FIELD.transaction.user),
      notes: raw(record, FIELD.transaction.notes)
    };
  }
  function mapLocation(record) {
    return {
      id: record.id, name: raw(record, FIELD.location.name), code: raw(record, FIELD.location.code),
      type: raw(record, FIELD.location.type), status: raw(record, FIELD.location.status)
    };
  }
  function matches(tx, product) {
    const keys = [product.sku, product.supplierSku, product.barcode].filter(Boolean).map(value => value.toLowerCase());
    return [tx.sku, tx.itemCode, tx.barcode].filter(Boolean).some(value => keys.includes(value.toLowerCase()));
  }
  function balancesFor(product, transactions, locations) {
    const totals = new Map(locations.map(row => [row.name, 0]));
    const rows = transactions.filter(row => matches(row, product)).sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = 0;
    rows.forEach(tx => {
      const type = String(tx.type || "").toLowerCase();
      const amount = Math.abs(tx.quantity);
      let delta = 0;
      tx.in = 0;
      tx.out = 0;
      if (type.includes("transfer")) {
        if (tx.source) totals.set(tx.source, (totals.get(tx.source) || 0) - amount);
        if (tx.destination) totals.set(tx.destination, (totals.get(tx.destination) || 0) + amount);
        tx.in = amount;
        tx.out = amount;
      } else if (type.includes("receiv") || type.includes("return") || type.includes("beginning")) {
        const target = tx.destination || tx.source;
        if (target) totals.set(target, (totals.get(target) || 0) + amount);
        tx.in = amount;
        delta = amount;
      } else if (type.includes("order") || type.includes("damage") || type.includes("waste")) {
        const target = tx.source || tx.destination;
        if (target) totals.set(target, (totals.get(target) || 0) - amount);
        tx.out = amount;
        delta = -amount;
      } else {
        const target = tx.destination || tx.source;
        if (target) totals.set(target, (totals.get(target) || 0) + tx.quantity);
        delta = tx.quantity;
        if (delta >= 0) tx.in = delta; else tx.out = Math.abs(delta);
      }
      running += delta;
      tx.balance = running;
    });
    return { rows, locations: locations.map(row => ({ ...row, onHand: totals.get(row.name) || 0 })) };
  }
  function findProduct(products, query) {
    const value = String(query || "").trim().toLowerCase();
    if (!value) return null;
    return products.find(product => [product.sku, product.supplierSku, product.barcode].some(key => String(key).toLowerCase() === value)) ||
      products.find(product => product.name.toLowerCase().includes(value));
  }
  function status(root, message, error = false) {
    const element = root.querySelector("[data-status]");
    element.hidden = !message;
    element.textContent = message || "";
    element.classList.toggle("iw-error", error);
  }
  function selectOptions(rows, value = "id", label = "name") {
    return rows.filter(row => row[label]).map(row => `<option value="${html(row[value])}">${html(row[label])}</option>`).join("");
  }
  function modal(root, title, body, actions) {
    const dialog = root.querySelector(".iw-dialog");
    dialog.innerHTML = `<form method="dialog" class="iw-dialog-card"><button class="iw-dialog-x" aria-label="Close">×</button><h2>${html(title)}</h2>${body}<div class="iw-dialog-actions">${actions}</div></form>`;
    dialog.showModal();
    return dialog;
  }
  function base(title, eyebrow, actions = "") {
    return `<div class="iw-shell"><header class="iw-topbar"><div><p class="iw-eyebrow">${eyebrow}</p><h1>${title}</h1></div><div class="iw-actions">${actions}</div></header><div class="iw-status" data-status hidden></div><main data-main></main><dialog class="iw-dialog"></dialog></div>`;
  }

  async function mountLookup(host) {
    host.innerHTML = base("Inventory Lookup", "Inventory control");
    const root = host.querySelector(".iw-shell");
    root.querySelector("[data-main]").innerHTML = `
      <section class="iw-card iw-lookup"><label>Location<select data-location><option value="">All locations</option></select></label><label>Scan or search product<div class="iw-input-row"><input data-search autocomplete="off" placeholder="Supplier SKU, OR SKU, barcode, or item name"><button data-find class="iw-primary">Find</button></div></label></section>
      <section data-result hidden>
        <article class="iw-card iw-product"><div class="iw-photo" data-photo></div><div><span class="iw-pill" data-item-status></span><h2 data-name></h2><p data-identity></p><p class="iw-muted" data-category></p></div><dl><div><dt>Unit</dt><dd data-unit></dd></div><div><dt>Reorder point</dt><dd data-reorder></dd></div><div><dt>Reorder qty</dt><dd data-reorder-qty></dd></div></dl></article>
        <div class="iw-metrics"><article class="iw-card"><span>On hand</span><strong data-total>0</strong></article><article class="iw-card"><span>Inventory value</span><strong data-value>$0.00</strong></article><article class="iw-card"><span>Last movement</span><strong class="iw-small" data-last>-</strong></article></div>
        <section class="iw-card"><div class="iw-section-head"><div><p class="iw-eyebrow">Live balances</p><h2>On hand by location</h2></div><div class="iw-actions"><button data-use>Use</button><button data-transfer class="iw-primary">Transfer</button></div></div><div class="iw-table"><table><thead><tr><th>Location</th><th>Code</th><th class="iw-num">On hand</th><th class="iw-num">Value</th></tr></thead><tbody data-balances></tbody></table></div></section>
        <section class="iw-card"><p class="iw-eyebrow">Audit trail</p><h2>Recent movements</h2><div class="iw-table"><table><thead><tr><th>Date & time</th><th>Type</th><th>Reference</th><th>Source → destination</th><th class="iw-num">In</th><th class="iw-num">Out</th><th class="iw-num">Balance</th></tr></thead><tbody data-movements></tbody></table></div></section>
        <p class="iw-note">Read-only lookup. Inventory changes are recorded through controlled transaction workflows.</p>
      </section>`;
    status(root, "Loading live inventory...");
    try {
      const [itemRows, txRows, locationRows] = await Promise.all([
        records(PAGE.lookup.items), records(PAGE.lookup.transactions), records(PAGE.lookup.locations)
      ]);
      const state = { products: itemRows.map(item), transactions: txRows.map(transaction), locations: locationRows.map(mapLocation), selected: null };
      const locationSelect = root.querySelector("[data-location]");
      locationSelect.insertAdjacentHTML("beforeend", selectOptions(state.locations, "name", "name"));
      const render = product => {
        if (!product) return status(root, "No live Price List item matched that search.", true);
        state.selected = product;
        const calculated = balancesFor(product, state.transactions, state.locations);
        const selectedLocation = locationSelect.value;
        const locationBalances = selectedLocation ? calculated.locations.filter(row => row.name === selectedLocation) : calculated.locations;
        const total = locationBalances.reduce((sum, row) => sum + row.onHand, 0);
        const movements = selectedLocation ? calculated.rows.filter(tx => tx.source === selectedLocation || tx.destination === selectedLocation) : calculated.rows;
        root.querySelector("[data-name]").textContent = product.name;
        root.querySelector("[data-identity]").textContent = `OR SKU ${product.sku || "-"} · Supplier SKU ${product.supplierSku || "-"} · Barcode ${product.barcode || "-"}`;
        root.querySelector("[data-category]").textContent = product.category || "-";
        root.querySelector("[data-unit]").textContent = product.unit || "-";
        root.querySelector("[data-reorder]").textContent = number.format(product.reorder);
        root.querySelector("[data-reorder-qty]").textContent = number.format(product.reorderQuantity);
        root.querySelector("[data-item-status]").textContent = product.status || "Unknown";
        root.querySelector("[data-photo]").style.backgroundImage = product.image ? `url("${product.image.replace(/["\\]/g, "\\$&")}")` : "";
        root.querySelector("[data-photo]").textContent = product.image ? "" : "No image";
        root.querySelector("[data-total]").textContent = number.format(total);
        root.querySelector("[data-value]").textContent = money.format(total * product.cost);
        root.querySelector("[data-last]").textContent = movements.length ? dateText(movements[movements.length - 1].date) : "No movements";
        root.querySelector("[data-balances]").innerHTML = locationBalances.map(row => `<tr><td>${html(row.name)}</td><td>${html(row.code)}</td><td class="iw-num">${number.format(row.onHand)}</td><td class="iw-num">${money.format(row.onHand * product.cost)}</td></tr>`).join("") || `<tr><td colspan="4" class="iw-empty">No active locations.</td></tr>`;
        root.querySelector("[data-movements]").innerHTML = movements.slice().reverse().slice(0, 20).map(tx => `<tr><td>${html(dateText(tx.date))}</td><td>${html(tx.type)}</td><td>${html(tx.reference)}</td><td>${html(tx.source || "-")} → ${html(tx.destination || "-")}</td><td class="iw-num">${tx.in ? number.format(tx.in) : ""}</td><td class="iw-num">${tx.out ? number.format(tx.out) : ""}</td><td class="iw-num">${number.format(tx.balance)}</td></tr>`).join("") || `<tr><td colspan="7" class="iw-empty">No transactions for this item.</td></tr>`;
        root.querySelector("[data-result]").hidden = false;
        status(root, "");
      };
      const find = () => render(findProduct(state.products, root.querySelector("[data-search]").value));
      root.querySelector("[data-find]").addEventListener("click", find);
      root.querySelector("[data-search]").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); find(); } });
      locationSelect.addEventListener("change", () => state.selected && render(state.selected));
      root.querySelector("[data-transfer]").addEventListener("click", () => {
        if (state.selected) location.href = `/jong/ft-dev/transfer-requests?sku=${encodeURIComponent(state.selected.sku || state.selected.supplierSku)}`;
      });
      root.querySelector("[data-use]").addEventListener("click", () => {
        status(root, "Use is recorded through the existing Inventory Transactions workflow; select Order Usage there to preserve the audit trail.");
      });
      const initial = new URLSearchParams(location.search).get("sku");
      render(findProduct(state.products, initial || "UTC-CTR-003") || state.products[0]);
    } catch (error) {
      status(root, error.message || "Unable to load inventory.", true);
    }
  }

  async function mountTransfers(host) {
    host.innerHTML = base("Transfer Requests", "Inventory movement", `<button data-new class="iw-primary">New request</button>`);
    const root = host.querySelector(".iw-shell");
    root.querySelector("[data-main]").innerHTML = `<div class="iw-split"><aside class="iw-card"><div class="iw-section-head"><h2>Open requests</h2><button data-refresh>Refresh</button></div><div data-request-list class="iw-list"></div></aside><section class="iw-card" data-detail><div class="iw-empty">Select a transfer request.</div></section></div>`;
    const state = { requests: [], lines: [], products: [], transactions: [], locations: [], selected: null };
    const reload = async preferredId => {
      status(root, "Loading live transfer requests...");
      try {
        const [requestsRows, lineRows, productRows, txRows, locationRows] = await Promise.all([
          records(PAGE.transfers.requests), records(PAGE.transfers.lines), records(PAGE.lookup.items),
          records(PAGE.lookup.transactions), records(PAGE.lookup.locations)
        ]);
        state.requests = requestsRows;
        state.lines = lineRows;
        state.products = productRows.map(item);
        state.transactions = txRows.map(transaction);
        state.locations = locationRows.map(mapLocation);
        state.selected = state.requests.find(row => row.id === preferredId) || state.requests[0] || null;
        renderList();
        renderDetail();
        status(root, "");
      } catch (error) {
        status(root, error.message || "Unable to load transfer requests.", true);
      }
    };
    const requestLines = requestRecord => state.lines.filter(row =>
      connectionId(row, FIELD.requestLine.request) === requestRecord.id ||
      String(raw(row, FIELD.requestLine.request)) === String(raw(requestRecord, FIELD.request.code))
    );
    const renderList = () => {
      root.querySelector("[data-request-list]").innerHTML = state.requests.map(row => {
        const selected = state.selected?.id === row.id ? " is-selected" : "";
        return `<button class="iw-list-item${selected}" data-request-id="${row.id}"><strong>${html(raw(row, FIELD.request.code))}</strong><span>${html(raw(row, FIELD.request.source))} → ${html(raw(row, FIELD.request.destination))}</span><span class="iw-pill">${html(raw(row, FIELD.request.status) || "Draft")}</span></button>`;
      }).join("") || `<p class="iw-empty">No transfer requests yet.</p>`;
    };
    const renderDetail = () => {
      const panel = root.querySelector("[data-detail]");
      const row = state.selected;
      if (!row) { panel.innerHTML = `<div class="iw-empty">Create the first transfer request.</div>`; return; }
      const lines = requestLines(row);
      panel.innerHTML = `<div class="iw-section-head"><div><p class="iw-eyebrow">${html(raw(row, FIELD.request.code))}</p><h2>${html(raw(row, FIELD.request.source))} → ${html(raw(row, FIELD.request.destination))}</h2></div><span class="iw-pill">${html(raw(row, FIELD.request.status) || "Draft")}</span></div>
        <div class="iw-meta"><span><b>Needed by</b>${html(dateText(raw(row, FIELD.request.needed)))}</span><span><b>Requested by</b>${html(raw(row, FIELD.request.requestedBy))}</span><span><b>Requested</b>${html(dateText(raw(row, FIELD.request.requestedDate)))}</span></div>
        <div class="iw-table"><table><thead><tr><th>Item</th><th>OR SKU</th><th class="iw-num">Requested</th><th class="iw-num">Available</th><th>Status</th></tr></thead><tbody>${lines.map(line => {
          const requested = numeric(raw(line, FIELD.requestLine.requested));
          const available = numeric(raw(line, FIELD.requestLine.available));
          return `<tr><td>${html(raw(line, FIELD.requestLine.name))}</td><td>${html(raw(line, FIELD.requestLine.sku))}</td><td class="iw-num">${number.format(requested)}</td><td class="iw-num">${number.format(available)}</td><td>${available < requested ? `<span class="iw-warning">Insufficient</span>` : "Available"}</td></tr>`;
        }).join("") || `<tr><td colspan="5" class="iw-empty">No items have been added.</td></tr>`}</tbody></table></div>
        <div class="iw-actions iw-footer-actions"><button data-reject>Reject</button><button data-line>Add item</button><button data-approve class="iw-primary">Approve</button></div>`;
      panel.querySelector("[data-line]").addEventListener("click", openLine);
      panel.querySelector("[data-approve]").addEventListener("click", () => changeStatus("Approved"));
      panel.querySelector("[data-reject]").addEventListener("click", () => changeStatus("Rejected"));
    };
    const changeStatus = async nextStatus => {
      if (!PAGE.transfers.editRequest) return status(root, "Approval controls are awaiting the secured edit view configuration.", true);
      try {
        const user = await currentUser();
        const body = { [FIELD.request.status]: nextStatus };
        if (nextStatus === "Approved") {
          body[FIELD.request.approvedBy] = user;
          body[FIELD.request.approvalDate] = knackDate();
        } else {
          const reason = prompt("Reason for rejection:");
          if (reason === null) return;
          body[FIELD.request.rejection] = reason;
        }
        await update(PAGE.transfers.editRequest, state.selected.id, body);
        await reload(state.selected.id);
      } catch (error) { status(root, error.message, true); }
    };
    const openLine = () => {
      const prefill = new URLSearchParams(location.search).get("sku") || "";
      const options = state.products.map(product => `<option value="${html(product.sku || product.supplierSku)}">${html(product.name)} — ${html(product.sku || product.supplierSku)}</option>`).join("");
      const dialog = modal(root, "Add transfer item", `<label>Item<select data-item><option value="">Select an item</option>${options}</select></label><label>Requested quantity<input data-qty type="number" min="0.01" step="0.01" value="1"></label>`, `<button value="cancel">Cancel</button><button type="button" data-save class="iw-primary">Add item</button>`);
      dialog.querySelector("[data-item]").value = prefill;
      dialog.querySelector("[data-save]").addEventListener("click", async () => {
        const product = findProduct(state.products, dialog.querySelector("[data-item]").value);
        const qty = numeric(dialog.querySelector("[data-qty]").value);
        if (!product || qty <= 0) return;
        const sourceName = raw(state.selected, FIELD.request.source);
        const available = balancesFor(product, state.transactions, state.locations).locations.find(row => row.name === sourceName)?.onHand || 0;
        try {
          await create(PAGE.transfers.addLine, {
            [FIELD.requestLine.code]: code("TRL"),
            [FIELD.requestLine.request]: state.selected.id,
            [FIELD.requestLine.sku]: product.sku,
            [FIELD.requestLine.supplierSku]: product.supplierSku,
            [FIELD.requestLine.name]: product.name,
            [FIELD.requestLine.requested]: qty,
            [FIELD.requestLine.available]: available,
            [FIELD.requestLine.fulfilled]: 0
          });
          dialog.close();
          await reload(state.selected.id);
        } catch (error) { status(root, error.message, true); }
      });
    };
    root.addEventListener("click", event => {
      const button = event.target.closest("[data-request-id]");
      if (!button) return;
      state.selected = state.requests.find(row => row.id === button.dataset.requestId);
      renderList();
      renderDetail();
    });
    root.querySelector("[data-refresh]").addEventListener("click", () => reload(state.selected?.id));
    root.querySelector("[data-new]").addEventListener("click", () => {
      const options = selectOptions(state.locations);
      const dialog = modal(root, "New transfer request", `<div class="iw-form-grid"><label>Source location<select data-source><option value="">Select</option>${options}</select></label><label>Destination location<select data-destination><option value="">Select</option>${options}</select></label><label>Needed by<input data-needed type="datetime-local"></label><label class="iw-span-2">Notes<textarea data-notes></textarea></label></div>`, `<button value="cancel">Cancel</button><button type="button" data-save class="iw-primary">Create request</button>`);
      dialog.querySelector("[data-save]").addEventListener("click", async () => {
        const source = dialog.querySelector("[data-source]").value;
        const destination = dialog.querySelector("[data-destination]").value;
        if (!source || !destination || source === destination) return status(root, "Choose two different locations.", true);
        try {
          const user = await currentUser();
          const created = await create(PAGE.transfers.addRequest, {
            [FIELD.request.code]: code("TR"),
            [FIELD.request.source]: source,
            [FIELD.request.destination]: destination,
            [FIELD.request.status]: "Submitted",
            [FIELD.request.needed]: knackDate(dialog.querySelector("[data-needed]").value || new Date()),
            [FIELD.request.requestedBy]: user,
            [FIELD.request.requestedDate]: knackDate(),
            [FIELD.request.notes]: dialog.querySelector("[data-notes]").value
          });
          dialog.close();
          await reload(created.record?.id || created.id);
        } catch (error) { status(root, error.message, true); }
      });
    });
    await reload();
  }

  async function mountCounts(host) {
    host.innerHTML = base("Inventory Count", "Cycle counting", `<button data-new class="iw-primary">Start new count</button>`);
    const root = host.querySelector(".iw-shell");
    root.querySelector("[data-main]").innerHTML = `<section class="iw-card" data-session><div class="iw-empty">Start a new count or resume a draft count below.</div></section><section class="iw-card"><div class="iw-section-head"><h2>Recent count sheets</h2><button data-refresh>Refresh</button></div><div class="iw-table"><table><thead><tr><th>Count</th><th>Location</th><th>Scope</th><th>Status</th><th>Started</th><th></th></tr></thead><tbody data-counts></tbody></table></div></section>`;
    const state = { counts: [], lines: [], products: [], transactions: [], locations: [], selected: null };
    const reload = async preferredId => {
      status(root, "Loading live count sheets...");
      try {
        const [countRows, lineRows, productRows, txRows, locationRows] = await Promise.all([
          records(PAGE.counts.counts), records(PAGE.counts.lines), records(PAGE.lookup.items),
          records(PAGE.lookup.transactions), records(PAGE.lookup.locations)
        ]);
        state.counts = countRows;
        state.lines = lineRows;
        state.products = productRows.map(item);
        state.transactions = txRows.map(transaction);
        state.locations = locationRows.map(mapLocation);
        state.selected = state.counts.find(row => row.id === preferredId) || null;
        renderCounts();
        renderSession();
        status(root, "");
      } catch (error) { status(root, error.message, true); }
    };
    const linesFor = countRecord => state.lines.filter(row =>
      connectionId(row, FIELD.countLine.count) === countRecord.id ||
      String(raw(row, FIELD.countLine.count)) === String(raw(countRecord, FIELD.count.code))
    );
    const renderCounts = () => {
      root.querySelector("[data-counts]").innerHTML = state.counts.slice().reverse().map(row => `<tr><td>${html(raw(row, FIELD.count.code))}</td><td>${html(raw(row, FIELD.count.location))}</td><td>${html(raw(row, FIELD.count.scope))}</td><td><span class="iw-pill">${html(raw(row, FIELD.count.status) || "Draft")}</span></td><td>${html(dateText(raw(row, FIELD.count.startedDate)))}</td><td><button data-open-count="${row.id}">Open</button></td></tr>`).join("") || `<tr><td colspan="6" class="iw-empty">No inventory counts yet.</td></tr>`;
    };
    const renderSession = () => {
      const panel = root.querySelector("[data-session]");
      const countRecord = state.selected;
      if (!countRecord) { panel.innerHTML = `<div class="iw-empty">Start a new count or resume a draft count below.</div>`; return; }
      const blind = String(raw(countRecord, FIELD.count.blind)).toLowerCase() !== "false";
      const lines = linesFor(countRecord);
      panel.innerHTML = `<div class="iw-section-head"><div><p class="iw-eyebrow">${html(raw(countRecord, FIELD.count.code))}</p><h2>${html(raw(countRecord, FIELD.count.location))}</h2></div><span class="iw-pill">${html(raw(countRecord, FIELD.count.status) || "Draft")}</span></div>
        <div class="iw-lookup"><label>Scan or search product<div class="iw-input-row"><input data-scan placeholder="Supplier SKU, OR SKU, barcode, or item name"><button data-add class="iw-primary">Add line</button></div></label></div>
        <p class="iw-note">${blind ? "Blind count is on: system quantity is hidden while counting." : "System quantity is visible for this count."}</p>
        <div class="iw-table"><table><thead><tr><th>Item</th><th>OR SKU</th><th class="iw-num">Counted</th>${blind ? "" : `<th class="iw-num">System</th><th class="iw-num">Variance</th>`}</tr></thead><tbody>${lines.map(line => `<tr><td>${html(raw(line, FIELD.countLine.name))}</td><td>${html(raw(line, FIELD.countLine.sku))}</td><td class="iw-num">${number.format(numeric(raw(line, FIELD.countLine.counted)))}</td>${blind ? "" : `<td class="iw-num">${number.format(numeric(raw(line, FIELD.countLine.system)))}</td><td class="iw-num">${number.format(numeric(raw(line, FIELD.countLine.variance)))}</td>`}</tr>`).join("") || `<tr><td colspan="${blind ? 3 : 5}" class="iw-empty">Scan the first item.</td></tr>`}</tbody></table></div>
        <div class="iw-actions iw-footer-actions"><button data-next>Add Line & Scan Next</button><button data-submit class="iw-primary">Submit for Approval</button></div>`;
      const openLine = () => {
        const product = findProduct(state.products, panel.querySelector("[data-scan]").value);
        if (!product) return status(root, "No live Price List item matched that scan.", true);
        const dialog = modal(root, product.name, `<p class="iw-muted">${html(product.sku || product.supplierSku)}</p><label>Counted quantity<input data-qty type="number" min="0" step="0.01" value="1"></label>`, `<button value="cancel">Cancel</button><button type="button" data-save class="iw-primary">Save line</button>`);
        dialog.querySelector("[data-save]").addEventListener("click", async () => {
          const qty = numeric(dialog.querySelector("[data-qty]").value);
          const locationName = raw(countRecord, FIELD.count.location);
          const system = balancesFor(product, state.transactions, state.locations).locations.find(row => row.name === locationName)?.onHand || 0;
          try {
            await create(PAGE.counts.addLine, {
              [FIELD.countLine.code]: code("CL"),
              [FIELD.countLine.count]: countRecord.id,
              [FIELD.countLine.sku]: product.sku,
              [FIELD.countLine.supplierSku]: product.supplierSku,
              [FIELD.countLine.name]: product.name,
              [FIELD.countLine.counted]: qty,
              [FIELD.countLine.system]: system,
              [FIELD.countLine.variance]: qty - system,
              [FIELD.countLine.scannedAt]: knackDate()
            });
            dialog.close();
            await reload(countRecord.id);
            root.querySelector("[data-scan]")?.focus();
          } catch (error) { status(root, error.message, true); }
        });
      };
      panel.querySelector("[data-add]").addEventListener("click", openLine);
      panel.querySelector("[data-next]").addEventListener("click", () => panel.querySelector("[data-scan]").focus());
      panel.querySelector("[data-scan]").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); openLine(); } });
      panel.querySelector("[data-submit]").addEventListener("click", async () => {
        if (!lines.length) return status(root, "Add at least one count line before submitting.", true);
        if (!PAGE.counts.editCount) return status(root, "Submission is awaiting the secured edit view configuration.", true);
        try {
          const user = await currentUser();
          await update(PAGE.counts.editCount, countRecord.id, {
            [FIELD.count.status]: "Submitted",
            [FIELD.count.submittedBy]: user,
            [FIELD.count.submittedDate]: knackDate()
          });
          await reload(countRecord.id);
        } catch (error) { status(root, error.message, true); }
      });
    };
    root.addEventListener("click", event => {
      const button = event.target.closest("[data-open-count]");
      if (!button) return;
      state.selected = state.counts.find(row => row.id === button.dataset.openCount);
      renderSession();
    });
    root.querySelector("[data-refresh]").addEventListener("click", () => reload(state.selected?.id));
    root.querySelector("[data-new]").addEventListener("click", () => {
      const dialog = modal(root, "Start inventory count", `<div class="iw-form-grid"><label>Location<select data-location><option value="">Select</option>${selectOptions(state.locations)}</select></label><label>Scope<select data-scope><option>All Items</option><option>Category</option><option>Selected Items</option></select></label><label class="iw-span-2">Scope details<input data-details placeholder="Optional category or item notes"></label><label class="iw-check"><input data-blind type="checkbox" checked> Blind count</label></div>`, `<button value="cancel">Cancel</button><button type="button" data-save class="iw-primary">Start count</button>`);
      dialog.querySelector("[data-save]").addEventListener("click", async () => {
        const locationId = dialog.querySelector("[data-location]").value;
        if (!locationId) return;
        try {
          const user = await currentUser();
          const created = await create(PAGE.counts.addCount, {
            [FIELD.count.code]: code("COUNT"),
            [FIELD.count.location]: locationId,
            [FIELD.count.scope]: dialog.querySelector("[data-scope]").value,
            [FIELD.count.details]: dialog.querySelector("[data-details]").value,
            [FIELD.count.status]: "Draft",
            [FIELD.count.blind]: dialog.querySelector("[data-blind]").checked,
            [FIELD.count.startedBy]: user,
            [FIELD.count.startedDate]: knackDate()
          });
          dialog.close();
          await reload(created.record?.id || created.id);
        } catch (error) { status(root, error.message, true); }
      });
    });
    await reload();
  }

  async function mountLabels(host) {
    host.innerHTML = base("Print Labels", "Inventory labeling");
    const root = host.querySelector(".iw-shell");
    root.querySelector("[data-main]").innerHTML = `<div class="iw-label-layout"><section class="iw-card"><h2>Find items</h2><label>Source<select data-source><option value="Price List">Price List</option><option value="Receiving Transaction">Receiving Transactions</option></select></label><label>Scan or search<div class="iw-input-row"><input data-search placeholder="Supplier SKU, OR SKU, barcode, or item name"><button data-add class="iw-primary">Add</button></div></label><div data-results class="iw-list"></div></section><section class="iw-card"><div class="iw-section-head"><h2>Print queue</h2><button data-clear>Clear</button></div><div data-queue></div><div class="iw-form-grid iw-label-settings"><label>Label size<select data-size><option>2 × 1 inch</option><option>3 × 2 inch</option><option>4 × 2 inch</option></select></label><label>Printer<input data-printer value="Zebra — PAL"></label></div><div class="iw-label-preview" data-preview><span>Barcode preview</span></div><button data-print class="iw-primary iw-print-button">Print labels</button></section></div><p class="iw-note">Every print and reprint is logged. The browser print dialog sends the job to the selected installed printer.</p>`;
    status(root, "Loading live label sources...");
    try {
      const [itemRows, txRows] = await Promise.all([records(PAGE.labels.items), records(PAGE.labels.transactions)]);
      const state = { products: itemRows.map(item), transactions: txRows.map(transaction), queue: [] };
      const renderQueue = () => {
        const queue = root.querySelector("[data-queue]");
        queue.innerHTML = state.queue.map((entry, index) => `<div class="iw-queue-row"><div><strong>${html(entry.product.name)}</strong><span>${html(entry.product.sku || entry.product.supplierSku)}</span></div><label>Qty<input data-qty-index="${index}" type="number" min="1" value="${entry.quantity}"></label><button data-remove="${index}" aria-label="Remove">×</button></div>`).join("") || `<p class="iw-empty">Scan an item to build the print queue.</p>`;
        root.querySelector("[data-preview]").innerHTML = state.queue[0] ? `<strong>${html(state.queue[0].product.name)}</strong><span>${html(state.queue[0].product.sku || state.queue[0].product.supplierSku)}</span><div class="iw-bars"></div><b>${html(state.queue[0].product.barcode || state.queue[0].product.supplierSku)}</b>` : `<span>Barcode preview</span>`;
      };
      const addProduct = product => {
        if (!product) return status(root, "No live Price List item matched that search.", true);
        const existing = state.queue.find(entry => entry.product.id === product.id);
        if (existing) existing.quantity += 1; else state.queue.push({ product, quantity: 1, reprint: false });
        renderQueue();
        root.querySelector("[data-search]").value = "";
        status(root, "");
      };
      const search = () => {
        const query = root.querySelector("[data-search]").value;
        if (root.querySelector("[data-source]").value === "Receiving Transaction") {
          const tx = state.transactions.find(row => String(row.reference).toLowerCase() === query.toLowerCase() || row.itemCode.toLowerCase() === query.toLowerCase());
          return addProduct(tx && findProduct(state.products, tx.sku || tx.itemCode));
        }
        addProduct(findProduct(state.products, query));
      };
      root.querySelector("[data-add]").addEventListener("click", search);
      root.querySelector("[data-search]").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); search(); } });
      root.querySelector("[data-clear]").addEventListener("click", () => { state.queue = []; renderQueue(); });
      root.querySelector("[data-queue]").addEventListener("input", event => {
        if (event.target.dataset.qtyIndex != null) state.queue[Number(event.target.dataset.qtyIndex)].quantity = Math.max(1, numeric(event.target.value));
      });
      root.querySelector("[data-queue]").addEventListener("click", event => {
        const button = event.target.closest("[data-remove]");
        if (!button) return;
        state.queue.splice(Number(button.dataset.remove), 1);
        renderQueue();
      });
      root.querySelector("[data-print]").addEventListener("click", async () => {
        if (!state.queue.length) return status(root, "Add at least one item to the print queue.", true);
        const user = await currentUser();
        const size = root.querySelector("[data-size]").value;
        const printer = root.querySelector("[data-printer]").value;
        try {
          for (const entry of state.queue) {
            await create(PAGE.labels.addLog, {
              [FIELD.label.code]: code("PRINT"),
              [FIELD.label.sourceType]: root.querySelector("[data-source]").value,
              [FIELD.label.source]: entry.product.sku || entry.product.supplierSku,
              [FIELD.label.sku]: entry.product.sku,
              [FIELD.label.supplierSku]: entry.product.supplierSku,
              [FIELD.label.name]: entry.product.name,
              [FIELD.label.quantity]: entry.quantity,
              [FIELD.label.size]: size,
              [FIELD.label.printer]: printer,
              [FIELD.label.printedBy]: user,
              [FIELD.label.printedAt]: knackDate(),
              [FIELD.label.reprint]: entry.reprint
            });
          }
          document.body.classList.add("iw-printing");
          window.print();
          setTimeout(() => document.body.classList.remove("iw-printing"), 0);
          state.queue.forEach(entry => { entry.reprint = true; });
          status(root, "Print job opened and logged successfully.");
        } catch (error) { status(root, error.message, true); }
      });
      renderQueue();
      status(root, "");
    } catch (error) { status(root, error.message || "Unable to load label sources.", true); }
  }

  function mount(name) {
    const config = PAGE[name];
    if (!document.getElementById(config.scene)) return;
    const host = document.getElementById(config.host);
    if (!host || host.querySelector(".iw-shell")) return;
    ({ lookup: mountLookup, transfers: mountTransfers, counts: mountCounts, labels: mountLabels })[name](host);
  }
  function register() {
    Object.entries(PAGE).forEach(([name, config]) => {
      globalThis.Knack?.on?.(`page:render:${config.scene}`, () => mount(name));
      globalThis.Knack?.on?.(`view:render:${config.host}`, () => mount(name));
      mount(name);
    });
  }
  const hidden = Object.values(PAGE).flatMap(config => config.hidden).map(key => `#${key}`).join(",");
  const style = document.createElement("style");
  style.textContent = `${hidden}{display:none!important}`;
  document.head.appendChild(style);
  if (globalThis.Knack?.ready) globalThis.Knack.ready().then(register);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", register, { once: true });
  else register();
})();
