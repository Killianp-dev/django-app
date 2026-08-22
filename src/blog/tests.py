from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from .models import BlogPost

User = get_user_model()


class BlogPostModelTests(TestCase):
    def test_slug_is_generated_from_title_on_save(self):
        post = BlogPost.objects.create(title="Hello World", content="Hi")
        self.assertEqual(post.slug, "hello-world")

    def test_author_or_default_without_author(self):
        post = BlogPost.objects.create(title="Sans auteur")
        self.assertEqual(post.author_or_default, "auteur inconnu")

    def test_author_or_default_with_author(self):
        user = User.objects.create_user(username="killian", password="pass")
        post = BlogPost.objects.create(title="Avec auteur", author=user)
        self.assertEqual(post.author_or_default, "killian")

    def test_reading_time_empty_content(self):
        post = BlogPost.objects.create(title="Vide", content="")
        self.assertIsNone(post.reading_time)

    def test_reading_time_strips_html_and_rounds_up(self):
        words = " ".join(["mot"] * 201)
        post = BlogPost.objects.create(
            title="Long",
            content=f"<p>{words}</p>",
        )
        self.assertEqual(post.reading_time, 2)

    def test_get_absolute_url(self):
        post = BlogPost.objects.create(title="Lien")
        self.assertEqual(post.get_absolute_url(), reverse("blog:detail", kwargs={"slug": post.slug}))


class BlogViewTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="staff", password="pass", is_staff=True
        )
        today = date.today()
        self.published = BlogPost.objects.create(
            title="Article public",
            content="Contenu public",
            published=True,
            created_on=today,
        )
        self.draft = BlogPost.objects.create(
            title="Brouillon",
            content="Pas encore",
            published=False,
            created_on=today - timedelta(days=1),
        )

    def test_list_hides_unpublished_from_anonymous(self):
        response = self.client.get(reverse("blog:home"))
        self.assertEqual(response.status_code, 200)
        posts = list(response.context["posts"])
        self.assertIn(self.published, posts)
        self.assertNotIn(self.draft, posts)

    def test_list_shows_unpublished_to_staff(self):
        self.client.force_login(self.staff)
        response = self.client.get(reverse("blog:home"))
        posts = list(response.context["posts"])
        self.assertIn(self.published, posts)
        self.assertIn(self.draft, posts)

    def test_published_detail_is_public(self):
        response = self.client.get(self.published.get_absolute_url())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["post"], self.published)

    def test_create_requires_staff(self):
        url = reverse("blog:create")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 302)

        self.client.force_login(self.staff)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_edit_and_delete_require_staff(self):
        for name in ("blog:edit", "blog:delete"):
            url = reverse(name, kwargs={"slug": self.published.slug})
            response = self.client.get(url)
            self.assertEqual(response.status_code, 302)

        self.client.force_login(self.staff)
        for name in ("blog:edit", "blog:delete"):
            url = reverse(name, kwargs={"slug": self.published.slug})
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
