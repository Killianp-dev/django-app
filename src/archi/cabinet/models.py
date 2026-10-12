"""
Modèle SiteSettings : configuration unique (singleton) du cabinet d'architecte.
Validation stricte des couleurs (hex + contraste AA ≥ 4.5:1).
"""
import re
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator


# Choix pour les polices (auto-hébergées en WOFF2)
FONT_CHOICES = [
    ('system-ui', 'Fonte système'),
    ('Inter', 'Inter'),
    ('Playfair Display', 'Playfair Display (élégant, serif)'),
]

# Choix pour le titre d'architecte
TITRE_CHOICES = [
    ('DPLG', 'DPLG'),
    ('DE', 'DE'),
    ('DE-HMONP', 'DE-HMONP'),
    ('HMONP', 'HMONP'),
]


def validate_hex_color(value):
    """Valide un code couleur hexadécimal #RRGGBB."""
    if not re.match(r'^#[0-9A-Fa-f]{6}$', value):
        raise ValidationError(
            f"'{value}' n'est pas un code couleur hexadécimal valide. "
            "Format attendu : #RRGGBB (ex: #1a2b3c)"
        )


def hex_to_rgb(hex_color):
    """Convertit #RRGGBB en tuple (R, G, B) [0-255]."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def relative_luminance(rgb):
    """Calcule la luminance relative d'une couleur RGB (WCAG 2.1)."""
    r, g, b = [x / 255.0 for x in rgb]
    r = r / 12.92 if r <= 0.03928 else ((r + 0.055) / 1.055) ** 2.4
    g = g / 12.92 if g <= 0.03928 else ((g + 0.055) / 1.055) ** 2.4
    b = b / 12.92 if b <= 0.03928 else ((b + 0.055) / 1.055) ** 2.4
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(color1, color2):
    """Calcule le ratio de contraste entre deux couleurs hex (WCAG 2.1)."""
    lum1 = relative_luminance(hex_to_rgb(color1))
    lum2 = relative_luminance(hex_to_rgb(color2))
    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)


class SiteSettings(models.Model):
    """
    Configuration unique du site (singleton).
    Tous les champs obligatoires sont marqués blank=False.
    """
    
    # ===== IDENTITÉ =====
    nom_cabinet = models.CharField(
        max_length=200,
        verbose_name="Nom du cabinet",
        help_text="Nom affiché sur le site (obligatoire)",
        blank=False
    )
    slogan = models.CharField(
        max_length=200,
        verbose_name="Slogan / Accroche",
        blank=True
    )
    logo = models.ImageField(
        upload_to='archi/site/',
        verbose_name="Logo",
        blank=True,
        null=True,
        help_text="Format recommandé : SVG ou PNG transparent"
    )
    favicon = models.ImageField(
        upload_to='archi/site/',
        verbose_name="Favicon",
        blank=True,
        null=True,
        help_text="32×32 ou 64×64 px, PNG"
    )
    image_og = models.ImageField(
        upload_to='archi/site/',
        verbose_name="Image Open Graph",
        blank=True,
        null=True,
        help_text="1200×630 px pour les partages réseaux sociaux"
    )
    image_accueil = models.ImageField(
        upload_to='archi/site/',
        verbose_name="Image d'accueil",
        blank=True,
        null=True,
        help_text="Image principale de la page d'accueil"
    )
    
    # ===== ARCHITECTE (OBLIGATOIRES POUR ORDRE) =====
    nom_architecte = models.CharField(
        max_length=200,
        verbose_name="Nom de l'architecte",
        help_text="Nom complet (obligatoire)",
        blank=False
    )
    titre_architecte = models.CharField(
        max_length=20,
        choices=TITRE_CHOICES,
        verbose_name="Titre d'architecte",
        help_text="DPLG, DE, DE-HMONP, HMONP (obligatoire)",
        blank=False
    )
    numero_ordre = models.CharField(
        max_length=50,
        verbose_name="N° d'inscription à l'Ordre",
        help_text="Numéro d'inscription obligatoire (réglementation)",
        blank=False,
        validators=[RegexValidator(
            regex=r'^[A-Z0-9-]+$',
            message="Format invalide. Ex: A-123456"
        )]
    )
    conseil_regional = models.CharField(
        max_length=200,
        verbose_name="Conseil régional de l'Ordre",
        help_text="Ex: Auvergne-Rhône-Alpes (obligatoire)",
        blank=False
    )
    
    # ===== NAP (Nom Adresse Téléphone - base SEO local) =====
    adresse = models.TextField(
        verbose_name="Adresse",
        help_text="Adresse postale complète",
        blank=True
    )
    code_postal = models.CharField(
        max_length=10,
        verbose_name="Code postal",
        blank=True
    )
    ville = models.CharField(
        max_length=100,
        verbose_name="Ville",
        help_text="Ville du cabinet (obligatoire pour SEO local)",
        blank=False
    )
    telephone = models.CharField(
        max_length=20,
        verbose_name="Téléphone",
        blank=True
    )
    email = models.EmailField(
        verbose_name="Email de contact",
        help_text="Email où arrivent les messages du formulaire",
        blank=True
    )
    zone_intervention = models.CharField(
        max_length=200,
        verbose_name="Zone d'intervention",
        help_text="Ex: Lyon et sa métropole",
        blank=True
    )
    horaires = models.TextField(
        verbose_name="Horaires d'ouverture",
        help_text="Horaires de contact",
        blank=True
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        verbose_name="Latitude",
        blank=True,
        null=True,
        help_text="Coordonnées GPS pour JSON-LD"
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        verbose_name="Longitude",
        blank=True,
        null=True
    )
    
    # ===== TEXTES =====
    accroche_accueil = models.TextField(
        verbose_name="Accroche d'accueil",
        help_text="Texte principal de la page d'accueil",
        blank=True
    )
    texte_a_propos = models.TextField(
        verbose_name="Texte « À propos »",
        help_text="Présentation du cabinet / parcours",
        blank=True
    )
    photo_architecte = models.ImageField(
        upload_to='archi/site/',
        verbose_name="Photo de l'architecte",
        blank=True,
        null=True
    )
    
    # ===== LÉGAL =====
    forme_juridique = models.CharField(
        max_length=100,
        verbose_name="Forme juridique",
        help_text="Ex: SARL, EURL, Auto-entrepreneur",
        blank=True
    )
    siret = models.CharField(
        max_length=14,
        verbose_name="SIRET",
        blank=True,
        validators=[RegexValidator(
            regex=r'^\d{14}$',
            message="Le SIRET doit contenir 14 chiffres"
        )]
    )
    assurance_nom = models.CharField(
        max_length=200,
        verbose_name="Assureur",
        help_text="Nom de l'assurance professionnelle",
        blank=True
    )
    assurance_numero = models.CharField(
        max_length=100,
        verbose_name="N° de contrat d'assurance",
        blank=True
    )
    hebergeur = models.CharField(
        max_length=200,
        verbose_name="Hébergeur",
        default="IONOS SARL, 7 place de la Gare, 57200 Sarreguemines",
        blank=True
    )
    directeur_publication = models.CharField(
        max_length=200,
        verbose_name="Directeur de publication",
        help_text="Généralement le nom de l'architecte",
        blank=True
    )
    
    # ===== SEO =====
    title_default = models.CharField(
        max_length=60,
        verbose_name="Title par défaut",
        help_text="≤ 60 caractères",
        blank=True
    )
    description_default = models.CharField(
        max_length=155,
        verbose_name="Description par défaut",
        help_text="≤ 155 caractères",
        blank=True
    )
    
    # ===== THÈME (9 couleurs hex + 2 polices) =====
    color_bg = models.CharField(
        max_length=7,
        default='#FAF8F4',
        verbose_name="Couleur fond",
        validators=[validate_hex_color],
        help_text="Fond principal (#RRGGBB)"
    )
    color_surface = models.CharField(
        max_length=7,
        default='#EFEBE2',
        verbose_name="Couleur surface",
        validators=[validate_hex_color],
        help_text="Fonds de cartes/sections"
    )
    color_ink = models.CharField(
        max_length=7,
        default='#262320',
        verbose_name="Couleur texte",
        validators=[validate_hex_color],
        help_text="Texte principal"
    )
    color_ink_soft = models.CharField(
        max_length=7,
        default='#6B6459',
        verbose_name="Couleur texte secondaire",
        validators=[validate_hex_color],
        help_text="Texte moins important"
    )
    color_accent = models.CharField(
        max_length=7,
        default='#7C5C3E',
        verbose_name="Couleur accent",
        validators=[validate_hex_color],
        help_text="Boutons, liens"
    )
    color_accent_hover = models.CharField(
        max_length=7,
        default='#5F4530',
        verbose_name="Couleur accent survol",
        validators=[validate_hex_color],
        help_text="État hover des boutons"
    )
    color_on_accent = models.CharField(
        max_length=7,
        default='#FFFFFF',
        verbose_name="Couleur texte sur accent",
        validators=[validate_hex_color],
        help_text="Texte sur boutons colorés"
    )
    color_border = models.CharField(
        max_length=7,
        default='#DED6C8',
        verbose_name="Couleur bordure",
        validators=[validate_hex_color],
        help_text="Séparateurs, cadres"
    )
    color_focus = models.CharField(
        max_length=7,
        default='#7C5C3E',
        verbose_name="Couleur focus",
        validators=[validate_hex_color],
        help_text="Indicateur de focus clavier"
    )
    
    font_heading = models.CharField(
        max_length=50,
        default='Playfair Display',
        choices=FONT_CHOICES,
        verbose_name="Police des titres"
    )
    font_body = models.CharField(
        max_length=50,
        default='Inter',
        choices=FONT_CHOICES,
        verbose_name="Police du texte"
    )
    
    # ===== META =====
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créé le")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Modifié le")
    
    class Meta:
        verbose_name = "Paramètres du site"
        verbose_name_plural = "Paramètres du site"
    
    def __str__(self):
        return f"Paramètres — {self.nom_cabinet}"
    
    def clean(self):
        """
        Validation globale : contraste AA (≥ 4.5:1) sur toutes les paires critiques.
        """
        super().clean()
        errors = {}
        
        # Paires à vérifier (texte/fond)
        pairs = [
            ('texte/fond', self.color_ink, self.color_bg),
            ('texte/surface', self.color_ink, self.color_surface),
            ('texte secondaire/fond', self.color_ink_soft, self.color_bg),
            ('texte sur accent/accent', self.color_on_accent, self.color_accent),
            ('texte sur accent/accent hover', self.color_on_accent, self.color_accent_hover),
        ]
        
        for label, fg, bg in pairs:
            try:
                ratio = contrast_ratio(fg, bg)
                if ratio < 4.5:
                    errors[label] = (
                        f"Contraste insuffisant pour {label} : {ratio:.2f}:1. "
                        f"Minimum requis (WCAG AA) : 4.5:1. "
                        f"Ajustez les couleurs pour améliorer la lisibilité."
                    )
            except (ValueError, AttributeError) as e:
                errors[label] = f"Erreur de calcul du contraste pour {label} : {e}"
        
        if errors:
            # Afficher toutes les erreurs de contraste en une fois
            raise ValidationError({
                '__all__': [f"{k}: {v}" for k, v in errors.items()]
            })
    
    def save(self, *args, **kwargs):
        """Singleton : une seule ligne autorisée."""
        if not self.pk and SiteSettings.objects.exists():
            raise ValidationError(
                "Une configuration existe déjà. "
                "Modifiez l'enregistrement existant au lieu d'en créer un nouveau."
            )
        self.full_clean()  # Force la validation
        super().save(*args, **kwargs)
