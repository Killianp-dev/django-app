/**
 * Désactive le bouton d'envoi pendant la soumission (évite les doubles envois).
 */
(function () {
    'use strict';
    const form = document.querySelector('.vitrine-form');
    if (!form) return;

    form.addEventListener('submit', function () {
        const btn = form.querySelector('.vitrine-form__submit');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Envoi en cours...';
        }
    });
})();
