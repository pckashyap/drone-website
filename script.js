// ---------- Parts diagram ----------
const parts = [
  { name: "Frame", x: 120, y: 120, text: "The skeleton of the drone. Arms hold the motors out at the corners, and the centre holds the electronics. It's usually carbon fibre or plastic: strong but light." },
  { name: "Propellers", x: 30, y: 30, text: "Spinning blades that push air downward to create lift (thrust). Two spin clockwise and two spin counter-clockwise." },
  { name: "Motors", x: 70, y: 70, text: "Brushless electric motors spin the propellers, often over 10,000 times a minute. They can change speed almost instantly." },
  { name: "ESCs", x: 243, y: 237, text: "Electronic Speed Controllers. One per motor, they take battery power and send each motor exactly the amount it needs to spin at the right speed." },
  { name: "Flight controller", x: 180, y: 147, text: "The brain. A small computer that reads the sensors and your commands, then decides how fast every motor should spin, many hundreds of times per second." },
  { name: "Battery", x: 180, y: 185, text: "Usually a lithium-polymer (LiPo) battery. It's light and powerful, and it gives most drones 5 to 40 minutes of flight." },
  { name: "GPS", x: 180, y: 222, text: "Talks to satellites so the drone knows where it is. This lets it hold its position, follow a route or fly back home on its own." },
  { name: "Camera", x: 180, y: 118, text: "Records photos and video or helps the pilot see. A gimbal keeps it steady even when the drone tilts." },
];

const markers = document.querySelector(".markers");
const partsList = document.querySelector(".parts-list");

parts.forEach((p, i) => {
  const n = i + 1;
  markers.insertAdjacentHTML(
    "beforeend",
    `<g class="marker" data-part="${i}" tabindex="0" role="button" aria-label="${p.name}">
       <circle cx="${p.x}" cy="${p.y}" r="12"/>
       <text x="${p.x}" y="${p.y + 4.5}" text-anchor="middle">${n}</text>
     </g>`
  );
  partsList.insertAdjacentHTML(
    "beforeend",
    `<li><button data-part="${i}"><span>${n}</span>${p.name}</button></li>`
  );
});

function selectPart(i) {
  document.getElementById("part-title").textContent = parts[i].name;
  document.getElementById("part-text").textContent = parts[i].text;
  document.querySelectorAll("[data-part]").forEach((el) =>
    el.classList.toggle("active", Number(el.dataset.part) === i)
  );
}

document.querySelectorAll("[data-part]").forEach((el) => {
  el.addEventListener("click", () => selectPart(Number(el.dataset.part)));
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectPart(Number(el.dataset.part));
    }
  });
});

// ---------- Control demo ----------
// Front-left & rear-right spin clockwise; front-right & rear-left spin counter-clockwise.
const moves = [
  { name: "Hover", speeds: { fl: 60, fr: 60, rl: 60, rr: 60 }, motion: "",
    text: "All four propellers spin at the same speed. Their thrust exactly equals the drone's weight, so it stays still in the air. The clockwise and counter-clockwise twists cancel, so it doesn't turn." },
  { name: "Climb", speeds: { fl: 85, fr: 85, rl: 85, rr: 85 }, motion: "m-climb",
    text: "All four speed up together. Thrust is now bigger than weight, so the drone rises straight up." },
  { name: "Descend", speeds: { fl: 40, fr: 40, rl: 40, rr: 40 }, motion: "m-descend",
    text: "All four slow down together. Thrust is now less than weight, so gravity gently pulls the drone down." },
  { name: "Forward", speeds: { fl: 45, fr: 45, rl: 75, rr: 75 }, motion: "m-forward",
    text: "The two rear propellers spin faster than the front ones. That lifts the back and tips the nose down, so part of the thrust points backward and pushes the drone forward." },
  { name: "Right", speeds: { fl: 75, fr: 45, rl: 75, rr: 45 }, motion: "m-right",
    text: "The left propellers spin faster than the right ones. The drone leans (rolls) to the right and slides that way." },
  { name: "Turn right", speeds: { fl: 45, fr: 75, rl: 75, rr: 45 }, motion: "m-yaw",
    text: "The counter-clockwise pair speeds up and the clockwise pair slows down. Total lift stays the same, but the twisting forces no longer cancel. The extra counter-clockwise spin twists the body clockwise, so the drone turns right on the spot." },
  { name: "All spin CW?", speeds: { fl: 60, fr: 60, rl: 60, rr: 60 }, motion: "m-spin", allCw: true,
    text: "What if every propeller spun clockwise? Their twists would all add up instead of cancelling, and the whole drone would spin counter-clockwise out of control. That's why drones mix the two directions." },
];

const movesEl = document.querySelector(".moves");
const quadBody = document.querySelector(".quad-body");

moves.forEach((m, i) =>
  movesEl.insertAdjacentHTML("beforeend", `<button data-move="${i}" aria-pressed="false">${m.name}</button>`)
);

function setMove(i) {
  const m = moves[i];
  quadBody.className.baseVal = `quad-body ${m.motion}`;

  document.querySelectorAll(".q-rotor").forEach((r) => {
    const key = r.dataset.rotor;
    const s = m.speeds[key];
    const dir = m.allCw ? "cw" : r.dataset.dir;
    const blade = r.querySelector(".q-blade");
    blade.style.animationDuration = `${(1.2 - s / 100).toFixed(2)}s`;
    blade.style.animationDirection = dir === "cw" ? "normal" : "reverse";
    r.querySelector(".q-disc").style.opacity = (s / 100) * 0.7;
    r.querySelector(".q-dir").textContent = dir === "cw" ? "↻ CW" : "↺ CCW";
  });

  document.querySelectorAll(".meter").forEach((el) => {
    const s = m.speeds[el.dataset.meter];
    el.querySelector("i").style.width = `${s}%`;
    el.querySelector("b").textContent = `${s}%`;
  });

  document.getElementById("move-title").textContent = m.name;
  document.getElementById("move-text").textContent = m.text;
  movesEl.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
}

movesEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-move]");
  if (btn) setMove(Number(btn.dataset.move));
});
setMove(0);

// ---------- Quiz ----------
const quiz = [
  { q: "What does UAV stand for?", options: ["Ultra Air Vehicle", "Unmanned Aerial Vehicle", "Universal Aviation Vessel"], answer: 1 },
  { q: "Which part is the drone's \"brain\"?", options: ["The battery", "The ESC", "The flight controller"], answer: 2 },
  { q: "How does a propeller lift the drone?", options: ["It pushes air downward", "It sucks the drone up by magnetism", "It makes the drone lighter"], answer: 0 },
  { q: "Why do two propellers spin one way and two the other?", options: ["It looks cooler", "To cancel out twisting (torque) so the drone doesn't spin", "To save battery"], answer: 1 },
  { q: "To fly forward, a quadcopter…", options: ["Speeds up the rear propellers to tip its nose down", "Turns off the front propellers", "Spins all propellers backwards"], answer: 0 },
];

const quizEl = document.querySelector(".quiz");
const scoreEl = document.querySelector(".quiz-score");
let answered = 0;
let correct = 0;

quiz.forEach((item, qi) => {
  const opts = item.options
    .map((o, oi) => `<button data-q="${qi}" data-o="${oi}">${o}</button>`)
    .join("");
  quizEl.insertAdjacentHTML(
    "beforeend",
    `<div class="question"><p><strong>${qi + 1}.</strong> ${item.q}</p><div class="options">${opts}</div></div>`
  );
});

quizEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-o]");
  if (!btn) return;
  const qi = Number(btn.dataset.q);
  const group = btn.parentElement;
  if (group.dataset.done) return;
  group.dataset.done = "1";

  const right = quiz[qi].answer;
  group.querySelectorAll("button").forEach((b) => {
    b.disabled = true;
    if (Number(b.dataset.o) === right) b.classList.add("right");
  });
  if (Number(btn.dataset.o) === right) correct++;
  else btn.classList.add("wrong");

  answered++;
  if (answered === quiz.length) {
    scoreEl.textContent =
      correct === quiz.length
        ? `Perfect, ${correct}/${quiz.length}! You're ready for take-off. 🚀`
        : `You got ${correct}/${quiz.length}. Scroll back up to review, then try again by reloading the page.`;
  }
});

// ---------- Mobile menu ----------
const menuBtn = document.querySelector(".menu-btn");
const menu = document.getElementById("menu");

menuBtn.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
menu.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    menu.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  })
);

// Nav border once the page scrolls
const nav = document.querySelector(".nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 10), { passive: true });

// ---------- Reveal on scroll ----------
const revealTargets = document.querySelectorAll(".card, .steps li, .sensor, .callout, .question, .airfoil-fig, .demo");
revealTargets.forEach((el) => el.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("visible");
      observer.unobserve(e.target);
    });
  },
  { threshold: 0.15 }
);
revealTargets.forEach((el) => observer.observe(el));
