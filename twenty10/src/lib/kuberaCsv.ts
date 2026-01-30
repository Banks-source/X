import { AssetCategory } from "@/lib/portfolio";

export type KuberaRow = {
  name: string;
  category: AssetCategory;
  value: number;
  asOf: string; // YYYY-MM-DD
};

// MVP: documented expected format.
// Required headers:
// - name
// - category (property|cash|brokerage|crypto|other)
// - value (number)
// Optional:
// - asOf (YYYY-MM-DD). If missing, caller should supply default.
export function parseKuberaCsv(text: string, defaultAsOf: string): KuberaRow[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = {
    name: header.indexOf("name"),
    category: header.indexOf("category"),
    value: header.indexOf("value"),
    asOf: header.indexOf("asof"),
  };

  if (idx.name < 0 || idx.category < 0 || idx.value < 0) {
    throw new Error(
      "CSV headers missing. Expected: name, category, value (optional: asOf).",
    );
  }

  const out: KuberaRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const name = (cols[idx.name] || "").trim();
    const categoryRaw = (cols[idx.category] || "").trim().toLowerCase();
    const valueRaw = (cols[idx.value] || "").trim();
    const asOf =
      (idx.asOf >= 0 ? (cols[idx.asOf] || "").trim() : "") || defaultAsOf;

    if (!name) continue;

    const value = Number(valueRaw.replace(/,/g, ""));
    if (!Number.isFinite(value)) continue;

    const category = normalizeCategory(categoryRaw);

    out.push({ name, category, value, asOf });
  }

  return out;
}

function normalizeCategory(v: string): AssetCategory {
  if (
    v === "property" ||
    v === "cash" ||
    v === "brokerage" ||
    v === "crypto" ||
    v === "other"
  ) {
    return v;
  }
  return "other";
}

function splitCsvLine(line: string): string[] {
  // Minimal CSV parser: handles quoted fields with commas.
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}
