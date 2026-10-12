"""
Mixins réutilisables pour les vues archi.
"""
from django.conf import settings


class ArchiContextMixin:
    """
    Ajoute 'site' (SiteSettings) et 'demo_mode' au contexte.
    À utiliser sur toutes les vues archi (pas de context processor global).
    """
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Import ici pour éviter circular import
        from archi.cabinet.models import SiteSettings
        
        try:
            context['site'] = SiteSettings.objects.get()
        except SiteSettings.DoesNotExist:
            context['site'] = None
        
        context['demo_mode'] = getattr(settings, 'ARCHI_DEMO_MODE', False)
        context['url_prefix'] = getattr(settings, 'ARCHI_URL_PREFIX', '')
        
        return context
