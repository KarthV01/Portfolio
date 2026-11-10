/* Resolution-independent technical illustration; no WebGL or image-frame strips.
   A small Canvas2D scene is projected from 3D mechanical coordinates each frame. */
class EngineDrawing {
  constructor(canvas, mode = "engine") {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.mode = mode;
    this.phase = 0;
    this.frame = 0;
    this.speed = 0;
    this.last = 0;
    this.observer = new ResizeObserver(() => this.draw());
    this.observer.observe(canvas);
    this.draw();
  }
  setSpeed(speed) {
    this.speed = speed;
    if (speed && !this.frame && !document.hidden)
      this.frame = requestAnimationFrame((t) => this.tick(t));
    if (!speed) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.last = 0;
      this.draw();
    }
  }
  tick(time) {
    this.frame = 0;
    if (document.hidden || !this.canvas.isConnected) {
      this.last = 0;
      return;
    }
    if (this.last)
      this.phase += Math.min((time - this.last) / 1000, 0.05) * this.speed;
    this.last = time;
    this.draw();
    if (this.speed) this.frame = requestAnimationFrame((t) => this.tick(t));
  }
  destroy() {
    this.setSpeed(0);
    this.observer.disconnect();
  }
  project([x, y, z]) {
    // Nearly level view from the front-left quarter; longitudinal axis reads horizontally.
    return [
      this.w / 2 + (z * 0.86 + x * 0.51) * this.scale,
      this.h * 0.66 + (-y * 0.96 + x * 0.24 - z * 0.14) * this.scale,
    ];
  }
  path(points, color = this.ink, fill = null, width = 1, close = false) {
    const c = this.ctx;
    c.beginPath();
    points.forEach((p, i) => {
      const q = this.project(p);
      i ? c.lineTo(...q) : c.moveTo(...q);
    });
    if (close) c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  }
  circle(center, radius, axis = "z", color = this.ink, fill = null, width = 1) {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      pts.push(
        axis === "z"
          ? [
              center[0] + Math.cos(a) * radius,
              center[1] + Math.sin(a) * radius,
              center[2],
            ]
          : [
              center[0] + Math.cos(a) * radius,
              center[1],
              center[2] + Math.sin(a) * radius,
            ],
      );
    }
    this.path(pts, color, fill, width, true);
  }
  journal(x, y, z, radius, length, color = this.ink) {
    this.circle([x, y, z - length / 2], radius, "z", color, this.paper);
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      this.path(
        [
          [x + radius * Math.cos(a), y + radius * Math.sin(a), z - length / 2],
          [x + radius * Math.cos(a), y + radius * Math.sin(a), z + length / 2],
        ],
        color,
      );
    }
    this.circle([x, y, z + length / 2], radius, "z", color, this.paper);
  }
  piston(p) {
    const c = this.ctx,
      s = Math.sin(p.angle),
      co = Math.cos(p.angle);
    const local = (x, y, z) => [
      p.wrist[0] + co * x + s * y,
      p.wrist[1] - s * x + co * y,
      p.wrist[2] + z,
    ];
    const ring = (height, r = 0.47) =>
      Array.from({ length: 41 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2;
        return local(r * Math.cos(a), height, r * Math.sin(a));
      });
    const firing = p.firing && this.speed > 0;
    const color = firing ? this.blue : this.ink;
    // Articulating rod: both ends share the exact slider-crank solution.
    const dx = p.wrist[0] - p.pin[0],
      dy = p.wrist[1] - p.pin[1];
    const nx = -dy / LT6.rodLength,
      ny = dx / LT6.rodLength;
    const side = (v, w) => [v[0] + nx * w, v[1] + ny * w, v[2]];
    this.path(
      [
        side(p.pin, 0.13),
        side(p.wrist, 0.07),
        side(p.wrist, -0.07),
        side(p.pin, -0.13),
      ],
      color,
      this.paper,
      1.2,
      true,
    );
    this.path([p.pin, p.wrist], this.faint);
    this.circle(p.pin, 0.19, "z", color, this.paper);
    this.circle(p.pin, 0.115, "z", color);
    this.circle(p.wrist, 0.095, "z", color, this.paper);
    this.path(ring(-0.18), color);
    for (const x of [-0.47, 0.47])
      this.path([local(x, -0.18, 0), local(x, 0.22, 0)], color);
    for (const h of [0.1, 0.16, 0.22]) this.path(ring(h), color);
    this.path(ring(0.22), color, firing ? this.pulse : this.paper, 1.4, true);
    // Valve reliefs, lightly etched into the crown.
    for (const [x, z] of [
      [-0.19, -0.17],
      [-0.19, 0.17],
      [0.19, -0.17],
      [0.19, 0.17],
    ]) {
      const pts = Array.from({ length: 17 }, (_, i) =>
        local(
          x + 0.115 * Math.cos((i / 16) * Math.PI * 2),
          0.225,
          z + 0.115 * Math.sin((i / 16) * Math.PI * 2),
        ),
      );
      this.path(pts, firing ? this.blue : this.faint);
    }
    const label = this.project(local(0, 0.38, 0));
    c.fillStyle = firing ? this.blue : this.ink;
    c.font = "500 11px 'JetBrains Mono', monospace";
    c.textAlign = "center";
    c.fillText(String(p.number), ...label);
  }
  crank() {
    for (let i = 0; i < 5; i++) this.journal(0, 0, -2.24 + i * 1.12, 0.2, 0.28);
    for (let i = 0; i < 4; i++) {
      const p = LT6.cylinder(i * 2 + 1, this.phase);
      const x = p.pin[0],
        y = p.pin[1],
        z = -1.68 + i * 1.12;
      const a = this.phase + Math.PI / 4 + [0, Math.PI, Math.PI, 0][i];
      const rotate = (u, v, depth) => [
        u * Math.cos(a) + v * Math.sin(a),
        -u * Math.sin(a) + v * Math.cos(a),
        depth,
      ];
      for (const dz of [-0.36, 0.36]) {
        // Counterweight crescents opposite the crankpin, linked by forged webs.
        const profile = [
          [-0.19, 0.4],
          [0.19, 0.4],
          [0.24, 0.02],
          [0.43, -0.22],
          [0.33, -0.46],
          [0, -0.53],
          [-0.33, -0.46],
          [-0.43, -0.22],
          [-0.24, 0.02],
        ];
        this.path(
          profile.map(([u, v]) => rotate(u, v, z + dz)),
          this.ink,
          this.paper,
          1.2,
          true,
        );
      }
      this.journal(
        x,
        y,
        z,
        0.16,
        0.58,
        this.mode === "crank" ? this.blue : this.ink,
      );
    }
    this.journal(0, 0, -2.6, 0.13, 0.48);
    this.journal(0, 0, 2.48, 0.38, 0.16);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + this.phase;
      this.circle(
        [Math.cos(a) * 0.27, Math.sin(a) * 0.27, 2.58],
        0.035,
        "z",
        this.faint,
      );
    }
  }
  shell() {
    // Sparse section boundaries frame the mechanism without hiding its motion.
    for (const side of [-1, 1]) {
      const outline = [
        [side * 0.45, -0.5, -2.2],
        [side * 1.65, 1.55, -2.2],
        [side * 1.65, 1.55, 2.2],
        [side * 0.45, -0.5, 2.2],
      ];
      this.path(outline, this.faint, null, 0.8, true);
      for (const height of [1.85, 2.02]) {
        this.path(
          [
            [side * 1.4, height, -2.2],
            [side * 1.4, height, 2.2],
            [side * 0.95, height + 0.28, 2.2],
            [side * 0.95, height + 0.28, -2.2],
          ],
          this.faint,
          null,
          1,
          true,
        );
      }
      for (let i = 0; i < 4; i++) {
        const z = -1.68 + i * 1.12;
        this.circle([side * 1.4, 2.02, z], 0.045, "y", this.faint);
      }
    }
    this.path(
      [
        [-0.45, -0.5, -2.2],
        [-0.55, -0.75, -1.9],
        [-0.55, -0.75, 1.9],
        [-0.45, -0.5, 2.2],
      ],
      this.faint,
    );
  }
  draw() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = rect.width;
    this.h = rect.height;
    if (
      this.canvas.width !== Math.round(this.w * dpr) ||
      this.canvas.height !== Math.round(this.h * dpr)
    ) {
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
    }
    const c = this.ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    c.lineJoin = "round";
    c.lineCap = "round";
    const dark = document.body.dataset.state === "inspecting";
    this.paper = dark ? "#14171d" : "#fafafc";
    this.ink = dark ? "#cbd2df" : "#374151";
    this.faint = dark ? "#424c60" : "#c1c9d6";
    this.blue = dark ? "#5488ff" : "#285be8";
    this.pulse = dark ? "#17336a" : "#d6e4ff";
    this.scale = Math.min(this.w / 7.6, this.h / 5.4);
    if (this.mode === "engine") this.shell();
    this.crank();
    if (this.mode !== "crank") {
      // Far bank first, then near bank; all eight crowns remain identifiable.
      for (const n of [2, 4, 6, 8, 1, 3, 5, 7])
        this.piston(LT6.cylinder(n, this.phase));
      c.textAlign = "center";
      c.font = "500 10px 'JetBrains Mono', monospace";
      const active = Math.floor(
        LT6.wrap(this.phase, Math.PI * 4) / (Math.PI / 2),
      );
      const spacing = Math.min(28, this.w / 12),
        left = this.w / 2 - 3.5 * spacing;
      LT6.order.forEach((n, i) => {
        c.fillStyle = i === active && this.speed ? this.blue : this.faint;
        c.fillText(n, left + i * spacing, this.h - 28);
        if (i === active && this.speed)
          c.fillRect(left + i * spacing - 5, this.h - 21, 10, 2);
      });
      c.fillStyle = this.ink;
      c.font = "500 8px 'JetBrains Mono', monospace";
      c.fillText("720° CYCLE / SLOW MOTION", this.w / 2, this.h - 7);
    }
    this.canvas.dataset.phase = this.phase.toFixed(3);
  }
}
window.EngineDrawing = EngineDrawing;
