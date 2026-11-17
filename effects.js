/* ==========================================================================
   Lalos Predictor · effects.js
   Se carga en la portada Y en todas las páginas de lotería.
   Hace 3 cosas:
     1) Pone tu logo real (assets/logo.png) en todas las secciones.
     2) Transición de cortina al entrar/salir de un generador.
     3) Efecto slot machine (con sonido) al generar números.
   ========================================================================== */
(() => {
  'use strict';

  /* ======================= CONFIGURACIÓN (edita aquí) ======================= */
  const CONFIG = {
    // 1) LOGO — guarda tu imagen como  assets/logo.png  (o cambia el nombre aquí).
    LOGO_FILE: 'logo.png',
    LOGO_REPLACES_TEXT: true,   // true = el logo reemplaza también el texto "LALOS PREDICTOR"
    LOGO_HEIGHT: 46,            // alto del logo en px (portada)

    // 2) SONIDO — rutas RELATIVAS a la carpeta assets/ .
    //    Deja '' para usar un sonido sintetizado (clics de tragamonedas) sin archivos.
    SOUND_SPIN: '',             // ← AQUÍ tu sonido de giro, ej: 'sounds/spin.mp3' (se repite mientras gira)
    SOUND_STOP: '',             // ← (opcional) sonido cuando cae cada número, ej: 'sounds/stop.mp3'
    SOUND_VOLUME: 0.5,          // 0 a 1

    // 3) SLOT — tiempos en milisegundos
    SPIN_MS: 1400,              // cuánto gira el primer número antes de frenar
    STAGGER_MS: 380,            // cuánto después se detiene cada número siguiente
    SLOWDOWN_MS: 900,           // tramo final en el que va frenando poco a poco
  };
  /* ========================================================================= */

  const ME = document.currentScript;
  const BASE = ME && ME.src ? new URL('.', ME.src) : new URL('./', location.href);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- CSS inyectado (así funciona sin tocar lottery.css) ---------- */
  const style = document.createElement('style');
  style.textContent = `
    .lp-logo{display:block;height:${CONFIG.LOGO_HEIGHT}px;width:auto;max-width:220px;object-fit:contain}
    .footer-brand .lp-logo{height:${Math.round(CONFIG.LOGO_HEIGHT * .8)}px}
    a.mark.lp-logo-link{background:none!important;border:0!important;box-shadow:none!important;width:auto!important;height:auto!important;padding:0!important;display:inline-flex!important;align-items:center}
    a.mark.lp-logo-link .lp-logo{height:40px}
    .lp-curtain{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;pointer-events:all;
      background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--c) 80%,#fff),var(--c) 58%,color-mix(in srgb,var(--c) 55%,#000))}
    .lp-curtain span{opacity:0;color:#fff;font:800 clamp(34px,9vw,90px)/1 var(--font,var(--sans,system-ui));letter-spacing:-2px;text-align:center;padding:0 20px;text-shadow:0 6px 28px rgba(0,0,0,.4)}
    .lp-mute{position:fixed;right:14px;bottom:14px;z-index:9000;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.45);color:#fff;font-size:16px;cursor:pointer;backdrop-filter:blur(6px)}
    .lp-mute:hover{background:rgba(0,0,0,.65)}
  `;
  document.head.appendChild(style);

  /* ============================ 1) LOGO ============================ */
  function setupLogo() {
    const url = new URL(CONFIG.LOGO_FILE, BASE).href;
    const probe = new Image();
    probe.onload = () => {
      document.querySelectorAll('.brand, a.mark').forEach(el => {
        const img = new Image();
        img.src = url; img.alt = 'Lalos Predictor'; img.className = 'lp-logo';
        if (el.matches('.brand')) {
          const mark = el.querySelector('.brand-mark'), copy = el.querySelector('.brand-copy');
          if (mark) mark.replaceWith(img); else el.prepend(img);
          if (copy && CONFIG.LOGO_REPLACES_TEXT) copy.remove();
        } else {
          el.textContent = ''; el.classList.add('lp-logo-link'); el.appendChild(img);
        }
      });
    };
    // Si logo.png no existe todavía, se queda el logo de texto actual.
    probe.src = url;
  }

  /* ======================= 2) TRANSICIÓN DE CORTINA ======================= */
  const KEY = 'lp-transition';
  const EASE = 'cubic-bezier(.7,0,.2,1)';

  function curtain(color, label) {
    const o = document.createElement('div');
    o.className = 'lp-curtain';
    o.style.setProperty('--c', color);
    if (label) o.innerHTML = `<span>${esc(label)}</span>`;
    document.body.appendChild(o);
    return o;
  }

  function setupTransitions() {
    // Salida: al hacer clic en un boleto o en "← Todas las loterías".
    document.addEventListener('click', e => {
      const a = e.target.closest('a.boleto, a.back');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (reduceMotion) return;
      e.preventDefault();
      const isTicket = a.classList.contains('boleto');
      const color = (isTicket && getComputedStyle(a).getPropertyValue('--a').trim()) || '#0b1530';
      const label = isTicket ? (a.getAttribute('aria-label') || '').split(':')[0] : '';
      const x = e.clientX || innerWidth / 2, y = e.clientY || innerHeight / 2;
      const o = curtain(color, label);
      o.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(150vmax at ${x}px ${y}px)` }],
        { duration: 650, easing: EASE, fill: 'forwards' });
      const t = o.querySelector('span');
      if (t) t.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 400, delay: 300, easing: 'ease-out', fill: 'forwards' });
      try { sessionStorage.setItem(KEY, JSON.stringify({ color, label })); } catch (_) {}
      setTimeout(() => { location.href = a.href; }, 800);
    });

    // Si volvemos con el botón "atrás" (caché), quitar cortinas viejas.
    addEventListener('pageshow', e => { if (e.persisted) document.querySelectorAll('.lp-curtain').forEach(n => n.remove()); });

    // Entrada: si venimos de una transición, abrir la cortina.
    let data = null;
    try { data = JSON.parse(sessionStorage.getItem(KEY)); sessionStorage.removeItem(KEY); } catch (_) {}
    if (data && !reduceMotion) {
      const o = curtain(data.color, data.label);
      const t = o.querySelector('span');
      if (t) t.style.opacity = 1;
      setTimeout(() => {
        const a = o.animate([{ opacity: 1, clipPath: 'circle(150vmax at 50% 50%)' }, { opacity: 1, clipPath: 'circle(0px at 50% 50%)' }],
          { duration: 750, easing: EASE, fill: 'forwards' });
        a.onfinish = () => o.remove();
      }, 250);
    }

    // Los elementos de la página de lotería "suben" uno por uno al aparecer.
    if (document.getElementById('gen') && !reduceMotion) {
      const delay = data ? 450 : 0;
      document.querySelectorAll('main > *').forEach((el, i) => {
        el.animate([{ opacity: 0, transform: 'translateY(26px) scale(.97)' }, { opacity: 1, transform: 'none' }],
          { duration: 600, delay: delay + i * 90, easing: 'cubic-bezier(.2,.9,.3,1.1)', fill: 'backwards' });
      });
    }
  }

  /* ============================ 3) SONIDO ============================ */
  let actx = null, muted = false;
  try { muted = localStorage.getItem('lp-muted') === '1'; } catch (_) {}
  const vol = CONFIG.SOUND_VOLUME;

  function audio() {
    if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }
  function blip(freq, dur, type, gain, endFreq) {
    const c = audio(); if (!c || muted) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    g.gain.setValueAtTime(gain * vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
  }
  let lastTick = 0;
  function tickSound(slow) {                       // "tic" de cada cambio de número
    const now = performance.now(); if (now - lastTick < 35) return; lastTick = now;
    blip(900 - slow * 350, .05, 'square', .09);
  }
  function landSound() { blip(220, .16, 'triangle', .35, 90); blip(1200, .03, 'square', .08); }
  function doneSound() { [660, 880, 1320].forEach((f, i) => setTimeout(() => blip(f, .22, 'sine', .22), i * 90)); }

  const fileAudio = src => { const a = new Audio(new URL(src, BASE).href); a.volume = vol; return a; };
  const spinFile = CONFIG.SOUND_SPIN ? fileAudio(CONFIG.SOUND_SPIN) : null;
  if (spinFile) spinFile.loop = true;
  const stopFile = CONFIG.SOUND_STOP ? CONFIG.SOUND_STOP : '';

  /* ============================ 4) SLOT MACHINE ============================ */
  function setupSlot() {
    const out = document.getElementById('out'), gen = document.getElementById('gen'), copy = document.getElementById('copy');
    if (!out || !gen || !window.LOTTERY) return;

    const groups = window.LOTTERY.groups || [];
    const numG = groups.find(g => !g.values), valG = groups.find(g => g.values);
    let spinning = false;

    // Botón de silencio
    const mute = document.createElement('button');
    mute.className = 'lp-mute'; mute.type = 'button';
    const paintMute = () => { mute.textContent = muted ? '🔇' : '🔊'; mute.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar'); };
    paintMute();
    mute.addEventListener('click', () => {
      muted = !muted; paintMute();
      try { localStorage.setItem('lp-muted', muted ? '1' : '0'); } catch (_) {}
      if (muted && spinFile) spinFile.pause();
    });
    document.body.appendChild(mute);

    // Mientras gira, ignorar clics en Generar/Copiar (evita copiar números falsos).
    [gen, copy].forEach(b => b && b.addEventListener('click', e => {
      if (spinning) { e.stopImmediatePropagation(); e.preventDefault(); }
    }, true));

    gen.addEventListener('click', () => { audio(); setTimeout(run, 0); });

    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const fake = r => {
      if (r.kind === 'val') return valG.values[rnd(0, valG.values.length - 1)];
      const L = r.final.trim().length;
      if (numG.max <= 9) return Array.from({ length: L }, () => rnd(numG.min, numG.max)).join('');
      return String(rnd(numG.min, numG.max)).padStart(numG.pad || L, '0');
    };

    function run() {
      if (reduceMotion || spinning) return;
      // Cada "bolita" = elemento de texto final dentro de #out (números o signo).
      const reels = [...out.querySelectorAll('*')]
        .filter(el => !el.children.length && el.textContent.trim())
        .map(el => {
          const final = el.textContent, t = final.trim();
          if (numG && /^\d+$/.test(t)) return { el, final, kind: 'num' };
          if (valG && valG.values.includes(t)) return { el, final, kind: 'val' };
          return null;
        }).filter(Boolean);
      if (!reels.length) return;

      spinning = true;
      out.setAttribute('aria-busy', 'true');
      const start = performance.now();
      let remainingReels = reels.length;
      if (spinFile && !muted) { spinFile.currentTime = 0; spinFile.play().catch(() => {}); }

      const land = r => {
        r.el.textContent = r.final;
        r.el.animate([
          { transform: 'scale(1.35)', filter: 'brightness(1.5)' },
          { transform: 'scale(.95)', filter: 'brightness(1.1)', offset: .6 },
          { transform: 'scale(1)', filter: 'brightness(1)' }
        ], { duration: 380, easing: 'ease-out' });
        if (stopFile && !muted) { const a = fileAudio(stopFile); a.play().catch(() => {}); } else if (!spinFile) landSound();
        if (--remainingReels === 0) {
          spinning = false; out.removeAttribute('aria-busy');
          if (spinFile) spinFile.pause();
          if (!muted && !spinFile) doneSound();
        }
      };

      reels.forEach((r, i) => {
        const stopAt = CONFIG.SPIN_MS + i * CONFIG.STAGGER_MS;
        const step = () => {
          const elapsed = performance.now() - start, remaining = stopAt - elapsed;
          if (remaining <= 0) return land(r);
          const slow = Math.max(0, 1 - remaining / CONFIG.SLOWDOWN_MS);   // 0 = rápido … 1 = casi parado
          const delay = 55 + slow * slow * 260;                            // cada vez más lento
          if (delay >= remaining) return void setTimeout(() => land(r), remaining);
          r.el.textContent = fake(r);
          r.el.animate([{ transform: 'translateY(-38%)', opacity: .35, filter: 'blur(2px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }],
            { duration: Math.min(delay, 150), easing: 'ease-out' });
          if (!spinFile) tickSound(slow);
          setTimeout(step, delay);
        };
        step();
      });
    }
  }

  /* ============================ INICIO ============================ */
  setupLogo();
  setupTransitions();
  setupSlot();
})();
