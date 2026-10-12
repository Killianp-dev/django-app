"""
DemoAdminSite : admin limité pour le compte démo (groupe 'demo').
Monté sous /demo-architecte/admin/ uniquement en mode démo.

SÉCURITÉ :
- Accès limité aux modèles archi_cabinet et archi_portfolio
- Aucun modèle auth (utilisateurs/groupes)
- Changement de mot de passe désactivé
- Middleware ArchiDemoGuard bloque l'accès à l'admin principal
"""
from django.contrib import admin
from django.contrib.auth.models import Group
from django.urls import path
from django.http import HttpResponseForbidden
from django.shortcuts import render

from archi.cabinet.models import SiteSettings
from archi.cabinet.admin import SiteSettingsAdmin
from archi.portfolio.models import MissionType, Project
from archi.portfolio.admin import MissionTypeAdmin, ProjectAdmin


class DemoAdminSite(admin.AdminSite):
    """
    AdminSite dédié à la démo.
    Accessible uniquement aux membres du groupe 'demo'.
    """
    site_header = "Admin démo — site vitrine architecte"
    site_title = "Admin démo"
    index_title = "Administration démo (exemple fictif)"
    
    def has_permission(self, request):
        """
        Accès si :
        - Utilisateur actif
        - Membre du groupe 'demo'
        """
        if not request.user.is_active:
            return False
        
        # Vérifie appartenance au groupe 'demo'
        try:
            demo_group = Group.objects.get(name='demo')
            return demo_group in request.user.groups.all()
        except Group.DoesNotExist:
            return False
    
    def get_urls(self):
        """
        Désactive les URLs de changement de mot de passe.
        """
        urls = super().get_urls()
        
        # Filtre les URLs password_change (URLPattern a .name, pas URLResolver)
        filtered_urls = [
            url for url in urls
            if not (hasattr(url, 'name') and url.name and 'password_change' in url.name)
        ]
        
        return filtered_urls


# Instance du site démo
demo_admin_site = DemoAdminSite(name='demo_admin')

# Enregistrement des modèles autorisés
demo_admin_site.register(SiteSettings, SiteSettingsAdmin)
demo_admin_site.register(MissionType, MissionTypeAdmin)
demo_admin_site.register(Project, ProjectAdmin)

# PAS de Contact (pour ne pas exposer les messages d'autres prospects)
# PAS de User/Group
