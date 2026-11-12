import logging

from django.core.mail import send_mail
from django.http import HttpResponseRedirect
from django.urls import reverse_lazy
from django.views.generic import TemplateView
from django.views.generic.edit import FormView
from django.conf import settings

from .forms import ContactForm
from .models import Contact  # Importez le nouveau modèle

logger = logging.getLogger(__name__)


def spam_rejection_reason(form):
    """Journalise un rejet anti-spam (motif seul) et le retourne, sinon None."""
    reason = form.rejection_reason()
    if reason:
        logger.info("Rejet du formulaire de contact (motif=%s)", reason)
    return reason


class ContactFormView(FormView):
    template_name = "contact_form/contact_form.html"
    form_class = ContactForm
    success_url = reverse_lazy('contact_form:success')

    def post(self, request, *args, **kwargs):
        form = self.get_form()
        if spam_rejection_reason(form):
            return HttpResponseRedirect(self.get_success_url())
        if form.is_valid():
            return self.form_valid(form)
        return self.form_invalid(form)

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
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=["contact@killianp-dev.fr"],
            fail_silently=False,
        )

        return super().form_valid(form)


class SuccessView(TemplateView):
    template_name = "contact_form/success.html"