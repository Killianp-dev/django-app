from django.contrib import admin

from blog.models import BlogImage, BlogPost


class BlogImageInline(admin.TabularInline):
    model = BlogImage
    extra = 1
    fields = ("image", "alt", "caption")


class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "published", "created_on", "last_updated", )  # the fields to display on the screen
    list_editable = ("published", )  # editable fields
    inlines = (BlogImageInline,)

admin.site.register(BlogPost, BlogPostAdmin)  # connect the BlogPost model to BlogPostAdmin to display it with custom settings


