// anim.js — animations du site principal avec Motion (static/vendor/motion) :
// entrée du hero en séquence, apparitions au défilement, ressorts doux,
// et icônes qui se dessinent.
//
// La classe « anim » est posée sur <html> dans le <head> (base.html) seulement si
// le visiteur n'a pas demandé moins d'animations. Elle cache l'entrée du hero en
// attendant ce script ; s'il manque (Motion absent, erreur), on la retire et
// les animations CSS d'origine reprennent la main.

(() => {
  const root = document.documentElement;
  const M = window.Motion;

  if (!root.classList.contains('anim')) return;
  if (!M) {
    root.classList.remove('anim');
    return;
  }
  window.__animStarted = true;

  const { animate, inView } = M;

  // Ressorts amortis : de la souplesse, pas de rebond appuyé.
  const SPRING = { type: 'spring', visualDuration: 0.6, bounce: 0.14 };
  const SPRING_SNAPPY = { type: 'spring', visualDuration: 0.35, bounce: 0.28 };
  const EASE = [0.22, 1, 0.36, 1];
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // Partagé avec app.js (pastille du menu, inclinaison de l'aperçu).
  window.siteMotion = { animate, SPRING, SPRING_SNAPPY };

  const clear = (el, ...props) => props.forEach((prop) => el.style.removeProperty(prop));

  const inViewport = (el) => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  // ===== Icônes qui se dessinent =====
  // Chaque tracé (path, cercle, rectangle…) part de zéro et se dessine ; l'icône
  // retrouve ensuite son rendu normal.
  function drawIcon(svg, { delay = 0, duration = 0.7 } = {}) {
    if (!svg) return;
    const shapes = svg.querySelectorAll('path, circle, rect, line, polyline, polygon, ellipse');
    shapes.forEach((shape, i) => {
      shape.setAttribute('pathLength', '1');
      shape.style.strokeDasharray = '1 1';
      shape.style.strokeDashoffset = '1';
      animate(shape, { strokeDashoffset: [1, 0] }, { duration, ease: EASE, delay: delay + i * 0.06 })
        .then(() => {
          clear(shape, 'stroke-dasharray', 'stroke-dashoffset');
          shape.removeAttribute('pathLength');
        });
    });
  }

  // ===== Hero : entrée en séquence =====
  // Accroche, titre, sous-titre, puis les pastilles métier une à une, les boutons
  // et les chiffres ; l'aperçu glisse en parallèle.
  function heroEntrance() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const q = (sel) => hero.querySelector(sel);
    const qa = (sel) => Array.from(hero.querySelectorAll(sel));

    const rise = (el, delay, distance = 14) => {
      if (!el) return null;
      return animate(el, { opacity: [0, 1], y: [distance, 0] }, {
        y: { ...SPRING, delay },
        opacity: { duration: 0.5, ease: EASE, delay }
      });
    };

    const steps = [];
    steps.push(rise(q('.hero__eyebrow'), 0.05, 10));

    // Le titre (probable élément LCP) n'est jamais entièrement transparent.
    const title = q('.hero__title');
    if (title) {
      steps.push(animate(title, { opacity: [0.01, 1], y: [18, 0], filter: ['blur(6px)', 'blur(0px)'] }, {
        y: { ...SPRING, delay: 0.1 },
        opacity: { duration: 0.45, ease: EASE, delay: 0.1 },
        filter: { duration: 0.55, ease: EASE, delay: 0.1 }
      }));
    }

    steps.push(rise(q('.hero__subtitle'), 0.22));

    // Pastilles « Votre métier » : le libellé, puis chaque pastille en cascade, icône dessinée.
    const trades = q('.hero__trades');
    if (trades) {
      trades.style.opacity = '1';
      steps.push(rise(q('.hero__trades-label'), 0.3, 8));
      const items = qa('.hero__trades-list > li');
      items.forEach((li, i) => {
        const delay = 0.34 + i * 0.05;
        steps.push(animate(li, { opacity: [0, 1], y: [10, 0], scale: [0.94, 1] }, {
          y: { ...SPRING_SNAPPY, delay },
          scale: { ...SPRING_SNAPPY, delay },
          opacity: { duration: 0.35, ease: EASE, delay }
        }));
        drawIcon(li.querySelector('.hero__trade-icon'), { delay: delay + 0.08, duration: 0.6 });
      });
    }

    const actionsDelay = 0.34 + qa('.hero__trades-list > li').length * 0.05 + 0.05;
    steps.push(rise(q('.hero__actions'), actionsDelay));

    // Chiffres : chaque repère arrive, puis son nombre défile.
    const facts = q('.hero__facts');
    if (facts) {
      const factsDelay = actionsDelay + 0.1;
      steps.push(animate(facts, { opacity: [0, 1] }, { duration: 0.4, ease: EASE, delay: factsDelay }));
      qa('.hero__facts li').forEach((li, i) => {
        const delay = factsDelay + i * 0.08;
        steps.push(animate(li, { opacity: [0, 1], y: [12, 0] }, {
          y: { ...SPRING, delay },
          opacity: { duration: 0.45, ease: EASE, delay }
        }));
      });
    }

    // Aperçu des démos : glisse et se pose avec un léger ressort.
    const preview = q('.hero__preview');
    if (preview) {
      // Sans fondu d'opacité : la capture doit être peinte dès le chargement (LCP).
      steps.push(animate(preview, { y: [28, 0], scale: [0.97, 1] }, {
        y: { ...SPRING, visualDuration: 0.8, delay: 0.2 },
        scale: { ...SPRING, visualDuration: 0.8, delay: 0.2 }
      }));
    }

    // Une fois tout en place, on rend la main au CSS (survols, transitions).
    Promise.all(steps.filter(Boolean).map((step) => step.finished || step)).then(() => {
      hero.classList.add('is-entered');
      hero.querySelectorAll('[style]').forEach((el) => {
        if (el.closest('[data-hero-window]')) return; // l'inclinaison de la fenêtre est gérée par app.js
        clear(el, 'opacity', 'transform', 'filter');
      });
    });
  }

  // ===== Apparition des blocs au défilement =====
  // Seulement les démos et les trois étapes du déroulement (une suite qui se lit dans
  // l'ordre) : le reste de la page ne s'anime pas. Ceux déjà à l'écran au chargement
  // ne sont jamais cachés. Ils arrivent par trois en cascade, avec un ressort doux.
  function scrollReveals() {
    const blocks = Array.from(document.querySelectorAll(
      '.project, .offer-step'
    )).filter((el) => !inViewport(el));
    if (!blocks.length) return;

    // Déplacement par la propriété « translate » (via --m-y) et non « transform » :
    // les transitions CSS de survol de ces blocs ne viennent pas freiner le ressort.
    blocks.forEach((el) => {
      el.classList.add('m-reveal');
      el.style.opacity = '0';
      el.style.setProperty('--m-y', '28px');
    });

    inView(blocks, (el) => {
      const index = Array.prototype.indexOf.call(el.parentElement.children, el);
      const delay = (index % 3) * 0.09;
      animate(el, { opacity: [0, 1], '--m-y': ['28px', '0px'] }, {
        '--m-y': { ...SPRING, visualDuration: 0.7, delay },
        opacity: { duration: 0.6, ease: EASE, delay }
      }).then(() => {
        clear(el, 'opacity', '--m-y');
        el.classList.remove('m-reveal');
      });
      // Les flèches « Voir la démo » se dessinent à l'arrivée du projet.
      el.querySelectorAll('.project__link-icon').forEach((svg) => drawIcon(svg, { delay: delay + 0.35, duration: 0.5 }));
    }, { margin: '0px 0px -10% 0px' });
  }

  // ===== À propos : icônes des vignettes =====
  // Les vignettes gardent leur cascade CSS (app.js, initStackChips) ; leurs icônes se dessinent en même temps.
  function stackIcons() {
    const stack = document.querySelector('[data-stack]');
    if (!stack || inViewport(stack)) return;
    inView(stack, () => {
      stack.querySelectorAll('.about__chip').forEach((chip, i) => {
        drawIcon(chip.querySelector('.about__chip-badge svg'), { delay: 0.3 + i * 0.07, duration: 0.6 });
      });
    }, { margin: '0px 0px -8% 0px' });
  }

  // ===== Ressort au clic =====
  // Léger enfoncement au clic, par la propriété « scale » (variable --m-s) : elle
  // s'ajoute aux « transform » des survols CSS sans les remplacer. La classe ne reste
  // posée que pendant le mouvement (scale crée un contexte d'empilement).
  const current = (el, prop, fallback) => el.style.getPropertyValue(prop).trim() || fallback;

  function springPress(el) {
    let pressed = false;
    const release = () => {
      if (!pressed) return;
      pressed = false;
      animate(el, { '--m-s': [current(el, '--m-s', '0.96'), '1'] }, SPRING_SNAPPY).then(() => {
        if (pressed) return;
        clear(el, '--m-s');
        el.classList.remove('m-press');
      });
    };
    el.addEventListener('pointerdown', () => {
      pressed = true;
      el.classList.add('m-press');
      animate(el, { '--m-s': [current(el, '--m-s', '1'), '0.96'] }, { duration: 0.12, ease: 'easeOut' });
    });
    el.addEventListener('pointerup', release);
    el.addEventListener('pointerleave', release);
    el.addEventListener('pointercancel', release);
  }

  function initSprings() {
    document.querySelectorAll('.hero__trade, .hero-btn, .navbar-cta, .pricing-plan__cta, .project__link').forEach(springPress);
  }

  heroEntrance();
  scrollReveals();
  stackIcons();
  initSprings();
})();
