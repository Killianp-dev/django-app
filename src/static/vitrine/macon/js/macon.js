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

  // ===== Estimateur au mètre ruban =====
  // Un ouvrage (radios), une quantité (le mètre : un range natif habillé), un montant
  // « à partir de » qui défile vers sa nouvelle valeur. Le ruban sort du boîtier jusqu'au
  // curseur (--p) ; ses graduations suivent l'échelle de l'ouvrage choisi.
  function initEstimateur() {
    document.querySelectorAll('[data-estimateur]').forEach((bloc) => {
      const form = bloc.querySelector('[data-estimateur-form]');
      const radios = Array.from(bloc.querySelectorAll('input[name="ouvrage"]'));
      const metre = bloc.querySelector('[data-metre]');
      const curseur = bloc.querySelector('[data-curseur]');
      const graduations = bloc.querySelector('[data-graduations]');
      const sortie = bloc.querySelector('[data-total]');
      const quantiteCote = bloc.querySelector('[data-quantite-cote]');
      const ouvrageNom = bloc.querySelector('[data-ouvrage-nom]');
      const piste = bloc.querySelector('[data-piste]');
      const mesureLabel = bloc.querySelector('[data-mesure-label]');
      const note = bloc.querySelector('[data-note-texte]');
      const annonce = bloc.querySelector('[data-annonce]');
      const champOffre = bloc.querySelector('[data-champ-offre]');
      const champEstimation = bloc.querySelector('[data-champ-estimation]');
      if (!form || !radios.length || !curseur) return;

      const euros = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
      // Espaces des milliers : insécables, pour que « 22 000 » ne se coupe jamais.
      const format = (n) => euros.format(n).replace(/[\u202f\u00a0 ]/g, '\u202f');
      const motion = window.vitrineMotion;
      let ouvrage = null;
      let affiche = 0;
      let animation = null;

      const quantite = () => Number(curseur.value);
      const total = () => quantite() * Number(ouvrage.dataset.prix);
      const unite = () => ouvrage.dataset.unite;

      function afficherMontant(cible, instantane) {
        if (animation) animation.stop();
        if (!motion || reduceMotion || instantane) {
          affiche = cible;
          sortie.textContent = format(cible);
          return;
        }
        const depart = affiche;
        animation = motion.animate(depart, cible, {
          duration: 0.45,
          ease: motion.EASE,
          onUpdate: (v) => { affiche = v; sortie.textContent = format(Math.round(v)); }
        });
      }

      // Graduations : un tic par unité (ou par 2, 5, 10 si l'échelle est longue), un chiffre aux grands tics.
      function graduer() {
        const min = Number(curseur.min);
        const max = Number(curseur.max);
        const etendue = max - min;
        const pas = etendue <= 40 ? 1 : etendue <= 100 ? 2 : 5;
        const grand = pas * 5;
        metre.style.setProperty('--tics', String(etendue / pas));
        metre.style.setProperty('--grands', String(etendue / grand));
        graduations.replaceChildren();
        for (let v = Math.ceil(min / grand) * grand; v <= max; v += grand) {
          const chiffre = document.createElement('span');
          chiffre.textContent = String(v);
          chiffre.style.left = `${((v - min) / etendue) * 100}%`;
          graduations.appendChild(chiffre);
        }
      }

      function mettreAJour(instantane) {
        const min = Number(curseur.min);
        const max = Number(curseur.max);
        const q = quantite();
        metre.style.setProperty('--p', String((q - min) / (max - min)));
        const texteQuantite = `${q}\u00a0${unite()}`;
        quantiteCote.textContent = texteQuantite;
        curseur.setAttribute('aria-valuetext', `${texteQuantite}, à partir de ${format(total())} euros hors taxes`);
        afficherMontant(total(), instantane);
        champEstimation.value = `Estimation en ligne : ${ouvrage.dataset.nom.toLowerCase()}, ${q} ${unite()}, à partir de ${format(total())} € HT.`;
      }

      function choisir(radio, instantane) {
        ouvrage = radio;
        curseur.min = radio.dataset.min;
        curseur.max = radio.dataset.max;
        curseur.value = radio.dataset.defaut;
        ouvrageNom.textContent = radio.dataset.nom;
        piste.dataset.max = `${radio.dataset.max}\u00a0${radio.dataset.unite}`;
        mesureLabel.textContent = `${radio.dataset.mesure} en ${radio.dataset.unite === 'ml' ? 'mètres linéaires' : 'mètres carrés'}`;
        note.textContent = radio.dataset.note;
        champOffre.value = radio.dataset.offre;
        graduer();
        mettreAJour(instantane);
      }

      radios.forEach((radio) => radio.addEventListener('change', () => {
        choisir(radio, false);
        annonce.textContent = `${radio.dataset.nom} : à partir de ${format(total())} euros hors taxes pour ${quantite()} ${unite()}.`;
      }));
      curseur.addEventListener('input', () => mettreAJour(false));
      // Annonce aux lecteurs d'écran au relâchement seulement, pas à chaque cran.
      curseur.addEventListener('change', () => {
        annonce.textContent = `À partir de ${format(total())} euros hors taxes pour ${quantite()} ${unite()}.`;
      });

      // Envoi : une adresse propre vers le contact, avec le savoir-faire et le résumé.
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const url = new URL(form.action, window.location.href);
        url.searchParams.set('prestation', champOffre.value);
        url.searchParams.set('estimation', champEstimation.value);
        window.location.href = url.toString();
      });

      choisir(radios.find((r) => r.checked) || radios[0], true);
      bloc.hidden = false;
    });
  }

  function init() {
    initCotes();
    initEstimateur();
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
