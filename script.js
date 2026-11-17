// Portada: catálogo de boletos (los datos vienen de lotteries.js, generado por build.py).

// ===================== TU LOGO =====================
// Guarda tu imagen como  assets/logo.png  y listo. Si se llama distinto, cambia esta línea:
const LOGO_FILE = 'assets/logo.png';
// ===================================================

const GAMES = window.LOTTERIES || [];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Logo propio (cabecera y pie) ----------
document.querySelectorAll('img[data-site-logo]').forEach(img => {
  img.addEventListener('error', () => { img.hidden = true; }, { once: true });
  img.src = LOGO_FILE;
});

// ---------- Boletos ----------
function buildTicket(item, index) {
  const link = document.createElement('a');
  link.className = 'boleto';
  link.href = `${item.slug}/`;
  link.style.setProperty('--a', item.a);
  link.style.setProperty('--b', item.b);
  link.setAttribute('aria-label', `${item.name}: ${item.rule}. Abrir generador`);
  link.innerHTML = `
    <span class="boleto-fx">
      <div class="boleto-in">
        <div class="boleto-main">
          <span class="boleto-org">${esc(item.org)}</span>
          <span class="boleto-logo"><img src="assets/logos/${item.slug}.png" alt="${esc(item.name)}" data-logo data-name="${esc(item.name)}"></span>
          <span class="boleto-rule">${esc(item.rule)}</span>
          <span class="boleto-go">Generar números <b>→</b></span>
        </div>
        <div class="boleto-stub"><span>N.º ${String(index + 1).padStart(2, '0')}</span><i>✦</i><span>BOLETO</span></div>
      </div>
    </span>`;
  return link;
}

const lotteryGrid = document.querySelector('#lotteryGrid');
if (lotteryGrid) {
  GAMES.forEach((item, i) => lotteryGrid.appendChild(buildTicket(item, i)));
  // Si todavía no subes el logo, se muestra el nombre en su lugar.
  lotteryGrid.querySelectorAll('img[data-logo]').forEach(img => {
    const swap = () => {
      const s = document.createElement('span');
      s.className = 'logo-fallback';
      s.textContent = img.dataset.name;
      img.replaceWith(s);
    };
    if (img.complete && !img.naturalWidth) swap(); else img.addEventListener('error', swap, { once: true });
  });
}

// ---------- Transición de cortina al entrar a un generador ----------
const CURTAIN_KEY = 'lp-curtain';
const EASE = 'cubic-bezier(.7,0,.2,1)';

function curtain(color, label) {
  const o = document.createElement('div');
  o.className = 'lp-curtain';
  o.style.setProperty('--c', color);
  if (label) { const s = document.createElement('span'); s.textContent = label; o.append(s); }
  document.body.append(o);
  return o;
}

document.addEventListener('click', e => {
  const a = e.target.closest('a.boleto');
  if (!a || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || reduceMotion) return;
  e.preventDefault();
  const color = getComputedStyle(a).getPropertyValue('--a').trim() || '#0b1530';
  const label = (a.getAttribute('aria-label') || '').split(':')[0];
  const o = curtain(color, label);
  const anim = o.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 520, easing: EASE, fill: 'forwards' });
  const t = o.querySelector('span');
  if (t) t.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 350, delay: 260, easing: 'ease-out', fill: 'both' });
  try { sessionStorage.setItem(CURTAIN_KEY, JSON.stringify({ color, label, t: Date.now() })); } catch (_) {}
  let went = false;
  const go = () => { if (!went) { went = true; location.href = a.href; } };
  anim.finished.then(() => setTimeout(go, 150)).catch(go);
  setTimeout(go, 1000);
});

// Si venimos de un generador (← Todas las loterías), la cortina se levanta.
(() => {
  let d = null;
  try { d = JSON.parse(sessionStorage.getItem(CURTAIN_KEY)); sessionStorage.removeItem(CURTAIN_KEY); } catch (_) {}
  if (!d || reduceMotion || Date.now() - d.t > 6000) return;
  const o = curtain(d.color, '');
  setTimeout(() => {
    o.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 600, easing: EASE, fill: 'forwards' })
      .finished.then(() => o.remove()).catch(() => o.remove());
  }, 120);
})();
addEventListener('pageshow', e => { if (e.persisted) document.querySelectorAll('.lp-curtain').forEach(n => n.remove()); });

// ---------- Mobile navigation ----------
const menuToggle = document.querySelector('#menuToggle');
const mainNav = document.querySelector('#mainNav');
menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  mainNav.classList.toggle('open', !isOpen);
});
mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    mainNav.classList.remove('open');
  });
});

// ---------- Reveal + pausa de animaciones fuera de pantalla ----------
const revealElements = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        activeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach(element => observer.observe(element));

  // Las animaciones infinitas (tarjeta flotante, órbitas…) solo corren mientras se ven.
  const pauser = new IntersectionObserver(entries => {
    entries.forEach(en => en.target.classList.toggle('is-off', !en.isIntersecting));
  });
  document.querySelectorAll('.hero-art, .closing').forEach(el => pauser.observe(el));
} else {
  revealElements.forEach(element => element.classList.add('visible'));
}

// Contador de loterías del catálogo
const lotteryCount = document.querySelector('#lotteryCount');
if (lotteryCount && GAMES.length) lotteryCount.textContent = GAMES.length;

// Móvil: cerrar el menú al tocar fuera de él o con Escape
document.addEventListener('click', e => {
  if (!mainNav.classList.contains('open') || e.target.closest('#mainNav, #menuToggle')) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  mainNav.classList.remove('open');
});
addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !mainNav.classList.contains('open')) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  mainNav.classList.remove('open');
});

document.querySelector('#currentYear').textContent = new Date().getFullYear();
