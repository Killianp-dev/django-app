from django.core.mail import send_mail
from django.urls import reverse_lazy
from django.views.generic import TemplateView
from django.views.generic.edit import FormView

from .forms import ContactForm
from .models import Contact  # Importez le nouveau modèle

class ContactFormView(FormView):
    template_name = "contact_form/contact_form.html"
    form_class = ContactForm
    success_url = reverse_lazy('contact_form:success')

    def form_valid(self, form):
        # On récupère les données validées
        name = form.cleaned_data['name']
        email = form.cleaned_data['email']
        subject = form.cleaned_data.get('subject') or "Nouveau message de contact"
        message = form.cleaned_data['message']

        # Enregistrement dans la base de données
        Contact.objects.create(
            name=name,
            email=email,
            subject=subject,
            message=message
        )

        # Envoi d'email
        send_mail(
            subject=f"[Contact] {subject}",
            message=f"De : {name} <{email}>\n\n{message}",
            from_email="no-reply@ai-technews.fr",
            recipient_list=["contact@ai-technews.fr"],
            fail_silently=False,
        )

        return super().form_valid(form)


class SuccessView(TemplateView):
    template_name = "contact_form/success.html"