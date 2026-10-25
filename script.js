// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Theme toggle
const root = document.documentElement;
document.getElementById("theme-toggle").addEventListener("click", () => {
  const current =
    root.dataset.theme ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
  repaintScenes();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", repaintScenes);

// Mobile menu
const menuBtn = document.getElementById("menu-toggle");
const links = document.querySelector(".nav__links");
menuBtn.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  menuBtn.setAttribute("aria-expanded", open);
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  })
);

// Nav border on scroll
const nav = document.querySelector(".nav");
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Highlight active section in nav
const navLinks = [...links.querySelectorAll("a")];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) =>
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id)
      );
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
document.querySelectorAll("section[id]").forEach((s) => sectionObserver.observe(s));

// Reveal on scroll
const revealEls = document.querySelectorAll(
  ".section__head, .about, .timeline__item, .card, .skill-row, .edu__item, .contact__inner"
);
revealEls.forEach((el) => el.classList.add("reveal"));
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealEls.forEach((el) => revealObserver.observe(el));

// ============ Canvas art ============
// Each scene draws into a canvas using the theme tokens; animated scenes only run while on screen.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const palette = {};
let paletteVersion = 0; // bumped on theme change so cached layers know to re-render
const readPalette = () => {
  const s = getComputedStyle(root);
  const vars = { accent: "--accent", faint: "--text-faint", muted: "--text-muted", bg: "--bg", elev: "--bg-elev" };
  for (const k in vars) palette[k] = s.getPropertyValue(vars[k]).trim();
  paletteVersion++;
};
readPalette();

const scenes = [];
function repaintScenes() {
  readPalette();
  scenes.forEach((s) => s.paint());
}
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// ============ Parallax ============
// Backgrounds lag behind the page, scrolling at (1 - --parallax) of its speed. Where the browser supports
// scroll-driven animations the CSS moves them on the compositor; otherwise the frame loop below does it.
// JS only measures the travel each layer needs.
const PARALLAX = parseFloat(getComputedStyle(root).getPropertyValue("--parallax")) || 0;
const cssParallax = CSS.supports("animation-timeline: view()");
const artSections = [...document.querySelectorAll(".section--art")];
const layoutParallax = () => {
  root.style.setProperty("--scroll-max", `${root.scrollHeight - innerHeight}px`);
  if (reduceMotion) return;
  for (const sec of artSections)
    sec.style.setProperty("--par-extent", `${Math.ceil((PARALLAX * (sec.offsetHeight + innerHeight)) / 2)}px`);
};
layoutParallax();
addEventListener("resize", layoutParallax);
new ResizeObserver(layoutParallax).observe(document.body);

// The vertical slice of a section-art canvas that is actually on screen, in canvas coordinates
const visibleRange = ({ canvas, h }) => {
  if (reduceMotion) return [0, h];
  const c = canvas.getBoundingClientRect(), sec = canvas.closest("section").getBoundingClientRect();
  return [Math.max(0, Math.max(sec.top, 0) - c.top), Math.min(h, Math.min(sec.bottom, innerHeight) - c.top)];
};
// An offscreen canvas matching a scene's backing store, for layers that are cached between frames
const makeLayer = (s) => {
  const c = document.createElement("canvas");
  c.width = s.canvas.width;
  c.height = s.canvas.height;
  c.getContext("2d").setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
  return c;
};
// Copy rows [y0, y1) of a cached layer onto the scene
const blit = ({ ctx, w, h, dpr }, layer, y0, y1) => {
  y0 = Math.max(0, Math.floor(y0));
  y1 = Math.min(h, Math.ceil(y1));
  if (y1 > y0) ctx.drawImage(layer, 0, y0 * dpr, w * dpr, (y1 - y0) * dpr, 0, y0, w, y1 - y0);
};

function mountScene(canvas, painter) {
  const s = { canvas, ctx: canvas.getContext("2d"), w: 0, h: 0, dpr: 1, visible: false, state: null, lastPaint: -Infinity };
  s.interval = 1000 / (painter.fps || 60);
  s.paint = (t = performance.now() / 1000) => { if (s.state) painter.draw(s, t); };
  new ResizeObserver(() => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height || (width === s.w && Math.abs(height - s.h) < 1)) return;
    s.dpr = Math.min(window.devicePixelRatio || 1, painter.maxDpr || 2);
    s.w = width; s.h = height;
    canvas.width = Math.round(width * s.dpr);
    canvas.height = Math.round(height * s.dpr);
    s.ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
    s.state = painter.setup(s);
    s.paint();
  }).observe(canvas);
  new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; }).observe(canvas);
  scenes.push(s);
}

// --- Hero: a tesseract rotating through planes of R^4, perspective-projected down to the screen
const tesseract = {
  setup() {
    const verts = [...Array(16)].map((_, i) => [0, 1, 2, 3].map((b) => ((i >> b) & 1 ? 1 : -1)));
    const edges = [];
    verts.forEach((_, i) => [0, 1, 2, 3].forEach((b) => { const j = i ^ (1 << b); if (i < j) edges.push([i, j]); }));
    return { verts, edges };
  },
  draw({ ctx, w, h, state }, t) {
    if (reduceMotion) t = 2.4;
    const cx = w / 2, cy = h / 2, unit = Math.min(w, h);
    ctx.clearRect(0, 0, w, h);

    // coordinate plane: dot grid and dashed axes
    const step = unit / 10;
    ctx.fillStyle = palette.faint;
    ctx.globalAlpha = 0.45;
    for (let x = cx % step; x < w; x += step)
      for (let y = cy % step; y < h; y += step) ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
    ctx.strokeStyle = palette.faint;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.stroke();
    ctx.setLineDash([]);

    const rot = (p, i, j, a) => {
      const c = Math.cos(a), s = Math.sin(a), u = p[i], v = p[j];
      p[i] = u * c - v * s;
      p[j] = u * s + v * c;
    };
    const scale = unit * 0.8;
    const pts = state.verts.map((v) => {
      const p = v.slice();
      rot(p, 0, 3, t * 0.45); // XW
      rot(p, 1, 2, t * 0.28); // YZ
      rot(p, 2, 3, t * 0.17); // ZW
      const k = 1 / (4 - p[3]); // project R^4 -> R^3 from w = 4
      return { x: cx + p[0] * k * scale, y: cy + p[1] * k * scale, w: (p[3] + 2) / 4 };
    });

    ctx.strokeStyle = palette.accent;
    for (const [i, j] of state.edges) {
      const d = (pts[i].w + pts[j].w) / 2;
      ctx.globalAlpha = 0.2 + 0.7 * d;
      ctx.lineWidth = 0.8 + 1.6 * d;
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[j].x, pts[j].y);
      ctx.stroke();
    }
    ctx.fillStyle = palette.accent;
    for (const p of pts) {
      const r = 1.5 + 2.5 * p.w;
      ctx.globalAlpha = 0.12;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.5 + 0.5 * p.w;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};

// --- About: a Hamiltonian flow (ẋ = ψy, ẏ = −ψx) on a perturbed cellular stream function, so the plane
// tiles into counter-rotating vortices joined at saddles. Streamlines are level sets of ψ.
// The streamlines and critical points drift slowly, so they are cached on a layer refreshed a few times a
// second; only the particles are drawn every frame.
const VK = Math.PI / 170, VORTEX_SPEED = 2200, LAYER_EVERY = 0.2, LAYER_MARGIN = 260;
const phases = (t) => [0.6 * Math.sin(0.13 * t), 0.5 * Math.cos(0.11 * t), 1.3 - 0.2 * t, 0.15 * t];
// ψ = sin(A) sin(B) + 0.45 sin(C) cos(D)
const psi = (x, y, [a, b, c, d]) =>
  Math.sin(VK * x + a) * Math.sin(VK * y + b) + 0.45 * Math.sin(0.55 * VK * x + c) * Math.cos(0.7 * VK * y + d);
// (ψy, −ψx), differentiated by hand
const velocity = (x, y, [a, b, c, d]) => {
  const A = VK * x + a, B = VK * y + b, C = 0.55 * VK * x + c, D = 0.7 * VK * y + d;
  const sA = Math.sin(A), cA = Math.cos(A), sB = Math.sin(B), cB = Math.cos(B);
  const sC = Math.sin(C), cC = Math.cos(C), sD = Math.sin(D), cD = Math.cos(D);
  return [
    VK * (sA * cB - 0.315 * sC * sD),
    -VK * (cA * sB + 0.2475 * cC * cD),
  ];
};
const vortex = {
  fps: 30,
  maxDpr: 1,
  setup(s) {
    const secH = s.canvas.closest("section").offsetHeight;
    const state = { parts: [], secH, live: 0, last: 0, layer: makeLayer(s), layerT: -Infinity, layerKey: -1, layerRange: [0, 0] };
    const n = Math.round(Math.min(700, Math.max(120, (s.w * secH) / 1100)));
    const [top, bottom] = visibleRange(s);
    for (let i = 0; i < n; i++) state.parts.push(vortex.spawn({}, s.w, top, bottom));
    if (reduceMotion) for (let i = 0; i < 14; i++) vortex.advance(state, s.w, top, bottom, phases(0), 0.08, false);
    return state;
  },
  spawn(p, w, top, bottom) {
    p.x = Math.random() * w;
    p.y = top + Math.random() * (bottom - top);
    p.life = 1.5 + Math.random() * 4;
    p.trail = [];
    return p;
  },
  // only as many particles as the on-screen slice of the section needs, so density stays even
  active: (state, top, bottom) => Math.round(state.parts.length * clamp01((bottom - top) / state.secH)),
  advance(state, w, top, bottom, ph, dt, respawn = true) {
    const k = VORTEX_SPEED * dt, n = vortex.active(state, top, bottom);
    // particles joining the active set start fresh, spread over what is on screen now
    for (let i = state.live; i < n; i++) vortex.spawn(state.parts[i], w, top, bottom);
    state.live = n;
    for (let i = 0; i < n; i++) {
      const p = state.parts[i];
      const [u, v] = velocity(p.x, p.y, ph);
      p.x += u * k;
      p.y += v * k;
      p.life -= dt;
      p.trail.push(p.x, p.y);
      if (p.trail.length > 32) p.trail.splice(0, 2);
      if (respawn && (p.life < 0 || p.x < -20 || p.x > w + 20 || p.y < top - 20 || p.y > bottom + 20))
        vortex.spawn(p, w, top, bottom);
    }
  },
  // streamlines (marching squares on a ψ grid) and critical points, for rows [y0, y1) of the plane
  renderLayer(s, ph, y0, y1) {
    const { w } = s, layer = s.state.layer, ctx = layer.getContext("2d");
    const g = 18, cols = Math.ceil(w / g) + 2;
    y0 = Math.floor(y0 / g) * g - g;
    const rows = Math.ceil((y1 - y0) / g) + 2;
    const val = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) val[r * cols + c] = psi(c * g, y0 + r * g, ph);
    ctx.clearRect(0, 0, w, s.h);

    // every level set crossing each cell, collected into one path (plus the ψ = 0 separatrix web)
    const STEP = 0.15, lines = new Path2D(), zero = new Path2D();
    for (let r = 0; r < rows - 1; r++)
      for (let c = 0; c < cols - 1; c++) {
        const a = val[r * cols + c], b = val[r * cols + c + 1], cc = val[(r + 1) * cols + c + 1], d = val[(r + 1) * cols + c];
        const lo = Math.min(a, b, cc, d), hi = Math.max(a, b, cc, d), x = c * g, y = y0 + r * g;
        for (let i = Math.ceil(lo / STEP); i * STEP < hi; i++) {
          const L = i * STEP, path = i === 0 ? zero : lines;
          const ex = [x + (g * (L - a)) / (b - a), x + g, x + (g * (L - d)) / (cc - d), x];
          const ey = [y, y + (g * (L - b)) / (cc - b), y + g, y + (g * (L - a)) / (d - a)];
          for (const [e1, e2] of MS[(a > L) << 3 | (b > L) << 2 | (cc > L) << 1 | (d > L)]) {
            path.moveTo(ex[e1], ey[e1]);
            path.lineTo(ex[e2], ey[e2]);
          }
        }
      }
    ctx.lineWidth = 1;
    ctx.strokeStyle = palette.faint;
    ctx.globalAlpha = 0.42;
    ctx.stroke(lines);
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.5;
    ctx.stroke(zero);

    // critical points: local minima of |∇ψ|, refined by a Newton step, classified by the Hessian
    const m = (r, c) => {
      const gx = val[r * cols + c + 1] - val[r * cols + c - 1], gy = val[(r + 1) * cols + c] - val[(r - 1) * cols + c];
      return gx * gx + gy * gy;
    };
    const centers = new Path2D(), hubs = new Path2D(), saddles = new Path2D();
    for (let r = 1; r < rows - 1; r++)
      for (let c = 1; c < cols - 1; c++) {
        const here = m(r, c);
        if (here > (0.3 * VK * 2 * g) ** 2) continue;
        let isMin = true;
        for (let dr = -1; dr <= 1 && isMin; dr++)
          for (let dc = -1; dc <= 1; dc++)
            if ((dr || dc) && r + dr > 0 && r + dr < rows - 1 && c + dc > 0 && c + dc < cols - 1 && m(r + dr, c + dc) < here) { isMin = false; break; }
        if (!isMin) continue;
        const at = (dr, dc) => val[(r + dr) * cols + c + dc];
        const gx = (at(0, 1) - at(0, -1)) / (2 * g), gy = (at(1, 0) - at(-1, 0)) / (2 * g);
        const hxx = (at(0, 1) - 2 * at(0, 0) + at(0, -1)) / (g * g), hyy = (at(1, 0) - 2 * at(0, 0) + at(-1, 0)) / (g * g);
        const hxy = (at(1, 1) - at(1, -1) - at(-1, 1) + at(-1, -1)) / (4 * g * g);
        const det = hxx * hyy - hxy * hxy;
        if (Math.abs(det) < 1e-12) continue;
        const dx = -(hyy * gx - hxy * gy) / det, dy = -(hxx * gy - hxy * gx) / det;
        if (Math.hypot(dx, dy) > g) continue;
        const px = c * g + dx, py = y0 + r * g + dy;
        if (det > 0) { // center: a vortex
          centers.moveTo(px + 5, py); centers.arc(px, py, 5, 0, Math.PI * 2);
          hubs.moveTo(px + 1.6, py); hubs.arc(px, py, 1.6, 0, Math.PI * 2);
        } else { // saddle: an x along the separatrices, where the Hessian's quadratic form vanishes
          const disc = Math.sqrt(hxy * hxy - hxx * hyy);
          const angles = Math.abs(hyy) > 1e-12
            ? [Math.atan((-hxy + disc) / hyy), Math.atan((-hxy - disc) / hyy)]
            : [Math.PI / 2, Math.atan2(-hxx, 2 * hxy)];
          for (const th of angles) {
            const ux = Math.cos(th) * 7, uy = Math.sin(th) * 7;
            saddles.moveTo(px - ux, py - uy);
            saddles.lineTo(px + ux, py + uy);
          }
        }
      }
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = palette.accent;
    ctx.fillStyle = palette.accent;
    ctx.stroke(centers);
    ctx.fill(hubs);
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = palette.muted;
    ctx.stroke(saddles);
    ctx.globalAlpha = 1;
  },
  draw(s, t) {
    const { ctx, w, h, state } = s;
    if (reduceMotion) t = 0;
    const ph = phases(t), [top, bottom] = visibleRange(s);
    if (!reduceMotion) {
      vortex.advance(state, w, top, bottom, ph, Math.min(0.05, t - state.last));
      state.last = t;
    }
    const [lt, lb] = state.layerRange;
    if (t - state.layerT >= LAYER_EVERY || state.layerKey !== paletteVersion || top < lt || bottom > lb) {
      state.layerRange = [top - LAYER_MARGIN, bottom + LAYER_MARGIN];
      vortex.renderLayer(s, ph, ...state.layerRange);
      state.layerT = t;
      state.layerKey = paletteVersion;
    }

    ctx.clearRect(0, 0, w, h);
    blit(s, state.layer, top, bottom);

    // particles riding the flow, trails tapered in four alpha bands
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1.3;
    ctx.lineCap = "round";
    for (let q = 0; q < 4; q++) {
      ctx.globalAlpha = 0.1 + 0.15 * q;
      ctx.beginPath();
      for (let j = 0, m = vortex.active(state, top, bottom); j < m; j++) {
        const tr = state.parts[j].trail, n = tr.length / 2;
        for (let i = Math.max(1, Math.ceil((q * n) / 4)); i < n && Math.floor((i / n) * 4) === q; i++) {
          ctx.moveTo(tr[2 * i - 2], tr[2 * i - 1]);
          ctx.lineTo(tr[2 * i], tr[2 * i + 1]);
        }
      }
      ctx.stroke();
    }
    ctx.lineCap = "butt";
    ctx.globalAlpha = 1;
  },
};
// marching-squares segments per corner mask (tl=8, tr=4, br=2, bl=1); edges: 0 top, 1 right, 2 bottom, 3 left
const MS = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[3, 0], [2, 1]], [[0, 2]], [[3, 0]],
  [[3, 0]], [[0, 2]], [[0, 1], [3, 2]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []];

// --- Projects: Dijkstra's wavefront grows a shortest-path tree, then backtracks parents from t to s.
// The graph itself never changes, so it lives on a cached layer; each frame draws only the search.
const dijkstra = (nodes, src) => {
  const n = nodes.length, dist = new Array(n).fill(Infinity), parent = new Array(n).fill(-1), done = new Array(n).fill(false);
  dist[src] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0) break;
    done[u] = true;
    for (const [v, wt] of nodes[u].adj) if (dist[u] + wt < dist[v]) { dist[v] = dist[u] + wt; parent[v] = u; }
  }
  return { dist, parent };
};
const WAVE = 240, TRACE = 1.2, HOLD = 2.6, FADE = 0.9;
const graph = {
  fps: 30,
  maxDpr: 1,
  setup(s) {
    const { w, h } = s, sp = 104, cols = Math.ceil(w / sp) + 1, rows = Math.ceil(h / sp) + 1;
    const nodes = [], idx = new Map(), edges = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (Math.random() < 0.85) {
          idx.set(r * cols + c, nodes.length);
          nodes.push({ x: c * sp + (Math.random() - 0.5) * sp * 0.6, y: r * sp + (Math.random() - 0.5) * sp * 0.6, adj: [] });
        }
    const at = (r, c) => (r < rows && c < cols ? idx.get(r * cols + c) : undefined);
    const link = (a, b) => {
      if (a === undefined || b === undefined) return;
      const wt = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
      nodes[a].adj.push([b, wt]);
      nodes[b].adj.push([a, wt]);
      edges.push([a, b]);
    };
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.8) link(at(r, c), at(r, c + 1));
        if (Math.random() < 0.8) link(at(r, c), at(r + 1, c));
        // at most one diagonal per grid square keeps the graph planar
        if (Math.random() < 0.2) {
          if (Math.random() < 0.5) link(at(r, c), at(r + 1, c + 1));
          else link(at(r, c + 1), at(r + 1, c));
        }
      }
    return { nodes, edges, run: null, layer: makeLayer(s), layerKey: -1 };
  },
  renderLayer({ w, h, state }) {
    const { nodes, edges, layer } = state, ctx = layer.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = palette.faint;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [a, b] of edges) { ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); }
    ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = palette.bg;
    ctx.beginPath();
    for (const n of nodes) { ctx.moveTo(n.x + 2.5, n.y); ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2); }
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  },
  newRun({ canvas, w, state: { nodes } }, t) {
    // pick s and t on screen, clear of the project visuals and card text, so the endpoints stay visible
    const c = canvas.getBoundingClientRect(), sec = canvas.closest("section").getBoundingClientRect();
    const blocked = [...canvas.closest("section").querySelectorAll(".card__media, .card__body > *")].map((el) => el.getBoundingClientRect());
    const open = (n) => {
      const sx = c.left + n.x, sy = c.top + n.y;
      return n.x > 30 && n.x < w - 110 && sy > Math.max(90, sec.top + 60) && sy < Math.min(innerHeight, sec.bottom) - 60 &&
        !blocked.some((r) => sx > r.left - 12 && sx < r.right + 12 && sy > r.top - 12 && sy < r.bottom + 12);
    };
    let pool = nodes.map((_, i) => i).filter((i) => nodes[i].adj.length && open(nodes[i]));
    if (pool.length < 2) pool = nodes.map((_, i) => i).filter((i) => nodes[i].adj.length);
    let best = null;
    for (let tries = 0; tries < 12 && pool.length; tries++) {
      const src = pool[Math.floor(Math.random() * pool.length)];
      const { dist, parent } = dijkstra(nodes, src);
      const far = pool.filter((i) => dist[i] > 700 && dist[i] < 1500);
      const tgt = far.length
        ? far[Math.floor(Math.random() * far.length)]
        : pool.reduce((a, i) => (dist[i] < Infinity && dist[i] > dist[a] ? i : a), src);
      best = { src, tgt, dist, parent, start: t };
      if (far.length) break;
    }
    if (!best || best.tgt === best.src) return null;
    best.path = [];
    for (let v = best.tgt; v >= 0; v = best.parent[v]) best.path.push(v);
    return best;
  },
  draw(s, t) {
    const { ctx, w, h, state } = s, { nodes } = state;
    if (state.layerKey !== paletteVersion) {
      graph.renderLayer(s);
      state.layerKey = paletteVersion;
    }
    const [top, bottom] = visibleRange(s);
    // clear a margin past the visible rows too, so nothing stale is waiting there when it scrolls into view
    ctx.clearRect(0, top - 200, w, bottom - top + 400);
    blit(s, state.layer, top, bottom);

    if (!state.run) state.run = graph.newRun(s, t);
    const run = state.run;
    if (!run) return;
    const { dist, parent, src, tgt, path } = run;
    const reach = dist[tgt] / WAVE;
    let e = t - run.start;
    if (reduceMotion) e = reach + TRACE;
    else if (e > reach + TRACE + HOLD + FADE) { state.run = null; return; }
    const r = Math.min(e, reach) * WAVE;
    const fade = 1 - clamp01((e - reach - TRACE - HOLD) / FADE);

    // shortest-path tree, each edge growing out of its settled parent
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.3 * fade;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    nodes.forEach((n, v) => {
      const p = parent[v];
      if (p < 0 || dist[p] >= r) return;
      const f = Math.min(1, (r - dist[p]) / (dist[v] - dist[p])), P = nodes[p];
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(P.x + (n.x - P.x) * f, P.y + (n.y - P.y) * f);
    });
    ctx.stroke();

    // settled nodes, plus a glow on the frontier
    ctx.fillStyle = palette.accent;
    ctx.globalAlpha = 0.55 * fade;
    ctx.beginPath();
    nodes.forEach((n, v) => { if (dist[v] <= r) { ctx.moveTo(n.x + 2.5, n.y); ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2); } });
    ctx.fill();
    if (e < reach)
      nodes.forEach((n, v) => {
        const age = r - dist[v];
        if (age < 0 || age >= 90) return;
        ctx.globalAlpha = 0.18 * (1 - age / 90) * fade;
        ctx.beginPath(); ctx.arc(n.x, n.y, 4 + age / 8, 0, Math.PI * 2); ctx.fill();
      });

    // backtrack parent pointers from t to s
    if (e > reach) {
      let left = clamp01((e - reach) / TRACE) * dist[tgt];
      ctx.globalAlpha = 0.7 * fade;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(nodes[tgt].x, nodes[tgt].y);
      for (let i = 1; i < path.length && left > 0; i++) {
        const A = nodes[path[i - 1]], B = nodes[path[i]];
        const len = Math.hypot(B.x - A.x, B.y - A.y), f = Math.min(1, left / len);
        ctx.lineTo(A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f);
        left -= len;
      }
      ctx.stroke();
      ctx.lineCap = "butt";
    }

    // endpoints
    ctx.font = `500 12px ${MONO}`;
    ctx.lineWidth = 2;
    const labels = [[src, "s"], [tgt, e > reach ? `t  d=${Math.round(dist[tgt])}` : "t"]];
    for (const [v, label] of labels) {
      const n = nodes[v];
      ctx.globalAlpha = fade;
      ctx.fillStyle = palette.bg;
      ctx.beginPath(); ctx.arc(n.x, n.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = palette.muted;
      ctx.fillText(label, n.x + 12, n.y - 10);
    }
    ctx.globalAlpha = 1;
  },
};

const painters = { tesseract, vortex, graph };
document.querySelectorAll("canvas[data-scene]").forEach((c) => mountScene(c, painters[c.dataset.scene]));
if (!reduceMotion) {
  // fallback parallax for browsers without scroll-driven animations: move the layers from JS, only on change
  const circuit = document.querySelector(".bg-layer__tile");
  const arts = artSections.map((sec) => sec.querySelector(".section__art canvas"));
  let lastScroll = -1;
  const frame = (now) => {
    if (!cssParallax && scrollY !== lastScroll) {
      lastScroll = scrollY;
      circuit.style.transform = `translate3d(0, ${scrollY * PARALLAX}px, 0)`;
      artSections.forEach((sec, i) => {
        const r = sec.getBoundingClientRect();
        arts[i].style.transform = `translate3d(0, ${-(r.top + r.height / 2 - innerHeight / 2) * PARALLAX}px, 0)`;
      });
    }
    for (const s of scenes)
      if (s.visible && now - s.lastPaint >= s.interval - 4) {
        s.lastPaint = now;
        s.paint(now / 1000);
      }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
