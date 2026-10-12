from django.apps import AppConfig


class ContactConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'archi.contact'
    label = 'archi_contact'
    verbose_name = "Messages de contact"
