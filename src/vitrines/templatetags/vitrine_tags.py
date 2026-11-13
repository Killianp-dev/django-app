from django import template
from django.urls import reverse

register = template.Library()


@register.simple_tag(takes_context=True)
def site_url(context, name, slug=None):
    namespace = context["request"].resolver_match.namespace
    if slug:
        return reverse(f"{namespace}:{name}", kwargs={"slug": slug})
    return reverse(f"{namespace}:{name}")
