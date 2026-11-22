from html import unescape
import io
import uuid
from math import ceil
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.template.defaultfilters import slugify
from django.urls import reverse
from django.utils.html import strip_tags
from django.utils.text import Truncator

# Return the user model
User = get_user_model()

# Signature des articles quand le compte auteur n'a pas de nom renseigné.
DEFAULT_AUTHOR_NAME = "Killian P."

# Les images envoyées sont réduites à l'enregistrement : un appareil photo livre
# 5 à 13 Mo, alors que 1920 px de large suffisent à l'écran.
MAX_IMAGE_SIDE = 1920


def shrink_uploaded_image(field_file):
    """Réduit et ré-encode (JPEG, PNG ou WebP) un fichier tout juste envoyé.

    Sans effet sur un fichier déjà enregistré, un GIF (animation) ou un fichier
    illisible : l'original est alors conservé tel quel.
    """
    if not field_file or getattr(field_file, "_committed", True):
        return
    from PIL import Image, ImageOps

    try:
        field_file.file.seek(0)
        with Image.open(field_file.file) as img:
            fmt = img.format
            if fmt not in ("JPEG", "PNG", "WEBP") or getattr(img, "is_animated", False):
                return
            img = ImageOps.exif_transpose(img)
            img.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE), Image.LANCZOS)
            out = io.BytesIO()
            if fmt == "JPEG":
                img.convert("RGB").save(out, "JPEG", quality=82, optimize=True, progressive=True)
            else:
                img.save(out, fmt, optimize=True, **({"quality": 82} if fmt == "WEBP" else {}))
    except Exception:
        field_file.file.seek(0)
        return
    if out.tell() < field_file.size:
        field_file.save(field_file.name, ContentFile(out.getvalue()), save=False)
    else:
        field_file.file.seek(0)


class BlogPost(models.Model):
    # Rubriques du blog : les conseils visent les commerçants (et sont mis en avant),
    # les notes techniques restent accessibles dans leur propre page.
    COMMERCE = "commerce"
    TECHNIQUE = "technique"
    CATEGORY_CHOICES = [
        (COMMERCE, "Conseils pour votre commerce"),
        (TECHNIQUE, "Notes techniques"),
    ]

    title = models.CharField(max_length=255, unique=True, verbose_name="Titre")
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default=COMMERCE, verbose_name="Rubrique"
    )
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)  # or models.SET_NULL, null=True
    last_updated = models.DateTimeField(auto_now=True)  # date time automatically
    created_on = models.DateField(blank=True, null=True)  # only date without time-of-day
    published = models.BooleanField(default=False, verbose_name="Publié")
    content = models.TextField(blank=True, verbose_name="Contenu")
    thumbnail = models.ImageField(blank=True, upload_to='blog')
    caption = models.CharField(max_length=255, blank=True, verbose_name="Légende de l'image")

    class Meta:
        ordering = ['-created_on']  # the last published article comes first
        verbose_name = "Article"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        shrink_uploaded_image(self.thumbnail)
        super().save(*args, **kwargs)

    @property
    def author_or_default(self):
        """Nom affiché : prénom et initiale du nom du compte, sinon la signature du site."""
        if self.author:
            first = self.author.first_name.strip()
            last = self.author.last_name.strip()
            if first and last:
                return f"{first} {last[0].upper()}."
            if first:
                return first
        return DEFAULT_AUTHOR_NAME

    @property
    def plain_text(self):
        return unescape(strip_tags(self.content or ""))

    @property
    def excerpt(self):
        """Résumé court, pour les cartes et la meta description."""
        return Truncator(" ".join(self.plain_text.split())).chars(160)

    @property
    def reading_time(self):
        """Temps de lecture en minutes, à 200 mots par minute."""
        words = len(self.plain_text.split())
        return ceil(words / 200) if words else None

    def get_absolute_url(self):
        return reverse('blog:detail', kwargs={'slug': self.slug})


ALLOWED_IMAGE_EXTENSIONS = ("jpg", "jpeg", "png", "webp", "gif")
MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_IMAGES_PER_POST = 30


def blog_image_upload_to(instance, filename):
    suffix = Path(filename).suffix.lower()
    if suffix == ".jpeg":
        suffix = ".jpg"
    if suffix.lstrip(".") not in ALLOWED_IMAGE_EXTENSIONS:
        suffix = ""
    return f"blog/images/{uuid.uuid4().hex}{suffix}"


def validate_blog_image_size(image):
    size = getattr(image, "size", None)
    if size is not None and size > MAX_IMAGE_BYTES:
        raise ValidationError("Chaque image doit faire moins de 8 Mo.", code="size")


class BlogImage(models.Model):
    post = models.ForeignKey(
        BlogPost,
        on_delete=models.CASCADE,
        related_name="images",
        verbose_name="Article",
    )
    image = models.ImageField(
        upload_to=blog_image_upload_to,
        validators=[
            FileExtensionValidator(
                ALLOWED_IMAGE_EXTENSIONS,
                message=(
                    "Le format « %(extension)s » n'est pas accepté. "
                    "Formats autorisés : %(allowed_extensions)s."
                ),
            ),
            validate_blog_image_size,
        ],
        verbose_name="Image",
    )
    alt = models.CharField(max_length=255, blank=True, verbose_name="Texte alternatif")
    caption = models.CharField(max_length=255, blank=True, verbose_name="Légende")
    created_on = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_on", "id"]
        verbose_name = "Image d'article"
        verbose_name_plural = "Images d'article"

    def __str__(self):
        return self.alt or self.image.name

    def save(self, *args, **kwargs):
        if self.pk:
            previous = BlogImage.objects.filter(pk=self.pk).only("image").first()
            if (
                previous
                and previous.image
                and previous.image.name
                and self.image
                and previous.image.name != self.image.name
            ):
                previous.image.delete(save=False)
        shrink_uploaded_image(self.image)
        super().save(*args, **kwargs)


@receiver(post_delete, sender=BlogImage)
def delete_blog_image_file(sender, instance, **kwargs):
    image = instance.image
    if image and image.name:
        image.delete(save=False)


