from django.apps import AppConfig


class CabinetConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'archi.cabinet'
    label = 'archi_cabinet'
    verbose_name = "Cabinet d'architecte"
