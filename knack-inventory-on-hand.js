(function () {
  "use strict";

  const PAGE_KEY = "scene_475";
  const CONTAINER_VIEW_KEY = "view_1015";
  const CONFIG = {
    applicationId: "6295c09d313de3001ea4047e",
    defaultItem: "UTC-CTR-003",
    currency: "USD",
    locale: "en-US",
    rowsPerPage: 1000,
    locations: ["Palmdale WareHouse", "Santa Monica", "Sherman Oaks"],
    permissions: {
      costRoles: ["General Manager - Admin", "Inventorist", "Dev"]
    },
    views: {
      items: { scene: "scene_463", view: "view_1003" },
      itemDetails: { scene: "scene_464", view: "view_1004" },
      transactions: { scene: "scene_470", view: "view_1008" }
    },
    fields: {
      item: {
        name: "field_721", photo: "field_739", sku: "field_725",
        barcode: "field_724", category: "field_727", vendor: "field_733",
        unit: "field_728", status: "field_738", reorderPoint: "field_749",
        reorderQuantity: "", lastPurchaseCost: "field_730"
      },
      transaction: {
        itemCode: "field_753", sku: "field_761", date: "field_759",
        number: "field_752", code: "field_750", type: "field_756",
        reference: "field_760", source: "field_754", destination: "field_755",
        quantity: "field_757", unitCost: "field_758", user: "field_764",
        notes: "field_762"
      }
    }
  };

  const TEMPLATE = `
    <div id="inventory-app" class="inventory-shell" aria-live="polite">
      <header class="inventory-topbar">
        <div>
          <p class="inventory-eyebrow">Inventory control</p>
          <h2>On-hand quantity</h2>
        </div>
        <button id="inventory-scan-button" class="inventory-primary" type="button">Scan another item</button>
      </header>

      <section class="inventory-lookup-card" aria-label="Item lookup">
        <label for="inventory-barcode-input">Scan or enter a Supplier SKU / OR SKU</label>
        <div class="inventory-lookup-row">
          <input id="inventory-barcode-input" autocomplete="off" placeholder="Try UTC-CTR-003 or 41636">
          <button id="inventory-lookup-button" class="inventory-primary" type="button">Find item</button>
        </div>
        <p class="inventory-hint">Loaded directly from live Knack views. This page contains no bundled sample records.</p>
      </section>

      <div id="inventory-status" class="inventory-status" role="status" hidden></div>

      <div id="inventory-item-content" hidden>
        <section class="inventory-card inventory-product-card">
          <div id="inventory-photo" class="inventory-product-photo" aria-label="Product photo"></div>
          <div class="inventory-product-main">
            <span id="inventory-active-status" class="inventory-pill"></span>
            <h2 id="inventory-product-name"></h2>
            <div class="inventory-identity-line"><span id="inventory-sku"></span><span aria-hidden="true">•</span><span id="inventory-barcode"></span></div>
            <p id="inventory-category-vendor" class="inventory-muted"></p>
          </div>
          <dl class="inventory-product-meta">
            <div><dt>Unit</dt><dd id="inventory-unit"></dd></div>
            <div><dt>Reorder point</dt><dd id="inventory-reorder-point"></dd></div>
            <div><dt>Reorder quantity</dt><dd id="inventory-reorder-quantity"></dd></div>
          </dl>
        </section>

        <section id="inventory-alerts-card" class="inventory-card inventory-alert-card" hidden>
          <h2>Needs attention</h2>
          <div id="inventory-alerts" class="inventory-badges"></div>
        </section>

        <section class="inventory-summary-grid">
          <article class="inventory-card inventory-metric"><span>Total on hand</span><strong id="inventory-total-on-hand">0</strong></article>
          <article class="inventory-card inventory-metric"><span>Total available</span><strong id="inventory-total-available">0</strong></article>
          <article id="inventory-cost-card" class="inventory-card inventory-metric" hidden><span>Inventory value</span><strong id="inventory-value">—</strong><small id="inventory-last-cost"></small></article>
        </section>

        <section class="inventory-card">
          <div class="inventory-section-heading"><div><p class="inventory-eyebrow">Live balances</p><h2>Inventory by location</h2></div></div>
          <div class="inventory-table-wrap"><table>
            <thead><tr><th>Location</th><th class="inventory-number">On hand</th><th class="inventory-number">Reserved</th><th class="inventory-number">Available</th></tr></thead>
            <tbody id="inventory-location-rows"></tbody>
            <tfoot id="inventory-location-total"></tfoot>
          </table></div>
        </section>

        <section class="inventory-card">
          <div class="inventory-section-heading"><div><p class="inventory-eyebrow">Audit trail</p><h2>Transaction history</h2></div><button id="inventory-clear-filters" class="inventory-text-button" type="button">Clear filters</button></div>
          <form id="inventory-filters" class="inventory-filters">
            <label>From<input id="inventory-filter-from" type="date"></label>
            <label>To<input id="inventory-filter-to" type="date"></label>
            <label>Location<select id="inventory-filter-location"><option value="">All locations</option></select></label>
            <label>Type<select id="inventory-filter-type"><option value="">All types</option></select></label>
            <label>User<input id="inventory-filter-user" placeholder="Name or email"></label>
            <label>Vendor<input id="inventory-filter-vendor" placeholder="Vendor"></label>
            <label>PO number<input id="inventory-filter-po" placeholder="PO number"></label>
          </form>
          <div class="inventory-table-wrap"><table class="inventory-transaction-table">
            <thead><tr><th>Date &amp; time</th><th>Transaction</th><th>Item code</th><th>Type</th><th>Reference</th><th>Source → destination</th><th class="inventory-number">In</th><th class="inventory-number">Out</th><th class="inventory-number">Balance</th><th>User</th><th>Notes</th></tr></thead>
            <tbody id="inventory-transaction-rows"></tbody>
          </table></div>
          <p id="inventory-transaction-empty" class="inventory-empty" hidden>No transactions match these filters.</p>
        </section>
      </div>

      <dialog id="inventory-scanner-dialog">
        <form method="dialog" class="inventory-dialog-card">
          <button class="inventory-dialog-close" aria-label="Close">×</button>
          <p class="inventory-eyebrow">Inventory scanner</p>
          <h2>Scan another item</h2>
          <p>Use a connected scanner or type the barcode. Most scanners submit automatically.</p>
          <input id="inventory-dialog-barcode" autocomplete="off" placeholder="Supplier SKU or OR SKU">
          <button id="inventory-dialog-find" class="inventory-primary" type="button">Find item</button>
        </form>
      </dialog>
    </div>`;

  function mount() {
    if (!document.getElementById(PAGE_KEY)) return;
    const host = document.getElementById(CONTAINER_VIEW_KEY);
    if (!host || host.querySelector("#inventory-app")) return;
    host.innerHTML = TEMPLATE;
    initialize(host.querySelector("#inventory-app"));
  }

  function initialize(root) {
    const element = (name) => root.querySelector(`#inventory-${name}`);
    const state = { item: null, balances: [], transactions: [] };
    const number = new Intl.NumberFormat(CONFIG.locale, { maximumFractionDigits: 2 });
    const money = new Intl.NumberFormat(CONFIG.locale, { style: "currency", currency: CONFIG.currency });

    function text(value) { return value == null || value === "" ? "—" : String(value); }
    function numeric(value) {
      if (typeof value === "number") return value;
      const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    function raw(record, key) {
      if (!key) return undefined;
      const value = record[key + "_raw"] ?? record[key];
      if (Array.isArray(value)) return value.map(item => item?.identifier ?? item?.id ?? item).join(", ");
      if (value && typeof value === "object") return value.identifier ?? value.url ?? value.value ?? value.iso_timestamp ?? value.proper_iso_timestamp ?? value.date_formatted ?? value.date ?? value.id;
      return value;
    }
    function imageUrl(record, key) {
      const value = key ? (record[key + "_raw"] ?? record[key]) : "";
      if (Array.isArray(value)) return value[0]?.url || value[0]?.thumb_url || "";
      return value?.url || value?.thumb_url || (typeof value === "string" && /^https?:/.test(value) ? value : "");
    }
    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]);
    }
    function filter(field, operator, value) { return { field, operator, value }; }

    async function userToken() {
      const knack = globalThis.Knack;
      if (knack?.getUserToken) return await knack.getUserToken();
      if (knack?.getUser) return (await knack.getUser())?.token || "";
      return "";
    }
    async function records(viewConfig, rules = []) {
      const query = new URLSearchParams({ page: "1", rows_per_page: String(CONFIG.rowsPerPage) });
      if (rules.length) query.set("filters", JSON.stringify({ match: "and", rules }));
      const token = await userToken();
      const response = await fetch(`https://api.knack.com/v1/pages/${viewConfig.scene}/views/${viewConfig.view}/records?${query}`, {
        headers: {
          "X-Knack-Application-Id": CONFIG.applicationId,
          "X-Knack-REST-API-KEY": "knack",
          ...(token ? { Authorization: token } : {})
        }
      });
      if (!response.ok) throw new Error(response.status === 403 ? "You do not have permission to view this inventory data." : `Knack request failed (${response.status}).`);
      return (await response.json()).records || [];
    }
    async function record(viewConfig, recordId) {
      if (!recordId) return null;
      const token = await userToken();
      const response = await fetch(`https://api.knack.com/v1/pages/${viewConfig.scene}/views/${viewConfig.view}/records/${recordId}`, {
        headers: {
          "X-Knack-Application-Id": CONFIG.applicationId,
          "X-Knack-REST-API-KEY": "knack",
          ...(token ? { Authorization: token } : {})
        }
      });
      return response.ok ? await response.json() : null;
    }
    function mapItem(source) {
      const fields = CONFIG.fields.item;
      return {
        id: source.id, name: raw(source, fields.name), photo: imageUrl(source, fields.photo),
        sku: raw(source, fields.sku), barcode: String(raw(source, fields.barcode) ?? "").trim(),
        category: raw(source, fields.category), vendor: raw(source, fields.vendor), unit: raw(source, fields.unit),
        status: raw(source, fields.status), reorderPoint: numeric(raw(source, fields.reorderPoint)),
        reorderQuantity: fields.reorderQuantity ? numeric(raw(source, fields.reorderQuantity)) : null,
        lastPurchaseCost: numeric(raw(source, fields.lastPurchaseCost))
      };
    }
    function mapTransaction(source) {
      const fields = CONFIG.fields.transaction;
      return {
        date: raw(source, fields.date), dateDisplay: source[fields.date], number: raw(source, fields.number),
        itemCode: String(raw(source, fields.itemCode) ?? "").trim(), sku: String(raw(source, fields.sku) ?? "").trim(),
        type: raw(source, fields.type), reference: raw(source, fields.reference), source: raw(source, fields.source),
        destination: raw(source, fields.destination), quantity: numeric(raw(source, fields.quantity)),
        user: raw(source, fields.user), notes: raw(source, fields.notes)
      };
    }
    function calculateInventory(transactions) {
      const totals = new Map(CONFIG.locations.map(location => [location, 0]));
      const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
      let runningBalance = 0;
      for (const transaction of sorted) {
        const type = String(transaction.type || "").toLowerCase();
        const quantity = transaction.quantity;
        const amount = Math.abs(quantity);
        let totalDelta = 0;
        transaction.quantityIn = 0;
        transaction.quantityOut = 0;
        if (type.includes("transfer")) {
          if (transaction.source) totals.set(transaction.source, (totals.get(transaction.source) || 0) - amount);
          if (transaction.destination) totals.set(transaction.destination, (totals.get(transaction.destination) || 0) + amount);
          transaction.quantityIn = amount;
          transaction.quantityOut = amount;
        } else if (type.includes("receiv") || type.includes("return") || type.includes("beginning")) {
          const location = transaction.destination || transaction.source;
          totalDelta = amount;
          if (location) totals.set(location, (totals.get(location) || 0) + totalDelta);
          transaction.quantityIn = amount;
        } else if (type.includes("order") || type.includes("damage") || type.includes("waste")) {
          const location = transaction.source || transaction.destination;
          totalDelta = -amount;
          if (location) totals.set(location, (totals.get(location) || 0) + totalDelta);
          transaction.quantityOut = amount;
        } else {
          const location = transaction.source || transaction.destination;
          totalDelta = quantity;
          if (location) totals.set(location, (totals.get(location) || 0) + totalDelta);
          if (totalDelta >= 0) transaction.quantityIn = totalDelta; else transaction.quantityOut = Math.abs(totalDelta);
        }
        runningBalance += totalDelta;
        transaction.runningBalance = runningBalance;
      }
      state.balances = [...totals.entries()].map(([location, onHand]) => ({ location, onHand, reserved: 0 }));
      state.transactions = sorted;
    }
    function showStatus(message, error = false) {
      element("status").hidden = false;
      element("status").textContent = message;
      element("status").classList.toggle("inventory-error", error);
    }
    function hideStatus() { element("status").hidden = true; }

    async function load(query) {
      showStatus("Loading live inventory…");
      try {
        const fields = CONFIG.fields;
        let itemSource = (await records(CONFIG.views.items, [filter(fields.item.barcode, "is", query)]))[0];
        if (!itemSource) itemSource = (await records(CONFIG.views.items, [filter(fields.item.sku, "is", query)]))[0];
        if (!itemSource) throw new Error("No Price List item matched that Supplier SKU or OR SKU.");
        const details = await record(CONFIG.views.itemDetails, itemSource.id);
        state.item = mapItem(details || itemSource);
        const transactionSources = await records(CONFIG.views.transactions, [filter(fields.transaction.sku, "is", state.item.sku)]);
        calculateInventory(transactionSources.map(mapTransaction));
        render();
        hideStatus();
      } catch (error) {
        element("item-content").hidden = true;
        showStatus(error.message || "Unable to load inventory.", true);
      }
    }
    function canViewCost() {
      const roles = globalThis.Knack?.getUserRoles?.() || globalThis.Knack?.user?.roles || [];
      return roles.some(role => CONFIG.permissions.costRoles.includes(role?.name ?? role));
    }
    function setOptions(id, values) {
      const select = element(id);
      const current = select.value;
      const first = select.options[0].outerHTML;
      select.innerHTML = first + [...new Set(values.filter(Boolean))].sort().map(value => `<option>${escapeHtml(value)}</option>`).join("");
      select.value = current;
    }
    function render() {
      const item = state.item;
      const totals = state.balances.reduce((result, balance) => ({ onHand: result.onHand + balance.onHand, reserved: result.reserved + balance.reserved }), { onHand: 0, reserved: 0 });
      totals.available = totals.onHand - totals.reserved;
      element("product-name").textContent = text(item.name);
      element("sku").textContent = `OR SKU ${text(item.sku)}`;
      element("barcode").textContent = `Supplier SKU ${text(item.barcode)}`;
      element("category-vendor").textContent = [item.category, item.vendor].filter(Boolean).join(" · ") || "—";
      element("unit").textContent = text(item.unit);
      element("reorder-point").textContent = number.format(item.reorderPoint);
      element("reorder-quantity").textContent = item.reorderQuantity == null ? "—" : number.format(item.reorderQuantity);
      element("active-status").textContent = text(item.status);
      element("active-status").classList.toggle("inventory-inactive", String(item.status).toLowerCase() !== "active");
      element("photo").textContent = item.photo ? "" : "✿";
      element("photo").style.backgroundImage = item.photo ? `url("${String(item.photo).replace(/["\\]/g, "\\$&")}")` : "";
      element("total-on-hand").textContent = number.format(totals.onHand);
      element("total-available").textContent = number.format(totals.available);
      element("cost-card").hidden = !canViewCost();
      element("value").textContent = money.format(totals.onHand * item.lastPurchaseCost);
      element("last-cost").textContent = `Last purchase cost ${money.format(item.lastPurchaseCost)}`;
      element("location-rows").innerHTML = state.balances.map(balance => `<tr><td>${escapeHtml(balance.location)}</td><td class="inventory-number">${number.format(balance.onHand)}</td><td class="inventory-number">${number.format(balance.reserved)}</td><td class="inventory-number">${number.format(balance.onHand - balance.reserved)}</td></tr>`).join("");
      element("location-total").innerHTML = `<tr><th>Total</th><th class="inventory-number">${number.format(totals.onHand)}</th><th class="inventory-number">${number.format(totals.reserved)}</th><th class="inventory-number">${number.format(totals.available)}</th></tr>`;
      const alerts = [];
      if (state.balances.some(balance => balance.onHand < 0)) alerts.push(["Negative inventory", "inventory-danger"]);
      if (totals.onHand <= item.reorderPoint) alerts.push(["Below reorder point", ""]);
      element("alerts-card").hidden = !alerts.length;
      element("alerts").innerHTML = alerts.map(([label, className]) => `<span class="inventory-badge ${className}">${label}</span>`).join("");
      setOptions("filter-location", state.balances.map(balance => balance.location));
      setOptions("filter-type", state.transactions.map(transaction => transaction.type));
      renderTransactions();
      element("item-content").hidden = false;
      element("barcode-input").value = item.barcode || item.sku || "";
    }
    function renderTransactions() {
      const from = element("filter-from").value;
      const to = element("filter-to").value;
      const location = element("filter-location").value;
      const type = element("filter-type").value;
      const user = element("filter-user").value.toLowerCase();
      const vendor = element("filter-vendor").value.toLowerCase();
      const po = element("filter-po").value.toLowerCase();
      const rows = state.transactions.filter(transaction =>
        (!from || String(transaction.date).slice(0, 10) >= from) &&
        (!to || String(transaction.date).slice(0, 10) <= to) &&
        (!location || transaction.source === location || transaction.destination === location) &&
        (!type || transaction.type === type) &&
        (!user || String(transaction.user).toLowerCase().includes(user)) &&
        (!vendor || String(state.item?.vendor).toLowerCase().includes(vendor)) &&
        (!po || String(transaction.reference).toLowerCase().includes(po))
      ).sort((a, b) => new Date(b.date) - new Date(a.date));
      element("transaction-rows").innerHTML = rows.map(transaction => `<tr><td>${escapeHtml(transaction.dateDisplay || formatDate(transaction.date))}</td><td>${escapeHtml(transaction.number)}</td><td>${escapeHtml(transaction.itemCode || state.item?.sku)}</td><td>${escapeHtml(transaction.type)}</td><td>${escapeHtml(transaction.reference)}</td><td>${escapeHtml(text(transaction.source))} → ${escapeHtml(text(transaction.destination))}</td><td class="inventory-number">${transaction.quantityIn ? number.format(transaction.quantityIn) : ""}</td><td class="inventory-number">${transaction.quantityOut ? number.format(transaction.quantityOut) : ""}</td><td class="inventory-number">${number.format(transaction.runningBalance)}</td><td>${escapeHtml(transaction.user)}</td><td>${escapeHtml(transaction.notes)}</td></tr>`).join("");
      element("transaction-empty").hidden = rows.length > 0;
    }
    function formatDate(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? text(value) : new Intl.DateTimeFormat(CONFIG.locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
    }
    function submitLookup(value) {
      const query = String(value || "").trim();
      if (!query) { showStatus("Enter or scan a barcode or SKU.", true); return; }
      if (element("scanner-dialog").open) element("scanner-dialog").close();
      load(query);
    }

    element("lookup-button").addEventListener("click", () => submitLookup(element("barcode-input").value));
    element("barcode-input").addEventListener("keydown", event => { if (event.key === "Enter") submitLookup(event.target.value); });
    element("scan-button").addEventListener("click", () => {
      element("scanner-dialog").showModal();
      element("dialog-barcode").value = "";
      setTimeout(() => element("dialog-barcode").focus(), 0);
    });
    element("dialog-find").addEventListener("click", () => submitLookup(element("dialog-barcode").value));
    element("dialog-barcode").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); submitLookup(event.target.value); } });
    element("filters").addEventListener("input", renderTransactions);
    element("filters").addEventListener("change", renderTransactions);
    element("clear-filters").addEventListener("click", () => { element("filters").reset(); renderTransactions(); });
    load(CONFIG.defaultItem);
  }

  function register() {
    const knack = globalThis.Knack;
    if (knack?.on) {
      knack.on(`page:render:${PAGE_KEY}`, mount);
      knack.on(`view:render:${CONTAINER_VIEW_KEY}`, mount);
    }
    mount();
  }

  if (globalThis.Knack?.ready) {
    globalThis.Knack.ready().then(register);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", register, { once: true });
  } else {
    register();
  }
})();
