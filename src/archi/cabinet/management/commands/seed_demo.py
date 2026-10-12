"""
Commande seed_demo : génère des données fictives pour la démo.
Options :
  --ville=Lyon : ville du cabinet fictif
  --reset : purge complète avant recréation (mode démo uniquement)
"""
import os
import shutil
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.contrib.sessions.models import Session
from django.contrib.auth.models import User, Group
from django.conf import settings
from django.db import transaction

from archi.cabinet.models import SiteSettings
from archi.portfolio.models import MissionType, Project, ProjectPhoto
from archi.contact.models import Contact


class Command(BaseCommand):
    help = 'Génère des données fictives pour la démo architecte'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--ville',
            type=str,
            default='Lyon',
            help='Ville du cabinet fictif'
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Purge complète puis recréation (mode démo uniquement)'
        )
    
    def handle(self, *args, **options):
        ville = options['ville']
        reset = options['reset']
        
        # Protection : --reset uniquement en mode démo
        if reset and not getattr(settings, 'ARCHI_DEMO_MODE', False):
            raise CommandError(
                "L'option --reset n'est autorisée qu'en mode démo (ARCHI_DEMO_MODE=True). "
                "Cela protège les données d'une instance client."
            )
        
        if reset:
            self.stdout.write(self.style.WARNING('Mode RESET : purge complète...'))
            with transaction.atomic():
                self._purge_demo_data()
        
        self.stdout.write(f"Création des données démo pour {ville}...")
        
        with transaction.atomic():
            self._create_demo_data(ville)
        
        self.stdout.write(self.style.SUCCESS(f'✓ Données démo créées avec succès ({ville})'))
    
    def _purge_demo_data(self):
        """Purge toutes les tables archi_* et les médias archi/."""
        # Tables
        Contact.objects.all().delete()
        ProjectPhoto.objects.all().delete()
        Project.objects.all().delete()
        MissionType.objects.all().delete()
        SiteSettings.objects.all().delete()
        
        # Médias archi/uploads/
        media_root = Path(settings.MEDIA_ROOT) / 'archi' / 'uploads'
        if media_root.exists():
            shutil.rmtree(media_root)
            self.stdout.write(f"  - Médias archi/uploads/ supprimés")
        
        # Sessions du compte démo
        try:
            demo_user = User.objects.get(username='demo')
            Session.objects.filter(
                session_key__in=demo_user.session_set.values_list('session_key', flat=True)
            ).delete()
            self.stdout.write("  - Sessions démo fermées")
        except User.DoesNotExist:
            pass
        
        self.stdout.write(self.style.WARNING('  Tables archi_* purgées'))
    
    def _create_demo_data(self, ville):
        """Crée le cabinet fictif et des projets."""
        
        # SiteSettings
        site, created = SiteSettings.objects.get_or_create(
            pk=1,
            defaults={
                'nom_cabinet': f'Atelier {ville}',
                'slogan': 'Architecture contemporaine et responsable',
                'nom_architecte': 'Marie Dupont',
                'titre_architecte': 'DE-HMONP',
                'numero_ordre': 'DEMO-123456',  # Marqué fictif
                'conseil_regional': 'Auvergne-Rhône-Alpes',
                'ville': ville,
                'adresse': f'15 rue de la République',
                'code_postal': '69001' if ville == 'Lyon' else '44000',
                'telephone': '04 12 34 56 78',
                'email': 'contact@atelier-demo.fr',
                'zone_intervention': f'{ville} et sa métropole',
                'accroche_accueil': 'Nous concevons des espaces de vie sur mesure, '
                                   'en harmonie avec votre environnement.',
                'texte_a_propos': "Diplômée de l'École d'architecture de Lyon, "
                                 "je suis passionnée par l'architecture bioclimatique "
                                 "et les matériaux durables.\n\n"
                                 "Chaque projet est une rencontre unique avec un lieu, "
                                 "un contexte et des aspirations.",
                'forme_juridique': 'EURL',
                'siret': '12345678901234',
                'hebergeur': 'IONOS SARL, 7 place de la Gare, 57200 Sarreguemines',
                'directeur_publication': 'Marie Dupont',
                'title_default': f'Atelier {ville} — Architecte DE-HMONP',
                'description_default': f"Cabinet d'architecture à {ville}, "
                                      "spécialisé en construction neuve, rénovation et extension.",
            }
        )
        
        if created:
            self.stdout.write(f"  ✓ SiteSettings créé : {site}")
        else:
            self.stdout.write(f"  • SiteSettings existant conservé")
        
        # Types de mission
        missions_data = [
            ('Construction neuve', 0, 'Conception de maisons individuelles contemporaines'),
            ('Rénovation / Réhabilitation', 1, 'Rénovation énergétique et mise aux normes'),
            ('Extension', 2, 'Extension de maisons existantes'),
            ('Aménagement intérieur', 3, 'Aménagement et optimisation des espaces'),
            ('Expertise', 4, 'Expertise technique et conseil'),
        ]
        
        missions = {}
        for name, order, accroche in missions_data:
            mission, created = MissionType.objects.get_or_create(
                name=name,
                defaults={'order': order, 'accroche': accroche}
            )
            missions[name] = mission
            if created:
                self.stdout.write(f"  ✓ MissionType : {name}")
        
        # Projets fictifs
        projects_data = [
            {
                'titre': f'Maison à {ville}',
                'types': ['Construction neuve'],
                'ville': ville,
                'annee': 2023,
                'surface': 150,
                'programme': "Maison d'habitation",
                'statut': 'livre',
                'description': 'Maison contemporaine ossature bois, intégrée dans le paysage.',
                'mis_en_avant': True,
            },
            {
                'titre': f"Rénovation d'un appartement à {ville}",
                'types': ['Rénovation / Réhabilitation', 'Aménagement intérieur'],
                'ville': ville,
                'annee': 2024,
                'surface': 85,
                'programme': 'Appartement',
                'statut': 'livre',
                'description': 'Rénovation complète avec optimisation des espaces.',
                'mis_en_avant': True,
            },
            {
                'titre': "Extension d'une maison à Villeurbanne",
                'types': ['Extension'],
                'ville': 'Villeurbanne' if ville == 'Lyon' else ville,
                'annee': 2024,
                'surface': 40,
                'programme': 'Extension',
                'statut': 'en_cours',
                'description': 'Extension vitrée pour créer un espace lumineux.',
                'mis_en_avant': False,
            },
        ]
        
        for i, pdata in enumerate(projects_data):
            types = pdata.pop('types')
            project, created = Project.objects.get_or_create(
                titre=pdata['titre'],
                defaults={**pdata, 'order': i}
            )
            
            if created:
                # Associe les types de mission
                for tname in types:
                    if tname in missions:
                        project.types_mission.add(missions[tname])
                
                self.stdout.write(f"  ✓ Projet : {project.titre}")
            else:
                self.stdout.write(f"  • Projet existant : {project.titre}")
        
        self.stdout.write(self.style.SUCCESS(
            f"\n💡 Mention importante : les données créées sont marquées comme fictives "
            f"(n° Ordre DEMO-123456). En mode démo, elles ne sont pas indexées par Google."
        ))
