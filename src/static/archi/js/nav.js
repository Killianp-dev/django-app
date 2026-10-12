/**
 * Navigation mobile — ouverture et fermeture en fondu.
 */

(function() {
    'use strict';

    const toggle = document.querySelector('.archi-nav-mobile-toggle');
    const nav = document.getElementById('archi-nav-mobile');
    const header = document.querySelector('.archi-header');
    const CLOSE_MS = 450;

    if (!toggle || !nav) return;

    let closeToken = 0;

    function isOpen() {
        return toggle.getAttribute('aria-expanded') === 'true';
    }

    function placeNav() {
        const bar = header || document.querySelector('.archi-header');
        if (!bar) return;
        nav.style.top = bar.getBoundingClientRect().bottom + 'px';
    }

    function openNav() {
        closeToken += 1;
        placeNav();
        toggle.setAttribute('aria-expanded', 'true');
        nav.hidden = false;
        // Laisser le navigateur peindre l'état fermé avant d'animer.
        void nav.offsetHeight;
        nav.classList.add('is-open');
        nav.querySelector('a')?.focus();
    }

    function closeNav(options) {
        const token = closeToken += 1;
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');

        function finish() {
            if (token !== closeToken || isOpen()) return;
            nav.hidden = true;
        }

        function onEnd(event) {
            if (event.target !== nav || event.propertyName !== 'opacity') return;
            nav.removeEventListener('transitionend', onEnd);
            finish();
        }

        nav.addEventListener('transitionend', onEnd);
        window.setTimeout(function() {
            nav.removeEventListener('transitionend', onEnd);
            finish();
        }, CLOSE_MS);

        if (options && options.focusToggle) toggle.focus();
    }

    toggle.addEventListener('click', function(event) {
        event.stopPropagation();
        if (isOpen()) closeNav();
        else openNav();
    });

    window.addEventListener('resize', function() {
        if (isOpen()) placeNav();
    });

    window.addEventListener('scroll', function() {
        if (isOpen()) placeNav();
    }, { passive: true });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && isOpen()) closeNav({ focusToggle: true });
    });

    document.addEventListener('click', function(event) {
        if (!isOpen()) return;
        if (nav.contains(event.target) || toggle.contains(event.target)) return;
        closeNav();
    });
})();
