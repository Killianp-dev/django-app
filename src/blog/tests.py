import io
import shutil
import tempfile
from datetime import date, timedelta
from pathlib import Path
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from PIL import Image

from blog.forms import IMAGE_FORMSET_PREFIX

from .models import BlogImage, BlogPost

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


def make_image(name="photo.jpg", fmt="JPEG", color=(18, 92, 84)):
    buffer = io.BytesIO()
    Image.new("RGB", (16, 10), color).save(buffer, format=fmt)
    content_type = {"JPEG": "image/jpeg", "PNG": "image/png"}[fmt]
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=content_type)


class BlogImageUploadTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.media_root = tempfile.mkdtemp(prefix="blog-images-tests-")
        cls.media_override = override_settings(MEDIA_ROOT=cls.media_root)
        cls.media_override.enable()

    @classmethod
    def tearDownClass(cls):
        cls.media_override.disable()
        shutil.rmtree(cls.media_root, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.staff = User.objects.create_user(
            username="staff", password="pass", is_staff=True
        )
        self.post = BlogPost.objects.create(
            title="Article public",
            content="<p>Contenu public</p>",
            published=True,
            created_on=date.today(),
        )

    def login(self):
        self.client.force_login(self.staff)

    def edit_data(self, post, images=(), **overrides):
        prefix = IMAGE_FORMSET_PREFIX
        data = {
            "title": post.title,
            "content": post.content,
            "created_on": post.created_on.isoformat() if post.created_on else "",
            "published": "on" if post.published else "",
            f"{prefix}-TOTAL_FORMS": str(len(images)),
            f"{prefix}-INITIAL_FORMS": str(len(images)),
            f"{prefix}-MIN_NUM_FORMS": "0",
            f"{prefix}-MAX_NUM_FORMS": "1000",
        }
        if not post.published:
            data.pop("published")
        for index, image in enumerate(images):
            data[f"{prefix}-{index}-id"] = str(image.pk)
        data.update(overrides)
        return data

    def test_create_form_offers_multiple_image_upload(self):
        self.login()
        response = self.client.get(reverse("blog:create"))
        self.assertContains(response, 'name="new_images"')
        self.assertContains(response, "multiple")
        self.assertNotContains(response, f'name="{IMAGE_FORMSET_PREFIX}-TOTAL_FORMS"')

    def test_edit_form_includes_image_library_when_empty(self):
        self.login()
        response = self.client.get(reverse("blog:edit", kwargs={"slug": self.post.slug}))
        self.assertContains(response, f'name="{IMAGE_FORMSET_PREFIX}-TOTAL_FORMS"')
        self.assertContains(response, "Aucune image pour le moment")

    def test_anonymous_cannot_upload(self):
        response = self.client.post(
            reverse("blog:create"),
            {"title": "Pirate", "content": "x", "new_images": make_image()},
        )
        self.assertEqual(response.status_code, 302)
        self.assertFalse(BlogPost.objects.filter(title="Pirate").exists())
        self.assertEqual(BlogImage.objects.count(), 0)

    def test_create_without_images_still_opens_the_article(self):
        self.login()
        response = self.client.post(
            reverse("blog:create"),
            {"title": "Sans image", "content": "Texte"},
        )
        post = BlogPost.objects.get(title="Sans image")
        self.assertRedirects(response, post.get_absolute_url())
        self.assertEqual(post.images.count(), 0)

    def test_create_stores_several_images_and_returns_to_the_editor(self):
        self.login()
        response = self.client.post(
            reverse("blog:create"),
            {
                "title": "Avec images",
                "content": "<p>Texte</p>",
                "new_images": [make_image("a.jpg"), make_image("b.png", "PNG")],
            },
        )
        post = BlogPost.objects.get(title="Avec images")
        self.assertEqual(post.images.count(), 2)
        editor = reverse("blog:edit", kwargs={"slug": post.slug}) + "?images=ajoutees"
        self.assertRedirects(response, editor)
        page = self.client.get(editor)
        self.assertContains(page, "Images enregistrées")
        self.assertNotContains(page, "Insérer dans l'article")
        self.assertNotContains(page, "blog-form.js")
        for image in post.images.all():
            self.assertContains(page, f'<img src="{image.image.url}" alt="">')

    def test_uploaded_image_stays_out_of_the_article_until_the_html_is_written(self):
        image = BlogImage.objects.create(post=self.post, image=make_image())
        detail = self.client.get(self.post.get_absolute_url())
        self.assertNotContains(detail, image.image.url)

    def test_edit_removes_the_image_file(self):
        image = BlogImage.objects.create(post=self.post, image=make_image())
        path = Path(image.image.path)
        self.assertTrue(path.exists())
        self.login()
        payload = self.edit_data(self.post, images=[image])
        prefix = IMAGE_FORMSET_PREFIX
        payload[f"{prefix}-0-DELETE"] = "on"
        response = self.client.post(
            reverse("blog:edit", kwargs={"slug": self.post.slug}),
            payload,
        )
        self.assertRedirects(response, self.post.get_absolute_url())
        self.assertFalse(BlogImage.objects.filter(pk=image.pk).exists())
        self.assertFalse(path.exists())

    def test_changing_the_legend_keeps_the_file(self):
        image = BlogImage.objects.create(post=self.post, image=make_image())
        path = Path(image.image.path)
        image.caption = "Une légende"
        image.save()
        image.refresh_from_db()
        self.assertEqual(image.caption, "Une légende")
        self.assertTrue(path.exists())

    def test_upload_on_edit_when_the_library_is_empty(self):
        self.login()
        payload = self.edit_data(self.post)
        payload["new_images"] = make_image()
        response = self.client.post(
            reverse("blog:edit", kwargs={"slug": self.post.slug}),
            payload,
        )
        self.assertEqual(self.post.images.count(), 1)
        self.assertRedirects(
            response,
            reverse("blog:edit", kwargs={"slug": self.post.slug}) + "?images=ajoutees",
        )

    def test_rejects_a_file_that_is_not_an_image(self):
        self.login()
        response = self.client.post(
            reverse("blog:create"),
            {
                "title": "Mauvais fichier",
                "content": "x",
                "new_images": SimpleUploadedFile(
                    "notes.txt", b"pas une image", content_type="text/plain"
                ),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Formats acceptés")
        self.assertFalse(BlogPost.objects.filter(title="Mauvais fichier").exists())

    def test_rejects_a_corrupt_image(self):
        self.login()
        response = self.client.post(
            reverse("blog:create"),
            {
                "title": "Image cassée",
                "content": "x",
                "new_images": SimpleUploadedFile(
                    "photo.jpg", b"pas une image", content_type="image/jpeg"
                ),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Envoyez une image valide")
        self.assertFalse(BlogPost.objects.filter(title="Image cassée").exists())

    @patch("blog.forms.MAX_IMAGE_BYTES", 30)
    def test_rejects_an_oversized_image(self):
        self.login()
        response = self.client.post(
            reverse("blog:create"),
            {
                "title": "Trop lourde",
                "content": "x",
                "new_images": make_image(),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "moins de 8 Mo")
        self.assertFalse(BlogPost.objects.filter(title="Trop lourde").exists())

    @patch("blog.forms.MAX_IMAGES_PER_POST", 1)
    def test_rejects_images_beyond_the_limit(self):
        BlogImage.objects.create(post=self.post, image=make_image())
        self.login()
        payload = self.edit_data(self.post, images=list(self.post.images.all()))
        payload["new_images"] = make_image("deux.jpg")
        response = self.client.post(
            reverse("blog:edit", kwargs={"slug": self.post.slug}),
            payload,
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "au plus 1 image")
        self.assertEqual(self.post.images.count(), 1)

    @patch("blog.forms.MAX_IMAGES_PER_POST", 1)
    def test_deleting_an_image_frees_a_slot_in_the_same_save(self):
        image = BlogImage.objects.create(post=self.post, image=make_image("old.jpg"))
        self.login()
        payload = self.edit_data(self.post, images=[image])
        payload[f"{IMAGE_FORMSET_PREFIX}-0-DELETE"] = "on"
        payload["new_images"] = make_image("new.jpg")
        response = self.client.post(
            reverse("blog:edit", kwargs={"slug": self.post.slug}),
            payload,
        )
        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.post.images.count(), 1)
        self.assertFalse(self.post.images.filter(pk=image.pk).exists())

    def test_deleting_the_article_deletes_its_image_file(self):
        image = BlogImage.objects.create(post=self.post, image=make_image())
        path = Path(image.image.path)
        self.assertTrue(path.exists())
        self.post.delete()
        self.assertFalse(path.exists())
        self.assertEqual(BlogImage.objects.count(), 0)
