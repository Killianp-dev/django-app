from django.contrib.auth import get_user_model
from django.db import models
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

    def get_absolute_url(self):
        return reverse('blog:home')


