/* ═══════════════════════════════════════════
   EP DESIGN — Animations & Interactions
   GSAP + ScrollTrigger
═══════════════════════════════════════════ */

// Siempre arriba al recargar
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('load', () => window.scrollTo(0, 0));

gsap.registerPlugin(ScrollTrigger);

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

document.querySelectorAll('a, button, .srv-card, .pain-card, .testi-card, .blog-card').forEach(el => {
  el.addEventListener('mouseenter', () => cursor?.classList.add('hover'));
  el.addEventListener('mouseleave', () => cursor?.classList.remove('hover'));
});

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
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
});
document.querySelectorAll('.mob-link, .mob-wa').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});

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

/* Re-trigger hero when scrolling back to top */
ScrollTrigger.create({
  trigger: '.hero',
  start: 'top 2%',    // fires when hero's top is nearly at the top of viewport
  onEnterBack: () => {
    // Small delay so scroll settles before animating
    setTimeout(runHeroAnimation, 150);
  }
});

/* ══════════════════════════════════════
   SCROLL REVEAL — bidirectional
   Elements replay every time they enter
══════════════════════════════════════ */

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    } else {
      // Reset so animation replays on next entry
      entry.target.classList.remove('visible');
    }
  });
}, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  const siblings = Array.from(el.parentElement.querySelectorAll('.reveal'));
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

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.counters').forEach(el => counterObserver.observe(el));

/* ══════════════════════════════════════
   GSAP SCROLL ANIMATIONS — all replay
   toggleActions: 'play none none reset'
   → plays on enter, resets on scroll back up
══════════════════════════════════════ */

const TRIG = { toggleActions: 'play none none reset' };

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

// Testimonial cards
gsap.utils.toArray('.testi-card').forEach((el, i) => {
  gsap.fromTo(el, { opacity: 0, y: 36, scale: 0.97 }, {
    opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out', delay: i * 0.15,
    scrollTrigger: { trigger: el, start: 'top 80%', ...TRIG }
  });
});

// Portfolio items
gsap.utils.toArray('.port-item').forEach((el, i) => {
  gsap.fromTo(el, { opacity: 0, scale: 0.92 }, {
    opacity: 1, scale: 1, duration: 0.85, ease: 'power3.out', delay: (i % 3) * 0.1,
    scrollTrigger: { trigger: el, start: 'top 82%', ...TRIG }
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

  new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.isIntersecting ? drawStrike() : resetStrike();
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

/* ── Active nav link ── */
const navLinks = document.querySelectorAll('.nav-links a');
new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}`
          ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.65)';
      });
    }
  });
}, { rootMargin: '-50% 0px -50% 0px' }).observe = (() => {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${id}`
            ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.65)';
        });
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach(s => obs.observe(s));
})();

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

/* ── Parallax glows ── */
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const gl = document.querySelector('.hero-glow-left');
  const gr = document.querySelector('.hero-glow-right');
  if (gl) gl.style.transform = `translateY(${y * 0.15}px)`;
  if (gr) gr.style.transform = `translateY(${y * 0.08}px)`;
}, { passive: true });
