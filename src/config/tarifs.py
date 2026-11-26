"""Tarifs affichés sur le site : le seul endroit à modifier pour changer un prix.

Les prix sont des « à partir de » : le montant exact est fixé dans le devis (voir les CGV).
TVA non applicable (art. 293 B du CGI) : les montants sont nets.
"""
from types import SimpleNamespace

from django.utils import timezone

# Mise en œuvre solution : site vitrine (après un audit de référencement).
CREATION = 300

# Abonnement mensuel (hébergement, maintenance, 1 h de modifications…).
ABONNEMENT = 40

# Offre temporaire sur la création : affichée tant que la date de fin n'est pas passée
# (incluse), puis le site revient seul au prix normal. PROMO = None : pas d'offre.
PROMO = None


def tarifs(aujourd_hui=None):
    """Prix à afficher aujourd'hui."""
    aujourd_hui = aujourd_hui or timezone.localdate()
    promo = PROMO if PROMO and aujourd_hui <= PROMO.fin else None
    return SimpleNamespace(
        creation=CREATION,
        abonnement=ABONNEMENT,
        promo=promo,
        creation_affiche=promo.prix if promo else CREATION,
    )
