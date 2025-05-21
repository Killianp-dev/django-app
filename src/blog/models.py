from django.contrib.auth import get_user_model
from django.db import models
from django.template.defaultfilters import slugify
from django.urls import reverse
import re
from math import ceil

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


