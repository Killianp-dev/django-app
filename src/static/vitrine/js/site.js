/**
 * Vitrine — améliorations progressives :
 *  1. état d'ouverture calculé à l'heure de Paris, jour courant mis en avant ;
 *  2. galerie filtrable et visionneuse (dialog natif, clavier et balayage).
 * Sans JavaScript, les horaires restent lisibles et chaque photo s'ouvre en lien direct.
 */
(function () {
    'use strict';

    /* ---------- 1. Horaires ---------- */
    const source = document.getElementById('vitrine-horaires');

    function parisNow() {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Paris',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        }).formatToParts(new Date());
        const get = (type) => parts.find((p) => p.type === type).value;
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return {
            day: days.indexOf(get('weekday')),          // 0 = lundi
            minutes: Number(get('hour')) * 60 + Number(get('minute'))
        };
    }

    const toMinutes = (hhmm) => {
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + (m || 0);
    };
    const toLabel = (hhmm) => {
        const [h, m] = hhmm.split(':');
        return Number(h) + 'h' + (m && m !== '00' ? m : '');
    };

    function computeStatus(week, now) {
        const today = week[now.day];
        if (today.ouverture) {
            const open = toMinutes(today.ouverture);
            const close = toMinutes(today.fermeture);
            if (now.minutes >= open && now.minutes < close) {
                const left = close - now.minutes;
                return {
                    open: true,
                    soon: left <= 60,
                    text: left <= 60
                        ? 'Ouvert · ferme à ' + toLabel(today.fermeture)
                        : "Ouvert aujourd'hui jusqu'à " + toLabel(today.fermeture)
                };
            }
            if (now.minutes < open) {
                return { open: false, text: 'Fermé · ouvre à ' + toLabel(today.ouverture) };
            }
        }
        for (let step = 1; step <= 7; step += 1) {
            const index = (now.day + step) % 7;
            const day = week[index];
            if (!day.ouverture) continue;
            const when = step === 1 ? 'demain' : day.nom.toLowerCase();
            return { open: false, text: 'Fermé · ouvre ' + when + ' à ' + toLabel(day.ouverture) };
        }
        return null;
    }

    if (source) {
        let week = null;
        try {
            week = JSON.parse(source.textContent);
        } catch (error) {
            week = null;
        }

        if (Array.isArray(week) && week.length === 7) {
            const render = () => {
                const now = parisNow();
                const status = computeStatus(week, now);

                document.querySelectorAll('[data-statut]').forEach((el) => {
                    if (!status) return;
                    el.hidden = false;
                    el.classList.toggle('is-open', status.open);
                    el.classList.toggle('is-soon', Boolean(status.soon));
                    el.querySelector('[data-statut-texte]').textContent = status.text;
                });

                document.querySelectorAll('[data-horaires] tr[data-jour]').forEach((row) => {
                    const isToday = Number(row.dataset.jour) === now.day;
                    row.classList.toggle('is-today', isToday);
                    if (isToday) row.setAttribute('aria-current', 'date');
                    else row.removeAttribute('aria-current');
                });
            };
            render();
            window.setInterval(render, 60 * 1000);
        }
    }

    /* ---------- 1 bis. Fournées (boulangerie) ---------- */
    const fournees = document.querySelector('[data-fournees]');
    const prochaine = document.querySelector('[data-fournee-prochaine]');
    if ((fournees || prochaine) && source) {
        let week = null;
        try { week = JSON.parse(source.textContent); } catch (error) { week = null; }
        const items = fournees ? Array.from(fournees.querySelectorAll('[data-heure]')) : [];
        const liste = items.map((el) => ({
            el,
            minutes: toMinutes(el.dataset.heure),
            libelle: el.querySelector('.boul-fournee__heure').textContent.trim(),
            produit: el.querySelector('.boul-fournee__produit').textContent.trim()
        }));

        const renderFournees = () => {
            if (!Array.isArray(week) || !liste.length) return;
            const now = parisNow();
            const today = week[now.day];
            const ouvert = Boolean(today && today.ouverture);
            const fermeture = ouvert ? toMinutes(today.fermeture) : 0;
            let suivante = null;

            liste.forEach((f) => {
                const possible = ouvert && f.minutes < fermeture;
                const passee = possible && f.minutes <= now.minutes;
                const estSuivante = !suivante && possible && f.minutes > now.minutes;
                if (estSuivante) suivante = f;
                f.el.classList.toggle('is-done', passee);
                f.el.classList.toggle('is-next', estSuivante);
                f.el.classList.toggle('is-off', !possible);
                const etat = f.el.querySelector('[data-fournee-etat]');
                if (etat) etat.textContent = estSuivante ? 'Prochaine' : passee ? 'Sortie du four' : possible ? 'À venir' : "Pas aujourd'hui";
            });

            if (!prochaine) return;
            let texte;
            if (suivante) {
                texte = suivante.libelle + ' · ' + suivante.produit;
            } else {
                for (let step = 1; step <= 7; step += 1) {
                    const jour = week[(now.day + step) % 7];
                    if (!jour.ouverture) continue;
                    texte = (step === 1 ? 'Demain' : jour.nom) + ', ' + liste[0].libelle + ' · ' + liste[0].produit;
                    break;
                }
            }
            if (texte) {
                prochaine.hidden = false;
                prochaine.querySelector('[data-fournee-texte]').textContent = texte;
            }
        };
        renderFournees();
        window.setInterval(renderFournees, 60 * 1000);
    }

    /* ---------- 1 ter. Devis : bascule du taux de TVA (maçon) ---------- */
    document.querySelectorAll('[data-devis]').forEach((devis) => {
        const tva = devis.querySelector('[data-devis-tva]');
        const ttc = devis.querySelector('[data-devis-ttc]');
        const label = devis.querySelector('[data-devis-taux-label]');
        devis.addEventListener('change', (event) => {
            const input = event.target.closest('input[name="devis-taux"]');
            if (!input) return;
            tva.textContent = input.dataset.tva;
            ttc.textContent = input.dataset.ttc;
            label.textContent = input.value + ' %';
            [tva, ttc].forEach((el) => {
                el.classList.remove('is-updated');
                void el.offsetWidth;
                el.classList.add('is-updated');
            });
        });
    });

    /* ---------- 1 quater. Calculateur de quantités (boucherie) ---------- */
    document.querySelectorAll('[data-calculateur]').forEach((form) => {
        const select = form.querySelector('select[name="piece"]');
        const input = form.querySelector('input[name="convives"]');
        const poids = form.querySelector('[data-calcul-poids]');
        const conseil = form.querySelector('[data-calcul-conseil]');
        const fallback = form.parentElement.querySelector('[data-calcul-fallback]');
        const formatKg = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

        const update = () => {
            const convives = Math.min(40, Math.max(1, parseInt(input.value, 10) || 1));
            input.value = convives;
            const grammes = Number(select.value) * convives;
            // Arrondi aux 50 g supérieurs : c'est ainsi qu'on coupe au comptoir.
            const arrondi = Math.ceil(grammes / 50) * 50;
            poids.textContent = arrondi >= 1000
                ? 'Prévoir environ ' + formatKg.format(arrondi / 1000) + ' kg'
                : 'Prévoir environ ' + arrondi + ' g';
            conseil.textContent = select.selectedOptions[0].dataset.conseil;
        };

        form.hidden = false;
        if (fallback) fallback.hidden = true;
        form.addEventListener('input', update);
        form.addEventListener('submit', (event) => event.preventDefault());
        form.querySelectorAll('[data-step]').forEach((button) => {
            button.addEventListener('click', () => {
                input.value = (parseInt(input.value, 10) || 1) + Number(button.dataset.step);
                update();
            });
        });
        update();
    });

    /* ---------- 2. Galerie ---------- */
    document.querySelectorAll('[data-galerie]').forEach((galerie) => {
        const items = Array.from(galerie.querySelectorAll('.vitrine-galerie__item'));
        const filtres = galerie.querySelector('[data-galerie-filtres]');
        const statut = galerie.querySelector('[data-galerie-statut]');
        const dialog = galerie.querySelector('[data-lightbox]');

        if (filtres) {
            filtres.hidden = false;
            const buttons = Array.from(filtres.querySelectorAll('[data-filtre]'));

            filtres.addEventListener('click', (event) => {
                const button = event.target.closest('[data-filtre]');
                if (!button) return;
                const value = button.dataset.filtre;
                buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));

                let visible = 0;
                items.forEach((item) => {
                    const show = !value || item.dataset.filtre === value;
                    item.hidden = !show;
                    if (show) visible += 1;
                });
                if (statut) {
                    statut.textContent = visible + ' réalisation' + (visible > 1 ? 's' : '') + ' affichée' + (visible > 1 ? 's' : '');
                }
            });
        }

        if (!dialog || typeof dialog.showModal !== 'function') return;

        const img = dialog.querySelector('[data-lightbox-img]');
        const titre = dialog.querySelector('[data-lightbox-titre]');
        const tag = dialog.querySelector('[data-lightbox-tag]');
        const count = dialog.querySelector('[data-lightbox-count]');
        let current = 0;

        const visibleLinks = () => items
            .filter((item) => !item.hidden)
            .map((item) => item.querySelector('[data-galerie-ouvrir]'));

        function show(index) {
            const links = visibleLinks();
            if (!links.length) return;
            current = (index + links.length) % links.length;
            const link = links[current];
            const thumb = link.querySelector('img');
            img.src = link.getAttribute('href');
            img.alt = thumb ? thumb.alt : '';
            titre.textContent = link.dataset.titre || '';
            tag.textContent = link.dataset.filtreLabel || '';
            count.textContent = (current + 1) + ' / ' + links.length;
        }

        galerie.addEventListener('click', (event) => {
            const link = event.target.closest('[data-galerie-ouvrir]');
            if (!link) return;
            event.preventDefault();
            show(visibleLinks().indexOf(link));
            dialog.showModal();
        });

        dialog.querySelector('[data-lightbox-fermer]').addEventListener('click', () => dialog.close());
        dialog.querySelector('[data-lightbox-prec]').addEventListener('click', () => show(current - 1));
        dialog.querySelector('[data-lightbox-suiv]').addEventListener('click', () => show(current + 1));

        // Clic sur le fond : fermeture.
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) dialog.close();
        });

        dialog.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') show(current - 1);
            if (event.key === 'ArrowRight') show(current + 1);
        });

        // Balayage horizontal sur écran tactile.
        let startX = null;
        dialog.addEventListener('touchstart', (event) => {
            startX = event.touches[0].clientX;
        }, { passive: true });
        dialog.addEventListener('touchend', (event) => {
            if (startX === null) return;
            const delta = event.changedTouches[0].clientX - startX;
            if (Math.abs(delta) > 50) show(current + (delta < 0 ? 1 : -1));
            startX = null;
        }, { passive: true });

        dialog.addEventListener('close', () => {
            img.removeAttribute('src');
        });
    });
})();
