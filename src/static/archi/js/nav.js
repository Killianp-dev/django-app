/**
 * Navigation mobile simple (menu hamburger)
 */

(function() {
    'use strict';
    
    const toggle = document.querySelector('.archi-nav-mobile-toggle');
    const nav = document.getElementById('archi-nav-mobile');
    
    if (!toggle || !nav) return;
    
    toggle.addEventListener('click', function() {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        // Toggle état
        toggle.setAttribute('aria-expanded', !isExpanded);
        nav.hidden = isExpanded;
        
        // Piège focus si ouvert
        if (!isExpanded) {
            nav.querySelector('a')?.focus();
        }
    });
    
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
