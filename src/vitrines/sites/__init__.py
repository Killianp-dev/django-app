"""Les commerces fictifs des vitrines de démonstration.

Chaque module décrit un commerce : textes, couleurs, prestations, tarifs, horaires…
Les gabarits n'affichent une section que si le commerce fournit ses données.
"""
from .avocat import AVOCAT
from .beaute import BEAUTE
from .boucherie import BOUCHERIE
from .boulangerie import BOULANGERIE
from .coiffeur import COIFFEUR
from .macon import MACON

SITES = {site.key: site for site in (COIFFEUR, MACON, BOULANGERIE, AVOCAT, BOUCHERIE, BEAUTE)}


def get_site(key):
    return SITES.get(key)


def offre_par_slug(site, slug):
    return site.offres_par_slug.get(slug)


def offres_voisines(site, slug):
    slugs = [offre.slug for offre in site.offres]
    try:
        index = slugs.index(slug)
    except ValueError:
        return None, None
    precedente = site.offres[index - 1] if index > 0 else None
    suivante = site.offres[index + 1] if index < len(site.offres) - 1 else None
    return precedente, suivante


def tarifs_pour(site, offre):
    """Le groupe de la carte qui porte le même nom que la prestation."""
    for groupe in getattr(site, "tarifs", None) or []:
        if groupe.titre == offre.nom:
            return groupe
    return None


def realisations_pour(site, offre):
    return [r for r in getattr(site, "realisations", None) or [] if r.offre == offre.slug]


def filtres_realisations(site):
    filtres = []
    for realisation in getattr(site, "realisations", None) or []:
        if realisation.filtre not in filtres:
            filtres.append(realisation.filtre)
    return filtres
