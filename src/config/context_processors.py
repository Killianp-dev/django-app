from django.conf import settings

from config.metiers import metiers
from config.projects import exemples, projets
from config.tarifs import tarifs


def site(request):
    """Adresse publique de référence du site (canonical, Open Graph), pages métier
    (pied de page), démos dans l'ordre de la section Exemples (sous-menu « Exemples ») et
    tarifs du jour (config/tarifs.py)."""
    return {"SITE_URL": settings.SITE_URL, "METIERS": metiers(), "DEMOS_NAV": exemples(projets()), "TARIFS": tarifs()}
