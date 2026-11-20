"""Démonstrations présentées sur la page d'accueil, dans l'ordre du hero."""
from types import SimpleNamespace

from django.urls import reverse


def _projet(namespace, metier, titre, nom, accroche, points, alt):
    """`namespace` : espace de noms d'URL de la vitrine, et dossier de ses photos.
    `metier` : nom court, pour les pastilles « Votre métier » du hero.
    `nom` : le commerce fictif de la démo.
    `accroche` : en une phrase, ce que le client du commerce trouve sur le site.
    `points` : les trois choses que le site montre, lisibles d'un coup d'œil."""
    return SimpleNamespace(
        namespace=namespace,
        metier=metier,
        titre=titre,
        nom=nom,
        accroche=accroche,
        points=points,
        alt=alt,
        # Page d'accueil de la démo, en 1400 x 933 : pour le hero et la section Exemples.
        apercu=f"vitrine/photos/{namespace}/apercu.jpg",
        apercu_webp=f"vitrine/photos/{namespace}/apercu.webp",
    )


PROJETS = [
    _projet(
        "avocat", "Avocat", "Cabinet d'avocats", "Aubert & Clerc",
        "Avant d'appeler, le client sait ce que vous traitez et combien cela coûte.",
        ["Domaines d'intervention", "Honoraires annoncés", "Questions fréquentes"],
        "Page d'accueil de la démo Aubert et Clerc",
    ),
    _projet(
        "coiffeur", "Coiffure", "Salon de coiffure", "Salon Louise",
        "On découvre le salon, on choisit sa prestation, on prend rendez-vous.",
        ["Prestations et prix", "Galerie de réalisations", "Rendez-vous en deux clics"],
        "Page d'accueil de la démo Salon Louise",
    ),
    _projet(
        "macon", "Maçonnerie", "Entreprise de maçonnerie", "Bertrand Maçonnerie",
        "Le particulier comprend votre devis et voit vos chantiers près de chez lui.",
        ["Devis détaillé poste par poste", "Chantiers sur une carte", "Prix indicatifs"],
        "Page d'accueil de la démo Bertrand Maçonnerie",
    ),
    _projet(
        "boulangerie", "Boulangerie", "Boulangerie", "Maison Caron",
        "Vos clients savent ce qui sort du four, et à quelle heure.",
        ["Fournées du jour en direct", "Carte et prix", "Commandes de gâteaux"],
        "Page d'accueil de la démo Maison Caron",
    ),
    _projet(
        "boucherie", "Boucherie", "Boucherie artisanale", "Boucherie Morel",
        "On sait d'où vient la viande, et combien en prendre pour le repas.",
        ["Origine de chaque viande", "Calculateur par convive", "Pièces sur commande"],
        "Page d'accueil de la démo Boucherie Morel",
    ),
    _projet(
        "beaute", "Institut", "Institut de beauté", "Maison Iris",
        "On choisit son soin, sa durée et son prix, puis on réserve.",
        ["Carte des soins et prix", "Rituels signature", "Cartes cadeaux"],
        "Page d'accueil de la démo Maison Iris",
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
