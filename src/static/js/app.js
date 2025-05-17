// app.js (optimisé avec animations corrigées pour refresh)

(() => {
  // Constants
  const MOBILE_BREAKPOINT = 768;

  // DOM Elements - cached selectors for better performance
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-links a');
  const hero = document.querySelector('.hero');
  const navbar = document.querySelector('.navbar');

  // ===== Navigation Active State =====

  /**
   * Gère l'état actif des liens de navigation en fonction de la section visible
   */
  function initActiveNavigation() {
    // Sortir si aucun lien de navigation n'est trouvé
    if (!navLinks.length) return;

    // Récupérer toutes les sections cibles pour la navigation
    const sections = [];
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      // Si le lien est une ancre (commence par #) et n'est pas juste #
      if (href && href.startsWith('#') && href.length > 1) {
        const section = document.querySelector(href);
        if (section) {
          sections.push({
            id: href,
            element: section,
            link: link
          });
        }
      }
    });

    // Sortir s'il n'y a pas de sections trouvées
    if (!sections.length) return;

    // Trier les sections de haut en bas pour garantir une détection correcte
    sections.sort((a, b) => {
      return a.element.offsetTop - b.element.offsetTop;
    });

    // Ajouter un écouteur d'événements pour les clics sur les liens
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // Ne pas annuler la navigation si ce n'est pas une ancre interne
        const href = this.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
          e.preventDefault();

          // Mettre à jour la classe active immédiatement
          navLinks.forEach(navLink => navLink.classList.remove('active'));
          this.classList.add('active');

          // Faire défiler en douceur vers la section
          const targetSection = document.querySelector(href);
          if (targetSection) {
            // Calculer le décalage pour la navbar fixe
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

    // Fonction pour déterminer quelle section est actuellement visible
    function highlightNavOnScroll() {
      // Obtenir la position actuelle de défilement avec un offset pour la navbar
      const navbarHeight = navbar ? navbar.offsetHeight : 0;
      const scrollPosition = window.pageYOffset + navbarHeight + 5; // Petit offset supplémentaire

      // Récupérer la position du haut et du bas de la fenêtre visible
      const windowHeight = window.innerHeight;
      const windowBottom = scrollPosition + windowHeight * 0.5; // On considère le milieu de l'écran

      // Vérifier chaque section pour déterminer celle qui est la plus visible
      let currentSectionIndex = -1;

      // Trouver la section qui occupe la plus grande partie de l'écran visible
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionTop = section.element.offsetTop - navbarHeight; // Ajuster pour la navbar
        const sectionHeight = section.element.offsetHeight;
        const sectionBottom = sectionTop + sectionHeight;

        // Vérifier si nous sommes dans cette section
        // Une section est considérée visible si le haut de la section est au-dessus de la position de défilement
        // ET que le bas de la section est en-dessous de la position de défilement
        // OU si le haut de l'écran est entre le haut et le bas de la section
        if (
          (scrollPosition >= sectionTop && scrollPosition < sectionBottom) ||
          (sectionTop <= scrollPosition && sectionBottom >= scrollPosition)
        ) {
          currentSectionIndex = i;
          break; // On a trouvé la section active, pas besoin de continuer
        }
      }

      // Si aucune section n'est trouvée mais que nous sommes près du haut
      if (currentSectionIndex === -1 && scrollPosition < 150) {
        // Vérifier si un lien d'accueil existe
        const homeLink = document.querySelector('.nav-links a[href="#hero"], .nav-links a[href="#home"], .nav-links a[href="#"]');
        if (homeLink) {
          // Mettre à jour les classes actives
          navLinks.forEach(link => link.classList.remove('active'));
          homeLink.classList.add('active');
          return; // Sortir de la fonction
        }

        // Si aucun lien d'accueil n'est trouvé mais que la première section est proche
        if (sections.length > 0 && sections[0].element.offsetTop - navbarHeight - 200 < scrollPosition) {
          currentSectionIndex = 0;
        }
      }

      // Si une section est trouvée, mettre à jour les classes actives
      if (currentSectionIndex !== -1) {
        navLinks.forEach(link => link.classList.remove('active'));
        sections[currentSectionIndex].link.classList.add('active');
      }
    }

    // Définir l'état actif initial
    highlightNavOnScroll();

    // Écouter les événements de défilement pour mettre à jour l'état actif
    window.addEventListener('scroll', highlightNavOnScroll);
  }

  // ===== Mobile Menu =====

  /**
   * Toggle the mobile navigation menu open/closed
   */
  function toggleMobileMenu() {
    const isActive = hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isActive);
  }

  /**
   * Close the mobile menu when a link is clicked (only in mobile view)
   */
  function closeMobileMenu() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  }

  function initMobileMenu() {
    hamburger?.addEventListener('click', toggleMobileMenu);
    navLinks.forEach(link => link.addEventListener('click', closeMobileMenu));
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
    // Check if GSAP and ScrollTrigger are available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // Fallback to basic intersection observer animation
      initBasicScrollAnimations();
      return;
    }

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Animate asymmetric section blocks with GSAP
    const assetBlocks = document.querySelectorAll('.section-asymetrique .bloc-1, .section-asymetrique .bloc-2, .section-asymetrique .bloc-3, .section-asymetrique .bloc-right');

    assetBlocks.forEach((block, index) => {
      // Determine direction based on block class
      const isRightBlock = block.classList.contains('bloc-1') || block.classList.contains('bloc-3');
      const isLeftBlock = block.classList.contains('bloc-2') || block.classList.contains('bloc-right');

      // Initial state
      gsap.set(block, {
        opacity: 0,
        y: 50,
        x: isRightBlock ? 100 : (isLeftBlock ? -100 : 0),
        scale: 0.95,
        transformPerspective: 1000
      });

      // Create timeline for each block
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

      // Animation sequence
      tl.to(block, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        delay: index * 0.15 // Stagger effect
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
      }, "-=0.6");

      // Add hover parallax effect on images - MAINTENIR LE BORDER-RADIUS
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

    // Add decorative lines animation
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

    // Add text reveal animations for section title
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
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        } else {
          // On retire la classe visible quand l'élément sort du viewport
          entry.target.classList.remove('visible');
        }
      });
    }, options);

    // Apply animation classes to entire blocks
    const blocks = document.querySelectorAll('.section-asymetrique .bloc-1, .section-asymetrique .bloc-2, .section-asymetrique .bloc-3, .section-asymetrique .bloc-right');

    blocks.forEach(block => {
      if (block.classList.contains('bloc-1') || block.classList.contains('bloc-3')) {
        block.classList.add('scroll-right');
      } else {
        block.classList.add('scroll-left');
      }
      observer.observe(block);
    });
  }

  // ===== Hero Animation =====

  function initHeroAnimation() {
    // Exit early if no hero section
    if (!hero) return;

    // Get hero elements
    const heroTitle = hero.querySelector('.hero__title');
    const heroSubtitle = hero.querySelector('.hero__subtitle');
    const heroActions = hero.querySelector('.hero__actions');

    // Check if we have all required elements and GSAP is loaded
    if (!heroTitle || !heroSubtitle || !heroActions || typeof gsap === 'undefined') return;

    // Create timeline
    const heroTimeline = gsap.timeline({
      defaults: {
        ease: "power3.out",
        duration: 1
      }
    });

    // Add animations to timeline
    heroTimeline
      // Add blur effect to hero before animating
      .set(hero, {
        filter: "blur(10px)",
        opacity: 0
      })
      // Fade in and unblur the hero
      .to(hero, {
        filter: "blur(0px)",
        opacity: 1,
        duration: 1.5
      })
      // Stagger animate children
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
      }, "-=0.4");

    // Assurez-vous que les éléments deviennent visibles à la fin
    heroTimeline.set([heroTitle, heroSubtitle, heroActions.children], {
      opacity: 1,
      clearProps: "all" // Nettoie toutes les propriétés GSAP à la fin
    });

    // Add scroll effect to hero for parallax (if ScrollTrigger is available)
    if (gsap.ScrollTrigger) {
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
    // Exit early if navbar doesn't exist
    if (!navbar) return;

    // Vérifier que GSAP est disponible
    if (typeof gsap === 'undefined') return;

    // Logo et liens de navigation
    const logo = navbar.querySelector('.logo a');

    // Ajouter l'élément d'effet de survol à chaque lien
    navLinks.forEach(link => {
      if (!link.querySelector('.link-hover-effect')) {
        const linkEffect = document.createElement('span');
        linkEffect.classList.add('link-hover-effect');
        link.appendChild(linkEffect);
      }
    });

    // Vérifier si l'animation a déjà été jouée dans cette session
    const hasPlayedAnimation = sessionStorage.getItem('navbarAnimationPlayed');

    if (!hasPlayedAnimation) {
      // Animation initiale de la navbar (seulement si pas déjà jouée)
      const navbarTimeline = gsap.timeline({
        defaults: {
          ease: "power3.out",
          duration: 0.3
        }
      });

      // Animation d'entrée de la navbar
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
        }, "-=0.2");

      // Assurez-vous que tous les éléments sont visibles à la fin
      navbarTimeline.set(navbar, {
        opacity: 1,
        clearProps: "all"
      });

      navbarTimeline.set(logo, {
        opacity: 1,
        clearProps: "all"
      });

      // Traitement spécifique pour chaque lien de navigation
      navLinks.forEach(link => {
        navbarTimeline.set(link, {
          opacity: 1,
          clearProps: "all"
        });
      });

      // Marquer l'animation comme jouée
      sessionStorage.setItem('navbarAnimationPlayed', 'true');
    } else {
      // Si l'animation a déjà été jouée, s'assurer que tous les éléments sont visibles
      gsap.set([navbar, logo, navLinks], {
        opacity: 1,
        y: 0,
        x: 0,
        clearProps: "all"
      });
    }

    // Animation au scroll pour la navbar
    if (typeof ScrollTrigger !== 'undefined') {
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
      // Fallback pour les navigateurs sans ScrollTrigger
      window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      });
    }
  }

  // ===== Carousel des derniers articles =====
  function initPostsCarousel() {
    // Sélection des éléments DOM
    const carousel = document.querySelector('.carousel');
    const carouselContainer = document.querySelector('.carousel__container');
    const carouselTrack = document.querySelector('.carousel__track');
    const slides = document.querySelectorAll('.carousel__slide');
    const nextButton = document.querySelector('.carousel__button--next');
    const prevButton = document.querySelector('.carousel__button--prev');
    const dotsContainer = document.querySelector('.carousel__nav');

    // Si les éléments n'existent pas, sortir de la fonction
    if (!carouselTrack || slides.length === 0) return;

    // Variables pour le carousel
    let currentIndex = 0;
    let slideWidth = 0;
    let slidesToShow = getSlideCount();
    const slideCount = slides.length;
    let autoplayInterval = null;
    let resizeTimer;

    // Gérer la taille des slides en fonction de l'écran
    function getSlideCount() {
      const width = window.innerWidth;
      if (width < 992) {
        return 1; // Mobile: 1 slide
      }
      return 3; // Desktop: 3 slides
    }

    // Calculer et définir la largeur des slides
    function calculateSlideWidth() {
      // Obtenir la largeur du conteneur
      const containerWidth = carouselContainer.clientWidth;

      // Calculer la largeur de chaque slide en fonction du nombre à afficher
      const currentSlidesToShow = getSlideCount();

      // Ajuster pour éviter la coupure des cartes
      slideWidth = Math.floor(containerWidth / currentSlidesToShow);

      // Définir la largeur pour chaque slide
      slides.forEach(slide => {
        slide.style.flexBasis = `${slideWidth}px`;
        slide.style.maxWidth = `${slideWidth}px`;
      });

      return currentSlidesToShow;
    }

    // Calculer l'index maximum autorisé pour éviter les espaces vides
    function getMaxIndex() {
      // Si on peut afficher tous les slides, pas de limite
      if (slidesToShow >= slideCount) return 0;

      // Sinon, calculer la limite pour éviter les espaces vides
      return Math.max(0, slideCount - slidesToShow);
    }

    // Mettre à jour le carousel en fonction de la taille de l'écran
    function updateCarouselLayout() {
      // Obtenir le nombre de slides à afficher basé sur la taille de l'écran
      const newSlidesToShow = calculateSlideWidth();

      // Mettre à jour slidesToShow si la valeur a changé
      if (newSlidesToShow !== slidesToShow) {
        slidesToShow = newSlidesToShow;

        // Si l'index actuel dépasse la nouvelle limite, ajuster
        const maxIndex = getMaxIndex();
        if (currentIndex > maxIndex) {
          currentIndex = maxIndex;
        }

        // Recréer les points de navigation
        createDots();
      }

      // Mettre à jour la visibilité des boutons
      updateButtonsVisibility();

      // Réappliquer la transformation pour maintenir la position
      goToSlide(currentIndex, false);
    }

    // Créer les points de navigation
    function createDots() {
      if (!dotsContainer) return;

      dotsContainer.innerHTML = '';

      // Calculer le nombre réel de positions possibles
      const maxIndex = getMaxIndex();
      const numberOfDots = maxIndex + 1;

      // Ne pas afficher de points s'il n'y a qu'une seule position
      if (numberOfDots <= 1 || slidesToShow >= slideCount) {
        dotsContainer.style.display = 'none';
        return;
      } else {
        dotsContainer.style.display = 'flex';
      }

      for (let i = 0; i < numberOfDots; i++) {
        const dot = document.createElement('button');
        dot.classList.add('carousel__indicator');

        // Déterminer si ce point est actif
        if (i === currentIndex) {
          dot.classList.add('carousel__indicator--active');
        }

        dot.setAttribute('aria-label', `Aller à la position ${i + 1}`);
        dot.dataset.index = i;

        // Ajouter l'événement de clic
        dot.addEventListener('click', () => {
          goToSlide(i);
        });

        dotsContainer.appendChild(dot);
      }
    }

    // Fonction pour vérifier si les boutons sont nécessaires
    function updateButtonsVisibility() {
      if (!nextButton || !prevButton) return;

      // Cacher les boutons si toutes les slides sont visibles
      if (slidesToShow >= slideCount) {
        nextButton.style.display = 'none';
        prevButton.style.display = 'none';
        stopAutoplay(); // Pas besoin d'autoplay si tout est visible
      } else {
        nextButton.style.display = 'flex';
        prevButton.style.display = 'flex';
      }
    }

    // Aller à un slide spécifique avec animation optionnelle
    function goToSlide(index, animate = true) {
      // Limiter l'index pour éviter les espaces vides
      const maxIndex = getMaxIndex();
      currentIndex = Math.max(0, Math.min(index, maxIndex));

      // Appliquer la transformation avec ou sans animation
      if (!animate) {
        carouselTrack.style.transition = 'none';
      } else {
        carouselTrack.style.transition = 'transform 0.5s ease-in-out';
      }

      // Calculer et appliquer le décalage
      const offset = -currentIndex * slideWidth;
      carouselTrack.style.transform = `translateX(${offset}px)`;

      // Forcer un reflow pour que la transition soit désactivée immédiatement
      if (!animate) {
        carouselTrack.offsetHeight;
        carouselTrack.style.transition = 'transform 0.5s ease-in-out';
      }

      // Mettre à jour l'état actif des indicateurs
      updateDots();
    }

    // Mettre à jour l'apparence des points de navigation
    function updateDots() {
      if (!dotsContainer) return;

      const dots = dotsContainer.querySelectorAll('.carousel__indicator');

      // Vérifier si nous avons des points
      if (dots.length === 0) return;

      dots.forEach((dot, index) => {
        if (parseInt(dot.dataset.index) === currentIndex) {
          dot.classList.add('carousel__indicator--active');
        } else {
          dot.classList.remove('carousel__indicator--active');
        }
      });
    }

    // Aller au slide suivant (un par un)
    function nextSlide() {
      const maxIndex = getMaxIndex();
      if (currentIndex >= maxIndex) {
        goToSlide(0); // Revenir au début
      } else {
        goToSlide(currentIndex + 1); // Avancer d'un seul
      }
    }

    // Aller au slide précédent (un par un)
    function prevSlide() {
      if (currentIndex === 0) {
        const maxIndex = getMaxIndex();
        goToSlide(maxIndex); // Aller à la fin (sans dépasser)
      } else {
        goToSlide(currentIndex - 1); // Reculer d'un seul
      }
    }

    // Configuration de l'autoplay
    function startAutoplay() {
      stopAutoplay(); // Arrêter l'autoplay existant s'il y en a un
      autoplayInterval = setInterval(() => {
        nextSlide();
      }, 5000); // Changer de slide toutes les 5 secondes
    }

    // Arrêter l'autoplay
    function stopAutoplay() {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    }

    // Ajouter les écouteurs d'événements
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        nextSlide();
        stopAutoplay(); // Arrêter l'autoplay quand l'utilisateur interagit manuellement
      });
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        prevSlide();
        stopAutoplay(); // Arrêter l'autoplay quand l'utilisateur interagit manuellement
      });
    }

    // Gérer le redimensionnement de la fenêtre avec debounce
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateCarouselLayout();
      }, 250); // Attendre 250ms après la fin du redimensionnement
    });

    // Gérer les interactions tactiles pour le swipe
    let touchStartX = 0;
    let touchEndX = 0;

    carouselTrack.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoplay();
    }, { passive: true });

    carouselTrack.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const swipeThreshold = 50; // Seuil minimum pour détecter un swipe
      if (touchStartX - touchEndX > swipeThreshold) {
        // Swipe vers la gauche - aller au suivant
        nextSlide();
      } else if (touchEndX - touchStartX > swipeThreshold) {
        // Swipe vers la droite - aller au précédent
        prevSlide();
      }
    }

    // Arrêter l'autoplay lorsque la souris est sur le carousel
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    // Initialisation
    updateCarouselLayout();
    createDots();
    updateButtonsVisibility();
    startAutoplay();

    // Forcer une mise à jour après un court délai (pour corriger les problèmes d'initialisation)
    setTimeout(() => {
      updateCarouselLayout();
      updateButtonsVisibility();
    }, 100);
  }

  // ===== Article Cards Clickable =====

  /**
   * Rend les cartes d'articles cliquables tout en conservant les boutons
   */
  function initClickableCards() {
    // Sélectionner toutes les cartes d'articles, y compris featured-post
    const articleCards = document.querySelectorAll('.card, .post-card, .news__grid .card, .carousel .card, .featured-post');

    articleCards.forEach(card => {
      // Trouver le lien principal dans la carte (titre ou bouton)
      const mainLink = card.querySelector('a[href]');

      if (!mainLink) return; // Passer si aucun lien n'est trouvé

      // Récupérer l'URL de destination
      const targetUrl = mainLink.getAttribute('href');

      // Ajouter le curseur pointer sur la carte
      card.style.cursor = 'pointer';

      // Ajouter l'événement de clic sur la carte
      card.addEventListener('click', function(e) {
        // Vérifier si le clic provient d'un élément interactif
        const clickedElement = e.target;
        const isInteractiveElement = clickedElement.matches('a, button') ||
                                   clickedElement.closest('a, button');

        // Si le clic est sur un lien ou bouton, laisser le comportement par défaut
        if (isInteractiveElement) {
          return;
        }

        // Sinon, rediriger vers l'URL du lien principal
        window.location.href = targetUrl;
      });

      // Ajouter un effet visuel au survol de la carte
      card.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
      });

      card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '';
      });
    });
  }

  // ===== Section Title Animations =====

  function initSectionTitleAnimations() {
    // Check if GSAP is available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Animate all section titles
    const sectionTitles = document.querySelectorAll('.section-asymetrique h2, .news__title, .parallax p');

    sectionTitles.forEach(title => {
      // Split text into spans for character animation
      const text = title.textContent;
      title.innerHTML = '';

      text.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space
        span.style.display = 'inline-block';
        title.appendChild(span);
      });

      // Animate characters
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

  // ===== Initialization =====
  function init() {
    // Perform all initializations
    initMobileMenu();
    initAccessibility();
    initScrollAnimations();
    initHeroAnimation();
    initNavbarAnimations();
    initSectionTitleAnimations(); // Ajout des animations de titre
    initPostsCarousel(); // Initialisation du carousel
    initActiveNavigation(); // Initialisation de la navigation active
    initClickableCards(); // Initialisation des cartes cliquables

    // Refresh ScrollTrigger after everything is loaded
    if (typeof ScrollTrigger !== 'undefined') {
      // Attendre un court délai pour s'assurer que tout est bien chargé
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);

      // Refresh ScrollTrigger sur le resize également
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          ScrollTrigger.refresh();
        }, 250);
      });
    }

    // CORRECTION: Au lieu de manipuler directement le style, nous utilisons les classes CSS
    window.addEventListener('resize', () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        // En mode desktop, on s'assure que le menu est visible via CSS
        navMenu.classList.remove('active'); // On retire la classe active car elle n'est pas nécessaire en desktop
        navMenu.style.removeProperty('left'); // On supprime toute propriété left inline
      } else {
        // En mode mobile, on laisse le menu dans son état actuel (ouvert ou fermé)
        // mais on s'assurer qu'aucun style inline n'entre en conflit avec les classes CSS
        navMenu.style.removeProperty('left');
      }
    });
  }

  // Initialize when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded, run init immediately
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