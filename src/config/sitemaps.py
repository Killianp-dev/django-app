from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from blog.models import BlogPost


class BlogSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return BlogPost.objects.filter(published=True)

    def lastmod(self, obj):
        return obj.last_updated


class StaticSitemap(Sitemap):
    changefreq = "monthly"
    priority = 0.5

    def items(self):
        return ['index', 'contact_form:contact', 'blog:home']
    
    def location(self, item):
        return reverse(item) 