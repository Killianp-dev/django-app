from django.urls import path
from . import views

app_name = 'contact_form'

urlpatterns = [
    path('', views.ContactFormView.as_view(), name='contact'),
    path('success/', views.SuccessView.as_view(), name='success'),
]