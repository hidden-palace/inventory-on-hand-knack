import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const source = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "knack-inventory-workflows.js"), "utf8");
const styles = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "knack-inventory-workflows.css"), "utf8");
const instrumented = source.replace(/\}\)\(\);\s*$/, "globalThis.labelTest = { LABEL_SIZE, LABEL_PRINTER, printLabels, labelSheetMarkup, zebraLabelFile }; })();");

function loadLabelCode(userAgent = "Windows") {
  const nodes = new Map();
  const listeners = new Map();
  const classes = new Set();
  const context = {
    navigator: { userAgent, maxTouchPoints: 0 },
    document: {
      createElement: () => ({ textContent: "", innerHTML: "", remove() { nodes.delete(this.id); } }),
      getElementById: id => nodes.get(id) || null,
      body: {
        classList: { add: value => classes.add(value), remove: value => classes.delete(value) },
        appendChild(node) { nodes.set(node.id, node); }
      },
      head: { appendChild() {} },
      readyState: "loading",
      addEventListener() {}
    },
    addEventListener(name, callback) { listeners.set(name, callback); },
    print() { context.printCalls += 1; },
    printCalls: 0,
    setTimeout() {}
  };
  context.window = context;
  context.globalThis = context;
  vm.runInNewContext(instrumented, context);
  return { ...context.labelTest, context, nodes, listeners, classes };
}

test("main Print button prepares two 3 by 2 labels and invokes current-page printing", () => {
  const { LABEL_SIZE, LABEL_PRINTER, printLabels, context, nodes, classes } = loadLabelCode("Android 15");
  assert.equal(LABEL_SIZE, "3 × 2 inch");
  assert.equal(LABEL_PRINTER, "Zebra ZD421");

  printLabels([{ quantity: 2, product: {
    name: "Test Vase", barcode: "41636", sku: "UTC-CTR-003", price: 29.95
  } }]);

  const markup = nodes.get("iw-print-sheet").innerHTML;
  assert.equal(context.printCalls, 1);
  assert.equal(classes.has("iw-printing"), true);
  assert.match(styles, /@page \{ size: 3in 2in; margin: 0; \}/);
  assert.equal((markup.match(/<section class="iw-print-label">/g) || []).length, 2);
  assert.match(markup, /Code 128 barcode 41636/);
  assert.match(markup, /\$29\.95/);
  assert.match(styles, /body\.iw-printing > :not\(#iw-print-sheet\) \{ display: none !important; \}/);
});

test("print job is cleared after the dialog closes", () => {
  const { printLabels, nodes, listeners, classes } = loadLabelCode();
  printLabels([{ quantity: 1, product: { name: "Test", barcode: "41636", sku: "ABC", price: 1 } }]);
  listeners.get("afterprint")();
  assert.equal(nodes.has("iw-print-sheet"), false);
  assert.equal(classes.has("iw-printing"), false);
});

test("print failures clean the page and surface an error", () => {
  const { printLabels, context, nodes, classes } = loadLabelCode("Android 15");
  context.print = () => { throw new Error("Printing unavailable"); };
  assert.throws(() => printLabels([{ quantity: 1, product: { name: "Test", barcode: "41636", sku: "ABC", price: 1 } }]), /Printing unavailable/);
  assert.equal(nodes.has("iw-print-sheet"), false);
  assert.equal(classes.has("iw-printing"), false);
});

test("ZPL fallback preserves 3 by 2 media, price, Code 128 and requested copies at either DPI", () => {
  const { zebraLabelFile } = loadLabelCode();
  const entries = [{ quantity: 2, product: { name: "Test Vase", barcode: "41636", sku: "UTC-CTR-003", price: 29.95 } }];
  const high = zebraLabelFile(entries, 300);
  const standard = zebraLabelFile(entries, 203);
  assert.match(high, /\^PW900\n\^LL600/);
  assert.match(standard, /\^PW609\n\^LL406/);
  assert.match(high, /\^BCN,265,Y,N,N\^FD41636\^FS/);
  assert.match(high, /\^FH_\^FD\_24\_32\_39\_2E\_39\_35\^FS/);
  assert.match(high, /\^PQ2,0,0,N/);
  assert.equal((high.match(/\^XA/g) || []).length, 1);
});

test("ZPL fallback rejects command injection, missing codes, bad DPI and invalid quantities", () => {
  const { zebraLabelFile } = loadLabelCode();
  const entry = { quantity: 1, product: { name: "Vase^XZ~JA", barcode: "41636", sku: "VASE", price: 12 } };
  const safe = zebraLabelFile([entry]);
  assert.equal((safe.match(/\^XZ/g) || []).length, 1);
  assert.doesNotMatch(safe, /\^FDVase\^XZ/);
  assert.throws(() => zebraLabelFile([{ ...entry, product: { ...entry.product, barcode: "A^XZ" } }]));
  assert.throws(() => zebraLabelFile([{ ...entry, product: { name: "Empty" } }]));
  assert.throws(() => zebraLabelFile([{ ...entry, quantity: 0 }]));
  assert.throws(() => zebraLabelFile([{ ...entry, product: { ...entry.product, barcode: "123456789012345678901" } }], 203));
  assert.throws(() => zebraLabelFile([entry], 600));
});
