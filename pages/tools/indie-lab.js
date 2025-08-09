// pages/tools/indie-lab.js
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Indie Perfumers Toolkit V3 — PFC
 * Framework: Next.js pages router + TailwindCSS
 * All-client-side, no external libs, mobile-first, dark UI.
 *
 * Tabs:
 * 1) Costing       — Ingredient-level COGS, packaging, overhead, markup to retail
 * 2) Batching      — Dilution calculator with temp-aware ethanol density and g/mL outputs
 * 3) Composer      — Top/Heart/Base builder with volatility & substantivity; 8h evaporation curve
 * 4) Pyramid       — Note pyramid designer; export PNG from canvas
 * 5) Compliance    — Common allergens scan (limonene, linalool, citral, coumarin...), thresholds & label checklist
 * 6) Testing       — Wear test logs (skin type, climate, longevity), saved locally
 * 7) AI Assist     — Rule-based accord suggestions (no internet)
 *
 * Data & Logic Notes (industry-aligned heuristics, simplified for v3):
 * - Each material has: density (g/mL), volatility index (0-1 higher=more volatile), substantivity hours,
 *   suggested max % (IFRA-style guidance placeholder), and typical price range (editable by user).
 * - Ethanol density varies with temperature; we approximate a small linear correction around 20–25°C for practical lab use.
 * - Evaporation curve: sum of decays (exp(-k*t)) where k derived from volatility; normalized to 8h window.
 * - Allergen thresholds: EU leave-on typical disclosure ~0.001% (rinse-off higher). We use common ones for demo; user can edit.
 * - Retail tiers: indie 2.5–3.5x COGS; niche 4–6x; luxury 8–10x (editable).
 *
 * DISCLAIMER: This is a helper tool. Always verify final IFRA category/limits and local regulations for products.
 */

/* ------------------------------ Small DB ------------------------------ */
// Minimal starter set; users can add/edit in UI. densities (g/mL) approximate.
const STARTER_MATERIALS = [
  { name: "Limonene (citrus terpene)", family: "Citrus", density: 0.84, volatility: 0.95, substantivityH: 0.5, ifraMaxPct: 2, pricePerG: 45 },
  { name: "Linalool", family: "Floral", density: 0.86, volatility: 0.9, substantivityH: 1.0, ifraMaxPct: 3, pricePerG: 60 },
  { name: "Hedione (Methyl dihydrojasmonate)", family: "Floral", density: 1.05, volatility: 0.6, substantivityH: 6, ifraMaxPct: 35, pricePerG: 85 },
  { name: "Iso E Super", family: "Woody", density: 0.95, volatility: 0.55, substantivityH: 8, ifraMaxPct: 50, pricePerG: 70 },
  { name: "Ambroxan", family: "Amber", density: 1.05, volatility: 0.35, substantivityH: 24, ifraMaxPct: 15, pricePerG: 140 },
  { name: "Vanillin", family: "Gourmand", density: 1.06, volatility: 0.45, substantivityH: 12, ifraMaxPct: 8, pricePerG: 120 },
  { name: "Cashmeran", family: "Woody", density: 0.98, volatility: 0.5, substantivityH: 10, ifraMaxPct: 20, pricePerG: 160 },
  { name: "Coumarin", family: "Gourmand", density: 0.93, volatility: 0.6, substantivityH: 4, ifraMaxPct: 4, pricePerG: 100 },
  { name: "Cedarwood Atlas EO", family: "Woody", density: 0.94, volatility: 0.5, substantivityH: 6, ifraMaxPct: 5, pricePerG: 90 },
  { name: "Patchouli EO", family: "Woody", density: 0.97, volatility: 0.35, substantivityH: 24, ifraMaxPct: 5, pricePerG: 150 },
];

const ALLERGENS = [
  { name: "Limonene", thresholdPct: 0.001 },
  { name: "Linalool", thresholdPct: 0.001 },
  { name: "Citral", thresholdPct: 0.001 },
  { name: "Coumarin", thresholdPct: 0.001 },
  { name: "Eugenol", thresholdPct: 0.001 },
  { name: "Cinnamal", thresholdPct: 0.001 },
];

/* Ethanol density vs temp (approx around lab temps) in g/mL.
   Real curve is non-linear; we use a practical linearized piece for 10–35°C. */
function ethanolDensityAtC(tempC) {
  // Approx 0.789 g/mL @ 20°C; ~-0.0003 per °C
  return round4(0.789 - (tempC - 20) * 0.0003);
}

const FAMILIES = ["Citrus", "Floral", "Aromatic", "Woody", "Amber", "Gourmand", "Musky"];

/* ------------------------------ Page ------------------------------ */
export default function IndieLab() {
  const [tab, setTab] = useState("costing"); // costing | batching | composer | pyramid | compliance | testing | ai
  // Persist which tab last used
  useEffect(() => {
    const saved = localStorage.getItem("pfc_indie_lab_tab");
    if (saved) setTab(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("pfc_indie_lab_tab", tab);
  }, [tab]);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-30 backdrop-blur border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">PFC • Indie Perfumers Toolkit</h1>
          <a href="/" className="text-xs sm:text-sm text-neutral-400 hover:text-neutral-200 underline">Home</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs tab={tab} setTab={setTab} />
        <section className="mt-5 sm:mt-6 space-y-6">
          {tab === "costing" && <Costing />}
          {tab === "batching" && <Batching />}
          {tab === "composer" && <Composer />}
          {tab === "pyramid" && <Pyramid />}
          {tab === "compliance" && <Compliance />}
          {tab === "testing" && <Testing />}
          {tab === "ai" && <AIAssist />}
        </section>

        <footer className="pt-8 pb-10 text-center text-xs text-neutral-500">
          Built for indie perfumers • All on-device • Verify regulations for your market
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------ Tabs ------------------------------ */
function Tabs({ tab, setTab }) {
  const items = [
    ["costing", "Costing"],
    ["batching", "Batching"],
    ["composer", "Composer"],
    ["pyramid", "Pyramid"],
    ["compliance", "Compliance"],
    ["testing", "Testing"],
    ["ai", "AI Assist"],
  ];
  return (
    <nav className="sticky top-[52px] z-20 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 text-xs sm:text-sm">
        {items.map(([id, label], i) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-3 py-2 sm:py-3 border-r border-white/10 last:border-r-0 transition ${
              tab === id ? "bg-white/10 text-white font-medium" : "text-neutral-300 hover:text-white hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------ Costing ------------------------------ */
function Costing() {
  const [materials, setMaterials] = useLS("pfc_cost_materials", STARTER_MATERIALS);
  const [rows, setRows] = useLS("pfc_cost_rows", [
    { material: "Iso E Super", pct: 25, pricePerG: 70 },
    { material: "Hedione (Methyl dihydrojasmonate)", pct: 20, pricePerG: 85 },
    { material: "Ambroxan", pct: 5, pricePerG: 140 },
    { material: "Vanillin", pct: 2, pricePerG: 120 },
  ]);
  const [batchMl, setBatchMl] = useLSNumber("pfc_cost_batch_ml", 1000);
  const [spraysPerMl, setSpraysPerMl] = useLSNumber("pfc_cost_spr", 12);
  const [packCost, setPackCost] = useLSNumber("pfc_cost_pack", 350); // bottle+cap+label per unit (PKR)
  const [laborPct, setLaborPct] = useLSNumber("pfc_cost_labor", 10);
  const [overheadPct, setOverheadPct] = useLSNumber("pfc_cost_over", 12);
  const [tier, setTier] = useLS("pfc_cost_tier", "niche"); // indie | niche | luxury

  // Ensure % sum <= 100
  const pctSum = rows.reduce((a, r) => a + (Number(r.pct) || 0), 0);
  const pctOk = pctSum <= 100;

  const computed = useMemo(() => {
    // Resolve price per G from materials DB if not provided
    const withMeta = rows.map((r) => {
      const m = materials.find((x) => x.name === r.material);
      return {
        ...r,
        density: m?.density ?? 1,
        pricePerG: Number(r.pricePerG ?? m?.pricePerG ?? 100),
        ifraMaxPct: m?.ifraMaxPct ?? 100,
      };
    });

    // Total oil grams (assuming base density ~1g/mL for simplicity of oil phase)
    const oilPct = pctSum;
    const oilMl = (oilPct / 100) * batchMl;
    const oilG = oilMl * 0.95; // assume average oil density 0.95 g/mL
    const ethanolMl = batchMl - oilMl;
    const ethanolG = ethanolMl * ethanolDensityAtC(22);

    const compLines = withMeta.map((r) => {
      const compMl = (r.pct / 100) * batchMl;
      const compG = compMl * r.density;
      const cost = compG * r.pricePerG;
      return { ...r, compMl, compG, cost };
    });
    const rawCost = compLines.reduce((a, x) => a + x.cost, 0);
    const labor = (laborPct / 100) * rawCost;
    const overhead = (overheadPct / 100) * rawCost;
    const cogsBatch = rawCost + labor + overhead;

    // Per bottle metrics (assume 50mL SKU as reference)
    const units50 = Math.floor(batchMl / 50);
    const cogsPer50 = units50 ? (cogsBatch / units50) : 0;
    const cogsPer50PlusPack = cogsPer50 + packCost;

    const sprays = Math.round(batchMl * spraysPerMl);
    const cogsPerMl = cogsBatch / Math.max(1, batchMl);

    // Tiered retail ranges
    const tierRange = {
      indie: [2.5, 3.5],
      niche: [4, 6],
      luxury: [8, 10],
    }[tier] || [4, 6];

    const retailLow = cogsPer50PlusPack * tierRange[0];
    const retailHigh = cogsPer50PlusPack * tierRange[1];
    const mid = (retailLow + retailHigh) / 2;
    const gpMargin = (retail) => ((retail - cogsPer50PlusPack) / retail) * 100;

    const warnings = [];
    if (!pctOk) warnings.push("Total formula % exceeds 100%.");
    compLines.forEach((x) => {
      if (x.pct > x.ifraMaxPct) warnings.push(`${x.material}: usage ${x.pct}% exceeds suggested max ${x.ifraMaxPct}%.`);
    });

    return {
      compLines,
      rawCost,
      oilG,
      ethanolG,
      cogsBatch,
      cogsPerMl,
      units50,
      cogsPer50PlusPack,
      sprays,
      retailLow,
      retailHigh,
      retailMid: mid,
      marginLow: gpMargin(retailLow),
      marginMid: gpMargin(mid),
      marginHigh: gpMargin(retailHigh),
      warnings,
    };
  }, [rows, materials, batchMl, laborPct, overheadPct, tier, pctOk, packCost, spraysPerMl, pctSum]);

  const addRow = () =>
    setRows([...rows, { material: materials[0]?.name || "", pct: 1, pricePerG: materials[0]?.pricePerG || 100 }]);

  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const exportCSV = () => {
    const header = [
      "Material",
      "Percent(%)",
      "Density(g/mL)",
      "Comp(mL)",
      "Comp(g)",
      "Price/g",
      "Cost(PKR)",
    ].join(",");
    const lines = computed.compLines
      .map((x) => [x.material, x.pct, x.density, round4(x.compMl), round4(x.compG), x.pricePerG, round2(x.cost)].join(","))
      .join("\n");
    const meta = [
      "",
      `Batch(mL),${batchMl}`,
      `COGS Batch(PKR),${round2(computed.cogsBatch)}`,
      `COGS/mL(PKR),${round4(computed.cogsPerMl)}`,
      `Units@50mL,${computed.units50}`,
      `COGS+Pack per 50mL(PKR),${round2(computed.cogsPer50PlusPack)}`,
      `RetailLow(PKR),${round2(computed.retailLow)}`,
      `RetailMid(PKR),${round2(computed.retailMid)}`,
      `RetailHigh(PKR),${round2(computed.retailHigh)}`,
    ].join("\n");
    download("formula_costing.csv", [header, lines, meta].join("\n"));
  };

  return (
    <Card title="Formula Cost & Retail Calculator">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumberInput label="Batch Size (mL)" value={batchMl} setValue={setBatchMl} />
        <NumberInput label="Sprays per mL" value={spraysPerMl} setValue={setSpraysPerMl} />
        <NumberInput label="Packaging Cost (per 50mL, PKR)" value={packCost} setValue={setPackCost} />
        <Select label="Retail Tier" value={tier} onChange={setTier} options={[["indie","Indie 2.5–3.5x"],["niche","Niche 4–6x"],["luxury","Luxury 8–10x"]]} />
        <NumberInput label="Labor % of Raw" value={laborPct} setValue={setLaborPct} />
        <NumberInput label="Overhead % of Raw" value={overheadPct} setValue={setOverheadPct} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-neutral-300">
            <tr>
              <th className="px-3 py-2 text-left">Material</th>
              <th className="px-3 py-2 text-right">%</th>
              <th className="px-3 py-2 text-right">Density</th>
              <th className="px-3 py-2 text-right">Price/g</th>
              <th className="px-3 py-2 text-right">Comp (mL)</th>
              <th className="px-3 py-2 text-right">Comp (g)</th>
              <th className="px-3 py-2 text-right">Cost</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const m = materials.find((x) => x.name === r.material);
              const density = m?.density ?? 1;
              const compMl = (Number(r.pct) / 100) * batchMl;
              const compG = compMl * density;
              const priceG = Number(r.pricePerG ?? m?.pricePerG ?? 100);
              const cost = compG * priceG;
              return (
                <tr key={i} className="border-t border-white/10">
                  <td className="px-3 py-2">
                    <datalist id="materials">
                      {materials.map((x) => <option key={x.name} value={x.name} />)}
                    </datalist>
                    <input list="materials" className="w-full bg-transparent border border-white/10 rounded px-2 py-1"
                      value={r.material}
                      onChange={(e) => updateRow(setRows, rows, i, { material: e.target.value })} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-right"
                      value={r.pct}
                      onChange={(e) => updateRow(setRows, rows, i, { pct: num(e) })} />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{round3(density)}</td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-right"
                      value={r.pricePerG ?? m?.pricePerG ?? 100}
                      onChange={(e) => updateRow(setRows, rows, i, { pricePerG: num(e) })} />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{round2(compMl)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{round2(compG)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{round2(cost)}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => removeRow(i)} className="text-xs text-neutral-400 hover:text-neutral-200 underline">Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button onClick={addRow} className="px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-neutral-100">+ Add Material</button>
        <button onClick={exportCSV} className="px-3 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/10">Export CSV</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        <KPI label="COGS Batch (PKR)" value={round2(computed.cogsBatch)} />
        <KPI label="COGS / mL (PKR)" value={round4(computed.cogsPerMl)} />
        <KPI label="Units @ 50mL" value={computed.units50} />
        <KPI label="COGS+Pack / 50 (PKR)" value={round2(computed.cogsPer50PlusPack)} />
        <KPI label="Retail Mid (PKR/50)" value={round2(computed.retailMid)} />
        <KPI label="Margin @ Mid (%)" value={round1(computed.marginMid)} />
      </div>

      {computed.warnings.length > 0 && (
        <div className="mt-3 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="font-semibold mb-1">Warnings</div>
          <ul className="list-disc pl-5 space-y-1">
            {computed.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------ Batching ------------------------------ */
function Batching() {
  const [totalMl, setTotalMl] = useLSNumber("pfc_batch_total", 1000);
  const [concPct, setConcPct] = useLSNumber("pfc_batch_conc", 20); // perfume oil %
  const [tempC, setTempC] = useLSNumber("pfc_batch_temp", 22);
  const [oilDensity, setOilDensity] = useLSNumber("pfc_batch_oild", 0.95); // avg oil density
  const [solvent, setSolvent] = useLS("pfc_batch_solv", "Ethanol 95%");
  const solventDensity = useMemo(() => (solvent.includes("Ethanol") ? ethanolDensityAtC(tempC) : 1.02), [solvent, tempC]); // DPG ~1.02

  const oilMl = (concPct / 100) * totalMl;
  const solMl = totalMl - oilMl;
  const oilG = oilMl * oilDensity;
  const solG = solMl * solventDensity;

  const warn = [];
  if (concPct > 45) warn.push("Concentration unusually high; verify solubility and IFRA category.");
  if (tempC < 10 || tempC > 35) warn.push("Mixing temperature outside typical lab range (10–35°C).");

  const exportBatchCSV = () => {
    const header = "Param,Value";
    const lines = [
      ["Total (mL)", totalMl],
      ["Concentration (%)", concPct],
      ["Temperature (°C)", tempC],
      ["Solvent", solvent],
      ["Oil Density (g/mL)", oilDensity],
      ["Solvent Density (g/mL)", solventDensity],
      ["Oil (mL)", round2(oilMl)],
      ["Oil (g)", round2(oilG)],
      ["Solvent (mL)", round2(solMl)],
      ["Solvent (g)", round2(solG)],
    ].map((row) => row.join(","));
    download("batching.csv", [header, ...lines].join("\n"));
  };

  return (
    <Card title="Dilution & Batch Maker">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NumberInput label="Batch Size (mL)" value={totalMl} setValue={setTotalMl} />
        <NumberInput label="Concentration (%)" value={concPct} setValue={setConcPct} />
        <NumberInput label="Temperature (°C)" value={tempC} setValue={setTempC} />
        <Select label="Solvent" value={solvent} onChange={setSolvent} options={[["Ethanol 95%","Ethanol 95%"],["DPG","DPG"],["IPM","IPM"]]} />
        <NumberInput label="Oil Density (g/mL)" value={oilDensity} setValue={setOilDensity} />
        <Static label="Solvent Density (g/mL)" value={round4(solventDensity)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <KPI label="Oil (mL)" value={round2(oilMl)} />
        <KPI label="Oil (g)" value={round2(oilG)} />
        <KPI label="Solvent (mL)" value={round2(solMl)} />
        <KPI label="Solvent (g)" value={round2(solG)} />
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={exportBatchCSV} className="px-3 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/10">Export CSV</button>
      </div>

      {warn.length > 0 && (
        <div className="mt-3 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="font-semibold mb-1">Warnings</div>
          <ul className="list-disc pl-5 space-y-1">
            {warn.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------ Composer ------------------------------ */
function Composer() {
  // Materials table for building accords
  const [materials, setMaterials] = useLS("pfc_comp_materials", STARTER_MATERIALS);
  const [accord, setAccord] = useLS("pfc_comp_rows", [
    { name: "Iso E Super", lane: "Base", pct: 20 },
    { name: "Hedione (Methyl dihydrojasmonate)", lane: "Heart", pct: 15 },
    { name: "Limonene (citrus terpene)", lane: "Top", pct: 5 },
  ]);
  const [durationH, setDurationH] = useLSNumber("pfc_comp_dur", 8);
  const [skin, setSkin] = useLS("pfc_comp_skin", "normal"); // dry normal oily

  const pctSum = accord.reduce((a, r) => a + (Number(r.pct) || 0), 0);
  const lanes = ["Top", "Heart", "Base"];

  // Curve generation: sum intensity over time
  const curve = useMemo(() => {
    const steps = 48; // per 10 min over 8h
    const dt = durationH / steps;
    const xs = Array.from({ length: steps + 1 }, (_, i) => i * dt);
    const ys = xs.map((t) => 0);

    accord.forEach((r) => {
      const m = materials.find((x) => x.name === r.name);
      if (!m) return;
      const v = clamp(m.volatility, 0.05, 0.98);
      // base decay rate: more volatile = faster decay
      let k = 0.4 + v * 1.2;
      // substantivity stretches tail
      k *= 1 - clamp((m.substantivityH || 4) / 30, 0, 0.5);
      // skin effect
      const skinAdj = skin === "dry" ? 0.1 : skin === "oily" ? -0.05 : 0;
      k *= 1 + skinAdj;

      const weight = r.pct / Math.max(1, pctSum);
      xs.forEach((t, idx) => {
        const intensity = Math.exp(-k * (t / durationH));
        ys[idx] += weight * intensity;
      });
    });

    // normalize 0..1
    const max = Math.max(...ys, 1e-6);
    const norm = ys.map((y) => y / max);
    return { xs, ys: norm };
  }, [accord, materials, durationH, skin, pctSum]);

  // Balance tips
  const laneTotals = lanes.map((L) =>
    accord.filter((r) => r.lane === L).reduce((a, r) => a + (Number(r.pct) || 0), 0)
  );
  const tips = [];
  if (laneTotals[0] > laneTotals[2] * 1.8) tips.push("Top-heavy: add fixatives (musks/amber) to extend base.");
  if (laneTotals[2] > laneTotals[0] * 2) tips.push("Base-heavy: brighten top with citrus or aromatics.");
  if (laneTotals[1] < 10) tips.push("Heart is thin: consider florals/green to bridge top and base.");
  if (pctSum !== 100) tips.push("For a finished formula, normalize to 100%.");

  const add = () => setAccord([...accord, { name: materials[0]?.name || "", lane: "Top", pct: 1 }]);
  const remove = (i) => setAccord(accord.filter((_, idx) => idx !== i));

  return (
    <Card title="Accord Composer & Evaporation Curve">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <NumberInput label="Duration (hours)" value={durationH} setValue={setDurationH} />
        <Select label="Skin Type" value={skin} onChange={setSkin} options={[["dry","Dry"],["normal","Normal"],["oily","Oily"]]} />
        <Static label="Sum %" value={round1(pctSum)} />
        <Static label="Top/Heart/Base %" value={`${round1(laneTotals[0])}/${round1(laneTotals[1])}/${round1(laneTotals[2])}`} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-neutral-300">
            <tr>
              <th className="px-3 py-2 text-left">Material</th>
              <th className="px-3 py-2 text-left">Lane</th>
              <th className="px-3 py-2 text-right">%</th>
              <th className="px-3 py-2 text-left">Family</th>
              <th className="px-3 py-2 text-right">Volatility</th>
              <th className="px-3 py-2 text-right">Subst. (h)</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {accord.map((r, i) => {
              const m = materials.find((x) => x.name === r.name);
              return (
                <tr key={i} className="border-t border-white/10">
                  <td className="px-3 py-2">
                    <datalist id="comp_mats">
                      {materials.map((x) => <option key={x.name} value={x.name} />)}
                    </datalist>
                    <input list="comp_mats" className="w-full bg-transparent border border-white/10 rounded px-2 py-1"
                      value={r.name}
                      onChange={(e) => updateRow(setAccord, accord, i, { name: e.target.value })} />
                  </td>
                  <td className="px-3 py-2">
                    <select className="w-full bg-transparent border border-white/10 rounded px-2 py-1"
                      value={r.lane}
                      onChange={(e) => updateRow(setAccord, accord, i, { lane: e.target.value })}>
                      {["Top","Heart","Base"].map(x => <option key={x} value={x}>{x}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-right"
                      value={r.pct}
                      onChange={(e) => updateRow(setAccord, accord, i, { pct: num(e) })} />
                  </td>
                  <td className="px-3 py-2">{m?.family || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{m ? round2(m.volatility) : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{m ? round1(m.substantivityH) : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => remove(i)} className="text-xs text-neutral-400 hover:text-neutral-200 underline">Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button onClick={add} className="px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-neutral-100">+ Add Component</button>
      </div>

      <CurveChart xs={curve.xs} ys={curve.ys} />

      {tips.length > 0 && (
        <div className="mt-3 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <div className="font-semibold mb-1">Suggestions</div>
          <ul className="list-disc pl-5 space-y-1">
            {tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}

function CurveChart({ xs, ys }) {
  // Simple SVG line chart
  const w = 600, h = 200, pad = 24;
  const maxX = xs[xs.length - 1] || 1;
  const toX = (x) => pad + (x / maxX) * (w - 2 * pad);
  const toY = (y) => h - pad - y * (h - 2 * pad);

  const path = ys.map((y, i) => `${i === 0 ? "M" : "L"} ${toX(xs[i]).toFixed(2)} ${toY(y).toFixed(2)}`).join(" ");

  return (
    <div className="overflow-x-auto mt-4">
      <svg width={w} height={h} className="min-w-full">
        <rect x="0" y="0" width={w} height={h} fill="transparent" />
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
          <line key={i} x1={pad} y1={toY(g)} x2={w - pad} y2={toY(g)} stroke="rgba(255,255,255,0.08)" />
        ))}
        {/* axes */}
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="rgba(255,255,255,0.3)" />
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(255,255,255,0.3)" />
        {/* path */}
        <path d={path} fill="none" stroke="white" strokeWidth="2" />
        <text x={w - pad} y={h - 6} textAnchor="end" className="fill-white" fontSize="10">Time (h)</text>
        <text x={pad} y={12} className="fill-white" fontSize="10">Intensity</text>
      </svg>
    </div>
  );
}

/* ------------------------------ Pyramid ------------------------------ */
function Pyramid() {
  const [brand, setBrand] = useLS("pfc_pyr_brand", "Your Brand");
  const [name, setName] = useLS("pfc_pyr_name", "Fragrance Name");
  const [top, setTop] = useLS("pfc_pyr_top", "Bergamot, Lemon, Grapefruit");
  const [heart, setHeart] = useLS("pfc_pyr_heart", "Hedione, Jasmine, Lavender");
  const [base, setBase] = useLS("pfc_pyr_base", "Iso E Super, Ambroxan, Vanilla");
  const [theme, setTheme] = useLS("pfc_pyr_theme", "Luxe"); // Minimal | Luxe | Vintage

  const canvasRef = useRef(null);

  const exportPNG = () => {
    const c = canvasRef.current;
    if (!c) return;
    const url = c.toDataURL("image/png");
    downloadURL(url, `${slug(brand)}_${slug(name)}_pyramid.png`);
  };

  // Draw pyramid
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const W = 1000, H = 1000;
    c.width = W; c.height = H;

    // Theme colors
    const palette = {
      Minimal: { bg: "#0B0B0E", fg: "#FFFFFF", acc: "#A3A3A3" },
      Luxe: { bg: "#0B0B0E", fg: "#F8F8F8", acc: "#D4AF37" },
      Vintage: { bg: "#0E0B09", fg: "#F5F2E7", acc: "#C7A27C" },
    }[theme] || { bg: "#0B0B0E", fg: "#FFFFFF", acc: "#D4AF37" };

    // Background
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = palette.fg;
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(brand, W/2, 90);
    ctx.font = "600 36px sans-serif";
    ctx.fillText(name, W/2, 140);

    // Pyramid levels
    const levels = [
      { y: 300, text: top, label: "TOP" },
      { y: 540, text: heart, label: "HEART" },
      { y: 780, text: base, label: "BASE" },
    ];

    levels.forEach((L, idx) => {
      const width = 700 - idx * 140;
      const height = 160;
      const x = (W - width) / 2;

      // Frame
      ctx.strokeStyle = palette.acc;
      ctx.lineWidth = 2;
      roundRect(ctx, x, L.y - height/2, width, height, 18, false, true);

      // Label
      ctx.fillStyle = palette.acc;
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(L.label, x + 16, L.y - height/2 - 14);

      // Text
      ctx.fillStyle = palette.fg;
      ctx.font = "22px sans-serif";
      ctx.textAlign = "center";
      wrapText(ctx, L.text, W/2, L.y, width - 40, 28);
    });

    // Footer
    ctx.fillStyle = palette.acc;
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Pakistan Fragrance Community — Note Pyramid", W/2, H - 40);
  }, [brand, name, top, heart, base, theme]);

  return (
    <Card title="Note Pyramid Designer (PNG Export)">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextInput label="Brand" value={brand} setValue={setBrand} />
        <TextInput label="Fragrance Name" value={name} setValue={setName} />
        <Textarea label="Top Notes (comma-separated)" value={top} setValue={setTop} />
        <Textarea label="Heart Notes" value={heart} setValue={setHeart} />
        <Textarea label="Base Notes" value={base} setValue={setBase} />
        <Select label="Theme" value={theme} onChange={setTheme} options={[["Minimal","Minimal"],["Luxe","Luxe"],["Vintage","Vintage"]]} />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 overflow-hidden">
        <canvas ref={canvasRef} className="block w-full h-auto" />
      </div>

      <div className="flex gap-3 mt-3">
        <button onClick={exportPNG} className="px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-neutral-100">
          Export PNG
        </button>
      </div>
    </Card>
  );
}

/* ------------------------------ Compliance ------------------------------ */
function Compliance() {
  const [formulaPct, setFormulaPct] = useLS("pfc_comp_formula", [
    { name: "Limonene (citrus terpene)", pct: 1.2 },
    { name: "Linalool", pct: 0.4 },
    { name: "Coumarin", pct: 0.2 },
  ]);
  const [market, setMarket] = useLS("pfc_comp_market", "EU");

  // Allergen scan
  const flags = formulaPct
    .map((c) => {
      const allergen = ALLERGENS.find((a) => c.name.toLowerCase().includes(a.name.toLowerCase()));
      if (!allergen) return null;
      return { name: allergen.name, pct: c.pct, threshold: allergen.thresholdPct, over: c.pct >= allergen.thresholdPct };
    })
    .filter(Boolean);

  const checklist = {
    EU: [
      "INCI ingredients list (descending concentration after 1% threshold rules).",
      "Allergens above thresholds listed separately (e.g., Limonene, Linalool).",
      "Flammable pictogram if ethanol-based.",
      "Batch code and best-before if required.",
      "Responsible person & address.",
    ],
    US: [
      "Ingredient declaration (IFRA-aligned nomenclature where applicable).",
      "Flammable warning if ethanol-based.",
      "Net contents, manufacturer or distributor.",
      "Batch/lot code.",
    ],
    ME: [
      "Ingredients in English/Arabic as required.",
      "Flammability & storage warnings.",
      "Importer details if applicable.",
      "Batch/lot code.",
    ],
  }[market];

  return (
    <Card title="Compliance & Label Helper (Common Allergens)">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select label="Target Market" value={market} onChange={setMarket} options={[["EU","EU"],["US","US"],["ME","Middle East"]]} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-neutral-300">
            <tr>
              <th className="px-3 py-2 text-left">Component</th>
              <th className="px-3 py-2 text-right">%</th>
              <th className="px-3 py-2 text-left">Allergen Match</th>
              <th className="px-3 py-2 text-right">Threshold %</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {formulaPct.map((r, i) => {
              const allergen = ALLERGENS.find((a) => r.name.toLowerCase().includes(a.name.toLowerCase()));
              const status = allergen
                ? r.pct >= allergen.thresholdPct
                  ? "Label: Required"
                  : "Label: Optional (below threshold)"
                : "—";
              return (
                <tr key={i} className="border-t border-white/10">
                  <td className="px-3 py-2">
                    <input className="w-full bg-transparent border border-white/10 rounded px-2 py-1"
                      value={r.name}
                      onChange={(e) => updateRow(setFormulaPct, formulaPct, i, { name: e.target.value })} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-right"
                      value={r.pct}
                      onChange={(e) => updateRow(setFormulaPct, formulaPct, i, { pct: num(e) })} />
                  </td>
                  <td className="px-3 py-2">{allergen?.name || "—"}</td>
                  <td className="px-3 py-2 text-right">{allergen ? allergen.thresholdPct : "—"}</td>
                  <td className="px-3 py-2">{status}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => removeAt(setFormulaPct, formulaPct, i)} className="text-xs text-neutral-400 hover:text-neutral-200 underline">Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button onClick={() => setFormulaPct([...formulaPct, { name: "", pct: 0 }])} className="px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-neutral-100">
          + Add Component
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 p-3 text-xs text-neutral-300">
        <div className="font-semibold mb-2">Label Checklist ({market})</div>
        <ul className="list-disc pl-5 space-y-1">
          {checklist.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
        <p className="mt-3 text-neutral-400">Always confirm IFRA Category and latest regulatory updates for your formula.</p>
      </div>
    </Card>
  );
}

/* ------------------------------ Testing ------------------------------ */
function Testing() {
  const [logs, setLogs] = useLS("pfc_test_logs", []);
  const [entry, setEntry] = useState({
    date: todayISO(),
    sample: "Batch A",
    skin: "normal",
    climate: "mild", // hot/humid/cold/dry
    sprays: 4,
    longevityH: 6,
    projection: "personal", // intimate/personal/public
    notes: "",
  });

  const add = () => {
    setLogs([{ ...entry, id: Date.now() }, ...logs]);
  };
  const remove = (id) => setLogs(logs.filter((x) => x.id !== id));

  const exportCSV = () => {
    const header = "Date,Sample,Skin,Climate,Sprays,Longevity(h),Projection,Notes";
    const lines = logs.map((l) =>
      [l.date, l.sample, l.skin, l.climate, l.sprays, l.longevityH, l.projection, JSON.stringify(l.notes || "")].join(",")
    );
    download("wear_tests.csv", [header, ...lines].join("\n"));
  };

  return (
    <Card title="Wear Test Tracker">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TextInput label="Date" value={entry.date} setValue={(v) => setEntry({ ...entry, date: v })} type="date" />
        <TextInput label="Sample/Batch" value={entry.sample} setValue={(v) => setEntry({ ...entry, sample: v })} />
        <Select label="Skin" value={entry.skin} onChange={(v) => setEntry({ ...entry, skin: v })} options={[["dry","Dry"],["normal","Normal"],["oily","Oily"]]} />
        <Select label="Climate" value={entry.climate} onChange={(v) => setEntry({ ...entry, climate: v })} options={[["mild","Mild"],["hot","Hot"],["humid","Humid"],["cold","Cold"],["dry","Dry"]]} />
        <NumberInput label="Sprays" value={entry.sprays} setValue={(v) => setEntry({ ...entry, sprays: v })} />
        <NumberInput label="Longevity (h)" value={entry.longevityH} setValue={(v) => setEntry({ ...entry, longevityH: v })} />
        <Select label="Projection" value={entry.projection} onChange={(v) => setEntry({ ...entry, projection: v })} options={[["intimate","Intimate"],["personal","Personal"],["public","Public"]]} />
        <Textarea label="Notes" value={entry.notes} setValue={(v) => setEntry({ ...entry, notes: v })} />
      </div>

      <div className="flex gap-3 mt-3">
        <button onClick={add} className="px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-neutral-100">+ Add Log</button>
        <button onClick={exportCSV} className="px-3 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/10">Export CSV</button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-neutral-300">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Sample</th>
              <th className="px-3 py-2">Skin</th>
              <th className="px-3 py-2">Climate</th>
              <th className="px-3 py-2 text-right">Sprays</th>
              <th className="px-3 py-2 text-right">Longevity</th>
              <th className="px-3 py-2">Projection</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-white/10">
                <td className="px-3 py-2">{l.date}</td>
                <td className="px-3 py-2">{l.sample}</td>
                <td className="px-3 py-2">{cap(l.skin)}</td>
                <td className="px-3 py-2">{cap(l.climate)}</td>
                <td className="px-3 py-2 text-right">{l.sprays}</td>
                <td className="px-3 py-2 text-right">{l.longevityH}h</td>
                <td className="px-3 py-2">{cap(l.projection)}</td>
                <td className="px-3 py-2">{l.notes}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => remove(l.id)} className="text-xs text-neutral-400 hover:text-neutral-200 underline">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------------------ AI Assist ------------------------------ */
function AIAssist() {
  const [style, setStyle] = useLS("pfc_ai_style", "Fresh aquatic summer");
  const [intensity, setIntensity] = useLSNumber("pfc_ai_int", 3); // 1-5
  const [result, setResult] = useState(null);

  const suggest = () => {
    // Rule-based matrix using family archetypes & intensity
    const rules = {
      "Fresh aquatic summer": {
        Top: ["Bergamot", "Grapefruit", "Aldehydes"],
        Heart: ["Hedione", "Lavender", "Marine accord"],
        Base: ["Iso E Super", "Ambroxan", "White Musk"],
      },
      "Warm amber evening": {
        Top: ["Saffron", "Pink Pepper"],
        Heart: ["Rose", "Jasmine", "Amber accord"],
        Base: ["Vanillin", "Labdanum", "Patchouli", "Ambroxan"],
      },
      "Woody green daytime": {
        Top: ["Green notes", "Galbanum", "Petitgrain"],
        Heart: ["Violet leaf", "Cypress", "Cedar"],
        Base: ["Iso E Super", "Vetiver", "Musk"],
      },
    };
    const picked = rules[style] || rules["Fresh aquatic summer"];
    // Intensity scales base % heavier for higher 1..5
    const scale = (lane) => {
      const base = lane === "Top" ? 25 : lane === "Heart" ? 35 : 40;
      const adj = lane === "Base" ? intensity * 3 : intensity * 1.5;
      return Math.round(base + adj);
    };
    setResult({
      Top: { notes: picked.Top, targetPct: scale("Top") },
      Heart: { notes: picked.Heart, targetPct: scale("Heart") },
      Base: { notes: picked.Base, targetPct: scale("Base") },
      Tips: [
        "Balance Top/Heart/Base to ~30/40/30 for fresh; ~20/40/40 for evening amber.",
        "Use small musks (0.2–1%) to smooth harsh edges.",
      ],
    });
  };

  return (
    <Card title="AI Accord Suggestor (Rule-based, Offline)">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <TextInput label="Desired Style" value={style} setValue={setStyle} placeholder='e.g., "Fresh aquatic summer"' />
        <RangeInput label="Intensity (1–5)" min={1} max={5} value={intensity} setValue={setIntensity} />
      </div>
      <div className="flex gap-3 mt-3">
        <button onClick={suggest} className="px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-neutral-100">Generate Suggestion</button>
      </div>

      {result && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {["Top","Heart","Base"].map((L) => (
            <div key={L} className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-xs uppercase tracking-wide text-neutral-400">{L}</div>
              <div className="text-sm mt-1">{result[L].notes.join(", ")}</div>
              <div className="text-xs text-neutral-400 mt-2">Target lane %: {result[L].targetPct}%</div>
            </div>
          ))}
          <div className="sm:col-span-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-200">
            {result.Tips.map((t, i) => <div key={i}>• {t}</div>)}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ------------------------------ UI Primitives ------------------------------ */
function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="p-4 sm:p-5 border-b border-white/10">
        <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
function KPI({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-center">
      <div className="text-[11px] uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="text-lg sm:text-xl font-semibold mt-1 tabular-nums">{value}</div>
    </div>
  );
}
function NumberInput({ label, value, setValue }) {
  return (
    <label className="text-xs sm:text-sm">
      <span className="block mb-1 text-neutral-300">{label}</span>
      <input type="number" inputMode="decimal"
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        value={value} onChange={(e) => setValue(parseFloat(e.target.value || "0"))} />
    </label>
  );
}
function RangeInput({ label, value, setValue, min=0, max=100, step=1 }) {
  return (
    <label className="text-xs sm:text-sm">
      <span className="block mb-1 text-neutral-300">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => setValue(parseFloat(e.target.value))}
        className="w-full accent-white" />
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <label className="text-xs sm:text-sm">
      <span className="block mb-1 text-neutral-300">{label}</span>
      <select className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none"
        value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
function Static({ label, value }) {
  return (
    <div className="text-xs sm:text-sm">
      <div className="mb-1 text-neutral-300">{label}</div>
      <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm">{value}</div>
    </div>
  );
}
function TextInput({ label, value, setValue, placeholder="", type="text" }) {
  return (
    <label className="text-xs sm:text-sm">
      <span className="block mb-1 text-neutral-300">{label}</span>
      <input type={type} placeholder={placeholder}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none"
        value={value} onChange={(e) => setValue(e.target.value)} />
    </label>
  );
}
function Textarea({ label, value, setValue }) {
  return (
    <label className="text-xs sm:text-sm">
      <span className="block mb-1 text-neutral-300">{label}</span>
      <textarea rows={3}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none"
        value={value} onChange={(e) => setValue(e.target.value)} />
    </label>
  );
}

/* ------------------------------ Hooks & Utils ------------------------------ */
function useLS(key, initial) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) try { setV(JSON.parse(raw)); } catch {}
  }, [key]);
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(v));
  }, [key, v]);
  return [v, setV];
}
function useLSNumber(key, initial) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw) setV(Number(JSON.parse(raw)));
  }, [key]);
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(v));
  }, [key, v]);
  return [v, setV];
}
function updateRow(setter, arr, index, patch) {
  const next = arr.slice();
  next[index] = { ...next[index], ...patch };
  setter(next);
}
function removeAt(setter, arr, index) {
  setter(arr.filter((_, i) => i !== index));
}
function round1(n){return Math.round((n + Number.EPSILON)*10)/10}
function round2(n){return Math.round((n + Number.EPSILON)*100)/100}
function round3(n){return Math.round((n + Number.EPSILON)*1000)/1000}
function round4(n){return Math.round((n + Number.EPSILON)*10000)/10000}
function num(e){return parseFloat(e.target.value || "0")}
function download(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  downloadURL(url, filename);
}
function downloadURL(url, filename) {
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function slug(s){return (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}
function todayISO(){return new Date().toISOString().slice(0,10)}
function cap(s){return s ? s[0].toUpperCase()+s.slice(1) : ""}
// Rounded rect helper for canvas
function roundRect(ctx, x, y, w, h, r, fill=true, stroke=false){
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  if (fill) ctx.fill(); if (stroke) ctx.stroke();
}
// Wrap text within width on canvas
function wrapText(ctx, text, cx, cy, maxWidth, lineHeight){
  const words = (text||"").split(/\s+/);
  let line = "", y = cy - lineHeight;
  const lines = [];
  for (let i=0; i<words.length; i++){
    const test = line ? line + " " + words[i] : words[i];
    const metrics = ctx.measureText(test);
    if (metrics.width > maxWidth && line) {
      lines.push(line); line = words[i];
    } else {
      line = test;
    }
  }
  lines.push(line);
  // center block vertically
  y = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((L, idx) => ctx.fillText(L, cx, y + idx*lineHeight));
}
