from django.views.generic import ListView, CreateView, UpdateView, DetailView, DeleteView
from django.urls import reverse_lazy

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
        queryset = BlogPost.objects.filter(published=True)
        
        # Vérifier si created_on existe pour éviter l'erreur
        if current_post and current_post.created_on is not None:
            try:
                context['previous_post'] = queryset.filter(created_on__lt=current_post.created_on).order_by('-created_on').first()
            except BlogPost.DoesNotExist:
                context['previous_post'] = None
                
            try:
                context['next_post'] = queryset.filter(created_on__gt=current_post.created_on).order_by('created_on').first()
            except BlogPost.DoesNotExist:
                context['next_post'] = None
        else:
            # Si created_on est None, ne pas proposer d'articles précédent/suivant
            context['previous_post'] = None
            context['next_post'] = None
            
        return context


class BlogPostDelete(DeleteView):
    model = BlogPost
    success_url = reverse_lazy("blog:home")  # to redirect after deleting a post, delays URL resolution until its value is really needed
    context_object_name = "post"


