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
      prices: { scene: "scene_463", view: "view_1003" },
      transactions: { scene: "scene_484", view: "view_1040" },
      hidden: ["view_1037", "view_1038", "view_1039", "view_1040"]
    },
    scanner: {
      scene: "scene_488", host: "view_1049",
      addTransaction: { scene: "scene_470", view: "view_1012" },
      hidden: []
    }
  };
  const FIELD = {
    item: {
      name: "field_721", supplierSku: "field_724", sku: "field_725",
      category: "field_727", unit: "field_728", cost: "field_730",
      price: "field_731",
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
    const knack = globalThis.Knack;
    if (globalThis.__inventoryUserToken) return globalThis.__inventoryUserToken;
    if (globalThis.__inventoryUserPromise) {
      const user = await Promise.race([
        globalThis.__inventoryUserPromise,
        new Promise(resolve => setTimeout(() => resolve(null), 5000))
      ]);
      const userToken = user?.token || user?.user_token || user?.session?.token;
      if (userToken) return userToken;
    }
    if (knack?.getUserToken) {
      const classicToken = await Promise.race([
        knack.getUserToken(),
        new Promise(resolve => setTimeout(() => resolve(""), 2000))
      ]);
      if (classicToken) return classicToken;
    }
    if (knack?.getUser) {
      const user = await Promise.race([
        knack.getUser(),
        new Promise(resolve => setTimeout(() => resolve(null), 5000))
      ]);
      return user?.token || user?.user_token || user?.session?.token || "";
    }
    return "";
  }
  async function currentUser() {
    try {
      const user = globalThis.__inventoryUser || await Promise.race([
        globalThis.Knack?.getUser?.(),
        new Promise(resolve => setTimeout(() => resolve(null), 3000))
      ]);
      return user?.name || user?.email || user?.values?.name || user?.values?.email || "Current user";
    } catch {
      return "Current user";
    }
  }
  async function currentUserRecord() {
    try {
      let merged = globalThis.__inventoryUser || null;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const fresh = await Promise.race([
          globalThis.Knack?.getUser?.(),
          new Promise(resolve => setTimeout(() => resolve(null), 2500))
        ]);
        if (fresh) {
          const previous = merged;
          merged = { ...(previous || {}), ...fresh };
          for (const key of ["roles", "role_names", "profile_keys", "profile_keys_raw", "values"]) {
            const freshValue = fresh?.[key];
            const missing = freshValue == null || (Array.isArray(freshValue) && freshValue.length === 0);
            if (missing && previous?.[key] != null) merged[key] = previous[key];
          }
          globalThis.__inventoryUser = merged;
          if (roleNames(merged).length) return merged;
        }
        if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 450));
      }
      return merged;
    } catch {
      return globalThis.__inventoryUser || null;
    }
  }
  function roleNames(user) {
    const profileLabels = {
      profile_16: "General Manager - Admin", profile_13: "Sales", profile_7: "Inventorist",
      profile_5: "Designer", profile_20: "Dev", profile_6: "Deliverer", profile_4: "Branch Manager"
    };
    const sources = [
      user?.roles, user?.role_names, user?.profile_keys_raw, user?.profile_keys,
      user?.values?.roles, user?.values?.user_roles, user?.values?.profile_keys_raw, user?.values?.profile_keys
    ];
    const values = sources.flatMap(value => value == null ? [] : (Array.isArray(value) ? value : [value]));
    return values
      .map(role => role?.name || role?.identifier || role?.label || profileLabels[role?.id || role] || role)
      .filter(Boolean)
      .map(String);
  }
  function accessFor(user) {
    const roles = roleNames(user);
    const matchesRole = pattern => roles.some(role => pattern.test(role));
    const isDev = matchesRole(/\bdev\b/i);
    const isManager = matchesRole(/general manager|branch manager|\bmanager\b|admin/i);
    const isInventorist = matchesRole(/inventorist|inventory/i);
    return {
      roles,
      canApproveTransfers: isManager || isDev,
      canFulfillTransfers: isManager || isInventorist || isDev
    };
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
    const sellingPrice = raw(record, FIELD.item.price);
    return {
      id: record.id,
      name: raw(record, FIELD.item.name) || "Unnamed item",
      sku: String(raw(record, FIELD.item.sku) || "").trim(),
      supplierSku: String(raw(record, FIELD.item.supplierSku) || "").trim(),
      barcode: String(raw(record, FIELD.item.barcode) || raw(record, FIELD.item.supplierSku) || "").trim(),
      category: raw(record, FIELD.item.category),
      unit: raw(record, FIELD.item.unit),
      cost: numeric(raw(record, FIELD.item.cost)),
      price: sellingPrice === undefined || sellingPrice === null || sellingPrice === "" ? null : numeric(sellingPrice),
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
  function base(title, eyebrow, actions = "", screen = "") {
    const refresh = `<button type="button" class="iw-refresh-button" data-refresh-page aria-label="Refresh live data" title="Refresh live data"><span aria-hidden="true">↻</span></button>`;
    return `<div class="iw-shell ${screen ? `iw-screen-${screen}` : ""}"><header class="iw-topbar"><div><p class="iw-eyebrow">${eyebrow}</p><h1>${title}</h1><p class="iw-subtitle" data-subtitle></p></div><div class="iw-topbar-actions">${actions}${refresh}</div></header><div class="iw-status" data-status hidden></div><main data-main></main><dialog class="iw-dialog"></dialog></div>`;
  }
  function wireRefresh(root, refresh) {
    const button = root.querySelector("[data-refresh-page]");
    button?.addEventListener("click", async () => {
      button.disabled = true;
      button.classList.add("is-refreshing");
      try { await refresh(); }
      finally {
        button.disabled = false;
        button.classList.remove("is-refreshing");
      }
    });
  }

  async function mountLookup(host) {
    host.innerHTML = base("Inventory Lookup", "LOOKUP UI", "", "lookup");
    const root = host.querySelector(".iw-shell");
    wireRefresh(root, () => mountLookup(host));
    root.querySelector("[data-main]").innerHTML = `
      <section class="iw-field-stack"><label>Location<select data-location><option value="">All Locations</option></select></label><label>Scan or search product<div class="iw-scan-control"><input data-search autocomplete="off" placeholder="Scan item code"><button data-find type="button"><span aria-hidden="true">▤</span> Scan</button></div></label></section>
      <section data-result hidden>
        <article class="iw-compact-product"><strong data-name></strong><span data-identity></span></article>
        <p class="iw-section-label">On hand by location</p>
        <section class="iw-compact-panel"><div data-balances class="iw-balance-list"></div><div class="iw-balance-total"><span>Total on hand</span><strong data-total>0</strong></div><div class="iw-balance-value"><span>Value at cost</span><strong data-value>$0.00</strong></div></section>
        <p class="iw-section-label">Last movement</p>
        <section class="iw-movement-card" data-last>No movements</section>
        <button data-transaction-menu class="iw-primary iw-full-button">New Transaction</button>
        <p class="iw-note">Read-only — no ledger row is written from this screen.</p>
      </section>`;
    status(root, "Loading live inventory...");
    try {
      const [itemRows, txRows, locationRows] = await Promise.all([
        records(PAGE.lookup.items), records(PAGE.lookup.transactions), records(PAGE.lookup.locations)
      ]);
      const state = { products: itemRows.map(item), transactions: txRows.map(transaction), locations: locationRows.map(mapLocation), selected: null };
      const locationSelect = root.querySelector("[data-location]");
      locationSelect.insertAdjacentHTML("beforeend", selectOptions(state.locations, "name", "name"));
      const userName = await currentUser();
      root.querySelector("[data-subtitle]").textContent = `${userName} · ${state.locations[0]?.name || "All Locations"}`;
      const render = product => {
        if (!product) return status(root, "No live Price List item matched that search.", true);
        state.selected = product;
        const calculated = balancesFor(product, state.transactions, state.locations);
        const selectedLocation = locationSelect.value;
        const locationBalances = selectedLocation ? calculated.locations.filter(row => row.name === selectedLocation) : calculated.locations;
        const total = locationBalances.reduce((sum, row) => sum + row.onHand, 0);
        const movements = selectedLocation ? calculated.rows.filter(tx => tx.source === selectedLocation || tx.destination === selectedLocation) : calculated.rows;
        root.querySelector("[data-name]").textContent = product.name;
        root.querySelector("[data-identity]").textContent = `SKU ${product.sku || product.supplierSku || "-"} · ${product.unit || "Unit"} · ${money.format(product.cost)} / unit`;
        root.querySelector("[data-total]").textContent = number.format(total);
        root.querySelector("[data-value]").textContent = money.format(total * product.cost);
        const last = movements[movements.length - 1];
        root.querySelector("[data-last]").innerHTML = last
          ? `<strong>${html(last.reference || last.code || last.type)}</strong><span>${html(last.type)} · ${html(last.source || "-")} → ${html(last.destination || "-")}</span><small>${html(dateText(last.date))}${last.user ? ` · ${html(last.user)}` : ""}</small>`
          : `<span>No movements</span>`;
        root.querySelector("[data-balances]").innerHTML = locationBalances.map(row => `<div><span>${html(row.name)}</span><strong>${number.format(row.onHand)}</strong></div>`).join("") || `<p class="iw-empty">No active locations.</p>`;
        root.querySelector("[data-result]").hidden = false;
        status(root, "");
      };
      const find = () => render(findProduct(state.products, root.querySelector("[data-search]").value));
      root.querySelector("[data-find]").addEventListener("click", find);
      root.querySelector("[data-search]").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); find(); } });
      locationSelect.addEventListener("change", () => state.selected && render(state.selected));
      root.querySelector("[data-transaction-menu]").addEventListener("click", () => {
        const sku = state.selected?.sku || state.selected?.supplierSku || "";
        const dialog = modal(root, "New Transaction", `<div class="iw-transaction-menu">
          <button type="button" data-transaction="receive"><strong>Receive Stock</strong><span>Add inventory received at a location</span></button>
          <button type="button" data-transaction="transfer"><strong>Transfer Out</strong><span>Move inventory between locations</span></button>
          <button type="button" data-transaction="usage"><strong>Record Usage</strong><span>Deduct inventory used on an order</span></button>
          <button type="button" data-transaction="damage"><strong>Report Damage</strong><span>Write off damaged inventory</span></button>
          <button type="button" data-transaction="adjust"><strong>Adjust Inventory</strong><span>Correct the recorded quantity</span></button>
        </div>`, `<button value="cancel">Close</button>`);
        dialog.querySelectorAll("[data-transaction]").forEach(button => {
          button.addEventListener("click", () => {
            location.href = `/jong/ft-dev/scanner-menu?screen=${encodeURIComponent(button.dataset.transaction)}&sku=${encodeURIComponent(sku)}&location=${encodeURIComponent(locationSelect.value)}`;
          });
        });
      });
      const initial = new URLSearchParams(location.search).get("sku");
      if (initial) render(findProduct(state.products, initial));
      else {
        status(root, "");
        root.querySelector("[data-search]").focus();
      }
    } catch (error) {
      status(root, error.message || "Unable to load inventory.", true);
    }
  }

  async function mountTransfers(host) {
    host.innerHTML = base("Transfer Requests", "TRANSFER REQUEST UI", "", "transfers");
    const root = host.querySelector(".iw-shell");
    wireRefresh(root, () => reload(state.selected?.id));
    root.querySelector("[data-main]").innerHTML = `<p class="iw-section-label">Open requests</p><div data-request-list class="iw-request-list"></div><section data-detail><div class="iw-empty">Select a transfer request.</div></section><button data-new class="iw-primary iw-full-button">+ New Request</button>`;
    const state = {
      requests: [], lines: [], products: [], transactions: [], locations: [], selected: null,
      user: null, access: { roles: [], canApproveTransfers: false, canFulfillTransfers: false }
    };
    const reload = async preferredId => {
      status(root, "Loading live transfer requests...");
      try {
        const [requestsRows, lineRows, productRows, txRows, locationRows, userRecord] = await Promise.all([
          records(PAGE.transfers.requests), records(PAGE.transfers.lines), records(PAGE.lookup.items),
          records(PAGE.lookup.transactions), records(PAGE.lookup.locations), currentUserRecord()
        ]);
        state.requests = requestsRows;
        state.lines = lineRows;
        state.products = productRows.map(item);
        state.transactions = txRows.map(transaction);
        state.locations = locationRows.map(mapLocation);
        state.user = userRecord;
        state.access = accessFor(userRecord);
        state.selected = state.requests.find(row => row.id === preferredId) || state.requests[0] || null;
        const userName = await currentUser();
        const roleLabel = state.access.canApproveTransfers ? "Approver" : state.access.canFulfillTransfers ? "Warehouse" : "Requester";
        root.querySelector("[data-subtitle]").textContent = `${userName} · ${state.locations[0]?.name || "Inventory"} · ${roleLabel}`;
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
        const lines = requestLines(row);
        const needed = raw(row, FIELD.request.needed);
        return `<button class="iw-request-item${selected}" data-request-id="${row.id}"><strong>${html(raw(row, FIELD.request.code))} · ${html(raw(row, FIELD.request.source))} → ${html(raw(row, FIELD.request.destination))}</strong><span>${lines.length} ${lines.length === 1 ? "line" : "lines"}${needed ? ` · needed ${html(dateText(needed))}` : ""}</span><em class="iw-pill">${html(raw(row, FIELD.request.status) || "Draft")}</em></button>`;
      }).join("") || `<p class="iw-empty">No transfer requests yet.</p>`;
    };
    const renderDetail = () => {
      const panel = root.querySelector("[data-detail]");
      const row = state.selected;
      if (!row) { panel.innerHTML = `<div class="iw-empty">Create the first transfer request.</div>`; return; }
      const lines = requestLines(row);
      const requestStatus = String(raw(row, FIELD.request.status) || "Submitted");
      const isSubmitted = requestStatus.toLowerCase() === "submitted";
      const isApproved = requestStatus.toLowerCase() === "approved";
      const shortage = lines.some(line => numeric(raw(line, FIELD.requestLine.available)) < numeric(raw(line, FIELD.requestLine.requested)));
      const decisionActions = isSubmitted && state.access.canApproveTransfers
        ? `<div class="iw-actions iw-decision-actions"><button data-reject>Decline</button><button data-approve class="iw-success-button">Approve</button></div>`
        : "";
      const fulfillAction = isApproved && state.access.canFulfillTransfers
        ? `<button data-fulfill class="iw-success-button iw-full-button">Process Approved Transfer</button>`
        : "";
      const addLineAction = isSubmitted
        ? `<button data-line class="iw-secondary-full">Add Item</button>`
        : "";
      const workflowMessage = requestStatus === "Fulfilled"
        ? "This request has been processed and posted to the inventory ledger."
        : requestStatus === "Rejected"
          ? `Declined${raw(row, FIELD.request.rejection) ? ` — ${html(raw(row, FIELD.request.rejection))}` : "."}`
          : isApproved
            ? "Approved and ready for warehouse processing."
            : !state.access.canApproveTransfers
              ? "Awaiting approval by a manager."
              : "Review the items and current source availability before approving.";
      panel.innerHTML = `<p class="iw-section-label">${html(raw(row, FIELD.request.code))} — lines</p>
        <div class="iw-request-lines">${lines.map(line => {
          const requested = numeric(raw(line, FIELD.requestLine.requested));
          const available = numeric(raw(line, FIELD.requestLine.available));
          const codeValue = raw(line, FIELD.requestLine.sku) || raw(line, FIELD.requestLine.supplierSku) || "-";
          return `<div class="iw-request-line"><span><strong>${html(raw(line, FIELD.requestLine.name))}</strong><small>Item code ${html(codeValue)} · avail ${number.format(available)}</small></span><b aria-label="Quantity requested">${number.format(requested)}</b></div>`;
        }).join("") || `<p class="iw-empty">No items have been added.</p>`}</div>
        <div class="iw-request-alert" ${shortage ? "" : "hidden"}>One or more requested quantities exceed the saved source-availability snapshot. Live stock is checked again before approval and processing.</div>
        <p class="iw-workflow-message">${workflowMessage}</p>
        ${decisionActions}${fulfillAction}${addLineAction}`;
      panel.querySelector("[data-line]")?.addEventListener("click", openLine);
      panel.querySelector("[data-approve]")?.addEventListener("click", () => changeStatus("Approved"));
      panel.querySelector("[data-reject]")?.addEventListener("click", () => changeStatus("Rejected"));
      panel.querySelector("[data-fulfill]")?.addEventListener("click", fulfillRequest);
    };
    const liveAvailability = lines => {
      const sourceName = raw(state.selected, FIELD.request.source);
      const requestedByProduct = new Map();
      for (const line of lines) {
        const product = findProduct(state.products, raw(line, FIELD.requestLine.sku) || raw(line, FIELD.requestLine.supplierSku));
        if (!product) throw new Error(`The item on line ${raw(line, FIELD.requestLine.code) || line.id} is no longer available in the Price List.`);
        const key = product.sku || product.supplierSku || product.id;
        const entry = requestedByProduct.get(key) || { product, requested: 0 };
        entry.requested += numeric(raw(line, FIELD.requestLine.requested));
        requestedByProduct.set(key, entry);
      }
      for (const entry of requestedByProduct.values()) {
        const available = balancesFor(entry.product, state.transactions, state.locations).locations
          .find(locationRow => locationRow.name === sourceName)?.onHand || 0;
        if (entry.requested > available) {
          throw new Error(`${entry.product.name} requests ${number.format(entry.requested)}, but only ${number.format(available)} is currently available at ${sourceName}.`);
        }
      }
    };
    const changeStatus = async nextStatus => {
      if (!PAGE.transfers.editRequest) return status(root, "Approval controls are awaiting the secured edit view configuration.", true);
      try {
        const currentStatus = String(raw(state.selected, FIELD.request.status) || "Submitted");
        if (currentStatus !== "Submitted") throw new Error(`Only submitted requests can be ${nextStatus === "Approved" ? "approved" : "declined"}.`);
        if (!state.access.canApproveTransfers) throw new Error("Only a Manager or Administrator can approve or decline transfer requests.");
        const lines = requestLines(state.selected);
        if (nextStatus === "Approved") {
          if (!lines.length) throw new Error("Add at least one item before approving this request.");
          liveAvailability(lines);
        }
        const user = await currentUser();
        const body = { [FIELD.request.status]: nextStatus };
        if (nextStatus === "Approved") {
          body[FIELD.request.approvedBy] = user;
          body[FIELD.request.approvalDate] = knackDate();
        } else {
          const reason = prompt("Reason for declining this request:");
          if (reason === null) return;
          if (!reason.trim()) throw new Error("A decline reason is required.");
          body[FIELD.request.rejection] = reason.trim();
        }
        await update(PAGE.transfers.editRequest, state.selected.id, body);
        await reload(state.selected.id);
      } catch (error) { status(root, error.message, true); }
    };
    async function fulfillRequest() {
      const button = root.querySelector("[data-fulfill]");
      try {
        if (!state.access.canFulfillTransfers) throw new Error("Only authorized warehouse or manager users can process approved transfers.");
        if (String(raw(state.selected, FIELD.request.status)) !== "Approved") throw new Error("This request must be approved before it can be processed.");
        const lines = requestLines(state.selected);
        if (!lines.length) throw new Error("This approved request has no items to process.");
        liveAvailability(lines);
        const requestCode = String(raw(state.selected, FIELD.request.code) || "");
        const sourceId = connectionId(state.selected, FIELD.request.source);
        const destinationId = connectionId(state.selected, FIELD.request.destination);
        if (!sourceId || !destinationId || sourceId === destinationId) throw new Error("This request does not have two valid transfer locations.");
        button.disabled = true;
        status(root, "Processing approved transfer...");
        const userName = await currentUser();
        const groupedLines = new Map();
        for (const line of lines) {
          const lineSku = String(raw(line, FIELD.requestLine.sku) || raw(line, FIELD.requestLine.supplierSku) || "").trim();
          const product = findProduct(state.products, lineSku);
          const key = product.sku || product.supplierSku || product.id;
          const group = groupedLines.get(key) || { product, quantity: 0 };
          group.quantity += numeric(raw(line, FIELD.requestLine.requested));
          groupedLines.set(key, group);
        }
        for (const { product, quantity } of groupedLines.values()) {
          const alreadyPosted = state.transactions.some(tx =>
            String(tx.reference || "") === requestCode &&
            String(tx.type || "").toLowerCase().includes("transfer") &&
            matches(tx, product)
          );
          if (alreadyPosted) continue;
          const transactionCode = code("TRF");
          const body = {
            [FIELD.transaction.code]: transactionCode,
            [FIELD.transaction.number]: Number(String(Date.now()).slice(-9)),
            [FIELD.transaction.itemCode]: product.barcode || product.supplierSku || product.sku,
            [FIELD.transaction.source]: sourceId,
            [FIELD.transaction.destination]: destinationId,
            [FIELD.transaction.type]: "Inventory Transfer",
            [FIELD.transaction.quantity]: quantity,
            [FIELD.transaction.cost]: product.cost,
            [FIELD.transaction.date]: knackDate(),
            [FIELD.transaction.reference]: requestCode,
            [FIELD.transaction.sku]: product.sku,
            [FIELD.transaction.notes]: `Approved transfer request ${requestCode}; processed by ${userName}`
          };
          if (state.user?.id) body[FIELD.transaction.user] = state.user.id;
          await create(PAGE.scanner.addTransaction, body);
          state.transactions.push(transaction({ id: transactionCode, ...body }));
        }
        await update(PAGE.transfers.editRequest, state.selected.id, {
          [FIELD.request.status]: "Fulfilled",
          [FIELD.request.fulfilledDate]: knackDate()
        });
        await reload(state.selected.id);
        status(root, `${requestCode} was processed and posted to the inventory ledger.`);
      } catch (error) {
        status(root, error.message || "Unable to process this transfer request.", true);
      } finally {
        if (button?.isConnected) button.disabled = false;
      }
    }
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
    root.querySelector("[data-refresh]")?.addEventListener("click", () => reload(state.selected?.id));
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
    host.innerHTML = base("Inventory Count", "COUNT UI", "", "counts");
    const root = host.querySelector(".iw-shell");
    wireRefresh(root, () => mountCounts(host));
    root.querySelector("[data-main]").innerHTML = `<section data-session><div class="iw-empty">Start a new count to begin scanning.</div></section><button data-new class="iw-primary iw-full-button">Start New Count</button>`;
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
        state.selected = state.counts.find(row => row.id === preferredId) ||
          state.counts.find(row => /draft|progress/i.test(String(raw(row, FIELD.count.status)))) ||
          null;
        const selectedLocation = state.selected ? raw(state.selected, FIELD.count.location) : state.locations[0]?.name;
        root.querySelector("[data-subtitle]").textContent = `${raw(state.selected, FIELD.count.code) || "New count"} · ${selectedLocation || "Inventory"} · ${raw(state.selected, FIELD.count.status) || "Ready"}`;
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
      const target = root.querySelector("[data-counts]");
      if (target) target.innerHTML = state.counts.slice().reverse().map(row => `<tr><td>${html(raw(row, FIELD.count.code))}</td><td>${html(raw(row, FIELD.count.location))}</td><td>${html(raw(row, FIELD.count.scope))}</td><td><span class="iw-pill">${html(raw(row, FIELD.count.status) || "Draft")}</span></td><td>${html(dateText(raw(row, FIELD.count.startedDate)))}</td><td><button data-open-count="${row.id}">Open</button></td></tr>`).join("");
    };
    const renderSession = () => {
      const panel = root.querySelector("[data-session]");
      const countRecord = state.selected;
      const countStatus = String(raw(countRecord, FIELD.count.status) || "");
      const editable = /draft|progress|started/i.test(countStatus);
      root.querySelector("[data-new]").hidden = Boolean(countRecord && editable);
      if (!countRecord) { panel.innerHTML = `<div class="iw-empty">Start a new count to begin scanning.</div>`; return; }
      const blind = String(raw(countRecord, FIELD.count.blind)).toLowerCase() !== "false";
      const lines = linesFor(countRecord);
      const lastLine = lines[lines.length - 1];
      const scanControls = editable ? `<label>Scan product<div class="iw-scan-control"><input data-scan placeholder="Scan item code"><button data-add><span aria-hidden="true">▤</span> Scan</button></div></label>` : "";
      const latestCount = editable ? `<article class="iw-compact-product"><strong>${html(lastLine ? raw(lastLine, FIELD.countLine.name) : "Scan a product to count")}</strong><span>${lastLine ? `Item code ${html(raw(lastLine, FIELD.countLine.sku) || raw(lastLine, FIELD.countLine.supplierSku) || "-")}` : "The item will load here"}</span></article>
        <p class="iw-section-label">Counted qty</p><div class="iw-counted-control"><span>${lastLine ? number.format(numeric(raw(lastLine, FIELD.countLine.counted))) : "0"}</span><b>− &nbsp; +</b></div>` : `<p class="iw-workflow-message">This ${html(countStatus.toLowerCase() || "closed")} count is read-only. Start a new count to record additional quantities.</p>`;
      const editActions = editable ? `<button data-next class="iw-success-button iw-full-button">Add Line & Scan Next</button><button data-submit class="iw-primary iw-full-button">Submit for Approval</button>` : "";
      panel.innerHTML = `<div class="iw-field-stack"><label>Location<div class="iw-select-display">${html(raw(countRecord, FIELD.count.location))}</div></label><label>Scope<div class="iw-select-display">${html(raw(countRecord, FIELD.count.scope) || "All Items")}</div></label>${scanControls}</div>
        ${latestCount}
        <p class="iw-note">${blind ? "Blind count is on — system quantity is hidden from the counter." : "System quantity is visible for this count."}</p>
        <p class="iw-section-label">Count sheet (${lines.length} lines)</p>
        <div class="iw-count-lines">${lines.slice(-8).map(line => `<div><span><strong>${html(raw(line, FIELD.countLine.name))}</strong><small>Item code ${html(raw(line, FIELD.countLine.sku) || raw(line, FIELD.countLine.supplierSku) || "-")}</small></span><b>${number.format(numeric(raw(line, FIELD.countLine.counted)))}</b></div>`).join("") || `<p class="iw-empty">Scan the first item.</p>`}</div>
        ${editActions}`;
      if (!editable) return;
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
    root.querySelector("[data-refresh]")?.addEventListener("click", () => reload(state.selected?.id));
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

  const CODE128_PATTERNS = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312",
    "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
    "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131",
    "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
    "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
    "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321",
    "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
    "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114",
    "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
    "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112",
    "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
    "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412",
    "211214", "211232", "2331112"
  ];

  function code128Svg(value) {
    const readable = String(value || "").trim();
    const values = [...readable].map(character => {
      const code = character.charCodeAt(0);
      return code >= 32 && code <= 126 ? code - 32 : 31;
    });
    const startCode = 104;
    const checksum = (startCode + values.reduce((sum, code, index) => sum + code * (index + 1), 0)) % 103;
    const encoded = [startCode, ...values, checksum, 106];
    const moduleWidth = 2;
    const quiet = 20;
    const height = 62;
    let x = quiet;
    const bars = [];
    for (const code of encoded) {
      const pattern = CODE128_PATTERNS[code];
      [...pattern].forEach((modules, index) => {
        const width = Number(modules) * moduleWidth;
        if (index % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${width}" height="${height}" fill="#000"/>`);
        x += width;
      });
    }
    const width = x + quiet;
    return `<svg class="iw-barcode" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" shape-rendering="crispEdges" role="img" aria-label="Code 128 barcode ${html(readable)}" xmlns="http://www.w3.org/2000/svg">${bars.join("")}</svg>`;
  }

  function labelMarkup(product) {
    const code = product.barcode || product.supplierSku || product.sku;
    const price = product.price == null ? "Price unavailable" : money.format(product.price);
    return `<div class="iw-label-heading"><strong>${html(product.name)}</strong><em>${html(price)}</em></div><span class="iw-label-sku">${html(product.sku || product.supplierSku)}</span>${code128Svg(code)}<b>${html(code)}</b>`;
  }

  function openPrintPreview() {
    const preview = window.open("", "_blank");
    if (!preview) return null;
    try { preview.opener = null; } catch { }
    preview.document.open();
    preview.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Preparing Labels</title><style>body{margin:0;padding:32px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;background:#f8fafc}main{max-width:520px;margin:12vh auto;padding:28px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.08)}h1{font-size:20px}p{color:#64748b}</style></head><body><main><h1>Preparing barcode labels…</h1><p>The print preview will be ready in a moment.</p></main></body></html>`);
    preview.document.close();
    return preview;
  }

  function printLabels(entries, labelWidth, labelHeight, preview) {
    const labels = entries.flatMap(entry =>
      Array.from({ length: Math.max(1, Math.floor(entry.quantity)) }, () =>
        `<section class="iw-print-label">${labelMarkup(entry.product)}</section>`
      )
    ).join("");
    const printDocument = preview.document;
    printDocument.open();
    printDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>Print Labels</title><style>
      @page { size: ${labelWidth} ${labelHeight}; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; color: #000; font-family: Arial, Helvetica, sans-serif; }
      .iw-print-toolbar { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 14px; position: sticky; top: 0; z-index: 2; border-bottom: 1px solid #e5e7eb; background: #fff; color: #475569; font-size: 13px; }
      .iw-print-toolbar button { min-height: 42px; padding: 0 18px; border: 0; border-radius: 8px; background: #982a86; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
      .iw-print-label { width: ${labelWidth}; height: ${labelHeight}; padding: .08in; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; text-align: center; break-after: page; page-break-after: always; }
      .iw-print-label:last-child { break-after: auto; page-break-after: auto; }
      .iw-label-heading { width: 100%; display: flex; align-items: baseline; justify-content: space-between; gap: .05in; }
      .iw-print-label strong { display: block; min-width: 0; overflow: hidden; font-size: 9pt; line-height: 1.05; text-align: left; text-overflow: ellipsis; white-space: nowrap; }
      .iw-print-label em { flex: none; font-size: 10pt; line-height: 1; font-style: normal; font-weight: 700; }
      .iw-print-label span { width: 100%; font-size: 7pt; line-height: 1; text-align: left; }
      .iw-print-label .iw-barcode { display: block; width: 92%; height: .42in; margin: .02in auto; overflow: visible; }
      .iw-print-label .iw-barcode rect { fill: #000 !important; }
      .iw-print-label b { font-size: 8pt; line-height: 1; letter-spacing: .04em; }
      @media screen { body { background: #f1f5f9; } .iw-print-label { margin: 18px auto; background: #fff; box-shadow: 0 3px 12px rgba(15,23,42,.14); } }
      @media print { .iw-print-toolbar { display: none !important; } .iw-print-label { margin: 0; box-shadow: none; } }
    </style></head><body><div class="iw-print-toolbar"><button type="button" onclick="window.print()">Print / Save as PDF</button><span>In the Windows print dialog, choose “Save as PDF” to download a PDF.</span></div>${labels}</body></html>`);
    printDocument.close();
    preview.focus();
    setTimeout(() => {
      try { preview.print(); } catch { }
    }, 350);
  }

  async function mountLabels(host) {
    host.innerHTML = base("Print Labels", "LABEL UI", "", "labels");
    const root = host.querySelector(".iw-shell");
    wireRefresh(root, () => mountLabels(host));
    root.querySelector("[data-main]").innerHTML = `<div class="iw-field-stack"><label>Source<select data-source><option value="Price List">From Price List</option><option value="Receiving Transaction">From Receiving Transaction</option></select></label><label>Scan or search product<div class="iw-scan-control"><input data-search placeholder="Scan item code"><button data-add><span aria-hidden="true">▤</span> Scan</button></div></label></div><p class="iw-section-label">Print queue</p><section class="iw-compact-panel"><div data-queue></div><div class="iw-balance-total"><span>Total labels</span><strong data-total-labels>0</strong></div></section><button data-clear hidden>Clear queue</button><div class="iw-label-settings"><label>Label size<select data-size><option>2 × 1 inch</option><option>3 × 2 inch</option><option>4 × 2 inch</option></select></label><label>Printer<select data-printer><option>Zebra — PAL</option></select></label></div><p class="iw-section-label">Preview</p><div class="iw-label-preview" data-preview><span>Barcode preview</span></div><button data-print class="iw-success-button iw-full-button">Print Labels</button><p class="iw-note">Reprints are logged — printing never changes inventory.</p>`;
    status(root, "Loading live label sources...");
    try {
      const [itemRows, priceRows, txRows, locationRows] = await Promise.all([
        records(PAGE.labels.items), records(PAGE.labels.prices), records(PAGE.labels.transactions), records(PAGE.lookup.locations)
      ]);
      const pricesById = new Map(priceRows.map(row => [row.id, row]));
      const state = {
        products: itemRows.map(row => item({ ...(pricesById.get(row.id) || {}), ...row })),
        transactions: txRows.map(transaction),
        queue: []
      };
      const userName = await currentUser();
      const activeLocations = locationRows.map(mapLocation);
      root.querySelector("[data-subtitle]").textContent = `${userName} · ${activeLocations[0]?.name || "Inventory"}`;
      const updatePrintSummary = () => {
        const total = state.queue.reduce((sum, entry) => sum + Math.max(1, Math.floor(entry.quantity)), 0);
        root.querySelector("[data-total-labels]").textContent = number.format(total);
        root.querySelector("[data-print]").textContent = total ? `Print ${number.format(total)} ${total === 1 ? "Label" : "Labels"}` : "Print Labels";
      };
      const renderQueue = () => {
        const queue = root.querySelector("[data-queue]");
        queue.innerHTML = state.queue.map((entry, index) => `<div class="iw-queue-row"><span><strong>${html(entry.product.name)}</strong><small>Item code ${html(entry.product.sku || entry.product.supplierSku)}</small></span><input aria-label="Quantity for ${html(entry.product.name)}" data-qty-index="${index}" type="number" min="1" value="${entry.quantity}"><button data-remove="${index}" aria-label="Remove ${html(entry.product.name)}">×</button></div>`).join("") || `<p class="iw-empty">Scan an item to build the print queue.</p>`;
        root.querySelector("[data-clear]").hidden = !state.queue.length;
        updatePrintSummary();
        root.querySelector("[data-preview]").innerHTML = state.queue[0] ? labelMarkup(state.queue[0].product) : `<span>Barcode preview</span>`;
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
        if (event.target.dataset.qtyIndex != null) {
          state.queue[Number(event.target.dataset.qtyIndex)].quantity = Math.max(1, numeric(event.target.value));
          updatePrintSummary();
        }
      });
      root.querySelector("[data-queue]").addEventListener("click", event => {
        const button = event.target.closest("[data-remove]");
        if (!button) return;
        state.queue.splice(Number(button.dataset.remove), 1);
        renderQueue();
      });
      root.querySelector("[data-print]").addEventListener("click", async () => {
        if (!state.queue.length) return status(root, "Add at least one item to the print queue.", true);
        const size = root.querySelector("[data-size]").value;
        const printer = root.querySelector("[data-printer]").value;
        const dimensions = {
          "2 × 1 inch": ["2in", "1in"],
          "3 × 2 inch": ["3in", "2in"],
          "4 × 2 inch": ["4in", "2in"]
        };
        const [labelWidth, labelHeight] = dimensions[size] || dimensions["2 × 1 inch"];
        const preview = openPrintPreview();
        if (!preview) return status(root, "The browser blocked the print preview. Allow pop-ups for apps.knack.com, then try again.", true);
        const user = await currentUser();
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
          printLabels(state.queue, labelWidth, labelHeight, preview);
          state.queue.forEach(entry => { entry.reprint = true; });
          status(root, "Print preview opened. Use Print / Save as PDF in the preview if the system dialog does not appear automatically.");
        } catch (error) {
          try { preview.document.body.innerHTML = `<main style="max-width:520px;margin:12vh auto;padding:28px;font-family:Arial,sans-serif;text-align:center"><h1>Unable to prepare labels</h1><p>${html(error.message)}</p></main>`; } catch { }
          status(root, error.message, true);
        }
      });
      renderQueue();
      status(root, "");
    } catch (error) { status(root, error.message || "Unable to load label sources.", true); }
  }

  async function mountScanner(host) {
    const params = new URLSearchParams(location.search);
    const screen = params.get("screen") || "menu";
    const transactionScreens = {
      receive: {
        eyebrow: "RECEIVE TRANSACTION", title: "Receive Stock", subtitle: "Warehouse Staff",
        type: "Receiving Transaction", prefix: "RCV", locationLabel: "Location (receive into)",
        quantityLabel: "Quantity received", extraLabel: "Reference # (PO)", extraPlaceholder: "Optional — PO / invoice",
        saveLabel: "✓ Save Receive", direction: "in", displayType: "Receive", autoLocation: "Source = none"
      },
      transfer: {
        eyebrow: "TRANSFER TRANSACTION", title: "Transfer Out", subtitle: "Warehouse Staff",
        type: "Inventory Transfer", prefix: "TRF", quantityLabel: "Quantity to transfer",
        saveLabel: "✓ Save Transfer", direction: "transfer", displayType: "Transfer", autoLocation: "Ref = request #"
      },
      usage: {
        eyebrow: "DEDUCT TRANSACTION", title: "Record Usage", subtitle: "Florist · Flower Shop",
        type: "Order Usage", prefix: "USE", locationLabel: "Location (used from)",
        quantityLabel: "Quantity used", extraLabel: "Order number", extraPlaceholder: "e.g. SO-10482",
        saveLabel: "✓ Save Usage", direction: "out", extraRequired: true, displayType: "Deduct", autoLocation: "Dest = none"
      },
      damage: {
        eyebrow: "DAMAGE TRANSACTION", title: "Report Damage", subtitle: "Warehouse / Store Staff",
        type: "Damage", prefix: "DMG", locationLabel: "Location (written off from)",
        quantityLabel: "Quantity damaged", extraLabel: "Damaged reason", extraPlaceholder: "Why was it damaged?",
        saveLabel: "✓ Save Damage", direction: "out", extraRequired: true, extraToNotes: true,
        displayType: "Damage", autoLocation: "Dest = none"
      },
      adjust: {
        eyebrow: "ADJUSTMENT TRANSACTION", title: "Adjust Inventory", subtitle: "Manager only",
        type: "Cycle Count Adjustment", prefix: "ADJ", locationLabel: "Location (correcting)",
        quantityLabel: "Adjustment (+/−)", extraLabel: "Reason", extraPlaceholder: "Reason for correction",
        saveLabel: "✓ Save Adjustment", direction: "adjust", extraRequired: true, extraToNotes: true,
        displayType: "Adjustment", autoLocation: "Dest = none"
      }
    };
    const config = transactionScreens[screen];
    host.innerHTML = config
      ? base(config.title, config.eyebrow, "", "scanner")
      : base("Main Menu", "MENU UI", "", "scanner-menu");
    const root = host.querySelector(".iw-shell");
    wireRefresh(root, () => mountScanner(host));
    status(root, "Loading scanner...");
    try {
      const userRecord = await currentUserRecord();
      const roles = roleNames(userRecord);
      const isManager = roles.some(role => /general manager|manager/i.test(role));
      const isDev = roles.some(role => /\bdev\b/i.test(role));
      const isInventorist = roles.some(role => /inventorist/i.test(role));
      const isSales = roles.some(role => /sales|florist/i.test(role));
      const [itemRows, txRows, locationRows] = await Promise.all([
        records(PAGE.lookup.items), records(PAGE.lookup.transactions), records(PAGE.lookup.locations)
      ]);
      const state = {
        products: itemRows.map(item),
        transactions: txRows.map(transaction),
        locations: locationRows.map(mapLocation),
        selected: null
      };
      const userName = userRecord?.name || userRecord?.email || userRecord?.values?.name || userRecord?.values?.email || "Current user";
      const defaultLocation = state.locations[0]?.name || "Inventory";

      if (!config) {
        root.querySelector("[data-subtitle]").textContent = `${userName} · ${defaultLocation}`;
        root.querySelector("[data-main]").innerHTML = `<div class="iw-main-menu">
          <button data-new-transaction class="iw-menu-card iw-menu-card-primary"><span class="iw-menu-icon">＋</span><span><strong>New Transaction</strong><small>Receive · Transfer · Usage · Damage · Adjust</small></span></button>
          <button data-route="/jong/ft-dev/inventory-lookup" class="iw-menu-card"><span class="iw-menu-icon">⌕</span><span><strong>Inventory Lookup</strong><small>Scan / search on-hand by location</small></span></button>
          <button data-route="/jong/ft-dev/transfer-requests" class="iw-menu-card"><span class="iw-menu-icon">⇄</span><span><strong>Transfer Requests</strong><small>Create · approve · fulfill</small></span></button>
          <button data-route="/jong/ft-dev/inventory-count" class="iw-menu-card"><span class="iw-menu-icon">▤</span><span><strong>Inventory Count</strong><small>Start or continue a cycle count</small></span></button>
          <button data-route="/jong/ft-dev/print-labels" class="iw-menu-card"><span class="iw-menu-icon">◇</span><span><strong>Print Labels</strong><small>Print / reprint barcode labels</small></span></button>
          <button data-route="/jong/ft-dev/manager-analytics" class="iw-menu-card" data-reports><span class="iw-menu-icon">▥</span><span><strong>Reports & Dashboard</strong><small>Role-based dashboard & reports</small></span></button>
        </div>`;
        const allowed = {
          receive: isManager || isInventorist || isDev || !roles.length,
          transfer: isManager || isInventorist || isDev || !roles.length,
          usage: isManager || isSales || isDev || !roles.length,
          damage: isManager || isInventorist || isSales || isDev || !roles.length,
          adjust: isManager || isDev || !roles.length
        };
        root.querySelector("[data-reports]").hidden = !(isManager || isDev || !roles.length);
        root.querySelector("[data-main]").addEventListener("click", event => {
          const route = event.target.closest("[data-route]")?.dataset.route;
          if (route) location.href = route;
        });
        root.querySelector("[data-new-transaction]").addEventListener("click", () => {
          const options = [
            ["receive", "Receive Stock", "Add inventory received at a location"],
            ["transfer", "Transfer Out", "Move inventory between locations"],
            ["usage", "Record Usage", "Deduct inventory used on an order"],
            ["damage", "Report Damage", "Write off damaged inventory"],
            ["adjust", "Adjust Inventory", "Correct the recorded quantity"]
          ].filter(([key]) => allowed[key]).map(([key, label, description]) =>
            `<button type="button" data-open-transaction="${key}"><strong>${label}</strong><span>${description}</span></button>`
          ).join("");
          const dialog = modal(root, "New Transaction", `<div class="iw-transaction-menu">${options}</div>`, `<button value="cancel">Close</button>`);
          dialog.querySelectorAll("[data-open-transaction]").forEach(button => {
            button.addEventListener("click", () => {
              location.href = `/jong/ft-dev/scanner-menu?screen=${encodeURIComponent(button.dataset.openTransaction)}`;
            });
          });
        });
        status(root, "");
        return;
      }

      root.querySelector("[data-subtitle]").textContent = config.subtitle;
      const locationOptions = selectOptions(state.locations);
      const extraField = config.extraLabel
        ? `<label>${config.extraLabel}${config.extraRequired ? `<em>Required</em>` : `<em class="iw-optional">Optional</em>`}<input data-extra placeholder="${html(config.extraPlaceholder)}"></label>`
        : "";
      const locationFields = config.direction === "transfer"
        ? `<label>Source location<em>Required</em><select data-source><option value="">Select location</option>${locationOptions}</select></label><label>Destination location<em>Required</em><select data-destination><option value="">Select store</option>${locationOptions}</select></label>`
        : `<label>${config.locationLabel}<em>Required</em><select data-location><option value="">Select location</option>${locationOptions}</select></label>`;
      root.querySelector("[data-main]").innerHTML = `<div class="iw-transaction-form">
        ${locationFields}
        <label>Product<em>Required</em><div class="iw-product-scan"><button data-product-find class="iw-product-scan-icon" type="button" aria-label="Scan product"><span aria-hidden="true">▮║▮</span></button><input data-product-search autocomplete="off" placeholder="Scan product barcode"></div></label>
        <article class="iw-scanned-product"><strong data-product-name>— product loads on scan —</strong><span>SKU: <b data-product-code>—</b></span><span>On hand: <b data-product-on-hand>—</b></span></article>
        <label>${config.quantityLabel}<em>Required</em><input data-quantity class="iw-large-quantity" type="number" step="${config.direction === "adjust" ? "1" : "1"}" ${config.direction === "adjust" ? "" : "min=\"1\""} value="0"></label>
        ${extraField}
        <button data-save-transaction class="iw-success-button iw-full-button">${config.saveLabel}</button>
        <div class="iw-auto-fields"><strong>Set automatically — not on screen</strong><span>Type = ${html(config.displayType || config.type)}</span><span>${html(config.autoLocation)}</span><span>Unit Cost = product cost</span><span>Date = now</span><span>Employee = me</span><span>No. = ${config.prefix}-####</span></div>
      </div>`;
      const sourceControl = root.querySelector("[data-source]") || root.querySelector("[data-location]");
      const destinationControl = root.querySelector("[data-destination]");
      const prefillLocation = params.get("location");
      if (prefillLocation) {
        const match = state.locations.find(row => row.name === prefillLocation || row.id === prefillLocation);
        if (match && sourceControl) sourceControl.value = match.id;
      } else if (sourceControl && state.locations[0]) {
        sourceControl.value = state.locations[0].id;
      }
      const onHand = () => {
        if (!state.selected) return 0;
        const locationId = sourceControl?.value;
        const locationRow = state.locations.find(row => row.id === locationId);
        return balancesFor(state.selected, state.transactions, state.locations).locations
          .find(row => row.name === locationRow?.name)?.onHand || 0;
      };
      const renderProduct = product => {
        if (!product) return status(root, "No live Price List item matched that scan.", true);
        state.selected = product;
        root.querySelector("[data-product-name]").textContent = product.name;
        root.querySelector("[data-product-code]").textContent = product.sku || product.supplierSku || product.barcode || "-";
        root.querySelector("[data-product-on-hand]").textContent = number.format(onHand());
        status(root, "");
      };
      const findScannedProduct = () => renderProduct(findProduct(state.products, root.querySelector("[data-product-search]").value));
      root.querySelector("[data-product-find]").addEventListener("click", findScannedProduct);
      root.querySelector("[data-product-search]").addEventListener("keydown", event => {
        if (event.key === "Enter") {
          event.preventDefault();
          findScannedProduct();
        }
      });
      sourceControl?.addEventListener("change", () => {
        if (state.selected) root.querySelector("[data-product-on-hand]").textContent = number.format(onHand());
      });
      const prefillSku = params.get("sku");
      if (prefillSku) {
        root.querySelector("[data-product-search]").value = prefillSku;
        renderProduct(findProduct(state.products, prefillSku));
      }
      if (params.get("qty")) root.querySelector("[data-quantity]").value = params.get("qty");
      if (params.get("reference") && root.querySelector("[data-extra]")) root.querySelector("[data-extra]").value = params.get("reference");

      root.querySelector("[data-save-transaction]").addEventListener("click", async () => {
        if (!state.selected) return status(root, "Scan a valid product first.", true);
        const quantity = numeric(root.querySelector("[data-quantity]").value);
        if (!quantity || (config.direction !== "adjust" && quantity < 0)) return status(root, "Enter a valid non-zero quantity.", true);
        if (config.direction === "adjust" && roles.length && !(isManager || isDev)) {
          return status(root, "Inventory adjustments require a Manager role.", true);
        }
        const sourceId = config.direction === "in" ? "" : sourceControl?.value;
        const destinationId = config.direction === "in" ? sourceControl?.value : destinationControl?.value || "";
        if (config.direction === "transfer") {
          if (!sourceId || !destinationId || sourceId === destinationId) return status(root, "Choose two different locations.", true);
        } else if (!sourceControl?.value) {
          return status(root, "Choose a location.", true);
        }
        const available = onHand();
        if (["out", "transfer"].includes(config.direction) && Math.abs(quantity) > available) {
          return status(root, `Only ${number.format(available)} is available at the selected source.`, true);
        }
        const extra = root.querySelector("[data-extra]")?.value.trim() || "";
        if (config.extraRequired && !extra) return status(root, `${config.extraLabel} is required.`, true);
        const transactionCode = code(config.prefix);
        const body = {
          [FIELD.transaction.code]: transactionCode,
          [FIELD.transaction.number]: Number(String(Date.now()).slice(-9)),
          [FIELD.transaction.itemCode]: state.selected.barcode || state.selected.supplierSku || state.selected.sku,
          [FIELD.transaction.type]: config.type,
          [FIELD.transaction.quantity]: quantity,
          [FIELD.transaction.cost]: state.selected.cost,
          [FIELD.transaction.date]: knackDate(),
          [FIELD.transaction.sku]: state.selected.sku
        };
        if (sourceId) body[FIELD.transaction.source] = sourceId;
        if (destinationId) body[FIELD.transaction.destination] = destinationId;
        if (extra && !config.extraToNotes) body[FIELD.transaction.reference] = extra;
        if (extra && config.extraToNotes) body[FIELD.transaction.notes] = extra;
        if (userRecord?.id) body[FIELD.transaction.user] = userRecord.id;
        try {
          root.querySelector("[data-save-transaction]").disabled = true;
          await create(PAGE.scanner.addTransaction, body);
          status(root, `${transactionCode} saved successfully.`);
          root.querySelector("[data-product-search]").value = "";
          root.querySelector("[data-quantity]").value = "0";
          if (root.querySelector("[data-extra]")) root.querySelector("[data-extra]").value = "";
          state.selected = null;
          root.querySelector("[data-product-name]").textContent = "— product loads on scan —";
          root.querySelector("[data-product-code]").textContent = "—";
          root.querySelector("[data-product-on-hand]").textContent = "—";
          root.querySelector("[data-product-search]").focus();
        } catch (error) {
          status(root, error.message || "Unable to save this transaction.", true);
        } finally {
          root.querySelector("[data-save-transaction]").disabled = false;
        }
      });
      status(root, "");
    } catch (error) {
      status(root, error.message || "Unable to load the scanner.", true);
    }
  }

  function mount(name) {
    const config = PAGE[name];
    if (!document.getElementById(config.scene)) return;
    const host = document.getElementById(config.host);
    if (!host || host.querySelector(".iw-shell")) return;
    ({ lookup: mountLookup, transfers: mountTransfers, counts: mountCounts, labels: mountLabels, scanner: mountScanner })[name](host);
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
