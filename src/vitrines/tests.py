import json
import re

from django.test import TestCase

from .sites import SITES

PREFIXES = {
    "coiffeur": "/demo-coiffeur/",
    "macon": "/demo-macon/",
    "boulangerie": "/demo-boulangerie/",
    "avocat": "/demo-avocat/",
    "boucherie": "/demo-boucherie/",
    "beaute": "/demo-institut/",
}


def _ld_json(html):
    return json.loads(re.search(r'application/ld\+json">(.*?)</script>', html, re.S).group(1))


class VitrinesCommunesTests(TestCase):
    def test_toutes_les_vitrines_sont_declarees(self):
        self.assertEqual(set(SITES), set(PREFIXES))

    def test_pages_principales(self):
        for key, prefix in PREFIXES.items():
            site = SITES[key]
            pages = ["", "offres/", "tarifs/", "presentation/", "contact/", "mentions-legales/", "confidentialite/"]
            pages += [f"offres/{offre.slug}/" for offre in site.offres]
            for page in pages:
                with self.subTest(site=key, page=page):
                    self.assertEqual(self.client.get(prefix + page).status_code, 200)

    def test_pages_conditionnelles(self):
        for key, prefix in PREFIXES.items():
            site = SITES[key]
            with self.subTest(site=key):
                attendu_galerie = 200 if getattr(site, "realisations", None) else 404
                attendu_faq = 200 if getattr(site.labels, "faq_nav", None) else 404
                self.assertEqual(self.client.get(prefix + "realisations/").status_code, attendu_galerie)
                self.assertEqual(self.client.get(prefix + "questions/").status_code, attendu_faq)

    def test_au_moins_quatre_entrees_dans_le_menu(self):
        for key, prefix in PREFIXES.items():
            with self.subTest(site=key):
                html = self.client.get(prefix).content.decode()
                nav = re.search(r'<ul class="vitrine-nav__list">(.*?)</nav>', html, re.S).group(1)
                entrees = re.findall(r'<li class="vitrine-nav__item(?: vitrine-nav__item--dropdown)?">', nav)
                cta = nav.count("vitrine-nav__link--cta")
                self.assertGreaterEqual(len(entrees) - cta, 4)

    def test_toutes_les_vitrines_sont_a_paris(self):
        for key, prefix in PREFIXES.items():
            with self.subTest(site=key):
                html = self.client.get(prefix).content.decode()
                self.assertNotIn("Lyon", html)
                data = _ld_json(html)
                self.assertEqual(data["address"]["addressLocality"], "Paris")
                self.assertTrue(data["address"]["postalCode"].startswith("75"))

    def test_horaires_structures(self):
        for key, prefix in PREFIXES.items():
            with self.subTest(site=key):
                data = _ld_json(self.client.get(prefix).content.decode())
                for creneau in data["openingHoursSpecification"]:
                    self.assertRegex(creneau["opens"], r"^\d\d:\d\d$")


class SalonDemoTests(TestCase):
    def test_prestation_preselectionnee(self):
        html = self.client.get("/demo-coiffeur/contact/?prestation=Couleur").content.decode()
        self.assertIn('<option value="Couleur" selected>', html)
        html = self.client.get("/demo-coiffeur/contact/?prestation=Inconnue").content.decode()
        self.assertIsNone(re.search(r"<option value=\"[^\"]+\" selected>", html))

    def test_page_prestation_affiche_la_carte(self):
        html = self.client.get("/demo-coiffeur/offres/coupe/").content.decode()
        self.assertIn("La carte — Coupe", html)
        self.assertIn("Réalisées au salon", html)


class SectionsSignatureTests(TestCase):
    def test_devis_du_macon(self):
        devis = SITES["macon"].devis
        self.assertEqual(devis.total_ht_txt, "4\u202f334,65\u00a0€")
        self.assertEqual([t.ttc_txt for t in devis.taux], ["4\u202f768,11\u00a0€", "5\u202f201,58\u00a0€"])
        html = self.client.get("/demo-macon/").content.decode()
        self.assertIn("data-devis", html)
        self.assertIn('data-ttc="5\u202f201,58\u00a0€"', html)

    def test_fournees_de_la_boulangerie(self):
        html = self.client.get("/demo-boulangerie/").content.decode()
        self.assertEqual(html.count('class="boul-fournee"'), len(SITES["boulangerie"].fournees))
        self.assertIn(">7h30<", html)

    def test_calculateur_de_la_boucherie(self):
        html = self.client.get("/demo-boucherie/").content.decode()
        self.assertIn("data-calculateur", html)
        self.assertIn("data-calcul-fallback", html)

    def test_equipe_et_faq_du_cabinet(self):
        html = self.client.get("/demo-avocat/").content.decode()
        self.assertIn("Solène Aubert", html)
        faq = self.client.get("/demo-avocat/questions/").content.decode()
        self.assertIn('"@type": "FAQPage"', faq)

    def test_rituels_de_l_institut(self):
        html = self.client.get("/demo-institut/").content.decode()
        self.assertIn("Rituel Détente", html)
        self.assertIn("Offrir un soin", html)


class PortfolioTests(TestCase):
    def test_accueil_liste_les_six_demos(self):
        html = self.client.get("/").content.decode()
        for prefix in PREFIXES.values():
            with self.subTest(prefix=prefix):
                self.assertIn(f'href="{prefix}"', html)
        self.assertIn("<small>/ 06</small>", html)
