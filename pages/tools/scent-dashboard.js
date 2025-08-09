// pages/tools/scent-dashboard.js
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * PFC • Scent Dashboard (Refined)
 * - Tabs: Sillage • Projection • Cost & Deals • Storage
 * - Perfume-aware logic: concentration, family profile, skin type, environment presets
 * - No DB; mobile-first; Tailwind
 *
 * Notes behind the model (heuristics, simplified):
 * - Concentration ranges (EDC/EDT/EDP/Parfum/Extrait) affect base intensity & persistence.
 * - Temperature ↑ => faster evaporation (bigger initial plume, shorter life).
 * - Humidity ↑ => slower evaporation (longer life), slightly diffused plume.
 * - Wind/ventilation ↑ => longer trail but lower local density.
 * - “Family profile” (Citrus/Aromatic/Woody/Amber/Gourmand/Musky) adjusts volatility/persistence.
 */

export default function ScentDashboard() {
  const [active, setActive] = useState("sillage");

  // Shared state
  const [env, setEnv] = useState({
    preset: "indoor-still",
    tempC: 24,
    humidity: 50,
    wind: 0.3, // m/s
    ventilation: 0.2, // 0-1
  });
  const [skin, setSkin] = useState("normal"); // dry/normal/oily
  const [profile, setProfile] = useState("EDP"); // concentration
  const [family, setFamily] = useState("Amber"); // “weight”
  const [sprays, setSprays] = useState(4);

  useEffect(() => {
    const saved = localStorage.getItem("pfc_scent_dash_v2");
    if (saved) {
      const s = JSON.parse(saved);
      setEnv(s.env ?? env);
      setSkin(s.skin ?? "normal");
      setProfile(s.profile ?? "EDP");
      setFamily(s.family ?? "Amber");
      setSprays(typeof s.sprays === "number" ? s.sprays : 4);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "pfc_scent_dash_v2",
      JSON.stringify({ env, skin, profile, family, sprays })
    );
  }, [env, skin, profile, family, sprays]);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-30 backdrop-blur border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">PFC • Scent Dashboard</h1>
          <a href="/" className="text-xs sm:text-sm text-neutral-400 hover:text-neutral-200 underline">
            Home
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Tabs */}
        <nav
          className="sticky top-[52px] z-20 mb-5 sm:mb-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur"
          role="tablist"
        >
          <div className="grid grid-cols-4 text-xs sm:text-sm">
            {[
              { id: "sillage", label: "Sillage" },
              { id: "projection", label: "Projection" },
              { id: "cost", label: "Cost & Deals" },
              { id: "storage", label: "Storage" },
            ].map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={active === t.id}
                onClick={() => setActive(t.id)}
                className={`px-3 py-2 sm:py-3 border-r border-white/10 last:border-r-0 transition ${
                  active === t.id
                    ? "bg-white/10 text-white font-medium"
                    : "text-neutral-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Global Controls (compact, no subtitle) */}
        <Card title="Setup">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              label="Environment"
              value={env.preset}
              onChange={(v) => setEnv(applyPreset(env, v))}
              options={[
                ["indoor-still", "Indoor (still air)"],
                ["indoor-vent", "Indoor (ventilated)"],
                ["outdoor-calm", "Outdoor (calm)"],
                ["outdoor-breeze", "Outdoor (breezy)"],
                ["hot-humid", "Hot & humid"],
                ["cold-dry", "Cold & dry"],
              ]}
            />
            <Select
              label="Concentration"
              value={profile}
              onChange={setProfile}
              options={[["EDC", "EDC"], ["EDT", "EDT"], ["EDP", "EDP"], ["Parfum", "Parfum"], ["Extrait", "Extrait"]]}
            />
            <Select
              label="Family Profile"
              value={family}
              onChange={setFamily}
              options={[
                ["Citrus", "Citrus / Fresh"],
                ["Aromatic", "Aromatic / Green"],
                ["Woody", "Woody"],
                ["Amber", "Amber / Oriental"],
                ["Gourmand", "Gourmand / Musky"],
              ]}
            />
            <Select
              label="Skin Type"
              value={skin}
              onChange={setSkin}
              options={[["dry", "Dry"], ["normal", "Normal"], ["oily", "Oily"]]}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Slider label="Sprays" value={sprays} min={1} max={12} step={1} onChange={setSprays} />
            <Slider
              label={`Temp (${env.tempC}°C)`}
              value={env.tempC}
              min={0}
              max={40}
              onChange={(v) => setEnv({ ...env, tempC: v })}
            />
            <Slider
              label={`Humidity (${env.humidity}%)`}
              value={env.humidity}
              min={10}
              max={100}
              onChange={(v) => setEnv({ ...env, humidity: v })}
            />
            <Slider
              label={`Airflow (${env.wind.toFixed(1)} m/s)`}
              value={env.wind}
              min={0}
              max={3}
              step={0.1}
              onChange={(v) => setEnv({ ...env, wind: v })}
            />
          </div>
        </Card>

        {/* Panels */}
        <section className="mt-5 sm:mt-6 space-y-6">
          {active === "sillage" && (
            <Card title="Sillage Simulator">
              <SillageSimulator env={env} sprays={sprays} profile={profile} family={family} />
              <Hint text="Hotter air = faster evaporation (bigger initial trail, shorter sustain). Humidity slows evaporation but softens plume; wind stretches the trail but thins it." />
            </Card>
          )}

          {active === "projection" && (
            <Card title="Projection Radius Estimator">
              <ProjectionEstimator env={env} sprays={sprays} profile={profile} family={family} skin={skin} />
            </Card>
          )}

          {active === "cost" && (
            <Card title="Cost‑per‑Wear & Deal Judge">
              <CostAndDeals spraysDefault={sprays} />
            </Card>
          )}

          {active === "storage" && (
            <Card title="Storage Risk Meter">
              <StorageRisk env={env} />
            </Card>
          )}
        </section>

        <footer className="pt-8 pb-10 text-center text-xs text-neutral-500">
          Built for Pakistan Fragrance Community • All on-device
        </footer>
      </main>
    </div>
  );
}

/* ----------------------------- UI primitives ----------------------------- */

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

function Select({ label, value, onChange, options }) {
  return (
    <label className="text-xs sm:text-sm">
      <span className="block mb-1 text-neutral-300">{label}</span>
      <select
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Slider({ label, value, min, max, step = 1, onChange }) {
  return (
    <label className="text-xs sm:text-sm">
      <span className="block mb-1 text-neutral-300">{label}</span>
      <input
        type="range"
        className="w-full accent-white"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
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

function Hint({ text }) {
  return <p className="text-xs text-neutral-400 mt-3">{text}</p>;
}

/* --------------------------- Heuristic helpers --------------------------- */

const concBase = {
  EDC: { intensity: 0.7, persistence: 0.6 },
  EDT: { intensity: 0.9, persistence: 0.8 },
  EDP: { intensity: 1.1, persistence: 1.0 },
  Parfum: { intensity: 1.25, persistence: 1.15 },
  Extrait: { intensity: 1.35, persistence: 1.3 },
};

const familyProps = {
  Citrus: { volatility: 1.25, persistence: 0.8 },
  Aromatic: { volatility: 1.05, persistence: 0.95 },
  Woody: { volatility: 0.95, persistence: 1.05 },
  Amber: { volatility: 0.9, persistence: 1.15 },
  Gourmand: { volatility: 0.9, persistence: 1.1 },
};

function applyPreset(env, preset) {
  const map = {
    "indoor-still": { tempC: 22, humidity: 45, wind: 0.1, ventilation: 0.1 },
    "indoor-vent": { tempC: 23, humidity: 40, wind: 0.3, ventilation: 0.5 },
    "outdoor-calm": { tempC: 24, humidity: 50, wind: 0.4, ventilation: 0.3 },
    "outdoor-breeze": { tempC: 26, humidity: 50, wind: 1.2, ventilation: 0.6 },
    "hot-humid": { tempC: 32, humidity: 75, wind: 0.6, ventilation: 0.4 },
    "cold-dry": { tempC: 8, humidity: 25, wind: 0.4, ventilation: 0.3 },
  };
  const next = map[preset] || map["indoor-still"];
  return { ...env, ...next, preset };
}

/* ------------------------------ Sillage Tab ------------------------------ */

function SillageSimulator({ env, sprays, profile, family }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef();
  const [running, setRunning] = useState(true);

  // Derived coefficients
  const c = concBase[profile] ?? concBase.EDP;
  const f = familyProps[family] ?? familyProps.Amber;

  // Environmental factors
  const tempBoost = clamp(mapRange(env.tempC, 0, 40, -0.05, 0.15), -0.05, 0.15); // hotter = more initial vapor
  const humidDampen = clamp(mapRange(env.humidity, 10, 100, 0.12, -0.12), -0.12, 0.12); // humid reduces spread a bit
  const windStretch = clamp(env.wind * 0.6, 0, 1.2); // longer trail

  const spawnBurst = (count) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width * 0.2;
    const cy = rect.height * 0.5;

    const baseCount = Math.round(28 * sprays * c.intensity * (2 - f.volatility));
    const total = Math.max(60, Math.min(1200, baseCount * count));

    for (let i = 0; i < total; i++) {
      const ang = (Math.random() - 0.5) * Math.PI * (0.45 + windStretch * 0.2);
      const speed =
        0.5 +
        Math.random() * 0.8 +
        tempBoost * 0.6 -
        humidDampen * 0.4 +
        env.ventilation * 0.3;
      const vx = Math.cos(ang) * speed + env.wind * 0.7;
      const vy = Math.sin(ang) * speed;

      // life: concentration/persistence ↑, hot ↓, humid ↑ slightly
      const life =
        240 * c.persistence * (1.1 + (1 - f.volatility) * 0.3) +
        env.humidity * 0.4 -
        (env.tempC - 22) * 6 -
        env.wind * 25;

      particlesRef.current.push({
        x: cx,
        y: cy,
        vx,
        vy: vy - (env.tempC > 22 ? 0.02 * (env.tempC - 22) : 0), // warm air lift
        life: Math.max(80, life),
        age: 0,
        size: 0.8 + Math.random() * 1.8,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(320, rect.width);
      canvas.height = Math.max(220, rect.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const ctx = canvas.getContext("2d");
    const loop = () => {
      if (!ctx) return;
      const { width, height } = canvas;

      ctx.fillStyle = "rgba(0,0,0,0.20)";
      ctx.fillRect(0, 0, width, height);

      const arr = particlesRef.current;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.age += 1;
        p.x += p.vx;
        p.y += p.vy;
        const alpha = Math.max(0, 1 - p.age / p.life);
        if (alpha <= 0 || p.x < -10 || p.y < -10 || p.x > width + 10 || p.y > height + 10) {
          arr.splice(i, 1);
          continue;
        }
        // slight diffusion over time
        p.vx *= 0.999;
        p.vy *= 0.999;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.7})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (running) rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [running]);

  // Auto micro-burst when environment changes
  useEffect(() => {
    const t = setTimeout(() => spawnBurst(1), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, sprays, profile, family]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => spawnBurst(1)}
          className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-100 active:scale-[0.99]"
        >
          Spray!
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-4 py-2 rounded-xl border border-white/20 text-sm hover:bg-white/10"
        >
          {running ? "Pause" : "Resume"}
        </button>
        <button
          onClick={() => (particlesRef.current = [])}
          className="px-4 py-2 rounded-xl border border-white/20 text-sm hover:bg-white/10"
        >
          Clear
        </button>
      </div>
      <div
        ref={containerRef}
        className="w-full h-64 sm:h-72 md:h-80 rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-neutral-900 to-neutral-800"
      >
        <canvas ref={canvasRef} className="block w-full h-full" />
      </div>
    </div>
  );
}

/* --------------------------- Projection Tab --------------------------- */

function ProjectionEstimator({ env, sprays, profile, family, skin }) {
  const c = concBase[profile] ?? concBase.EDP;
  const f = familyProps[family] ?? familyProps.Amber;

  const skinAdj = skin === "dry" ? -0.08 : skin === "oily" ? 0.06 : 0;
  const baseRadius =
    0.8 * c.intensity * (1.1 - 0.12 * f.volatility) + Math.sqrt(Math.max(1, sprays)) * 0.35;

  const tempEff = clamp(mapRange(env.tempC, 0, 40, -0.1, 0.14), -0.12, 0.14); // hotter = more lift
  const humidEff = clamp(mapRange(env.humidity, 10, 100, 0.05, -0.05), -0.06, 0.06); // humid softens radius slightly
  const windEff = -Math.min(0.6, env.wind * 0.12); // local radius shrinks with airflow
  const ventEff = -env.ventilation * 0.1;

  const radiusM = clamp(baseRadius * (1 + tempEff + humidEff + windEff + ventEff + skinAdj), 0.3, 3.0);
  const zone = radiusM < 0.8 ? "Intimate" : radiusM < 1.5 ? "Personal" : "Public";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="Estimated Radius" value={`${radiusM.toFixed(2)} m`} />
          <KPI label="Zone" value={zone} />
          <KPI label="Airflow" value={`${env.wind.toFixed(1)} m/s`} />
          <KPI label="Humidity" value={`${env.humidity}%`} />
        </div>
        <Hint text="Radius = how far others smell you at a moment. Sillage = trail over space/time as you move." />
      </div>
      <Radial radiusM={radiusM} />
    </div>
  );
}

function Radial({ radiusM }) {
  const maxM = 3;
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const pxPerM = (size * 0.45) / maxM;
  const rPx = Math.min(size * 0.45, radiusM * pxPerM);

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} className="block">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0.02" />
          </radialGradient>
        </defs>
        {[0.15, 0.30, 0.45].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={size * r} fill="none" stroke="rgba(255,255,255,0.08)" />
        ))}
        <circle cx={cx} cy={cy} r={rPx} fill="url(#glow)" />
        <circle cx={cx} cy={cy} r={4} fill="white" />
        <text x={cx} y={cy + 6} textAnchor="middle" className="fill-white" fontSize="10">
          You
        </text>
      </svg>
    </div>
  );
}

/* ------------------------- Cost & Deals (combined) ------------------------- */

function CostAndDeals({ spraysDefault = 4 }) {
  const [bottleMl, setBottleMl] = useState(50);
  const [price, setPrice] = useState(15000);
  const [spraysPerWear, setSpraysPerWear] = useState(spraysDefault);
  const [spraysPerMl, setSpraysPerMl] = useState(12);
  const [variants, setVariants] = useState([
    { size: 50, price: 15000, label: "Option A" },
    { size: 100, price: 26000, label: "Option B" },
  ]);

  const totalSprays = bottleMl * spraysPerMl;
  const totalWears = Math.max(1, totalSprays / Math.max(1, spraysPerWear));
  const costPerWear = price / totalWears;

  const rows = variants
    .map((r, i) => {
      const ppmL = r.price / Math.max(1, r.size);
      const estSprays = r.size * spraysPerMl;
      const estWears = Math.max(1, estSprays / Math.max(1, spraysPerWear));
      const cpw = r.price / estWears;
      // Value score blending PKR/ml and cost-per-wear
      const score = (normalize(ppmL, 500, 100) * 0.45 + normalize(cpw, 5000, 200) * 0.55);
      let verdict = "Wait";
      if (score >= 0.75) verdict = "Pass";
      else if (score >= 0.5) verdict = "Wait";
      else if (score >= 0.3) verdict = "Buy";
      else verdict = "Strong Buy";
      return { ...r, ppmL, cpw, estWears, score, idx: i };
    })
    .sort((a, b) => a.score - b.score);

  const addRow = () =>
    setVariants([
      ...variants,
      { size: 30, price: 9000, label: `Option ${String.fromCharCode(65 + variants.length)}` },
    ]);
  const update = (i, key, val) => {
    const next = variants.slice();
    next[i][key] = val;
    setVariants(next);
  };
  const remove = (i) => setVariants(variants.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      {/* Cost per wear calculator */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NumberInput label="Bottle (ml)" value={bottleMl} setValue={setBottleMl} />
        <NumberInput label="Price (PKR)" value={price} setValue={setPrice} />
        <NumberInput label="Sprays / Wear" value={spraysPerWear} setValue={setSpraysPerWear} />
        <NumberInput label="Sprays / ml" value={spraysPerMl} setValue={setSpraysPerMl} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Total Sprays" value={Math.floor(totalSprays)} />
        <KPI label="Total Wears" value={Math.floor(totalWears)} />
        <KPI label="Cost / Wear" value={`PKR ${fmt(price / totalWears)}`} />
        <KPI label="PKR / ml" value={fmt(price / Math.max(1, bottleMl))} />
      </div>

      {/* Deal judge */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-neutral-300">
            <tr>
              <th className="text-left px-3 py-2">Label</th>
              <th className="text-right px-3 py-2">Size (ml)</th>
              <th className="text-right px-3 py-2">Price (PKR)</th>
              <th className="text-right px-3 py-2">PKR/ml</th>
              <th className="text-right px-3 py-2">Cost/Wear</th>
              <th className="text-left px-3 py-2">Verdict</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {variants.map((r, i) => (
              <tr key={i} className="border-t border-white/10">
                <td className="px-3 py-2">
                  <input
                    className="w-full bg-transparent border border-white/10 rounded px-2 py-1"
                    value={r.label}
                    onChange={(e) => update(i, "label", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-right"
                    value={r.size}
                    onChange={(e) => update(i, "size", parseFloat(e.target.value || "0"))}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-right"
                    value={r.price}
                    onChange={(e) => update(i, "price", parseFloat(e.target.value || "0"))}
                  />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(r.price / Math.max(1, r.size))}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {fmt(r.price / Math.max(1, (r.size * spraysPerMl) / Math.max(1, spraysPerWear)))}
                </td>
                <td className="px-3 py-2">
                  <Badge verdict={rows.find((x) => x.idx === i)?.verdict || "Wait"} />
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => remove(i)} className="text-xs text-neutral-400 hover:text-neutral-200 underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={addRow} className="px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-neutral-100">
          + Add Variant
        </button>
        {rows.length > 0 && (
          <div className="text-xs text-neutral-400">
            Best value:{" "}
            <span className="text-neutral-200 font-medium">
              {rows[0].label} (PKR/ml {Math.round(rows[0].ppmL)}, CPW {fmt(rows[0].cpw)})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Storage Tab ----------------------------- */

function StorageRisk({ env }) {
  const [sun, setSun] = useState(false);
  const [bath, setBath] = useState(false);
  const [boxed, setBoxed] = useState(true);
  const [capOn, setCapOn] = useState(true);

  const risk = useMemo(() => {
    let r = 0;
    if (env.tempC < 12) r += 6;
    if (env.tempC > 22) r += Math.min(30, (env.tempC - 22) * 2);
    if (env.humidity > 60) r += Math.min(20, (env.humidity - 60) * 0.8);
    if (bath) r += 15;
    if (sun) r += 25;
    if (!boxed) r += 8;
    if (!capOn) r += 6;
    return clamp(Math.round(r), 0, 100);
  }, [env, sun, bath, boxed, capOn]);

  const color = risk < 30 ? "rgb(34,197,94)" : risk < 65 ? "rgb(234,179,8)" : "rgb(239,68,68)";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Toggle label="Direct Sunlight" checked={sun} setChecked={setSun} />
        <Toggle label="Bathroom" checked={bath} setChecked={setBath} />
        <Toggle label="Kept in Box" checked={boxed} setChecked={setBoxed} />
        <Toggle label="Cap On" checked={capOn} setChecked={setCapOn} />
      </div>

      <div className="flex items-center gap-4">
        <Bottle color={color} danger={risk >= 65} />
        <div>
          <div className="text-sm text-neutral-300">Risk Score</div>
          <div className="text-2xl font-semibold tabular-nums" style={{ color }}>
            {risk}/100
          </div>
          <div className="text-xs text-neutral-400 mt-1">Keep cool (15–22°C), dark, dry; box closed & cap on.</div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, setChecked }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => setChecked(!checked)}
        className={`relative w-11 h-6 rounded-full transition ${checked ? "bg-white" : "bg-white/20"}`}
      >
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-black transition ${checked ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}

function Bottle({ color, danger }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="drop-shadow-[0_0_12px_rgba(255,255,255,0.08)]">
      <rect x="26" y="8" width="12" height="8" rx="2" fill="white" opacity="0.9" />
      <rect x="22" y="16" width="20" height="6" rx="3" fill="white" opacity="0.9" />
      <rect x="18" y="22" width="28" height="34" rx="8" fill="none" stroke="white" strokeOpacity="0.25" />
      <rect x="20" y="24" width="24" height="30" rx="6" fill={color} opacity={0.25} />
      {danger && (
        <g>
          <line x1="18" y1="22" x2="46" y2="56" stroke="red" strokeWidth="2" strokeOpacity="0.7" />
          <line x1="46" y1="22" x2="18" y2="56" stroke="red" strokeWidth="2" strokeOpacity="0.7" />
        </g>
      )}
    </svg>
  );
}

/* ------------------------------- Utilities ------------------------------- */

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function mapRange(x, inMin, inMax, outMin, outMax) {
  const t = (x - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}
function normalize(x, hi, lo = 0) {
  // maps x to 0..1 where lower is better (price -> lower)
  const clamped = clamp(x, lo, hi);
  return 1 - (clamped - lo) / (hi - lo);
}
function fmt(n) {
  return (Math.round(n * 100) / 100).toLocaleString();
}
function NumberInput({ label, value, setValue }) {
  return (
    <label className="text-xs sm:text-sm">
      <span className="block mb-1 text-neutral-300">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value || "0"))}
      />
    </label>
  );
}
