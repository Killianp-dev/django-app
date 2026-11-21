/**
 * Aubert & Clerc — améliorations propres à la démo.
 * Tout reste utilisable sans JavaScript : le menu s'ouvre au survol et au focus (CSS),
 * les domaines sont des liens, les honoraires restent affichés TTC.
 */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== En-tête : état « défilé » (fond vélin, ombre) =====
  function initHeaderScroll() {
    const header = document.querySelector('[data-nav-header]');
    if (!header) return;
    let ticking = false;
    const sync = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
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

  // ===== Menu « Expertises » : clic, Échap, clic extérieur =====
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
      if (event.target === nav) toggle.click();
    });
    const observer = new MutationObserver(() => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    observer.observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] });
  }

  // ===== Domaines : la photo suit la ligne survolée ou ciblée au clavier =====
  function initDomaines() {
    document.querySelectorAll('[data-domaines]').forEach((bloc) => {
      const items = Array.from(bloc.querySelectorAll('[data-domaine]'));
      const photos = Array.from(bloc.querySelectorAll('[data-domaine-photo]'));
      const activer = (index) => {
        items.forEach((item) => item.classList.toggle('is-active', item.dataset.domaine === index));
        photos.forEach((photo) => photo.classList.toggle('is-active', photo.dataset.domainePhoto === index));
      };
      items.forEach((item) => {
        item.addEventListener('pointerenter', () => activer(item.dataset.domaine));
        item.addEventListener('focusin', () => activer(item.dataset.domaine));
      });
    });
  }

  // ===== Honoraires : Particulier (TTC) / Entreprise (HT) =====
  function initTaxe() {
    const toggles = Array.from(document.querySelectorAll('[data-taxe-toggle]'));
    const prix = Array.from(document.querySelectorAll('.prix[data-ht]'));
    if (!toggles.length || !prix.length) return;

    const format = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
    let mode = 'ttc';
    try {
      const saved = window.localStorage.getItem('avocat-taxe');
      if (saved === 'ht' || saved === 'ttc') mode = saved;
    } catch (error) { /* stockage indisponible : TTC par défaut */ }

    const live = document.createElement('p');
    live.className = 'vitrine-sr-only';
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);

    const appliquer = (nouveau, annoncer) => {
      mode = nouveau;
      toggles.forEach((group) => {
        group.querySelectorAll('[data-taxe]').forEach((button) => {
          button.setAttribute('aria-pressed', String(button.dataset.taxe === mode));
        });
      });
      prix.forEach((el) => {
        const val = el.querySelector('[data-prix-val]');
        const taxe = el.querySelector('[data-prix-taxe]');
        const texte = format.format(Number(el.dataset[mode])).replace(/\u202f/g, '\u00a0');
        if (val.textContent === texte) return;
        const ecrire = () => {
          val.textContent = texte;
          taxe.textContent = mode.toUpperCase();
          el.classList.remove('is-changing');
        };
        if (reduceMotion || !annoncer) {
          ecrire();
        } else {
          el.classList.add('is-changing');
          window.setTimeout(ecrire, 180);
        }
      });
      if (annoncer) {
        live.textContent = mode === 'ttc'
          ? 'Honoraires affichés toutes taxes comprises, pour un particulier.'
          : 'Honoraires affichés hors taxes, pour une entreprise.';
      }
    };

    toggles.forEach((group) => {
      group.hidden = false;
      group.addEventListener('click', (event) => {
        const button = event.target.closest('[data-taxe]');
        if (!button || button.dataset.taxe === mode) return;
        appliquer(button.dataset.taxe, true);
        try { window.localStorage.setItem('avocat-taxe', mode); } catch (error) { /* rien à faire */ }
      });
    });
    appliquer(mode, false);
  }

  // ===== Apparition au défilement =====
  function initReveal() {
    const elements = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!elements.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    elements.forEach((el) => observer.observe(el));
  }

  function init() {
    initHeaderScroll();
    initMenus();
    initMenuMobile();
    initDomaines();
    initTaxe();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
