// pages/tools/scent-lab.js
import { useEffect, useMemo, useRef, useState, Suspense } from "react";

/**
 * PFC Scent Lab (Tabbed, Mobile‑First, No‑DB)
 * Tools:
 * 1) Sillage Simulator (canvas particles; only mounted when tab active)
 * 2) Projection Radius Estimator (radial SVG)
 * 3) Cost‑per‑Wear & Spray Budget
 * 4) Storage Risk Meter
 * 5) Price‑per‑mL Deal Judge
 *
 * Tailwind required. Pure client-side. LocalStorage for prefs.
 */

export default function ScentLab() {
  const [active, setActive] = useState("sillage");

  // ---- Shared environment across tools ----
  const [tempC, setTempC] = useState(24);
  const [humidity, setHumidity] = useState(50);
  const [windSpeed, setWindSpeed] = useState(1);
  const [windDir, setWindDir] = useState(0);

  // Load/persist
  useEffect(() => {
    const saved = localStorage.getItem("pfc_scent_lab_env");
    if (saved) {
      const s = JSON.parse(saved);
      if (typeof s.tempC === "number") setTempC(s.tempC);
      if (typeof s.humidity === "number") setHumidity(s.humidity);
      if (typeof s.windSpeed === "number") setWindSpeed(s.windSpeed);
      if (typeof s.windDir === "number") setWindDir(s.windDir);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "pfc_scent_lab_env",
      JSON.stringify({ tempC, humidity, windSpeed, windDir })
    );
  }, [tempC, humidity, windSpeed, windDir]);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-30 backdrop-blur border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">PFC • Scent Lab</h1>
          <a
            href="/"
            className="text-xs sm:text-sm text-neutral-400 hover:text-neutral-200 underline"
          >
            Home
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Intro */}
        <div className="mb-4 sm:mb-6">
          <p className="text-sm text-neutral-400">
            Switch tools from the tabs below. Your environment (temp, humidity, wind) affects
            multiple tools and is saved locally.
          </p>
        </div>

        {/* Tabs */}
        <nav
          className="sticky top-[52px] z-20 mb-5 sm:mb-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur"
          role="tablist"
          aria-label="Scent Lab tools"
        >
          <div className="grid grid-cols-5 text-xs sm:text-sm">
            {[
              { id: "sillage", label: "Sillage" },
              { id: "projection", label: "Projection" },
              { id: "cost", label: "Cost/Wear" },
              { id: "storage", label: "Storage" },
              { id: "deals", label: "Deals" },
            ].map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={active === t.id}
                aria-controls={`panel-${t.id}`}
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

        {/* Environment (global) */}
        <EnvPanel
          tempC={tempC}
          setTempC={setTempC}
          humidity={humidity}
          setHumidity={setHumidity}
          windSpeed={windSpeed}
          setWindSpeed={setWindSpeed}
          windDir={windDir}
          setWindDir={setWindDir}
        />

        {/* Panels */}
        <section className="mt-5 sm:mt-6 space-y-6">
          {active === "sillage" && (
            <ToolCard id="panel-sillage" title="Sillage Simulator" subtitle="Visualize diffusion with environment impact.">
              {/* Mount only when active for speed */}
              <SillageSimulator
                tempC={tempC}
                humidity={humidity}
                windSpeed={windSpeed}
                windDir={windDir}
              />
            </ToolCard>
          )}

          {active === "projection" && (
            <ToolCard
              id="panel-projection"
              title="Projection Radius Estimator"
              subtitle="Estimate your scent bubble radius."
            >
              <ProjectionEstimator
                tempC={tempC}
                humidity={humidity}
                windSpeed={windSpeed}
              />
            </ToolCard>
          )}

          {active === "cost" && (
            <ToolCard
              id="panel-cost"
              title="Cost‑per‑Wear & Spray Budget"
              subtitle="Plan usage, finish dates, and cost/wear."
            >
              <CostPerWearPlanner />
            </ToolCard>
          )}

          {active === "storage" && (
            <ToolCard
              id="panel-storage"
              title="Storage Risk Meter"
              subtitle="Simulate conditions; lower degradation risk."
            >
              <StorageRiskMeter tempC={tempC} humidity={humidity} />
            </ToolCard>
          )}

          {active === "deals" && (
            <ToolCard
              id="panel-deals"
              title="Price‑per‑mL Deal Judge"
              subtitle="Compare variants and get a verdict."
            >
              <DealJudge />
            </ToolCard>
          )}
        </section>

        <footer className="pt-8 pb-10 text-center text-xs text-neutral-500">
          Built for Pakistan Fragrance Community • No data leaves your device
        </footer>
      </main>
    </div>
  );
}

/* ----------------------------- UI Primitives ----------------------------- */

function ToolCard({ id, title, subtitle, children }) {
  return (
    <div
      id={id}
      role="tabpanel"
      className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
    >
      <div className="p-4 sm:p-5 border-b border-white/10">
        <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-xs sm:text-sm text-neutral-400 mt-1">{subtitle}</p>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 1, onChange, suffix }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 items-center">
      <label className="text-sm sm:col-span-2">{label}</label>
      <input
        type="range"
        className="sm:col-span-2 w-full accent-white"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <div className="text-right text-sm tabular-nums">
        {value}
        {suffix}
      </div>
    </div>
  );
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

function KPI({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-center">
      <div className="text-[11px] uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="text-lg sm:text-xl font-semibold mt-1 tabular-nums">{value}</div>
    </div>
  );
}

/* ----------------------- Environment (Global Controls) ----------------------- */

function EnvPanel({
  tempC,
  setTempC,
  humidity,
  setHumidity,
  windSpeed,
  setWindSpeed,
  windDir,
  setWindDir,
}) {
  const windVector = useMemo(() => {
    const rad = (windDir * Math.PI) / 180;
    return { x: Math.cos(rad) * windSpeed, y: Math.sin(rad) * windSpeed };
  }, [windSpeed, windDir]);

  return (
    <ToolCard
      id="panel-env"
      title="Environment"
      subtitle="Affects simulations across tools. Saved locally."
    >
      <div className="space-y-4">
        <SliderRow label="Temperature" value={tempC} min={0} max={40} onChange={setTempC} suffix="°C" />
        <SliderRow label="Humidity" value={humidity} min={10} max={100} onChange={setHumidity} suffix="%" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SliderRow
            label="Wind Speed"
            value={windSpeed}
            min={0}
            max={3}
            step={0.1}
            onChange={setWindSpeed}
            suffix=" m/s"
          />
          <SliderRow
            label="Wind Direction"
            value={windDir}
            min={0}
            max={360}
            step={1}
            onChange={setWindDir}
            suffix="°"
          />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="size-16 sm:size-20 rounded-full border border-white/10 bg-white/5 flex items-center justify-center relative">
            <div
              className="w-0 h-0 border-l-4 border-y-transparent border-y-[6px] border-l-white"
              style={{ transform: `rotate(${windDir}deg)` }}
              aria-hidden
            />
          </div>
          <div className="text-sm text-neutral-400">
            <div>Wind Vector</div>
            <div className="tabular-nums">x: {windVector.x.toFixed(2)} m/s</div>
            <div className="tabular-nums">y: {windVector.y.toFixed(2)} m/s</div>
          </div>
        </div>
      </div>
    </ToolCard>
  );
}

/* --------------------------- 1) Sillage Simulator --------------------------- */

function SillageSimulator({ tempC, humidity, windSpeed, windDir }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [sprays, setSprays] = useState(3);
  const [running, setRunning] = useState(true);

  const particlesRef = useRef([]);
  const rafRef = useRef();

  const spawnBurst = (count) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width * 0.2;
    const cy = rect.height * 0.5;
    const dirRad = (windDir * Math.PI) / 180;
    const windVec = { x: Math.cos(dirRad) * windSpeed, y: Math.sin(dirRad) * windSpeed };

    for (let i = 0; i < count * 40; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 0.7;
      const baseSpeed = 0.4 + Math.random() * 0.8;
      const vx = Math.cos(angle) * baseSpeed + windVec.x * 0.8;
      const vy = Math.sin(angle) * baseSpeed + windVec.y * 0.8;
      const life =
        200 +
        Math.random() * 200 -
        (tempC - 20) * 5 -
        (humidity - 50) * 2 +
        windSpeed * 40;

      particlesRef.current.push({
        x: cx,
        y: cy,
        vx,
        vy,
        life,
        age: 0,
        size: 1 + Math.random() * 1.5,
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
        p.vy -= Math.max(0, (tempC - 20) * 0.002);

        const alpha = Math.max(0, 1 - p.age / p.life);
        if (alpha <= 0 || p.x < -10 || p.y < -10 || p.x > width + 10 || p.y > height + 10) {
          arr.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.7})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Wind hint
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.moveTo(width * 0.2, height * 0.5);
      ctx.lineTo(
        width * 0.2 + Math.cos((windDir * Math.PI) / 180) * 40,
        height * 0.5 + Math.sin((windDir * Math.PI) / 180) * 40
      );
      ctx.stroke();
      ctx.restore();

      if (running) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [running, tempC, humidity, windSpeed, windDir]);

  // Small auto‑burst on env change (rate-limited)
  useEffect(() => {
    const t = setTimeout(() => spawnBurst(1), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempC, humidity, windSpeed, windDir]);

  return (
    <div className="space-y-4">
      <SliderRow label="Sprays (burst size)" value={sprays} min={1} max={10} onChange={setSprays} />
      <div className="flex gap-2">
        <button
          onClick={() => spawnBurst(sprays)}
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
      <p className="text-xs text-neutral-400">
        Tip: Increase wind/temperature in Environment to change the plume. Humidity shortens life.
      </p>
    </div>
  );
}

/* ----------------------- 2) Projection Radius Estimator ----------------------- */

function ProjectionEstimator({ tempC, humidity, windSpeed }) {
  const [concentration, setConcentration] = useState("EDP");
  const [sprays, setSprays] = useState(4);

  const baseByConc = { Cologne: 0.6, EDT: 0.9, EDP: 1.2, Parfum: 1.5, Extrait: 1.8 };
  const base = baseByConc[concentration] || 1.2;

  const envFactor =
    1 +
    (Math.min(10, Math.max(-10, 22 - tempC)) * 0.01) +
    (Math.min(20, Math.max(-20, 60 - humidity)) * 0.005) -
    windSpeed * 0.08;

  const sprayFactor = Math.sqrt(Math.max(1, sprays)) * 0.4;
  const radiusM = Math.max(0.3, base * envFactor + sprayFactor);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <label className="text-xs sm:text-sm">
          <span className="block mb-1 text-neutral-300">Concentration</span>
          <select
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none"
            value={concentration}
            onChange={(e) => setConcentration(e.target.value)}
          >
            {["Cologne", "EDT", "EDP", "Parfum", "Extrait"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <SliderRow label="Sprays" value={sprays} min={1} max={12} onChange={setSprays} />
        <div className="grid grid-cols-2 gap-3">
          <KPI label="Estimated Radius" value={`${radiusM.toFixed(2)} m`} />
          <KPI
            label="Zone"
            value={radiusM < 0.8 ? "Intimate" : radiusM < 1.5 ? "Personal" : "Public"}
          />
        </div>
        <p className="text-xs text-neutral-400">Heuristic only; real projection varies.</p>
      </div>
      <RadialChart radiusM={radiusM} />
    </div>
  );
}

function RadialChart({ radiusM }) {
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
        <circle cx={cx} cy={cy} r={size * 0.45} fill="none" stroke="rgba(255,255,255,0.08)" />
        <circle cx={cx} cy={cy} r={size * 0.30} fill="none" stroke="rgba(255,255,255,0.08)" />
        <circle cx={cx} cy={cy} r={size * 0.15} fill="none" stroke="rgba(255,255,255,0.08)" />
        <circle cx={cx} cy={cy} r={rPx} fill="url(#glow)" />
        <circle cx={cx} cy={cy} r={4} fill="white" />
        <text x={cx} y={cy + 6} textAnchor="middle" className="fill-white" fontSize="10">
          You
        </text>
      </svg>
    </div>
  );
}

/* --------------------- 3) Cost-per-Wear & Spray Budget --------------------- */

function CostPerWearPlanner() {
  const [bottleMl, setBottleMl] = useState(50);
  const [price, setPrice] = useState(15000);
  const [spraysPerWear, setSpraysPerWear] = useState(4);
  const [spraysPerMl, setSpraysPerMl] = useState(12);
  const [targetDays, setTargetDays] = useState(180);
  const [dailyWears, setDailyWears] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem("pfc_cost_wear");
    if (saved) {
      const s = JSON.parse(saved);
      setBottleMl(s.bottleMl ?? 50);
      setPrice(s.price ?? 15000);
      setSpraysPerWear(s.spraysPerWear ?? 4);
      setSpraysPerMl(s.spraysPerMl ?? 12);
      setTargetDays(s.targetDays ?? 180);
      setDailyWears(s.dailyWears ?? 1);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "pfc_cost_wear",
      JSON.stringify({ bottleMl, price, spraysPerWear, spraysPerMl, targetDays, dailyWears })
    );
  }, [bottleMl, price, spraysPerWear, spraysPerMl, targetDays, dailyWears]);

  const totalSprays = bottleMl * spraysPerMl;
  const totalWears = totalSprays / Math.max(1, spraysPerWear);
  const costPerWear = price / Math.max(1, totalWears);
  const spraysPerDayAllowed = Math.floor((totalSprays / Math.max(1, targetDays)) || 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <NumberInput label="Bottle (ml)" value={bottleMl} setValue={setBottleMl} />
        <NumberInput label="Price (PKR)" value={price} setValue={setPrice} />
        <NumberInput label="Sprays/Wear" value={spraysPerWear} setValue={setSpraysPerWear} />
        <NumberInput label="Sprays/ml" value={spraysPerMl} setValue={setSpraysPerMl} />
        <NumberInput label="Target Days" value={targetDays} setValue={setTargetDays} />
        <NumberInput label="Daily Wears" value={dailyWears} setValue={setDailyWears} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Total Sprays" value={Math.floor(totalSprays)} />
        <KPI label="Total Wears" value={Math.floor(totalWears)} />
        <KPI label="Cost per Wear" value={`PKR ${formatNum(costPerWear)}`} />
        <KPI label="Sprays / Day (to finish)" value={spraysPerDayAllowed} />
      </div>
      <p className="text-xs text-neutral-400 text-center">
        Assumes {spraysPerMl} sprays/ml. Adjust to your atomizer for accuracy.
      </p>
    </div>
  );
}

function formatNum(n) {
  return (Math.round(n * 100) / 100).toLocaleString();
}

/* ----------------------------- 4) Storage Risk Meter ----------------------------- */

function StorageRiskMeter({ tempC, humidity }) {
  const [inSunlight, setInSunlight] = useState(false);
  const [inBathroom, setInBathroom] = useState(false);
  const [boxed, setBoxed] = useState(true);
  const [capOn, setCapOn] = useState(true);

  const risk = useMemo(() => {
    let r = 0;
    if (tempC < 12) r += 8;
    if (tempC > 22) r += Math.min(30, (tempC - 22) * 2);
    if (humidity > 60) r += Math.min(20, (humidity - 60) * 0.8);
    if (inBathroom) r += 15;
    if (inSunlight) r += 25;
    if (!boxed) r += 8;
    if (!capOn) r += 6;
    return Math.max(0, Math.min(100, Math.round(r)));
  }, [tempC, humidity, inBathroom, inSunlight, boxed, capOn]);

  const color =
    risk < 30 ? "rgb(34,197,94)" : risk < 65 ? "rgb(234,179,8)" : "rgb(239,68,68)";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Toggle label="Direct Sunlight" checked={inSunlight} setChecked={setInSunlight} />
        <Toggle label="Bathroom" checked={inBathroom} setChecked={setInBathroom} />
        <Toggle label="Kept in Box" checked={boxed} setChecked={setBoxed} />
        <Toggle label="Cap On" checked={capOn} setChecked={setCapOn} />
      </div>

      <div className="flex items-center gap-4">
        <BottleIcon color={color} danger={risk >= 65} />
        <div>
          <div className="text-sm text-neutral-300">Risk Score</div>
          <div className="text-2xl font-semibold tabular-nums" style={{ color }}>
            {risk}/100
          </div>
          <div className="text-xs text-neutral-400 mt-1">
            Keep cool (15–22°C), dark, dry; box closed & cap on.
          </div>
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
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-black transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </label>
  );
}

function BottleIcon({ color, danger }) {
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

/* --------------------------- 5) Price-per-mL Deal Judge --------------------------- */

function DealJudge() {
  const [rows, setRows] = useState([
    { size: 50, price: 15000, label: "Option A" },
    { size: 100, price: 26000, label: "Option B" },
  ]);

  const addRow = () =>
    setRows([
      ...rows,
      { size: 30, price: 9000, label: `Option ${String.fromCharCode(65 + rows.length)}` },
    ]);
  const updateRow = (i, key, val) => {
    const next = rows.slice();
    next[i][key] = val;
    setRows(next);
  };
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const computed = rows
    .map((r, i) => {
      const ppmL = r.price / Math.max(1, r.size);
      let verdict = "Wait";
      if (ppmL <= 180) verdict = "Strong Buy";
      else if (ppmL <= 260) verdict = "Buy";
      else if (ppmL <= 340) verdict = "Wait";
      else verdict = "Pass";
      return { ...r, ppmL, verdict, idx: i };
    })
    .sort((a, b) => a.ppmL - b.ppmL);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-neutral-300">
            <tr>
              <th className="text-left px-3 py-2">Label</th>
              <th className="text-right px-3 py-2">Size (ml)</th>
              <th className="text-right px-3 py-2">Price (PKR)</th>
              <th className="text-right px-3 py-2">PKR/ml</th>
              <th className="text-left px-3 py-2">Verdict</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-white/10">
                <td className="px-3 py-2">
                  <input
                    className="w-full bg-transparent border border-white/10 rounded px-2 py-1"
                    value={r.label}
                    onChange={(e) => updateRow(i, "label", e.target.value)}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-right"
                    value={r.size}
                    onChange={(e) => updateRow(i, "size", parseFloat(e.target.value || "0"))}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-right"
                    value={r.price}
                    onChange={(e) => updateRow(i, "price", parseFloat(e.target.value || "0"))}
                  />
                </td>
                <td className="px-3 py-2 text-right text-neutral-300 tabular-nums">
                  {isFinite(r.price / Math.max(1, r.size))
                    ? Math.round((r.price / Math.max(1, r.size)) * 100) / 100
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  <Badge verdict={computed.find((c) => c.idx === i)?.verdict || "Wait"} />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => removeRow(i)}
                    className="text-xs text-neutral-400 hover:text-neutral-200 underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={addRow}
          className="px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-neutral-100"
        >
          + Add Variant
        </button>

        {computed.length > 0 && (
          <div className="text-xs text-neutral-400">
            Best value now:{" "}
            <span className="text-neutral-200 font-medium">
              {computed[0].label} ({Math.round(computed[0].ppmL)} PKR/ml)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ verdict }) {
  const palette = {
    "Strong Buy": "bg-green-500/20 text-green-300 border-green-500/30",
    Buy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    Wait: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
    Pass: "bg-red-500/15 text-red-300 border-red-500/25",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded border ${palette[verdict] || palette["Wait"]}`}>
      {verdict}
    </span>
  );
}
