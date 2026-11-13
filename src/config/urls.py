"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.contrib.sitemaps.views import sitemap
from django.views.generic import TemplateView
from django.http import HttpResponse
from django.shortcuts import redirect

from .views import HomeView
from contact_form.views import SuccessView
from . import settings
from .sitemaps import BlogSitemap, StaticSitemap
def legacy_demo_architecte(request, rest=""):
    """Ancienne adresse de la démo architecte."""
    return redirect("/demo-avocat/", permanent=True)


def about_redirect(request):
    """Ancienne page À propos : la section est sur l'accueil."""
    return redirect("/#a-propos", permanent=True)


def _redirect_avocat(target):
    def view(request, slug=None):
        url = target
        if slug:
            url = target.format(slug=slug)
        return redirect(url, permanent=True)
    return view

# Sitemaps : pas de sitemap pour la vitrine démo (noindex)
sitemaps = {
    'blog': BlogSitemap,
    'static': StaticSitemap,
}

def robots_txt(request):
    lines = [
        "User-agent: *",
        "Disallow: /secure-admin-portal/",
        "Disallow: /demo-avocat/",
        "Disallow: /demo-coiffeur/",
        "Disallow: /demo-macon/",
        "Disallow: /demo-boulangerie/",
        "Disallow: /demo-boucherie/",
        "Disallow: /demo-institut/",
        "Disallow: /demo-architecte/",
        f"Sitemap: {request.build_absolute_uri('/sitemap.xml')}"
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")

urlpatterns = [
    path('', HomeView.as_view(), name='index'),
    path('success/', SuccessView.as_view(), name='success'),
    path('secure-admin-portal/', admin.site.urls),
    
    path('demo-coiffeur/', include(('vitrines.urls', 'vitrines'), namespace='coiffeur')),
    path('demo-macon/', include(('vitrines.urls', 'vitrines'), namespace='macon')),
    path('demo-boulangerie/', include(('vitrines.urls', 'vitrines'), namespace='boulangerie')),
    path('demo-boucherie/', include(('vitrines.urls', 'vitrines'), namespace='boucherie')),
    path('demo-institut/', include(('vitrines.urls', 'vitrines'), namespace='beaute')),
    path('demo-avocat/expertises/<slug:slug>/', _redirect_avocat('/demo-avocat/offres/{slug}/')),
    path('demo-avocat/expertises/', _redirect_avocat('/demo-avocat/offres/')),
    path('demo-avocat/cabinet/', _redirect_avocat('/demo-avocat/presentation/')),
    path('demo-avocat/', include(('vitrines.urls', 'vitrines'), namespace='avocat')),
    path('demo-architecte/', legacy_demo_architecte),
    path('demo-architecte/<path:rest>', legacy_demo_architecte),
    
    path('blog/', include('blog.urls')),
    path('contact/', include('contact_form.urls')),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    path('robots.txt', robots_txt),
    path('mentions-legales/', TemplateView.as_view(template_name="mentions_legales.html"), name='mentions_legales'),
    path('a-propos/', about_redirect, name='about'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
