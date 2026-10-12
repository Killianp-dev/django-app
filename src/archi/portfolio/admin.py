"""
Admin pour portfolio : MissionType, Project + ProjectPhoto inline.
"""
from django.contrib import admin
from .models import MissionType, Project, ProjectPhoto


@admin.register(MissionType)
class MissionTypeAdmin(admin.ModelAdmin):
    """Admin pour les types de mission."""
    
    list_display = ('name', 'order', 'slug')
    list_editable = ('order',)  # Modifiable directement dans la liste
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'order')
        }),
        ('Contenu', {
            'fields': ('accroche', 'description', 'etapes', 'image')
        }),
        ('SEO', {
            'fields': ('title_seo', 'description_seo'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['order', 'name']


class ProjectPhotoInline(admin.TabularInline):
    """Photos inline dans la fiche projet."""
    model = ProjectPhoto
    extra = 1
    fields = ('image', 'alt', 'decorative', 'legende', 'credit', 'order', 'width', 'height')
    readonly_fields = ('width', 'height')
    
    ordering = ['order', 'id']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin pour les projets."""
    
    list_display = ('titre', 'ville', 'annee', 'statut', 'publie', 'mis_en_avant', 'order')
    list_filter = ('statut', 'publie', 'mis_en_avant', 'types_mission')
    list_editable = ('order', 'publie', 'mis_en_avant')
    search_fields = ('titre', 'ville', 'programme')
    prepopulated_fields = {'slug': ('titre',)}
    
    fieldsets = (
        (None, {
            'fields': ('titre', 'slug', 'types_mission')
        }),
        ('Informations', {
            'fields': ('ville', 'annee', 'surface', 'programme', 'statut', 'budget')
        }),
        ('Contenu', {
            'fields': ('description',)
        }),
        ('Publication', {
            'fields': ('publie', 'mis_en_avant', 'order')
        }),
    )
    
    inlines = [ProjectPhotoInline]
    
    filter_horizontal = ('types_mission',)
    
    ordering = ['-order', '-created_at']
