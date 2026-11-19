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
            "Agence web de développement de sites vitrines",
        )

    def test_cgv_ok(self):
        response = self.client.get(reverse("cgv"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Conditions générales de vente")
        self.assertContains(response, "Killian&nbsp;P.")

    def test_no_agency_price_on_site(self):
        home = self.client.get(reverse("index")).content.decode()
        self.assertNotIn("€", home)
        self.assertContains(self.client.get(reverse("index")), 'id="formule"')
        cgv = self.client.get(reverse("cgv")).content.decode()
        for montant in ("300 €", "150 €", "190 €", "40 € par mois", "780 €"):
            self.assertNotIn(montant, cgv)

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
        self.assertContains(response, "<title>Création de site internet pour boulangerie · killianp.dev</title>", html=False)
        self.assertContains(response, "Création de site internet <em>pour boulangerie</em>")
        self.assertContains(response, '<link rel="canonical" href="https://www.killianp-dev.fr/creation-site-internet/boulangerie/">')
        self.assertContains(response, '"@type": "FAQPage"')
        self.assertContains(response, '"@type": "Service"')
        self.assertContains(response, "/demo-boulangerie/")
        self.assertContains(response, "?sujet=Site%20vitrine%20%E2%80%94%20Boulangerie")

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
        self.assertContains(response, "Création de site vitrine pour commerçants et artisans")
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
