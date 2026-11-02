// Animated explainer video: scenes are drawn on a canvas, narrated with recorded
// audio clips (see narration.js), and captioned one sentence at a time.
(() => {
  const player = document.querySelector(".player");
  if (!player) return;

  const canvas = player.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const W = 960;
  const H = 540;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const C = {
    sky1: "#0b1630", sky2: "#16305a", panel: "#0f1b2d",
    text: "#e8eef8", muted: "#9aa8bf", body: "#e8eef8",
    accent: "#38bdf8", accent2: "#818cf8", good: "#4ade80", bad: "#f87171", warm: "#fb923c",
  };

  // ---------- Drawing helpers ----------
  const TAU = Math.PI * 2;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const ease = (v) => { v = clamp01(v); return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2; };
  const lerp = (a, b, v) => a + (b - a) * v;

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function paint(fill, stroke, lw = 2) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function box(x, y, w, h, r, fill, stroke, lw) { rr(x, y, w, h, r); paint(fill, stroke, lw); }
  function circle(x, y, r, fill, stroke, lw) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); paint(fill, stroke, lw); }
  function line(x1, y1, x2, y2, color, lw = 2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.stroke();
  }
  function arrow(x1, y1, x2, y2, color, lw = 6) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 2) return;
    const a = Math.atan2(y2 - y1, x2 - x1);
    const head = Math.min(lw * 3, len);
    line(x1, y1, x2 - Math.cos(a) * head * 0.7, y2 - Math.sin(a) * head * 0.7, color, lw);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head);
    ctx.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  function text(str, x, y, o = {}) {
    const { size = 24, color = C.text, align = "center", weight = 600, display = false, alpha = 1 } = o;
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = `${weight} ${size}px ${display ? '"Space Grotesk"' : '"Inter"'}, system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    String(str).split("\n").forEach((l, i, all) => ctx.fillText(l, x, y + (i - (all.length - 1) / 2) * size * 1.2));
    ctx.restore();
  }
  function faded(alpha, fn) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= Math.min(alpha, 1);
    fn();
    ctx.restore();
  }

  // Seeded stars so the background is the same every frame
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 70 }, () => ({ x: rand() * W, y: rand() * H * 0.85, r: rand() * 1.3 + 0.4 }));

  function background() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.sky1);
    g.addColorStop(1, C.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    faded(0.35, () => stars.forEach((s) => circle(s.x, s.y, s.r, "#fff")));
  }

  // Side view of a drone, centred on its body
  function sideDrone(x, y, s = 1, tilt = 0, a = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(s, s);
    line(-45, -5, -130, -40, C.body, 6);
    line(45, -5, 130, -40, C.body, 6);
    for (const sx of [-130, 130]) {
      box(sx - 6, -54, 12, 18, 3, C.body);
      const w = 58 * (0.55 + 0.45 * Math.abs(Math.sin(a * 30 + sx)));
      ctx.beginPath();
      ctx.ellipse(sx, -56, w, 6, 0, 0, TAU);
      paint("rgba(56,189,248,0.55)");
    }
    line(-35, 20, -50, 60, C.body, 4);
    line(35, 20, 50, 60, C.body, 4);
    line(-62, 60, -32, 60, C.body, 4);
    line(32, 60, 62, 60, C.body, 4);
    box(-50, -26, 100, 48, 16, C.panel, C.body, 3);
    box(-35, -14, 70, 6, 3, C.accent);
    box(-14, 22, 28, 16, 4, C.body);
    circle(0, 42, 10, "#05080f", C.accent2, 2.5);
    ctx.restore();
  }

  // Top-down quadcopter. Rotor order: front-left, front-right, rear-left, rear-right.
  const ROTORS = [[-80, -80], [80, -80], [-80, 80], [80, 80]];
  function topQuad(x, y, s, rot, a, o = {}) {
    const { speeds = [60, 60, 60, 60], dirs = [1, -1, -1, 1], detailed = false, colorDirs = false, showDirs = false } = o;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s, s);
    ROTORS.forEach(([rx, ry]) => line(0, 0, rx, ry, C.body, 10));
    ROTORS.forEach(([rx, ry], i) => {
      const col = colorDirs ? (dirs[i] > 0 ? C.accent : C.warm) : C.accent;
      faded(0.12 + (speeds[i] / 100) * 0.45, () => circle(rx, ry, 46, col));
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(a * (3 + speeds[i] * 0.15) * dirs[i]);
      box(-44, -4, 88, 8, 4, C.body);
      ctx.restore();
      circle(rx, ry, 9, C.panel, C.body, 3);
      if (showDirs) text(dirs[i] > 0 ? "↻" : "↺", rx * 1.68, ry * 1.68, { size: 30, color: col, weight: 700 });
    });
    box(-32, -40, 64, 80, 14, C.panel, C.body, 3);
    if (detailed) {
      [[-48, -48, 45], [48, -48, -45], [-48, 48, -45], [48, 48, 45]].forEach(([ex, ey, deg]) => {
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate((deg * Math.PI) / 180);
        box(-10, -5, 20, 10, 2, C.accent2);
        ctx.restore();
      });
      box(-22, -8, 44, 34, 5, "rgba(74,222,128,0.25)", C.good, 2);
      box(-14, -28, 28, 14, 3, C.accent2);
      circle(0, 33, 5, C.muted);
      box(-12, -54, 24, 14, 4, C.body);
      circle(0, -47, 4, "#05080f");
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -56); ctx.lineTo(12, -42); ctx.lineTo(-12, -42); ctx.closePath();
      paint(C.warm);
    }
    ctx.restore();
  }

  function controller(x, y, a) {
    line(x + 60, y - 40, x + 75, y - 95, C.body, 4);
    circle(x + 75, y - 97, 5, C.warm);
    box(x - 90, y - 45, 180, 90, 34, C.panel, C.body, 3);
    circle(x - 45, y, 20, C.sky2, C.body, 2);
    circle(x + 45, y, 20, C.sky2, C.body, 2);
    circle(x - 45 + Math.sin(a * 2) * 8, y - 6, 8, C.accent);
    circle(x + 45, y + Math.cos(a * 1.6) * 8, 8, C.accent);
  }

  function planeIcon(x, y, s, a, hybrid) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (hybrid) {
      for (const bx of [-40, 40]) {
        line(bx, -44, bx, 44, C.body, 5);
        for (const by of [-44, 44]) {
          faded(0.4, () => circle(bx, by, 18, C.accent));
          ctx.save(); ctx.translate(bx, by); ctx.rotate(a * 12);
          box(-17, -2.5, 34, 5, 2, C.body);
          ctx.restore();
        }
      }
    }
    box(-72, -12, 144, 20, 8, C.body);
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 50, 0, 0, TAU); paint(C.body);
    box(-26, 34, 52, 10, 4, C.body);
    circle(0, -32, 5, C.accent2);
    ctx.restore();
  }

  function heliIcon(x, y, s, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    box(20, 2, 72, 9, 4, C.body);
    faded(0.5, () => circle(92, 6, 14, C.accent));
    ctx.beginPath(); ctx.ellipse(-10, 10, 40, 25, 0, 0, TAU); paint(C.body);
    ctx.beginPath(); ctx.ellipse(-30, 4, 13, 11, 0, 0, TAU); paint(C.accent2);
    line(-10, -14, -10, -26, C.body, 4);
    const w = 85 * (0.45 + 0.55 * Math.abs(Math.sin(a * 22)));
    line(-10 - w, -28, -10 + w, -28, C.accent, 4);
    line(-44, 44, 24, 44, C.body, 3);
    line(-30, 34, -30, 44, C.body, 3);
    line(10, 34, 10, 44, C.body, 3);
    ctx.restore();
  }

  // Airfoil and flow lines, in the same coordinates as the SVG on the page
  const AIRFOIL = new Path2D("M70 165 C 70 140, 120 128, 200 128 C 290 128, 380 145, 450 182 C 360 172, 260 170, 180 176 C 120 180, 70 185, 70 165 Z");
  const FLOWS = [
    new Path2D("M10 95 C 120 95, 160 70, 260 75 S 420 120, 490 150"),
    new Path2D("M10 125 C 110 125, 160 105, 260 108 S 420 145, 490 175"),
    new Path2D("M10 205 C 120 205, 200 195, 300 200 S 430 215, 490 240"),
    new Path2D("M10 235 C 120 235, 200 228, 300 232 S 430 250, 490 270"),
  ];

  function speedBars(x, y, speeds, labels = ["Front-left", "Front-right", "Rear-left", "Rear-right"]) {
    speeds.forEach((s, i) => {
      const yy = y + i * 46;
      text(labels[i], x, yy, { size: 15, color: C.muted, align: "left", weight: 500 });
      text(`${Math.round(s)}%`, x + 280, yy, { size: 15, align: "right" });
      box(x, yy + 14, 280, 9, 4.5, "rgba(255,255,255,0.12)");
      const g = ctx.createLinearGradient(x, 0, x + 280, 0);
      g.addColorStop(0, C.accent);
      g.addColorStop(1, C.accent2);
      box(x, yy + 14, Math.max(9, (280 * s) / 100), 9, 4.5, g);
    });
  }

  // ---------- Scenes ----------
  // Each scene draws itself from: p = progress through the scene (0–1),
  // k = index of the sentence being narrated, st = seconds since that sentence began,
  // a = running animation clock for spinning/looping things.
  const scenes = [
    {
      id: "intro",
      title: "Intro",
      draw(p, k, st, a) {
        sideDrone(480, 210 + Math.sin(a * 2) * 10, 1.1, Math.sin(a * 1.3) * 0.03, a);
        text("How Drones Work", 480, 355, { size: 58, weight: 700, display: true, alpha: ease(p * 6) });
        text("What a drone is  ·  How it flies  ·  How propellers make lift", 480, 405, { size: 20, color: C.muted, weight: 500, alpha: ease(p * 6 - 1) });
      },
    },
    {
      id: "what",
      title: "What is a drone?",
      draw(p, k, st, a) {
        const dy = Math.sin(a * 2) * 8;
        sideDrone(680, 200 + dy, 0.85, 0, a);
        faded(ease(st * 2) + (k > 0 ? 1 : 0), () => {
          box(600, 80 + dy, 160, 34, 17, "rgba(248,113,113,0.18)", C.bad, 2);
          text("No pilot on board", 680, 97 + dy, { size: 15, color: C.bad });
        });
        if (k >= 1) {
          faded(ease(st * 2) + (k > 1 ? 1 : 0), () => {
            controller(220, 280, a);
            for (let i = 0; i < 3; i++) {
              const ph = (a * 0.7 + i / 3) % 1;
              ctx.beginPath();
              ctx.arc(295, 183, 20 + ph * 230, -0.45, 0.25);
              paint(null, `rgba(56,189,248,${1 - ph})`, 3);
            }
            text("Remote control", 220, 360, { size: 16, color: C.muted, weight: 500 });
          });
        }
        if (k >= 2) {
          faded(ease(st * 1.5), () => {
            text("UAV", 480, 395, { size: 46, weight: 700, display: true, color: C.accent });
            text("Unmanned  Aerial  Vehicle", 480, 435, { size: 20, color: C.text, weight: 500 });
          });
        }
      },
    },
    {
      id: "types",
      title: "Kinds of drones",
      draw(p, k, st, a) {
        const items = [
          ["Multirotor", "Hovers in one spot", (x, y) => topQuad(x, y, 0.42, 0, a)],
          ["Fixed-wing", "Flies far, like a plane", (x, y) => planeIcon(x, y, 0.85, a, false)],
          ["Single-rotor", "A mini helicopter", (x, y) => heliIcon(x, y, 0.75, a)],
          ["Hybrid VTOL", "Up like a copter, on like a plane", (x, y) => planeIcon(x, y, 0.85, a, true)],
        ];
        text("Kinds of drones", 480, 72, { size: 30, weight: 700, display: true });
        items.forEach(([name, sub, icon], i) => {
          const x = 150 + i * 220;
          const shown = k > i + 1 ? 1 : k === i + 1 ? ease(st * 2) : 0;
          const active = k === i + 1;
          faded(shown, () => {
            ctx.save();
            ctx.translate(0, (1 - shown) * 20);
            box(x - 95, 120, 190, 270, 18, active ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.05)", active ? C.accent : "rgba(255,255,255,0.12)", 2);
            icon(x, 220);
            text(name, x, 325, { size: 21, weight: 700, display: true });
            text(sub.length > 20 ? sub.replace(", ", ",\n").replace(" on ", "\non ") : sub, x, 360, { size: 14, color: C.muted, weight: 500 });
            ctx.restore();
          });
        });
      },
    },
    {
      id: "uses",
      title: "Uses",
      draw(p, k, st, a) {
        const uses = [["📸", "Filming"], ["📦", "Delivery"], ["🌾", "Farming"], ["🚒", "Rescue"], ["🗺️", "Mapping"], ["🌉", "Inspection"], ["🌪️", "Weather"], ["🏁", "Racing"]];
        text("Drones at work", 480, 72, { size: 30, weight: 700, display: true });
        const count = k >= 1 ? Math.floor(st / 1.2) + 1 : 0;
        uses.forEach(([emoji, label], i) => {
          const x = 150 + (i % 4) * 220;
          const y = 190 + Math.floor(i / 4) * 140;
          const shown = i < count ? 1 : 0;
          faded(shown ? 1 : 0.15, () => {
            box(x - 90, y - 55, 180, 110, 18, "rgba(255,255,255,0.06)", shown ? C.accent : "rgba(255,255,255,0.12)", 2);
            text(emoji, x, y - 12 + (shown ? Math.sin(a * 3 + i) * 3 : 0), { size: 40 });
            text(label, x, y + 32, { size: 17, weight: 600 });
          });
        });
      },
    },
    {
      id: "parts",
      title: "Parts",
      draw(p, k, st, a) {
        const parts = [
          ["Frame", "holds it all together", -45, -45, 18],
          ["Motors", "spin the propellers", -80, -80, 18],
          ["Propellers", "push air down for lift", 80, -80, 52],
          ["ESCs", "control each motor's speed", 48, 48, 18],
          ["Flight controller", "the brain", 0, -21, 20],
          ["Battery", "supplies the power", 0, 9, 28],
          ["GPS", "knows where it is", 0, 33, 13],
          ["Camera", "captures the view", 0, -47, 16],
        ];
        const hi = k - 1;
        const qx = 280, qy = 255, qs = 1.15;
        topQuad(qx, qy, qs, 0, a, { detailed: true });
        if (hi >= 0) {
          const [, , px, py, r] = parts[hi];
          const pulse = 1 + Math.sin(a * 6) * 0.08;
          circle(qx + px * qs, qy + py * qs, r * qs * pulse + 4, null, C.warm, 4);
        }
        parts.forEach(([name, desc], i) => {
          const y = 98 + i * 42;
          const active = i === hi;
          const seen = i < hi;
          faded(active ? 1 : seen ? 0.75 : 0.3, () => {
            circle(575, y, 13, active ? C.warm : C.accent);
            text(String(i + 1), 575, y + 1, { size: 13, weight: 700, color: C.panel });
            text(name, 600, y, { size: 19, weight: 700, align: "left", color: active ? C.warm : C.text });
            ctx.font = '700 19px "Inter", system-ui, sans-serif';
            text(`— ${desc}`, 608 + ctx.measureText(name).width, y, { size: 15, weight: 500, align: "left", color: C.muted });
          });
        });
      },
    },
    {
      id: "chain",
      title: "How it flies",
      draw(p, k, st, a) {
        const steps = [
          ["🎮", "Controller", "You move\na stick"],
          ["📡", "Receiver", "Catches the\nradio signal"],
          ["🧠", "Flight\ncontroller", "Decides motor\nspeeds"],
          ["⚡", "ESCs", "Send power\nto motors"],
          ["⚙️", "Motors", "Spin the\npropellers"],
          ["🌀", "Propellers", "Push air,\ndrone moves"],
        ];
        const active = k - 1;
        const bw = 128, gap = 24, x0 = 36, y0 = 150, bh = 140;
        text("From your thumb to the sky", 480, 72, { size: 30, weight: 700, display: true });
        steps.forEach(([emoji, name, desc], i) => {
          const x = x0 + i * (bw + gap);
          const on = i <= active;
          if (i < steps.length - 1) arrow(x + bw + 4, y0 + bh / 2, x + bw + gap - 4, y0 + bh / 2, on && i < active ? C.accent : "rgba(255,255,255,0.25)", 3);
          faded(on ? 1 : 0.35, () => {
            box(x, y0, bw, bh, 16, i === active ? "rgba(56,189,248,0.16)" : "rgba(255,255,255,0.05)", i === active ? C.accent : "rgba(255,255,255,0.15)", 2);
            text(emoji, x + bw / 2, y0 + 45, { size: 38 });
            text(name, x + bw / 2, y0 + 105, { size: 16, weight: 700 });
          });
          if (on) faded(i === active ? ease(st * 2) : 0.8, () => text(desc, x + bw / 2, y0 + bh + 45, { size: 15, color: C.muted, weight: 500 }));
        });
        if (active >= 0 && active < steps.length - 1) {
          const v = clamp01(st / 1.4);
          const sx = x0 + active * (bw + gap) + bw;
          const dotX = lerp(sx - bw / 2, sx + gap + bw / 2, ease(v));
          faded(1 - v * 0.3, () => circle(dotX, y0 + bh / 2, 8, C.warm));
        }
        if (active === steps.length - 1) {
          sideDrone(480, 410 - ease(st / 2) * 20 + Math.sin(a * 2) * 4, 0.4, 0, a);
        }
      },
    },
    {
      id: "sensors",
      title: "Sensors",
      draw(p, k, st, a) {
        // Sentence 0: a drone can't balance by itself
        if (k === 0) {
          const wobble = Math.sin(a * 4) * 0.22 * (1 - ease(st / 6) * 0.6);
          sideDrone(480, 230, 0.8, wobble, a);
          text("Can't balance on its own: needs constant tiny corrections", 480, 380, { size: 18, color: C.warm, alpha: ease(st) });
          return;
        }
        const sensors = [["Gyroscope", "tips & twists"], ["Accelerometer", "which way is down"], ["Barometer", "height"], ["GPS", "position"], ["Compass", "direction"]];
        const cx = 480, cy = 255;
        ctx.save();
        ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = -a * 40;
        circle(cx, cy, 82, null, k >= 7 ? C.good : "rgba(255,255,255,0.3)", 3);
        ctx.restore();
        sensors.forEach(([name, sub], i) => {
          const ang = ((-90 + i * 72) * Math.PI) / 180;
          const x = cx + Math.cos(ang) * 300;
          const y = cy + Math.sin(ang) * 150;
          const shown = k > i + 2 ? 1 : k === i + 2 ? ease(st * 2) : 0;
          faded(shown, () => {
            const ph = (a * 0.8 + i * 0.2) % 1;
            line(x, y, cx, cy, "rgba(56,189,248,0.25)", 2);
            circle(lerp(x, cx, ph), lerp(y, cy, ph), 5, C.accent);
            box(x - 85, y - 28, 170, 56, 14, C.panel, k === i + 2 ? C.accent : "rgba(255,255,255,0.2)", 2);
            text(name, x, y - 9, { size: 16, weight: 700 });
            text(sub, x, y + 12, { size: 13, color: C.muted, weight: 500 });
          });
        });
        circle(cx, cy, 62, C.panel, C.accent2, 3);
        if (k >= 7) {
          const pulse = 1 + Math.sin(a * 8) * 0.05;
          text("1000×", cx, cy - 10, { size: 26 * pulse, weight: 700, display: true, color: C.good });
          text("per second", cx, cy + 18, { size: 13, color: C.muted, weight: 500 });
        } else {
          text("🧠", cx, cy - 12, { size: 34 });
          text("Flight controller", cx, cy + 26, { size: 11, color: C.muted, weight: 600 });
        }
      },
    },
    {
      id: "thrust",
      title: "Thrust & weight",
      draw(p, k, st, a) {
        const y0 = 290;
        let y = y0, L = 70, state = "", col = C.text;
        if (k === 3) { state = "HOVER  ·  thrust = weight"; }
        if (k === 4) { L = lerp(70, 120, ease(st / 0.6)); y = y0 - 60 * ease(st / 2.2); state = "CLIMB  ·  thrust > weight"; col = C.good; }
        if (k >= 5) { L = lerp(120, 35, ease(st / 0.6)); y = y0 - 60 + 60 * ease(st / 2.6); state = "DESCEND  ·  thrust < weight"; col = C.warm; }
        sideDrone(480, y + (k === 3 ? Math.sin(a * 2) * 3 : 0), 0.9, 0, a);
        if (k >= 1) faded(k === 1 ? ease(st * 2) : 1, () => {
          arrow(480, y + 62, 480, y + 62 + 70, C.bad, 8);
          text("Weight (gravity)", 500, y + 105, { size: 18, color: C.bad, align: "left" });
        });
        if (k >= 2) faded(k === 2 ? ease(st * 2) : 1, () => {
          arrow(480, y - 62, 480, y - 62 - L, C.good, 8);
          text("Thrust", 500, y - 62 - L / 2, { size: 18, color: C.good, align: "left" });
        });
        if (state) text(state, 480, 50, { size: 26, weight: 700, display: true, color: col });
      },
    },
    {
      id: "props",
      title: "What propellers do",
      draw(p, k, st, a) {
        const dx = 480, dy = 170 + Math.sin(a * 2) * 5, s = 0.9;
        for (const side of [-1, 1]) {
          const rx = dx + side * 130 * s;
          for (let i = 0; i < 26; i++) {
            const ph = (a * 0.9 + i / 26) % 1;
            const off = ((i * 37) % 100) / 100 - 0.5;
            const px = rx + off * 100 + off * ph * 60;
            const py = dy - 40 + ph * 280;
            line(px, py, px, py + 16, `rgba(56,189,248,${0.7 * (1 - ph)})`, 2.5);
          }
        }
        sideDrone(dx, dy, s, 0, a);
        if (k >= 1) faded(k === 1 ? ease(st * 2) : 1, () => {
          arrow(150, 170, 150, 330, C.accent, 8);
          text("Propellers push\nair DOWN", 150, 380, { size: 17, color: C.accent });
        });
        if (k >= 2) faded(k === 2 ? ease(st * 1.5) : 1, () => {
          text("Newton's 3rd law: every action has an equal and opposite reaction", 480, 52, { size: 18, color: C.text, weight: 600 });
        });
        if (k >= 3) faded(k === 3 ? ease(st * 2) : 1, () => {
          arrow(810, 330, 810, 170, C.good, 8);
          text("Air pushes the\ndrone UP", 810, 380, { size: 17, color: C.good });
        });
        if (k === 4) faded(ease(st * 2), () => {
          box(355, 395, 250, 32, 16, "rgba(251,146,60,0.15)", C.warm, 1.5);
          text("🎈 Like a balloon letting air out", 480, 411, { size: 15, color: C.warm });
        });
        if (k >= 5) faded(ease(st * 2), () => {
          box(410, 395, 140, 32, 16, "rgba(56,189,248,0.15)", C.accent, 1.5);
          text("downwash", 480, 411, { size: 15, color: C.accent });
        });
      },
    },
    {
      id: "airfoil",
      title: "How propellers work",
      draw(p, k, st, a) {
        text("A slice through one blade", 480, 40, { size: 20, color: C.muted, weight: 500 });
        ctx.save();
        ctx.translate(230, 80);
        ctx.setLineDash([14, 12]);
        ctx.lineDashOffset = -a * 50;
        ctx.lineCap = "round";
        FLOWS.forEach((f, i) => {
          ctx.strokeStyle = i < 2 ? C.accent : "rgba(56,189,248,0.6)";
          ctx.lineWidth = 2.5;
          ctx.stroke(f);
        });
        ctx.setLineDash([]);
        ctx.fillStyle = C.body;
        ctx.fill(AIRFOIL);
        ctx.restore();
        text("air →", 210, 245, { size: 15, color: C.muted, align: "left" });
        if (k >= 1) faded(k === 1 ? ease(st * 2) : 1, () => {
          arrow(690, 290, 720, 345, C.muted, 4);
          text("air deflected down", 740, 365, { size: 15, color: C.muted, align: "left" });
        });
        if (k >= 2) faded(k === 2 ? ease(st * 2) : 1, () => text("LOWER pressure", 640, 128, { size: 19, weight: 700, color: C.accent }));
        if (k >= 3) {
          faded(k === 3 ? ease(st * 2) : 1, () => text("HIGHER pressure", 480, 380, { size: 19, weight: 700, color: C.warm }));
          const L = 130 * ease(k === 3 ? st / 1.2 : 1);
          arrow(430, 225, 430, 225 - L, C.good, 7);
          if (L > 60) text("LIFT", 448, 225 - L + 10, { size: 20, weight: 700, color: C.good, align: "left", display: true });
        }
        if (k === 4) faded(ease(st * 2), () => {
          box(30, 395, 330, 40, 20, "rgba(251,146,60,0.15)", C.warm, 2);
          text("✋ Hand out a car window: same force", 195, 415, { size: 16, weight: 700, color: C.warm });
        });
        if (k >= 5) faded(ease(st * 2), () => {
          box(30, 395, 330, 40, 20, "rgba(74,222,128,0.15)", C.good, 2);
          text("2× speed  →  about 4× thrust", 195, 415, { size: 18, weight: 700, color: C.good });
        });
      },
    },
    {
      id: "pitch",
      title: "Size & pitch",
      draw(p, k, st, a) {
        const px = 250, py = 245;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(a * 5);
        for (const r of [0, Math.PI]) {
          ctx.save();
          ctx.rotate(r);
          ctx.beginPath();
          ctx.ellipse(0, -62, 17, 60, 0.12, 0, TAU);
          paint(C.body);
          ctx.restore();
        }
        circle(0, 0, 14, C.panel, C.body, 3);
        ctx.restore();
        if (k >= 1) faded(k === 1 ? ease(st * 2) : 1, () => {
          line(128, 395, 372, 395, C.accent, 3);
          line(128, 383, 128, 407, C.accent, 3);
          line(372, 383, 372, 407, C.accent, 3);
          text("5 in across (diameter)", 250, 420, { size: 16, color: C.accent });
        });
        if (k >= 2) faded(k === 2 ? ease(st * 2) : 1, () => {
          const x0 = 540, wl = 120, yc = 265;
          ctx.save();
          ctx.setLineDash([6, 8]);
          ctx.beginPath();
          for (let x = 0; x <= 360; x += 4) ctx.lineTo(x0 + x, yc + Math.sin((x / wl) * TAU) * 60);
          paint(null, "rgba(255,255,255,0.35)", 2);
          ctx.restore();
          const travel = (a * 50) % 360;
          const half = 62 * Math.cos((travel / wl) * TAU);
          line(x0 + travel, yc - half, x0 + travel, yc + half, C.body, 7);
          circle(x0 + travel, yc, 7, C.panel, C.body, 3);
          line(x0, 180, x0 + wl, 180, C.warm, 3);
          line(x0, 170, x0, 190, C.warm, 3);
          line(x0 + wl, 170, x0 + wl, 190, C.warm, 3);
          text("4.5 in pitch = one full turn", x0 + wl + 12, 180, { size: 16, color: C.warm, align: "left" });
          arrow(x0 + 120, 365, x0 + 260, 365, C.muted, 3);
          text("moves forward", x0 + 190, 390, { size: 14, color: C.muted, weight: 500 });
        });
        if (k >= 1 && k < 3) {
          text("5 × 4.5", 480, 62, { size: 44, weight: 700, display: true });
          text("diameter × pitch", 480, 102, { size: 16, color: C.muted, weight: 500 });
        }
        if (k >= 3) {
          const chips = [["Bigger / more pitch / more blades", "→ more thrust", C.good], ["…but the motor works harder", "→ battery drains faster", C.warm]];
          chips.forEach(([a1, b1, col], i) => {
            if (k < 3 + i) return;
            faded(k === 3 + i ? ease(st * 2) : 1, () => {
              const x = 60 + i * 450;
              box(x, 44, 400, 62, 16, "rgba(255,255,255,0.06)", col, 2);
              text(a1, x + 200, 64, { size: 16, weight: 600 });
              text(b1, x + 200, 88, { size: 16, weight: 700, color: col });
            });
          });
        }
      },
    },
    {
      id: "torque",
      title: "Why two spin each way",
      draw(p, k, st, a) {
        if (k >= 1) faded(k === 1 ? ease(st * 2) : 1, () => {
          const spin = k >= 2 ? -a * 2.2 * (k === 2 ? ease(st / 1.5) : 1) : 0;
          topQuad(260, 245, 0.8, spin, a, { dirs: [1, 1, 1, 1], colorDirs: true });
          text("All spin clockwise ↻", 260, 92, { size: 20, weight: 700 });
          if (k >= 2) text("✗  Drone spins like a top", 260, 400, { size: 18, color: C.bad, weight: 700 });
        });
        if (k >= 3) faded(k === 3 ? ease(st * 2) : 1, () => {
          topQuad(700, 245, 0.8, Math.sin(a) * 0.02, a, { colorDirs: true, showDirs: true });
          text("Two each way ↻ ↺", 700, 92, { size: 20, weight: 700 });
          if (k >= 4) text("✓  Twists cancel: steady!", 700, 400, { size: 18, color: C.good, weight: 700 });
        });
        if (k === 0) text("Torque", 480, 250, { size: 54, weight: 700, display: true, alpha: ease(st * 2) });
      },
    },
    {
      id: "steering",
      title: "Steering",
      draw(p, k, st, a) {
        const phases = [
          ["Hover", "All four equal", [60, 60, 60, 60]],
          ["Climb", "All four faster", [85, 85, 85, 85]],
          ["Fly forward", "Back pair faster", [45, 45, 75, 75]],
          ["Slide right", "Left side faster", [75, 45, 75, 45]],
          ["Turn right", "Counter-clockwise pair faster", [45, 75, 75, 45]],
        ];
        const ph = k >= phases.length ? 0 : k;
        let [name, rule, speeds] = phases[ph];
        if (k >= phases.length) [name, rule] = ["You just steer", "The flight controller sets all four speeds"];
        const m = ease(st / 1.2);
        let x = 280, y = 250, s = 0.85, rot = 0;
        if (ph === 1) s = 0.85 + 0.12 * m;
        if (ph === 2) y = 250 - 50 * m;
        if (ph === 3) x = 280 + 50 * m;
        if (ph === 4) rot = 0.7 * m;
        topQuad(x, y, s, rot, a, { speeds, colorDirs: true });
        text("▲ front", 280, 440, { size: 13, color: C.muted, weight: 600 });
        text(name, 600, 80, { size: 34, weight: 700, display: true, align: "left" });
        text(rule, 600, 120, { size: 18, color: C.accent, weight: 600, align: "left" });
        speedBars(600, 170, speeds);
        // Side-view inset: tilting points part of the thrust sideways
        if (ph === 2 || ph === 3) {
          const tilt = 0.3 * m;
          const ix = 700 + 30 * m, iy = 400;
          text("side view", 600, 372, { size: 13, color: C.muted, weight: 600, align: "left" });
          sideDrone(ix, iy, 0.32, tilt, a);
          arrow(ix, iy - 14, ix + Math.sin(tilt) * 60, iy - 14 - Math.cos(tilt) * 60, C.good, 4);
        }
      },
    },
    {
      id: "wrap",
      title: "Wrap-up",
      draw(p, k, st, a) {
        const rise = ease(p * 1.2);
        sideDrone(480, 250 - rise * 60 + Math.sin(a * 2) * 6, 1 - rise * 0.35, Math.sin(a * 1.5) * 0.04, a);
        text("Now you know how drones fly! 🚁", 480, 330, { size: 38, weight: 700, display: true, alpha: ease(p * 5) });
        if (k >= 2) text("↓  Explore the parts · Try the controls · Take the quiz", 480, 385, { size: 18, color: C.accent, weight: 600, alpha: ease(st * 2) });
      },
    },
  ];

  // ---------- Timeline ----------
  // Every sentence in narration.js has a recorded clip (audio/<scene>-<n>.mp3) whose length
  // is listed in audio/timing.js. Without recordings, lengths are estimated and the video is silent.
  const NARRATION = window.NARRATION || {};
  const TIMING = (window.NARRATION_TIMING && window.NARRATION_TIMING.scenes) || {};
  const LEAD = 0.6;
  const GAP = 0.5;
  const TAIL = 1.2;

  let total = 0;
  scenes.forEach((s) => {
    s.lines = (NARRATION[s.id] || [""]).map((l) => (typeof l === "string" ? l : l[0]));
    const durs = TIMING[s.id];
    s.hasAudio = Array.isArray(durs) && durs.length === s.lines.length;
    let t = LEAD;
    s.sent = s.lines.map((l, k) => {
      const span = { start: t, dur: s.hasAudio ? durs[k] : l.split(/\s+/).length / 2.6 + 0.4 };
      t += span.dur + GAP;
      return span;
    });
    s.start = total;
    s.dur = t - GAP + TAIL;
    total += s.dur;
  });
  const hasAudio = scenes.some((s) => s.hasAudio);

  const sceneAt = (t) => {
    for (let i = scenes.length - 1; i >= 0; i--) if (t >= scenes[i].start) return i;
    return 0;
  };
  const sentenceAt = (s, lt) => {
    for (let k = s.sent.length - 1; k >= 0; k--) if (lt >= s.sent[k].start) return k;
    return 0;
  };

  // ---------- Narration audio ----------
  const narr = new Audio();
  narr.preload = "auto";
  let narrKey = null;
  let narrWait = 0;
  const failed = new Set();
  narr.addEventListener("error", () => { if (narrKey) failed.add(narrKey); });

  // Puts the right clip at the right position. Returns "clock" while the clip is playing
  // (the video follows the audio), "hold" while it loads, or "free" if it can't play.
  function syncAudio(s, k, offset, dt) {
    const key = `${s.id}-${k}`;
    if (failed.has(key)) return "free";
    if (narrKey !== key) {
      narrKey = key;
      narrWait = 0;
      narr.src = `audio/${key}.mp3`;
    }
    if (narr.ended) return "free";
    if (narr.readyState >= 1 && !narr.seeking && Math.abs(narr.currentTime - offset) > 0.35) narr.currentTime = offset;
    if (narr.paused) narr.play().catch((err) => { if (err.name !== "AbortError") failed.add(key); });
    if (!narr.paused && narr.readyState >= 3 && !narr.seeking) return "clock";
    narrWait += dt;
    if (narrWait > 4) failed.add(key);
    return "hold";
  }

  function stopAudio() {
    narr.pause();
    narrKey = null;
  }

  // ---------- Rendering ----------
  let time = 0;
  let anim = 0;
  let playing = false;
  let voiceOn = true;
  let ccOn = true;
  let current = -1;
  let dirty = true;
  let last = null;

  function drawCaption(str) {
    ctx.font = '500 21px "Inter", system-ui, sans-serif';
    const words = str.split(" ");
    const lines = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width > 820 && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    lines.push(cur);
    const lh = 29;
    const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 36;
    const bh = lines.length * lh + 18;
    box((W - bw) / 2, H - 18 - bh, bw, bh, 10, "rgba(0,0,0,0.62)");
    lines.forEach((l, i) => text(l, W / 2, H - 18 - bh + 9 + lh / 2 + i * lh, { size: 21, weight: 500, color: "#fff" }));
  }

  function render(i, t) {
    const s = scenes[i];
    const k = sentenceAt(s, t);
    const st = Math.max(0, t - s.sent[k].start);

    ctx.save();
    background();
    s.draw(clamp01(t / s.dur), k, st, anim);
    ctx.restore();

    ctx.font = '600 13px "Inter", system-ui, sans-serif';
    const label = `${i + 1} / ${scenes.length}  ·  ${s.title}`;
    box(16, 14, ctx.measureText(label).width + 24, 28, 14, "rgba(0,0,0,0.35)");
    text(label, 28, 28, { size: 13, color: C.muted, align: "left" });

    if (ccOn) drawCaption(s.lines[k]);
  }

  // ---------- Controls ----------
  const playBtn = player.querySelector(".play");
  const bigPlay = player.querySelector(".big-play");
  const timeEl = player.querySelector(".time");
  const bar = player.querySelector(".bar");
  const fill = bar.querySelector(".fill");
  const ticks = bar.querySelector(".ticks");
  const voiceBtn = player.querySelector(".voice");
  const ccBtn = player.querySelector(".cc");
  const fsBtn = player.querySelector(".fs");
  const chaptersEl = player.querySelector(".chapters");

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  scenes.forEach((s, i) => {
    if (i > 0) ticks.insertAdjacentHTML("beforeend", `<i style="left:${(s.start / total) * 100}%"></i>`);
    chaptersEl.insertAdjacentHTML("beforeend", `<button data-ch="${i}">${i + 1}. ${s.title}</button>`);
  });
  const chapterBtns = chaptersEl.querySelectorAll("button");

  if (!hasAudio) voiceBtn.hidden = true;

  function play() {
    if (time >= total - 0.01) time = 0;
    playing = true;
    last = null;
  }
  function pause() {
    playing = false;
    narr.pause();
    dirty = true;
  }
  const toggle = () => (playing ? pause() : play());

  function seek(t) {
    time = Math.max(0, Math.min(total - 0.01, t));
    stopAudio();
    dirty = true;
  }

  function onSceneChange(i) {
    chapterBtns.forEach((b, j) => b.classList.toggle("active", i === j));
    const btn = chapterBtns[i];
    if (btn) chaptersEl.scrollTo({ left: btn.offsetLeft - chaptersEl.clientWidth / 2 + btn.clientWidth / 2, behavior: "smooth" });
  }

  function updateUI() {
    const ended = time >= total - 0.01;
    player.classList.toggle("playing", playing);
    playBtn.textContent = playing ? "❚❚" : ended ? "↻" : "▶";
    playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    bigPlay.textContent = ended ? "↻" : "▶";
    fill.style.width = `${(time / total) * 100}%`;
    timeEl.textContent = `${fmt(time)} / ${fmt(total)}`;
    bar.setAttribute("aria-valuenow", String(Math.round(time)));
  }

  function frame(now) {
    const dt = last == null ? 0 : Math.min((now - last) / 1000, 0.1);
    last = now;

    if (playing) {
      anim += dt;
      const s = scenes[sceneAt(time)];
      const lt = time - s.start;
      const k = sentenceAt(s, lt);
      const span = s.sent[k];
      const inClip = s.hasAudio && lt >= span.start && lt < span.start + span.dur;
      const mode = inClip ? syncAudio(s, k, lt - span.start, dt) : "free";
      if (mode === "clock") time = s.start + span.start + Math.min(narr.currentTime, span.dur);
      else if (mode === "free") time += dt;
      if (time >= total) {
        time = total;
        playing = false;
        stopAudio();
      }
    }

    const i = sceneAt(Math.min(time, total - 0.001));
    if (i !== current) {
      current = i;
      onSceneChange(i);
      dirty = true;
    }
    if (playing || dirty) {
      render(i, Math.min(time, total - 0.001) - scenes[i].start);
      updateUI();
      dirty = false;
    }
    requestAnimationFrame(frame);
  }

  playBtn.addEventListener("click", toggle);
  bigPlay.addEventListener("click", (e) => { e.stopPropagation(); play(); });
  canvas.addEventListener("click", toggle);

  voiceBtn.addEventListener("click", () => {
    voiceOn = !voiceOn;
    narr.muted = !voiceOn;
    voiceBtn.setAttribute("aria-pressed", String(voiceOn));
    voiceBtn.textContent = voiceOn ? "🔊" : "🔇";
  });

  ccBtn.addEventListener("click", () => {
    ccOn = !ccOn;
    ccBtn.setAttribute("aria-pressed", String(ccOn));
    dirty = true;
  });

  fsBtn.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (player.requestFullscreen) player.requestFullscreen();
    else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
  });

  chaptersEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ch]");
    if (b) seek(scenes[Number(b.dataset.ch)].start);
  });

  // Click or drag on the progress bar to seek
  function seekFromPointer(e) {
    const r = bar.getBoundingClientRect();
    seek((clamp01((e.clientX - r.left) / r.width)) * total);
  }
  bar.addEventListener("pointerdown", (e) => {
    bar.setPointerCapture(e.pointerId);
    seekFromPointer(e);
  });
  bar.addEventListener("pointermove", (e) => {
    if (bar.hasPointerCapture(e.pointerId)) seekFromPointer(e);
  });
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", String(Math.round(total)));

  player.addEventListener("keydown", (e) => {
    if (e.target.closest(".chapters") && e.key === "Enter") return;
    const keys = {
      " ": toggle, k: toggle,
      ArrowRight: () => seek(time + 5), ArrowLeft: () => seek(time - 5),
      f: () => fsBtn.click(), c: () => ccBtn.click(), m: () => voiceBtn.click(),
    };
    const fn = keys[e.key];
    if (fn && !(e.target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter"))) {
      e.preventDefault();
      fn();
    }
  });

  // Pause if the visitor leaves the tab
  document.addEventListener("visibilitychange", () => { if (document.hidden && playing) pause(); });

  if (document.fonts) document.fonts.ready.then(() => { dirty = true; });
  requestAnimationFrame(frame);
})();
