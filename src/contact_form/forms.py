import re
import time

from django import forms
from django.core import signing

RENDERED_AT_SALT = "contact_form.rendered_at"
MIN_SUBMIT_SECONDS = 3
MAX_SUBMIT_SECONDS = 2 * 60 * 60
_LINK_RE = re.compile(r"https?://", re.IGNORECASE)


def sign_rendered_at(timestamp=None):
    """Signe l'heure d'affichage du formulaire (django.core.signing)."""
    if timestamp is None:
        timestamp = time.time()
    return signing.dumps(timestamp, salt=RENDERED_AT_SALT)


class ContactForm(forms.Form):
    """
    Formulaire de contact simple avec nom, email, sujet et message.
    """
    name = forms.CharField(
        label='Votre nom',
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Entrez votre nom'
        })
    )
    email = forms.EmailField(
        label='Votre email',
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Entrez votre email'
        })
    )
    subject = forms.CharField(
        label='Sujet',
        max_length=200,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Sujet (optionnel)'
        })
    )
    message = forms.CharField(
        label='Message',
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 20,
            'placeholder': 'Votre message'
        })
    )
    # Piège à robots : laissé vide par un visiteur, souvent rempli par un bot.
    website = forms.CharField(
        required=False,
        label='Site web',
        widget=forms.TextInput(attrs={
            'autocomplete': 'off',
            'tabindex': '-1',
            'aria-hidden': 'true',
        }),
    )
    rendered_at = forms.CharField(
        required=False,
        widget=forms.HiddenInput(),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.is_bound:
            self.fields['rendered_at'].initial = sign_rendered_at()

    def rejection_reason(self):
        """
        Motif de rejet silencieux, ou None si l'envoi peut être traité.

        Ne journalise rien et ne lève pas d'erreur de validation : le visiteur
        (ou le robot) doit voir la page de succès habituelle.
        """
        website = (self.data.get('website') or '').strip()
        if website:
            return 'honeypot'

        token = (self.data.get('rendered_at') or '').strip()
        if not token:
            return 'signature_absente'
        try:
            rendered_at = signing.loads(
                token,
                salt=RENDERED_AT_SALT,
                max_age=MAX_SUBMIT_SECONDS,
            )
        except signing.SignatureExpired:
            return 'delai_depasse'
        except signing.BadSignature:
            return 'signature_invalide'

        try:
            elapsed = time.time() - float(rendered_at)
        except (TypeError, ValueError):
            return 'signature_invalide'
        if elapsed < MIN_SUBMIT_SECONDS:
            return 'trop_rapide'
        if elapsed > MAX_SUBMIT_SECONDS:
            return 'delai_depasse'

        message = self.data.get('message') or ''
        if len(_LINK_RE.findall(message)) > 1:
            return 'liens_multiples'
        return None

    def clean_name(self):
        name = self.cleaned_data.get('name')
        if any(char.isdigit() for char in name):
            raise forms.ValidationError("Le nom ne doit pas contenir de chiffres.")
        return name

    def clean_message(self):
        message = self.cleaned_data.get('message')
        if len(message) < 10:
            raise forms.ValidationError("Le message est trop court (au moins 10 caractères).")
        return message