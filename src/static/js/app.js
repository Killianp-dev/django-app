// app.js — site principal (les démos ont chacune leur propre script)

(() => {
  // Constants
  const MOBILE_BREAKPOINT = 768;

  // DOM Elements - cached selectors
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-links a');
  const navbar = document.querySelector('.navbar');

  // Aperçu du hero, piloté aussi par les pastilles « Votre métier »
  let heroPreview = null;

  // Utils
  const utils = {
    // Limite la fréquence d'exécution (redimensionnement…)
    debounce: (func, delay) => {
      let timer;
      return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
      };
    }
  };

  // ===== Lien actif du menu (page d'accueil) =====
  // Le défilement vers les ancres est laissé au navigateur (scroll-behavior et
  // scroll-margin-top en CSS) : l'URL suit, Retour fonctionne, « réduire les
  // animations » est respecté. Ici, on ne fait que surligner la section lue.
  function initActiveNavigation() {
    if (!navLinks.length || !('IntersectionObserver' in window)) return;

    const targets = [];
    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const section = href.startsWith('#') && href.length > 1 ? document.querySelector(href) : null;
      if (section) targets.push({ link, section });
    });
    if (!targets.length) return;

    // Le formulaire de contact n'a pas d'entrée dans le menu : arrivé là, plus rien n'est surligné.
    const contact = document.getElementById('contact-form');
    if (contact) targets.push({ link: null, section: contact });

    const visible = new Set();
    const observer = new IntersectionObserver((records) => {
      records.forEach((record) => {
        if (record.isIntersecting) visible.add(record.target);
        else visible.delete(record.target);
      });
      const current = targets.find((target) => visible.has(target.section));
      if (!current) return;
      navLinks.forEach((link) => link.classList.toggle('active', link === current.link));
      moveNavThumb();
    }, { rootMargin: '-30% 0px -60% 0px' });

    targets.forEach((target) => observer.observe(target.section));
  }

  // ===== Menu : pastille glissante sous le lien actif (ordinateur) =====
  const navList = document.querySelector('.nav-links');

  function moveNavThumb(instant = false) {
    if (!navList || !navList.classList.contains('has-thumb')) return;
    const active = navList.querySelector('a.active');
    navList.classList.toggle('is-instant', instant);
    if (!active || isMobileNav()) {
      navList.style.setProperty('--thumb-o', '0');
      return;
    }
    navList.style.setProperty('--thumb-x', `${active.offsetLeft}px`);
    navList.style.setProperty('--thumb-w', `${active.offsetWidth}px`);
    navList.style.setProperty('--thumb-o', '1');
  }

  function initNavThumb() {
    if (!navList) return;
    navList.classList.add('has-thumb');
    moveNavThumb(true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveNavThumb(true));
    window.addEventListener('resize', utils.debounce(() => moveNavThumb(true), 120));
  }

  // ===== Mobile Menu =====
  const mobileNavQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  let lastFocusedBeforeNav = null;

  function isMobileNav() {
    return mobileNavQuery.matches;
  }

  function isNavOpen() {
    return Boolean(navMenu?.classList.contains('is-open'));
  }

  function getNavFocusable() {
    return navMenu ? Array.from(navMenu.querySelectorAll('a[href]')) : [];
  }

  function syncNavOrigin() {
    if (!hamburger || !navMenu) return;
    const rect = hamburger.getBoundingClientRect();
    navMenu.style.setProperty('--nav-origin-x', `${(rect.left + rect.width / 2).toFixed(1)}px`);
    navMenu.style.setProperty('--nav-origin-y', `${(rect.top + rect.height / 2).toFixed(1)}px`);
  }

  function preventBackgroundScroll(event) {
    if (!isNavOpen()) return;
    event.preventDefault();
  }

  function setScrollLock(locked) {
    const method = locked ? 'addEventListener' : 'removeEventListener';
    window[method]('wheel', preventBackgroundScroll, { passive: false });
    window[method]('touchmove', preventBackgroundScroll, { passive: false });
  }

  function placeNav() {
    const bar = document.querySelector('.navbar');
    if (!bar || !navMenu) return;
    navMenu.style.top = `${bar.getBoundingClientRect().bottom}px`;
  }

  function setMobileMenuState(isOpen) {
    if (!hamburger || !navMenu) return;

    const shouldOpen = Boolean(isOpen) && isMobileNav();
    if (shouldOpen) placeNav();

    hamburger.classList.toggle('is-open', shouldOpen);
    navMenu.classList.toggle('is-open', shouldOpen);
    document.documentElement.classList.toggle('nav-open', shouldOpen);
    setScrollLock(shouldOpen);
    hamburger.setAttribute('aria-expanded', String(shouldOpen));
    hamburger.setAttribute('aria-label', shouldOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    navMenu.setAttribute('aria-hidden', isMobileNav() ? String(!shouldOpen) : 'false');

    if (shouldOpen) {
      lastFocusedBeforeNav = document.activeElement;
      const firstLink = getNavFocusable()[0];
      window.requestAnimationFrame(() => firstLink?.focus());
    } else if (lastFocusedBeforeNav && typeof lastFocusedBeforeNav.focus === 'function') {
      lastFocusedBeforeNav.focus();
      lastFocusedBeforeNav = null;
    }
  }

  function closeMobileMenu() {
    if (isNavOpen()) {
      setMobileMenuState(false);
    }
  }

  function initMobileMenu() {
    if (!hamburger || !navMenu) return;

    hamburger.setAttribute('aria-controls', 'site-nav');
    navMenu.setAttribute('aria-hidden', isMobileNav() ? 'true' : 'false');

    hamburger.addEventListener('click', (event) => {
      event.stopPropagation();
      setMobileMenuState(!isNavOpen());
    });

    // Ferme le menu sur tout lien suivi, ou sur un clic hors du panneau.
    navMenu.addEventListener('click', (event) => {
      if (event.target.closest('a[href]') || !event.target.closest('.nav-menu__panel')) {
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (!isNavOpen()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileMenu();
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
        event.preventDefault();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getNavFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || current === hamburger)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener('resize', utils.debounce(() => {
      if (isNavOpen()) placeNav();
    }, 120));

    window.addEventListener('scroll', () => {
      if (isNavOpen()) placeNav();
    }, { passive: true });

    const onViewportChange = () => {
      if (!isMobileNav()) {
        setMobileMenuState(false);
        navMenu.setAttribute('aria-hidden', 'false');
      } else if (!isNavOpen()) {
        navMenu.setAttribute('aria-hidden', 'true');
      } else {
        syncNavOrigin();
      }
    };

    if (typeof mobileNavQuery.addEventListener === 'function') {
      mobileNavQuery.addEventListener('change', onViewportChange);
    } else {
      mobileNavQuery.addListener(onViewportChange);
    }
  }

  // ===== Apparition des blocs au défilement =====
  // Une seule fois par bloc, en CSS (.reveal / .is-visible). Les blocs déjà à
  // l'écran au chargement ne sont jamais cachés. Une fois l'apparition finie,
  // la classe est retirée pour rendre la main aux transitions de survol.
  function initScrollReveal() {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    const blocks = document.querySelectorAll(
      '.projects__header, .project, .offer-step, .pricing-card, .pricing-plan, .about__panel, .about__aside'
    );
    if (!blocks.length) return;

    const settle = (el) => {
      el.classList.remove('reveal', 'is-visible');
      el.style.removeProperty('--reveal-delay');
    };

    const observer = new IntersectionObserver((records) => {
      records.forEach((record) => {
        if (!record.isIntersecting) return;
        const el = record.target;
        observer.unobserve(el);
        el.classList.add('is-visible');
        const onEnd = (event) => {
          if (event.target !== el) return;
          el.removeEventListener('transitionend', onEnd);
          settle(el);
        };
        el.addEventListener('transitionend', onEnd);
        window.setTimeout(() => settle(el), 1600);
      });
    }, { rootMargin: '0px 0px -10% 0px' });

    blocks.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) return;
      const index = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty('--reveal-delay', `${(index % 3) * 0.1}s`);
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  // ===== Barre de navigation : état « défilé » =====
  function initNavbarState() {
    if (!navbar) return;
    const sync = () => navbar.classList.toggle('scrolled', window.scrollY > 24);
    sync();
    window.addEventListener('scroll', sync, { passive: true });
  }

  // ===== Widgets "Copier" collés dans le HTML des articles =====
  function initArticleCopyBlocks() {
    const buttons = document.querySelectorAll('.article-body button[onclick*="clipboard"]');
    if (!buttons.length) return;

    const iconCopy = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
    const iconCheck = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

    const setButtonLabel = (button, copied) => {
      button.classList.toggle('is-copied', copied);
      button.innerHTML = copied
        ? iconCheck + '<span>Copié</span>'
        : iconCopy + '<span>Copier</span>';
      button.setAttribute('aria-label', copied ? 'Copié dans le presse-papiers' : 'Copier');
      button.title = copied ? 'Copié' : 'Copier';
    };

    buttons.forEach((button) => {
      const wrap = button.parentElement;
      const source = wrap && wrap.querySelector('pre, code');
      if (wrap) {
        wrap.classList.add('article-copy-block');
        wrap.removeAttribute('style');

        if (!wrap.querySelector('.article-copy-block__bar')) {
          const bar = document.createElement('div');
          bar.className = 'article-copy-block__bar';
          bar.innerHTML = '<span class="article-copy-block__dots" aria-hidden="true"><span></span><span></span><span></span></span>';
          wrap.insertBefore(bar, wrap.firstChild);
          bar.appendChild(button);
        }
      }

      button.classList.add('article-copy-block__btn');
      button.type = 'button';
      button.removeAttribute('onclick');
      button.removeAttribute('style');
      setButtonLabel(button, false);

      button.addEventListener('click', async () => {
        const text = source ? source.innerText : '';
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
          } else {
            const input = document.createElement('textarea');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            input.remove();
          }
          setButtonLabel(button, true);
          window.setTimeout(() => setButtonLabel(button, false), 2000);
        } catch (error) {
          setButtonLabel(button, false);
        }
      });
    });
  }

  // ===== Copier le lien d'un article =====
  function initCopyLink() {
    const buttons = document.querySelectorAll('[data-copy-link]');
    if (!buttons.length) return;

    buttons.forEach((button) => {
      const label = button.querySelector('span');
      const original = label ? label.textContent : '';

      button.addEventListener('click', async () => {
        const url = window.location.href;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
          } else {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            input.remove();
          }
          button.classList.add('is-copied');
          if (label) label.textContent = 'Lien copié';
          window.setTimeout(() => {
            button.classList.remove('is-copied');
            if (label) label.textContent = original;
          }, 2000);
        } catch (error) {
          button.classList.remove('is-copied');
        }
      });
    });
  }

  // ===== Effets lumineux =====
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function hasFinePointer() {
    return window.matchMedia('(pointer: fine)').matches;
  }

  function initSurfaceGlow() {
    if (prefersReducedMotion() || !hasFinePointer()) return;

    const surfaces = document.querySelectorAll(
      '.blog-card, .blog-featured, #contact-form, .form-article, .mentions-legales'
    );

    surfaces.forEach((surface) => {
      surface.classList.add('has-surface-glow');
      surface.addEventListener('pointermove', (event) => {
        const rect = surface.getBoundingClientRect();
        surface.style.setProperty('--glow-x', `${event.clientX - rect.left}px`);
        surface.style.setProperty('--glow-y', `${event.clientY - rect.top}px`);
      }, { passive: true });
    });
  }

  // ===== Bandeau cookies =====
  // Google Analytics n'est chargé qu'après « Accepter » (voir window.loadAnalytics
  // dans base.html) ; « Refuser » ne charge rien. Le choix est mémorisé.
  function initCookieModal() {
    const cookieModal = document.getElementById('cookieModal');
    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');
    if (!cookieModal || !acceptBtn || !declineBtn) return;

    const remember = (choice) => {
      try {
        localStorage.setItem('cookie-consent', choice);
      } catch (e) {}
    };

    let choice = null;
    try {
      choice = localStorage.getItem('cookie-consent');
    } catch (e) {}

    if (choice === null) {
      window.setTimeout(() => cookieModal.classList.add('show'), 600);
    }

    acceptBtn.addEventListener('click', () => {
      remember('accepted');
      if (typeof window.loadAnalytics === 'function') window.loadAnalytics();
      cookieModal.classList.remove('show');
    });

    declineBtn.addEventListener('click', () => {
      remember('declined');
      cookieModal.classList.remove('show');
    });
  }

  // ===== Reading progress (articles) =====
  function initReadingProgress() {
    const progress = document.querySelector('.reading-progress');
    const body = document.querySelector('.article-body');
    if (!progress || !body) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      if (navbar) progress.style.top = `${navbar.getBoundingClientRect().bottom}px`;
      const rect = body.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const ratio = total > 0 ? (window.innerHeight * 0.4 - rect.top) / total : 1;
      progress.style.setProperty('--reading-progress', Math.min(1, Math.max(0, ratio)).toFixed(4));
    };
    const request = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
  }

  // ===== Theme toggle =====
  // Par défaut le thème suit le système ; un clic sur le bouton impose un choix, mémorisé.
  function initThemeToggle() {
    const button = document.querySelector('.theme-toggle');
    const root = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function currentTheme() {
      return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function storedTheme() {
      try {
        const theme = localStorage.getItem('theme');
        return theme === 'light' || theme === 'dark' ? theme : null;
      } catch (e) {
        return null;
      }
    }

    function syncButton(theme) {
      if (!button) return;
      const isDark = theme === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', isDark ? 'Activer le thème clair' : 'Activer le thème sombre');
      if (metaTheme) {
        metaTheme.setAttribute('content', isDark ? '#131315' : '#1c1a1b');
      }
    }

    function setTheme(theme) {
      root.setAttribute('data-theme', theme);
      syncButton(theme);
    }

    syncButton(currentTheme());

    // Tant qu'aucun choix n'est enregistré, suivre les changements du système en direct.
    if (systemDark) {
      const onSystemChange = (event) => {
        if (!storedTheme()) setTheme(event.matches ? 'dark' : 'light');
      };
      if (systemDark.addEventListener) systemDark.addEventListener('change', onSystemChange);
      else if (systemDark.addListener) systemDark.addListener(onSystemChange);
    }

    if (!button) return;

    button.addEventListener('click', () => {
      const theme = currentTheme() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {}
      setTheme(theme);
    });
  }

  // ===== Hero : aperçu des démos =====
  // Les captures défilent en fondu ; l'adresse, le métier et le lien suivent.
  // Pause au survol, au focus et quand l'onglet est caché ; pas de défilement
  // automatique si l'utilisateur demande moins d'animations.
  function initHeroPreview() {
    const preview = document.querySelector('[data-hero-preview]');
    if (!preview) return;

    const shots = Array.from(preview.querySelectorAll('.hero__shot'));
    const dots = Array.from(preview.querySelectorAll('[data-preview-index]'));
    const url = preview.querySelector('[data-preview-url]');
    const label = preview.querySelector('[data-preview-label]');
    const link = preview.querySelector('[data-preview-link]');
    if (shots.length < 2) return;

    const DELAY = 4500;
    let current = 0;
    let timer = null;
    let hovered = false;
    let pinned = false;

    function show(index) {
      current = (index + shots.length) % shots.length;
      const shot = shots[current];
      shots.forEach((el, i) => el.classList.toggle('is-active', i === current));
      dots.forEach((el, i) => {
        el.classList.toggle('is-active', i === current);
        if (i === current) el.setAttribute('aria-current', 'true');
        else el.removeAttribute('aria-current');
      });
      if (url) url.textContent = shot.dataset.url;
      if (label) label.textContent = shot.dataset.label;
      if (link) {
        link.href = shot.dataset.url;
        link.setAttribute('aria-label', 'Ouvrir la démo : ' + shot.dataset.label);
      }
      preview.dispatchEvent(new CustomEvent('herodemo', { detail: { index: current } }));
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      if (pinned || prefersReducedMotion() || hovered || document.hidden) return;
      timer = window.setInterval(() => show(current + 1), DELAY);
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        show(Number(dot.dataset.previewIndex));
        start();
      });
    });

    preview.addEventListener('mouseenter', () => { hovered = true; stop(); });
    preview.addEventListener('mouseleave', () => { hovered = false; start(); });
    preview.addEventListener('focusin', () => { hovered = true; stop(); });
    preview.addEventListener('focusout', (event) => {
      if (!preview.contains(event.relatedTarget)) { hovered = false; start(); }
    });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    heroPreview = {
      element: preview,
      // Affiche une démo choisie par le visiteur et arrête le défilement automatique.
      pin(index) {
        pinned = true;
        stop();
        show(index);
      }
    };

    start();
  }

  // ===== Hero : pastilles « Votre métier » =====
  // Sans JS, ce sont des liens vers les démos. Avec le JS, un clic affiche la démo
  // dans l'aperçu, adapte le bouton principal et retient le métier pour le formulaire.
  function initTradePicker() {
    const picker = document.querySelector('[data-trade-picker]');
    const cta = document.querySelector('[data-trade-cta-target]');
    if (!picker || !cta) return;

    const chips = Array.from(picker.querySelectorAll('.hero__trade'));
    let engaged = false;

    function select(chip) {
      chips.forEach((el) => {
        const on = el === chip;
        el.classList.toggle('is-selected', on);
        if (on) el.setAttribute('aria-current', 'true');
        else el.removeAttribute('aria-current');
      });
      cta.textContent = chip.dataset.tradeCta;
      cta.setAttribute('href', chip.getAttribute('href'));
      try {
        if (chip.dataset.trade === 'autre') sessionStorage.removeItem('contact-trade');
        else sessionStorage.setItem('contact-trade', chip.dataset.trade);
      } catch (e) {}
    }

    chips.forEach((chip) => {
      chip.addEventListener('click', (event) => {
        const index = chip.dataset.tradeIndex;
        engaged = true;
        select(chip);
        if (index === undefined) return; // « Autre » : on suit le lien vers le formulaire
        event.preventDefault();
        if (heroPreview) heroPreview.pin(Number(index));
      });
    });

    // Si le visiteur change de démo avec les points de l'aperçu, la pastille suit.
    if (heroPreview) {
      heroPreview.element.addEventListener('herodemo', (event) => {
        if (!engaged) return;
        const chip = chips.find((el) => Number(el.dataset.tradeIndex) === event.detail.index);
        if (chip) select(chip);
      });
    }
  }

  // ===== Formulaire de contact =====
  // Sujet pré-rempli, vérification avant envoi (mêmes règles que le serveur),
  // bouton bloqué pendant l'envoi, brouillon gardé sur l'appareil.
  function initContactForm() {
    const form = document.querySelector('#contact-form form');
    if (!form) return;

    const fields = {
      name: form.querySelector('[name="name"]'),
      email: form.querySelector('[name="email"]'),
      subject: form.querySelector('[name="subject"]'),
      message: form.querySelector('[name="message"]')
    };
    const button = form.querySelector('button[type="submit"]');
    if (!fields.name || !fields.email || !fields.message || !button) return;

    const DRAFT_KEY = 'contact-draft';
    const storage = {
      get(key, area = localStorage) { try { return area.getItem(key); } catch (e) { return null; } },
      set(key, value, area = localStorage) { try { area.setItem(key, value); } catch (e) {} },
      remove(key, area = localStorage) { try { area.removeItem(key); } catch (e) {} }
    };

    // --- Sujet pré-rempli (lien « Demander un devis », métier choisi, ?sujet=) ---
    let autoSubject = '';
    function prefillSubject(base) {
      if (!fields.subject) return;
      if (fields.subject.value && fields.subject.value !== autoSubject) return; // saisi à la main
      const trade = storage.get('contact-trade', sessionStorage);
      const parts = [base || 'Site vitrine', trade].filter(Boolean);
      autoSubject = parts.length > 1 || base ? parts.join(' — ') : '';
      if (autoSubject) fields.subject.value = autoSubject;
    }

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href$="#form"]');
      if (!link) return;
      const trade = storage.get('contact-trade', sessionStorage);
      if (link.dataset.contactSubject || trade) prefillSubject(link.dataset.contactSubject || '');
    });

    const param = new URLSearchParams(window.location.search).get('sujet');
    if (param && fields.subject && !fields.subject.value) {
      fields.subject.value = param.slice(0, 200);
    }

    // --- Brouillon ---
    const hasServerErrors = Boolean(form.querySelector('.errorlist'));
    const draftKeys = ['name', 'email', 'subject', 'message'];
    let note = null;

    function saveDraft() {
      const data = {};
      draftKeys.forEach((key) => { if (fields[key]) data[key] = fields[key].value; });
      if (Object.values(data).some((value) => value.trim())) storage.set(DRAFT_KEY, JSON.stringify(data));
      else storage.remove(DRAFT_KEY);
    }

    function clearDraft() {
      storage.remove(DRAFT_KEY);
      if (note) note.remove();
    }

    if (!hasServerErrors) {
      let draft = null;
      try { draft = JSON.parse(storage.get(DRAFT_KEY) || 'null'); } catch (e) {}
      if (draft && typeof draft === 'object') {
        let restored = false;
        draftKeys.forEach((key) => {
          if (fields[key] && !fields[key].value && typeof draft[key] === 'string' && draft[key]) {
            fields[key].value = draft[key];
            restored = true;
          }
        });
        if (restored) {
          note = document.createElement('p');
          note.className = 'contact-draft';
          note.innerHTML = '<span>Votre brouillon a été retrouvé.</span><button type="button">Effacer</button>';
          note.querySelector('button').addEventListener('click', () => {
            draftKeys.forEach((key) => { if (fields[key]) fields[key].value = ''; });
            autoSubject = '';
            clearDraft();
            fields.name.focus();
          });
          button.before(note);
        }
      }
    }

    let saveTimer = null;
    form.addEventListener('input', () => {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(saveDraft, 400);
    });

    // --- Vérification (mêmes règles que le serveur) ---
    const rules = {
      name: (value) => {
        if (!value.trim()) return 'Indiquez votre nom.';
        if (/\d/.test(value)) return 'Le nom ne doit pas contenir de chiffres.';
        return '';
      },
      email: (value) => {
        if (!value.trim()) return 'Indiquez votre adresse e-mail.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Cette adresse e-mail ne semble pas valide.';
        return '';
      },
      message: (value) => {
        if (value.trim().length < 10) return 'Le message est trop court (au moins 10 caractères).';
        return '';
      }
    };

    function setError(field, message) {
      const id = `${field.id || field.name}-error`;
      let error = form.querySelector(`#${CSS.escape(id)}`);
      const serverList = field.parentElement.querySelector('.errorlist');
      if (serverList) serverList.remove();
      if (!message) {
        if (error) error.remove();
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
        return;
      }
      if (!error) {
        error = document.createElement('p');
        error.className = 'field-error';
        error.id = id;
        field.after(error);
      }
      error.textContent = message;
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', id);
    }

    Object.keys(rules).forEach((key) => {
      fields[key].addEventListener('input', () => {
        if (fields[key].getAttribute('aria-invalid') === 'true') setError(fields[key], rules[key](fields[key].value));
      });
      fields[key].addEventListener('blur', () => {
        if (fields[key].value) setError(fields[key], rules[key](fields[key].value));
      });
    });

    form.addEventListener('submit', (event) => {
      let firstInvalid = null;
      Object.keys(rules).forEach((key) => {
        const message = rules[key](fields[key].value);
        setError(fields[key], message);
        if (message && !firstInvalid) firstInvalid = fields[key];
      });
      if (firstInvalid) {
        event.preventDefault();
        firstInvalid.focus();
        return;
      }
      if (button.getAttribute('aria-busy') === 'true') {
        event.preventDefault(); // double clic : un seul envoi
        return;
      }
      button.dataset.label = button.textContent;
      button.textContent = 'Envoi…';
      button.setAttribute('aria-busy', 'true');
      clearDraft();
    });

    // Retour arrière vers une page gardée en cache : le bouton redevient utilisable.
    window.addEventListener('pageshow', () => {
      if (button.getAttribute('aria-busy') !== 'true') return;
      button.textContent = button.dataset.label || 'Envoyer le message';
      button.removeAttribute('aria-busy');
    });
  }

  // ===== Initialisation =====
  function init() {
    initThemeToggle();
    initMobileMenu();
    initNavbarState();
    initNavThumb();
    initActiveNavigation();
    initScrollReveal();
    initHeroPreview();
    initTradePicker();
    initContactForm();
    initCopyLink();
    initReadingProgress();
    initArticleCopyBlocks();
    initSurfaceGlow();
    initCookieModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
