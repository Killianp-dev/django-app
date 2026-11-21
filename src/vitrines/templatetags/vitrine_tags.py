import re
from types import SimpleNamespace

from django import template
from django.urls import reverse
from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe

register = template.Library()

ESPACE_FINE = " "      # espace fine insécable : devant ; ! ? et dans les milliers
ESPACE_INSECABLE = " "  # espace insécable : devant :, dans les guillemets, avant les unités
TVA = 0.20


@register.filter
def heure(valeur):
    """« 7:30 » -> « 7h30 », « 9:00 » -> « 9h » (format français des horaires)."""
    heures, _, minutes = str(valeur).partition(":")
    return f"{int(heures)}h{minutes if minutes and minutes != '00' else ''}"


@register.simple_tag(takes_context=True)
def site_url(context, name, slug=None):
    namespace = context["request"].resolver_match.namespace
    if slug:
        return reverse(f"{namespace}:{name}", kwargs={"slug": slug})
    return reverse(f"{namespace}:{name}")


@register.filter(needs_autoescape=True)
def fr_typo(valeur, autoescape=True):
    """Typographie française : espaces insécables devant ; ! ? :, dans « », entre un nombre
    et son unité (€, %, h, HT), et dans les milliers. Le texte est échappé avant traitement."""
    texte = conditional_escape(valeur) if autoescape else str(valeur)
    texte = re.sub(r" ([;!?])", ESPACE_FINE + r"\1", texte)
    texte = re.sub(r" :", ESPACE_INSECABLE + ":", texte)
    texte = texte.replace("« ", "«" + ESPACE_INSECABLE).replace(" »", ESPACE_INSECABLE + "»")
    texte = re.sub(r"(\d) (\d{3})\b", r"\1" + ESPACE_FINE + r"\2", texte)
    texte = re.sub(r"(\d) (€|%|h\b|HT\b|TTC\b|ans\b|jours\b|mois\b)", r"\1" + ESPACE_INSECABLE + r"\2", texte)
    texte = re.sub(r"€ (HT|TTC)\b", "€" + ESPACE_INSECABLE + r"\1", texte)
    return mark_safe(texte)


def _milliers(nombre):
    # Espace insécable classique : Playfair Display, qui affiche les montants, n'a pas l'espace fine.
    return f"{nombre:,}".replace(",", ESPACE_INSECABLE)


@register.filter
def honoraire(prix):
    """« dès 1 500 € HT », « 220 € HT / h » -> montants HT et TTC prêts à afficher.
    Renvoie None pour un prix qui n'est pas un montant (« sur devis »)."""
    m = re.fullmatch(r"\s*(dès\s+)?([\d\s  ]+)\s*€\s*HT\s*(/\s*h|l'heure)?\s*", str(prix))
    if not m:
        return None
    ht = int(re.sub(r"\D", "", m.group(2)))
    ttc = round(ht * (1 + TVA))
    return SimpleNamespace(
        prefixe="dès" if m.group(1) else "",
        ht=ht,
        ttc=ttc,
        ht_texte=_milliers(ht),
        ttc_texte=_milliers(ttc),
        suffixe="/ h" if m.group(3) else "",
    )
