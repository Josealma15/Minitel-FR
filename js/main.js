/* ─────────────────────────────────────────────
   MINITEL — main.js
   Boot sequence, typing, stats counter,
   Minitel simulator, scroll reveals
───────────────────────────────────────────── */

// ── BOOT SEQUENCE ─────────────────────────────
const BOOT_LINES = [
  "Initialisation du réseau Transpac...",
  "Connexion à France Télécom... OK",
  "Chargement des services Minitel... OK",
];

const TYPING_TEXT = "La France avait déjà Internet en 1982. Voici son histoire.";

function runBoot() {
  const screen  = document.getElementById('boot-screen');
  const bar     = document.getElementById('boot-bar');
  const skip    = document.querySelector('.boot-skip');
  let launched  = false;

  function launch() {
    if (launched) return;
    launched = true;
    screen.classList.add('fade-out');
    setTimeout(() => {
      screen.style.display = 'none';
      document.getElementById('main-site').classList.remove('hidden');
      startMainSite();
    }, 800);
  }

  // Keyboard / click to skip
  document.addEventListener('keydown', launch, { once: true });
  screen.addEventListener('click', launch, { once: true });

  // Boot text lines
  BOOT_LINES.forEach((line, i) => {
    setTimeout(() => {
      const el = document.getElementById(`boot-line-${i + 1}`);
      if (el) typeText(el, line, 25);
    }, 400 + i * 700);
  });

  // Progress bar
  let progress = 0;
  const barInterval = setInterval(() => {
    progress += Math.random() * 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(barInterval);
      setTimeout(launch, 600);
    }
    bar.style.width = progress + '%';
  }, 80);

  // Blink skip hint
  setTimeout(() => {
    skip.style.opacity = '1';
  }, 800);
}

// ── TYPEWRITER HELPER ─────────────────────────
function typeText(el, text, speed = 40, cb) {
  let i = 0;
  el.textContent = '';
  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      if (cb) cb();
    }
  }, speed);
}

// ── CLOCK ─────────────────────────────────────
function startClock() {
  const el = document.getElementById('nav-time');
  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    if (el) el.textContent = `${hh}:${mm}:${ss}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ── NAVBAR SCROLL ─────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const links  = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);

    // Active link highlight
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    links.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === current);
    });
  }, { passive: true });
}

// ── HERO TYPING ───────────────────────────────
function initHeroTyping() {
  const el = document.getElementById('hero-typing');
  if (!el) return;
  setTimeout(() => typeText(el, TYPING_TEXT, 38), 1600);
}

// ── SCROLL REVEAL ─────────────────────────────
function initScrollReveal() {
  const elements = document.querySelectorAll(
    '.stat-card, .service-btn, .reflection-card, .tl-item, .def-text, .question-box, .chute-intro, .paradox-box, .vs-col, .answer-box'
  );

  elements.forEach((el, i) => {
    el.classList.add('reveal');
    // stagger within parent
    const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
    const idx = siblings.indexOf(el);
    if (idx > 0 && idx <= 3) el.classList.add(`reveal-delay-${idx}`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

// ── STATS COUNTER ─────────────────────────────
function initStatsCounter() {
  const cards = document.querySelectorAll('.stat-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const numEl = entry.target.querySelector('.stat-number');
      if (!numEl || numEl.dataset.counted) return;
      numEl.dataset.counted = true;

      const target   = parseFloat(numEl.dataset.val);
      const suffix   = numEl.dataset.suffix || '';
      const duration = 1800;
      const steps    = 60;
      const step     = duration / steps;
      let current    = 0;

      const isYear = target > 1000;
      const start  = isYear ? target - 30 : 0;
      current = start;

      const increment = (target - start) / steps;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        const display = isYear
          ? Math.round(current)
          : target >= 1000
            ? Math.round(current).toLocaleString('fr-FR')
            : (Number.isInteger(target) ? Math.round(current) : current.toFixed(0));

        numEl.textContent = display + suffix;
      }, step);

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  cards.forEach(card => observer.observe(card));
}

// ── MINITEL SIMULATOR ─────────────────────────
function initMinitelSim() {
  const buttons = document.querySelectorAll('.service-btn');
  const simHeader  = document.getElementById('sim-header');
  const simContent = document.getElementById('sim-content');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const title   = btn.dataset.title;
      const content = btn.dataset.content;
      const lines   = content.split('|');

      // Clear screen with flicker
      simHeader.style.opacity = '0';
      simContent.style.opacity = '0';

      setTimeout(() => {
        simHeader.textContent = title;
        simHeader.style.opacity = '1';

        // Reveal lines one by one
        simContent.innerHTML = '';
        simContent.style.opacity = '1';

        lines.forEach((line, i) => {
          setTimeout(() => {
            const div = document.createElement('div');
            div.className = 'sim-line';
            div.textContent = '';
            simContent.appendChild(div);
            typeText(div, line || ' ', 15);
          }, i * 120);
        });
      }, 200);
    });
  });
}

// ── MAIN ENTRY POINT ─────────────────────────
function startMainSite() {
  startClock();
  initNavbar();
  initHeroTyping();
  initScrollReveal();
  initStatsCounter();
  initMinitelSim();
}

// ── BOOT ON LOAD ─────────────────────────────
document.addEventListener('DOMContentLoaded', runBoot);
