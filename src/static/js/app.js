// app.js (optimized)

(() => {
  // Constants
  const MOBILE_BREAKPOINT = 768;

  // DOM Elements - cached selectors
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-links a');
  const hero = document.querySelector('.hero');
  const navbar = document.querySelector('.navbar');

  // Utils
  const utils = {
    // Debounce function to limit execution rate
    debounce: (func, delay) => {
      let timer;
      return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
      };
    },
    
    // Check if GSAP and ScrollTrigger are available
    hasGSAP: () => typeof gsap !== 'undefined',
    hasScrollTrigger: () => typeof ScrollTrigger !== 'undefined'
  };

  // ===== Navigation Active State =====
  function initActiveNavigation() {
    if (!navLinks.length) return;

    // Get all target sections for navigation
    const sections = [];
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        const section = document.querySelector(href);
        if (section) {
          sections.push({ id: href, element: section, link });
        }
      }
    });

    if (!sections.length) return;

    // Sort sections by position (top to bottom)
    sections.sort((a, b) => a.element.offsetTop - b.element.offsetTop);

    // Add click event listeners to links
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
          e.preventDefault();

          // Update active class immediately
          navLinks.forEach(navLink => navLink.classList.remove('active'));
          this.classList.add('active');

          // Smooth scroll to section
          const targetSection = document.querySelector(href);
          if (targetSection) {
            const navbarHeight = navbar ? navbar.offsetHeight : 0;
            const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
          }
        }
      });
    });

    // Determine which section is currently visible
    function highlightNavOnScroll() {
      const navbarHeight = navbar ? navbar.offsetHeight : 0;
      const scrollPosition = window.pageYOffset + navbarHeight + 5;
      const windowHeight = window.innerHeight;
      const windowBottom = scrollPosition + windowHeight * 0.5;

      let currentSectionIndex = -1;

      // Find section most visible on screen
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionTop = section.element.offsetTop - navbarHeight;
        const sectionHeight = section.element.offsetHeight;
        const sectionBottom = sectionTop + sectionHeight;

        if ((scrollPosition >= sectionTop && scrollPosition < sectionBottom) ||
            (sectionTop <= scrollPosition && sectionBottom >= scrollPosition)) {
          currentSectionIndex = i;
          break;
        }
      }

      // Handle top of page (home/hero section)
      if (currentSectionIndex === -1 && scrollPosition < 150) {
        const homeLink = document.querySelector('.nav-links a[href="#hero"], .nav-links a[href="#home"], .nav-links a[href="#"]');
        if (homeLink) {
          navLinks.forEach(link => link.classList.remove('active'));
          homeLink.classList.add('active');
          return;
        }

        if (sections.length > 0 && sections[0].element.offsetTop - navbarHeight - 200 < scrollPosition) {
          currentSectionIndex = 0;
        }
      }

      // Update active state
      if (currentSectionIndex !== -1) {
        navLinks.forEach(link => link.classList.remove('active'));
        sections[currentSectionIndex].link.classList.add('active');
      }
    }

    // Initial state
    highlightNavOnScroll();

    // Optimize scroll event with requestAnimationFrame
    let isScrolling = false;
    window.addEventListener('scroll', () => {
      if (!isScrolling) {
        isScrolling = true;
        requestAnimationFrame(() => {
          highlightNavOnScroll();
          isScrolling = false;
        });
      }
    });
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

  // ===== Scroll Animations =====
  function initScrollAnimations() {
    if (prefersReducedMotion()) return;

    if (!utils.hasGSAP() || !utils.hasScrollTrigger()) {
      initBasicScrollAnimations();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const revealBlocks = (selector, stagger = false) => {
      document.querySelectorAll(selector).forEach((block, index) => {
        gsap.fromTo(block,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: stagger ? (index % 3) * 0.1 : 0,
            ease: "power2.out",
            // Rend la main au CSS (survols) une fois l'apparition terminée
            clearProps: "opacity,transform",
            scrollTrigger: {
              trigger: block,
              start: "top 88%",
              once: true
            }
          }
        );
      });
    };

    revealBlocks('.project');
    revealBlocks('.offer-step', true);
    revealBlocks('.pricing-card', true);
    revealBlocks('.pricing-plan');
    revealBlocks('.about__panel', true);
    revealBlocks('.about__aside');
  }

  // Fallback for browsers without GSAP
  function initBasicScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          entry.target.classList.remove('visible');
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    document.querySelectorAll('.project, .offer-step, .pricing-card, .pricing-plan, .about__panel, .about__aside').forEach((block) => {
      block.classList.add('scroll-up');
      observer.observe(block);
    });
  }

  // ===== Hero Animation =====
  function initHeroAnimation() {
    if (!hero) return;

    const revealHero = () => {
      hero.classList.remove('is-loading');
    };

    if (prefersReducedMotion() || !utils.hasGSAP()) {
      revealHero();
      return;
    }

    const heroEyebrow = hero.querySelector('.hero__eyebrow');
    const heroTitle = hero.querySelector('.hero__title');
    const heroSubtitle = hero.querySelector('.hero__subtitle');
    const heroActions = hero.querySelector('.hero__actions');
    const heroFacts = hero.querySelector('.hero__facts');
    const heroCode = hero.querySelector('.hero__code');
    const heroLines = hero.querySelectorAll('.hero__code .ln');
    const heroScroll = hero.querySelector('.hero__scroll');

    if (!heroTitle || !heroSubtitle || !heroActions) {
      revealHero();
      return;
    }

    const intro = [heroEyebrow, heroTitle, heroSubtitle, heroActions, heroFacts, heroCode, heroScroll].filter(Boolean);

    gsap.set(intro, { autoAlpha: 0, y: 14 });
    gsap.set(heroTitle, { y: 18 });
    if (heroCode) gsap.set(heroCode, { y: 26 });
    if (heroLines.length) gsap.set(heroLines, { autoAlpha: 0, x: -8 });
    revealHero();

    const tl = gsap.timeline({
      defaults: {
        ease: 'power2.out',
        duration: 0.7
      },
      onComplete() {
        gsap.set(intro, { clearProps: 'transform' });
        if (heroLines.length) gsap.set(heroLines, { clearProps: 'transform' });
      }
    });

    if (heroEyebrow) {
      tl.to(heroEyebrow, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.06);
    }

    tl.to(heroTitle, { autoAlpha: 1, y: 0, duration: 0.72 }, 0.14)
      .to(heroSubtitle, { autoAlpha: 1, y: 0, duration: 0.58 }, 0.26)
      .to(heroActions, { autoAlpha: 1, y: 0, duration: 0.52 }, 0.4);

    if (heroFacts) {
      tl.to(heroFacts, { autoAlpha: 1, y: 0, duration: 0.58 }, 0.5);
    }

    if (heroCode) {
      tl.to(heroCode, { autoAlpha: 1, y: 0, duration: 0.85 }, 0.3);
    }

    if (heroLines.length) {
      tl.to(heroLines, {
        autoAlpha: 1,
        x: 0,
        duration: 0.4,
        stagger: 0.055,
        ease: 'power1.out'
      }, 0.7);
    }

    if (heroScroll) {
      tl.to(heroScroll, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.9);
    }
  }

  // ===== Navbar Animations =====
  function initNavbarAnimations() {
    if (!navbar) return;

    const logo = navbar.querySelector('.logo a');

    const syncScrolledState = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 24);
    };

    syncScrolledState();
    window.addEventListener('scroll', syncScrolledState, { passive: true });

    if (!utils.hasGSAP()) return;

    const hasPlayedAnimation = sessionStorage.getItem('navbarAnimationPlayed');
    if (hasPlayedAnimation) return;

    const introItems = [logo, !isMobileNav() && navMenu, navbar.querySelector('.navbar-actions')].filter(Boolean);
    if (introItems.length) {
      gsap.from(introItems, {
        y: -16,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power3.out',
        clearProps: 'all'
      });
    }

    sessionStorage.setItem('navbarAnimationPlayed', 'true');
  }

  // ===== Clickable Article Cards =====
  function initClickableCards() {
    const articleCards = document.querySelectorAll('.blog-card, .blog-featured');

    articleCards.forEach(card => {
      if (card.closest('.carousel, .featured-rotator')) return;
      const mainLink = card.querySelector('a[href]');
      if (!mainLink) return;

      const targetUrl = mainLink.getAttribute('href');
      card.style.cursor = 'pointer';

      card.addEventListener('click', function(e) {
        const isInteractiveElement = e.target.matches('a, button') || 
                                   e.target.closest('a, button');
        if (isInteractiveElement) return;
        
        window.location.href = targetUrl;
      });

    });
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

  function initPointerGlow() {
    const glow = document.querySelector('.pointer-glow');
    if (!glow || prefersReducedMotion() || !hasFinePointer()) return;

    const root = document.documentElement;
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 3;
    let targetX = currentX;
    let targetY = currentY;
    let ticking = false;

    function update() {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      root.style.setProperty('--pointer-x', `${currentX.toFixed(1)}px`);
      root.style.setProperty('--pointer-y', `${currentY.toFixed(1)}px`);
      ticking = false;
      if (Math.abs(targetX - currentX) > 0.4 || Math.abs(targetY - currentY) > 0.4) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      targetX = event.clientX;
      targetY = event.clientY;
      glow.classList.add('is-active');
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
      glow.classList.remove('is-active');
    });
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

  // ===== Section Title Animations =====
  function initSectionTitleAnimations() {
    if (!utils.hasGSAP() || !utils.hasScrollTrigger()) return;
    if (window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches) return;

    const sectionTitles = document.querySelectorAll('.projects__header h2');

    sectionTitles.forEach(title => {
      // Animation par caractère, mots insécables : le titre peut passer
      // à la ligne et les lecteurs d'écran lisent le texte entier.
      const text = title.textContent.trim();
      const chars = [];
      title.setAttribute('aria-label', text);
      title.innerHTML = '';

      text.split(/\s+/).forEach((word, wordIndex, words) => {
        const wordSpan = document.createElement('span');
        wordSpan.setAttribute('aria-hidden', 'true');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap';

        word.split('').forEach(char => {
          const span = document.createElement('span');
          span.textContent = char;
          span.style.display = 'inline-block';
          wordSpan.appendChild(span);
          chars.push(span);
        });

        title.appendChild(wordSpan);
        if (wordIndex < words.length - 1) title.appendChild(document.createTextNode(' '));
      });

      gsap.fromTo(chars,
        {
          y: 30,
          opacity: 0,
          rotationX: -90,
          transformOrigin: "center bottom"
        },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          duration: 0.8,
          stagger: 0.02,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: title,
            start: "top 90%",
            end: "bottom 10%",
            toggleActions: "play none none reverse",
            once: false,
            invalidateOnRefresh: true
          }
        }
      );
    });
  }

  // ===== Scroll vers les ancres pour les redirections inter-pages =====
  function handleAnchorScroll() {
    // Vérifie si l'URL contient un hash (ancre)
    if (location.hash) {
      // Utiliser un délai plus long pour s'assurer que tout le DOM est chargé
      setTimeout(() => {
        const targetElement = document.querySelector(location.hash);
        
        if (targetElement) {
          // Calcul de la position en tenant compte de la hauteur de la navbar
          const navbarHeight = navbar ? navbar.offsetHeight : 0;
          const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navbarHeight;
          
          // Scroll vers l'élément avec un peu plus de délai
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }, 500); // Délai augmenté à 500ms
    }
  }

  // Ajout d'un gestionnaire d'événements spécifique pour les liens avec ancres
  function initInterPageLinks() {
    const interPageLinks = document.querySelectorAll('a[href*="#"]:not([href="#"])');
    
    interPageLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        // Si le lien pointe vers une autre page avec un hash
        if (href.indexOf('#') !== -1 && !href.startsWith('#')) {
          const targetPage = href.split('#')[0];
          const currentPage = window.location.pathname;
          
          // Si nous sommes déjà sur la page cible, ne rien faire (la gestion standard s'en occupera)
          if (targetPage === currentPage || targetPage === '') {
            return;
          }
          
          // Pour les liens vers d'autres pages avec ancre, on stocke l'ancre en localStorage
          const hash = href.split('#')[1];
          if (hash) {
            sessionStorage.setItem('scrollToAnchor', hash);
          }
        }
      });
    });
    
    // Vérifier s'il y a une ancre stockée
    const savedAnchor = sessionStorage.getItem('scrollToAnchor');
    if (savedAnchor) {
      sessionStorage.removeItem('scrollToAnchor');
      
      // Scroll vers l'ancre sauvegardée
      setTimeout(() => {
        const targetElement = document.querySelector('#' + savedAnchor);
        if (targetElement) {
          const navbarHeight = navbar ? navbar.offsetHeight : 0;
          const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navbarHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }, 500);
    }
  }

  // ===== Cookie Modal Management =====
  function initCookieModal() {
    const cookieModal = document.getElementById('cookieModal');
    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');
    
    if (!cookieModal || !acceptBtn || !declineBtn) return;
    
    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem('cookie-consent');
    
    if (cookieChoice === null) {
      setTimeout(() => {
        showCookieModal();
      }, 600);
    }
    
    acceptBtn.addEventListener('click', () => {
      acceptCookies();
      hideCookieModal();
    });
    
    declineBtn.addEventListener('click', () => {
      declineCookies();
      hideCookieModal();
    });
    
    function showCookieModal() {
      cookieModal.classList.add('show');
    }
    
    function hideCookieModal() {
      cookieModal.classList.remove('show');
    }
    
    function acceptCookies() {
      localStorage.setItem('cookie-consent', 'accepted');
      
      // Enable Google Analytics if not already enabled
      if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
          'analytics_storage': 'granted'
        });
      }
      
      console.log('Cookies accepted - Analytics enabled');
    }
    
    function declineCookies() {
      localStorage.setItem('cookie-consent', 'declined');
      
      // Disable Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
          'analytics_storage': 'denied'
        });
      }
      
      console.log('Cookies declined - Analytics disabled');
    }
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

  // ===== Initialization =====
  function init() {
    // Initialize all components
    initThemeToggle();
    initMobileMenu();
    initScrollAnimations();
    initHeroAnimation();
    initNavbarAnimations();
    initSectionTitleAnimations();
    initActiveNavigation();
    initClickableCards();
    initCopyLink();
    initReadingProgress();
    initArticleCopyBlocks();
    initPointerGlow();
    initSurfaceGlow();
    handleAnchorScroll();
    initInterPageLinks();  // Ajouter l'initialisation des liens inter-pages
    initCookieModal();     // Initialiser le modal de cookies

    // Refresh ScrollTrigger
    if (utils.hasScrollTrigger()) {
      setTimeout(() => ScrollTrigger.refresh(), 100);
      window.addEventListener('resize', utils.debounce(() => ScrollTrigger.refresh(), 250));
    }

  }

  // Initialize when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Animation des séparateurs avec GSAP
document.addEventListener('DOMContentLoaded', function() {
  // Ajouter la classe 'animated' à tous les séparateurs
  const dividers = document.querySelectorAll('.section-divider');

  dividers.forEach(divider => {
    divider.classList.add('animated');

    // Animation au scroll
    if (typeof gsap !== 'undefined' && gsap.registerPlugin) {
      gsap.registerPlugin(ScrollTrigger);

      gsap.from(divider, {
        scrollTrigger: {
          trigger: divider,
          start: "top 80%",
          end: "bottom 60%",
          toggleClass: {targets: divider, className: "reveal"},
          once: true
        },
        opacity: 0,
        duration: 1
      });

      // Animation au survol
      const dividerIcon = divider.querySelector('.divider-icon');
      if (dividerIcon) {
        gsap.to(dividerIcon, {
          rotation: 180,
          paused: true,
          duration: 0.5,
          ease: "power2.out"
        }).progress(1).reverse();

        divider.addEventListener('mouseenter', () => {
          gsap.to(dividerIcon, {
            rotation: 180,
            duration: 0.5,
            ease: "power2.out"
          });
        });

        divider.addEventListener('mouseleave', () => {
          gsap.to(dividerIcon, {
            rotation: 0,
            duration: 0.5,
            ease: "power2.out"
          });
        });
      }
    }
  });
});