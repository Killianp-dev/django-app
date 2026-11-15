/**
 * Bertrand Maçonnerie — améliorations propres à la démo.
 * Sans JavaScript, tout reste utilisable : le menu s'ouvre au survol et au focus clavier (CSS).
 */
(() => {
  'use strict';

  // ===== En-tête : état « défilé » (ombre, fond plus opaque) =====
  function initHeaderScroll() {
    const header = document.querySelector('[data-nav-header]');
    if (!header) return;
    let ticking = false;
    const sync = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
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

  function init() {
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
