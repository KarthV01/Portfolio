"use strict";

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
// Each component owns both its assembled anchor and its exploded displacement.
const parts = [
  {
    id: "spark",
    name: "Spark plugs",
    title: "What’s my spark?",
    label: "01 / THE MOTIVATION",
    x: 445,
    y: 270,
    dx: 0,
    dy: -113,
    html: "<p>I’m drawn to engineering because it turns ideas into systems you can test, break, understand, and rebuild. I enjoy the point where software meets real constraints and correctness starts to matter.</p><p>I learn by building, breaking, and making the next version better.</p>",
  },
  {
    id: "head",
    name: "Cylinder head",
    title: "A foundation for curiosity.",
    label: "02 / THE FOUNDATION",
    x: 445,
    y: 322,
    dx: 0,
    dy: -68,
    html: '<p>B.S. Electrical &amp; Computer Engineering at Rutgers University, New Brunswick. Minors in Mathematics and Computer Science.</p><p class="role">EXPECTED MAY 2028</p><p>Connecting computer architecture, machine learning, and mathematics to the systems I build.</p>',
  },
  {
    id: "pistons",
    name: "Pistons",
    title: "Experience in motion.",
    label: "03 / THE EXPERIENCE",
    x: 445,
    y: 390,
    dx: 0,
    dy: -18,
    html: '<div class="project"><h3>Mind360 AI</h3><span class="role">SOFTWARE ENGINEER · MAY–AUG 2026</span><p>Integrated 8 prediction-market venues with concurrent requests and live order-book validation. Built checkpoint recovery and OCR workflows across model providers.</p></div><div class="project"><h3>Aviro AI · YC S25</h3><span class="role">ML RESEARCH INTERN · JAN–MAY 2026</span><p>Built enterprise evaluation environments, benchmarked 8 frontier models, and contributed to a 7,200-rollout reinforcement-training run.</p></div>',
  },
  {
    id: "crank",
    name: "Crankshaft",
    title: "Ideas into output.",
    label: "04 / SELECTED PROJECTS",
    x: 445,
    y: 502,
    dx: 0,
    dy: 84,
    html: '<div class="project"><h3>Nemesis</h3><p>Adversarial multi-agent reinforcement learning for cybersecurity. Attacker and defender agents evolve through self-play.</p><a href="https://github.com/KarthV01/Nemesis" target="_blank" rel="noopener">Source ↗</a></div><div class="project"><h3>Stratos</h3><p>Distributed edge computing for drone fleet mapping, with capacity-aware scheduling and restart-resilient survey processing.</p><a href="https://github.com/KarthV01/Stratos" target="_blank" rel="noopener">Source ↗</a></div><div class="project"><h3>Kairos</h3><p>Source-grounded funding discovery and application drafting with Amazon Bedrock agents.</p></div><div class="project"><h3>Fiducia</h3><p>Verified creator milestones and USDC escrow on Base.</p><a href="https://github.com/KarthV01/Fiducia" target="_blank" rel="noopener">Source ↗</a></div><div class="project"><h3>Future360</h3><p>A prediction-market terminal with cross-venue comparison, arbitrage detection, and coordinated multi-leg orders.</p></div>',
  },
  {
    id: "block",
    name: "Engine block",
    title: "Built to hold together.",
    label: "05 / THE TOOLKIT",
    x: 445,
    y: 430,
    dx: -195,
    dy: 40,
    html: '<p>I build reliable systems for applied AI: infrastructure that can recover interrupted work, reject stale data, and keep its claims grounded in evidence.</p><p class="tags">Python · Go · C / C++ · Java<br>TypeScript · SQL · React · FastAPI<br>Redis Streams · gRPC · PostgreSQL<br>AWS · Docker · Kubernetes</p>',
  },
  {
    id: "turbo",
    name: "Turbocharger",
    title: "The next acceleration.",
    label: "06 / CURRENT DIRECTION",
    x: 731,
    y: 326,
    dx: 74,
    dy: -73,
    html: "<p>I’m exploring adversarial multi-agent reinforcement learning, applied AI, and distributed infrastructure.</p><p>The questions that keep me building: how can intelligent systems coordinate reliably, reason over messy evidence, and hold up when things fail?</p>",
  },
  {
    id: "transmission",
    name: "Transmission",
    title: "The complete spec.",
    label: "07 / RÉSUMÉ",
    x: 738,
    y: 485,
    dx: 77,
    dy: 55,
    html: '<p>Experience, education, projects, and the technical details. Everything in one place.</p><a href="Karthik_Resume.pdf" target="_blank" rel="noopener">Open résumé ↗</a><a href="Karthik_Resume.pdf" download>Download PDF ↓</a>',
  },
  {
    id: "ecu",
    name: "ECU & wiring",
    title: "Let’s make a connection.",
    label: "08 / CONTACT",
    x: 213,
    y: 316,
    dx: -81,
    dy: -99,
    html: '<p>Open to internships, collaborations, and interesting conversations. Have something worth building? I’d like to hear about it.</p><a href="mailto:karthik.v.voruganti@gmail.com">Email me ↗</a><a href="https://github.com/KarthV01" target="_blank" rel="noopener">GitHub ↗</a><a href="https://www.linkedin.com/in/karthik-voruganti-05b279326/" target="_blank" rel="noopener">LinkedIn ↗</a>',
  },
];
const commands = [
  {
    code: "engine.start();",
    label: "Start the engine",
    rpm: 850,
    gear: "N",
    output: "[IGNITION] Online. Curiosity initialized.",
  },
  {
    code: "engine.throttle(0.42f);",
    label: "Give it some throttle",
    rpm: 3200,
    gear: "1",
    output: "[THROTTLE] 42% · finding the rhythm.",
  },
  {
    code: "engine.transmission().shift_up();",
    label: "Shift into second",
    rpm: 2100,
    gear: "2",
    output: "[GEAR] 1 → 2 · a little more headroom.",
  },
  {
    code: "engine.throttle(0.86f);",
    label: "Push a little further",
    rpm: 6100,
    gear: "2",
    output: "[THROTTLE] 86% · approaching the limit.",
  },
  {
    code: "engine.redline();",
    label: "See what’s inside",
    rpm: 8000,
    gear: "2",
    output: "[LIMITER] The interesting stuff is inside.",
  },
];
let state = "intro",
  step = 0,
  rpm = 0,
  targetRpm = 0,
  phase = 0,
  selected = 0,
  exploded = 0,
  explodeTarget = 0;
let busy = false,
  generation = 0,
  lastTime = 0,
  particles = [],
  soundEnabled = false,
  audioContext,
  oscillator,
  gain;
const line = (d, extra = "") => `<path d="${d}" ${extra}/>`;
const rect = (x, y, w, h, r = 0, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${extra}/>`;
const circle = (x, y, r, extra = "") =>
  `<circle cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
const bolt = (x, y) => circle(x, y, 3) + line(`M${x - 1.5} ${y}h3`);

function engineDrawing() {
  const guides =
    '<g class="guide-line"><path d="M70 502H920M445 160V680M300 210V650M390 210V650M480 210V650M570 210V650"/><path d="M255 665H625M255 656V674M625 656V674"/></g><text x="440" y="682" class="part-id">PRECISION / CURIOSITY / ITERATION</text>';
  const drawings = {};
  drawings.block =
    rect(249, 348, 384, 154, 9, 'class="metal"') +
    rect(260, 360, 362, 128, 4) +
    line(
      "M249 381h384M249 470h384M265 502l17 32h320l18-32M283 534v14h318v-14",
    ) +
    Array.from({ length: 4 }, (_, i) => {
      const x = 279 + i * 90;
      return (
        rect(x, 367, 53, 106, 5) + line(`M${x + 5} 375v88M${x + 48} 375v88`)
      );
    }).join("") +
    [265, 352, 439, 526, 617].map((x) => bolt(x, 355) + bolt(x, 493)).join("");
  drawings.head =
    rect(247, 304, 388, 45, 5, 'class="metal"') +
    rect(265, 283, 352, 22, 5, 'class="metal"') +
    line("M275 283l10-12h312l10 12M247 325h388") +
    Array.from({ length: 12 }, (_, i) => line(`M${280 + i * 29} 287v13`)).join(
      "",
    ) +
    [265, 353, 441, 529, 617].map((x) => bolt(x, 314) + bolt(x, 338)).join("");
  drawings.spark = Array.from({ length: 4 }, (_, i) => {
    const x = 300 + i * 90;
    return `<g class="spark-plug">${rect(x - 5, 249, 10, 25, 2, 'class="metal"') + rect(x - 8, 269, 16, 10, 1) + line(`M${x - 3} 249v-9h6v9M${x} 279v10`) + [253, 258, 263].map((y) => line(`M${x - 5} ${y}h10`)).join("")}<path class="spark-flash" d="M${x - 8} 293l6 5-3 5 12-7-6-3 4-5" stroke="#e5a452"/></g>`;
  }).join("");
  drawings.pistons = Array.from(
    { length: 4 },
    (_, i) =>
      `<g class="piston" data-index="${i}">${rect(277 + i * 90, 368, 46, 34, 3, 'class="metal"') + line(`M${278 + i * 90} 374h44M${278 + i * 90} 380h44M${278 + i * 90} 386h44`) + circle(300 + i * 90, 395, 5)}<path class="connecting-rod" d=""/></g>`,
  ).join("");
  drawings.crank =
    line("M260 502h368", 'stroke-width="6"') +
    Array.from(
      { length: 4 },
      (_, i) =>
        `<g class="crank-web" data-index="${i}">${rect(284 + i * 90, 484, 32, 36, 6, 'class="metal"') + circle(300 + i * 90, 502, 8) + line(`M${287 + i * 90} 492l25 20`)}</g>`,
    ).join("") +
    circle(248, 502, 34, 'class="metal"') +
    circle(248, 502, 26) +
    circle(248, 502, 10) +
    `<g id="pulley">${line("M248 477v15M248 512v15M223 502h15M258 502h15")}</g>` +
    line("M253 534h367");
  drawings.turbo =
    circle(731, 323, 46, 'class="metal"') +
    circle(731, 323, 30) +
    circle(731, 323, 11) +
    `<g id="turbine">${Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return line(
        `M${731 + 13 * Math.cos(a)} ${323 + 13 * Math.sin(a)}L${731 + 27 * Math.cos(a + 0.5)} ${323 + 27 * Math.sin(a + 0.5)}`,
      );
    }).join("")}</g>` +
    line(
      "M731 277v-25h49v17h-30v10M776 322h30v23h-35M695 352l-25 22h-37M685 313h-30v-36h-30M695 291l-39-42H615",
    ) +
    rect(783, 319, 23, 29, 3) +
    [0, 1, 2, 3].map((i) => line(`M635 ${334 + i * 8}h28l34 18`)).join("");
  drawings.transmission =
    line(
      "M637 437h38l21-22h45l19 22h21l40 31v55l-40 30h-44l-30-19h-70Z",
      'class="metal"',
    ) +
    line(
      "M650 449h43l19-20h25l17 20h23l29 24v43l-29 23h-36l-28-19h-63ZM665 444v84M682 444v84M700 440v87M760 451v82M780 460v68M821 486h35v17h-35",
    ) +
    circle(732, 483, 29) +
    circle(732, 483, 21) +
    circle(732, 483, 8) +
    [0, 1, 2, 3, 4, 5, 6, 7]
      .map((i) => {
        const a = (i * Math.PI) / 4;
        return line(
          `M${732 + 22 * Math.cos(a)} ${483 + 22 * Math.sin(a)}L${732 + 29 * Math.cos(a)} ${483 + 29 * Math.sin(a)}`,
        );
      })
      .join("") +
    bolt(647, 445) +
    bolt(647, 527) +
    bolt(783, 472) +
    bolt(783, 519);
  drawings.ecu =
    rect(168, 285, 79, 61, 5, 'class="metal"') +
    rect(179, 296, 57, 37, 2) +
    rect(192, 304, 30, 20, 1) +
    Array.from({ length: 6 }, (_, i) =>
      line(`M${183 + i * 9} 285v-6M${183 + i * 9} 346v7`),
    ).join("") +
    line(
      "M192 353v24h48l25-30M206 279v-29h51l23 18M179 353v36h61M234 353v16h16",
    ) +
    bolt(174, 291) +
    bolt(241, 340) +
    line("M199 310h16M199 315h9M199 320h16");
  // Back-to-front order keeps the cutaway internals legible.
  $("engine").innerHTML =
    guides +
    [
      "block",
      "head",
      "crank",
      "pistons",
      "spark",
      "turbo",
      "transmission",
      "ecu",
    ]
      .map((id) => {
        const p = parts.find((p) => p.id === id);
        return `<g id="part-${id}" class="engine-part engine-detail" aria-label="${p.name}"><rect class="hit-target" x="${p.x - 55}" y="${p.y - 40}" width="110" height="80"/>${drawings[id]}</g>`;
      })
      .join("");
  parts.forEach((p, i) => {
    const g = $(`part-${p.id}`);
    g.addEventListener("click", () => {
      if (state === "inspecting") selectPart(i);
    });
    g.addEventListener("keydown", (e) => {
      if (state === "inspecting" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        e.stopPropagation();
        selectPart(i);
      }
    });
  });
  $("component-nav").innerHTML = parts
    .map(
      (p, i) =>
        `<button type="button" data-part="${i}" aria-pressed="false">${String(i + 1).padStart(2, "0")} ${p.name}</button>`,
    )
    .join("");
  $("component-nav").addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (button) selectPart(Number(button.dataset.part));
  });
}

function setState(next) {
  state = next;
  document.body.dataset.state = next;
  document.querySelector('meta[name="theme-color"]').content =
    next === "inspecting" ? "#171d1c" : "#fafaf9";
  fitEngine();
}
function fitEngine() {
  // Crop unused drafting margins on constrained screens, keeping parts legible.
  $("engine").setAttribute(
    "viewBox",
    state !== "intro" && (innerWidth <= 760 || innerHeight < 500)
      ? "0 100 950 560"
      : "0 0 1000 760",
  );
}
function renderCommand() {
  const c = commands[step];
  $("command").textContent = c.code;
  $("execute-label").textContent = c.label;
  $("step-label").textContent = `${String(step + 1).padStart(2, "0")} — 05`;
}
function wait(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, reducedMotion.matches ? 0 : ms),
  );
}
async function execute() {
  if (busy || state === "inspecting") return;
  const token = generation,
    c = commands[step];
  busy = true;
  $("execute").disabled = true;
  if (state === "intro") {
    setState("running");
    $("scene-status").textContent = "IGNITION SEQUENCE";
  }
  ensureAudio();
  targetRpm = c.rpm;
  $("gear").textContent = c.gear;
  const entry = document.createElement("div");
  entry.className = "history-entry";
  const command = document.createElement("div");
  command.className = "history-command";
  command.textContent = "❯ " + c.code;
  const output = document.createElement("div");
  output.className = "history-output";
  output.textContent = c.output;
  entry.append(command, output);
  $("history").append(entry);
  $("command-line").hidden = true;
  if (step === 4) {
    setState("redlining");
    $("scene-status").textContent = "REDLINE / 8,000 RPM";
    await wait(1100);
    if (token !== generation) return;
    burst();
    await wait(180);
    if (token !== generation) return;
    inspect();
    await wait(1100);
  } else {
    await wait(step === 2 ? 850 : 650);
    if (token !== generation) return;
    step++;
    renderCommand();
    $("command-line").hidden = false;
    $("scene-status").textContent = "ENGINE RUNNING / PRESS ENTER";
  }
  if (token !== generation) return;
  busy = false;
  $("execute").disabled = false;
  const content = document.querySelector(".terminal-content");
  content.scrollTop = state === "inspecting" ? 0 : content.scrollHeight;
}
function inspect() {
  setState("inspecting");
  explodeTarget = 1;
  targetRpm = 0;
  $("history").hidden = true;
  $("command-line").hidden = true;
  $("component-nav").hidden = false;
  $("skip").hidden = true;
  $("replay").hidden = false;
  $("scene-status").textContent = "INSPECTION MODE";
  $("footer-note").textContent = "← ↑ ↓ → EXPLORE THE ENGINE";
  $("gear").textContent = "—";
  $("execute-label").textContent = "Next component";
  $("step-label").textContent = "← → TO EXPLORE";
  $("execute").disabled = false;
  document.querySelector(".scene-heading h1").textContent =
    "The sum of my parts.";
  parts.forEach((p) => {
    const g = $(`part-${p.id}`);
    g.setAttribute("role", "button");
    g.setAttribute("tabindex", "0");
  });
  $("announcement").textContent =
    "Engine expanded. Use arrow keys or component buttons to explore.";
  selectPart(0);
  try {
    sessionStorage.setItem("kv-engine-visited", "1");
  } catch {}
}
function selectPart(index) {
  selected = (index + parts.length) % parts.length;
  const p = parts[selected];
  parts.forEach((part, i) => {
    $(`part-${part.id}`).classList.toggle("selected", i === selected);
    $(`part-${part.id}`).setAttribute("aria-pressed", String(i === selected));
  });
  document
    .querySelectorAll("[data-part]")
    .forEach((b, i) => b.setAttribute("aria-pressed", String(i === selected)));
  $("inspection").hidden = false;
  $("inspection").innerHTML =
    `<span class="eyebrow">${p.label}</span><h2>${p.name}<br>${p.title}</h2>${p.html}`;
  document.querySelector(".terminal-content").scrollTop = 0;
  $("part-number").textContent =
    `${String(selected + 1).padStart(2, "0")} / 08`;
  $("part-label").textContent = p.name;
}
function navigate(key) {
  const p = parts[selected],
    horizontal = key === "ArrowLeft" || key === "ArrowRight",
    sign = key === "ArrowRight" || key === "ArrowDown" ? 1 : -1;
  const origin = { x: p.x + p.dx, y: p.y + p.dy };
  const candidates = parts
    .map((q, i) => {
      const dx = q.x + q.dx - origin.x,
        dy = q.y + q.dy - origin.y;
      const primary = (horizontal ? dx : dy) * sign,
        cross = Math.abs(horizontal ? dy : dx);
      return { i, primary, score: primary + cross * 1.5 };
    })
    .filter((q) => q.primary > 5)
    .sort((a, b) => a.score - b.score);
  selectPart(candidates.length ? candidates[0].i : selected + sign);
}
function skip() {
  generation++;
  busy = false;
  particles = [];
  inspect();
  if (reducedMotion.matches) exploded = 1;
}
function replay() {
  generation++;
  busy = false;
  step = 0;
  rpm = 0;
  targetRpm = 0;
  explodeTarget = 0;
  particles = [];
  setState("intro");
  $("history").innerHTML = "";
  $("history").hidden = false;
  $("command-line").hidden = false;
  $("inspection").hidden = true;
  $("component-nav").hidden = true;
  $("replay").hidden = true;
  $("skip").hidden = false;
  $("execute").disabled = false;
  $("gear").textContent = "N";
  $("scene-status").textContent = "SYSTEM OFFLINE";
  $("footer-note").textContent = "PRESS ENTER TO BEGIN";
  document.querySelector(".scene-heading h1").textContent =
    "Built from curiosity.";
  parts.forEach((p) => {
    const g = $(`part-${p.id}`);
    g.classList.remove("selected");
    g.removeAttribute("role");
    g.removeAttribute("tabindex");
    g.removeAttribute("aria-pressed");
  });
  renderCommand();
}
function ensureAudio() {
  if (!soundEnabled) return;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      oscillator = audioContext.createOscillator();
      gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 350;
      oscillator.type = "sawtooth";
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);
      gain.gain.value = 0;
      oscillator.start();
    }
    audioContext.resume();
  } catch {
    soundEnabled = false;
    $("sound").textContent = "Sound unavailable";
    $("sound").setAttribute("aria-pressed", "false");
  }
}
const canvas = $("explosion"),
  ctx = canvas.getContext("2d");
let cw = 0,
  ch = 0;
function resize() {
  fitEngine();
  cw = innerWidth;
  ch = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function burst() {
  if (reducedMotion.matches) return;
  const bounds = $("engine").getBoundingClientRect();
  const x = bounds.left + bounds.width * 0.48,
    y = bounds.top + bounds.height * 0.53;
  particles = Array.from({ length: 140 }, () => {
    const angle = Math.random() * Math.PI * 2,
      speed = 70 + Math.random() * 390;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.floor(Math.random() * 4) * 4,
      life: 0.6 + Math.random() * 0.6,
      age: 0,
      color: ["#f7f5e9", "#dfd6b9", "#eaa45e", "#e5484d", "#69756c"][
        Math.floor(Math.random() * 5)
      ],
    };
  });
}
let telemetryTime = 0;
function frame(time) {
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.04);
  lastTime = time;
  rpm += (targetRpm - rpm) * Math.min(1, dt * 3.5);
  if (Math.abs(targetRpm - rpm) < 2) rpm = targetRpm;
  // Slow the visual cycle so individual strokes remain readable at high RPM.
  phase += ((dt * rpm) / 60) * Math.PI * 2 * 0.12;
  exploded += (explodeTarget - exploded) * Math.min(1, dt * 4.5);
  const motion = reducedMotion.matches ? 0 : 1;
  const vibration = motion * (1 - exploded) * Math.pow(rpm / 8000, 2);
  parts.forEach((p, i) =>
    $(`part-${p.id}`).setAttribute(
      "transform",
      `translate(${p.dx * exploded + Math.sin(time * 0.08) * vibration} ${p.dy * exploded + Math.sin(time / 1600 + i) * 1.5 * exploded * motion + Math.cos(time * 0.11) * vibration})`,
    ),
  );
  document.querySelectorAll(".piston").forEach((g, i) => {
    const a = phase + (i === 0 || i === 3 ? 0 : Math.PI),
      travel = motion * (22 - 22 * Math.cos(a)) * (1 - exploded),
      x = 300 + i * 90;
    g.setAttribute("transform", `translate(0 ${travel})`);
    const pinx = x + Math.sin(a) * 18 * (1 - exploded),
      piny = 495 + Math.cos(a) * 18 * (1 - exploded) - travel;
    g.querySelector(".connecting-rod").setAttribute(
      "d",
      `M${x - 4} 402L${pinx - 4} ${piny}Q${pinx} ${piny + 8} ${pinx + 4} ${piny}L${x + 4} 402`,
    );
  });
  document
    .querySelectorAll(".spark-flash")
    .forEach(
      (g, i) =>
        (g.style.opacity =
          rpm > 50 &&
          motion &&
          exploded < 0.1 &&
          Math.sin(phase * 0.5 + (i * Math.PI) / 2) > 0.85
            ? "1"
            : "0"),
    );
  $("pulley").setAttribute(
    "transform",
    `rotate(${((phase * 180) / Math.PI) * motion} 248 502)`,
  );
  $("turbine").setAttribute(
    "transform",
    `rotate(${phase * 100 * motion} 731 323)`,
  );
  if (time - telemetryTime > 80) {
    $("rpm").textContent = String(Math.round(rpm / 10) * 10).padStart(4, "0");
    $("rpm-bar").style.width = `${rpm / 80}%`;
    telemetryTime = time;
  }
  if (gain && audioContext) {
    gain.gain.setTargetAtTime(
      soundEnabled && !document.hidden && rpm > 50 ? 0.025 : 0,
      audioContext.currentTime,
      0.12,
    );
    oscillator.frequency.setTargetAtTime(
      25 + (rpm / 60) * 2,
      audioContext.currentTime,
      0.1,
    );
  }
  ctx.clearRect(0, 0, cw, ch);
  particles = particles.filter((p) => p.age < p.life);
  particles.forEach((p) => {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 180 * dt;
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(
      Math.round(p.x / p.size) * p.size,
      Math.round(p.y / p.size) * p.size,
      p.size,
      p.size,
    );
  });
  ctx.globalAlpha = 1;
  requestAnimationFrame(frame);
}
$("execute").addEventListener("click", () =>
  state === "inspecting" ? selectPart(selected + 1) : execute(),
);
$("skip").addEventListener("click", skip);
$("replay").addEventListener("click", replay);
$("sound").addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  $("sound").textContent = soundEnabled ? "Sound on" : "Sound off";
  $("sound").setAttribute("aria-pressed", String(soundEnabled));
  ensureAudio();
});
addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const interactive = e.target.closest(
    'a,button,input,textarea,select,[role="button"]',
  );
  if (e.key === "Escape" && state !== "inspecting") {
    e.preventDefault();
    skip();
    return;
  }
  if (
    state === "inspecting" &&
    e.key.startsWith("Arrow") &&
    !e.target.closest("input,textarea,select")
  ) {
    e.preventDefault();
    navigate(e.key);
    return;
  }
  if (interactive) return;
  if (e.key === "Enter") {
    e.preventDefault();
    state === "inspecting" ? selectPart(selected + 1) : execute();
  }
  if (e.key.toLowerCase() === "r" && state === "inspecting") replay();
});
addEventListener("resize", resize);
let touchStart = null;
$("engine").addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 1)
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  },
  { passive: true },
);
$("engine").addEventListener(
  "touchend",
  (e) => {
    if (!touchStart || state !== "inspecting") return;
    const dx = e.changedTouches[0].clientX - touchStart.x,
      dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 35)
      navigate(
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? "ArrowRight"
            : "ArrowLeft"
          : dy > 0
            ? "ArrowDown"
            : "ArrowUp",
      );
  },
  { passive: true },
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && gain)
    gain.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
});
reducedMotion.addEventListener("change", (e) => {
  if (e.matches) skip();
});
engineDrawing();
resize();
renderCommand();
let visited = false;
try {
  visited = sessionStorage.getItem("kv-engine-visited") === "1";
} catch {}
if (reducedMotion.matches || visited) {
  inspect();
  exploded = 1;
}
requestAnimationFrame(frame);
