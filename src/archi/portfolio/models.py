"""
Modèles Portfolio : MissionType, Project, ProjectPhoto.
Génération automatique des variantes WebP (640/1280/1920) + JPEG à l'upload.
"""
import os
from pathlib import Path
from PIL import Image
from django.db import models
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator
from django.urls import reverse


class MissionType(models.Model):
    """Type de mission proposé (Maison individuelle, Rénovation, etc.)."""
    
    name = models.CharField(
        max_length=100,
        verbose_name="Nom",
        unique=True
    )
    slug = models.SlugField(
        max_length=120,
        unique=True,
        verbose_name="Slug (URL)"
    )
    accroche = models.CharField(
        max_length=200,
        verbose_name="Accroche",
        blank=True,
        help_text="Phrase courte"
    )
    description = models.TextField(
        verbose_name="Description",
        blank=True
    )
    etapes = models.TextField(
        verbose_name="Étapes de la mission",
        blank=True,
        help_text="Déroulé de la mission"
    )
    image = models.ImageField(
        upload_to='archi/missions/',
        verbose_name="Image",
        blank=True,
        null=True
    )
    title_seo = models.CharField(
        max_length=60,
        verbose_name="Title SEO",
        blank=True,
        help_text="≤ 60 caractères"
    )
    description_seo = models.CharField(
        max_length=155,
        verbose_name="Description SEO",
        blank=True,
        help_text="≤ 155 caractères"
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Ordre",
        help_text="Position dans le menu et les cartes (0 = premier)"
    )
    
    class Meta:
        verbose_name = "Type de mission"
        verbose_name_plural = "Types de mission"
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def get_absolute_url(self):
        return reverse('archi:mission_detail', kwargs={'slug': self.slug})


class Project(models.Model):
    """Projet d'architecture présenté dans le portfolio."""
    
    STATUT_CHOICES = [
        ('livre', 'Livré'),
        ('en_cours', 'En cours'),
        ('etude', 'Étude'),
    ]
    
    titre = models.CharField(
        max_length=200,
        verbose_name="Titre"
    )
    slug = models.SlugField(
        max_length=220,
        unique=True,
        verbose_name="Slug (URL)"
    )
    types_mission = models.ManyToManyField(
        MissionType,
        verbose_name="Types de mission",
        related_name='projects',
        blank=True,
        help_text="Un projet peut avoir plusieurs types (Extension + Rénovation)"
    )
    ville = models.CharField(
        max_length=100,
        verbose_name="Ville"
    )
    annee = models.PositiveIntegerField(
        verbose_name="Année",
        blank=True,
        null=True
    )
    surface = models.PositiveIntegerField(
        verbose_name="Surface (m²)",
        blank=True,
        null=True
    )
    programme = models.CharField(
        max_length=200,
        verbose_name="Programme",
        blank=True,
        help_text="Ex: Maison d'habitation, Local commercial"
    )
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='livre',
        verbose_name="Statut"
    )
    description = models.TextField(
        verbose_name="Description",
        blank=True
    )
    budget = models.PositiveIntegerField(
        verbose_name="Budget (€)",
        blank=True,
        null=True,
        help_text="Affichage à déterminer par le cabinet"
    )
    mis_en_avant = models.BooleanField(
        default=False,
        verbose_name="Mis en avant",
        help_text="Affiché sur la page d'accueil"
    )
    publie = models.BooleanField(
        default=True,
        verbose_name="Publié"
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Ordre",
        help_text="Ordre d'affichage"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Créé le"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Modifié le"
    )
    
    class Meta:
        verbose_name = "Projet"
        verbose_name_plural = "Projets"
        ordering = ['-order', '-created_at']
    
    def __str__(self):
        return self.titre
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.titre)
        super().save(*args, **kwargs)
    
    def get_absolute_url(self):
        return reverse('archi:project_detail', kwargs={'slug': self.slug})
    
    def get_main_photo(self):
        """Retourne la première photo (order le plus bas) ou None."""
        return self.photos.first()  # Tri par 'order', 'id' défini dans ProjectPhoto


class ProjectPhoto(models.Model):
    """
    Photo d'un projet.
    À l'upload, génère automatiquement WebP en 3 largeurs + JPEG de repli.
    """
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name="Projet"
    )
    image = models.ImageField(
        upload_to='archi/projects/',
        verbose_name="Image",
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])]
    )
    legende = models.CharField(
        max_length=200,
        verbose_name="Légende",
        blank=True
    )
    credit = models.CharField(
        max_length=200,
        verbose_name="Crédit photo",
        blank=True
    )
    alt = models.CharField(
        max_length=200,
        verbose_name="Texte alternatif",
        help_text="Obligatoire pour l'accessibilité. Laissez vide seulement si l'image est purement décorative."
    )
    decorative = models.BooleanField(
        default=False,
        verbose_name="Image décorative",
        help_text="Cochez si l'image n'apporte pas d'information (alt sera vide)"
    )
    width = models.PositiveIntegerField(
        verbose_name="Largeur (px)",
        editable=False,
        null=True,
        blank=True,
        help_text="Rempli automatiquement"
    )
    height = models.PositiveIntegerField(
        verbose_name="Hauteur (px)",
        editable=False,
        null=True,
        blank=True,
        help_text="Rempli automatiquement"
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Ordre",
        help_text="0 = première photo (photo principale du projet)"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Ajoutée le"
    )
    
    class Meta:
        verbose_name = "Photo de projet"
        verbose_name_plural = "Photos de projet"
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.project.titre} — Photo {self.order + 1}"
    
    def clean(self):
        """Validation : alt obligatoire sauf si decorative=True."""
        from django.core.exceptions import ValidationError
        if not self.decorative and not self.alt:
            raise ValidationError({
                'alt': "Le texte alternatif est obligatoire. "
                       "Cochez 'Image décorative' seulement si elle n'apporte aucune information."
            })
    
    def save(self, *args, **kwargs):
        """
        À l'upload d'une nouvelle image :
        1. Ouvre avec Pillow et récupère width/height
        2. Génère 3 variantes WebP (640, 1280, 1920 px) sans agrandir
        3. Génère 1 JPEG de repli
        """
        self.full_clean()
        
        # Si l'image vient d'être uploadée
        if self.image and (not self.pk or self._state.adding):
            try:
                img = Image.open(self.image)
                
                # Correction orientation EXIF
                try:
                    from PIL import ImageOps
                    img = ImageOps.exif_transpose(img)
                except Exception:
                    pass
                
                # Stocke dimensions originales
                self.width, self.height = img.size
                
                # Convertit en RGB si nécessaire (PNG transparent → blanc)
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Génère les variantes après save du fichier original
                # (on va les créer dans un post_save pour avoir self.pk)
                self._generate_variants = True
                self._pil_image = img
                
            except Exception as e:
                # En cas d'erreur Pillow, on laisse passer mais on log
                print(f"Erreur traitement image {self.image.name}: {e}")
                self._generate_variants = False
        
        super().save(*args, **kwargs)
        
        # Génération des variantes après save (besoin du pk)
        if hasattr(self, '_generate_variants') and self._generate_variants:
            self._create_image_variants(self._pil_image)
            delattr(self, '_generate_variants')
            delattr(self, '_pil_image')
    
    def _create_image_variants(self, img):
        """
        Crée les variantes WebP (640, 1280, 1920) + JPEG dans le même dossier.
        Nom : projects/nom-original_640w.webp, etc.
        """
        from django.core.files.storage import default_storage
        
        original_path = self.image.name
        base_dir = os.path.dirname(original_path)
        base_name = Path(original_path).stem  # Sans extension
        
        widths = [640, 1280, 1920]
        
        for width in widths:
            # Ne pas agrandir
            if img.width <= width:
                resized = img
            else:
                # Calcul hauteur proportionnelle
                height = int(img.height * (width / img.width))
                resized = img.resize((width, height), Image.Resampling.LANCZOS)
            
            # WebP
            webp_name = f"{base_dir}/{base_name}_{width}w.webp"
            webp_path = default_storage.path(webp_name)
            os.makedirs(os.path.dirname(webp_path), exist_ok=True)
            resized.save(webp_path, 'WEBP', quality=85, method=6)
            
            # JPEG (repli)
            jpeg_name = f"{base_dir}/{base_name}_{width}w.jpg"
            jpeg_path = default_storage.path(jpeg_name)
            resized.save(jpeg_path, 'JPEG', quality=85, optimize=True)
    
    def get_image_variants(self):
        """
        Retourne un dict avec les URLs des variantes pour <picture>.
        Format : {
            'webp': {'640': '/media/...', '1280': '...', '1920': '...'},
            'jpeg': {'640': '...', ...}
        }
        """
        from django.templatetags.static import static
        from django.conf import settings
        
        if not self.image:
            return None
        
        base_name = Path(self.image.name).stem
        base_dir = os.path.dirname(self.image.name)
        
        variants = {
            'webp': {},
            'jpeg': {}
        }
        
        for width in [640, 1280, 1920]:
            variants['webp'][str(width)] = f"{settings.MEDIA_URL}{base_dir}/{base_name}_{width}w.webp"
            variants['jpeg'][str(width)] = f"{settings.MEDIA_URL}{base_dir}/{base_name}_{width}w.jpg"
        
        return variants
