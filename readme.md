# django-app

Site personnel [killianp-dev.fr](https://killianp-dev.fr) : vitrine, blog Django 5.2 et formulaire de contact. PostgreSQL, images d’articles, sitemap et mentions légales.

## Fonctionnalités

- Page d’accueil (portfolio) avec derniers articles et formulaire de contact
- Blog : liste, détail, temps de lecture estimé, miniature + légende
- CRUD articles réservé au staff
- Contact : enregistrement en base **et** envoi d’e-mail
- Sitemap (`/sitemap.xml`) et `robots.txt`
- Mentions légales
- Admin Django sous `/secure-admin-portal/` (pas `/admin/`)

## Prérequis

- Python 3.12
- PostgreSQL
- Compte SMTP si vous voulez envoyer de vrais e-mails (sinon adaptez `EMAIL_*` dans `src/config/settings.py`)

## Installation (développement)

```bash
git clone https://github.com/Killianp-dev/django-app.git
cd django-app
python3 -m venv .venv
source .venv/bin/activate   # Windows : .venv\Scripts\activate
pip install -r requirements.txt
```

Créez une base PostgreSQL, puis un `.env` à la racine du dépôt :

```env
SECRET_KEY=remplacez-moi-par-une-clé-secrète
DEBUG=True
DB_NAME=blog
DB_USER=blog_user
DB_PASSWORD=mot_de_passe
DB_HOST=localhost
DB_PORT=5432
SITE_ID=1
EMAIL_HOST_PASSWORD=
```

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

```bash
cd src
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

`SITE_ID` doit correspondre à l’enregistrement `django_site` (souvent `1` après `migrate`). `EMAIL_HOST_PASSWORD` est lu même en local : laissez vide si vous n’envoyez pas de mail, ou configurez un vrai SMTP.

| URL | Rôle |
| --- | --- |
| http://127.0.0.1:8000/ | Accueil |
| http://127.0.0.1:8000/blog/ | Articles |
| http://127.0.0.1:8000/contact/ | Formulaire de contact |
| http://127.0.0.1:8000/mentions-legales/ | Mentions légales |
| http://127.0.0.1:8000/sitemap.xml | Sitemap |
| http://127.0.0.1:8000/secure-admin-portal/ | Administration |

`ALLOWED_HOSTS` contient déjà le domaine de production et `127.0.0.1`. Ajoutez `localhost` si besoin.

Les fichiers uploadés (miniatures) vont dans `src/mediafiles/`. Les statiques collectés dans `src/staticfiles/`.

## Tests

À lancer depuis `src/` (là où se trouve `manage.py`) :

```bash
cd src
python manage.py test
```

Les tests utilisent SQLite en mémoire : PostgreSQL n’est pas requis. Les e-mails sont capturés (`mail.outbox`), rien n’est envoyé.

Couverture actuelle : modèle et vues du blog (slug, temps de lecture, brouillons, accès staff), formulaire de contact (validation, enregistrement, e-mail), pages d’accueil, mentions légales, `robots.txt` et sitemap.

## Structure

```
django-app/
├── .env
├── requirements.txt
├── DEPLOY.md            # Gunicorn + Nginx + PostgreSQL
└── src/
    ├── manage.py
    ├── config/          # settings, urls, sitemaps
    ├── blog/
    ├── contact_form/
    ├── templates/
    ├── static/
    ├── mediafiles/      # uploads (non versionnés)
    └── staticfiles/     # collectstatic (non versionnés)
```

## Production

Guide pas à pas : [DEPLOY.md](DEPLOY.md) (Gunicorn, systemd, Nginx, Let’s Encrypt).

Minimum : `DEBUG=False`, secrets uniquement dans `.env`, `collectstatic`, HTTPS, et un utilisateur PostgreSQL dédié.

## Licence

MIT.
