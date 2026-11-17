// Motor compartido de todas las páginas de lotería. Cada página define window.LOTTERY.
(() => {
  const SELF = document.currentScript;
  const BASE = SELF && SELF.src ? new URL('.', SELF.src) : new URL('./', location.href);

  /* ============================ CONFIGURACIÓN ============================ */
  const CONFIG = {
    // ← TU LOGO: guarda tu imagen como  assets/logo.png  (o cambia el nombre aquí).
    LOGO_FILE: 'logo.png',

    // ← TU SONIDO (opcional). Rutas relativas a la carpeta assets/.
    //   SOUND_SPIN se repite mientras giran los números. SOUND_STOP suena cuando cae cada uno.
    //   Si los dejas vacíos se usa un sonido de tragamonedas generado por código.
    SOUND_SPIN: '',   // ej: 'sounds/spin.mp3'
    SOUND_STOP: '',   // ej: 'sounds/stop.mp3'
    VOLUME: 0.5,      // 0 a 1

    SPIN_MS: 1700,    // duración del giro del primer número
    STAGGER_MS: 330,  // cada número siguiente se detiene este tiempo después
  };
  /* ======================================================================= */

  const L = window.LOTTERY;
  const $ = id => document.getElementById(id);
  const out = $('out'), cap = $('cap'), gen = $('gen'), copy = $('copy');
  const countWrap = $('countWrap'), countSel = $('count');
  const cg = L.groups.find(g => g.counts);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = null, spinning = false;

  /* ------------------------------ Logo propio ------------------------------ */
  document.querySelectorAll('a.mark').forEach(a => {
    const img = new Image();
    img.className = 'site-logo'; img.alt = 'Lalos Predictor';
    img.addEventListener('error', () => { img.hidden = true; }, { once: true });
    img.src = new URL(CONFIG.LOGO_FILE, BASE).href;
    const name = document.createElement('span');
    name.className = 'mark-name'; name.innerHTML = 'Lalo<span>Predictor</span>';
    a.textContent = ''; a.append(img, name);
  });

  /* ------------------------ Transición de cortina ------------------------ */
  const CURTAIN_KEY = 'lp-curtain', EASE_C = 'cubic-bezier(.7,0,.2,1)';
  const curtain = (color, label) => {
    const o = document.createElement('div');
    o.className = 'lp-curtain'; o.style.setProperty('--c', color);
    if (label) { const s = document.createElement('span'); s.textContent = label; o.append(s); }
    document.body.append(o); return o;
  };
  const themeColor = () => getComputedStyle(document.documentElement).getPropertyValue('--a').trim() || '#0b1530';

  // Salida: volver a la portada
  document.addEventListener('click', e => {
    const a = e.target.closest('a.back, a.mark');
    if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reduce) return;
    e.preventDefault();
    const color = themeColor();
    const o = curtain(color, '');
    const anim = o.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 480, easing: EASE_C, fill: 'forwards' });
    try { sessionStorage.setItem(CURTAIN_KEY, JSON.stringify({ color, label: '', t: Date.now() })); } catch (_) {}
    let went = false; const go = () => { if (!went) { went = true; location.href = a.href; } };
    anim.finished.then(() => setTimeout(go, 100)).catch(go);
    setTimeout(go, 900);
  });
  // Entrada: la cortina del color de la lotería se levanta
  (() => {
    let d = null;
    try { d = JSON.parse(sessionStorage.getItem(CURTAIN_KEY)); sessionStorage.removeItem(CURTAIN_KEY); } catch (_) {}
    if (!d || reduce || Date.now() - d.t > 6000) return;
    const o = curtain(d.color, d.label || L.name);
    const s = o.querySelector('span');
    setTimeout(() => {
      o.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 650, easing: EASE_C, fill: 'forwards' })
        .finished.then(() => o.remove()).catch(() => o.remove());
      if (s) s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
    }, 350);
  })();
  addEventListener('pageshow', e => { if (e.persisted) document.querySelectorAll('.lp-curtain').forEach(n => n.remove()); });

  /* ------------------------------ Aleatoriedad ------------------------------ */
  // Entero uniforme en [0, n) con el generador criptográfico del navegador (sin sesgo de módulo).
  const rnd = n => {
    const lim = 2 ** 32 - (2 ** 32 % n), buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= lim);
    return buf[0] % n;
  };
  const fmt = (v, g) => String(v).padStart(g.pad || 1, '0');
  const howMany = g => (g === cg && countSel.value ? +countSel.value : g.n);

  function pick(g) {
    if (g.values) return [g.values[rnd(g.values.length)]];
    const n = howMany(g), size = g.max - g.min + 1;
    if (!g.uniq) return Array.from({ length: n }, () => g.min + rnd(size));
    const pool = Array.from({ length: size }, (_, i) => g.min + i);
    for (let i = 0; i < n; i++) { const j = i + rnd(size - i); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const res = pool.slice(0, n);
    return g.sort === false ? res : res.sort((a, b) => a - b);
  }

  function draw(results) { // results === null -> bolitas vacías
    out.replaceChildren();
    L.groups.forEach((g, gi) => {
      const grp = document.createElement('div'); grp.className = 'grp';
      const label = document.createElement('small'); label.textContent = g.label;
      const row = document.createElement('div'); row.className = 'row';
      if (g.values) {
        const chip = document.createElement('span'); chip.className = 'chip'; chip.dataset.g = gi;
        chip.textContent = results ? results[gi][0] : '· · ·';
        if (!results) chip.classList.add('ghost');
        row.append(chip);
      } else {
        const n = results ? results[gi].length : howMany(g);
        for (let i = 0; i < n; i++) {
          const b = document.createElement('span'); b.className = 'ball'; b.dataset.g = gi;
          b.style.setProperty('--i', i);
          if (results) b.textContent = fmt(results[gi][i], g); else { b.textContent = '·'; b.classList.add('ghost'); }
          row.append(b);
        }
      }
      grp.append(label, row); out.append(grp);
    });
  }

  const text = () => L.groups.map((g, i) => g.values ? last[i][0] : last[i].map(v => fmt(v, g)).join(g.join ? '' : '-')).join(' ');

  /* ------------------------------ Audio ------------------------------ */
  let actx = null, master = null, muted = false;
  try { muted = localStorage.getItem('lp-muted') === '1'; } catch (_) {}
  const audio = () => {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { actx = new AC(); master = actx.createGain(); master.gain.value = muted ? 0 : CONFIG.VOLUME; master.connect(actx.destination); }
    }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  };
  const tone = (when, freq, dur, type, gain, endFreq) => {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, when);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, when + dur);
    g.gain.setValueAtTime(gain, when); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(master); o.start(when); o.stop(when + dur + 0.02);
  };
  const mkAudio = src => { const a = new Audio(new URL(src, BASE).href); a.volume = CONFIG.VOLUME; return a; };
  const spinFile = CONFIG.SOUND_SPIN ? mkAudio(CONFIG.SOUND_SPIN) : null;
  if (spinFile) spinFile.loop = true;

  // Botón de silencio
  const mute = document.createElement('button');
  mute.className = 'lp-mute'; mute.type = 'button';
  const paintMute = () => { mute.textContent = muted ? '🔇' : '🔊'; mute.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar'); };
  paintMute();
  mute.addEventListener('click', () => {
    muted = !muted; paintMute();
    try { localStorage.setItem('lp-muted', muted ? '1' : '0'); } catch (_) {}
    if (master) master.gain.value = muted ? 0 : CONFIG.VOLUME;
    if (spinFile && muted) spinFile.pause();
  });
  document.body.append(mute);

  /* ------------------------------ Slot machine ------------------------------ */
  // Curva de frenado: arranca muy rápido y se va deteniendo poco a poco (ease-out largo).
  const BZ = [0.12, 0.62, 0.08, 1], EASING = `cubic-bezier(${BZ.join(',')})`;
  const bez = x => { // progreso (0..1) en el instante x (0..1) de esa curva
    const [x1, y1, x2, y2] = BZ;
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    let lo = 0, hi = 1, s = x;
    for (let i = 0; i < 22; i++) { const v = ((ax * s + bx) * s + cx) * s; if (v < x) lo = s; else hi = s; s = (lo + hi) / 2; }
    return ((ay * s + by) * s + cy) * s;
  };
  const timeAt = p => { let lo = 0, hi = 1; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (bez(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };

  const fakeFor = (g, avoid) => {
    let v;
    do { v = g.values ? g.values[rnd(g.values.length)] : fmt(g.min + rnd(g.max - g.min + 1), g); } while (v === avoid);
    return v;
  };

  function setBusy(b) {
    spinning = b;
    gen.disabled = copy.disabled = b;
    if (countSel) countSel.disabled = b;
    if (b) out.setAttribute('aria-busy', 'true'); else out.removeAttribute('aria-busy');
  }

  function finish() {
    if (!spinning) return;
    setBusy(false);
    if (spinFile) spinFile.pause();
    cap.textContent = 'Combinación aleatoria generada en tu navegador. No predice resultados.';
  }

  function land(m) {
    const el = m.el;
    el.textContent = m.final;
    el.classList.remove('reel');
    el.style.height = ''; el.style.removeProperty('--h');
    el.animate([{ transform: 'scale(1.16)' }, { transform: 'scale(.96)', offset: .55 }, { transform: 'scale(1)' }], { duration: 340, easing: 'ease-out' });
    if (m.isChip) {
      el.style.width = '';
      el.animate([{ width: m.maxW + 'px' }, { width: m.w + 'px' }], { duration: 240, easing: 'ease-out' });
    }
    if (CONFIG.SOUND_STOP && !muted) mkAudio(CONFIG.SOUND_STOP).play().catch(() => {});
  }

  function spin() {
    const els = [...out.querySelectorAll('.ball:not(.ghost), .chip:not(.ghost)')];
    if (!els.length || reduce) { setBusy(true); finish(); return; }
    setBusy(true);
    cap.textContent = 'Girando…';

    // 1) Leer medidas (sin escribir todavía, para no forzar reflujos).
    const meta = els.map(el => {
      const m = { el, h: el.offsetHeight, w: el.offsetWidth, final: el.textContent, g: L.groups[+el.dataset.g], isChip: el.classList.contains('chip') };
      if (m.isChip) {
        const cs = getComputedStyle(el), ctx = document.createElement('canvas').getContext('2d');
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        m.maxW = Math.ceil(Math.max(...m.g.values.map(v => ctx.measureText(v).width)) + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
      }
      return m;
    });

    // 2) Construir los carretes y animarlos.
    const n = meta.length, stagger = n > 6 ? 220 : CONFIG.STAGGER_MS;
    const ticks = [], stops = [], anims = [];
    meta.forEach((m, i) => {
      const D = CONFIG.SPIN_MS + i * stagger, N = Math.round(10 + D * 0.006);
      const strip = document.createElement('div'); strip.className = 'strip';
      let prev = '';
      for (let k = 0; k < N - 1; k++) {
        const c = document.createElement('span'); prev = fakeFor(m.g, k ? prev : m.final); c.textContent = prev; strip.append(c);
      }
      const fin = document.createElement('span'); fin.textContent = m.final; strip.append(fin);

      m.el.style.animation = 'none';
      m.el.style.setProperty('--h', m.h + 'px');
      if (m.isChip) { m.el.style.width = m.maxW + 'px'; m.el.style.height = m.h + 'px'; }
      m.el.textContent = ''; m.el.classList.add('reel'); m.el.append(strip);

      const a = strip.animate(
        [{ transform: 'translateY(0)' }, { transform: `translateY(${-(N - 1) * m.h}px)` }],
        { duration: D, easing: EASING, fill: 'forwards' });
      a.finished.then(() => land(m)).catch(() => {});
      anims.push(a.finished);
      stops.push(D);
      for (let k = 1; k < N; k++) ticks.push(D * timeAt(k / (N - 1)));  // instante en que pasa cada número
    });

    // 3) Sonido sincronizado con los carretes.
    const total = Math.max(...stops);
    if (spinFile) {
      if (!muted) { spinFile.currentTime = 0; spinFile.play().catch(() => {}); }
    } else if (audio()) {
      const t0 = actx.currentTime + 0.05;
      ticks.sort((a, b) => a - b);
      let lastT = -99, j = 0;
      ticks.forEach(ms => {
        if (ms - lastT < 32) return;           // evita saturar cuando todos giran rápido
        lastT = ms;
        tone(t0 + ms / 1000, 760 + (j++ % 2) * 100, 0.035, 'square', 0.05 + 0.08 * (ms / total));
      });
      stops.forEach(ms => {
        tone(t0 + ms / 1000, 190, 0.2, 'sine', 0.55, 60);
        tone(t0 + ms / 1000, 1500, 0.02, 'square', 0.07);
      });
      [784, 988, 1318].forEach((f, k) => tone(t0 + total / 1000 + 0.08 + k * 0.09, f, 0.4, 'triangle', 0.22));
    }

    Promise.all(anims).then(() => setTimeout(finish, 120)).catch(finish);
  }

  /* ------------------------------ Eventos ------------------------------ */
  gen.addEventListener('click', () => {
    if (spinning) return;
    audio();                                  // el navegador exige un clic para activar el sonido
    last = L.groups.map(pick);
    draw(last);                               // dibuja el resultado final y enseguida lo convierte en carretes
    spin();
  });

  copy.addEventListener('click', async () => {
    if (spinning) return;
    if (!last) { cap.textContent = 'Primero genera una combinación para copiarla.'; return; }
    try {
      await navigator.clipboard.writeText(text());
      const t = copy.textContent; copy.textContent = '✓ Copiado';
      setTimeout(() => { copy.textContent = t; }, 1500);
    } catch { cap.textContent = `Selecciona y copia: ${text()}`; }
  });

  if (cg) {
    cg.counts.forEach(c => countSel.add(new Option(`${c} ${cg.uniq ? 'números' : 'dígitos'}`, c, false, c === cg.n)));
    countWrap.hidden = false;
    countSel.addEventListener('change', () => { last = null; draw(null); cap.textContent = 'Listo para generar.'; });
  }

  // Si todavía no subes el logo, se muestra el nombre con la tipografía de la lotería.
  document.querySelectorAll('img[data-logo]').forEach(img => {
    const swap = () => { const s = document.createElement('span'); s.className = 'logo-fallback'; s.textContent = L.name; img.replaceWith(s); };
    if (img.complete && !img.naturalWidth) swap(); else img.addEventListener('error', swap, { once: true });
  });

  draw(null);
})();
