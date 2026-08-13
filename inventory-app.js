(() => {
  "use strict";
  const config = window.INVENTORY_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const state = { item: null, balances: [], transactions: [] };
  const number = new Intl.NumberFormat(config.locale || "en-US", { maximumFractionDigits: 2 });
  const money = new Intl.NumberFormat(config.locale || "en-US", { style: "currency", currency: config.currency || "USD" });

  function text(value) { return value == null || value === "" ? "—" : String(value); }
  function numeric(value) {
    if (typeof value === "number") return value;
    const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function raw(record, key) {
    if (!key) return undefined;
    const value = record[key + "_raw"] ?? record[key];
    if (Array.isArray(value)) return value.map(v => v?.identifier ?? v?.id ?? v).join(", ");
    if (value && typeof value === "object") return value.identifier ?? value.url ?? value.value ?? value.iso_timestamp ?? value.proper_iso_timestamp ?? value.date_formatted ?? value.date ?? value.id;
    return value;
  }
  function imageUrl(record, key) {
    const value = key ? (record[key + "_raw"] ?? record[key]) : "";
    if (Array.isArray(value)) return value[0]?.url || value[0]?.thumb_url || "";
    return value?.url || value?.thumb_url || (typeof value === "string" && /^https?:/.test(value) ? value : "");
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);
  }
  function fieldFilter(field, operator, value) { return { field, operator, value }; }

  async function token() {
    if (window.Knack?.getUserToken) return await window.Knack.getUserToken();
    if (window.Knack?.getUser) return (await window.Knack.getUser())?.token || "";
    return "";
  }
  async function api(viewConfig, rules = []) {
    if (!config.applicationId || !viewConfig?.scene || !viewConfig?.view) throw new Error("Knack configuration is incomplete.");
    const query = new URLSearchParams({ page:"1", rows_per_page:String(config.rowsPerPage || 1000) });
    if (rules.length) query.set("filters", JSON.stringify({ match:"and", rules }));
    const authToken = await token();
    const response = await fetch(`https://api.knack.com/v1/pages/${viewConfig.scene}/views/${viewConfig.view}/records?${query}`, {
      headers: { "X-Knack-Application-Id":config.applicationId, "X-Knack-REST-API-KEY":"knack", ...(authToken ? { Authorization:authToken } : {}) }
    });
    if (!response.ok) throw new Error(response.status === 403 ? "You do not have permission to view this inventory data." : `Knack request failed (${response.status}).`);
    return (await response.json()).records || [];
  }
  async function apiRecord(viewConfig, recordId) {
    if (!config.applicationId || !viewConfig?.scene || !viewConfig?.view || !recordId) return null;
    const authToken = await token();
    const response = await fetch(`https://api.knack.com/v1/pages/${viewConfig.scene}/views/${viewConfig.view}/records/${recordId}`, {
      headers: { "X-Knack-Application-Id":config.applicationId, "X-Knack-REST-API-KEY":"knack", ...(authToken ? { Authorization:authToken } : {}) }
    });
    return response.ok ? await response.json() : null;
  }
  function mapItem(record) {
    const f=config.fields.item; return { id:record.id, name:raw(record,f.name), photo:imageUrl(record,f.photoUrl) || imageUrl(record,f.photo), sku:raw(record,f.sku), barcode:String(raw(record,f.barcode) ?? "").trim(), category:raw(record,f.category), vendor:raw(record,f.vendor), unit:raw(record,f.unit), status:raw(record,f.status), reorderPoint:numeric(raw(record,f.reorderPoint)), reorderQuantity:f.reorderQuantity ? numeric(raw(record,f.reorderQuantity)) : null, lastPurchaseCost:numeric(raw(record,f.lastPurchaseCost)) };
  }
  async function productPhoto(item) {
    const productFields=config.fields.product;
    const lookup=String(item.barcode || "").trim();
    if (!lookup || !productFields?.potSku || !productFields?.photo) return "";
    for (const view of config.views.productImages || []) {
      try {
        const product=(await api(view,[fieldFilter(productFields.potSku,"is",lookup)]))[0];
        const photo=product ? imageUrl(product,productFields.photo) : "";
        if (photo) return photo;
      } catch {
        // Product pages are role-specific; try the next permitted view.
      }
    }
    return "";
  }
  function mapTransaction(record) {
    const f=config.fields.transaction;
    return { date:raw(record,f.date), dateDisplay:record[f.date], number:raw(record,f.number), code:raw(record,f.code), itemCode:String(raw(record,f.itemCode) ?? "").trim(), sku:String(raw(record,f.sku) ?? "").trim(), type:raw(record,f.type), reference:raw(record,f.reference), source:raw(record,f.source), destination:raw(record,f.destination), quantity:numeric(raw(record,f.quantity)), unitCost:numeric(raw(record,f.unitCost)), user:raw(record,f.user), notes:raw(record,f.notes) };
  }
  function calculateInventory(transactions) {
    const locationTotals = new Map((config.locations || []).map(location => [location, 0]));
    const sorted = [...transactions].sort((a,b) => new Date(a.date) - new Date(b.date));
    let runningBalance = 0;
    for (const transaction of sorted) {
      const type = String(transaction.type || "").toLowerCase();
      const quantity = transaction.quantity;
      const amount = Math.abs(quantity);
      let totalDelta = 0;
      transaction.quantityIn = 0;
      transaction.quantityOut = 0;
      if (type.includes("transfer")) {
        if (transaction.source) locationTotals.set(transaction.source, (locationTotals.get(transaction.source) || 0) - amount);
        if (transaction.destination) locationTotals.set(transaction.destination, (locationTotals.get(transaction.destination) || 0) + amount);
        transaction.quantityIn = amount;
        transaction.quantityOut = amount;
      } else if (type.includes("receiv") || type.includes("return") || type.includes("beginning")) {
        const location = transaction.destination || transaction.source;
        totalDelta = amount;
        if (location) locationTotals.set(location, (locationTotals.get(location) || 0) + totalDelta);
        transaction.quantityIn = amount;
      } else if (type.includes("order") || type.includes("damage") || type.includes("waste")) {
        const location = transaction.source || transaction.destination;
        totalDelta = -amount;
        if (location) locationTotals.set(location, (locationTotals.get(location) || 0) + totalDelta);
        transaction.quantityOut = amount;
      } else {
        const location = transaction.source || transaction.destination;
        totalDelta = quantity;
        if (location) locationTotals.set(location, (locationTotals.get(location) || 0) + totalDelta);
        if (totalDelta >= 0) transaction.quantityIn = totalDelta; else transaction.quantityOut = Math.abs(totalDelta);
      }
      runningBalance += totalDelta;
      transaction.runningBalance = runningBalance;
    }
    state.balances = [...locationTotals.entries()].map(([location,onHand]) => ({location,onHand,reserved:0,pendingTransfer:false}));
    state.transactions = sorted;
  }
  async function load(query) {
    showStatus("Loading live inventory…");
    try {
      const f=config.fields;
      const candidates = await api(config.views.items, [fieldFilter(f.item.barcode,"is",query)]);
      let itemRecord = candidates[0];
      if (!itemRecord && f.item.sku) itemRecord=(await api(config.views.items,[fieldFilter(f.item.sku,"is",query)]))[0];
      if (!itemRecord) throw new Error("No Price List item matched that Supplier SKU or OR SKU.");
      const detailRecord = await apiRecord(config.views.itemDetails, itemRecord.id);
      state.item=mapItem(detailRecord || itemRecord);
      if (!state.item.photo) state.item.photo=await productPhoto(state.item);
      const transactionRecords = await api(config.views.transactions,[fieldFilter(f.transaction.sku,"is",state.item.sku)]);
      calculateInventory(transactionRecords.map(mapTransaction));
      render(); hideStatus();
    } catch (error) { $("item-content").hidden=true; showStatus(error.message || "Unable to load inventory.", true); }
  }

  function canViewCost() {
    if (!window.Knack) return Boolean(config.permissions?.showCostsOutsideKnack);
    const allowed=config.permissions?.costRoles || [];
    if (!allowed.length) return false;
    const attributes=window.Knack?.getUserAttributes?.() || {};
    const roles=window.Knack?.getUserRoles?.() || attributes.roles || window.Knack?.user?.roles || [];
    return roles.some(r => allowed.includes(r?.name ?? r));
  }
  function render() {
    const i=state.item, totals=state.balances.reduce((a,b)=>({onHand:a.onHand+b.onHand,reserved:a.reserved+b.reserved}),{onHand:0,reserved:0});
    totals.available=totals.onHand-totals.reserved;
    $("product-name").textContent=text(i.name); $("sku").textContent=`OR SKU ${text(i.sku)}`; $("barcode").textContent=`Supplier SKU ${text(i.barcode)}`;
    $("category-vendor").textContent=[i.category,i.vendor].filter(Boolean).join(" · ") || "—"; $("unit").textContent=text(i.unit); $("reorder-point").textContent=number.format(i.reorderPoint); $("reorder-quantity").textContent=i.reorderQuantity == null ? "—" : number.format(i.reorderQuantity);
    $("active-status").textContent=text(i.status); $("active-status").classList.toggle("inactive", String(i.status).toLowerCase()!=="active");
    $("photo").textContent=i.photo ? "" : "✿"; $("photo").style.backgroundImage=i.photo ? `url("${String(i.photo).replace(/["\\]/g,"\\$&")}")` : "";
    $("total-on-hand").textContent=number.format(totals.onHand); $("total-available").textContent=number.format(totals.available);
    $("cost-card").hidden=!canViewCost(); $("inventory-value").textContent=money.format(totals.onHand*i.lastPurchaseCost); $("last-cost").textContent=`Last purchase cost ${money.format(i.lastPurchaseCost)}`;
    $("location-rows").innerHTML=state.balances.map(b=>`<tr><td>${escapeHtml(b.location)}</td><td class="number">${number.format(b.onHand)}</td><td class="number">${number.format(b.reserved)}</td><td class="number">${number.format(b.onHand-b.reserved)}</td></tr>`).join("");
    $("location-total").innerHTML=`<tr><th>Total</th><th class="number">${number.format(totals.onHand)}</th><th class="number">${number.format(totals.reserved)}</th><th class="number">${number.format(totals.available)}</th></tr>`;
    const alerts=[]; if(state.balances.some(b=>b.onHand<0)) alerts.push(["Negative inventory","danger"]); if(totals.onHand<=i.reorderPoint) alerts.push(["Below reorder point",""]); if(state.balances.some(b=>b.pendingTransfer)) alerts.push(["Pending transfer",""]);
    $("alerts-card").hidden=!alerts.length; $("alerts").innerHTML=alerts.map(([label,cls])=>`<span class="badge ${cls}">${label}</span>`).join("");
    setOptions("filter-location",state.balances.map(b=>b.location)); setOptions("filter-type",state.transactions.map(t=>t.type)); renderTransactions();
    $("item-content").hidden=false; $("barcode-input").value=i.barcode || i.sku || "";
  }
  function setOptions(id,values) {
    const select=$(id),current=select.value,first=select.options[0].outerHTML;
    select.innerHTML=first+[...new Set(values.filter(Boolean))].sort().map(v=>`<option>${escapeHtml(v)}</option>`).join(""); select.value=current;
  }
  function renderTransactions() {
    const from=$("filter-from").value,to=$("filter-to").value,location=$("filter-location").value,type=$("filter-type").value,user=$("filter-user").value.toLowerCase(),vendor=$("filter-vendor").value.toLowerCase(),po=$("filter-po").value.toLowerCase();
    const rows=state.transactions.filter(t=>(!from||String(t.date).slice(0,10)>=from)&&(!to||String(t.date).slice(0,10)<=to)&&(!location||t.source===location||t.destination===location)&&(!type||t.type===type)&&(!user||String(t.user).toLowerCase().includes(user))&&(!vendor||String(state.item?.vendor).toLowerCase().includes(vendor))&&(!po||String(t.reference).toLowerCase().includes(po))).sort((a,b)=>new Date(b.date)-new Date(a.date));
    $("transaction-rows").innerHTML=rows.map(t=>`<tr><td>${escapeHtml(t.dateDisplay || formatDate(t.date))}</td><td>${escapeHtml(t.number)}</td><td>${escapeHtml(t.itemCode || state.item?.sku)}</td><td>${escapeHtml(t.type)}</td><td>${escapeHtml(t.reference)}</td><td>${escapeHtml(text(t.source))} → ${escapeHtml(text(t.destination))}</td><td class="number">${t.quantityIn?number.format(t.quantityIn):""}</td><td class="number">${t.quantityOut?number.format(t.quantityOut):""}</td><td class="number">${number.format(t.runningBalance)}</td><td>${escapeHtml(t.user)}</td><td>${escapeHtml(t.notes)}</td></tr>`).join("");
    $("transaction-empty").hidden=rows.length>0;
  }
  function formatDate(value) { const d=new Date(value); return Number.isNaN(d.getTime())?text(value):new Intl.DateTimeFormat(config.locale||"en-US",{dateStyle:"medium",timeStyle:"short"}).format(d); }
  function showStatus(message,isError=false){$("status").hidden=false;$("status").textContent=message;$("status").classList.toggle("error",isError)} function hideStatus(){$("status").hidden=true}
  function submitLookup(value){const q=String(value||"").trim();if(!q){showStatus("Enter or scan a barcode or SKU.",true);return}$("scanner-dialog").open&&$("scanner-dialog").close();load(q)}
  $("lookup-button").addEventListener("click",()=>submitLookup($("barcode-input").value)); $("barcode-input").addEventListener("keydown",e=>{if(e.key==="Enter")submitLookup(e.target.value)});
  $("scan-button").addEventListener("click",()=>{$("scanner-dialog").showModal();$("dialog-barcode").value="";setTimeout(()=>$("dialog-barcode").focus(),0)}); $("dialog-find").addEventListener("click",()=>submitLookup($("dialog-barcode").value)); $("dialog-barcode").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();submitLookup(e.target.value)}});
  $("filters").addEventListener("input",renderTransactions); $("filters").addEventListener("change",renderTransactions); $("clear-filters").addEventListener("click",()=>{$("filters").reset();renderTransactions()});
  $("mode-note").textContent="Loaded directly from live Knack views. This page contains no bundled sample records.";
  if (config.defaultItem) load(config.defaultItem);
  else showStatus("Enter or scan a Supplier SKU or OR SKU.");
})();
