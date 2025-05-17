"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib.admin.views.decorators import staff_member_required
from django.urls import path
from .views import BlogHome, BlogCreate, BlogPostUpdate, BlogPostDetail, BlogPostDelete

app_name = "blog"

urlpatterns = [
    path('', BlogHome.as_view(), name="home"),
    path('create/', staff_member_required(BlogCreate.as_view()), name="create"),
    path('edit/<str:slug>/', staff_member_required(BlogPostUpdate.as_view()), name="edit"),
    path('delete/<str:slug>/', staff_member_required(BlogPostDelete.as_view()), name="delete"),
    path('<str:slug>/', BlogPostDetail.as_view(), name="detail"),
]

