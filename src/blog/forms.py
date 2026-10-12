from pathlib import Path

from django import forms
from django.core.exceptions import ValidationError
from django.forms import inlineformset_factory

from blog.models import (
    ALLOWED_IMAGE_EXTENSIONS,
    MAX_IMAGE_BYTES,
    MAX_IMAGES_PER_POST,
    BlogImage,
    BlogPost,
)

IMAGE_FORMSET_PREFIX = "images"


class MultipleImageInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleImageField(forms.ImageField):
    default_error_messages = {
        "invalid_image": "Envoyez une image valide (JPEG, PNG, WebP ou GIF).",
    }

    def __init__(self, *args, **kwargs):
        kwargs.setdefault(
            "widget",
            MultipleImageInput(
                attrs={"accept": "image/jpeg,image/png,image/webp,image/gif"}
            ),
        )
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        if not data:
            return []
        if not isinstance(data, (list, tuple)):
            data = [data]

        cleaned = []
        errors = []
        for item in data:
            if not item:
                continue
            extension = Path(getattr(item, "name", "")).suffix.lower().lstrip(".")
            if extension not in ALLOWED_IMAGE_EXTENSIONS:
                errors.append(
                    ValidationError(
                        "Formats acceptés : JPEG, PNG, WebP et GIF.",
                        code="extension",
                    )
                )
                continue
            try:
                image = super().clean(item, initial)
            except ValidationError as exc:
                errors.extend(exc.error_list)
                continue
            if image.size > MAX_IMAGE_BYTES:
                errors.append(
                    ValidationError(
                        "Chaque image doit faire moins de 8 Mo.",
                        code="size",
                    )
                )
                continue
            cleaned.append(image)

        if errors:
            raise ValidationError(errors)
        return cleaned


class BlogPostForm(forms.ModelForm):
    new_images = MultipleImageField(
        required=False,
        label="Images à ajouter",
        help_text=(
            "JPEG, PNG, WebP ou GIF, 8 Mo maximum. Plusieurs fichiers possibles. "
            "Après enregistrement, copiez la balise HTML dans le contenu."
        ),
    )

    class Meta:
        model = BlogPost
        fields = ["title", "content", "created_on"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["content"].help_text = (
            "HTML autorisé. Pour afficher une image, copiez sa balise dans ce texte."
        )
        new_images = self.fields.pop("new_images")
        ordered = {}
        for name, field in self.fields.items():
            ordered[name] = field
            if name == "content":
                ordered["new_images"] = new_images
        if "new_images" not in ordered:
            ordered["new_images"] = new_images
        self.fields = ordered

    def _pending_image_deletions(self):
        prefix = IMAGE_FORMSET_PREFIX
        try:
            total = int(self.data.get(f"{prefix}-TOTAL_FORMS") or 0)
        except (TypeError, ValueError):
            return 0
        total = min(max(total, 0), 1000)
        return sum(
            1
            for index in range(total)
            if self.data.get(f"{prefix}-{index}-DELETE")
        )

    def clean(self):
        cleaned = super().clean()
        new_images = cleaned.get("new_images") or []
        existing = self.instance.images.count() if self.instance.pk else 0
        kept = max(0, existing - self._pending_image_deletions())
        if kept + len(new_images) > MAX_IMAGES_PER_POST:
            noun = "image" if MAX_IMAGES_PER_POST == 1 else "images"
            self.add_error(
                "new_images",
                f"Un article peut contenir au plus {MAX_IMAGES_PER_POST} {noun}.",
            )
        return cleaned


class BlogPostUpdateForm(BlogPostForm):
    class Meta(BlogPostForm.Meta):
        fields = ["title", "content", "created_on", "published"]


class BlogImageForm(forms.ModelForm):
    class Meta:
        model = BlogImage
        fields = ()


BlogImageFormSet = inlineformset_factory(
    BlogPost,
    BlogImage,
    form=BlogImageForm,
    extra=0,
    can_delete=True,
)
