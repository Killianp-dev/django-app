"""
Vues pour le site vitrine architecte.
Toutes les vues utilisent ArchiContextMixin pour injecter 'site' et 'demo_mode'.
"""
from django.views.generic import TemplateView, ListView, DetailView, FormView
from django.urls import reverse_lazy
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404

from .mixins import ArchiContextMixin
from .portfolio.models import MissionType, Project
from .contact.forms import ContactForm
from .contact.models import Contact


class HomeView(ArchiContextMixin, TemplateView):
    """Page d'accueil."""
    template_name = 'archi/pages/home.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Projets mis en avant
        context['featured_projects'] = Project.objects.filter(
            publie=True,
            mis_en_avant=True
        ).prefetch_related('types_mission', 'photos')[:6]
        
        # Types de mission pour les cartes
        context['mission_types'] = MissionType.objects.all()[:6]
        
        return context


class PortfolioListView(ArchiContextMixin, ListView):
    """Liste des projets, filtrables par type de mission."""
    model = Project
    template_name = 'archi/pages/portfolio_list.html'
    context_object_name = 'projects'
    
    def get_queryset(self):
        qs = Project.objects.filter(publie=True).prefetch_related('types_mission', 'photos')
        
        # Filtre par type de mission (query param ?mission=slug)
        mission_slug = self.request.GET.get('mission')
        if mission_slug:
            qs = qs.filter(types_mission__slug=mission_slug)
        
        return qs
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Types de mission pour le filtre
        context['mission_types'] = MissionType.objects.all()
        context['current_mission'] = self.request.GET.get('mission', '')
        
        return context


class ProjectDetailView(ArchiContextMixin, DetailView):
    """Fiche projet."""
    model = Project
    template_name = 'archi/pages/project_detail.html'
    context_object_name = 'project'
    
    def get_queryset(self):
        return Project.objects.filter(publie=True).prefetch_related('types_mission', 'photos')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Projets liés (même type de mission)
        project = self.object
        if project.types_mission.exists():
            context['related_projects'] = Project.objects.filter(
                publie=True,
                types_mission__in=project.types_mission.all()
            ).exclude(pk=project.pk).distinct()[:3]
        else:
            context['related_projects'] = []
        
        # Navigation précédent/suivant
        all_projects = Project.objects.filter(publie=True).order_by('-order', '-created_at')
        project_list = list(all_projects.values_list('slug', flat=True))
        
        try:
            current_index = project_list.index(project.slug)
            if current_index > 0:
                context['previous_project'] = all_projects[current_index - 1]
            if current_index < len(project_list) - 1:
                context['next_project'] = all_projects[current_index + 1]
        except (ValueError, IndexError):
            pass
        
        return context


class MissionDetailView(ArchiContextMixin, DetailView):
    """Page d'un type de mission."""
    model = MissionType
    template_name = 'archi/pages/mission_detail.html'
    context_object_name = 'mission'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Projets de ce type
        context['projects'] = Project.objects.filter(
            publie=True,
            types_mission=self.object
        ).prefetch_related('photos')
        
        return context


class AboutView(ArchiContextMixin, TemplateView):
    """Page à propos / agence."""
    template_name = 'archi/pages/about.html'


class ContactView(ArchiContextMixin, FormView):
    """
    Formulaire de contact.
    Enregistre + envoie email (au cabinet ou à Killian en mode démo).
    """
    template_name = 'archi/pages/contact.html'
    form_class = ContactForm
    success_url = reverse_lazy('archi:contact_success')
    
    def form_valid(self, form):
        """Enregistre le message et envoie l'email."""
        # Enregistrement
        contact = form.save()
        
        # Email
        demo_mode = getattr(settings, 'ARCHI_DEMO_MODE', False)
        
        if demo_mode:
            # Mode démo : email uniquement à Killian
            recipient = getattr(settings, 'ARCHI_DEMO_NOTIFY_EMAIL', 'contact@killianp-dev.fr')
            subject = f"[DÉMO architecte] Nouveau message de {contact.name}"
        else:
            # Mode client : email au cabinet
            from .cabinet.models import SiteSettings
            try:
                site_settings = SiteSettings.objects.get()
                recipient = site_settings.email
            except SiteSettings.DoesNotExist:
                recipient = settings.DEFAULT_FROM_EMAIL
            subject = f"[Contact] Nouveau message de {contact.name}"
        
        # Corps de l'email
        message_body = f"""
Nouveau message via le formulaire de contact :

Nom : {contact.name}
Email : {contact.email}
Téléphone : {contact.phone or 'Non renseigné'}
Type de projet : {contact.mission_type or 'Non spécifié'}
Commune : {contact.commune or 'Non spécifiée'}

Message :
{contact.message}

---
Reçu le {contact.created_at.strftime('%d/%m/%Y à %H:%M')}
"""
        
        try:
            send_mail(
                subject=subject,
                message=message_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                fail_silently=False
            )
        except Exception as e:
            print(f"Erreur envoi email contact : {e}")
            # On continue quand même (message enregistré)
        
        return super().form_valid(form)


class ContactSuccessView(ArchiContextMixin, TemplateView):
    """Page de confirmation après envoi du formulaire."""
    template_name = 'archi/pages/contact_success.html'


class LegalNoticeView(ArchiContextMixin, TemplateView):
    """Mentions légales."""
    template_name = 'archi/pages/legal_notice.html'


class PrivacyView(ArchiContextMixin, TemplateView):
    """Politique de confidentialité."""
    template_name = 'archi/pages/privacy.html'
