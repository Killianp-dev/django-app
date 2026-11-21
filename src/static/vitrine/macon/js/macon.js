/**
 * Bertrand Maçonnerie — améliorations propres à la démo.
 * Sans JavaScript, tout reste utilisable : le menu s'ouvre au survol et au focus clavier (CSS).
 */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== En-tête : état « défilé » (ombre, fond plus opaque) =====
  function initHeaderScroll() {
    const header = document.querySelector('[data-nav-header]');
    if (!header) return;
    let ticking = false;
    const sync = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 48);
      ticking = false;
    };
    sync();
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(sync);
      }
    }, { passive: true });
  }

  // ===== Menu déroulant « Savoir-faire » : clic, Échap, clic extérieur =====
  function initMenus() {
    document.querySelectorAll('[data-menu]').forEach((item) => {
      const button = item.querySelector('[data-menu-toggle]');
      if (!button) return;
      const setOpen = (open) => {
        button.setAttribute('aria-expanded', String(open));
        item.classList.toggle('is-open', open);
      };
      button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && item.classList.contains('is-open')) {
          setOpen(false);
          button.focus();
        }
      });
      document.addEventListener('click', (event) => {
        if (!item.contains(event.target)) setOpen(false);
      });
      item.addEventListener('focusout', (event) => {
        if (!item.contains(event.relatedTarget)) setOpen(false);
      });
    });
  }

  // ===== Menu mobile : fermeture au toucher du voile =====
  function initMenuMobile() {
    const nav = document.getElementById('vitrine-nav-mobile');
    const toggle = document.querySelector('[data-nav-toggle]');
    if (!nav || !toggle) return;
    nav.addEventListener('click', (event) => {
      if (event.target === nav) toggle.click();   // le voile, pas le panneau
    });
  }

  // ===== Hero : les valeurs des cotes défilent pendant que les traits se tracent =====
  // Le CSS trace les cotes et fait apparaître les valeurs (utilities/_mouvement.css) ;
  // avec Motion (vitrine/js/anim.js), « 20 cm » part de zéro au même moment.
  function initCotes() {
    const motion = window.vitrineMotion;
    if (!motion || reduceMotion) return;
    document.querySelectorAll('.cotes__valeur').forEach((texte) => {
      const match = texte.textContent.match(/^(\d+)(.*)$/);
      if (!match) return;
      const cible = Number(match[1]);
      const suite = match[2];
      texte.textContent = `0${suite}`;
      motion.animate(0, cible, {
        delay: 0.85,
        duration: 0.75,
        ease: motion.EASE,
        onUpdate: (valeur) => { texte.textContent = `${Math.round(valeur)}${suite}`; }
      });
    });
  }

  // ===== « Préparer votre demande » : la phrase-résumé suit les deux choix =====
  // Le formulaire marche sans JavaScript (GET vers le contact) ; ici, seulement le résumé.
  function initDemande() {
    document.querySelectorAll('[data-demande]').forEach((bloc) => {
      const sortie = bloc.querySelector('[data-phrase-sortie]');
      if (!sortie) return;
      const ecrire = () => {
        const travaux = bloc.querySelector('input[name="prestation"]:checked');
        const quand = bloc.querySelector('input[name="demande"]:checked');
        if (!travaux || !quand) return;
        const nom = document.createElement('strong');
        nom.textContent = travaux.value;
        sortie.replaceChildren(nom, `, ${quand.dataset.phrase}.`);
      };
      bloc.addEventListener('change', ecrire);
      ecrire();
    });
  }

  // ===== Carnet : le tampon de réception se pose quand on arrive au bas du carnet =====
  // Le CSS le cache tant que les animations sont actives (classe « anim ») ; sans elles, il est déjà là.
  function initTampon() {
    const tampon = document.querySelector('[data-tampon]');
    if (!tampon) return;
    if (!document.documentElement.classList.contains('anim')) {
      tampon.classList.add('is-pose');
      return;
    }
    // Posé quand il est entièrement à l'écran (au-dessus du dernier cinquième) ; posé d'office,
    // sans animation, s'il a déjà été dépassé (défilement rapide). Vérifié au défilement.
    let frame = 0;
    const verifier = () => {
      frame = 0;
      const rect = tampon.getBoundingClientRect();
      const depasse = rect.bottom < 0;
      const vu = rect.top >= 0 && rect.bottom <= window.innerHeight * 0.82;
      if (!vu && !depasse) return;
      window.removeEventListener('scroll', surveiller);
      if (depasse) tampon.classList.add('is-pose', 'is-instantane');
      else window.setTimeout(() => tampon.classList.add('is-pose'), 250);
    };
    const surveiller = () => { if (!frame) frame = window.requestAnimationFrame(verifier); };
    window.addEventListener('scroll', surveiller, { passive: true });
    verifier();
  }

  function init() {
    initCotes();
    initTampon();
    initDemande();
    initHeaderScroll();
    initMenus();
    initMenuMobile();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
