/**
 * Animations Motion des démos (static/vendor/motion) : entrée du hero en séquence,
 * apparitions au défilement en cascade, ressorts au survol et au clic, chiffres qui
 * défilent, icônes qui se dessinent.
 *
 * Chaque démo garde son caractère : la configuration (sélecteurs, ton) est posée dans
 * le <head> par vitrine/partials/anim.html, avec la classe « anim » sur <html> quand le
 * visiteur accepte les animations. Sans ce script, tout reste visible (filet de 2,5 s).
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const config = window.VITRINE_ANIM;
  const M = window.Motion;

  if (!config || !root.classList.contains('anim')) return;
  if (!M) {
    root.classList.remove('anim');
    return;
  }
  window.__vitrineAnim = true;

  const { animate, inView } = M;

  // Trois tons : « sobre » (cabinet d'avocats), « franc » (artisan), « doux » (commerces).
  const TONS = {
    sobre: { spring: { visualDuration: 0.8, bounce: 0.04 }, snappy: { visualDuration: 0.35, bounce: 0.08 }, distance: 14, lift: -3, press: 0.985, pas: 0.1 },
    franc: { spring: { visualDuration: 0.6, bounce: 0.1 }, snappy: { visualDuration: 0.3, bounce: 0.2 }, distance: 18, lift: -4, press: 0.97, pas: 0.08 },
    doux: { spring: { visualDuration: 0.7, bounce: 0.18 }, snappy: { visualDuration: 0.35, bounce: 0.3 }, distance: 22, lift: -6, press: 0.96, pas: 0.09 }
  };
  const ton = TONS[config.ton] || TONS.doux;
  const SPRING = { type: 'spring', ...ton.spring };
  const SNAPPY = { type: 'spring', ...ton.snappy };
  const EASE = [0.22, 1, 0.36, 1];
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  window.vitrineMotion = { animate, SPRING, SNAPPY, EASE };

  const all = (selectors) => (selectors || []).flatMap((sel) => Array.from(document.querySelectorAll(sel)));
  const clear = (el, ...props) => props.forEach((prop) => el.style.removeProperty(prop));
  const inViewport = (el) => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };
  const traceSelector = (config.trace || []).join(', ');

  // ===== Icônes qui se dessinent =====
  function drawIcon(svg, delay = 0, duration = 0.6) {
    svg.querySelectorAll('path, circle, rect, line, polyline, polygon, ellipse').forEach((shape, i) => {
      if (shape.hasAttribute('pathLength')) return; // tracé déjà animé par le CSS de la démo
      shape.setAttribute('pathLength', '1');
      shape.style.strokeDasharray = '1 1';
      shape.style.strokeDashoffset = '1';
      animate(shape, { strokeDashoffset: [1, 0] }, { duration, ease: EASE, delay: delay + i * 0.06 }).then(() => {
        clear(shape, 'stroke-dasharray', 'stroke-dashoffset');
        shape.removeAttribute('pathLength');
      });
    });
  }

  function drawInside(el, delay) {
    if (!traceSelector) return;
    const svgs = el.matches(traceSelector) ? [el] : Array.from(el.querySelectorAll(traceSelector));
    svgs.forEach((svg) => drawIcon(svg, delay));
  }

  // ===== Arrivée d'un élément : opacité + glissement (translate) + léger zoom =====
  // « translate » / « scale » passent par des variables (classe m-reveal) : les
  // transitions CSS de « transform » des démos ne freinent pas le ressort.
  function arrive(el, delay, { distance = ton.distance, scale = 1 } = {}) {
    el.classList.add('m-reveal');
    const title = el.matches('h1');
    const keyframes = {
      opacity: [title ? 0.01 : 0, 1],
      '--m-y': [`${distance}px`, '0px']
    };
    const options = {
      '--m-y': { ...SPRING, delay },
      opacity: { duration: 0.55, ease: EASE, delay }
    };
    if (scale !== 1) {
      keyframes['--m-s'] = [String(scale), '1'];
      options['--m-s'] = { ...SPRING, delay };
    }
    if (title) {
      keyframes.filter = ['blur(5px)', 'blur(0px)'];
      options.filter = { duration: 0.6, ease: EASE, delay };
    }
    drawInside(el, delay + 0.15);
    return animate(el, keyframes, options).then(() => {
      // Arrivé : la règle qui cache l'entrée du hero en attendant le script ne le vise plus
      // (sinon il redeviendrait invisible jusqu'à la fin de toute la séquence).
      el.classList.add('m-vu');
      clear(el, 'opacity', 'filter', '--m-y', '--m-s');
      el.classList.remove('m-reveal');
    });
  }

  // ===== Hero : entrée en séquence =====
  // Chaque sélecteur de config.entree est une étape ; les éléments d'une même étape
  // arrivent en cascade (les engagements un par un, par exemple).
  function heroEntrance() {
    const steps = [];
    let delay = 0.08;
    (config.entree || []).forEach((sel) => {
      const els = Array.from(document.querySelectorAll(sel));
      if (!els.length) return;
      els.forEach((el, i) => {
        const media = el.matches(config.entreeMedia || '_');
        steps.push(arrive(el, delay + i * 0.05, media ? { distance: ton.distance * 1.4, scale: 0.97 } : {}));
      });
      delay += ton.pas + (els.length - 1) * 0.04;
    });
    // La photo du hero se pose : léger dézoom, sans jamais la masquer (élément LCP).
    all(config.media).forEach((img) => {
      img.classList.add('m-press');
      steps.push(animate(img, { '--m-s': ['1.06', '1'] }, { duration: 1.8, ease: EASE }).then(() => {
        clear(img, '--m-s');
        img.classList.remove('m-press');
      }));
    });
    Promise.all(steps).then(() => root.classList.add('anim-fini'));
  }

  // ===== Apparitions au défilement =====
  // Blocs de config.reveal : ceux déjà à l'écran au chargement ne sont pas cachés,
  // sauf les [data-reveal] (cachés d'avance par le CSS de la démo, repris ici).
  function scrollReveals() {
    const hero = new Set(all(config.entree));
    const blocks = Array.from(new Set(all(config.reveal))).filter((el) => {
      if (hero.has(el)) return false;
      if (el.hasAttribute('data-reveal')) {
        el.removeAttribute('data-reveal'); // la démo ne s'en occupe plus
        return true;
      }
      return !inViewport(el);
    });
    if (!blocks.length) return;

    const set = new Set(blocks);
    blocks.forEach((el) => {
      el.classList.add('m-reveal');
      el.style.opacity = '0';
      el.style.setProperty('--m-y', `${ton.distance}px`);
    });

    inView(blocks, (el) => {
      const siblings = Array.from(el.parentElement.children).filter((child) => set.has(child));
      const delay = (Math.max(siblings.indexOf(el), 0) % 4) * 0.08;
      arrive(el, delay);
    }, { margin: '0px 0px -8% 0px' });
  }

  // ===== Icônes isolées (hors blocs animés) =====
  function standaloneIcons() {
    if (!traceSelector) return;
    const animated = new Set([...all(config.entree), ...all(config.reveal)]);
    Array.from(document.querySelectorAll(traceSelector))
      .filter((svg) => !inViewport(svg) && ![...animated].some((el) => el.contains(svg)))
      .forEach((svg) => {
        svg.querySelectorAll('path, circle, rect, line, polyline, polygon, ellipse').forEach((shape) => {
          if (shape.hasAttribute('pathLength')) return;
          shape.style.strokeDasharray = '1 1';
          shape.style.strokeDashoffset = '1';
          shape.setAttribute('pathLength', '1');
        });
        inView(svg, () => drawIcon(svg, 0.1));
      });
  }

  // ===== Chiffres qui défilent =====
  // « 16 h », « 100 % », « 2009 » : seul le nombre défile, le reste ne bouge pas.
  // Une année part de quelques années plus tôt plutôt que de zéro.
  function countUp(el, delay = 0) {
    const match = el.textContent.match(/^(\D*?)(\d+)([\s\S]*)$/);
    if (!match) return;
    const [, before, digits, after] = match;
    const target = parseInt(digits, 10);
    if (target < 2) return;
    const year = target >= 1900 && target <= 2100;
    const from = year ? target - 15 : 0;
    el.style.fontVariantNumeric = 'tabular-nums';
    el.textContent = `${before}${from}${after}`;
    animate(from, target, {
      duration: year ? 1.1 : 1,
      delay,
      ease: EASE,
      onUpdate: (value) => { el.textContent = `${before}${Math.round(value)}${after}`; }
    }).then(() => {
      el.textContent = `${before}${target}${after}`;
      clear(el, 'font-variant-numeric');
    });
  }

  function counters() {
    all(config.count).forEach((el, i) => {
      if (inViewport(el)) countUp(el, 0.4 + i * 0.08);
      else inView(el, () => countUp(el, 0.25 + (i % 4) * 0.08), { margin: '0px 0px -8% 0px' });
    });
  }

  // ===== Ressorts au survol et au clic =====
  const current = (el, prop, fallback) => el.style.getPropertyValue(prop).trim() || fallback;

  function springHover(el) {
    if (!finePointer) return;
    el.classList.add('has-lift');
    let inside = false;
    const to = (value) => {
      el.classList.add('m-lift');
      return animate(el, { '--m-lift': [current(el, '--m-lift', '0px'), value] }, SPRING);
    };
    el.addEventListener('pointerenter', () => { inside = true; to(`${ton.lift}px`); });
    el.addEventListener('pointerleave', () => {
      inside = false;
      to('0px').then(() => {
        if (inside) return;
        clear(el, '--m-lift');
        el.classList.remove('m-lift');
      });
    });
  }

  function springPress(el) {
    let pressed = false;
    const release = () => {
      if (!pressed) return;
      pressed = false;
      animate(el, { '--m-s': [current(el, '--m-s', String(ton.press)), '1'] }, SNAPPY).then(() => {
        if (pressed) return;
        clear(el, '--m-s');
        el.classList.remove('m-press');
      });
    };
    el.addEventListener('pointerdown', () => {
      pressed = true;
      el.classList.add('m-press');
      animate(el, { '--m-s': [current(el, '--m-s', '1'), String(ton.press)] }, { duration: 0.12, ease: 'easeOut' });
    });
    el.addEventListener('pointerup', release);
    el.addEventListener('pointerleave', release);
    el.addEventListener('pointercancel', release);
  }

  heroEntrance();
  scrollReveals();
  standaloneIcons();
  counters();
  all(config.lift).forEach(springHover);
  all(config.press).forEach(springPress);
})();
