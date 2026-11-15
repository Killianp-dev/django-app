from django import template
from django.urls import reverse

register = template.Library()


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
