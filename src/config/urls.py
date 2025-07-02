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

from .views import HomeView
from contact_form.views import SuccessView
from . import settings
from .sitemaps import BlogSitemap, StaticSitemap

sitemaps = {
    'blog': BlogSitemap,
    'static': StaticSitemap,
}

def robots_txt(request):
    lines = [
        "User-agent: *",
        "Disallow: /admin/",
        f"Sitemap: {request.build_absolute_uri('/sitemap.xml')}"
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")

urlpatterns = [
    path('', HomeView.as_view(), name='index'),
    path('success/', SuccessView.as_view(), name='success'),
    path('admin/', admin.site.urls),
    path('blog/', include('blog.urls')),
    path('contact/', include('contact_form.urls')),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    path('robots.txt', robots_txt),
    path('mentions-legales/', TemplateView.as_view(template_name="mentions_legales.html"), name='mentions_legales'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
