"""
Paquet Django réutilisable pour sites vitrine d'architectes.

Contient 3 apps :
- cabinet (archi_cabinet) : SiteSettings, identité, thème
- portfolio (archi_portfolio) : MissionType, Project, ProjectPhoto
- contact (archi_contact) : Contact, formulaire honeypot

Installation :
    INSTALLED_APPS += ['archi.cabinet', 'archi.portfolio', 'archi.contact']
    urlpatterns += [path('demo-architecte/', include('archi.urls'))]  # ou '' pour instance client
"""

default_app_config = 'archi.apps.ArchiConfig'
