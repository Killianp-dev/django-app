from django.views.generic import ListView, CreateView, UpdateView, DetailView, DeleteView
from django.urls import reverse_lazy
from django.db import models

from .models import BlogPost


class BlogHome(ListView):
    model = BlogPost
    context_object_name = "posts"  # fetches all BlogPost objects.
    template_name = "blog/blogpost_list.html"

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_staff:  # display to authenticated staff user.
            return queryset

        return queryset.filter(published=True)  # display only published posts.


class BlogCreate(CreateView):
    model = BlogPost
    template_name = "blog/blogpost_create.html"
    fields = ['title', 'content', 'created_on']


class BlogPostUpdate(UpdateView):
    model = BlogPost
    template_name = "blog/blogpost_edit.html"
    fields = ['title', 'content', 'created_on', 'published']


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


