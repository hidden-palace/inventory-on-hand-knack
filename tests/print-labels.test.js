import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const source = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "knack-inventory-workflows.js"), "utf8");
const instrumented = source.replace(/\}\)\(\);\s*$/, "globalThis.labelTest = { LABEL_SIZE, LABEL_PRINTER, printLabels }; })();");

function loadLabelCode(userAgent = "Windows") {
  const timers = [];
  const context = {
    navigator: { userAgent, maxTouchPoints: 0 },
    document: {
      createElement: () => ({ textContent: "" }),
      head: { appendChild() {} },
      readyState: "loading",
      addEventListener() {}
    },
    setTimeout(callback) { timers.push(callback); }
  };
  context.globalThis = context;
  vm.runInNewContext(instrumented, context);
  return { ...context.labelTest, timers };
}

test("ZD421 labels are fixed at 3 by 2 inches and retain barcode and price", () => {
  const { LABEL_SIZE, LABEL_PRINTER, printLabels } = loadLabelCode();
  assert.equal(LABEL_SIZE, "3 × 2 inch");
  assert.equal(LABEL_PRINTER, "Zebra ZD421");

  let markup = "";
  const preview = {
    document: {
      open() {},
      write(value) { markup += value; },
      close() {}
    },
    focus() {}
  };
  printLabels([{ quantity: 2, product: {
    name: "Test Vase", barcode: "41636", sku: "UTC-CTR-003", price: 29.95
  } }], preview);

  assert.match(markup, /@page \{ size: 3in 2in; margin: 0; \}/);
  assert.equal((markup.match(/<section class="iw-print-label">/g) || []).length, 2);
  assert.match(markup, /Code 128 barcode 41636/);
  assert.match(markup, /\$29\.95/);
  assert.match(markup, /Zebra ZD421/);
  assert.doesNotMatch(markup, /size: 2in 1in|size: 4in 2in/);
});

test("iPhone label preview does not automatically open AirPrint for a paired ZD421", () => {
  const { printLabels, timers } = loadLabelCode("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)");
  let markup = "";
  printLabels([{ quantity: 1, product: { name: "Test Vase", barcode: "41636", sku: "UTC-CTR-003", price: 29.95 } }], {
    document: { open() {}, write(value) { markup += value; }, close() {} },
    focus() {}
  });
  assert.equal(timers.length, 0);
  assert.match(markup, /Bluetooth does not make it available in iPhone AirPrint/);
  assert.doesNotMatch(markup, /onclick="window\.print\(\)"/);
});
