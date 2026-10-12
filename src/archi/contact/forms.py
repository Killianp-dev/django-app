"""
Formulaire de contact avec honeypot anti-spam.
"""
from django import forms
from .models import Contact


class ContactForm(forms.ModelForm):
    """
    Formulaire de contact avec champ honeypot.
    Le champ 'website' doit rester vide (piège pour bots).
    """
    
    # Honeypot : champ caché CSS, aria-hidden, tabindex=-1
    website = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'style': 'position:absolute;left:-9999px;',
            'tabindex': '-1',
            'aria-hidden': 'true',
            'autocomplete': 'off'
        }),
        label=''  # Pas de label visible
    )
    
    class Meta:
        model = Contact
        fields = ['name', 'email', 'phone', 'mission_type', 'commune', 'message', 'consent']
        widgets = {
            'name': forms.TextInput(attrs={
                'placeholder': 'Votre nom',
                'autocomplete': 'name'
            }),
            'email': forms.EmailInput(attrs={
                'placeholder': 'votre@email.fr',
                'autocomplete': 'email'
            }),
            'phone': forms.TextInput(attrs={
                'placeholder': '06 12 34 56 78',
                'autocomplete': 'tel'
            }),
            'mission_type': forms.Select(attrs={
                'aria-label': 'Type de projet'
            }),
            'commune': forms.TextInput(attrs={
                'placeholder': 'Ville du projet'
            }),
            'message': forms.Textarea(attrs={
                'rows': 6,
                'placeholder': 'Décrivez votre projet...'
            }),
        }
        labels = {
            'name': 'Nom',
            'email': 'Email',
            'phone': 'Téléphone (optionnel)',
            'mission_type': 'Type de projet',
            'commune': 'Commune du projet',
            'message': 'Votre message',
            'consent': "J'accepte que mes données soient utilisées pour me recontacter"
        }
    
    def __init__(self, *args, **kwargs):
        """Remplit les choix mission_type dynamiquement."""
        super().__init__(*args, **kwargs)
        
        # Charger les types de mission depuis la DB
        from archi.portfolio.models import MissionType
        mission_choices = [('', '-- Sélectionnez --')] + [
            (mt.name, mt.name) for mt in MissionType.objects.all()
        ]
        self.fields['mission_type'].widget.choices = mission_choices
        
        # Consent obligatoire
        self.fields['consent'].required = True
    
    def clean_website(self):
        """
        Honeypot : si le champ est rempli, c'est un bot.
        """
        website = self.cleaned_data.get('website')
        if website:
            raise forms.ValidationError(
                "Spam détecté. Si vous êtes humain, contactez-nous par téléphone."
            )
        return website
    
    def clean(self):
        """Validation globale."""
        cleaned_data = super().clean()
        
        # Vérification consent
        if not cleaned_data.get('consent'):
            raise forms.ValidationError({
                'consent': "Vous devez accepter la politique de confidentialité pour envoyer le formulaire."
            })
        
        return cleaned_data
