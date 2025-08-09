import { useEffect, useMemo, useState } from 'react';

const DEFAULTS = {
  bottleSizeMl: 100,
  bottleCost: 35000, // PKR
  wastePct: 3,
  vialSizes: [2, 5, 10, 30],
  labelCostPerVial: 15,
  vialCostPerUnit: 35,
  targetMarginPct: 20,
  decantPricePerMl: 0,
};

const STORAGE_KEY = 'pfc-decant-calculator';

function numberFormat(n) {
  if (isNaN(n) || !isFinite(n)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

export default function DecantCalculatorPage() {
  const [inputs, setInputs] = useState(DEFAULTS);
  const [currency, setCurrency] = useState('PKR');
  const [usdRate, setUsdRate] = useState(280);

  // Load saved state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setInputs({ ...DEFAULTS, ...parsed });
        setCurrency(parsed.currency || 'PKR');
        setUsdRate(parsed.usdRate || 280);
      }
    } catch {}
  }, []);

  // Save state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...inputs, currency, usdRate }));
    }
  }, [inputs, currency, usdRate]);

  const bottleNetMl = useMemo(() => {
    const waste = (inputs.wastePct / 100) * inputs.bottleSizeMl;
    return Math.max(inputs.bottleSizeMl - waste, 0);
  }, [inputs.bottleSizeMl, inputs.wastePct]);

  const basePpm = useMemo(() => {
    return inputs.bottleCost / Math.max(bottleNetMl, 1);
  }, [inputs.bottleCost, bottleNetMl]);

  const costPerVialFixed = useMemo(
    () => inputs.vialCostPerUnit + inputs.labelCostPerVial,
    [inputs.vialCostPerUnit, inputs.labelCostPerVial]
  );

  const breakdown = useMemo(() => {
    const rows = inputs.vialSizes.map((sizeMl) => {
      const juiceCost = sizeMl * basePpm;
      const totalCost = juiceCost + costPerVialFixed;
      const targetPrice = totalCost * (1 + inputs.targetMarginPct / 100);
      const profit = targetPrice - totalCost;
      const pricePerMlAtTarget = targetPrice / sizeMl;
      return { sizeMl, juiceCost, totalCost, targetPrice, profit, pricePerMlAtTarget };
    });
    const yields = inputs.vialSizes.map((sizeMl) => Math.floor(bottleNetMl / sizeMl));
    return { rows, yields };
  }, [inputs, basePpm, costPerVialFixed, bottleNetMl]);

  const bottleVsDecant = useMemo(() => {
    const { decantPricePerMl } = inputs;
    if (!decantPricePerMl) return null;
    const totalRevenueIfAllDecanted = decantPricePerMl * bottleNetMl;
    const grossProfit =
      totalRevenueIfAllDecanted - inputs.bottleCost - (costPerVialFixed * Math.floor(bottleNetMl / 10));
    return { totalRevenueIfAllDecanted, grossProfit };
  }, [inputs, bottleNetMl, costPerVialFixed]);

  const currencySuffix = currency === 'USD' ? 'USD' : 'PKR';
  const toCurrency = (n) => (currency === 'USD' ? n / Math.max(usdRate, 0.0001) : n);

  return (
    <div className="mx-auto max-w-5xl p-6 text-sm text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">PFC Decant & Price-per-mL Calculator</h1>
        <p className="text-white/70">Plan splits, price transparently, and hit your margins — all client-side.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Section
          title="Bottle & Costs"
          right={
            <div className="flex items-center gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-lg bg-white/10 px-2 py-1"
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
              </select>
              {currency === 'USD' && (
                <input
                  type="number"
                  min={1}
                  value={usdRate}
                  onChange={(e) => setUsdRate(Number(e.target.value))}
                  className="w-24 rounded-lg bg-white/10 px-2 py-1"
                  placeholder="USD rate"
                />
              )}
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bottle size (mL)" value={inputs.bottleSizeMl} onChange={(v) => setInputs((p) => ({ ...p, bottleSizeMl: v }))} />
            <Field label={`Bottle cost (${currencySuffix})`} value={inputs.bottleCost} onChange={(v) => setInputs((p) => ({ ...p, bottleCost: v }))} />
            <Field label="Waste/priming (%)" value={inputs.wastePct} onChange={(v) => setInputs((p) => ({ ...p, wastePct: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vial cost" value={inputs.vialCostPerUnit} onChange={(v) => setInputs((p) => ({ ...p, vialCostPerUnit: v }))} />
              <Field label="Label cost" value={inputs.labelCostPerVial} onChange={(v) => setInputs((p) => ({ ...p, labelCostPerVial: v }))} />
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-white/5 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white/80">Vial sizes (mL):</span>
              {inputs.vialSizes.map((v, i) => (
                <input
                  key={i}
                  type="number"
                  min={1}
                  value={v}
                  onChange={(e) =>
                    setInputs((p) => {
                      const arr = [...p.vialSizes];
                      arr[i] = Number(e.target.value);
                      return { ...p, vialSizes: arr.filter((x) => x > 0) };
                    })
                  }
                  className="w-16 rounded-lg bg-white/10 px-2 py-1"
                />
              ))}
              <button
                onClick={() => setInputs((p) => ({ ...p, vialSizes: [...p.vialSizes, 15] }))}
                className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/15"
              >
                + Add size
              </button>
            </div>
          </div>
        </Section>

        <Section title="Margins & Comparison">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target margin (%)" value={inputs.targetMarginPct} onChange={(v) => setInputs((p) => ({ ...p, targetMarginPct: v }))} />
            <Field label={`Compare: decant price per mL (${currencySuffix})`} value={inputs.decantPricePerMl} onChange={(v) => setInputs((p) => ({ ...p, decantPricePerMl: v }))} />
          </div>

          <div className="mt-4 grid gap-2 rounded-xl bg-white/5 p-3">
            <Row label="Net usable mL after waste" value={`${numberFormat(bottleNetMl)} mL`} />
            <Row label="Base price per mL" value={`${numberFormat(toCurrency(basePpm))} ${currencySuffix}`} />
            {bottleVsDecant && (
              <>
                <Row label="If fully decanted: revenue" value={`${numberFormat(toCurrency(bottleVsDecant.totalRevenueIfAllDecanted))} ${currencySuffix}`} />
                <Row label="Rough gross profit" value={`${numberFormat(toCurrency(bottleVsDecant.grossProfit))} ${currencySuffix}`} />
              </>
            )}
          </div>
        </Section>
      </div>

      <Section title="Decant Planner" right={<span className="text-white/60">All values in {currencySuffix}</span>}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-white/70">
                <th className="py-2 pr-4">Size (mL)</th>
                <th className="py-2 pr-4">Yield</th>
                <th className="py-2 pr-4">Juice cost</th>
                <th className="py-2 pr-4">Fixed cost</th>
                <th className="py-2 pr-4">Total cost</th>
                <th className="py-2 pr-4">Target price</th>
                <th className="py-2 pr-4">Profit</th>
                <th className="py-2 pr-4">Price/mL</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.rows.map((r, idx) => (
                <tr key={idx} className="border-t border-white/10">
                  <td>{r.sizeMl} mL</td>
                  <td>{breakdown.yields[idx]}</td>
                  <td>{numberFormat(toCurrency(r.juiceCost))}</td>
                  <td>{numberFormat(toCurrency(costPerVialFixed))}</td>
                  <td>{numberFormat(toCurrency(r.totalCost))}</td>
                  <td>{numberFormat(toCurrency(r.targetPrice))}</td>
                  <td>{numberFormat(toCurrency(r.profit))}</td>
                  <td>{numberFormat(toCurrency(r.pricePerMlAtTarget))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, right }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="flex flex-col">
      <span className="mb-1 text-white/80">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg bg-white/10 px-3 py-2"
      />
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/80">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
