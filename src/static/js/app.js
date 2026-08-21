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
    return navMenu ? Array.from(navMenu.querySelectorAll('.nav-links a')) : [];
  }

  function syncNavOrigin() {
    if (!hamburger || !navMenu) return;
    const rect = hamburger.getBoundingClientRect();
    navMenu.style.setProperty('--nav-origin-x', `${(rect.left + rect.width / 2).toFixed(1)}px`);
    navMenu.style.setProperty('--nav-origin-y', `${(rect.top + rect.height / 2).toFixed(1)}px`);
  }

  function setMobileMenuState(isOpen) {
    if (!hamburger || !navMenu) return;

    const shouldOpen = Boolean(isOpen) && isMobileNav();
    syncNavOrigin();

    hamburger.classList.toggle('is-open', shouldOpen);
    navMenu.classList.toggle('is-open', shouldOpen);
    document.documentElement.classList.toggle('nav-open', shouldOpen);
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

    navLinks.forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });

    navMenu.addEventListener('click', (event) => {
      if (!event.target.closest('.nav-menu__panel')) closeMobileMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (!isNavOpen()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileMenu();
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

    window.addEventListener('resize', utils.debounce(syncNavOrigin, 120));

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

    document.querySelectorAll('.project').forEach((block) => {
      gsap.fromTo(block,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: block,
            start: "top 88%",
            once: true
          }
        }
      );
    });
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

    document.querySelectorAll('.project').forEach((block) => {
      block.classList.add('scroll-up');
      observer.observe(block);
    });
  }

  // ===== Hero Animation =====
  function initHeroAnimation() {
    if (!hero || !utils.hasGSAP()) return;

    const heroEyebrow = hero.querySelector('.hero__eyebrow');
    const heroTitle = hero.querySelector('.hero__title');
    const heroSubtitle = hero.querySelector('.hero__subtitle');
    const heroStack = hero.querySelector('.hero__stack');
    const heroActions = hero.querySelector('.hero__actions');
    const heroGuide = hero.querySelector('.hero__guide');
    const heroScroll = hero.querySelector('.hero__scroll');

    if (!heroTitle || !heroSubtitle || !heroActions) return;

    const heroTimeline = gsap.timeline({
      defaults: {
        ease: "power3.out",
        duration: 1
      }
    });

    if (heroEyebrow) {
      heroTimeline.from(heroEyebrow, {
        y: 16,
        opacity: 0,
        duration: 0.5
      });
    }

    heroTimeline
      .from(heroTitle, {
        y: 28,
        opacity: 0,
        duration: 0.75
      }, "-=0.25")
      .from(heroSubtitle, {
        y: 20,
        opacity: 0,
        duration: 0.65
      }, "-=0.45");

    if (heroStack) {
      heroTimeline.from(heroStack, {
        y: 14,
        opacity: 0,
        duration: 0.5
      }, "-=0.4");
    }

    heroTimeline.from(heroActions.children, {
      opacity: 0,
      y: 10,
      stagger: 0.12,
      duration: 0.45
    }, "-=0.3");

    if (heroGuide) {
      heroTimeline.from(heroGuide.children, {
        y: 16,
        opacity: 0,
        stagger: 0.08,
        duration: 0.45
      }, "-=0.22");
    }

    if (heroScroll) {
      heroTimeline.from(heroScroll, {
        opacity: 0,
        y: 8,
        duration: 0.4
      }, "-=0.15");
    }

    const animated = [heroTitle, heroSubtitle, ...heroActions.children];
    if (heroEyebrow) animated.push(heroEyebrow);
    if (heroStack) animated.push(heroStack);
    if (heroGuide) animated.push(...heroGuide.children);
    if (heroScroll) animated.push(heroScroll);

    heroTimeline.set(animated, {
      opacity: 1,
      clearProps: "all"
    });
  }

  // ===== Parallax (hero + bande) =====
  function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const layers = [];

    const heroMedia = hero?.querySelector('.hero__media');
    if (hero && heroMedia) {
      layers.push({
        section: hero,
        media: heroMedia,
        content: null,
        mode: 'drift'
      });
    }

    const band = document.querySelector('.parallax');
    const bandMedia = band?.querySelector('.parallax__media');
    const bandContent = band?.querySelector('.parallax__content');
    if (band && bandMedia) {
      layers.push({
        section: band,
        media: bandMedia,
        content: bandContent,
        mode: 'pin'
      });
    }

    if (!layers.length) return;

    let ticking = false;

    const updateParallax = () => {
      const view = window.innerHeight || 1;

      layers.forEach(({ section, media, content, mode }) => {
        const rect = section.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < view;
        if (!visible) return;

        if (mode === 'pin') {
          media.style.transform = `translate3d(0, ${-rect.top}px, 0)`;
          if (content) {
            content.style.transform = `translate3d(0, ${rect.top * 0.18}px, 0)`;
          }
          return;
        }

        if (window.innerWidth <= MOBILE_BREAKPOINT) {
          media.style.transform = '';
          return;
        }

        const shift = Math.max(-rect.height * 0.28, Math.min(rect.height * 0.12, -rect.top * 0.22));
        media.style.transform = `translate3d(0, ${shift}px, 0)`;
      });

      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', utils.debounce(updateParallax, 120));
  }

  // ===== Stack gauges =====
  function initStackGauges() {
    const gauges = document.querySelectorAll('.gauge');
    if (!gauges.length) return;

    const duration = 1150;

    function countTo(el, target, delay) {
      const start = performance.now() + delay;
      const tick = (now) => {
        if (now < start) {
          requestAnimationFrame(tick);
          return;
        }
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = `${Math.round(target * eased)}%`;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    function activate(gauge) {
      if (gauge.classList.contains('is-inview')) return;
      gauge.classList.add('is-inview');

      const level = Number(gauge.dataset.level || 0);
      const value = gauge.querySelector('.gauge__value');
      const track = gauge.querySelector('.gauge__track');
      const delayMs = parseFloat(getComputedStyle(gauge).getPropertyValue('--delay')) * 1000 || 0;

      if (track) track.setAttribute('aria-valuenow', String(level));
      if (value) countTo(value, level, delayMs);
    }

    if (prefersReducedMotion()) {
      gauges.forEach((gauge) => {
        const level = Number(gauge.dataset.level || 0);
        const value = gauge.querySelector('.gauge__value');
        const track = gauge.querySelector('.gauge__track');
        gauge.classList.add('is-inview');
        if (value) value.textContent = `${level}%`;
        if (track) track.setAttribute('aria-valuenow', String(level));
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      gauges.forEach(activate);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.45 });

    gauges.forEach((gauge) => observer.observe(gauge));
  }

  // ===== Navbar Animations =====
  function initNavbarAnimations() {
    if (!navbar) return;

    const logo = navbar.querySelector('.logo a');

    navLinks.forEach(link => {
      if (!link.querySelector('.link-hover-effect')) {
        const linkEffect = document.createElement('span');
        linkEffect.classList.add('link-hover-effect');
        link.appendChild(linkEffect);
      }
    });

    const syncScrolledState = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 24);
    };

    syncScrolledState();
    window.addEventListener('scroll', syncScrolledState, { passive: true });

    if (!utils.hasGSAP()) return;

    const hasPlayedAnimation = sessionStorage.getItem('navbarAnimationPlayed');
    if (hasPlayedAnimation) return;

    const introItems = [logo, ...(!isMobileNav() ? Array.from(navLinks) : [])].filter(Boolean);
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

  // ===== Featured article rotator =====
  function initFeaturedRotator() {
    const rotator = document.querySelector('.featured-rotator');
    if (!rotator) return;

    const slides = Array.from(rotator.querySelectorAll('.featured-rotator__slide'));
    const bars = Array.from(rotator.querySelectorAll('.featured-rotator__bar'));
    if (slides.length === 0) return;

    const holdMs = Number(rotator.dataset.hold) || 6500;
    rotator.style.setProperty('--featured-hold', `${holdMs}ms`);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canRotate = slides.length > 1 && !reducedMotion;

    let currentIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
    let timer = null;
    let remaining = holdMs;
    let lastStartedAt = 0;
    let paused = false;
    let inView = true;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let suppressClick = false;

    function syncBars(restartActive = true) {
      bars.forEach((bar, index) => {
        bar.classList.toggle('is-active', index === currentIndex);
        bar.classList.toggle('is-complete', index < currentIndex);
        bar.setAttribute('aria-selected', String(index === currentIndex));

        const fill = bar.querySelector('.featured-rotator__bar-fill');
        if (!fill) return;

        fill.classList.remove('is-running');
        if (index === currentIndex && canRotate && restartActive) {
          void fill.offsetWidth;
          fill.classList.add('is-running');
        }
      });
    }

    function goTo(index) {
      const nextIndex = (index + slides.length) % slides.length;
      if (nextIndex === currentIndex) {
        remaining = holdMs;
        syncBars(true);
        startTimer();
        return;
      }

      slides[currentIndex].classList.remove('is-active');
      slides[currentIndex].setAttribute('aria-hidden', 'true');
      currentIndex = nextIndex;
      slides[currentIndex].classList.add('is-active');
      slides[currentIndex].setAttribute('aria-hidden', 'false');
      remaining = holdMs;
      syncBars(true);
      startTimer();
    }

    function stopTimer() {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
    }

    function startTimer() {
      stopTimer();
      if (!canRotate || paused || !inView || document.hidden) return;
      lastStartedAt = Date.now();
      timer = setTimeout(() => {
        remaining = holdMs;
        goTo(currentIndex + 1);
      }, remaining);
    }

    function pause() {
      if (paused) return;
      paused = true;
      rotator.classList.add('is-paused');
      if (timer) {
        remaining = Math.max(120, remaining - (Date.now() - lastStartedAt));
        stopTimer();
      }
    }

    function resume() {
      if (!paused) return;
      paused = false;
      rotator.classList.remove('is-paused');
      startTimer();
    }

    bars.forEach((bar) => {
      bar.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        goTo(Number(bar.dataset.index));
      });
    });

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      rotator.addEventListener('mouseenter', pause);
      rotator.addEventListener('mouseleave', resume);
    }

    rotator.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.featured-rotator__bar')) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      suppressClick = false;
    });

    rotator.addEventListener('pointerup', (event) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
      suppressClick = true;
      if (dx < 0) goTo(currentIndex + 1);
      else goTo(currentIndex - 1);
    });

    rotator.addEventListener('click', (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);

    window.addEventListener('keydown', (event) => {
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return;
      const rect = rotator.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(currentIndex + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(currentIndex - 1);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause();
      else if (!rotator.matches(':hover')) resume();
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (!inView) {
            if (timer) {
              remaining = Math.max(120, remaining - (Date.now() - lastStartedAt));
              stopTimer();
            }
            rotator.classList.add('is-paused');
            return;
          }
          if (!paused) rotator.classList.remove('is-paused');
          startTimer();
        });
      }, { threshold: 0.3 });
      observer.observe(rotator);
    }

    syncBars(canRotate);
    startTimer();
  }

  // ===== Clickable Article Cards =====
  function initClickableCards() {
    const articleCards = document.querySelectorAll('.card, .post-card, .news__grid .card, .featured-post, .blog-card, .blog-featured');

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

    buttons.forEach((button) => {
      const wrap = button.parentElement;
      const source = wrap && wrap.querySelector('pre, code');
      if (wrap) {
        wrap.classList.add('article-copy-block');
        wrap.style.removeProperty('all');
        wrap.style.removeProperty('background-color');
        wrap.style.removeProperty('color');
        wrap.style.removeProperty('border');
        wrap.style.removeProperty('width');
        wrap.style.removeProperty('box-shadow');
        wrap.style.removeProperty('font-family');
      }
      button.classList.add('article-copy-block__btn');
      button.type = 'button';
      button.removeAttribute('onclick');
      button.style.removeProperty('all');
      button.style.removeProperty('background-color');
      button.style.removeProperty('font-family');
      button.style.removeProperty('border-radius');

      const original = (button.textContent || 'Copier').trim();

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
          button.classList.add('is-copied');
          button.textContent = 'Copié !';
          window.setTimeout(() => {
            button.classList.remove('is-copied');
            button.textContent = original;
          }, 2000);
        } catch (error) {
          button.classList.remove('is-copied');
          button.textContent = original;
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
      '.card, .post-card, .featured-post, .blog-card, .blog-featured, .featured-rotator, #contact-form, .form-article, .mentions-legales, .stack__code, .stack__gauges'
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

    const sectionTitles = document.querySelectorAll('.projects__header h2, .news__title, .parallax__title, .stack__header h2');

    sectionTitles.forEach(title => {
      // Character animation
      const text = title.textContent;
      title.innerHTML = '';

      text.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        title.appendChild(span);
      });

      gsap.fromTo(title.children,
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
    
    // Show modal only if no choice was made before (first visit)
    if (cookieChoice === null) {
      setTimeout(() => {
        showCookieModal();
      }, 1000); // Show after 1 second to let the page load
    }
    
    // Event listeners for buttons
    acceptBtn.addEventListener('click', () => {
      acceptCookies();
      hideCookieModal();
    });
    
    declineBtn.addEventListener('click', () => {
      declineCookies();
      hideCookieModal();
    });
    
    // Close modal on overlay click
    cookieModal.addEventListener('click', (e) => {
      if (e.target === cookieModal) {
        // If user clicks outside without choosing, consider it as decline
        declineCookies();
        hideCookieModal();
      }
    });
    
    // Prevent modal from closing when clicking inside
    cookieModal.querySelector('.cookie-modal').addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    function showCookieModal() {
      cookieModal.classList.add('show');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      
      // Focus management for accessibility
      acceptBtn.focus();
    }
    
    function hideCookieModal() {
      cookieModal.classList.remove('show');
      document.body.style.overflow = ''; // Restore scrolling
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

  // ===== Theme toggle =====
  function initThemeToggle() {
    const button = document.querySelector('.theme-toggle');
    const root = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');

    function currentTheme() {
      return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function syncButton(theme) {
      if (!button) return;
      const isDark = theme === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', isDark ? 'Activer le thème clair' : 'Activer le thème sombre');
      if (metaTheme) {
        metaTheme.setAttribute('content', isDark ? '#10141b' : '#14181f');
      }
    }

    function applyTheme(theme) {
      root.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {}
      syncButton(theme);
    }

    syncButton(currentTheme());

    if (!button) return;

    button.addEventListener('click', () => {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // ===== Initialization =====
  function init() {
    // Initialize all components
    initThemeToggle();
    initMobileMenu();
    initScrollAnimations();
    initHeroAnimation();
    initParallax();
    initStackGauges();
    initNavbarAnimations();
    initSectionTitleAnimations();
    initFeaturedRotator();
    initActiveNavigation();
    initClickableCards();
    initCopyLink();
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