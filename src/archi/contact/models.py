"""
Modèle Contact : messages du formulaire de contact.
"""
from django.db import models
from django.utils import timezone


class Contact(models.Model):
    """Message de contact reçu via le formulaire."""
    
    name = models.CharField(
        max_length=100,
        verbose_name="Nom"
    )
    email = models.EmailField(
        verbose_name="Email"
    )
    phone = models.CharField(
        max_length=20,
        verbose_name="Téléphone",
        blank=True
    )
    mission_type = models.CharField(
        max_length=100,
        verbose_name="Type de projet",
        blank=True
    )
    commune = models.CharField(
        max_length=100,
        verbose_name="Commune",
        blank=True
    )
    message = models.TextField(
        verbose_name="Message"
    )
    consent = models.BooleanField(
        default=False,
        verbose_name="Consentement RGPD"
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name="Reçu le"
    )
    
    class Meta:
        verbose_name = "Message de contact"
        verbose_name_plural = "Messages de contact"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} — {self.created_at.strftime('%d/%m/%Y %H:%M')}"
