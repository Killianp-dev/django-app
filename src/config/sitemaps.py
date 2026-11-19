from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from blog.models import BlogPost
from config.metiers import metiers


class BlogSitemap(Sitemap):
    protocol = "https"
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return BlogPost.objects.filter(published=True)

    def lastmod(self, obj):
        return obj.last_updated

    def priority(self, obj):
        # Les guides pour commerçants comptent plus que les notes techniques.
        return 0.8 if obj.category == BlogPost.COMMERCE else 0.4


class MetierSitemap(Sitemap):
    """Pages « Création de site internet pour… » : les pages qui doivent ressortir."""
    protocol = "https"
    changefreq = "monthly"
    priority = 0.9

    def items(self):
        return metiers()

    def location(self, item):
        return item.url


class StaticSitemap(Sitemap):
    protocol = "https"
    changefreq = "monthly"

    PRIORITES = {
        "index": 1.0,
        "blog:home": 0.7,
        "contact_form:contact": 0.6,
        "blog:notes": 0.3,
        "cgv": 0.2,
        "mentions_legales": 0.1,
    }

    def items(self):
        return list(self.PRIORITES)

    def location(self, item):
        return reverse(item)

    def priority(self, item):
        return self.PRIORITES[item]
