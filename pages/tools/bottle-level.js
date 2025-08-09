import { useEffect, useMemo, useRef, useState } from 'react';
import SEO from '../../components/SEO'; // ✅ Import SEO

const STORAGE_KEY = 'pfc-bottle-level-calib-v1';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function BottleLevelEstimator() {
  const containerRef = useRef(null);
  const [bottleSize, setBottleSize] = useState(100); // mL
  const [topY, setTopY] = useState(null);
  const [bottomY, setBottomY] = useState(null);
  const [levelY, setLevelY] = useState(null);
  const [drag, setDrag] = useState(null);
  const [pxHeight, setPxHeight] = useState(0);

  // Load saved state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.bottleSize === 'number') setBottleSize(s.bottleSize);
        if (typeof s.topY === 'number') setTopY(s.topY);
        if (typeof s.bottomY === 'number') setBottomY(s.bottomY);
        if (typeof s.levelY === 'number') setLevelY(s.levelY);
      }
    } catch {}
  }, []);

  // Measure container height and set default guides if needed
  useEffect(() => {
    function measure() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const h = rect.height;
      setPxHeight(h);
      if (topY == null || bottomY == null || levelY == null) {
        const t = Math.round(h * 0.1);
        const b = Math.round(h * 0.9);
        const lv = Math.round(h * 0.5);
        setTopY((prev) => (prev == null ? t : prev));
        setBottomY((prev) => (prev == null ? b : prev));
        setLevelY((prev) => (prev == null ? lv : prev));
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [topY, bottomY, levelY]);

  // Save state
  useEffect(() => {
    if (pxHeight === 0) return;
    const state = { bottleSize, topY, bottomY, levelY };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [bottleSize, topY, bottomY, levelY, pxHeight]);

  // Drag handling
  function onPointerDown(type, e) {
    e.preventDefault();
    setDrag(type);
  }
  function onPointerMove(e) {
    if (!drag) return;
    e.preventDefault(); // Prevents mobile scroll during drag
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = clamp(e.clientY - rect.top, 0, rect.height);
    if (drag === 'top') {
      const ny = Math.min(y, bottomY - 4);
      setTopY(ny);
      setLevelY((lv) => clamp(lv, ny + 2, bottomY - 2));
    } else if (drag === 'bottom') {
      const ny = Math.max(y, topY + 4);
      setBottomY(ny);
      setLevelY((lv) => clamp(lv, topY + 2, ny - 2));
    } else if (drag === 'level') {
      const ny = clamp(y, topY + 2, bottomY - 2);
      setLevelY(ny);
    }
  }
  function onPointerUp() {
    setDrag(null);
  }

  useEffect(() => {
    if (!drag) return;
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [drag, topY, bottomY]);

  // Calculations
  const fractionFull = useMemo(() => {
    if (pxHeight === 0 || topY == null || bottomY == null || levelY == null) return 0;
    const span = Math.max(bottomY - topY, 1);
    const filled = bottomY - levelY;
    return clamp(filled / span, 0, 1);
  }, [pxHeight, topY, bottomY, levelY]);

  const mlRemaining = useMemo(() => bottleSize * fractionFull, [bottleSize, fractionFull]);
  const mlUsed = useMemo(() => bottleSize - mlRemaining, [bottleSize, mlRemaining]);
  const pct = Math.round(fractionFull * 100);

  function resetGuides() {
    if (!containerRef.current) return;
    const h = containerRef.current.getBoundingClientRect().height;
    setTopY(Math.round(h * 0.1));
    setBottomY(Math.round(h * 0.9));
    setLevelY(Math.round(h * 0.5));
  }

  return (
    <>
      <SEO
        title="PFC Bottle Level Estimator"
        description="Estimate the remaining perfume in your bottle with the PFC Bottle Level Estimator. Calibrate top, bottom, and liquid level for an accurate mL reading."
      />

      <div className="mx-auto max-w-5xl px-4 py-6 text-white">
        <h1 className="text-2xl font-bold mb-2">PFC Bottle Level Estimator</h1>
        <p className="text-white/70 mb-4">
          Place your bottle against the screen. Drag the <b>Top</b> guide to the bottle head start, the <b>Bottom</b> guide to the bottle base end,
          and the <b>Level</b> guide to the current liquid line. Enter your bottle size to estimate remaining mL.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-white/80">Bottle size (mL)</span>
            <input
              type="number"
              min={1}
              value={bottleSize}
              onChange={(e) => setBottleSize(Number(e.target.value))}
              className="w-28 rounded-md bg-white/10 px-3 py-2"
            />
          </label>

          <button
            onClick={resetGuides}
            className="rounded-md bg-white/10 px-3 py-2 hover:bg-white/15 transition"
          >
            Reset guides
          </button>
        </div>

        <div className="grid md:grid-cols-[2fr_1fr] gap-6">
          {/* Calibration surface */}
          <div
            ref={containerRef}
            className="relative h-[75vh] md:h-[60vh] min-h-[420px] rounded-2xl border border-white/10 bg-gradient-to-b from-black/40 to-black/20 touch-none"
          >
            <div className="pointer-events-none absolute inset-x-12 top-6 bottom-6 rounded-[40px] border border-white/5 bg-white/2" />

            {topY != null && (
              <Guide
                y={topY}
                color="from-emerald-400/80 to-emerald-300/80"
                label="Top"
                onPointerDown={(e) => onPointerDown('top', e)}
              />
            )}

            {levelY != null && (
              <Guide
                y={levelY}
                color="from-sky-400/80 to-sky-300/80"
                label="Level"
                onPointerDown={(e) => onPointerDown('level', e)}
              />
            )}

            {bottomY != null && (
              <Guide
                y={bottomY}
                color="from-rose-400/80 to-rose-300/80"
                label="Bottom"
                onPointerDown={(e) => onPointerDown('bottom', e)}
              />
            )}
          </div>

          {/* Readout */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold mb-3">Estimates</h2>
            <StatRow label="Estimated % full" value={`${pct}%`} />
            <StatRow label="Estimated mL remaining" value={`${round2(mlRemaining)} mL`} />
            <StatRow label="Estimated mL used" value={`${round2(mlUsed)} mL`} />

            <div className="mt-4">
              <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-white/60"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-white/60">
                Calibrated from your Top/Bottom guides; accuracy depends on placement and the bottle’s
                vertical interior. Curved bottles may introduce error.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-white/50">
          Tips: For better accuracy, align the phone/monitor perpendicular to the bottle; avoid curved glass and thick bases.
          You can fine-tune by zooming browser (Ctrl/Cmd + +/-) to match bottle height.
        </div>
      </div>
    </>
  );
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function StatRow({ label, value }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-white/80">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Guide({ y, onPointerDown, color, label }) {
  return (
    <div
      className="absolute left-0 right-0 cursor-row-resize select-none touch-none"
      style={{ top: y - 1 }}
      onPointerDown={onPointerDown}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="mx-2 flex items-center justify-between">
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs md:text-xs lg:text-sm">{label}</span>
        <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] md:text-xs">Drag</span>
      </div>
      <div className={`h-[3px] md:h-[2px] w-full bg-gradient-to-r ${color} from-10% to-90%`} />
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 rounded-full bg-white/20" />
      <div className="absolute -right-1 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 rounded-full bg-white/20" />
    </div>
  );
}
