"""
Commande attach_demo_photos : attache les photos téléchargées (Unsplash, libres de droits)
aux objets SiteSettings, MissionType et Project (déclenche la génération WebP automatique).
Usage : python manage.py attach_demo_photos --source=/tmp/archi_demo_images
"""
import os
from django.core.management.base import BaseCommand, CommandError
from django.core.files import File

from archi.cabinet.models import SiteSettings
from archi.portfolio.models import MissionType, Project, ProjectPhoto


class Command(BaseCommand):
    help = 'Attache des photos de démo (libres de droits) aux objets existants'

    def add_arguments(self, parser):
        parser.add_argument('--source', type=str, required=True, help='Dossier source des images')

    def handle(self, *args, **options):
        source = options['source']
        if not os.path.isdir(source):
            raise CommandError(f"Dossier introuvable : {source}")

        def open_file(name):
            path = os.path.join(source, name)
            if not os.path.exists(path):
                self.stdout.write(self.style.WARNING(f"  ! Fichier manquant : {name}"))
                return None
            return File(open(path, 'rb'), name=name)

        # ===== SiteSettings =====
        try:
            site = SiteSettings.objects.get()
            f = open_file('hero_maison.jpg')
            if f:
                site.image_accueil.save('hero_maison.jpg', f, save=False)
            f = open_file('architecte_portrait.jpg')
            if f:
                site.photo_architecte.save('architecte_portrait.jpg', f, save=False)
            f = open_file('og_image.jpg')
            if f:
                site.image_og.save('og_image.jpg', f, save=False)
            site.save()
            self.stdout.write(self.style.SUCCESS("✓ SiteSettings : images attachées"))
        except SiteSettings.DoesNotExist:
            self.stdout.write(self.style.WARNING("! SiteSettings introuvable (lancez seed_demo d'abord)"))

        # ===== MissionType =====
        mission_images = {
            'Construction neuve': 'mission_construction.jpg',
            'Rénovation / Réhabilitation': 'mission_renovation.jpg',
            'Extension': 'mission_extension.jpg',
            'Aménagement intérieur': 'mission_amenagement.jpg',
            'Expertise': 'mission_expertise.jpg',
        }
        for name, filename in mission_images.items():
            try:
                mission = MissionType.objects.get(name=name)
                f = open_file(filename)
                if f:
                    mission.image.save(filename, f, save=True)
                    self.stdout.write(f"  ✓ Mission '{name}' : image attachée")
            except MissionType.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"  ! Mission introuvable : {name}"))

        # ===== Project + ProjectPhoto =====
        project_photos = {
            'Maison à Lyon': [
                ('maison_facade.jpg', 'Façade de la maison, vue depuis le jardin', True),
                ('maison_salon.jpg', 'Salon traversant baigné de lumière naturelle', False),
                ('maison_cuisine.jpg', 'Cuisine ouverte sur le séjour', False),
                ('maison_chambre.jpg', 'Chambre principale avec grandes ouvertures', False),
            ],
            "Rénovation d'un appartement à Lyon": [
                ('renov_salon.jpg', 'Séjour après rénovation complète', True),
                ('renov_cuisine.jpg', 'Cuisine entièrement repensée', False),
                ('renov_salledebain.jpg', 'Salle de bain modernisée', False),
            ],
            "Extension d'une maison à Villeurbanne": [
                ('extension_veranda.jpg', "Extension vitrée côté jardin", True),
                ('extension_exterieur.jpg', "Vue extérieure de l'extension", False),
            ],
        }

        for project_title, photos in project_photos.items():
            try:
                project = Project.objects.get(titre=project_title)

                # Supprime les anciennes photos sans image (évite les doublons si relancé)
                existing_count = project.photos.count()
                if existing_count > 0:
                    self.stdout.write(f"  • Projet '{project_title}' a déjà {existing_count} photo(s), ajout quand même")

                for order, (filename, alt, is_cover) in enumerate(photos):
                    f = open_file(filename)
                    if not f:
                        continue

                    # Évite les doublons par nom de fichier déjà attaché
                    already = project.photos.filter(alt=alt).exists()
                    if already:
                        self.stdout.write(f"    • Photo déjà présente : {alt}")
                        continue

                    photo = ProjectPhoto(
                        project=project,
                        alt=alt,
                        legende=alt,
                        credit='Photo libre de droits (Unsplash)',
                        order=order,
                    )
                    photo.image.save(filename, f, save=False)
                    photo.save()
                    self.stdout.write(f"    ✓ Photo ajoutée : {alt}")

                self.stdout.write(self.style.SUCCESS(f"✓ Projet '{project_title}' : photos traitées"))

            except Project.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"! Projet introuvable : {project_title}"))

        self.stdout.write(self.style.SUCCESS("\n✓ Toutes les photos ont été attachées (variantes WebP générées automatiquement)."))
