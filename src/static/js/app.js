// app.js — site principal (les démos ont chacune leur propre script)

(() => {
  // Constants
  const MOBILE_BREAKPOINT = 768;

  // DOM Elements - cached selectors
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-links > li > a');
  const navbar = document.querySelector('.navbar');


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

    // Section surlignée : la dernière (dans l'ordre de la page) dont le haut a
    // passé le milieu de l'écran. Les sections sans entrée dans le menu
    // (Déroulement) gardent ainsi la précédente, même après un saut direct.
    // L'observateur ne sert qu'à déclencher le calcul quand une section
    // traverse cette ligne.
    const observer = new IntersectionObserver(() => {
      const line = window.innerHeight / 2;
      let current = null;
      targets.forEach((target) => {
        if (target.section.getBoundingClientRect().top <= line) current = target;
      });
      if (!current) return;
      navLinks.forEach((link) => link.classList.toggle('active', link === current.link));
      moveNavThumb();
    }, { rootMargin: '-50% 0px -49% 0px' });

    targets.forEach((target) => observer.observe(target.section));
  }

  // ===== Menu : pastille glissante sous le lien actif (ordinateur) =====
  const navList = document.querySelector('.nav-links');

  // Avec Motion (js/anim.js), la pastille glisse d'un lien à l'autre en ressort ;
  // sinon, transition CSS. Première apparition et redimensionnement : sans animation.
  let thumbAnimation = null;

  function moveNavThumb(instant = false) {
    if (!navList || !navList.classList.contains('has-thumb')) return;
    const active = navList.querySelector(':scope > li > a.active');
    navList.classList.toggle('is-instant', instant);
    if (thumbAnimation) {
      thumbAnimation.stop();
      thumbAnimation = null;
    }
    if (!active || isMobileNav()) {
      navList.style.setProperty('--thumb-o', '0');
      return;
    }
    // Le filet couvre le mot seul (pas le chevron d'« Exemples »). Position mesurée par
    // rapport à la liste : offsetLeft serait relatif au <li> d'« Exemples » (positionné
    // pour son sous-menu), le filet irait sous « Accueil ».
    const word = active.querySelector('.nav-links__label') || active;
    const box = word.getBoundingClientRect();
    const x = `${box.left - navList.getBoundingClientRect().left - navList.clientLeft}px`;
    const w = `${box.width}px`;
    const motion = window.siteMotion;
    const shown = navList.style.getPropertyValue('--thumb-o') === '1';
    if (motion && !instant && shown) {
      navList.classList.add('is-sprung');
      thumbAnimation = motion.animate(navList, {
        '--thumb-x': [navList.style.getPropertyValue('--thumb-x') || x, x],
        '--thumb-w': [navList.style.getPropertyValue('--thumb-w') || w, w]
      }, { ...motion.SPRING_SNAPPY, visualDuration: 0.45, bounce: 0.22 });
    } else {
      navList.classList.remove('is-sprung');
      navList.style.setProperty('--thumb-x', x);
      navList.style.setProperty('--thumb-w', w);
    }
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
    // Le panneau peut dépasser l'écran (démos dépliées) : on le laisse défiler.
    if (navMenu.contains(event.target) && navMenu.scrollHeight > navMenu.clientHeight) return;
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

  // ===== Menu : démos sous « Exemples » =====
  // Ordinateur : la liste s'ouvre au survol (CSS) et « Exemples » mène à la section.
  // Mobile : pas de survol ; un appui sur « Exemples » déplie la liste (la section
  // reste accessible par « Tous les exemples », en fin de liste).
  function initNavDemos() {
    const item = document.querySelector('[data-nav-demos]');
    const link = item && item.querySelector(':scope > a');
    const list = item && item.querySelector('.nav-demos');
    if (!link || !list) return;

    const setOpen = (open) => {
      item.classList.toggle('is-open', open);
      if (isMobileNav()) link.setAttribute('aria-expanded', String(open));
    };

    // Rôle de bouton sur mobile seulement : sur ordinateur, c'est un lien.
    const syncRole = () => {
      if (isMobileNav()) {
        link.setAttribute('role', 'button');
        link.setAttribute('aria-controls', list.id);
        link.setAttribute('aria-expanded', String(item.classList.contains('is-open')));
      } else {
        ['role', 'aria-controls', 'aria-expanded'].forEach((attr) => link.removeAttribute(attr));
      }
    };
    syncRole();
    mobileNavQuery.addEventListener('change', syncRole);

    link.addEventListener('click', (event) => {
      if (!isMobileNav()) return;
      event.preventDefault();
      event.stopPropagation(); // sinon le menu se ferme, comme sur tout lien suivi
      setOpen(!item.classList.contains('is-open'));
    });

    // Rôle de bouton : Espace l'active aussi.
    link.addEventListener('keydown', (event) => {
      if (event.key !== ' ' || !isMobileNav()) return;
      event.preventDefault();
      setOpen(!item.classList.contains('is-open'));
    });
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

      if (event.key === ' ' && event.target.closest('button, [role="button"]')) return;
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
    if (window.siteMotion) return; // js/anim.js s'en charge, avec ressort
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    const blocks = document.querySelectorAll(
      '.project, .offer-step'
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

    // Le choix est daté : au-delà de six mois (window.CONSENT_MAX_AGE, base.html),
    // window.consentChoice() le considère comme absent et le bandeau revient.
    const remember = (choice) => {
      try {
        localStorage.setItem('cookie-consent', choice);
        localStorage.setItem('cookie-consent-date', String(Date.now()));
      } catch (e) {}
    };

    const open = () => cookieModal.classList.add('show');
    const close = () => cookieModal.classList.remove('show');

    const choice = typeof window.consentChoice === 'function' ? window.consentChoice() : null;
    if (choice === null) window.setTimeout(open, 600);

    acceptBtn.addEventListener('click', () => {
      remember('accepted');
      if (typeof window.loadAnalytics === 'function') window.loadAnalytics();
      close();
    });

    // Refuser après avoir accepté : on efface les cookies déjà posés par Google Analytics.
    declineBtn.addEventListener('click', () => {
      remember('declined');
      if (window.analyticsLoaded && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', { analytics_storage: 'denied' });
      }
      document.cookie.split(';').forEach((part) => {
        const name = part.split('=')[0].trim();
        if (!/^_ga/.test(name)) return;
        const host = window.location.hostname.replace(/^www\./, '');
        [host, '.' + host, window.location.hostname].forEach((domain) => {
          document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
        });
        document.cookie = `${name}=; Max-Age=0; path=/`;
      });
      close();
    });

    // « Gérer les cookies » (pied de page, page Confidentialité) : rouvre le bandeau.
    document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
      button.addEventListener('click', () => {
        open();
        acceptBtn.focus();
      });
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

  // ===== Thème : bouton de l'en-tête =====
  // Thème sombre par défaut. La nouvelle teinte s'étend en cercle depuis le
  // bouton (View Transitions), sauf si le visiteur demande moins d'animations.
  function initThemeToggle() {
    const root = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const button = document.querySelector('.theme-toggle');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const currentTheme = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

    function syncButton(theme) {
      const isDark = theme === 'dark';
      if (button) {
        button.setAttribute('aria-pressed', String(isDark));
        button.setAttribute('aria-label', isDark ? 'Activer le thème clair' : 'Activer le thème sombre');
      }
      if (metaTheme) metaTheme.setAttribute('content', isDark ? '#131315' : '#e8e6e1');
    }

    function applyTheme(theme) {
      root.setAttribute('data-theme', theme);
      syncButton(theme);
    }

    function toggleTheme(origin) {
      const theme = currentTheme() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {}

      if (!document.startViewTransition || reduceMotion.matches || !origin) {
        applyTheme(theme);
        return;
      }

      // Fondu progressif sur toute la page (CSS : themeFade).
      root.classList.add('theme-vt');

      const transition = document.startViewTransition(() => applyTheme(theme));
      transition.finished.finally(() => root.classList.remove('theme-vt'));
    }

    syncButton(currentTheme());

    if (button) button.addEventListener('click', () => toggleTheme(button));

    // Sans choix enregistré, le site suit le thème du système, même en cours de visite.
    const systemLight = window.matchMedia('(prefers-color-scheme: light)');
    const followSystem = () => {
      let stored = null;
      try { stored = localStorage.getItem('theme'); } catch (e) {}
      if (stored === 'light' || stored === 'dark') return;
      applyTheme(systemLight.matches ? 'light' : 'dark');
    };
    if (systemLight.addEventListener) systemLight.addEventListener('change', followSystem);
  }

  // ===== Exemples : carrousel des démos =====
  // Les captures défilent en fondu ; l'adresse, le métier et le lien suivent.
  // Pause au survol, au focus, quand l'onglet est caché et par le bouton pause
  // (WCAG 2.2.2) ; pas de défilement automatique si l'utilisateur demande moins
  // d'animations. Seule la première capture est chargée avec la page : chaque
  // suivante l'est juste avant d'être montrée (data-src → src).
  function initHeroPreview() {
    const preview = document.querySelector('[data-hero-preview]');
    if (!preview) return;

    const shots = Array.from(preview.querySelectorAll('.showcase__shot'));
    const dots = Array.from(preview.querySelectorAll('[data-preview-index]'));
    const url = preview.querySelector('[data-preview-url]');
    const label = preview.querySelector('[data-preview-label]');
    const link = preview.querySelector('[data-preview-link]');
    const win = preview.querySelector('[data-hero-window]');
    const pauseButton = preview.querySelector('[data-preview-pause]');
    const infos = Array.from(preview.querySelectorAll('[data-preview-info]'));
    if (shots.length < 2) return;

    const DELAY = 4500;
    let current = 0;
    let timer = null;
    let hovered = false;
    let pinned = false;
    let paused = false;
    let visible = true;

    function load(index) {
      const shot = shots[(index + shots.length) % shots.length];
      if (!shot || !shot.dataset.src) return;
      if (shot.dataset.srcset) shot.srcset = shot.dataset.srcset;
      shot.src = shot.dataset.src;
      delete shot.dataset.src;
      delete shot.dataset.srcset;
    }

    preview.style.setProperty('--showcase-delay', DELAY + 'ms');

    // Relance une animation CSS liée à une classe (retire, force le reflow, remet).
    function replay(element, className) {
      if (!element) return;
      element.classList.remove(className);
      void element.offsetWidth;
      element.classList.add(className);
    }

    function show(index) {
      current = (index + shots.length) % shots.length;
      const shot = shots[current];
      load(current);
      load(current + 1);
      shots.forEach((el, i) => el.classList.toggle('is-active', i === current));
      dots.forEach((el, i) => {
        el.classList.toggle('is-active', i === current);
        if (i === current) el.setAttribute('aria-current', 'true');
        else el.removeAttribute('aria-current');
      });
      // La légende (accroche et liens) suit la démo affichée.
      infos.forEach((el, i) => el.classList.toggle('is-active', i === current));
      if (url) url.textContent = shot.dataset.url;
      if (label) label.textContent = shot.dataset.label;
      if (link) {
        link.href = shot.dataset.url;
        link.setAttribute('aria-label', 'Ouvrir la démo : ' + shot.dataset.label);
      }
      // Le menu « Votre métier » (initTradeSelect) suit la démo affichée.
      preview.dispatchEvent(new CustomEvent('showcase:change', { detail: { index: current } }));
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
      preview.classList.remove('is-autoplay');
    }

    function start() {
      stop();
      if (pinned || paused || prefersReducedMotion() || hovered || document.hidden || !visible) return;
      load(current + 1);
      timer = window.setInterval(() => show(current + 1), DELAY);
      // Le remplissage du point actif repart de zéro, calé sur le minuteur.
      replay(preview, 'is-autoplay');
    }

    function syncIdle() {
      preview.classList.toggle('is-idle', document.hidden || !visible);
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        show(Number(dot.dataset.previewIndex));
        start();
      });
    });

    function setPaused(value) {
      paused = value;
      preview.classList.toggle('is-paused', paused);
      if (pauseButton) {
        pauseButton.setAttribute('aria-pressed', String(paused));
        pauseButton.setAttribute('aria-label', paused
          ? 'Reprendre le défilement des démos'
          : 'Mettre en pause le défilement des démos');
      }
      if (paused) stop();
      else start();
    }

    if (pauseButton) {
      // Sans défilement automatique (moins d'animations demandé), le bouton n'a pas lieu d'être.
      if (prefersReducedMotion()) pauseButton.hidden = true;
      pauseButton.addEventListener('click', () => setPaused(!paused));
    }

    preview.addEventListener('mouseenter', () => { hovered = true; stop(); });
    preview.addEventListener('mouseleave', () => { hovered = false; start(); });
    preview.addEventListener('focusin', () => { hovered = true; stop(); });
    preview.addEventListener('focusout', (event) => {
      if (!preview.contains(event.relatedTarget)) { hovered = false; start(); }
    });
    document.addEventListener('visibilitychange', () => {
      syncIdle();
      if (document.hidden) stop();
      else start();
    });

    // Hors de l'écran : plus de défilement ni d'animations en boucle.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        syncIdle();
        if (visible) start();
        else stop();
      }).observe(preview);
    }

    // La fenêtre s'incline doucement vers le pointeur, avec un reflet qui le suit.
    // Avec Motion (js/anim.js), l'inclinaison suit le pointeur en ressort, avec de l'inertie.
    if (win && hasFinePointer() && !prefersReducedMotion()) {
      const motion = window.siteMotion;
      const TILT_SPRING = { type: 'spring', stiffness: 160, damping: 18, mass: 0.8 };
      let tiltAnimation = null;
      const tiltTo = (tx, ty, options = TILT_SPRING) => {
        if (tiltAnimation) tiltAnimation.stop();
        const read = (name, fallback) => win.style.getPropertyValue(name) || getComputedStyle(win).getPropertyValue(name).trim() || fallback;
        tiltAnimation = motion.animate(win, {
          '--tilt-x': [read('--tilt-x', '0deg'), tx],
          '--tilt-y': [read('--tilt-y', '0deg'), ty]
        }, options);
        return tiltAnimation;
      };
      let frame = 0;
      preview.addEventListener('pointermove', (event) => {
        if (frame) return;
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          const rect = win.getBoundingClientRect();
          const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
          const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
          win.classList.add('is-tilting');
          const ty = ((x - 0.5) * 7).toFixed(2) + 'deg';
          const tx = ((0.5 - y) * 5).toFixed(2) + 'deg';
          if (motion) {
            win.classList.add('is-sprung');
            tiltTo(tx, ty);
          } else {
            win.style.setProperty('--tilt-y', ty);
            win.style.setProperty('--tilt-x', tx);
          }
          win.style.setProperty('--glare-x', (x * 100).toFixed(1) + '%');
          win.style.setProperty('--glare-y', (y * 100).toFixed(1) + '%');
        });
      });
      preview.addEventListener('pointerleave', () => {
        window.cancelAnimationFrame(frame);
        frame = 0;
        win.classList.remove('is-tilting');
        ['--glare-x', '--glare-y'].forEach((name) => win.style.removeProperty(name));
        if (!motion) {
          ['--tilt-x', '--tilt-y'].forEach((name) => win.style.removeProperty(name));
          return;
        }
        // Retour à l'inclinaison de repos (celle du CSS) en ressort, puis le CSS reprend la main.
        tiltTo('0deg', '0deg', { ...TILT_SPRING, stiffness: 120, damping: 16 }).then(() => {
          if (win.classList.contains('is-tilting')) return;
          win.classList.remove('is-sprung');
          ['--tilt-x', '--tilt-y'].forEach((name) => win.style.removeProperty(name));
        });
      });
    }

    // Une démo choisie dans le menu « Votre métier » : affichée, et le défilement s'arrête.
    preview.addEventListener('showcase:pin', (event) => {
      pinned = true;
      stop();
      show(event.detail.index);
    });

    start();
  }

  // ===== Exemples : bande qui défile =====
  // La ligne est doublée (copie masquée aux lecteurs d'écran) : la piste glisse d'une
  // demi-longueur en boucle, en ligne droite, sans raccord (CSS, ribbonScroll). Chaque
  // élément porte son losange, pour que l'écart soit le même au raccord.
  // Arrêt au survol (CSS), hors de l'écran et onglet caché ; rien sans JS ni avec moins d'animations.
  function initRibbon() {
    const ribbon = document.querySelector('[data-ribbon]');
    if (!ribbon || prefersReducedMotion()) return;
    const line = ribbon.querySelector('.ribbon__line');
    if (!line) return;

    const SPEED = 55; // px par seconde

    line.querySelectorAll('li').forEach((item) => {
      const gem = document.createElement('span');
      gem.className = 'ribbon__gem';
      gem.setAttribute('aria-hidden', 'true');
      item.prepend(gem);
    });

    const track = document.createElement('div');
    track.className = 'ribbon__track';
    line.parentNode.insertBefore(track, line);
    track.appendChild(line);
    ribbon.classList.add('is-marquee');

    let copy = null;
    function layout() {
      if (copy) copy.remove();
      copy = null;
      const width = line.getBoundingClientRect().width;
      if (!width) return;
      ribbon.style.setProperty('--ribbon-duration', (width / SPEED).toFixed(1) + 's');
      copy = line.cloneNode(true);
      copy.removeAttribute('aria-label');
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    }

    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    let resizeTimer = 0;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 200);
    });

    let visible = true;
    const sync = () => ribbon.classList.toggle('is-idle', document.hidden || !visible);
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        sync();
      }).observe(ribbon);
    }
  }

  // ===== Exemples : menu « Votre métier » =====
  // Un menu déroulant natif (clavier, lecteurs d'écran, roue du téléphone) qui affiche la démo
  // du métier choisi dans le carrousel et retient le métier pour le sujet du formulaire.
  // « Autre métier » mène au formulaire.
  function initTradeSelect() {
    const box = document.querySelector('[data-trade-select]');
    const preview = document.querySelector('[data-hero-preview]');
    if (!box || !preview) return;
    const select = box.querySelector('select');
    if (!select) return;
    box.hidden = false;

    const remember = (trade) => {
      try {
        if (trade) sessionStorage.setItem('contact-trade', trade);
        else sessionStorage.removeItem('contact-trade');
      } catch (e) {}
    };

    let current = select.value;
    preview.addEventListener('showcase:change', (event) => {
      current = String(event.detail.index);
      select.value = current;
    });

    select.addEventListener('change', () => {
      if (select.value === 'autre') {
        remember('');
        select.value = current;
        const form = document.getElementById('form');
        if (form) {
          history.pushState(null, '', '#form');
          form.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        }
        return;
      }
      const option = select.selectedOptions[0];
      remember(option ? option.dataset.trade : '');
      preview.dispatchEvent(new CustomEvent('showcase:pin', { detail: { index: Number(select.value) } }));
      // Sur un petit écran, le carrousel peut être sous le pli : on l'amène à l'écran.
      const rect = preview.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.6) {
        preview.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
      }
    });
  }

  // ===== Formulaire de contact =====
  // Sujet pré-rempli, vérification avant envoi (mêmes règles que le serveur),
  // bouton bloqué pendant l'envoi, brouillon gardé sur l'appareil.
  function initContactForm() {
    const form = document.querySelector('#contact-form form');
    if (!form) return;

    const fields = {
      firstName: form.querySelector('[name="first_name"]'),
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

    // --- Sujet suggéré (lien « Demander un devis », métier choisi, ?sujet=) ---
    // Une suggestion en placeholder (texte grisé), jamais écrite dans le champ : elle disparaît
    // dès qu'on écrit. Si le champ reste vide, elle est envoyée avec le message (au moment de
    // l'envoi seulement), pour que le métier et la demande ne se perdent pas.
    const defaultPlaceholder = fields.subject ? fields.subject.placeholder : '';
    let suggestedSubject = '';
    function prefillSubject(base) {
      if (!fields.subject || fields.subject.value) return; // saisi à la main
      const trade = storage.get('contact-trade', sessionStorage);
      const parts = [base || 'Référencement', trade].filter(Boolean);
      suggestedSubject = parts.length > 1 || base ? parts.join(' — ') : '';
      fields.subject.placeholder = suggestedSubject || defaultPlaceholder;
    }

    form.addEventListener('submit', () => {
      if (fields.subject && suggestedSubject && !fields.subject.value.trim()) {
        fields.subject.value = suggestedSubject;
      }
    });

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href$="#form"]');
      if (!link) return;
      const trade = storage.get('contact-trade', sessionStorage);
      if (link.dataset.contactSubject || trade) prefillSubject(link.dataset.contactSubject || '');
    });

    const param = new URLSearchParams(window.location.search).get('sujet');
    if (param && fields.subject && !fields.subject.value) {
      suggestedSubject = param.slice(0, 200);
      fields.subject.placeholder = suggestedSubject;
    }

    // --- Brouillon ---
    const hasServerErrors = Boolean(form.querySelector('.errorlist'));
    const draftKeys = ['firstName', 'name', 'email', 'subject', 'message'];
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
            suggestedSubject = '';
            if (fields.subject) fields.subject.placeholder = defaultPlaceholder;
            clearDraft();
            (fields.firstName || fields.name).focus();
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

  // ===== Barre de défilement teintée =====
  // Elle prend la couleur de la zone affichée au bord droit de l'écran, à mi-hauteur :
  // le premier fond opaque trouvé en remontant depuis l'élément qui s'y trouve, ou les
  // couleurs données par data-scrollbar-track / -thumb (le hero, en dégradé). Le curseur
  // est ce fond assombri (fond clair) ou éclairci (fond sombre). Le fondu est en CSS.
  function initScrollbarTint() {
    const root = document.documentElement;
    if (!window.CSS || !CSS.supports('color', 'color-mix(in srgb, red, blue)')) return;

    const parse = (value) => {
      const m = value && value.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return { r, g, b, a };
    };
    const luminance = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

    function surfaceAt() {
      const x = root.clientWidth - 2;
      const y = Math.round(window.innerHeight / 2);
      let el = document.elementFromPoint(x, y);
      while (el && el !== root) {
        if (el.dataset && el.dataset.scrollbarTrack) {
          return { track: el.dataset.scrollbarTrack, thumb: el.dataset.scrollbarThumb };
        }
        const bg = parse(getComputedStyle(el).backgroundColor);
        if (bg && bg.a > 0.85) {
          const track = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
          const towards = luminance(bg) > 0.5 ? '#17181b' : '#f4f1ea';
          return { track, thumb: `color-mix(in srgb, ${track} 60%, ${towards})` };
        }
        el = el.parentElement;
      }
      return null;
    }

    let last = '';
    let frame = 0;
    function update() {
      frame = 0;
      const surface = surfaceAt();
      const key = surface ? surface.track + surface.thumb : '';
      if (key === last) return;
      last = key;
      if (surface) {
        root.style.setProperty('--sb-track', surface.track);
        root.style.setProperty('--sb-thumb', surface.thumb);
      } else {
        root.style.removeProperty('--sb-track');
        root.style.removeProperty('--sb-thumb');
      }
    }
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Changement de thème : les fonds changent sans défilement.
    new MutationObserver(() => { last = ''; schedule(); })
      .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    update();
  }

  // ===== Initialisation =====
  function init() {
    initThemeToggle();
    initMobileMenu();
    initNavDemos();
    initNavbarState();
    initNavThumb();
    initActiveNavigation();
    initScrollReveal();
    initHeroPreview();
    initTradeSelect();
    initRibbon();
    initContactForm();
    initCopyLink();
    initReadingProgress();
    initArticleCopyBlocks();
    initSurfaceGlow();
    initCookieModal();
    initScrollbarTint();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
