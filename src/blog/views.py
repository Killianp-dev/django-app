from django.db import models, transaction
from django.urls import reverse, reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, DetailView, DeleteView

from .forms import IMAGE_FORMSET_PREFIX, BlogImageFormSet, BlogPostForm, BlogPostUpdateForm
from .models import BlogImage, BlogPost


class BlogHome(ListView):
    model = BlogPost
    context_object_name = "posts"  # fetches all BlogPost objects.
    template_name = "blog/blogpost_list.html"

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_staff:  # display to authenticated staff user.
            return queryset

        return queryset.filter(published=True)  # display only published posts.


class BlogImageUploadMixin:
    def form_valid(self, form):
        self.uploaded_new_images = bool(form.cleaned_data.get("new_images"))
        with transaction.atomic():
            response = super().form_valid(form)
            for uploaded in form.cleaned_data.get("new_images") or []:
                BlogImage.objects.create(post=self.object, image=uploaded)
        return response

    def get_success_url(self):
        if getattr(self, "uploaded_new_images", False):
            return (
                reverse("blog:edit", kwargs={"slug": self.object.slug})
                + "?images=ajoutees"
            )
        return super().get_success_url()


class BlogCreate(BlogImageUploadMixin, CreateView):
    model = BlogPost
    template_name = "blog/blogpost_create.html"
    form_class = BlogPostForm


class BlogPostUpdate(BlogImageUploadMixin, UpdateView):
    model = BlogPost
    template_name = "blog/blogpost_edit.html"
    form_class = BlogPostUpdateForm

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["show_image_library"] = True
        context.setdefault("image_formset", self._image_formset())
        return context

    def _image_formset(self):
        kwargs = {"instance": self.object, "prefix": IMAGE_FORMSET_PREFIX}
        if self.request.method == "POST":
            return BlogImageFormSet(self.request.POST, **kwargs)
        return BlogImageFormSet(**kwargs)

    def form_valid(self, form):
        image_formset = self._image_formset()
        if not image_formset.is_valid():
            return self.render_to_response(
                self.get_context_data(form=form, image_formset=image_formset)
            )
        with transaction.atomic():
            response = super().form_valid(form)
            image_formset.save()
        return response


class BlogPostDetail(DetailView):
    model = BlogPost
    context_object_name = "post"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Récupérer l'article actuel
        current_post = self.object
        
        # Récupérer les articles précédent et suivant publiés
        # Utiliser l'ordre par défaut du modèle (-created_on) et l'ID comme critère de fallback
        queryset = BlogPost.objects.filter(published=True)
        
        # Navigation basée sur l'ordre chronologique inverse (plus récent au plus ancien)
        # Article précédent = plus récent que l'actuel
        # Article suivant = plus ancien que l'actuel
        
        if current_post.created_on is not None:
            # Navigation basée sur created_on avec fallback sur l'ID
            try:
                # Article précédent (plus récent) : created_on > current OU (created_on = current ET id > current)
                context['previous_post'] = queryset.filter(
                    models.Q(created_on__gt=current_post.created_on) |
                    models.Q(created_on=current_post.created_on, id__gt=current_post.id)
                ).order_by('created_on', 'id').first()
            except Exception:
                context['previous_post'] = None
                
            try:
                # Article suivant (plus ancien) : created_on < current OU (created_on = current ET id < current)
                context['next_post'] = queryset.filter(
                    models.Q(created_on__lt=current_post.created_on) |
                    models.Q(created_on=current_post.created_on, id__lt=current_post.id)
                ).order_by('-created_on', '-id').first()
            except Exception:
                context['next_post'] = None
        else:
            # Si created_on est None, utiliser seulement l'ID comme critère
            try:
                # Article précédent (ID plus élevé)
                context['previous_post'] = queryset.filter(id__gt=current_post.id).order_by('id').first()
            except Exception:
                context['previous_post'] = None
                
            try:
                # Article suivant (ID plus bas)
                context['next_post'] = queryset.filter(id__lt=current_post.id).order_by('-id').first()
            except Exception:
                context['next_post'] = None
            
        return context


class BlogPostDelete(DeleteView):
    model = BlogPost
    success_url = reverse_lazy("blog:home")  # to redirect after deleting a post, delays URL resolution until its value is really needed
    context_object_name = "post"


