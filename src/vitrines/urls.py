from django.urls import path

from . import views

app_name = "vitrines"

urlpatterns = [
    path("", views.HomeView.as_view(), name="home"),
    path("offres/", views.OffreListView.as_view(), name="offres"),
    path("offres/<slug:slug>/", views.OffreDetailView.as_view(), name="offre"),
    path("realisations/", views.RealisationsView.as_view(), name="realisations"),
    path("presentation/", views.AboutView.as_view(), name="about"),
    path("questions/", views.FaqView.as_view(), name="faq"),
    path("tarifs/", views.TarifsView.as_view(), name="tarifs"),
    path("contact/", views.ContactView.as_view(), name="contact"),
    path("contact/succes/", views.ContactSuccessView.as_view(), name="contact_success"),
    path("mentions-legales/", views.LegalNoticeView.as_view(), name="legal_notice"),
    path("confidentialite/", views.PrivacyView.as_view(), name="privacy"),
]
