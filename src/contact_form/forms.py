import re
import time

from django import forms
from django.core import signing

RENDERED_AT_SALT = "contact_form.rendered_at"
MIN_SUBMIT_SECONDS = 3
MAX_SUBMIT_SECONDS = 2 * 60 * 60
_LINK_RE = re.compile(r"https?://", re.IGNORECASE)
_PHONE_CHARS_RE = re.compile(r"^\+?[\d\s.\-()]+$")


def sign_rendered_at(timestamp=None):
    """Signe l'heure d'affichage du formulaire (django.core.signing)."""
    if timestamp is None:
        timestamp = time.time()
    return signing.dumps(timestamp, salt=RENDERED_AT_SALT)


def spam_reason(data):
    """
    Motif de rejet silencieux d'un envoi, ou None si l'envoi peut être traité.

    Ne journalise rien et ne lève pas d'erreur de validation : le visiteur
    (ou le robot) doit voir la page de succès habituelle.
    Vérifie le piège « website », l'heure d'affichage signée (ni trop tôt,
    ni trop tard) et le nombre de liens dans le message.
    """
    website = (data.get('website') or '').strip()
    if website:
        return 'honeypot'

    token = (data.get('rendered_at') or '').strip()
    if not token:
        return 'signature_absente'
    try:
        rendered_at = signing.loads(token, salt=RENDERED_AT_SALT, max_age=MAX_SUBMIT_SECONDS)
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

    message = data.get('message') or ''
    if len(_LINK_RE.findall(message)) > 1:
        return 'liens_multiples'
    return None


class ContactForm(forms.Form):
    """
    Formulaire de contact : prénom, nom, email, téléphone (facultatif), sujet et message.
    """
    # Les libellés des champs obligatoires reçoivent la classe « required » (étoile en CSS).
    required_css_class = 'required'

    first_name = forms.CharField(
        label='Votre prénom',
        max_length=60,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'autocomplete': 'given-name',
            'placeholder': 'Prénom',
        })
    )
    name = forms.CharField(
        label='Votre nom',
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'autocomplete': 'family-name',
            'placeholder': 'Nom',
        })
    )
    email = forms.EmailField(
        label='Votre email',
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'autocomplete': 'email',
            'autocapitalize': 'none',
            'spellcheck': 'false',
            'inputmode': 'email',
            'placeholder': 'nom@exemple.fr',
        })
    )
    phone = forms.CharField(
        label='Téléphone',
        max_length=30,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'type': 'tel',
            'autocomplete': 'tel',
            'inputmode': 'tel',
            'placeholder': '06 12 34 56 78 (facultatif)',
        })
    )
    subject = forms.CharField(
        label='Sujet',
        max_length=200,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Référencement, création de site, conseil SEO',
        })
    )
    message = forms.CharField(
        label='Message',
        max_length=5000,
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 8,
            'placeholder': "Votre message...",
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
        """Motif de rejet silencieux, ou None : voir spam_reason()."""
        return spam_reason(self.data)

    def clean_first_name(self):
        first_name = self.cleaned_data.get('first_name')
        if any(char.isdigit() for char in first_name):
            raise forms.ValidationError("Le prénom ne doit pas contenir de chiffres.")
        return first_name

    def clean_name(self):
        name = self.cleaned_data.get('name')
        if any(char.isdigit() for char in name):
            raise forms.ValidationError("Le nom ne doit pas contenir de chiffres.")
        return name

    def clean_phone(self):
        phone = (self.cleaned_data.get('phone') or '').strip()
        if not phone:
            return ''
        chiffres = sum(char.isdigit() for char in phone)
        if not _PHONE_CHARS_RE.match(phone) or not 8 <= chiffres <= 15:
            raise forms.ValidationError("Numéro de téléphone invalide.")
        return phone

    def clean_message(self):
        message = self.cleaned_data.get('message')
        if len(message) < 10:
            raise forms.ValidationError("Le message est trop court (au moins 10 caractères).")
        return message