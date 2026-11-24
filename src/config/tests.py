import re
from datetime import date

from django.core import mail
from django.test import TestCase
from django.urls import reverse

from blog.models import BlogPost
from contact_form.models import Contact
from contact_form.tests import contact_payload


class StaticPageTests(TestCase):
    def test_home_ok(self):
        response = self.client.get(reverse("index"))
        self.assertEqual(response.status_code, 200)

    def test_home_hides_unpublished_posts(self):
        published = BlogPost.objects.create(
            title="Public home",
            published=True,
            created_on=date.today(),
        )
        BlogPost.objects.create(
            title="Draft home",
            published=False,
            created_on=date.today(),
        )
        response = self.client.get(reverse("index"))
        latest = list(response.context["latest_posts"])
        self.assertEqual(latest, [published])

    def test_home_contact_post_saves_and_redirects(self):
        response = self.client.post(
            reverse("index"),
            contact_payload(subject="Accueil"),
        )
        self.assertRedirects(response, reverse("success"))
        self.assertEqual(Contact.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_mentions_legales_ok(self):
        response = self.client.get(reverse("mentions_legales"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            "Agence de conseil et d'expertise informatique, spécialisée dans le référencement SEO",
        )

    def test_cgv_ok(self):
        response = self.client.get(reverse("cgv"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Conditions générales de vente")
        self.assertContains(response, "Killian&nbsp;P.")

    def test_prix_a_partir_de_sur_l_accueil_pas_dans_les_cgv(self):
        # Prix « à partir de » réglés dans config/tarifs.py ; le prix exact reste dans le devis.
        from config.tarifs import tarifs
        t = tarifs()
        home = self.client.get(reverse("index")).content.decode()
        self.assertIn('id="formule"', home)
        self.assertIn(f"{t.creation_affiche}&nbsp;€", home)
        self.assertIn(f"{t.abonnement}&nbsp;€", home)
        cgv = self.client.get(reverse("cgv")).content.decode()
        for montant in ("300 €", "500 €", "40 € par mois"):
            self.assertNotIn(montant, cgv)

    def test_offre_temporaire_s_arrete_seule(self):
        from datetime import timedelta
        from config.tarifs import PROMO, tarifs
        if PROMO is None:
            self.skipTest("Pas d'offre en cours")
        self.assertEqual(tarifs(PROMO.fin).creation_affiche, PROMO.prix)
        apres = tarifs(PROMO.fin + timedelta(days=1))
        self.assertIsNone(apres.promo)
        self.assertEqual(apres.creation_affiche, apres.creation)

    def test_legal_pages_never_show_full_name(self):
        for name in ("cgv", "mentions_legales"):
            body = self.client.get(reverse(name)).content.decode().lower()
            self.assertNotIn("pasche", body)

    def test_robots_txt(self):
        response = self.client.get("/robots.txt")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/plain")
        self.assertIn("Disallow: /secure-admin-portal/", response.content.decode())
        self.assertIn("Sitemap:", response.content.decode())

    def test_sitemap_includes_published_post(self):
        post = BlogPost.objects.create(
            title="Dans le sitemap",
            published=True,
            created_on=date.today(),
        )
        BlogPost.objects.create(title="Pas dans le sitemap", published=False)
        response = self.client.get("/sitemap.xml")
        self.assertEqual(response.status_code, 200)
        body = response.content.decode()
        self.assertIn(post.get_absolute_url(), body)
        self.assertNotIn("pas-dans-le-sitemap", body)


class SeoTests(TestCase):
    """Référencement : pages métier, balises communes, robots et sitemap."""

    def test_page_metier_boulangerie(self):
        response = self.client.get("/creation-site-internet/boulangerie/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<title>Référencement et site internet pour boulangerie · killianp-dev</title>", html=False)
        self.assertContains(response, 'Référencement et site internet <span class="metier-hero__pour">pour boulangerie</span>')
        self.assertContains(response, '<link rel="canonical" href="https://www.killianp-dev.fr/creation-site-internet/boulangerie/">')
        self.assertContains(response, '"@type": "FAQPage"')
        self.assertContains(response, '"@type": "Service"')
        self.assertContains(response, "/demo-boulangerie/")
        self.assertContains(response, "?sujet=R%C3%A9f%C3%A9rencement%20%E2%80%94%20Boulangerie")

    def test_toutes_les_pages_metier_repondent(self):
        from config.metiers import metiers
        for metier in metiers():
            with self.subTest(metier=metier.slug):
                self.assertEqual(self.client.get(metier.url).status_code, 200)

    def test_metier_inconnu(self):
        self.assertEqual(self.client.get("/creation-site-internet/fleuriste/").status_code, 404)

    def test_accueil_balises(self):
        response = self.client.get(reverse("index"))
        self.assertContains(response, '<link rel="canonical" href="https://www.killianp-dev.fr/">')
        self.assertContains(response, 'property="og:image"')
        self.assertContains(response, '"@type": "ProfessionalService"')
        self.assertContains(response, "Référencement SEO et site internet pour commerçants et artisans")
        self.assertContains(response, "/creation-site-internet/boulangerie/")

    def test_robots_laisse_lire_les_demos(self):
        body = self.client.get("/robots.txt").content.decode()
        self.assertNotIn("/demo-", body)
        self.assertIn("Sitemap: https://www.killianp-dev.fr/sitemap.xml", body)

    def test_demos_non_indexees(self):
        response = self.client.get("/demo-boulangerie/")
        self.assertContains(response, '<meta name="robots" content="noindex, follow">')

    def test_confirmation_non_indexee(self):
        response = self.client.get(reverse("success"))
        self.assertContains(response, '<meta name="robots" content="noindex">')

    def test_sitemap_contient_les_pages_metier(self):
        body = self.client.get("/sitemap.xml").content.decode()
        self.assertIn("/creation-site-internet/boulangerie/", body)
        self.assertIn("https://", body)

    def test_blog_separe_conseils_et_notes(self):
        conseil = BlogPost.objects.create(title="Site internet pour fleuriste", published=True,
                                          created_on=date.today(), category=BlogPost.COMMERCE)
        note = BlogPost.objects.create(title="Numpy en pratique", published=True,
                                       created_on=date.today(), category=BlogPost.TECHNIQUE)
        conseils = list(self.client.get(reverse("blog:home")).context["posts"])
        notes = list(self.client.get(reverse("blog:notes")).context["posts"])
        self.assertIn(conseil, conseils)
        self.assertNotIn(note, conseils)
        self.assertIn(note, notes)
        self.assertNotIn(conseil, notes)

    def test_ordre_des_sections_de_l_accueil(self):
        # Exemples, séparateur, Déroulement, Blog, À propos, Formule ; le menu suit le même ordre
        # (initActiveNavigation allume le dernier lien, dans l'ordre du menu, dont la section est passée).
        BlogPost.objects.create(title="Article", published=True, category=BlogPost.COMMERCE)
        html = self.client.get(reverse("index")).content.decode()
        sections = ['id="exemples"', 'class="section-divider"', 'id="deroulement"', 'id="blog"',
                    'id="a-propos"', 'id="formule"']
        positions = [html.index(marque) for marque in sections]
        self.assertEqual(positions, sorted(positions))
        menu = html[html.index('class="nav-links'):html.index('class="nav-menu__footer"')]
        libelles = re.findall(r'class="nav-links__label">([^<]+)<', menu)
        self.assertEqual(libelles, ["Accueil", "Exemples", "Blog", "À propos", "Formule"])

    def test_pas_de_commentaire_de_gabarit_affiche(self):
        # Un {# … #} sur plusieurs lignes n'est pas un commentaire pour Django : il s'afficherait.
        BlogPost.objects.create(title="Article", published=True, category=BlogPost.COMMERCE)
        html = self.client.get(reverse("index")).content.decode()
        self.assertNotIn("{#", html)
        self.assertNotIn("#}", html)

    def test_ordre_de_la_section_exemples(self):
        exemples = self.client.get(reverse("index")).context["exemples"]
        ordre = [projet.namespace for projet in exemples]
        self.assertEqual(ordre[0], "macon")
        self.assertEqual(ordre[2], "boulangerie")
        self.assertEqual(ordre[4], "beaute")
        self.assertEqual(ordre[-1], "avocat")          # l'avocat ouvre le carrousel : il ferme le sous-menu
        self.assertEqual(sorted(ordre), sorted(p.namespace for p in exemples))

    def test_sous_menu_exemples_liste_les_demos(self):
        # Sur toutes les pages du site (le menu est commun), dans l'ordre de la section Exemples.
        for url in [reverse("index"), reverse("blog:home"), reverse("mentions_legales")]:
            with self.subTest(url=url):
                html = self.client.get(url).content.decode()
                menu = html[html.index('class="nav-demos"'):html.index('class="nav-menu__footer"')]
                liens = re.findall(r'class="nav-demos__link" href="([^"]+)"', menu)
                self.assertEqual(liens, ["/demo-macon/", "/demo-boucherie/", "/demo-boulangerie/",
                                         "/demo-coiffeur/", "/demo-institut/", "/demo-avocat/"])

    def test_plus_de_tirette(self):
        # La tirette de thème a été retirée : seul le bouton de l'en-tête bascule le thème.
        post = BlogPost.objects.create(title="Article sans tirette", published=True)
        for url in [reverse("index"), reverse("blog:home"), post.get_absolute_url(), reverse("cgv")]:
            with self.subTest(url=url):
                html = self.client.get(url).content.decode()
                self.assertNotIn("data-pull-cord", html)
                self.assertIn('class="theme-toggle"', html)


class AuditCorrectionsTests(TestCase):
    """Corrections de l'audit du 24/11/2026 sur le portfolio."""

    def test_page_404_du_site(self):
        reponse = self.client.get("/page-qui-n-existe-pas/")
        self.assertEqual(reponse.status_code, 404)
        self.assertTemplateUsed(reponse, "404.html")
        html = reponse.content.decode()
        self.assertIn('<html lang="fr"', html)
        self.assertIn('<meta name="robots" content="noindex">', html)
        self.assertIn("/demo-avocat/", html)

    def test_page_confidentialite_et_gestion_des_cookies(self):
        html = self.client.get(reverse("confidentialite")).content.decode()
        self.assertIn("Google Analytics", html)
        self.assertIn("data-cookie-settings", html)
        accueil = self.client.get(reverse("index")).content.decode()
        self.assertIn(f'href="{reverse("confidentialite")}"', accueil)
        self.assertIn('class="footer__cookies"', accueil)

    def test_un_seul_main_et_lien_d_evitement(self):
        for url in [reverse("index"), reverse("blog:home"), reverse("mentions_legales"), reverse("contact_form:contact")]:
            with self.subTest(url=url):
                html = self.client.get(url).content.decode()
                self.assertEqual(html.count("<main"), 1)
                self.assertIn('<main id="main-content"', html)

    def test_en_tetes_de_securite(self):
        reponse = self.client.get(reverse("index"))
        self.assertIn("default-src 'self'", reponse.headers["Content-Security-Policy-Report-Only"])
        self.assertIn("frame-src https://www.youtube-nocookie.com", reponse.headers["Content-Security-Policy-Report-Only"])
        self.assertIn("camera=()", reponse.headers["Permissions-Policy"])

    def test_polices_servies_par_le_site(self):
        html = self.client.get(reverse("index")).content.decode()
        self.assertNotIn("fonts.googleapis.com", html)
        self.assertIn("fonts/InstrumentSerif-latin.woff2", html)
        self.assertNotIn("css/main.css", html)

    def test_contact_enregistre_meme_si_l_email_echoue(self):
        from unittest import mock
        with mock.patch("contact_form.views.send_mail", side_effect=OSError("SMTP indisponible")):
            reponse = self.client.post(reverse("contact_form:contact"), contact_payload())
        self.assertRedirects(reponse, reverse("contact_form:success"))
        self.assertEqual(Contact.objects.count(), 1)


class RetoursDu24NovembreTests(TestCase):
    """Retours du 24/11/2026 : photo, marque, menu, prix."""

    def test_photo_reelle_exclue_de_google_images(self):
        robots = self.client.get("/robots.txt").content.decode()
        self.assertIn("Disallow: /static/ressources/portrait/", robots)
        accueil = self.client.get(reverse("index")).content.decode()
        # À propos montre la vraie photo, servie depuis le dossier interdit aux robots.
        self.assertIn("ressources/portrait/killian.jpg", accueil)
        self.assertNotIn("killian-aplat", accueil)
        # La photo n'est ni l'image de partage ni celle des données structurées.
        self.assertNotIn("portrait/", accueil.split("</head>")[0])

    def test_marque_killianp_dev(self):
        accueil = self.client.get(reverse("index")).content.decode()
        self.assertNotIn("killianp.dev", accueil)
        self.assertIn('<span class="logo-name">killianp-<span class="logo-dot">dev</span></span>', accueil)

    def test_chevron_du_sous_menu_exemples(self):
        html = self.client.get(reverse("blog:home")).content.decode()
        self.assertIn('class="nav-links__chevron"', html)
        self.assertNotIn("nav-links__losange", html)

    def test_menu_sans_numerotation(self):
        # Les liens du menu ne forment pas une suite : pas de « 01 … 05 », pas d'étiquette « Menu ».
        html = self.client.get(reverse("index")).content.decode()
        self.assertNotIn("nav-links__index", html)
        self.assertNotIn("nav-menu__kicker", html)

    def test_pas_de_mot_en_italique_dans_les_titres(self):
        accueil = self.client.get(reverse("index")).content.decode()
        self.assertNotRegex(accueil, r"<h[12][^>]*>[^<]*<em>")
        self.assertNotIn("projects__intro-lead", accueil)
