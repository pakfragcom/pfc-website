import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import SEO from '../../components/SEO';

const STORAGE_KEY = 'pfc-bottle-level-calib-v3';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function round2(n) {
  return Math.round(n * 100) / 100;
}

export default function BottleLevelEstimator() {
  const containerRef = useRef(null);

  // Core guides
  const [bottleSize, setBottleSize] = useState(100); // mL
  const [topY, setTopY] = useState(null);
  const [bottomY, setBottomY] = useState(null);
  const [levelY, setLevelY] = useState(null);
  const [calibY, setCalibY] = useState(null);
  const [drag, setDrag] = useState(null);
  const [pxHeight, setPxHeight] = useState(0);

  // UX state
  const [showPro, setShowPro] = useState(false);

  // Advanced modeling
  const [neckTopPct, setNeckTopPct] = useState(0);        // fraction of total span to exclude at top (0..0.4)
  const [deadBottomPct, setDeadBottomPct] = useState(0);  // fraction to exclude at bottom (0..0.3)

  const [shapeMode, setShapeMode] = useState('linear'); // 'linear' | 'power' | 'auto'
  const [alpha, setAlpha] = useState(1);                // exponent for 'power'
  const [calibType, setCalibType] = useState('percent'); // 'percent' | 'ml'
  const [calibValue, setCalibValue] = useState(50);      // for auto-fit

  // Load saved state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.bottleSize === 'number') setBottleSize(s.bottleSize);
        ['topY','bottomY','levelY','calibY','pxHeight'].forEach(k => {
          if (typeof s[k] === 'number') ({ topY: setTopY, bottomY: setBottomY, levelY: setLevelY, calibY: setCalibY, pxHeight: setPxHeight }[k])(s[k]);
        });
        if (typeof s.neckTopPct === 'number') setNeckTopPct(s.neckTopPct);
        if (typeof s.deadBottomPct === 'number') setDeadBottomPct(s.deadBottomPct);
        if (typeof s.alpha === 'number') setAlpha(s.alpha);
        if (typeof s.shapeMode === 'string') setShapeMode(s.shapeMode);
        if (typeof s.calibType === 'string') setCalibType(s.calibType);
        if (typeof s.calibValue === 'number') setCalibValue(s.calibValue);
        if (typeof s.showPro === 'boolean') setShowPro(s.showPro);
      }
    } catch {}
  }, []);

  // Measure container & defaults
  useEffect(() => {
    function measure() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const h = rect.height;
      setPxHeight(h);
      if (topY == null || bottomY == null || levelY == null || calibY == null) {
        const t = Math.round(h * 0.1);
        const b = Math.round(h * 0.9);
        const lv = Math.round(h * 0.5);
        const cv = Math.round(h * 0.7);
        setTopY(prev => (prev == null ? t : prev));
        setBottomY(prev => (prev == null ? b : prev));
        setLevelY(prev => (prev == null ? lv : prev));
        setCalibY(prev => (prev == null ? cv : prev));
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [topY, bottomY, levelY, calibY]);

  // Save state
  useEffect(() => {
    if (pxHeight === 0) return;
    const state = {
      bottleSize, topY, bottomY, levelY, calibY, pxHeight,
      neckTopPct, deadBottomPct, alpha, shapeMode, calibType, calibValue,
      showPro,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [bottleSize, topY, bottomY, levelY, calibY, pxHeight, neckTopPct, deadBottomPct, alpha, shapeMode, calibType, calibValue, showPro]);

  // Drag helpers
  const onPointerDown = useCallback((type, e) => {
    e.preventDefault();
    setDrag(type);
    if (navigator.vibrate) try { navigator.vibrate(8); } catch {}
  }, []);
  const onPointerMove = useCallback((e) => {
    if (!drag) return;
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = clamp(e.clientY - rect.top, 0, rect.height);

    if (drag === 'top') {
      const ny = Math.min(y, (bottomY ?? rect.height) - 6);
      setTopY(ny);
      setLevelY(lv => clamp(lv ?? ny + 2, ny + 2, (bottomY ?? rect.height) - 2));
      setCalibY(cv => clamp(cv ?? ny + 2, ny + 2, (bottomY ?? rect.height) - 2));
    } else if (drag === 'bottom') {
      const ny = Math.max(y, (topY ?? 0) + 6);
      setBottomY(ny);
      setLevelY(lv => clamp(lv ?? ny - 2, (topY ?? 0) + 2, ny - 2));
      setCalibY(cv => clamp(cv ?? ny - 2, (topY ?? 0) + 2, ny - 2));
    } else if (drag === 'level') {
      const ny = clamp(y, (topY ?? 0) + 2, (bottomY ?? rect.height) - 2);
      setLevelY(ny);
    } else if (drag === 'calib') {
      const ny = clamp(y, (topY ?? 0) + 2, (bottomY ?? rect.height) - 2);
      setCalibY(ny);
    }
  }, [drag, topY, bottomY]);
  const onPointerUp = useCallback(() => setDrag(null), []);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [drag, onPointerMove, onPointerUp]);

  // Keyboard nudging
  const nudge = (setter) => (delta) => setter(y => (y == null ? y : y + delta));
  const onGuideKeyDown = (setter) => (e) => {
    const step = e.shiftKey ? 5 : 1;
    if (e.key === 'ArrowUp') { e.preventDefault(); nudge(setter)(-step); }
    if (e.key === 'ArrowDown') { e.preventDefault(); nudge(setter)(step); }
  };

  // Geometry math
  const span = useMemo(() => {
    if (topY == null || bottomY == null) return 1;
    return Math.max(bottomY - topY, 1);
  }, [topY, bottomY]);

  const usableWindow = useMemo(() => {
    const exclTop = clamp(neckTopPct, 0, 0.4);
    const exclBottom = clamp(deadBottomPct, 0, 0.3);
    const totalExcl = Math.min(exclTop + exclBottom, 0.9);
    return { exclTop, exclBottom, totalExcl };
  }, [neckTopPct, deadBottomPct]);

  const fracFromY = useCallback((y) => {
    if (topY == null || bottomY == null || y == null) return 0;
    const raw = clamp((bottomY - y) / span, 0, 1); // 0 at top, 1 at bottom
    const { exclBottom, totalExcl } = usableWindow;
    const denom = 1 - totalExcl;
    if (denom <= 0.0001) return 0;
    const shifted = clamp(raw - exclBottom, 0, 1 - exclBottom);
    return clamp(shifted / denom, 0, 1);
  }, [topY, bottomY, span, usableWindow]);

  const autoAlpha = useMemo(() => {
    if (shapeMode !== 'auto') return alpha;
    const f = fracFromY(calibY);
    let r; // remaining fraction at calibY
    if (calibType === 'percent') r = clamp((calibValue || 0) / 100, 0.0001, 0.9999);
    else r = clamp((calibValue || 0) / Math.max(bottleSize, 0.0001), 0.0001, 0.9999);
    if (f <= 0.0001 || f >= 0.9999) return alpha;
    const a = Math.log(r) / Math.log(f);
    return clamp(a, 0.3, 3.0);
  }, [shapeMode, calibY, calibType, calibValue, bottleSize, fracFromY, alpha]);

  const fractionFull = useMemo(() => {
    if (pxHeight === 0 || topY == null || bottomY == null || levelY == null) return 0;
    const f = clamp(fracFromY(levelY), 0, 1);
    if (shapeMode === 'linear') return f;
    if (shapeMode === 'power') return Math.pow(f, clamp(alpha, 0.3, 3.0));
    return Math.pow(f, autoAlpha); // auto-fit
  }, [pxHeight, topY, bottomY, levelY, shapeMode, alpha, autoAlpha, fracFromY]);

  const mlRemaining = useMemo(() => bottleSize * fractionFull, [bottleSize, fractionFull]);
  const mlUsed = useMemo(() => bottleSize - mlRemaining, [bottleSize, mlRemaining]);
  const pct = Math.round(fractionFull * 100);

  // UX helpers
  function resetGuides() {
    if (!containerRef.current) return;
    const h = containerRef.current.getBoundingClientRect().height;
    setTopY(Math.round(h * 0.1));
    setBottomY(Math.round(h * 0.9));
    setLevelY(Math.round(h * 0.5));
    setCalibY(Math.round(h * 0.7));
  }
  function applyPreset(preset) {
    // Friendly presets that set shape + α behind the scenes
    if (preset === 'taperedTop') { setShapeMode('power'); setAlpha(0.65); }
    if (preset === 'uniform')    { setShapeMode('linear'); setAlpha(1); }
    if (preset === 'bulgedBase') { setShapeMode('power'); setAlpha(1.4); }
  }

  return (
    <>
      <SEO
        title="PFC Bottle Level Estimator"
        description="Drag three guides and get an instant estimate of how much fragrance is left. Friendly presets for bottle shapes and an optional Pro panel for precision."
      />

      <div className="mx-auto max-w-6xl px-4 py-6 text-white">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">PFC Bottle Level Estimator</h1>
            <p className="text-white/70">
              Drag <b>Top</b>, <b>Bottom</b>, and <b>Level</b> to match your bottle. Pick a shape preset if it isn’t straight‑sided.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              <span className="text-white/80">Bottle size</span>
              <input
                type="number"
                min={1}
                value={bottleSize}
                onChange={(e) => setBottleSize(Number(e.target.value) || 0)}
                className="w-28 rounded-md bg-white/10 px-3 py-2"
              />
              <span className="text-white/60">mL</span>
            </label>
            <button
              onClick={resetGuides}
              className="rounded-md bg-white/10 px-3 py-2 hover:bg-white/15 transition"
              title="Reset guides to defaults"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          {/* Canvas */}
          <div
            ref={containerRef}
            className="relative h-[74vh] md:h-[60vh] min-h-[460px] rounded-2xl border border-white/10 bg-gradient-to-b from-black/40 to-black/20 touch-none"
          >
            {/* Soft bottle silhouette */}
            <div className="pointer-events-none absolute inset-x-12 top-6 bottom-6 rounded-[40px] border border-white/5 bg-white/[0.02]" />

            {/* Guides */}
            {topY != null && (
              <Guide
                y={topY}
                color="from-emerald-400/80 to-emerald-300/80"
                label="Top"
                onPointerDown={(e) => onPointerDown('top', e)}
                onKeyDown={onGuideKeyDown(setTopY)}
              />
            )}
            {levelY != null && (
              <Guide
                y={levelY}
                color="from-sky-400/80 to-sky-300/80"
                label="Level"
                onPointerDown={(e) => onPointerDown('level', e)}
                onKeyDown={onGuideKeyDown(setLevelY)}
              />
            )}
            {calibY != null && showPro && (
              <Guide
                y={calibY}
                color="from-amber-400/80 to-amber-300/80"
                label="Calib"
                onPointerDown={(e) => onPointerDown('calib', e)}
                onKeyDown={onGuideKeyDown(setCalibY)}
                subtle
              />
            )}
            {bottomY != null && (
              <Guide
                y={bottomY}
                color="from-rose-400/80 to-rose-300/80"
                label="Bottom"
                onPointerDown={(e) => onPointerDown('bottom', e)}
                onKeyDown={onGuideKeyDown(setBottomY)}
              />
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Big result card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-white/70">Estimated remaining</div>
                <div className="rounded-full bg-white/10 px-2 py-1 text-xs">{pct}% full</div>
              </div>
              <div className="text-4xl font-semibold leading-none">{round2(mlRemaining)} mL</div>
              <div className="mt-1 text-sm text-white/70">Used: {round2(mlUsed)} mL</div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-white/70 transition-[width] duration-300" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-3 text-xs text-white/60">
                Tip: align your screen straight with the bottle. If the bottle narrows at the top or bulges at the base, choose a preset below.
              </p>
            </div>

            {/* Shape presets (simple) */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">Bottle shape</h3>
                <button
                  className="text-xs text-white/70 hover:text-white"
                  onClick={() => setShowPro(v => !v)}
                >
                  {showPro ? 'Hide Pro' : 'Improve accuracy'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <PresetButton
                  icon="🍾"
                  label="Tapered"
                  active={shapeMode !== 'linear' && alpha < 1}
                  onClick={() => applyPreset('taperedTop')}
                />
                <PresetButton
                  icon="▮"
                  label="Uniform"
                  active={shapeMode === 'linear'}
                  onClick={() => applyPreset('uniform')}
                />
                <PresetButton
                  icon="🔶"
                  label="Bulged"
                  active={shapeMode !== 'linear' && alpha > 1}
                  onClick={() => applyPreset('bulgedBase')}
                />
              </div>
              <div className="mt-2 text-xs text-white/60">
                Not sure? Start with <b>Uniform</b>. Change if the estimate looks off.
              </div>
            </div>

            {/* Pro panel (accordion style) */}
            {showPro && (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="border-b border-white/10 p-4">
                  <h3 className="font-semibold">Pro calibration</h3>
                  <p className="mt-1 text-xs text-white/60">
                    For tricky bottles: auto-fit a curve from a known checkpoint, or fine-tune offsets for neck/headspace and thick bases.
                  </p>
                </div>

                {/* Mode selector */}
                <div className="p-4">
                  <label className="mb-2 flex items-center gap-2">
                    <span className="w-28 text-white/80">Mode</span>
                    <select
                      value={shapeMode}
                      onChange={(e) => setShapeMode(e.target.value)}
                      className="flex-1 rounded-md bg-white/10 px-3 py-2"
                    >
                      <option value="linear">Linear</option>
                      <option value="power">Power curve</option>
                      <option value="auto">Auto‑fit from checkpoint</option>
                    </select>
                  </label>

                  {shapeMode === 'power' && (
                    <label className="mt-2 flex items-center gap-2">
                      <span className="w-28 text-white/80">Shape (α)</span>
                      <input
                        type="range"
                        min={0.3}
                        max={3}
                        step={0.01}
                        value={alpha}
                        onChange={(e) => setAlpha(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="w-14 text-right">{alpha.toFixed(2)}</span>
                    </label>
                  )}

                  {shapeMode === 'auto' && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-white/60">
                        Drag the <b>Calib</b> guide to a height you trust (e.g., after adding a known amount). Enter how full it is here — we’ll compute the curve.
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={calibType}
                          onChange={(e) => setCalibType(e.target.value)}
                          className="rounded-md bg-white/10 px-3 py-2"
                        >
                          <option value="percent">% full</option>
                          <option value="ml">mL remaining</option>
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={calibValue}
                          onChange={(e) => setCalibValue(Number(e.target.value))}
                          className="w-28 rounded-md bg-white/10 px-3 py-2"
                        />
                        <div className="text-xs text-white/50 ml-1">α ≈ {autoAlpha.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Offsets */}
                <div className="border-t border-white/10 p-4">
                  <h4 className="mb-2 font-medium">Offsets (exclude non‑usable height)</h4>
                  <label className="mb-2 flex items-center gap-2">
                    <span className="w-44 text-white/80">Top neck / headspace</span>
                    <input
                      type="range"
                      min={0}
                      max={0.4}
                      step={0.005}
                      value={neckTopPct}
                      onChange={(e) => setNeckTopPct(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-12 text-right">{Math.round(neckTopPct * 100)}%</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-44 text-white/80">Bottom dead volume</span>
                    <input
                      type="range"
                      min={0}
                      max={0.3}
                      step={0.005}
                      value={deadBottomPct}
                      onChange={(e) => setDeadBottomPct(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-12 text-right">{Math.round(deadBottomPct * 100)}%</span>
                  </label>
                </div>

                <div className="border-t border-white/10 p-4 text-xs text-white/55">
                  Pro tips: Use Shift + Arrow keys for fine nudging. If you see big errors at the top or bottom,
                  try small offsets (2–5%) and re‑check.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-xs text-white/55">
          Heads‑up: estimates depend on placement and glass shape. You can zoom the page (Ctrl/Cmd + +/–) so the silhouette matches your bottle height.
        </div>
      </div>
    </>
  );
}

function PresetButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition
        ${active ? 'bg-white/20 ring-1 ring-white/30' : 'bg-white/8 hover:bg-white/12'}`}
      title={label}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-white/80">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Guide({ y, onPointerDown, color, label, onKeyDown, subtle }) {
  return (
    <div
      className="absolute left-0 right-0 cursor-row-resize select-none touch-none outline-none"
      style={{ top: y - 1 }}
      onPointerDown={onPointerDown}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="mx-2 flex items-center justify-between">
        <span className={`rounded-md ${subtle ? 'bg-white/5' : 'bg-white/10'} px-2 py-1 text-xs md:text-xs lg:text-sm`}>{label}</span>
        <span className={`rounded-md ${subtle ? 'bg-white/5' : 'bg-white/10'} px-2 py-1 text-[10px] md:text-xs`}>Drag</span>
      </div>
      <div className={`h-[3px] md:h-[2px] w-full bg-gradient-to-r ${color} from-10% to-90%`} />
      <div className={`absolute -left-1 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 rounded-full ${subtle ? 'bg-white/10' : 'bg-white/20'}`} />
      <div className={`absolute -right-1 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 rounded-full ${subtle ? 'bg-white/10' : 'bg-white/20'}`} />
    </div>
  );
}
