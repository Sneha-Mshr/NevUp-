#!/usr/bin/env node
// Generates src/data/seed.json from inline CSV data
// Run: node scripts/generate-seed.js

const fs = require("fs");
const path = require("path");

const csvPath = path.join(__dirname, "..", "data", "nevup_seed_dataset.csv");
const outPath = path.join(__dirname, "..", "src", "data", "seed.json");

const raw = fs.readFileSync(csvPath, "utf-8").trim();
const lines = raw.split("\n");
const headers = lines[0].split(",");
const trades = [];

for (let i = 1; i < lines.length; i++) {
  const row = [];
  let current = "";
  let inQuotes = false;
  for (const ch of lines[i]) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { row.push(current); current = ""; continue; }
    current += ch;
  }
  row.push(current);

  const obj = {};
  headers.forEach((h, idx) => {
    const val = (row[idx] || "").trim();
    if (["entryPrice", "exitPrice", "quantity", "pnl"].includes(h)) {
      obj[h] = val ? parseFloat(val) : null;
    } else if (h === "planAdherence") {
      obj[h] = val ? parseInt(val, 10) : null;
    } else if (h === "revengeFlag") {
      obj[h] = val === "true";
    } else {
      obj[h] = val || null;
    }
  });
  if (obj.pnl !== null && obj.pnl !== undefined) {
    obj.outcome = obj.pnl >= 0 ? "win" : "loss";
  }
  trades.push(obj);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(trades));
console.log(`Generated ${trades.length} trades -> ${outPath}`);
