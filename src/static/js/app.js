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
  function setMobileMenuState(isOpen) {
    if (!hamburger || !navMenu) return;

    hamburger.classList.toggle('active', isOpen);
    navMenu.classList.toggle('active', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function toggleMobileMenu() {
    const isOpen = !hamburger.classList.contains('active');
    setMobileMenuState(isOpen);
  }

  function closeMobileMenu() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      setMobileMenuState(false);
    }
  }

  function initMobileMenu() {
    if (hamburger) {
      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMobileMenu();
      });
    }

    navLinks.forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });

    navMenu?.addEventListener('click', (e) => {
      if (e.target === navMenu) closeMobileMenu();
    });

    window.addEventListener('resize', utils.debounce(() => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setMobileMenuState(false);
      }
    }, 150));
  }

  // ===== Accessibility =====
  function initAccessibility() {
    if (!hamburger) return;

    hamburger.setAttribute('aria-label', 'Ouvrir le menu');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'site-nav');
  }

  // ===== Scroll Animations =====
  function initScrollAnimations() {
    if (!utils.hasGSAP() || !utils.hasScrollTrigger()) {
      initBasicScrollAnimations();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Animate asymmetric section blocks
    const assetBlocks = document.querySelectorAll('.section-asymetrique .bloc-1, .section-asymetrique .bloc-2, .section-asymetrique .bloc-3, .section-asymetrique .bloc-right');

    assetBlocks.forEach((block, index) => {
      const isRightBlock = block.classList.contains('bloc-1') || block.classList.contains('bloc-3');
      const isLeftBlock = block.classList.contains('bloc-2') || block.classList.contains('bloc-right');

      gsap.set(block, {
        opacity: 0,
        y: 50,
        x: isRightBlock ? 100 : (isLeftBlock ? -100 : 0),
        scale: 0.95,
        transformPerspective: 1000
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: block,
          start: "top 85%",
          end: "bottom 15%",
          toggleActions: "play none none reverse",
          once: false,
          markers: false,
          invalidateOnRefresh: true,
          immediateRender: false
        }
      });

      tl.to(block, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        delay: index * 0.15
      })
      .to(block.querySelector('img'), {
        scale: 1,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.8")
      .to(block.querySelector('.bloc-txt-left, .bloc-txt-2, .bloc-txt-right'), {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.6")
      .to(block.querySelector('button, .btn-bloc-left, .btn-bloc-right'), {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.4");

      // Hover effect on images
      const img = block.querySelector('img');
      if (img) {
        block.addEventListener('mouseenter', () => {
          gsap.to(img, {
            scale: 1.05,
            duration: 0.4,
            ease: "power2.out"
          });
        });

        block.addEventListener('mouseleave', () => {
          gsap.to(img, {
            scale: 1,
            duration: 0.4,
            ease: "power2.out"
          });
        });
      }
    });

    // Decorative lines animation
    const decorativeLines = document.querySelectorAll('.ligne-gauche, .ligne-milieu, .ligne-droite');
    decorativeLines.forEach((line, index) => {
      gsap.fromTo(line,
        {
          scaleY: 0,
          transformOrigin: "top center"
        },
        {
          scaleY: 1,
          duration: 1.5,
          delay: index * 0.2,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: ".section-asymetrique",
            start: "top 75%",
            end: "bottom 25%",
            toggleActions: "play none none reverse",
            once: false,
            invalidateOnRefresh: true
          }
        }
      );
    });

    // Section title animation
    const sectionTitle = document.querySelector('.section-asymetrique h2');
    if (sectionTitle) {
      gsap.fromTo(sectionTitle,
        {
          y: 30,
          opacity: 0,
          clipPath: "inset(100% 0 0 0)"
        },
        {
          y: 0,
          opacity: 1,
          clipPath: "inset(0% 0 0 0)",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionTitle,
            start: "top 90%",
            end: "bottom 10%",
            toggleActions: "play none none reverse",
            once: false,
            invalidateOnRefresh: true
          }
        }
      );
    }
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

    const blocks = document.querySelectorAll('.section-asymetrique .bloc-1, .section-asymetrique .bloc-2, .section-asymetrique .bloc-3, .section-asymetrique .bloc-right');

    blocks.forEach(block => {
      block.classList.add(
        block.classList.contains('bloc-1') || block.classList.contains('bloc-3') 
          ? 'scroll-right' 
          : 'scroll-left'
      );
      observer.observe(block);
    });
  }

  // ===== Hero Animation =====
  function initHeroAnimation() {
    if (!hero || !utils.hasGSAP()) return;

    const heroTitle = hero.querySelector('.hero__title');
    const heroSubtitle = hero.querySelector('.hero__subtitle');
    const heroActions = hero.querySelector('.hero__actions');

    if (!heroTitle || !heroSubtitle || !heroActions) return;

    const heroTimeline = gsap.timeline({
      defaults: {
        ease: "power3.out",
        duration: 1
      }
    });

    heroTimeline
      .from(heroTitle, {
        y: -36,
        opacity: 0,
        duration: 0.7
      })
      .from(heroSubtitle, {
        y: 24,
        opacity: 0,
        duration: 0.7
      }, "-=0.5")
      .from(heroActions.children, {
        opacity: 0,
        y: 10,
        stagger: 0.12,
        duration: 0.45
      }, "-=0.35")
      .set([heroTitle, heroSubtitle, heroActions.children], {
        opacity: 1,
        clearProps: "all"
      });

    // Parallax effect
    if (utils.hasScrollTrigger()) {
      gsap.to(hero, {
        backgroundPosition: "50% 70%",
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }
  }

  // ===== Navbar Animations =====
  function initNavbarAnimations() {
    if (!navbar || !utils.hasGSAP()) return;

    const logo = navbar.querySelector('.logo a');

    // Add hover effect to links
    navLinks.forEach(link => {
      if (!link.querySelector('.link-hover-effect')) {
        const linkEffect = document.createElement('span');
        linkEffect.classList.add('link-hover-effect');
        link.appendChild(linkEffect);
      }
    });

    // Check if animation has already played in this session
    const hasPlayedAnimation = sessionStorage.getItem('navbarAnimationPlayed');

    if (!hasPlayedAnimation) {
      const navbarTimeline = gsap.timeline({
        defaults: {
          ease: "power3.out",
          duration: 0.3
        }
      });

      navbarTimeline
        .from(navbar, {
          y: -100,
          opacity: 0,
          duration: 0.4
        })
        .from(logo, {
          x: -50,
          opacity: 0,
          duration: 0.3
        }, "-=0.2")
        .from(navLinks, {
          y: -20,
          opacity: 0,
          stagger: 0.05
        }, "-=0.2")
        .set([navbar, logo, navLinks], {
          opacity: 1,
          clearProps: "all"
        });

      sessionStorage.setItem('navbarAnimationPlayed', 'true');
    } else {
      gsap.set([navbar, logo, navLinks], {
        opacity: 1,
        y: 0,
        x: 0,
        clearProps: "all"
      });
    }

    // Scroll animation for navbar
    if (utils.hasScrollTrigger()) {
      ScrollTrigger.create({
        trigger: 'body',
        start: 'top top',
        end: '50px top',
        onEnter: () => {
          gsap.to(navbar, {
            backgroundColor: 'var(--navbar-bg-scrolled)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.18)',
            height: '60px',
            duration: 0.3
          });
          navbar.classList.add('scrolled');
        },
        onLeaveBack: () => {
          gsap.to(navbar, {
            backgroundColor: 'var(--navbar-bg)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
            height: '70px',
            duration: 0.3
          });
          navbar.classList.remove('scrolled');
        }
      });
    } else {
      // Fallback
      window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
      });
    }
  }

  // ===== Posts Carousel =====
  function initPostsCarousel() {
    const carousel = document.querySelector('.carousel');
    const carouselContainer = document.querySelector('.carousel__container');
    const carouselTrack = document.querySelector('.carousel__track');
    const slides = Array.from(document.querySelectorAll('.carousel__slide'));
    const nextButton = document.querySelector('.carousel__button--next');
    const prevButton = document.querySelector('.carousel__button--prev');
    const dotsContainer = document.querySelector('.carousel__nav');

    if (!carousel || !carouselContainer || !carouselTrack || slides.length === 0) return;

    let currentIndex = 0;
    let slideWidth = 0;
    let slidesToShow = 1;
    const slideCount = slides.length;
    let autoplayInterval = null;

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let startTranslate = 0;
    let currentTranslate = 0;
    let dragAxis = null;
    let isDragging = false;
    let suppressClick = false;
    let dragStartTime = 0;

    function getSlidesToShow() {
      return window.innerWidth < 992 ? 1 : 3;
    }

    function getTranslateX() {
      const transform = getComputedStyle(carouselTrack).transform;
      if (!transform || transform === 'none') return 0;
      try {
        return new DOMMatrixReadOnly(transform).m41;
      } catch (err) {
        const parts = transform.split(',');
        return parseFloat(parts[4]) || 0;
      }
    }

    function getMaxIndex() {
      if (slidesToShow >= slideCount) return 0;
      return Math.max(0, slideCount - slidesToShow);
    }

    function calculateSlideWidth() {
      const count = getSlidesToShow();
      const containerWidth = carouselContainer.clientWidth;
      slideWidth = Math.max(1, Math.round(containerWidth / count));

      slides.forEach((slide) => {
        slide.style.flex = `0 0 ${slideWidth}px`;
        slide.style.width = `${slideWidth}px`;
        slide.style.maxWidth = `${slideWidth}px`;
      });

      return count;
    }

    function setTrackPosition(offset, animate = true) {
      carouselTrack.style.transition = animate
        ? 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
        : 'none';
      carouselTrack.style.transform = `translate3d(${offset}px, 0, 0)`;
    }

    function updateActiveSlide() {
      slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx >= currentIndex && idx < currentIndex + slidesToShow);
      });
    }

    function updateDots() {
      if (!dotsContainer) return;
      dotsContainer.querySelectorAll('.carousel__indicator').forEach((dot) => {
        dot.classList.toggle('carousel__indicator--active', Number(dot.dataset.index) === currentIndex);
      });
    }

    function goToSlide(index, animate = true) {
      currentIndex = Math.max(0, Math.min(index, getMaxIndex()));
      currentTranslate = -currentIndex * slideWidth;
      setTrackPosition(currentTranslate, animate);
      updateDots();
      updateActiveSlide();
    }

    function createDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      const numberOfDots = getMaxIndex() + 1;

      if (numberOfDots <= 1) {
        dotsContainer.style.display = 'none';
        return;
      }

      dotsContainer.style.display = 'flex';

      for (let i = 0; i < numberOfDots; i += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__indicator';
        if (i === currentIndex) dot.classList.add('carousel__indicator--active');
        dot.setAttribute('aria-label', `Aller à la position ${i + 1}`);
        dot.dataset.index = String(i);
        dot.addEventListener('click', () => {
          goToSlide(i);
          stopAutoplay();
        });
        dotsContainer.appendChild(dot);
      }
    }

    function updateButtonsVisibility() {
      if (!nextButton || !prevButton) return;
      const hide = slidesToShow >= slideCount;
      nextButton.style.display = hide ? 'none' : 'flex';
      prevButton.style.display = hide ? 'none' : 'flex';
      if (hide) stopAutoplay();
    }

    function updateCarouselLayout() {
      const nextSlidesToShow = calculateSlideWidth();
      if (nextSlidesToShow !== slidesToShow) {
        slidesToShow = nextSlidesToShow;
        if (currentIndex > getMaxIndex()) currentIndex = getMaxIndex();
        createDots();
      }
      updateButtonsVisibility();
      goToSlide(currentIndex, false);
    }

    function nextSlide() {
      const maxIndex = getMaxIndex();
      goToSlide(currentIndex >= maxIndex ? 0 : currentIndex + 1);
    }

    function prevSlide() {
      const maxIndex = getMaxIndex();
      goToSlide(currentIndex === 0 ? maxIndex : currentIndex - 1);
    }

    function startAutoplay() {
      stopAutoplay();
      if (slidesToShow >= slideCount || document.hidden) return;
      autoplayInterval = setInterval(nextSlide, 8000);
    }

    function stopAutoplay() {
      if (!autoplayInterval) return;
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }

    function resetPointerState() {
      carouselTrack.classList.remove('is-dragging');
      pointerId = null;
      dragAxis = null;
      isDragging = false;
    }

    function onPointerDown(e) {
      if (slidesToShow >= slideCount) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startTranslate = getTranslateX();
      currentTranslate = startTranslate;
      dragAxis = null;
      isDragging = false;
      dragStartTime = Date.now();
      stopAutoplay();
    }

    function onPointerMove(e) {
      if (pointerId !== e.pointerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!dragAxis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        dragAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (dragAxis === 'x') {
          isDragging = true;
          carouselTrack.classList.add('is-dragging');
          try {
            carouselTrack.setPointerCapture(e.pointerId);
          } catch (err) {}
        }
      }

      if (dragAxis !== 'x') return;

      e.preventDefault();
      const minTranslate = -getMaxIndex() * slideWidth;
      const rubber = 0.32;
      let next = startTranslate + dx;
      if (next > 0) next *= rubber;
      if (next < minTranslate) next = minTranslate + (next - minTranslate) * rubber;
      currentTranslate = next;
      setTrackPosition(currentTranslate, false);
    }

    function onPointerUp(e) {
      if (pointerId !== e.pointerId) return;

      const dx = e.clientX - startX;
      const elapsed = Math.max(1, Date.now() - dragStartTime);
      const velocity = dx / elapsed;

      if (dragAxis === 'x' && isDragging) {
        suppressClick = Math.abs(dx) > 8;
        const threshold = Math.max(36, slideWidth * 0.16);
        if (dx < -threshold || velocity < -0.4) {
          nextSlide();
        } else if (dx > threshold || velocity > 0.4) {
          prevSlide();
        } else {
          goToSlide(currentIndex);
        }
      }

      try {
        carouselTrack.releasePointerCapture(e.pointerId);
      } catch (err) {}
      resetPointerState();
      startAutoplay();
    }

    carouselTrack.addEventListener('pointerdown', onPointerDown);
    carouselTrack.addEventListener('pointermove', onPointerMove, { passive: false });
    carouselTrack.addEventListener('pointerup', onPointerUp);
    carouselTrack.addEventListener('pointercancel', onPointerUp);

    carouselTrack.addEventListener('click', (e) => {
      if (!suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
      suppressClick = false;
    }, true);

    slides.forEach((slide) => {
      const card = slide.querySelector('.card');
      const mainLink = card?.querySelector('a[href]');
      if (!card || !mainLink) return;

      card.addEventListener('click', (e) => {
        if (suppressClick) return;
        if (e.target.closest('a, button')) return;
        window.location.href = mainLink.getAttribute('href');
      });
    });

    nextButton?.addEventListener('click', () => {
      nextSlide();
      stopAutoplay();
    });

    prevButton?.addEventListener('click', () => {
      prevSlide();
      stopAutoplay();
    });

    window.addEventListener('resize', utils.debounce(updateCarouselLayout, 200));

    window.addEventListener('keydown', (e) => {
      const rect = carousel.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      if (e.key === 'ArrowLeft') {
        prevSlide();
        stopAutoplay();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        stopAutoplay();
      }
    });

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', () => {
      if (!isDragging) startAutoplay();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });

    updateCarouselLayout();
    createDots();
    updateButtonsVisibility();
    startAutoplay();

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) startAutoplay();
          else stopAutoplay();
        });
      }, { threshold: 0.25 });
      observer.observe(carousel);
    }
  }

  // ===== Clickable Article Cards =====
  function initClickableCards() {
    const articleCards = document.querySelectorAll('.card, .post-card, .news__grid .card, .featured-post');

    articleCards.forEach(card => {
      if (card.closest('.carousel')) return;
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
      '.card, .post-card, .featured-post, .section-asymetrique .bloc-1, .section-asymetrique .bloc-2, .section-asymetrique .bloc-3, .section-asymetrique .bloc-right, #contact-form, .form-article, .mentions-legales'
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

    const sectionTitles = document.querySelectorAll('.section-asymetrique h2, .news__title, .parallax p');

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
    initAccessibility();
    initScrollAnimations();
    initHeroAnimation();
    initNavbarAnimations();
    initSectionTitleAnimations();
    initPostsCarousel();
    initActiveNavigation();
    initClickableCards();
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

    // Handle menu visibility on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        navMenu.classList.remove('active');
        navMenu.style.removeProperty('left');
      } else {
        navMenu.style.removeProperty('left');
      }
    });
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