import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const source = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "knack-inventory-workflows.js"), "utf8");
const instrumented = source.replace(/\}\)\(\);\s*$/, "globalThis.labelTest = { LABEL_SIZE, LABEL_PRINTER, printLabels }; })();");

function loadLabelCode() {
  const context = {
    document: {
      createElement: () => ({ textContent: "" }),
      head: { appendChild() {} },
      readyState: "loading",
      addEventListener() {}
    },
    setTimeout() {}
  };
  context.globalThis = context;
  vm.runInNewContext(instrumented, context);
  return context.labelTest;
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
