from django.conf import settings

from config.metiers import metiers


def site(request):
    """Adresse publique de référence du site (canonical, Open Graph) et pages métier,
    listées dans le pied de page de toutes les pages."""
    return {"SITE_URL": settings.SITE_URL, "METIERS": metiers()}
