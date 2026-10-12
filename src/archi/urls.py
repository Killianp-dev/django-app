"""
URLs pour le package archi (namespace 'archi').
Montable sous un préfixe (ex: 'demo-architecte/') ou à la racine.
"""
from django.urls import path
from . import views

app_name = 'archi'

urlpatterns = [
    # Pages principales
    path('', views.HomeView.as_view(), name='home'),
    path('projets/', views.PortfolioListView.as_view(), name='portfolio_list'),
    path('projets/<slug:slug>/', views.ProjectDetailView.as_view(), name='project_detail'),
    path('missions/<slug:slug>/', views.MissionDetailView.as_view(), name='mission_detail'),
    path('agence/', views.AboutView.as_view(), name='about'),
    
    # Contact
    path('contact/', views.ContactView.as_view(), name='contact'),
    path('contact/succes/', views.ContactSuccessView.as_view(), name='contact_success'),
    
    # Légal
    path('mentions-legales/', views.LegalNoticeView.as_view(), name='legal_notice'),
    path('confidentialite/', views.PrivacyView.as_view(), name='privacy'),
]
