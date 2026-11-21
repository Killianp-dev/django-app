/**
 * Bertrand Maçonnerie — améliorations propres à la démo.
 * Sans JavaScript, tout reste utilisable : le menu s'ouvre au survol et au focus clavier (CSS).
 */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // ===== Hero : les valeurs des cotes défilent pendant que les traits se tracent =====
  // Le CSS trace les cotes et fait apparaître les valeurs (utilities/_mouvement.css) ;
  // avec Motion (vitrine/js/anim.js), « 20 cm » part de zéro au même moment.
  function initCotes() {
    const motion = window.vitrineMotion;
    if (!motion || reduceMotion) return;
    document.querySelectorAll('.cotes__valeur').forEach((texte) => {
      const match = texte.textContent.match(/^(\d+)(.*)$/);
      if (!match) return;
      const cible = Number(match[1]);
      const suite = match[2];
      texte.textContent = `0${suite}`;
      motion.animate(0, cible, {
        delay: 0.85,
        duration: 0.75,
        ease: motion.EASE,
        onUpdate: (valeur) => { texte.textContent = `${Math.round(valeur)}${suite}`; }
      });
    });
  }

  // ===== « Préparer votre demande » : le type de travaux, puis le délai au mètre ruban =====
  // Le mètre (un range natif habillé) se règle en semaines, de « dès que possible » à six mois.
  // Le ruban sort du boîtier jusqu'au curseur (--p) ; une graduation par semaine, un repère
  // par mois. Le bouton ouvre le contact avec les travaux et le délai déjà notés.
  function initDemande() {
    document.querySelectorAll('[data-demande]').forEach((bloc) => {
      const form = bloc.querySelector('[data-demande-form]');
      const radios = Array.from(bloc.querySelectorAll('input[name="travaux"]'));
      const metre = bloc.querySelector('[data-metre]');
      const curseur = bloc.querySelector('[data-curseur]');
      const graduations = bloc.querySelector('[data-graduations]');
      const sortie = bloc.querySelector('[data-delai]');
      const cote = bloc.querySelector('[data-delai-cote]');
      const travauxNom = bloc.querySelector('[data-travaux-nom]');
      const annonce = bloc.querySelector('[data-annonce]');
      if (!form || !radios.length || !curseur) return;

      const SEMAINES_PAR_MOIS = 52 / 12;
      const travaux = () => (radios.find((r) => r.checked) || radios[0]).value;
      const semaines = () => Number(curseur.value);

      // « Dès que possible », « Dans 3 semaines », puis en mois au-delà de 7 semaines.
      function delai(n) {
        if (n === 0) return 'Dès que possible';
        if (n === 1) return 'Dans 1 semaine';
        if (n < 8) return `Dans ${n} semaines`;
        return `Dans ${Math.round(n / SEMAINES_PAR_MOIS)} mois`;
      }
      const delaiCourt = (n) => (n === 0 ? 'tout de suite' : n < 8 ? `${n} sem.` : `${Math.round(n / SEMAINES_PAR_MOIS)} mois`);

      // Graduations : un tic par semaine (CSS), un repère chiffré à chaque mois.
      const max = Number(curseur.max);
      metre.style.setProperty('--tics', String(max));
      for (let mois = 1; mois * SEMAINES_PAR_MOIS <= max + 0.5; mois += 1) {
        const repere = document.createElement('span');
        repere.textContent = `${mois} mois`;
        repere.style.left = `${Math.min((mois * SEMAINES_PAR_MOIS) / max, 1) * 100}%`;
        graduations.appendChild(repere);
      }

      function mettreAJour() {
        const n = semaines();
        metre.style.setProperty('--p', String(n / max));
        cote.textContent = delaiCourt(n);
        sortie.textContent = delai(n);
        travauxNom.textContent = travaux();
        curseur.setAttribute('aria-valuetext', delai(n).toLowerCase());
      }

      radios.forEach((radio) => radio.addEventListener('change', () => {
        mettreAJour();
        annonce.textContent = `${travaux()}, début souhaité : ${delai(semaines()).toLowerCase()}.`;
      }));
      curseur.addEventListener('input', mettreAJour);
      // Annonce aux lecteurs d'écran au relâchement seulement, pas à chaque cran.
      curseur.addEventListener('change', () => {
        annonce.textContent = `Début souhaité : ${delai(semaines()).toLowerCase()}.`;
      });

      // Envoi : une adresse propre vers le contact, travaux présélectionnés, délai dans le message.
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const url = new URL(form.action, window.location.href);
        url.searchParams.set('prestation', travaux());
        url.searchParams.set('demande', `${travaux()} : début souhaité ${delai(semaines()).toLowerCase()}.`);
        window.location.href = url.toString();
      });

      mettreAJour();
      bloc.hidden = false;
    });
  }

  // ===== Carnet : le tampon de réception se pose quand on arrive au bas du carnet =====
  // Le CSS le cache tant que les animations sont actives (classe « anim ») ; sans elles, il est déjà là.
  function initTampon() {
    const tampon = document.querySelector('[data-tampon]');
    if (!tampon) return;
    if (!document.documentElement.classList.contains('anim') || !('IntersectionObserver' in window)) {
      tampon.classList.add('is-pose');
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      window.setTimeout(() => tampon.classList.add('is-pose'), 250);
    }, { rootMargin: '0px 0px -18% 0px', threshold: 1 });
    observer.observe(tampon);
  }

  function init() {
    initCotes();
    initTampon();
    initDemande();
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
