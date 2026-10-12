"""
Admin pour contact.Contact (lecture seule pour le groupe Cabinet).
"""
from django.contrib import admin
from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    """Admin pour les messages de contact (lecture seule)."""
    
    list_display = ('name', 'email', 'mission_type', 'commune', 'created_at')
    list_filter = ('mission_type', 'created_at')
    search_fields = ('name', 'email', 'commune', 'message')
    readonly_fields = ('name', 'email', 'phone', 'mission_type', 'commune', 
                      'message', 'consent', 'created_at')
    
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        """Les messages arrivent via le formulaire public."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Lecture seule."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Seul un superuser peut supprimer."""
        return request.user.is_superuser
