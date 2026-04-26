#!/usr/bin/env node
// Converts nevup_seed_dataset.csv to a JSON array for the frontend
// Run: node scripts/csv-to-json.js < nevup_seed_dataset.csv > src/data/seed.json

const fs = require("fs");
const readline = require("readline");

const lines = fs.readFileSync("/dev/stdin", "utf-8").trim().split("\n");
const headers = lines[0].split(",");
const trades = [];

for (let i = 1; i < lines.length; i++) {
  // Handle quoted fields
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
    const val = row[idx] || "";
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
  // Derive outcome from pnl
  if (obj.pnl !== null) {
    obj.outcome = obj.pnl >= 0 ? "win" : "loss";
  }
  trades.push(obj);
}

console.log(JSON.stringify(trades, null, 0));
