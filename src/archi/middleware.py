"""
Middleware ArchiDemoGuard : sécurise le compte démo.

Un membre du groupe 'demo' :
- Est traité en anonyme hors de /demo-architecte/
- Reçoit 403 sur l'admin principal (/secure-admin-portal/)
- Ne peut pas accéder aux vues blog/create, blog/edit, blog/delete

Cumulé avec le DemoAdminSite, cela garantit l'isolation complète.
"""
from django.contrib.auth.models import AnonymousUser, Group
from django.http import HttpResponseForbidden
from django.conf import settings


class ArchiDemoGuard:
    """
    Middleware qui traite les membres du groupe 'demo' en anonymes
    hors de la zone /demo-architecte/.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.demo_prefix = getattr(settings, 'ARCHI_URL_PREFIX', 'demo-architecte/')
        
        # Normalise le préfixe
        if self.demo_prefix and not self.demo_prefix.startswith('/'):
            self.demo_prefix = '/' + self.demo_prefix
    
    def __call__(self, request):
        # Vérifie si l'utilisateur est dans le groupe 'demo'
        if request.user.is_authenticated and self._is_demo_user(request.user):
            
            # Zone autorisée : /demo-architecte/
            if not request.path.startswith(self.demo_prefix):
                # Hors zone démo : traiter en anonyme
                request.user = AnonymousUser()
            
            # Blocage explicite de l'admin principal
            admin_url = getattr(settings, 'ADMIN_URL', '/secure-admin-portal/')
            if not admin_url.startswith('/'):
                admin_url = '/' + admin_url
            
            if request.path.startswith(admin_url):
                return HttpResponseForbidden(
                    "<h1>Accès refusé</h1>"
                    "<p>Vous n'avez pas les permissions nécessaires pour accéder à cette zone.</p>"
                )
        
        response = self.get_response(request)
        return response
    
    def _is_demo_user(self, user):
        """Vérifie si l'utilisateur est membre du groupe 'demo'."""
        try:
            demo_group = Group.objects.get(name='demo')
            return demo_group in user.groups.all()
        except Group.DoesNotExist:
            return False
