import re
import uuid
from math import ceil
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.template.defaultfilters import slugify
from django.urls import reverse

# Return the user model
User = get_user_model()

class BlogPost(models.Model):
    title = models.CharField(max_length=255, unique=True, verbose_name="Titre")
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
        super().save(*args, **kwargs)

    @property  # to use like a property in template html
    def author_or_default(self):
        return self.author.username if self.author else "auteur inconnu"

    @property
    def reading_time(self):
        """
        Calcule le temps de lecture approximatif en minutes.
        Basé sur une moyenne de 200 mots par minute.
        """
        if not self.content:
            return None
            
        # Retire les balises HTML
        text_only = re.sub(r'<[^>]+>', '', self.content)
        
        # Calcule le nombre de mots
        word_count = len(text_only.split())
        
        # Calcule le temps de lecture (arrondi au supérieur)
        reading_time = ceil(word_count / 200)
        
        return reading_time

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
        super().save(*args, **kwargs)


@receiver(post_delete, sender=BlogImage)
def delete_blog_image_file(sender, instance, **kwargs):
    image = instance.image
    if image and image.name:
        image.delete(save=False)


