// app.js — site principal (les démos ont chacune leur propre script)

(() => {
  // Constants
  const MOBILE_BREAKPOINT = 768;

  // DOM Elements - cached selectors
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-links > li > a');
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
    const x = `${active.offsetLeft}px`;
    const w = `${active.offsetWidth}px`;
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

  // ===== À propos : vignettes de la stack =====
  // Apparition en cascade à l'arrivée à l'écran ; à la souris, une lueur suit le curseur
  // sur les contours de toutes les vignettes et celle survolée se laisse un peu attirer.
  function initStackChips() {
    const stack = document.querySelector('[data-stack]');
    if (!stack) return;
    const chips = Array.from(stack.querySelectorAll('.about__chip'));
    const motion = !prefersReducedMotion();

    if (motion && 'IntersectionObserver' in window) {
      const rect = stack.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) {
        stack.classList.add('is-armed');
        const observer = new IntersectionObserver((records) => {
          if (!records.some((record) => record.isIntersecting)) return;
          observer.disconnect();
          stack.classList.add('is-in');
          window.setTimeout(() => stack.classList.remove('is-armed', 'is-in'), 1400);
        }, { rootMargin: '0px 0px -8% 0px' });
        observer.observe(stack);
      }
    }

    if (!hasFinePointer()) return;

    let frame = 0;
    let pointer = null;

    const paint = () => {
      frame = 0;
      if (!pointer) return;
      chips.forEach((chip) => {
        const box = chip.getBoundingClientRect();
        const x = pointer.x - box.left;
        const y = pointer.y - box.top;
        chip.style.setProperty('--mx', `${x}px`);
        chip.style.setProperty('--my', `${y}px`);
        if (!motion) return;
        const inside = x >= 0 && y >= 0 && x <= box.width && y <= box.height;
        chip.style.setProperty('--tx', inside ? `${((x / box.width) - 0.5) * 4}px` : '0px');
        chip.style.setProperty('--ty', inside ? `${((y / box.height) - 0.5) * 3 - 1}px` : '0px');
      });
    };

    const area = stack.closest('.about__aside') || stack;
    area.addEventListener('pointermove', (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      stack.classList.add('is-lit');
      if (!frame) frame = window.requestAnimationFrame(paint);
    }, { passive: true });

    area.addEventListener('pointerleave', () => {
      pointer = null;
      stack.classList.remove('is-lit');
      chips.forEach((chip) => {
        chip.style.setProperty('--tx', '0px');
        chip.style.setProperty('--ty', '0px');
      });
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

  // ===== Thème : bouton de l'en-tête et tirette =====
  // Thème sombre par défaut. Deux commandes font la même chose : le bouton de
  // l'en-tête et la tirette qui pend dessous. On tire l'olive vers le bas : passé
  // le seuil, on relâche et le thème bascule ; un clic sur l'olive joue le même
  // geste. Le cordon revient sur un ressort et se balance un peu ; au survol, il
  // frémit ; un clic sur le bouton le fait sursauter. La nouvelle teinte s'étend
  // en cercle depuis le geste (View Transitions).
  function initThemeToggle() {
    const root = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const button = document.querySelector('.theme-toggle');
    const cord = document.querySelector('[data-pull-cord]');
    const grip = cord && cord.querySelector('.pull-cord__hit');
    const knob = cord && cord.querySelector('.pull-cord__knob');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const currentTheme = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

    function syncButton(theme) {
      const isDark = theme === 'dark';
      if (button) {
        button.setAttribute('aria-pressed', String(isDark));
        button.setAttribute('aria-label', isDark ? 'Activer le thème clair' : 'Activer le thème sombre');
      }
      if (metaTheme) metaTheme.setAttribute('content', isDark ? '#131315' : '#1c1a1b');
    }

    function applyTheme(theme) {
      root.setAttribute('data-theme', theme);
      syncButton(theme);
    }

    // origin : l'élément d'où part le cercle de la nouvelle teinte.
    function toggleTheme(origin) {
      const theme = currentTheme() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {}
      if (cord) cord.dispatchEvent(new CustomEvent('cord:used'));

      if (!document.startViewTransition || reduceMotion.matches || !origin) {
        applyTheme(theme);
        return;
      }

      // Le cercle part du centre de l'élément et couvre le coin le plus éloigné.
      const rect = origin.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.style.setProperty('--vt-x', `${x}px`);
      root.style.setProperty('--vt-y', `${y}px`);
      root.style.setProperty('--vt-r', `${Math.ceil(r)}px`);
      root.classList.add('theme-vt');

      const transition = document.startViewTransition(() => applyTheme(theme));
      transition.finished.finally(() => {
        root.classList.remove('theme-vt');
        ['--vt-x', '--vt-y', '--vt-r'].forEach((prop) => root.style.removeProperty(prop));
      });
    }

    syncButton(currentTheme());

    if (button) {
      button.addEventListener('click', () => {
        toggleTheme(button);
        if (cord) cord.dispatchEvent(new CustomEvent('cord:nudge'));
      });
    }

    if (!cord || !grip || !knob) return;

    // --- Alignement : la tirette pend à l'aplomb du bouton de thème. ---
    // Sur mobile, l'olive descend juste sous la ligne d'accroche du hero (une ou
    // deux lignes selon la largeur) : on mesure sa position sans les transformations
    // de l'animation d'entrée (offsetTop), pour ne pas viser une position de départ.
    const eyebrow = document.querySelector('.hero__eyebrow');
    const mobile = window.matchMedia('(max-width: 768px)');
    const pageTop = (el) => {
      let y = 0;
      for (let node = el; node; node = node.offsetParent) y += node.offsetTop;
      return y;
    };
    const pageLeft = (el) => {
      let x = 0;
      for (let node = el; node; node = node.offsetParent) x += node.offsetLeft;
      return x;
    };
    const swing = cord.querySelector('.pull-cord__swing');
    const string = cord.querySelector('.pull-cord__string');

    // Le fil croise-t-il une ligne de l'accroche ? On prend les lignes réellement
    // écrites (une ou deux selon la largeur) et, pour celles qu'il traverse, on
    // l'efface sur leur hauteur : il semble passer derrière le texte. Positions
    // relatives à l'accroche, pour ignorer le décalage de l'animation d'entrée.
    const placeGap = (cordX) => {
      string.style.removeProperty('--gap-a');
      string.style.removeProperty('--gap-b');
      if (!eyebrow) return;
      const box = eyebrow.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(eyebrow);
      const originX = pageLeft(eyebrow);
      const originY = pageTop(eyebrow) - cord.offsetTop;
      let top = Infinity;
      let bottom = -Infinity;
      Array.from(range.getClientRects()).forEach((r) => {
        const left = originX + r.left - box.left;
        const right = originX + r.right - box.left;
        if (r.width < 1 || cordX < left - 4 || cordX > right + 4) return;
        top = Math.min(top, originY + r.top - box.top);
        bottom = Math.max(bottom, originY + r.bottom - box.top);
      });
      if (bottom < 0) return;
      string.style.setProperty('--gap-a', `${Math.round(top - 2)}px`);
      string.style.setProperty('--gap-b', `${Math.round(bottom + 2)}px`);
    };

    const place = () => {
      if (!button || !button.offsetParent) {
        cord.classList.remove('is-placed');
        return;
      }
      const rect = button.getBoundingClientRect();
      const cordX = rect.left + rect.width / 2 + window.scrollX;
      cord.style.setProperty('--cord-x', `${cordX.toFixed(1)}px`);
      cord.style.removeProperty('--cord-hang');
      if (mobile.matches && eyebrow) {
        const below = pageTop(eyebrow) + eyebrow.offsetHeight - cord.offsetTop;
        cord.style.setProperty('--cord-hang', `${Math.round(below + 8 + 18)}px`);
      }
      placeGap(cordX);
      cord.classList.add('is-placed');
    };
    place();
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);

    // --- Physique : deux ressorts amortis, allongement (px) et angle (deg). ---
    const THRESHOLD = 26;   // allongement à dépasser pour basculer
    const MAX_PULL = 64;    // butée douce
    const MAX_ANGLE = 28;
    const ext = { x: 0, v: 0, k: 340, c: 15 };    // revient vite, petit rebond
    const ang = { x: 0, v: 0, k: 70, c: 3.2 };    // balancier, plus libre

    let frame = 0;
    let last = 0;
    let drag = null;
    let suppressClick = false;

    const render = () => {
      cord.style.setProperty('--cord-ext', `${ext.x.toFixed(2)}px`);
      cord.style.setProperty('--cord-angle', `${ang.x.toFixed(2)}deg`);
    };

    const step = (s, dt) => {
      const a = -s.k * s.x - s.c * s.v;
      s.v += a * dt;
      s.x += s.v * dt;
    };

    const settled = (s) => Math.abs(s.x) < 0.05 && Math.abs(s.v) < 0.05;

    function tick(now) {
      const gap = (now - last) / 1000 || 0.016;
      last = now;
      // Image en retard (bascule de thème, capture de la transition, téléphone
      // chargé) : on avance d'un pas normal au lieu de sauter, le mouvement reste
      // continu. Seul un onglet resté caché longtemps remet le cordon au repos.
      const elapsed = Math.min(gap, 0.034);
      if (!drag && gap > 1) {
        ext.x = ext.v = ang.x = ang.v = 0;
      } else if (!drag) {
        // Sous-pas de 4 ms au plus : un ressort raide reste stable même à bas régime.
        const n = Math.ceil(elapsed / 0.004);
        for (let i = 0; i < n; i += 1) {
          step(ext, elapsed / n);
          step(ang, elapsed / n);
        }
        // Au retour, le cordon peut remonter un peu, pas davantage.
        if (ext.x < -8) {
          ext.x = -8;
          ext.v = 0;
        }
      }
      render();
      if (drag || !settled(ext) || !settled(ang)) {
        frame = window.requestAnimationFrame(tick);
      } else {
        ext.x = ext.v = ang.x = ang.v = 0;
        render();
        frame = 0;
      }
    }

    const run = () => {
      if (reduceMotion.matches) {
        ext.x = ext.v = ang.x = ang.v = 0;
        render();
        return;
      }
      if (frame) return;
      last = performance.now();
      frame = window.requestAnimationFrame(tick);
    };

    // Résistance croissante : on sent la butée sans la heurter.
    const rubber = (d) => (d <= 0 ? 0 : MAX_PULL * (1 - Math.exp(-d / MAX_PULL)));

    grip.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      drag = { id: event.pointerId, x0: event.clientX, y0: event.clientY, moved: false };
      try {
        grip.setPointerCapture(event.pointerId);
      } catch (e) {}
      cord.classList.add('is-pulling');
      run();
    });

    grip.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x0;
      const dy = event.clientY - drag.y0;
      if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;
      ext.x = rubber(dy);
      ext.v = 0;
      const length = swing.offsetHeight;
      const target = (-Math.atan2(dx, length) * 180) / Math.PI;
      ang.x = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, target));
      ang.v = 0;
      cord.classList.toggle('is-armed', ext.x > THRESHOLD);
    });

    const release = (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const pulled = drag.moved;
      const armed = ext.x > THRESHOLD;
      drag = null;
      cord.classList.remove('is-pulling', 'is-armed');
      if (pulled) {
        suppressClick = true;
        if (armed) toggleTheme(knob);
      }
      run();
    };

    grip.addEventListener('pointerup', release);
    grip.addEventListener('pointercancel', release);

    // Clic simple sur l'olive : un petit coup sec vers le bas, puis la bascule.
    grip.addEventListener('click', () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      if (reduceMotion.matches) {
        toggleTheme(knob);
        return;
      }
      // Bascule d'abord, coup sec ensuite : le recalcul des couleurs de toute la
      // page ne tombe plus au milieu du mouvement (il saccadait sur mobile).
      toggleTheme(knob);
      ext.v = 520;
      ang.v += (Math.random() - 0.5) * 30;
      run();
      cord.classList.add('is-armed');
      window.setTimeout(() => cord.classList.remove('is-armed'), 160);
    });

    // Au survol, le cordon frémit, comme effleuré.
    grip.addEventListener('pointerenter', (event) => {
      if (drag || event.pointerType !== 'mouse') return;
      ang.v += event.movementX > 0 ? -22 : 22;
      run();
    });

    // Clic sur le bouton de l'en-tête : la tirette sursaute, comme tirée d'en haut.
    cord.addEventListener('cord:nudge', () => {
      if (drag) return;
      ext.v -= 260;
      ang.v += (Math.random() - 0.5) * 40;
      run();
    });

    // --- Invitation : une note « Tirez-moi ! » et le cordon qui frémit seul. ---
    // À chaque visite de l'accueil, quel que soit le thème (la couleur suit l'accent
    // du thème). À chaque bascule, elle s'efface aussitôt puis rejoue son entrée
    // quelques secondes plus tard, comme au chargement. Rien si le visiteur a défilé.
    const invite = cord.querySelector('[data-pull-cord-invite]');
    if (!invite) return;

    const INVITE_DELAY = 2200;
    let timers = [];

    const clearTimers = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
    };

    // Petit coup tiré d'en haut, puis le cordon se balance.
    const wave = (side) => {
      if (drag) return;
      ext.v += 170;
      ang.v += 62 * side;
      run();
    };

    const showInvite = () => {
      clearTimers();
      timers.push(window.setTimeout(() => {
        if (window.scrollY > 40 || !cord.classList.contains('is-placed')) return;
        cord.classList.add('is-inviting');
        wave(1);
        // Un second frémissement plus tard, s'il n'a toujours pas tiré.
        timers.push(window.setTimeout(() => wave(-1), 5200));
      }, INVITE_DELAY));
    };

    // Fondu rapide, puis remise à zéro sans transition (sinon la flèche se
    // « dé-dessinerait » à l'envers) : l'entrée pourra se rejouer à l'identique.
    const hideInvite = () => {
      clearTimers();
      if (!cord.classList.contains('is-inviting')) return;
      cord.classList.add('is-invite-out');
      timers.push(window.setTimeout(() => {
        cord.classList.add('is-invite-reset');
        cord.classList.remove('is-inviting', 'is-invite-out');
        void invite.offsetWidth; // applique l'état de départ avant de rendre les transitions
        cord.classList.remove('is-invite-reset');
      }, 220));
    };

    cord.addEventListener('cord:used', () => {
      hideInvite();
      // showInvite vide les minuteurs : on le lance après la remise à zéro.
      const resetDone = window.setTimeout(showInvite, 240);
      timers.push(resetDone);
    });

    showInvite();
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
    const win = preview.querySelector('[data-hero-window]');
    const deck = preview.querySelector('.hero__deck');
    const deckImages = Array.from(preview.querySelectorAll('[data-deck-img]'));
    if (shots.length < 2) return;

    const DELAY = 4500;
    let current = 0;
    let timer = null;
    let hovered = false;
    let pinned = false;
    let visible = true;

    preview.style.setProperty('--hero-delay', DELAY + 'ms');

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
      // La pile derrière la fenêtre montre toujours les démos suivantes.
      deckImages.forEach((img, i) => {
        img.src = shots[(current + i + 1) % shots.length].getAttribute('src');
      });
      replay(deck, 'is-shuffling');
      replay(win, 'is-loading');
      preview.dispatchEvent(new CustomEvent('herodemo', { detail: { index: current } }));
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
      preview.classList.remove('is-autoplay');
    }

    function start() {
      stop();
      if (pinned || prefersReducedMotion() || hovered || document.hidden || !visible) return;
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
        tiltTo('1.5deg', '-3deg', { ...TILT_SPRING, stiffness: 120, damping: 16 }).then(() => {
          if (win.classList.contains('is-tilting')) return;
          win.classList.remove('is-sprung');
          ['--tilt-x', '--tilt-y'].forEach((name) => win.style.removeProperty(name));
        });
      });
    }

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

    // La pastille de la démo affichée s'allume quand l'aperçu défile ; si le visiteur
    // a déjà choisi un métier, la sélection suit aussi les points de l'aperçu.
    if (heroPreview) {
      heroPreview.element.addEventListener('herodemo', (event) => {
        const chip = chips.find((el) => Number(el.dataset.tradeIndex) === event.detail.index);
        chips.forEach((el) => el.classList.toggle('is-showing', el === chip));
        if (engaged && chip) select(chip);
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
      const parts = [base || 'Référencement', trade].filter(Boolean);
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
    initNavDemos();
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
    initStackChips();
    initCookieModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
