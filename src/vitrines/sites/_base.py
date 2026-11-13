"""Briques communes aux vitrines : constructeurs de données légers."""
from types import SimpleNamespace


def _ns(**kwargs):
    return SimpleNamespace(**kwargs)


def _offre(slug, nom, accroche, intro, points, image, prix="", duree="", suite=""):
    return _ns(
        slug=slug, nom=nom, accroche=accroche, intro=intro, points=points, image=image,
        prix=prix, duree=duree, suite=suite,
    )


def _ligne(nom, prix, duree, note=""):
    return _ns(nom=nom, prix=prix, duree=duree, note=note)


def _groupe(titre, lignes):
    return _ns(titre=titre, lignes=lignes)


def _etape(numero, titre, texte):
    return _ns(numero=numero, titre=titre, texte=texte)


def _realisation(image, titre, filtre, offre, alt, detail="", key="coiffeur"):
    """Une photo de la galerie. `detail` : ligne secondaire (lieu, durée…)."""
    return _ns(
        image=f"vitrine/photos/{key}/realisations/{image}",
        titre=titre, filtre=filtre, offre=offre, alt=alt, detail=detail,
    )


def _jour(nom, court, ouverture=None, fermeture=None):
    """Un jour de la semaine. Heures au format "9:00" ; sans heure, le jour est fermé."""
    return _ns(nom=nom, court=court, ouverture=ouverture, fermeture=fermeture)


def _eur(montant):
    """Montant au format français : 1 234,50 € (espaces insécables fines)."""
    entier, decimales = f"{montant:,.2f}".split(".")
    return f"{entier.replace(',', '\u202f')},{decimales}\u00a0€"


def _site(**kwargs):
    site = _ns(**kwargs)
    site.offres_par_slug = {offre.slug: offre for offre in site.offres}
    return site


