// Pastille de rappel des démos. Elle prend le relais du bandeau « Démonstration » :
// cachée tant qu'il est à l'écran, affichée dès qu'il en sort. Le visiteur a donc
// toujours un retour à l'accueil sous les yeux. La croix réduit la pastille à son
// rond « K » (retour à l'accueil) au lieu de la supprimer ; mémorisé pour la session.
(function () {
  var el = document.querySelector('[data-demo-cta]');
  if (!el) return;
  var banner = document.querySelector('.vitrine-demo-banner');
  var actionbar = document.querySelector('.vitrine-actionbar');
  var KEY = 'demo-cta-replie';

  try {
    // 'demo-cta-ferme' : ancienne clé (la croix masquait tout), lue comme « réduite ».
    if (sessionStorage.getItem(KEY) || sessionStorage.getItem('demo-cta-ferme')) {
      el.classList.add('is-replie');
    }
  } catch (e) {}

  // Au-dessus de la barre d'actions mobile, quand la démo l'affiche (seuil propre à chaque démo).
  function placer() {
    var h = actionbar && window.getComputedStyle(actionbar).display !== 'none' ? actionbar.offsetHeight : 0;
    if (h) {
      el.style.setProperty('--dc-bas', 'calc(' + h + 'px + .75rem)');
    } else {
      el.style.removeProperty('--dc-bas');
    }
  }

  var shown = false;
  var hideTimer = 0;
  function afficher(want) {
    if (want === shown) return;
    shown = want;
    window.clearTimeout(hideTimer);
    if (want) {
      placer();
      el.hidden = false;
      requestAnimationFrame(function () { el.classList.add('is-visible'); });
    } else {
      el.classList.remove('is-visible');
      hideTimer = window.setTimeout(function () { if (!shown) el.hidden = true; }, 300);
    }
  }

  el.querySelector('[data-demo-cta-fermer]').addEventListener('click', function () {
    el.classList.add('is-replie');
    // Le focus était sur la croix, qui disparaît : on le pose sur le rond de retour.
    el.querySelector('.demo-cta-flottant__retour').focus();
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
  });

  window.addEventListener('resize', placer);

  if (!banner || !('IntersectionObserver' in window)) {
    // Sans bandeau (ou navigateur ancien) : la pastille reste affichée.
    afficher(true);
    return;
  }

  new IntersectionObserver(function (entries) {
    afficher(!entries[entries.length - 1].isIntersecting);
  }).observe(banner);
})();
