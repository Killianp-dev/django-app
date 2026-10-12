"""
Admin pour cabinet.SiteSettings (singleton).
"""
from django.contrib import admin
from .models import SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    """
    Admin pour les paramètres du site (singleton).
    Pas de bouton ajouter/supprimer.
    """
    
    fieldsets = (
        ('Identité', {
            'fields': ('nom_cabinet', 'slogan', 'logo', 'favicon', 'image_og', 'image_accueil')
        }),
        ('Architecte (obligatoire)', {
            'fields': ('nom_architecte', 'titre_architecte', 'numero_ordre', 'conseil_regional'),
            'description': 'Ces informations sont obligatoires par la réglementation de l\'Ordre des architectes.'
        }),
        ('Coordonnées (NAP)', {
            'fields': ('adresse', 'code_postal', 'ville', 'telephone', 'email', 
                      'zone_intervention', 'horaires', 'latitude', 'longitude')
        }),
        ('Textes', {
            'fields': ('accroche_accueil', 'texte_a_propos', 'photo_architecte')
        }),
        ('Légal', {
            'fields': ('forme_juridique', 'siret', 'assurance_nom', 'assurance_numero',
                      'hebergeur', 'directeur_publication')
        }),
        ('SEO', {
            'fields': ('title_default', 'description_default')
        }),
        ('Thème — Couleurs', {
            'fields': ('color_bg', 'color_surface', 'color_ink', 'color_ink_soft',
                      'color_accent', 'color_accent_hover', 'color_on_accent',
                      'color_border', 'color_focus'),
            'description': 'Format #RRGGBB. Les contrastes WCAG AA sont vérifiés automatiquement (≥ 4.5:1).'
        }),
        ('Thème — Polices', {
            'fields': ('font_heading', 'font_body')
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    list_display = ('nom_cabinet', 'ville', 'updated_at')
    
    def has_add_permission(self, request):
        """Empêche d'ajouter si une config existe déjà (singleton)."""
        return not SiteSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        """Empêche de supprimer la config."""
        return False
