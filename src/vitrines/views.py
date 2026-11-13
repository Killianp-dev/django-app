"""Pages communes aux quatre vitrines."""
import json
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.http import Http404
from django.urls import reverse
from django.views.generic import FormView, TemplateView

from .forms import ContactForm
from .sites import (
    filtres_realisations, get_site, offre_par_slug, offres_voisines, realisations_pour, tarifs_pour,
)

logger = logging.getLogger(__name__)


_JOURS_SCHEMA = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _schema_org(site, request):
    """Données structurées LocalBusiness : nom, adresse, horaires, lien."""
    data = {
        "@context": "https://schema.org",
        "@type": getattr(site, "schema_type", "LocalBusiness"),
        "name": site.nom,
        "description": site.description,
        "telephone": site.telephone,
        "email": site.email,
        "url": request.build_absolute_uri("/"),
        "address": {
            "@type": "PostalAddress",
            "streetAddress": site.adresse,
            "postalCode": site.code_postal,
            "addressLocality": site.ville,
            "addressCountry": "FR",
        },
    }
    jours = getattr(site, "horaires_semaine", None)
    if jours:
        data["openingHoursSpecification"] = [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": _JOURS_SCHEMA[index],
                "opens": jour.ouverture.zfill(5),
                "closes": jour.fermeture.zfill(5),
            }
            for index, jour in enumerate(jours)
            if jour.ouverture
        ]
    return json.dumps(data, ensure_ascii=False)


class SiteMixin:
    def site(self):
        site = get_site(self.request.resolver_match.namespace)
        if site is None:
            raise Http404("Vitrine inconnue")
        return site

    def get_template_names(self):
        """Un site peut surcharger une page : vitrine/sites/<clé>/<page>.html."""
        names = super().get_template_names()
        key = self.site().key
        return [name.replace("vitrine/pages/", f"vitrine/sites/{key}/") for name in names] + names

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        site = self.site()
        context["site"] = site
        context["schema_org"] = _schema_org(site, self.request)
        return context


class HomeView(SiteMixin, TemplateView):
    template_name = "vitrine/pages/home.html"


class OffreListView(SiteMixin, TemplateView):
    template_name = "vitrine/pages/offres.html"


class OffreDetailView(SiteMixin, TemplateView):
    template_name = "vitrine/pages/offre.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        offre = offre_par_slug(context["site"], self.kwargs["slug"])
        if offre is None:
            raise Http404("Page inconnue")
        precedente, suivante = offres_voisines(context["site"], offre.slug)
        context["offre"] = offre
        context["tarifs_groupe"] = tarifs_pour(context["site"], offre)
        context["realisations_liees"] = realisations_pour(context["site"], offre)
        context["offre_precedente"] = precedente
        context["offre_suivante"] = suivante
        return context


class AboutView(SiteMixin, TemplateView):
    template_name = "vitrine/pages/about.html"


class RealisationsView(SiteMixin, TemplateView):
    template_name = "vitrine/pages/realisations.html"

    def get(self, request, *args, **kwargs):
        if not getattr(self.site(), "realisations", None):
            raise Http404("Page inconnue")
        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["filtres"] = filtres_realisations(context["site"])
        return context


class FaqView(SiteMixin, TemplateView):
    template_name = "vitrine/pages/faq.html"

    def get(self, request, *args, **kwargs):
        if not getattr(self.site().labels, "faq_nav", None):
            raise Http404("Page inconnue")
        return super().get(request, *args, **kwargs)


class TarifsView(SiteMixin, TemplateView):
    template_name = "vitrine/pages/tarifs.html"

    def get(self, request, *args, **kwargs):
        if not getattr(self.site(), "tarifs", None):
            raise Http404("Page inconnue")
        return super().get(request, *args, **kwargs)


class ContactView(SiteMixin, FormView):
    template_name = "vitrine/pages/contact.html"
    form_class = ContactForm

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["site"] = self.site()
        return kwargs

    def get_initial(self):
        """?prestation=Coupe pré-sélectionne la prestation, si elle existe."""
        initial = super().get_initial()
        demande = self.request.GET.get("prestation", "")
        if any(offre.nom == demande for offre in self.site().offres):
            initial["offre"] = demande
        return initial

    def get_success_url(self):
        return reverse(f"{self.request.resolver_match.namespace}:contact_success")

    def form_valid(self, form):
        data = form.cleaned_data
        site = self.site()
        recipient = getattr(settings, "VITRINE_DEMO_NOTIFY_EMAIL", "contact@killianp-dev.fr")
        body = (
            f"Message envoyé depuis la vitrine de démonstration ({site.nature}).\n\n"
            f"Nom : {data['name']}\n"
            f"Email : {data['email']}\n"
            f"Téléphone : {data['phone'] or 'Non renseigné'}\n"
            f"{site.labels.offre} : {data['offre'] or 'Non précisé'}\n\n"
            f"{data['message']}\n"
        )
        try:
            send_mail(
                subject=f"[DÉMO {site.mail_tag}] Nouveau message de {data['name']}",
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False,
            )
        except Exception:
            logger.exception("Envoi du message de la vitrine %s impossible", site.key)
        return super().form_valid(form)


class ContactSuccessView(SiteMixin, TemplateView):
    template_name = "vitrine/pages/contact_success.html"


class LegalNoticeView(SiteMixin, TemplateView):
    template_name = "vitrine/pages/legal_notice.html"


class PrivacyView(SiteMixin, TemplateView):
    template_name = "vitrine/pages/privacy.html"
