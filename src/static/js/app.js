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
  function toggleMobileMenu() {
    const isActive = hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isActive);
    
    // Prevent background scrolling when menu is open
    document.body.style.overflow = isActive ? 'hidden' : '';
  }

  function closeMobileMenu() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      
      // Re-enable scrolling
      document.body.style.overflow = '';
    }
  }

  function initMobileMenu() {
    if (hamburger) {
      hamburger.addEventListener('click', toggleMobileMenu);
    }
    
    navLinks.forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });
    
    // Close menu on click outside
    document.addEventListener('click', (e) => {
      if (hamburger?.classList.contains('active') && 
          !hamburger.contains(e.target) && 
          !navMenu.contains(e.target)) {
        closeMobileMenu();
      }
    });
  }

  // ===== Accessibility =====
  function initAccessibility() {
    if (!hamburger) return;

    hamburger.setAttribute('aria-label', 'Toggle navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('role', 'button');
    hamburger.setAttribute('tabindex', '0');

    hamburger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMobileMenu();
      }
    });
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
      .set(hero, {
        filter: "blur(10px)",
        opacity: 0
      })
      .to(hero, {
        filter: "blur(0px)",
        opacity: 1,
        duration: 1.5
      })
      .from(heroTitle, {
        y: -60,
        opacity: 0,
        duration: 0.8
      }, "-=0.8")
      .from(heroSubtitle, {
        y: 40,
        opacity: 0,
        duration: 0.8
      }, "-=0.6")
      .from(heroActions.children, {
        opacity: 0,
        scale: 0.9,
        stagger: 0.15,
        duration: 0.6
      }, "-=0.4")
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
            backgroundColor: 'rgba(44, 62, 80, 0.95)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            height: '60px',
            duration: 0.3
          });
          navbar.classList.add('scrolled');
        },
        onLeaveBack: () => {
          gsap.to(navbar, {
            backgroundColor: 'var(--color-dark)',
            boxShadow: 'var(--shadow-sm)',
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
    const slides = document.querySelectorAll('.carousel__slide');
    const nextButton = document.querySelector('.carousel__button--next');
    const prevButton = document.querySelector('.carousel__button--prev');
    const dotsContainer = document.querySelector('.carousel__nav');

    if (!carouselTrack || slides.length === 0) return;

    let currentIndex = 0;
    let slideWidth = 0;
    let slidesToShow = 0;
    const slideCount = slides.length;
    let autoplayInterval = null;
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;
    let lastX = 0;

    // Get number of slides to show based on screen width
    function getSlideCount() {
      if (window.innerWidth < 576) return 1;
      if (window.innerWidth < 992) return 1;
      return 3;
    }

    // Calculate and set slide width
    function calculateSlideWidth() {
      const containerWidth = carouselContainer.clientWidth;
      const currentSlidesToShow = getSlideCount();
      slideWidth = Math.floor(containerWidth / currentSlidesToShow);

      slides.forEach(slide => {
        slide.style.flexBasis = `${slideWidth}px`;
        slide.style.maxWidth = `${slideWidth}px`;
      });

      return currentSlidesToShow;
    }

    // Get maximum slide index to prevent empty space
    function getMaxIndex() {
      if (slidesToShow >= slideCount) return 0;
      return Math.max(0, slideCount - slidesToShow);
    }

    // Update active slide class
    function updateActiveSlide() {
      const visibleSlideIndices = [];
      const startIdx = currentIndex;
      
      // Add active class to visible slides
      for (let i = 0; i < slidesToShow; i++) {
        const slideIdx = startIdx + i;
        if (slideIdx < slideCount) {
          visibleSlideIndices.push(slideIdx);
        }
      }
      
      // Update classes for all slides
      slides.forEach((slide, idx) => {
        if (visibleSlideIndices.includes(idx)) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
    }

    // Update carousel layout on resize
    function updateCarouselLayout() {
      const newSlidesToShow = calculateSlideWidth();

      if (newSlidesToShow !== slidesToShow) {
        slidesToShow = newSlidesToShow;
        
        const maxIndex = getMaxIndex();
        if (currentIndex > maxIndex) {
          currentIndex = maxIndex;
        }

        createDots();
      }

      updateButtonsVisibility();
      goToSlide(currentIndex, false);
      updateActiveSlide();
      truncateTitles();
    }

    // Create navigation dots
    function createDots() {
      if (!dotsContainer) return;

      dotsContainer.innerHTML = '';

      const maxIndex = getMaxIndex();
      const numberOfDots = maxIndex + 1;

      if (numberOfDots <= 1 || slidesToShow >= slideCount) {
        dotsContainer.style.display = 'none';
        return;
      }
      
      dotsContainer.style.display = 'flex';

      for (let i = 0; i < numberOfDots; i++) {
        const dot = document.createElement('button');
        dot.classList.add('carousel__indicator');
        
        if (i === currentIndex) {
          dot.classList.add('carousel__indicator--active');
        }

        dot.setAttribute('aria-label', `Aller à la position ${i + 1}`);
        dot.dataset.index = i;
        
        dot.addEventListener('click', () => {
          goToSlide(i);
          stopAutoplay();
        });

        dotsContainer.appendChild(dot);
      }
    }

    // Update navigation buttons visibility
    function updateButtonsVisibility() {
      if (!nextButton || !prevButton) return;

      const shouldHideButtons = slidesToShow >= slideCount;
      nextButton.style.display = shouldHideButtons ? 'none' : 'flex';
      prevButton.style.display = shouldHideButtons ? 'none' : 'flex';
      
      if (shouldHideButtons) {
        stopAutoplay();
      }
    }

    // Smooth scroll animation
    function smoothScroll(offset, duration = 300) {
      const start = parseFloat(getComputedStyle(carouselTrack).transform.split(',')[4]) || 0;
      
      // Use FLIP animation technique (First, Last, Invert, Play)
      // This helps browser optimize the animation
      carouselTrack.style.willChange = 'transform';
      
      // Use optimized animation with transform instead of step function
      carouselTrack.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`;
      carouselTrack.style.transform = `translateX(${offset}px)`;
      
      // Clean up after animation completes
      setTimeout(() => {
        carouselTrack.style.willChange = 'auto';
      }, duration);
    }

    // Go to specific slide
    function goToSlide(index, animate = true) {
      const maxIndex = getMaxIndex();
      currentIndex = Math.max(0, Math.min(index, maxIndex));

      const offset = -currentIndex * slideWidth;
      
      if (animate) {
        smoothScroll(offset);
      } else {
        // Force a browser reflow by accessing offsetHeight
        // This ensures the style changes are applied immediately
        carouselTrack.style.transition = 'none';
        carouselTrack.style.transform = `translateX(${offset}px)`;
        carouselTrack.offsetHeight;
        carouselTrack.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1.0)';
      }

      updateDots();
      updateActiveSlide();
    }

    // Update dots active state
    function updateDots() {
      if (!dotsContainer) return;

      const dots = dotsContainer.querySelectorAll('.carousel__indicator');
      if (dots.length === 0) return;

      dots.forEach(dot => {
        dot.classList.toggle('carousel__indicator--active', 
          parseInt(dot.dataset.index) === currentIndex);
      });
    }

    // Next slide - optimized for performance
    function nextSlide() {
      const maxIndex = getMaxIndex();
      const nextIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
      
      // Use CSS classes instead of inline styles for better performance
      const slidesToMove = slidesToShow === 1 || nextIndex === 0 ? 1 : slidesToShow;
      
      // Apply classes for transition
      carouselTrack.classList.add('is-transitioning');
      
      // Go to next slide without waiting
      goToSlide(nextIndex);
      
      // Remove transitioning class after animation completes
      setTimeout(() => {
        carouselTrack.classList.remove('is-transitioning');
      }, 300);
    }

    // Previous slide - optimized for performance
    function prevSlide() {
      const maxIndex = getMaxIndex();
      const prevIndex = currentIndex === 0 ? maxIndex : currentIndex - 1;
      
      // Apply classes for transition
      carouselTrack.classList.add('is-transitioning');
      
      // Go to previous slide without waiting
      goToSlide(prevIndex);
      
      // Remove transitioning class after animation completes
      setTimeout(() => {
        carouselTrack.classList.remove('is-transitioning');
      }, 300);
    }

    // Start autoplay
    function startAutoplay() {
      stopAutoplay();
      // Augmenter le délai pour une meilleure UX
      autoplayInterval = setInterval(nextSlide, 8000);
    }

    // Stop autoplay
    function stopAutoplay() {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    }

    // Mouse and touch event handlers for drag functionality
    function dragStart(e) {
      stopAutoplay();
      if (slidesToShow >= slideCount) return;
      
      e.preventDefault();
      isDragging = true;
      startPos = getPositionX(e);
      currentTranslate = parseFloat(getComputedStyle(carouselTrack).transform.split(',')[4]) || 0;
      prevTranslate = currentTranslate;
      lastX = startPos;
      
      carouselTrack.style.transition = 'none';
      requestAnimationFrame(animate);
    }

    function drag(e) {
      if (isDragging) {
        const currentPosition = getPositionX(e);
        const diff = currentPosition - lastX;
        currentTranslate = prevTranslate + diff;
        lastX = currentPosition;
      }
    }

    function dragEnd() {
      if (!isDragging) return;
      isDragging = false;
      cancelAnimationFrame(animationID);
      
      const threshold = slideWidth / 4; // Reduced threshold for more responsive feel
      const movedDistance = currentTranslate - prevTranslate;
      
      if (Math.abs(movedDistance) > threshold) {
        if (movedDistance > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
      } else {
        // Smooth snap back with optimized animation
        carouselTrack.style.willChange = 'transform';
        carouselTrack.style.transition = 'transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1.0)';
        carouselTrack.style.transform = `translateX(${prevTranslate}px)`;
        
        // Reset properties after animation
        setTimeout(() => {
          carouselTrack.style.willChange = 'auto';
        }, 200);
      }
    }

    function animate() {
      if (isDragging) {
        carouselTrack.style.transform = `translateX(${currentTranslate}px)`;
        animationID = requestAnimationFrame(animate);
      }
    }

    function getPositionX(e) {
      return e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    }

    // Initialize event listeners for buttons
    nextButton?.addEventListener('click', () => {
      nextSlide();
      stopAutoplay();
    });

    prevButton?.addEventListener('click', () => {
      prevSlide();
      stopAutoplay();
    });

    // Handle resize
    window.addEventListener('resize', utils.debounce(updateCarouselLayout, 250));

    // Mouse events for drag functionality
    carouselTrack.addEventListener('mousedown', dragStart);
    carouselTrack.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', dragEnd);

    // Touch events
    carouselTrack.addEventListener('touchstart', (e) => {
      stopAutoplay();
      const touch = e.touches[0];
      startPos = touch.clientX;
      lastX = startPos;
      currentTranslate = parseFloat(getComputedStyle(carouselTrack).transform.split(',')[4]) || 0;
      prevTranslate = currentTranslate;
      isDragging = true;
      carouselTrack.style.transition = 'none';
      requestAnimationFrame(animate);
    }, { passive: true });

    carouselTrack.addEventListener('touchmove', (e) => {
      if (isDragging) {
        const touch = e.touches[0];
        const currentPosition = touch.clientX;
        const diff = currentPosition - lastX;
        currentTranslate = prevTranslate + diff;
        lastX = currentPosition;
      }
    }, { passive: true });

    carouselTrack.addEventListener('touchend', () => {
      dragEnd();
    }, { passive: true });

    // Add keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (carousel.closest('.latest-posts').getBoundingClientRect().top < window.innerHeight && 
          carousel.closest('.latest-posts').getBoundingClientRect().bottom > 0) {
        if (e.key === 'ArrowLeft') {
          prevSlide();
          stopAutoplay();
        } else if (e.key === 'ArrowRight') {
          nextSlide();
          stopAutoplay();
        }
      }
    });

    // Pause autoplay on hover
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    // Handle card clicks more elegantly
    slides.forEach(slide => {
      const card = slide.querySelector('.card');
      const mainLink = card?.querySelector('a[href]');
      
      if (card && mainLink) {
        card.addEventListener('click', function(e) {
          // Only navigate if not dragging and not clicking interactive element
          const isInteractiveElement = e.target.matches('a, button') || 
                                      e.target.closest('a, button');
          
          if (!isDragging && !isInteractiveElement) {
            window.location.href = mainLink.getAttribute('href');
          }
        });
      }
    });

    // Tronquer les titres à 3 mots
    function truncateTitles() {
      slides.forEach(slide => {
        const titleElement = slide.querySelector('.card__title');
        if (titleElement) {
          const fullTitle = titleElement.getAttribute('data-full-title') || titleElement.textContent;
          
          // Stocker le titre complet si pas déjà fait
          if (!titleElement.getAttribute('data-full-title')) {
            titleElement.setAttribute('data-full-title', fullTitle);
          }
          
          // Tronquer le titre à 3 mots
          const words = fullTitle.split(' ');
          if (words.length > 3) {
            titleElement.textContent = words.slice(0, 3).join(' ') + '...';
            
            // Ajouter un tooltip avec le titre complet
            titleElement.title = fullTitle;
          }
          
          // Ajuster le style pour les titres tronqués
          titleElement.style.whiteSpace = "nowrap";
          titleElement.style.overflow = "hidden";
          titleElement.style.textOverflow = "ellipsis";
        }
      });
    }

    // Initialize
    updateCarouselLayout();
    createDots();
    updateButtonsVisibility();
    updateActiveSlide();
    truncateTitles();
    startAutoplay();

    // Intersection Observer for autoplay when in viewport
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      }, { threshold: 0.3 });
      
      observer.observe(carousel);
    }
  }

  // ===== Clickable Article Cards =====
  function initClickableCards() {
    const articleCards = document.querySelectorAll('.card, .post-card, .news__grid .card, .carousel .card, .featured-post');

    articleCards.forEach(card => {
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

      // Hover effect
      card.addEventListener('mouseenter', () => {
        card.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.boxShadow = '';
      });
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

  // ===== Initialization =====
  function init() {
    // Initialize all components
    initMobileMenu();
    initAccessibility();
    initScrollAnimations();
    initHeroAnimation();
    initNavbarAnimations();
    initSectionTitleAnimations();
    initPostsCarousel();
    initActiveNavigation();
    initClickableCards();
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