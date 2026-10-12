/**
 * Lightbox légère basée sur <dialog>.
 * Amélioration progressive : sans JS, les liens de la galerie ouvrent l'image directement.
 */
(function () {
    'use strict';

    const dialog = document.getElementById('archi-lightbox');
    if (!dialog) return;

    const items = Array.from(document.querySelectorAll('[data-lightbox="project-gallery"]'));
    if (!items.length) return;

    const imgEl = dialog.querySelector('[data-lightbox-image]');
    const captionEl = dialog.querySelector('[data-lightbox-caption]');
    const closeBtn = dialog.querySelector('[data-lightbox-close]');
    const prevBtn = dialog.querySelector('[data-lightbox-prev]');
    const nextBtn = dialog.querySelector('[data-lightbox-next]');

    let currentIndex = 0;
    let triggerEl = null;

    function show(index) {
        currentIndex = (index + items.length) % items.length;
        const item = items[currentIndex];
        imgEl.src = item.getAttribute('href');
        imgEl.alt = item.querySelector('img')?.alt || '';
        captionEl.textContent = item.getAttribute('data-caption') || '';
    }

    function open(index, trigger) {
        triggerEl = trigger;
        show(index);
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        }
    }

    function close() {
        dialog.close();
        if (triggerEl) triggerEl.focus();
    }

    items.forEach((item, index) => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            open(index, item);
        });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => show(currentIndex - 1));
    nextBtn.addEventListener('click', () => show(currentIndex + 1));

    dialog.addEventListener('click', function (e) {
        if (e.target === dialog) close();
    });

    dialog.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') show(currentIndex - 1);
        if (e.key === 'ArrowRight') show(currentIndex + 1);
    });
})();
