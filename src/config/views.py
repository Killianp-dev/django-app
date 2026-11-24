from django.views.generic import TemplateView
from django.shortcuts import redirect
from blog.models import BlogPost
from django.conf import settings as django_settings
from django.http import Http404
from config.metiers import FAQ_COMMUNE, metier_par_demo, metier_par_slug, metiers
from config.projects import exemples, projets
from config.seo import MARQUE, jsonld, organisation
from contact_form.forms import ContactForm
from contact_form.views import handle_contact, spam_rejection_reason
from django.conf import settings


class HomeView(TemplateView):
    template_name = "index.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Trois derniers articles publiés, pour la section blog de l'accueil.
        context['latest_posts'] = (
            BlogPost.objects.filter(published=True, category=BlogPost.COMMERCE)
            .order_by('-created_on', '-id')[:3]
        )
        context['projets'] = projets()
        for projet in context['projets']:
            projet.page_metier = metier_par_demo(projet.namespace)
        context['exemples'] = exemples(context['projets'])
        context['form'] = ContactForm()
        url = django_settings.SITE_URL
        context['jsonld'] = jsonld(
            organisation(),
            {
                "@type": "WebSite",
                "@id": f"{url}/#site",
                "name": MARQUE,
                "url": f"{url}/",
                "inLanguage": "fr-FR",
                "publisher": {"@id": f"{url}/#organisation"},
            },
        )
        return context

    def post(self, request, *args, **kwargs):
        form = ContactForm(request.POST)
        if spam_rejection_reason(form):
            return redirect('success')
        if form.is_valid():
            handle_contact(form)
            return redirect('success')

        # Si le formulaire n'est pas valide, on réaffiche la page avec les erreurs
        context = self.get_context_data(**kwargs)
        context['form'] = form
        return self.render_to_response(context)


class MetierView(TemplateView):
    """Page « Référencement et site internet pour <métier> »."""
    template_name = "metier.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        metier = metier_par_slug(kwargs["slug"])
        if metier is None:
            raise Http404("Métier inconnu")
        url = django_settings.SITE_URL
        page_url = f"{url}{metier.url}"
        faq = metier.faq + FAQ_COMMUNE
        context.update(
            metier=metier,
            autres=[m for m in metiers() if m is not metier],
            faq=faq,
            sujet=f"Référencement — {metier.nom}",
            jsonld=jsonld(
                {
                    "@type": "Service",
                    "@id": f"{page_url}#service",
                    "name": f"Référencement et site internet {metier.pour}",
                    "serviceType": "Référencement naturel (SEO) et création de site internet",
                    "description": metier.description,
                    "url": page_url,
                    "areaServed": {"@type": "Country", "name": "France"},
                    "audience": {"@type": "BusinessAudience", "name": metier.nom},
                    "provider": organisation(),
                },
                {
                    "@type": "FAQPage",
                    "@id": f"{page_url}#faq",
                    "mainEntity": [
                        {
                            "@type": "Question",
                            "name": question,
                            "acceptedAnswer": {"@type": "Answer", "text": reponse},
                        }
                        for question, reponse in faq
                    ],
                },
                {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": f"{url}/"},
                        {"@type": "ListItem", "position": 2, "name": "Référencement et site internet", "item": f"{url}/#exemples"},
                        {"@type": "ListItem", "position": 3, "name": metier.nom, "item": page_url},
                    ],
                },
            ),
        )
        return context

