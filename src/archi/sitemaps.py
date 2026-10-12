"""
Sitemaps pour archi (désactivés en mode démo).
"""
from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from .portfolio.models import MissionType, Project


class ArchiStaticSitemap(Sitemap):
    """Pages statiques archi."""
    changefreq = "monthly"
    priority = 0.5
    
    def items(self):
        return ['archi:home', 'archi:portfolio_list', 'archi:about', 'archi:contact']
    
    def location(self, item):
        return reverse(item)


class MissionSitemap(Sitemap):
    """Pages des types de mission."""
    changefreq = "monthly"
    priority = 0.6
    
    def items(self):
        return MissionType.objects.all()
    
    def lastmod(self, obj):
        # Les missions n'ont pas de champ updated_at, on renvoie None
        return None


class ProjectSitemap(Sitemap):
    """Fiches projets."""
    changefreq = "monthly"
    priority = 0.7
    
    def items(self):
        return Project.objects.filter(publie=True)
    
    def lastmod(self, obj):
        return obj.updated_at
