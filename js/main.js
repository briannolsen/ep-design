/* ═══════════════════════════════════════════
   EP DESIGN — Animations & Interactions
   GSAP + ScrollTrigger
═══════════════════════════════════════════ */

// Siempre arriba al recargar
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('load', () => window.scrollTo(0, 0));

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════
   DEVICE DETECTION — touch (mobile/tablet)
   En touch las animaciones se ejecutan UNA SOLA VEZ
   (patron de Apple, Stripe, Linear, Vercel)
══════════════════════════════════════ */
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches;

/* ── Loader ── */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  // Split title DOM once, before loader hides
  splitHeroTitle();
  setTimeout(() => {
    loader.classList.add('hidden');
    runHeroAnimation();
  }, 1800);
});

/* ── Custom Cursor ── */
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');
let mouseX = 0, mouseY = 0, dotX = 0, dotY = 0, cursorX = 0, cursorY = 0;

document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

function animateCursor() {
  dotX += (mouseX - dotX) * 0.95;
  dotY += (mouseY - dotY) * 0.95;
  cursorX += (mouseX - cursorX) * 0.12;
  cursorY += (mouseY - cursorY) * 0.12;
  if (cursor) { cursor.style.left = cursorX + 'px'; cursor.style.top = cursorY + 'px'; }
  if (cursorDot) { cursorDot.style.left = dotX + 'px'; cursorDot.style.top = dotY + 'px'; }
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, button, .srv-card, .pain-card, .blog-card').forEach(el => {
  el.addEventListener('mouseenter', () => cursor?.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor?.classList.remove('hover'));
});

/* ══════════════════════════════════════
   THEME TOGGLE — Dark / Light mode
══════════════════════════════════════ */
(function() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  function setTheme(theme, animate) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('ep-theme', theme); } catch (e) {}
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo oscuro');

    if (animate) {
      // Spin button
      toggle.classList.remove('spinning');
      // Force reflow so animation restarts cleanly
      void toggle.offsetWidth;
      toggle.classList.add('spinning');
      setTimeout(() => toggle.classList.remove('spinning'), 600);

      // Page flash overlay (subtle blue tint on transition)
      const flash = document.createElement('div');
      flash.className = 'theme-flash';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 600);
    }
  }

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'dark' ? 'light' : 'dark', true);
  });

  // Sync with system changes if user hasn't manually chosen
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('ep-theme'); } catch (err) {}
    if (!saved) setTheme(e.matches ? 'dark' : 'light', false);
  });

  // Set correct aria-label on init (theme already applied by inline script in <head>)
  const init = document.documentElement.getAttribute('data-theme') || 'light';
  toggle.setAttribute('aria-label', init === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo oscuro');
})();

/* ── Navbar ── */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
let ticking = false;

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
  const isOpen = mobileMenu.classList.contains('open');
  document.body.style.overflow = isOpen ? 'hidden' : '';
  if (isOpen) {
    mobileMenu.setAttribute('aria-hidden', 'false');
    trapFocusInMenu();
  } else {
    mobileMenu.setAttribute('aria-hidden', 'true');
    removeFocusTrap();
  }
});
document.querySelectorAll('.mob-link, .mob-wa').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    removeFocusTrap();
  });
});

/* ── Active mob-link based on scroll ── */
const mobLinks = document.querySelectorAll('.mob-link');
const sectionIds = [...mobLinks].map(l => l.getAttribute('href').replace('#', ''));

function updateMobActive() {
  const scrollY = window.scrollY + window.innerHeight / 3;
  let currentId = sectionIds[0];
  sectionIds.forEach(id => {
    const sec = document.getElementById(id);
    if (sec && sec.offsetTop <= scrollY) currentId = id;
  });
  mobLinks.forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === `#${currentId}`);
  });
}
window.addEventListener('scroll', updateMobActive, { passive: true });
updateMobActive();

/* ══════════════════════════════════════
   HERO — split + animate + reset
══════════════════════════════════════ */

/* splitHeroTitle runs ONCE — modifies the DOM */
function splitHeroTitle() {
  const title = document.getElementById('heroTitle');
  if (!title || title.dataset.split) return;
  title.dataset.split = '1';

  const nodes = Array.from(title.childNodes);
  title.innerHTML = '';

  nodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/(\s+)/).forEach(chunk => {
        if (/\S/.test(chunk)) {
          const word = document.createElement('span');
          word.className = 'word';
          const inner = document.createElement('span');
          inner.className = 'word-inner';
          inner.textContent = chunk;
          word.appendChild(inner);
          title.appendChild(word);
        } else if (chunk) {
          title.appendChild(document.createTextNode(chunk));
        }
      });
    } else if (node.nodeName === 'BR') {
      title.appendChild(document.createElement('br'));
    } else if (node.nodeName === 'SPAN') {
      // grad-text: animate as one unit, don't split
      node.style.display = 'inline-block';
      title.appendChild(node);
    }
  });
}

/* Reset hero to invisible state */
function resetHeroElements() {
  gsap.set('.hero-badge', { opacity: 0, y: 18 });
  gsap.set('.hero-title .word-inner', { y: '110%' });
  gsap.set('.hero-title .grad-text', { opacity: 0, y: 18 });
  gsap.set(['#heroSub', '#heroBullets', '#heroActions', '#heroStats'], { opacity: 0, y: 18 });
}

/* Play hero animation from scratch */
function runHeroAnimation() {
  resetHeroElements();

  gsap.to('.hero-badge', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.15 });

  gsap.fromTo('.hero-title .word-inner',
    { y: '110%' },
    { y: '0%', duration: 1.0, ease: 'power3.out', stagger: 0.07, delay: 0.35 }
  );

  gsap.to('.hero-title .grad-text', { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: 0.8 });

  gsap.to('#heroSub',     { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 1.05 });
  gsap.to('#heroBullets', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 1.2  });
  gsap.to('#heroActions', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 1.35 });
  gsap.to('#heroStats',   { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 1.5  });

  animateHeroStats();
}

/* Hero stat counters */
function animateHeroStats() {
  document.querySelectorAll('.stat-n').forEach(el => {
    const val = parseFloat(el.dataset.val);
    const suf = el.dataset.suf || '';
    const pre = el.dataset.pre || '';
    const isDecimal = val % 1 !== 0;
    const duration = 2000;
    const startTime = performance.now() + 1600;

    function update(now) {
      if (now < startTime) { requestAnimationFrame(update); return; }
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = val * eased;
      el.textContent = pre + (isDecimal ? current.toFixed(1) : Math.round(current)) + suf;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

/* Re-trigger hero when scrolling back to top — solo desktop */
if (!IS_TOUCH) {
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top 2%',    // fires when hero's top is nearly at the top of viewport
    onEnterBack: () => {
      // Small delay so scroll settles before animating
      setTimeout(runHeroAnimation, 150);
    }
  });
}

/* ══════════════════════════════════════
   SCROLL REVEAL — bidirectional
   Elements replay every time they enter
══════════════════════════════════════ */

const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // En touch: una sola vez, desuscribir y conservar el estado final
      if (IS_TOUCH) obs.unobserve(entry.target);
    } else if (!IS_TOUCH) {
      // Solo en desktop: replay al volver a entrar
      entry.target.classList.remove('visible');
    }
  });
}, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  // Only count direct sibling .reveal elements to avoid deep nesting accumulating delay
  const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
  el.style.transitionDelay = (siblings.indexOf(el) * 0.1) + 's';
  revealObserver.observe(el);
});

/* ══════════════════════════════════════
   COUNTERS — replay on re-entry
══════════════════════════════════════ */

function animateCounters(container) {
  container.querySelectorAll('.counter-n').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suf = el.dataset.suf || '';
    const pre = el.dataset.pre || '';
    const fmt = el.dataset.format;
    const duration = 2000;
    const startTime = performance.now();

    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = pre + (fmt === 'M' ? (current / 1000000).toFixed(1) + 'M' : current.toLocaleString('es-AR')) + suf;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

const counterObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters(entry.target);
      // En touch: animar una vez y desuscribir
      if (IS_TOUCH) obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.counters').forEach(el => counterObserver.observe(el));

/* ══════════════════════════════════════
   GSAP SCROLL ANIMATIONS — all replay
   toggleActions: 'play none none reset'
   → plays on enter, resets on scroll back up
══════════════════════════════════════ */

// En desktop: play al entrar, reset al volver. En touch: play una sola vez.
const TRIG = IS_TOUCH
  ? { toggleActions: 'play none none none', once: true }
  : { toggleActions: 'play none none reset' };

// Section headers
gsap.utils.toArray('.sec-head').forEach(el => {
  gsap.fromTo(el, { opacity: 0, y: 44 }, {
    opacity: 1, y: 0, duration: 1.0, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 78%', ...TRIG }
  });
});

// Steps
gsap.utils.toArray('.step').forEach((el, i) => {
  gsap.fromTo(el, { opacity: 0, x: -36 }, {
    opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', delay: i * 0.18,
    scrollTrigger: { trigger: el, start: 'top 78%', ...TRIG }
  });
});

// Pain cards
gsap.utils.toArray('.pain-card').forEach((el, i) => {
  gsap.fromTo(el, { opacity: 0, y: 36 }, {
    opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', delay: (i % 2) * 0.14,
    scrollTrigger: { trigger: el, start: 'top 80%', ...TRIG }
  });
});

// Service cards
gsap.utils.toArray('.srv-card').forEach((el, i) => {
  gsap.fromTo(el, { opacity: 0, y: 28 }, {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: (i % 3) * 0.1,
    scrollTrigger: { trigger: el, start: 'top 82%', ...TRIG }
  });
});

// Result cards
gsap.utils.toArray('.result-card').forEach((el, i) => {
  gsap.fromTo(el, { opacity: 0, y: 32 }, {
    opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', delay: (i % 2) * 0.14,
    scrollTrigger: { trigger: el, start: 'top 80%', ...TRIG }
  });
});

// Blog cards
gsap.utils.toArray('.blog-card').forEach((el, i) => {
  gsap.fromTo(el, { opacity: 0, y: 32 }, {
    opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', delay: i * 0.12,
    scrollTrigger: { trigger: el, start: 'top 80%', ...TRIG }
  });
});

// CTA
gsap.fromTo('.cta-wrap', { opacity: 0, y: 56 }, {
  opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
  scrollTrigger: { trigger: '.cta-final', start: 'top 72%', ...TRIG }
});

/* ══════════════════════════════════════
   STRIKE BAR — barra sólida que tapa el texto
══════════════════════════════════════ */

document.querySelectorAll('.strike-wrap').forEach(el => {
  const bar = el.querySelector('.strike-bar');
  if (!bar) return;

  function drawStrike() {
    gsap.killTweensOf(bar);
    gsap.fromTo(bar,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 1.4, ease: 'power3.inOut', delay: 0.4 }
    );
  }

  function resetStrike() {
    gsap.killTweensOf(bar);
    gsap.set(bar, { scaleX: 0 });
  }

  new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        drawStrike();
        // En touch: queda tachado para siempre
        if (IS_TOUCH) obs.unobserve(entry.target);
      } else if (!IS_TOUCH) {
        resetStrike();
      }
    });
  }, { threshold: 0.6 }).observe(el);
});

/* ── Magnetic buttons ── */
document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.3;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.3;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.style.transform = '';
  });
});

/* ── Active nav link (theme-safe: usa clase, no inline style) ── */
const navLinks = document.querySelectorAll('.nav-links a');
const navObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { rootMargin: '-50% 0px -50% 0px' });
document.querySelectorAll('section[id]').forEach(s => navObs.observe(s));

/* ── Smooth scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }
  });
});

/* ══════════════════════════════════════
   MARQUEE — drag / swipe to scroll
══════════════════════════════════════ */
function setupMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;

  let halfWidth  = 0;
  let xPos       = 0;
  let isDragging = false;
  let startPtrX  = 0;
  let startXPos  = 0;
  let velX       = 0;
  let prevPtrX   = 0;
  const SPEED    = 0.65; // px per tick (auto-scroll speed)

  // Calculate after layout is ready
  requestAnimationFrame(() => {
    halfWidth = track.scrollWidth / 2;

    // GSAP ticker = smooth 60fps auto-scroll
    gsap.ticker.add(() => {
      if (isDragging) return;
      xPos -= SPEED;
      if (xPos <= -halfWidth) xPos += halfWidth;
      gsap.set(track, { x: xPos });
    });
  });

  function wrap(val) {
    if (val <= -halfWidth) return val + halfWidth;
    if (val >  0)          return val - halfWidth;
    return val;
  }

  function pointerStart(e) {
    isDragging = true;
    track.classList.add('dragging');
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    startPtrX = clientX;
    prevPtrX  = clientX;
    startXPos = xPos;
    velX = 0;
  }

  function pointerMove(e) {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    velX  = clientX - prevPtrX;
    prevPtrX = clientX;
    xPos  = wrap(startXPos + (clientX - startPtrX));
    gsap.set(track, { x: xPos });
  }

  function pointerEnd() {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove('dragging');

    // Momentum flick
    if (Math.abs(velX) > 1) {
      const momentum = velX * 18;
      gsap.to({ v: xPos }, {
        v: xPos + momentum,
        duration: 0.7,
        ease: 'power2.out',
        onUpdate: function() {
          xPos = wrap(this.targets()[0].v);
          gsap.set(track, { x: xPos });
        }
      });
    }
  }

  // Mouse (desktop drag)
  track.addEventListener('mousedown',  pointerStart);
  window.addEventListener('mousemove', pointerMove);
  window.addEventListener('mouseup',   pointerEnd);

  // Touch (mobile swipe)
  track.addEventListener('touchstart', pointerStart, { passive: true });
  window.addEventListener('touchmove', pointerMove,  { passive: true });
  window.addEventListener('touchend',  pointerEnd);

  // Recalculate on resize
  window.addEventListener('resize', () => {
    halfWidth = track.scrollWidth / 2;
  }, { passive: true });
}

setupMarquee();

/* ══════════════════════════════════════
   GROWTH CHARTS — animaciones SVG + stat counter
══════════════════════════════════════ */
function animateChartStat(el, opts = {}) {
  const target = parseFloat(el.dataset.target);
  const fmt    = el.dataset.format;
  const suf    = el.dataset.suf || '';
  const pre    = el.dataset.pre || '';
  const dur    = opts.duration || 2000;
  const delay  = opts.delay || 700;
  const isText = el.tagName.toLowerCase() === 'text';
  const isDecimal = !Number.isInteger(target);
  const start  = performance.now() + delay;

  function fmtVal(v) {
    if (fmt === 'M') return (v / 1000000).toFixed(1) + 'M';
    if (isDecimal)   return v.toFixed(1);
    if (target >= 1000) return Math.round(v).toLocaleString('es-AR');
    return Math.round(v);
  }
  function tick(now) {
    if (now < start) { requestAnimationFrame(tick); return; }
    const p = Math.min((now - start) / dur, 1);
    if (p >= 1) {
      el.textContent = pre + fmtVal(target) + suf;  // valor final exacto
      return;
    }
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + fmtVal(target * eased) + suf;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const chartObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      // Stat principal del header
      const num = entry.target.querySelector('.chart-stat-num');
      if (num && !num.dataset.animated) {
        num.dataset.animated = '1';
        animateChartStat(num);
      }
      // Numeros dentro de los rings (chart 2)
      entry.target.querySelectorAll('.ring-num').forEach((rn, i) => {
        if (rn.dataset.animated) return;
        rn.dataset.animated = '1';
        animateChartStat(rn, { delay: 600 + i * 200, duration: 1300 });
      });
      // Una sola vez
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.35 });
document.querySelectorAll('.chart-card').forEach(el => chartObserver.observe(el));

/* ══════════════════════════════════════
   INSTAGRAM — perfiles de clientes vía la API oficial.
   data/instagram.json lo genera scripts/fetch-instagram.mjs
══════════════════════════════════════ */
const SVG_NS = 'http://www.w3.org/2000/svg';

function igEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

function igIcon(id, className) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  if (className) svg.setAttribute('class', className);
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', '#' + id);
  svg.appendChild(use);
  return svg;
}

const igNum = n => Number(n).toLocaleString('es-AR');
const igProfileUrl = username => 'https://www.instagram.com/' + encodeURIComponent(username) + '/';

// Los datos vienen de afuera: solo se aceptan URLs https o del propio sitio
function igSafeUrl(url, fallback) {
  if (!url) return fallback;
  try {
    const u = new URL(url, location.href);
    return u.protocol === 'https:' || u.origin === location.origin ? u.href : fallback;
  } catch {
    return fallback;
  }
}

function igInitials(name) {
  return name.split(/\s+/).filter(w => w.length > 1).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function igAvatar(className, picUrl, name) {
  const wrap = igEl('span', 'ig-ring ' + className);
  const src = igSafeUrl(picUrl, '');
  if (src) {
    const img = igEl('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    wrap.appendChild(img);
  } else {
    const initials = igEl('span', 'ig-initials', igInitials(name));
    initials.setAttribute('aria-hidden', 'true');
    wrap.appendChild(initials);
  }
  return wrap;
}

function igTypeBadge(mediaType) {
  if (mediaType === 'VIDEO') return igIcon('ig-reel', 'ig-type');
  if (mediaType === 'CAROUSEL_ALBUM') return igIcon('ig-carousel', 'ig-type');
  return null;
}

function igExternalLink(className, href, label) {
  const a = igEl('a', className);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', label + ' (se abre en otra pestaña)');
  return a;
}

const IG_IS_LOCAL = ['localhost', '127.0.0.1', ''].includes(location.hostname);

// Los elementos se crean después de que el cursor custom registró sus hovers
function igCursorHover(root) {
  root.addEventListener('mouseover', e => { if (e.target.closest('a, button')) cursor?.classList.add('hover'); });
  root.addEventListener('mouseout', e => { if (e.target.closest('a, button')) cursor?.classList.remove('hover'); });
}

function igApiProfile(acc) {
  const name = acc.name || acc.username;
  const profileUrl = igProfileUrl(acc.username);
  const profile = igEl('div', 'igp-profile');

  const head = igEl('div', 'igp-head');
  head.appendChild(igAvatar('igp-avatar', acc.profile_picture_url, name));
  const meta = igEl('div', 'igp-meta');
  meta.appendChild(igEl('h3', 'igp-name', name));
  meta.appendChild(igEl('span', 'igp-handle', '@' + acc.username));
  const stats = igEl('ul', 'igp-stats');
  [[acc.media_count, 'publicaciones'], [acc.followers_count, 'seguidores']].forEach(([n, label]) => {
    if (n == null) return;
    const li = igEl('li');
    li.appendChild(igEl('strong', null, igNum(n)));
    li.append(label);
    stats.appendChild(li);
  });
  meta.appendChild(stats);
  head.appendChild(meta);
  const follow = igExternalLink('igp-follow', profileUrl, 'Seguir a ' + name + ' en Instagram');
  follow.appendChild(igIcon('ig-icon'));
  follow.append('Seguir en Instagram');
  head.appendChild(follow);
  profile.appendChild(head);

  const grid = igEl('div', 'igp-grid');
  (acc.media?.data || []).slice(0, 6).forEach(m => {
    const post = igExternalLink('igp-post', igSafeUrl(m.permalink, profileUrl), 'Ver publicación de ' + name + ' en Instagram');
    const img = igEl('img');
    img.src = igSafeUrl(m.media_type === 'VIDEO' ? m.thumbnail_url || m.media_url : m.media_url, '');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    post.appendChild(img);
    const badge = igTypeBadge(m.media_type);
    if (badge) post.appendChild(badge);
    const overlay = igEl('span', 'igp-overlay');
    [[m.like_count, 'ig-heart'], [m.comments_count, 'ig-comment']].forEach(([n, icon]) => {
      if (n == null) return;
      const s = igEl('span');
      s.appendChild(igIcon(icon));
      s.append(igNum(n));
      overlay.appendChild(s);
    });
    post.appendChild(overlay);
    grid.appendChild(post);
  });
  profile.appendChild(grid);
  return profile;
}

async function initIgApi(root) {
  const tabs = root.querySelector('.igp-tabs');
  const panel = root.querySelector('.igp-panel');
  let data;
  try {
    const res = await fetch(root.dataset.src, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch {
    panel.replaceChildren(igEl('p', 'ig-error', 'No pudimos cargar los perfiles en este momento.'));
    return;
  }
  let accounts = data.accounts || [];
  if (!accounts.length) return;
  if (data.sample) {
    // Los números y posts de ejemplo nunca se muestran en la web publicada
    if (IG_IS_LOCAL) root.querySelector('.ig-sample-badge')?.removeAttribute('hidden');
    else accounts = accounts.map(({ username, name, profile_picture_url }) => ({ username, name, profile_picture_url }));
  }

  accounts.forEach((acc, i) => {
    const name = acc.name || acc.username;
    const tab = igEl('button', 'igp-tab');
    tab.type = 'button';
    tab.id = 'igp-tab-' + i;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    tab.appendChild(igAvatar('igp-tab-avatar', acc.profile_picture_url, name));
    tab.appendChild(igEl('span', null, name));
    tab.addEventListener('click', () => select(i));
    tabs.appendChild(tab);
  });

  let current = -1;
  let switchTimer;
  function select(i) {
    if (i === current) return;
    const first = current === -1;
    current = i;
    [...tabs.children].forEach((t, j) => {
      t.setAttribute('aria-selected', String(j === i));
      t.tabIndex = j === i ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tabs.children[i].id);
    clearTimeout(switchTimer);
    if (first) { panel.replaceChildren(igApiProfile(accounts[i])); return; }
    panel.classList.add('is-switching');
    switchTimer = setTimeout(() => {
      panel.replaceChildren(igApiProfile(accounts[i]));
      panel.classList.remove('is-switching');
    }, 180);
  }

  // Flechas del teclado entre pestañas (patrón ARIA tabs)
  tabs.addEventListener('keydown', e => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (current + step + accounts.length) % accounts.length;
    select(next);
    tabs.children[next].focus();
  });

  select(0);
  igCursorHover(root);
}

const igApiRoot = document.getElementById('igApi');
if (igApiRoot) initIgApi(igApiRoot);

/* ══════════════════════════════════════
   FOCUS TRAP — Mobile Menu
══════════════════════════════════════ */

let focusTrapHandler = null;

function trapFocusInMenu() {
  const menu = document.getElementById('mobileMenu');
  const ham = document.getElementById('hamburger');
  const focusable = [...menu.querySelectorAll('a, button'), ham];

  focusTrapHandler = (e) => {
    if (e.key !== 'Tab' || !focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener('keydown', focusTrapHandler);

  // Close on Escape
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      ham.classList.remove('open');
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      ham.focus();
      removeFocusTrap();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

function removeFocusTrap() {
  if (focusTrapHandler) {
    document.removeEventListener('keydown', focusTrapHandler);
    focusTrapHandler = null;
  }
}

/* ══════════════════════════════════════
   REDUCED MOTION — disable GSAP anims
══════════════════════════════════════ */

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.globalTimeline.timeScale(100);
  ScrollTrigger.getAll().forEach(st => st.kill());
}

/* ══════════════════════════════════════
   FIX iOS/iPad — animation bug on tab/app switch
   Cuando el usuario sale de la app/safari y vuelve,
   GSAP queda dormido y los IntersectionObservers
   no re-evaluan. Esto fuerza un refresh completo.
══════════════════════════════════════ */
(function() {
  let wasHidden = false;
  let refreshing = false;

  function refreshAllAnimations() {
    if (refreshing) return;
    refreshing = true;

    // 1. Despertar el ticker de GSAP (se pausa con la pestaña oculta)
    if (typeof gsap !== 'undefined') {
      gsap.ticker.wake();
      // Resetear lag smoothing al estado normal
      gsap.ticker.lagSmoothing(500, 33);
    }

    // 2. Re-evaluar manualmente los elementos .reveal segun viewport actual
    //    (los IntersectionObservers no siempre re-disparan al volver)
    const vh = window.innerHeight;
    document.querySelectorAll('.reveal').forEach(el => {
      const r = el.getBoundingClientRect();
      const inView = r.top < vh - 60 && r.bottom > 60;
      el.classList.toggle('visible', inView);
    });

    // 3. Refrescar todos los ScrollTrigger y forzar re-evaluacion
    requestAnimationFrame(() => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh(true);
        ScrollTrigger.update();
      }
      // Disparar scroll event para que cualquier listener dormido se despierte
      window.dispatchEvent(new Event('scroll'));

      // 4. Reanudar videos pausados que esten en viewport
      document.querySelectorAll('video[autoplay]').forEach(v => {
        const r = v.getBoundingClientRect();
        const inView = r.top < vh && r.bottom > 0;
        if (inView && v.paused) {
          v.play().catch(() => {});
        }
      });

      refreshing = false;
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      wasHidden = true;
      return;
    }
    if (wasHidden) {
      wasHidden = false;
      // Pequeno delay para que iOS termine de restaurar el contexto
      setTimeout(refreshAllAnimations, 50);
    }
  });

  // bfcache (back-forward cache de iOS Safari)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) refreshAllAnimations();
  });

  // Foco recuperado
  window.addEventListener('focus', () => {
    setTimeout(refreshAllAnimations, 50);
  });

  // iPad: cuando se rota o cambia el size del viewport tambien refrescar
  window.addEventListener('orientationchange', () => {
    setTimeout(refreshAllAnimations, 200);
  });
})();

/* ── Parallax glows ── */
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const gl = document.querySelector('.hero-glow-left');
  const gr = document.querySelector('.hero-glow-right');
  if (gl) gl.style.transform = `translateY(${y * 0.15}px)`;
  if (gr) gr.style.transform = `translateY(${y * 0.08}px)`;
}, { passive: true });
