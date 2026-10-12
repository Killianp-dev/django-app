"""
Réglages par défaut pour le package archi.
À surcharger dans settings.py du projet hôte.
"""

# Préfixe d'URL ('' pour instance client, 'demo-architecte/' pour démo killianp)
ARCHI_URL_PREFIX = ''

# Mode démo (True = noindex, bandeau, JSON-LD désactivé, mails vers notify_email)
ARCHI_DEMO_MODE = False

# Email de notification en mode démo (reçoit les messages du formulaire)
ARCHI_DEMO_NOTIFY_EMAIL = 'contact@killianp-dev.fr'
