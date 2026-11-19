"""Données structurées (schema.org, JSON-LD) communes au site."""
import json

from django.conf import settings
from django.templatetags.static import static
from django.utils.safestring import mark_safe

MARQUE = "killianp.dev"


def organisation():
    """L'entreprise, telle que Google doit la comprendre : une agence de création de sites."""
    url = settings.SITE_URL
    return {
        "@type": "ProfessionalService",
        "@id": f"{url}/#organisation",
        "name": MARQUE,
        "alternateName": "Neuralab",
        "description": (
            "Agence web de création de sites vitrines pour les commerces de proximité, "
            "les artisans et les professions libérales."
        ),
        "url": f"{url}/",
        "logo": f"{url}{static('ressources/apple-touch-icon.png')}",
        "image": f"{url}{static('ressources/og-killianp-dev.jpg')}",
        "email": "contact@killianp-dev.fr",
        "founder": {"@type": "Person", "name": "Killian P."},
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Paris",
            "postalCode": "75012",
            "addressCountry": "FR",
        },
        "areaServed": {"@type": "Country", "name": "France"},
        "knowsAbout": ["Création de site internet", "Site vitrine", "Référencement local"],
        "sameAs": ["https://github.com/Killianp-dev"],
    }


def jsonld(*objets):
    """Balise <script type="application/ld+json"> prête à insérer dans un gabarit."""
    data = {"@context": "https://schema.org", "@graph": list(objets)}
    texte = json.dumps(data, ensure_ascii=False, indent=2).replace("</", "<\\/")
    return mark_safe(f'<script type="application/ld+json">\n{texte}\n</script>')
