"""En-têtes de sécurité que Django 5.2 ne pose pas lui-même : CSP et Permissions-Policy."""
from django.conf import settings

# Ce que le site charge réellement : ses propres fichiers, Google Analytics après
# consentement, des images en data: (SVG) et des styles en ligne (variables CSS en
# attribut style). Les scripts en ligne (thème, consentement, JSON-LD) imposent
# 'unsafe-inline' tant qu'ils ne sont pas déplacés dans des fichiers ou signés.
_GA = "https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com"

CSP = "; ".join([
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    f"img-src 'self' data: {_GA}",
    "font-src 'self'",
    f"connect-src 'self' {_GA}",
    # Vidéos YouTube intégrées dans les articles (mode sans cookie).
    "frame-src https://www.youtube-nocookie.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
])

PERMISSIONS_POLICY = ", ".join([
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "browsing-topics=()",
])


class SecurityHeadersMiddleware:
    """Ajoute la CSP (en mode « Report-Only » tant que CSP_REPORT_ONLY vaut True :
    les violations s'affichent dans la console du navigateur sans rien bloquer)
    et la Permissions-Policy."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        header = (
            "Content-Security-Policy-Report-Only"
            if getattr(settings, "CSP_REPORT_ONLY", True)
            else "Content-Security-Policy"
        )
        response.headers.setdefault(header, CSP)
        response.headers.setdefault("Permissions-Policy", PERMISSIONS_POLICY)
        return response
