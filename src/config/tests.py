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
