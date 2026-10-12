/**
 * Navigation mobile simple (menu hamburger)
 */

(function() {
    'use strict';
    
    const toggle = document.querySelector('.archi-nav-mobile-toggle');
    const nav = document.getElementById('archi-nav-mobile');
    const header = document.querySelector('.archi-header');
    
    if (!toggle || !nav) return;

    function placeNav() {
        const bar = header || document.querySelector('.archi-header');
        if (!bar) return;
        nav.style.top = bar.getBoundingClientRect().bottom + 'px';
    }
    
    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        toggle.setAttribute('aria-expanded', String(!isExpanded));
        nav.hidden = isExpanded;
        
        if (!isExpanded) {
            placeNav();
            nav.querySelector('a')?.focus();
        }
    });

    window.addEventListener('resize', function() {
        if (!nav.hidden) placeNav();
    });

    window.addEventListener('scroll', function() {
        if (!nav.hidden) placeNav();
    }, { passive: true });
    
    // Fermer avec Échap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !nav.hidden) {
            toggle.setAttribute('aria-expanded', 'false');
            nav.hidden = true;
            toggle.focus();
        }
    });
    
    // Fermer si clic en dehors (optionnel)
    document.addEventListener('click', function(e) {
        if (!nav.hidden && !nav.contains(e.target) && !toggle.contains(e.target)) {
            toggle.setAttribute('aria-expanded', 'false');
            nav.hidden = true;
        }
    });
})();
