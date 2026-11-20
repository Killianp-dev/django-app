"""Démonstrations présentées sur la page d'accueil, dans l'ordre d'affichage."""
from types import SimpleNamespace

from django.urls import reverse


def _projet(namespace, metier, titre, extrait, tags, alt):
    """`namespace` : espace de noms d'URL de la vitrine, et dossier de ses photos.
    `metier` : nom court, pour les pastilles « Votre métier » du hero.
    `apercu` (ordinateur) sert au hero ; `apercu_mobile` à la section Exemples."""
    return SimpleNamespace(
        namespace=namespace,
        metier=metier,
        titre=titre,
        extrait=extrait,
        tags=tags,
        alt=alt,
        apercu=f"vitrine/photos/{namespace}/apercu.jpg",
        # Capture en 390 px de large (DPR ~1,5), sans le bandeau « Démonstration ».
        apercu_mobile=f"vitrine/photos/{namespace}/apercu-mobile.jpg",
        apercu_mobile_webp=f"vitrine/photos/{namespace}/apercu-mobile.webp",
    )


PROJETS = [
    _projet(
        "coiffeur", "Coiffure", "Salon de coiffure",
        "Prestations, galerie de réalisations, avis, horaires en direct et prise de rendez-vous en deux clics, pensée pour le mobile.",
        ["Coiffure", "Galerie", "Rendez-vous"],
        "Page d'accueil de la démo Salon Louise",
    ),
    _projet(
        "macon", "Maçonnerie", "Entreprise de maçonnerie",
        "Un vrai devis détaillé poste par poste, avec bascule du taux de TVA, chantiers géolocalisés et prix indicatifs.",
        ["Bâtiment", "Devis", "Chantiers"],
        "Page d'accueil de la démo Bertrand Maçonnerie",
    ),
    _projet(
        "boulangerie", "Boulangerie", "Boulangerie",
        "Les fournées du jour avec la prochaine sortie du four en direct, la carte et les prix, les commandes de gâteaux.",
        ["Boulangerie", "Fournées", "Commandes"],
        "Page d'accueil de la démo Maison Caron",
    ),
    _projet(
        "avocat", "Avocat", "Cabinet d'avocats",
        "Domaines d'intervention, honoraires annoncés, présentation des associés et page de questions fréquentes.",
        ["Juridique", "Honoraires", "Équipe"],
        "Page d'accueil de la démo Aubert et Clerc",
    ),
    _projet(
        "boucherie", "Boucherie", "Boucherie artisanale",
        "L'origine de chaque viande, un calculateur de quantités par convive, les prix au kilo et les pièces sur commande.",
        ["Boucherie", "Traçabilité", "Calculateur"],
        "Page d'accueil de la démo Boucherie Morel",
    ),
    _projet(
        "beaute", "Institut", "Institut de beauté",
        "Carte des soins avec durées et prix, rituels signature, cartes cadeaux et horaires en direct.",
        ["Esthétique", "Soins", "Cartes cadeaux"],
        "Page d'accueil de la démo Maison Iris",
    ),
]


def projets():
    """Les projets, avec l'URL de chaque démo résolue."""
    for projet in PROJETS:
        projet.url = reverse(f"{projet.namespace}:home")
    return PROJETS
