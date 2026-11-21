"""Démonstrations présentées sur la page d'accueil, dans l'ordre du hero."""
import hashlib
from types import SimpleNamespace

from django.conf import settings
from django.urls import reverse


def empreinte(chemin_statique):
    """Empreinte courte du fichier statique, à mettre en ?v= : les fichiers statiques sont
    servis avec un cache d'un mois et une adresse fixe ; quand un aperçu est recapturé,
    l'empreinte change et les navigateurs chargent la nouvelle image."""
    try:
        contenu = (settings.BASE_DIR / "static" / chemin_statique).read_bytes()
    except OSError:
        return "0"
    return hashlib.md5(contenu).hexdigest()[:8]


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
        apercu_v=empreinte(f"vitrine/photos/{namespace}/apercu.jpg"),
        apercu_webp_v=empreinte(f"vitrine/photos/{namespace}/apercu.webp"),
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


# Ordre de la section Exemples, choisi démo par démo. L'avocat, qui ouvre le hero, la termine :
# une même démo n'apparaît pas deux fois de suite (hero puis Exemples).
ORDRE_EXEMPLES = ["macon", "boucherie", "boulangerie", "coiffeur", "beaute", "avocat"]


def exemples(liste):
    """Les projets dans l'ordre de la section Exemples (ORDRE_EXEMPLES) ; une démo absente
    de cet ordre passe à la fin, dans l'ordre de PROJETS."""
    rang = {namespace: i for i, namespace in enumerate(ORDRE_EXEMPLES)}
    return sorted(liste, key=lambda projet: rang.get(projet.namespace, len(rang)))
