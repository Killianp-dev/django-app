from datetime import datetime, time

from django.contrib.syndication.views import Feed
from django.utils import timezone
from django.urls import reverse_lazy

from .models import BlogPost


class LatestPostsFeed(Feed):
    title = "Blog — killianp.dev"
    link = reverse_lazy("blog:home")
    description = "Conseils pour le site internet de votre commerce, et notes techniques."

    def items(self):
        return BlogPost.objects.filter(published=True).order_by("-created_on", "-id")[:20]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.excerpt

    def item_author_name(self, item):
        return item.author_or_default

    def item_pubdate(self, item):
        # created_on est une date : le flux attend un datetime.
        if item.created_on is None:
            return None
        return timezone.make_aware(datetime.combine(item.created_on, time(9, 0)))
