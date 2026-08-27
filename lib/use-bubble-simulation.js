import { useEffect, useRef } from 'react';
import { forceSimulation, forceManyBody, forceCollide, forceX, forceY } from 'd3-force';

/**
 * Canvas-driven force simulation. No React state updates inside the tick
 * loop — d3-force mutates node objects in place and we draw straight to the
 * canvas on each tick, so re-renders never compete with the physics.
 *
 * Under reduceMotion, the simulation is stepped synchronously to
 * convergence once and drawn as a static (but still physics-derived,
 * non-overlapping) layout instead of animating.
 */
export function useBubbleSimulation({ canvasRef, items, width, height, reduceMotion, colorFor }) {
  const nodesRef = useRef([]);
  const simRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height || !items.length) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const maxTotal = Math.max(...items.map(i => i.total), 1);
    const minR = 28;
    const maxR = Math.max(minR + 20, Math.min(width, height) / 4.5);
    const nodes = items.map(item => ({
      ...item,
      r: minR + (maxR - minR) * Math.sqrt(item.total / maxTotal),
      x: width / 2 + (Math.random() - 0.5) * width * 0.7,
      y: height / 2 + (Math.random() - 0.5) * height * 0.7,
    }));
    nodesRef.current = nodes;

    const sim = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(6))
      .force('collide', forceCollide(d => d.r + 5).iterations(2))
      .force('x', forceX(width / 2).strength(0.045))
      .force('y', forceY(height / 2).strength(0.045))
      .alphaDecay(0.025);

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const n of nodes) {
        const color = colorFor(n.name);
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        grad.addColorStop(0, color);
        grad.addColorStop(1, '#0a0a0a');
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.stroke();

        if (n.r > 22) {
          const maxChars = Math.floor(n.r / 4.2);
          const label = n.name.length > maxChars ? `${n.name.slice(0, maxChars - 1)}…` : n.name;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.font = `600 ${Math.max(10, Math.min(14, n.r / 2.8))}px system-ui, -apple-system, sans-serif`;
          ctx.fillText(label, n.x, n.y - 5);
          ctx.fillStyle = 'rgba(255,255,255,0.65)';
          ctx.font = '400 10px system-ui, -apple-system, sans-serif';
          ctx.fillText(String(n.total), n.x, n.y + 10);
        }
      }
    }

    if (reduceMotion) {
      sim.stop();
      for (let i = 0; i < 300; i++) sim.tick();
      draw();
    } else {
      sim.on('tick', draw);
    }

    simRef.current = sim;
    return () => sim.stop();
  }, [canvasRef, items, width, height, reduceMotion, colorFor]);

  function hitTest(clientX, clientY) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = x - n.x;
      const dy = y - n.y;
      if (dx * dx + dy * dy <= n.r * n.r) return n;
    }
    return null;
  }

  return { hitTest };
}
