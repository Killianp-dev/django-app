"""Démonstrations présentées sur la page d'accueil, dans l'ordre du hero."""
from types import SimpleNamespace

from django.urls import reverse


def _projet(namespace, metier, titre, extrait, tags, alt, fonction):
    """`namespace` : espace de noms d'URL de la vitrine, et dossier de ses photos.
    `metier` : nom court, pour les pastilles « Votre métier » du hero.
    `apercu` : la page d'accueil de la démo, pour le hero.
    `fonction` : la section qui distingue la démo (capture `vue_fonction`), pour la
    section Exemples ; elle ne répète pas ce que le hero montre déjà."""
    return SimpleNamespace(
        namespace=namespace,
        metier=metier,
        titre=titre,
        extrait=extrait,
        tags=tags,
        alt=alt,
        fonction=fonction,
        apercu=f"vitrine/photos/{namespace}/apercu.jpg",
        # Capture d’une fenêtre de 1440 px, réduite en 1280 x 800, sans le bandeau « Démonstration ».
        vue_fonction=f"vitrine/photos/{namespace}/fonction.jpg",
        vue_fonction_webp=f"vitrine/photos/{namespace}/fonction.webp",
    )


PROJETS = [
    _projet(
        "avocat", "Avocat", "Cabinet d'avocats",
        "Domaines d'intervention, honoraires annoncés, présentation des associés et page de questions fréquentes.",
        ["Juridique", "Honoraires", "Équipe"],
        "Page d'accueil de la démo Aubert et Clerc",
        "Honoraires annoncés",
    ),
    _projet(
        "coiffeur", "Coiffure", "Salon de coiffure",
        "Prestations, galerie de réalisations, avis, horaires en direct et prise de rendez-vous en deux clics, pensée pour le mobile.",
        ["Coiffure", "Galerie", "Rendez-vous"],
        "Page d'accueil de la démo Salon Louise",
        "Prestations et prix",
    ),
    _projet(
        "macon", "Maçonnerie", "Entreprise de maçonnerie",
        "Un vrai devis détaillé poste par poste, avec bascule du taux de TVA, chantiers géolocalisés et prix indicatifs.",
        ["Bâtiment", "Devis", "Chantiers"],
        "Page d'accueil de la démo Bertrand Maçonnerie",
        "Carnet de chantier",
    ),
    _projet(
        "boulangerie", "Boulangerie", "Boulangerie",
        "Les fournées du jour avec la prochaine sortie du four en direct, la carte et les prix, les commandes de gâteaux.",
        ["Boulangerie", "Fournées", "Commandes"],
        "Page d'accueil de la démo Maison Caron",
        "Fournées en direct",
    ),
    _projet(
        "boucherie", "Boucherie", "Boucherie artisanale",
        "L'origine de chaque viande, un calculateur de quantités par convive, les prix au kilo et les pièces sur commande.",
        ["Boucherie", "Traçabilité", "Calculateur"],
        "Page d'accueil de la démo Boucherie Morel",
        "Calculateur par convive",
    ),
    _projet(
        "beaute", "Institut", "Institut de beauté",
        "Carte des soins avec durées et prix, rituels signature, cartes cadeaux et horaires en direct.",
        ["Esthétique", "Soins", "Cartes cadeaux"],
        "Page d'accueil de la démo Maison Iris",
        "Rituels signature",
    ),
]


def projets():
    """Les projets, avec l'URL de chaque démo résolue."""
    for projet in PROJETS:
        projet.url = reverse(f"{projet.namespace}:home")
    return PROJETS


def exemples(liste):
    """Ordre de la section Exemples, qui suit le hero.

    Le hero ouvre sur la première démo et laisse voir les deux suivantes derrière
    sa fenêtre. Les Exemples commencent donc par les démos que le hero ne montre pas
    au chargement, reprennent les deux suivantes, et finissent par la première."""
    return liste[3:] + liste[1:3] + liste[:1]
