// Pastille de rappel des démos : apparaît après ~40 % de défilement, fermable pour la session.
(function () {
  var el = document.querySelector('[data-demo-cta]');
  if (!el) return;
  var KEY = 'demo-cta-ferme';
  try { if (sessionStorage.getItem(KEY)) return; } catch (e) {}

  var shown = false;
  function update() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? window.scrollY / max : 1;
    var want = ratio > 0.4;
    if (want === shown) return;
    shown = want;
    if (want) {
      el.hidden = false;
      requestAnimationFrame(function () { el.classList.add('is-visible'); });
    } else {
      el.classList.remove('is-visible');
      setTimeout(function () { if (!shown) el.hidden = true; }, 300);
    }
  }

  el.querySelector('[data-demo-cta-fermer]').addEventListener('click', function () {
    window.removeEventListener('scroll', update);
    el.hidden = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
  });
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
