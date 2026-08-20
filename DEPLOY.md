# Déploiement — django-app

Guide pour servir ce projet avec **PostgreSQL**, **Gunicorn** (socket Unix) et **Nginx**, sur un VPS Debian/Ubuntu. Adaptez les chemins, le domaine et les noms d’utilisateur.

Le code Django vit dans `src/`. Les settings lisent `.env` à la racine du dépôt (`src/config/settings.py`).

## 1. Paquets système

```bash
sudo apt update
sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib git
```

## 2. Dépôt et environnement Python

```bash
sudo mkdir -p /var/www/django-app
sudo chown -R "$USER:$USER" /var/www/django-app
cd /var/www/django-app

git clone https://github.com/Killianp-dev/django-app.git .
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

## 3. PostgreSQL

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE blog;
CREATE USER django_app WITH PASSWORD 'choisissez-un-mot-de-passe-fort';
ALTER ROLE django_app SET client_encoding TO 'utf8';
ALTER ROLE django_app SET default_transaction_isolation TO 'read committed';
ALTER ROLE django_app SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE blog TO django_app;
\q
```

Sur PostgreSQL 15+, accordez aussi le schéma `public` :

```sql
\c blog
GRANT ALL ON SCHEMA public TO django_app;
```

## 4. Variables d’environnement

Fichier `/var/www/django-app/.env` (droits restreints, jamais dans Git) :

```env
SECRET_KEY=
DEBUG=False
DB_NAME=blog
DB_USER=django_app
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432
SITE_ID=1
EMAIL_HOST_PASSWORD=
```

Générez la clé :

```bash
/var/www/django-app/.venv/bin/python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Mettez à jour `ALLOWED_HOSTS` dans `src/config/settings.py` avec votre domaine. Vérifiez `EMAIL_HOST`, `EMAIL_HOST_USER` et le destinataire du formulaire de contact.

```bash
cd /var/www/django-app/src
../.venv/bin/python manage.py migrate
../.venv/bin/python manage.py collectstatic --no-input
../.venv/bin/python manage.py createsuperuser
```

## 5. Gunicorn

`/var/www/django-app/gunicorn_config.py` :

```python
import multiprocessing

bind = "unix:/run/django-app.sock"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
timeout = 120
keepalive = 5
loglevel = "info"
accesslog = "/var/log/gunicorn/django-app-access.log"
errorlog = "/var/log/gunicorn/django-app-error.log"
proc_name = "gunicorn_django-app"
forwarded_allow_ips = "*"
max_requests = 1000
max_requests_jitter = 50
daemon = False
```

```bash
sudo mkdir -p /var/log/gunicorn
sudo chown www-data:www-data /var/log/gunicorn
```

Service systemd `/etc/systemd/system/django-app.service` :

```ini
[Unit]
Description=Gunicorn for django-app
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/django-app/src
ExecStart=/var/www/django-app/.venv/bin/gunicorn \
          --config /var/www/django-app/gunicorn_config.py \
          config.wsgi:application
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Le socket `/run/django-app.sock` est plus propre que `/tmp/` (ce dernier peut être nettoyé par le système). Donnez à `www-data` la lecture du code et de `.env`, et l’écriture sur `src/mediafiles/` et le socket.

```bash
sudo chown -R www-data:www-data /var/www/django-app
sudo chmod 640 /var/www/django-app/.env
sudo systemctl daemon-reload
sudo systemctl enable --now django-app
sudo systemctl status django-app
```

## 6. Nginx

`/etc/nginx/sites-available/django-app` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    client_max_body_size 10M;

    location /media/ {
        alias /var/www/django-app/src/mediafiles/;
        expires 7d;
    }

    location /static/ {
        alias /var/www/django-app/src/staticfiles/;
        expires 7d;
    }

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://unix:/run/django-app.sock;
        proxy_redirect off;
    }

    access_log /var/log/nginx/django-app.access.log;
    error_log /var/log/nginx/django-app.error.log;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/django-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Si Gunicorn n’arrive pas à créer le socket dans `/run/`, ajoutez dans le service :

```ini
RuntimeDirectory=django-app
```

et utilisez `unix:/run/django-app/gunicorn.sock` partout (Gunicorn + Nginx).

## 7. HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
sudo certbot renew --dry-run
```

Dans `settings.py`, une fois le certificat en place : `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, HSTS.

## 8. Pare-feu

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 9. Mises à jour

```bash
cd /var/www/django-app
sudo -u www-data git pull origin main
source .venv/bin/activate
pip install -r requirements.txt
cd src
python manage.py migrate
python manage.py collectstatic --no-input
sudo systemctl restart django-app
```

Si le dépôt appartient à root/`$USER` et le service à `www-data`, tirez les changements avec l’utilisateur propriétaire du clone, puis `chown` si besoin.

## 10. Logs et pannes fréquentes

```bash
sudo journalctl -u django-app -f
sudo tail -f /var/log/gunicorn/django-app-error.log
sudo tail -f /var/log/nginx/django-app.error.log
```

| Problème | Piste |
| --- | --- |
| 502 Bad Gateway | Gunicorn arrêté, ou chemin du socket différent entre Nginx et Gunicorn |
| Permission denied (socket / media) | `www-data` n’est pas propriétaire, ou le socket n’existe pas |
| `ImproperlyConfigured` / `.env` | Fichier absent, mal nommé, ou pas lisible par `www-data` |
| Statiques 404 | `collectstatic` non lancé, ou `alias` Nginx qui ne pointe pas vers `staticfiles/` |

Test manuel de Gunicorn :

```bash
cd /var/www/django-app/src
sudo -u www-data ../.venv/bin/gunicorn --config ../gunicorn_config.py config.wsgi:application
```
