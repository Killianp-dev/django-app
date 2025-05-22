from django.views.generic import TemplateView
from django.shortcuts import redirect
from blog.models import BlogPost
from contact_form.forms import ContactForm
from contact_form.models import Contact  # Importez le modèle
from django.core.mail import send_mail
from django.conf import settings


class HomeView(TemplateView):
    template_name = "index.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Logique de filtrage des posts
        if self.request.user.is_staff:
            latest_posts = BlogPost.objects.all().order_by('-created_on')[:10]
        else:
            latest_posts = BlogPost.objects.filter(published=True).order_by('-created_on')[:10]

        context['latest_posts'] = latest_posts
        context['form'] = ContactForm()
        return context

    def post(self, request, *args, **kwargs):
        form = ContactForm(request.POST)
        if form.is_valid():
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
                recipient_list=["contact@ai-technews.fr"],
                fail_silently=False,
            )

            # Redirection vers la page de succès
            return redirect('success')

        # Si le formulaire n'est pas valide, on réaffiche la page avec les erreurs
        context = self.get_context_data(**kwargs)
        context['form'] = form
        return self.render_to_response(context)