"""Formulaire de contact. Le message part par email, il n'est pas enregistré."""
from django import forms

from contact_form.forms import sign_rendered_at, spam_reason


class ContactForm(forms.Form):
    website = forms.CharField(
        required=False,
        label="",
        widget=forms.TextInput(attrs={
            "class": "vitrine-hp",
            "tabindex": "-1",
            "autocomplete": "off",
            "aria-hidden": "true",
        }),
    )
    name = forms.CharField(
        label="Nom",
        max_length=100,
        widget=forms.TextInput(attrs={
            "class": "vitrine-form__input",
            "placeholder": "Votre nom",
            "autocomplete": "name",
        }),
    )
    email = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(attrs={
            "class": "vitrine-form__input",
            "placeholder": "votre@email.fr",
            "autocomplete": "email",
        }),
    )
    phone = forms.CharField(
        label="Téléphone",
        required=False,
        max_length=20,
        widget=forms.TextInput(attrs={
            "class": "vitrine-form__input",
            "placeholder": "06 12 34 56 78",
            "autocomplete": "tel",
        }),
    )
    offre = forms.ChoiceField(
        required=False,
        widget=forms.Select(attrs={"class": "vitrine-form__input"}),
    )
    message = forms.CharField(
        label="Votre message",
        widget=forms.Textarea(attrs={
            "class": "vitrine-form__input",
            "rows": 6,
            "placeholder": "Quelques lignes suffisent.",
        }),
    )
    # Heure d'affichage signée : un robot qui poste trop vite (ou sans avoir
    # affiché la page) est écarté en silence (contact_form.forms.spam_reason).
    rendered_at = forms.CharField(required=False, widget=forms.HiddenInput())
    consent = forms.BooleanField(
        label="J'accepte que ce message soit utilisé uniquement pour me recontacter.",
    )

    def __init__(self, *args, site=None, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.is_bound:
            self.fields["rendered_at"].initial = sign_rendered_at()
        self.fields["offre"].label = site.labels.offre
        self.fields["offre"].choices = [("", site.labels.offre_placeholder)] + [
            (item.nom, item.nom) for item in site.offres
        ]
        placeholder = getattr(site.labels, "message_placeholder", "")
        if placeholder:
            self.fields["message"].widget.attrs["placeholder"] = placeholder

    def clean_website(self):
        website = self.cleaned_data.get("website")
        if website:
            raise forms.ValidationError("Le formulaire n'a pas pu être envoyé.")
        return website

    def rejection_reason(self):
        """Motif de rejet silencieux (robot), ou None."""
        return spam_reason(self.data)
