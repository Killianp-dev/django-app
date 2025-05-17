from django import forms

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