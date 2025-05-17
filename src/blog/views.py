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


class BlogPostDelete(DeleteView):
    model = BlogPost
    success_url = reverse_lazy("blog:home")  # to redirect after deleting a post, delays URL resolution until its value is really needed
    context_object_name = "post"


