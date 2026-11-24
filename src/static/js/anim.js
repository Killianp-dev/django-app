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

  // ===== Hero : entrée en séquence =====
  // Le titre, puis le bouton ; l'illustration se pose en parallèle.
  function heroEntrance() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const q = (sel) => hero.querySelector(sel);

    const steps = [];

    // Le titre (élément LCP) n'est jamais entièrement transparent.
    const title = q('.hero__title');
    if (title) {
      steps.push(animate(title, { opacity: [0.01, 1], y: [18, 0], filter: ['blur(6px)', 'blur(0px)'] }, {
        y: { ...SPRING, delay: 0.05 },
        opacity: { duration: 0.45, ease: EASE, delay: 0.05 },
        filter: { duration: 0.55, ease: EASE, delay: 0.05 }
      }));
    }

    const cta = q('.hero__cta');
    if (cta) {
      steps.push(animate(cta, { opacity: [0, 1], y: [14, 0] }, {
        y: { ...SPRING, delay: 0.22 },
        opacity: { duration: 0.5, ease: EASE, delay: 0.22 }
      }));
    }

    const art = q('.hero__art');
    if (art) {
      steps.push(animate(art, { opacity: [0, 1], y: [28, 0], scale: [0.97, 1] }, {
        y: { ...SPRING, visualDuration: 0.9, delay: 0.25 },
        scale: { ...SPRING, visualDuration: 0.9, delay: 0.25 },
        opacity: { duration: 0.6, ease: EASE, delay: 0.25 }
      }));
    }

    // Une fois tout en place, on rend la main au CSS (survols, transitions).
    Promise.all(steps.filter(Boolean).map((step) => step.finished || step)).then(() => {
      hero.classList.add('is-entered');
      hero.querySelectorAll('[style]').forEach((el) => {
        clear(el, 'opacity', 'transform', 'filter');
      });
    });
  }

  // ===== Apparition des blocs au défilement =====
  // Seulement les trois étapes du déroulement (une suite qui se lit dans
  // l'ordre) : le reste de la page ne s'anime pas. Ceux déjà à l'écran au chargement
  // ne sont jamais cachés. Ils arrivent par trois en cascade, avec un ressort doux.
  function scrollReveals() {
    const blocks = Array.from(document.querySelectorAll(
      '.offer-step'
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
    }, { margin: '0px 0px -10% 0px' });
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
    document.querySelectorAll('.hero__trade, .hero-btn, .navbar-cta, .pricing-plan__cta').forEach(springPress);
  }

  heroEntrance();
  scrollReveals();
  initSprings();
})();
