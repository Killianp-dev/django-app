from django.apps import AppConfig


class PortfolioConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'archi.portfolio'
    label = 'archi_portfolio'
    verbose_name = "Portfolio"
