# Guide de Déploiement pour "my-blog" avec Gunicorn et Nginx

## 1. Préparation du Serveur

### Mise à jour et installation des packages requis
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install python3-pip python3-venv nginx postgresql postgresql-contrib git -y
```

### Configuration du répertoire du projet
```bash
# Créer un répertoire pour votre projet en production
sudo mkdir -p /var/www/my-blog
sudo chown -R $USER:$USER /var/www/my-blog
cd /var/www/my-blog

# Cloner votre dépôt (remplacer avec votre URL Git si vous utilisez Git)
# Ou copier votre projet directement depuis votre machine de développement
rsync -avz --exclude='env' --exclude='__pycache__' /home/killianp/Documents/Projets/Production/my-blog/ /var/www/my-blog/

# Créer et activer un environnement virtuel
python3 -m venv env
source env/bin/activate

# Installer les dépendances
pip install -r requirements.txt
pip install gunicorn
```

## 2. Configuration de la Base de Données PostgreSQL

```bash
sudo -u postgres psql

# Dans le shell PostgreSQL
CREATE DATABASE blogdev;
CREATE USER killianp WITH PASSWORD 'nouveau_mot_de_passe_sécurisé';
ALTER ROLE killianp SET client_encoding TO 'utf8';
ALTER ROLE killianp SET default_transaction_isolation TO 'read committed';
ALTER ROLE killianp SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE blogdev TO killianp;
\q
```

## 3. Configuration de l'Application Django

```bash
# Se déplacer dans le répertoire src de l'application
cd /var/www/my-blog/src

# Mettre à jour le fichier .env avec les informations de production
# Remarque: conservez la structure existante mais mettez à jour les valeurs sensibles
cat > ../.env << EOL
DB_NAME=blogdev
DB_USER=killianp
DB_PASSWORD=nouveau_mot_de_passe_sécurisé
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(50))')
EOL

# Collecter les fichiers statiques
python manage.py collectstatic --no-input

# Exécuter les migrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser
```

## 4. Configuration de Gunicorn

### Création du fichier de configuration Gunicorn
```bash
# Créer le fichier de configuration Gunicorn
cat > /var/www/my-blog/gunicorn_config.py << EOL
#!/usr/bin/env python

import multiprocessing

# Adresse de liaison - Le socket à lier
bind = "unix:/tmp/my-blog.sock"

# Processus worker - Formule recommandée: (2 x $num_cores) + 1
workers = multiprocessing.cpu_count() * 2 + 1

# Classe de worker - Type de workers à utiliser
worker_class = 'sync'

# Timeout - Si un worker ne notifie pas le processus maître dans ce nombre de secondes, il est tué
timeout = 120

# Maintenir les workers en vie pendant ce nombre de secondes après avoir traité une requête
keepalive = 5

# Niveau de log - La granularité des sorties de log
loglevel = 'info'

# Log d'accès - Chemin vers le fichier de log d'accès
accesslog = "/var/log/gunicorn/access.log"

# Log d'erreur - Chemin vers le fichier de log d'erreur
errorlog = "/var/log/gunicorn/error.log"

# Nom du processus - Utilisé pour la surveillance
proc_name = 'gunicorn_my-blog'

# Lorsque Gunicorn est déployé derrière un proxy, il respectera le 'X-Forwarded-For'
forwarded_allow_ips = '*'

# Requêtes maximales par worker
max_requests = 1000
max_requests_jitter = 50

# Mode daemon - Exécuter en arrière-plan
daemon = False
EOL

# Créer le répertoire de logs pour Gunicorn
sudo mkdir -p /var/log/gunicorn
sudo chown www-data:www-data /var/log/gunicorn
```

### Création du fichier de service systemd pour Gunicorn
```bash
# Créer le fichier de service systemd
sudo cat > /etc/systemd/system/my-blog.service << EOL
[Unit]
Description=gunicorn daemon for my-blog
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/my-blog/src
ExecStart=/var/www/my-blog/env/bin/gunicorn \
          --config /var/www/my-blog/gunicorn_config.py \
          config.wsgi:application
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOL

# Activer et démarrer le service Gunicorn
sudo systemctl daemon-reload
sudo systemctl enable my-blog
sudo systemctl start my-blog
sudo systemctl status my-blog  # Vérifier l'état
```

## 5. Configuration de Nginx

```bash
# Créer la configuration du site Nginx
sudo cat > /etc/nginx/sites-available/my-blog << EOL
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    
    # Rediriger HTTP vers HTTPS (à activer une fois le SSL configuré)
    # return 301 https://\$host\$request_uri;

    # Fichiers media et statiques
    location /media/ {
        alias /var/www/my-blog/src/mediafiles/;
        expires 1d;
    }
    
    location /static/ {
        alias /var/www/my-blog/src/staticfiles/;
        expires 1d;
    }
    
    # Transmettre les requêtes à Gunicorn
    location / {
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_pass http://unix:/tmp/my-blog.sock;
        proxy_redirect off;
        client_max_body_size 10M;
    }
    
    # Logs
    access_log /var/log/nginx/my-blog.access.log;
    error_log /var/log/nginx/my-blog.error.log;
}

# Configuration HTTPS (à activer après avoir obtenu le certificat SSL)
# server {
#     listen 443 ssl;
#     server_name votre-domaine.com www.votre-domaine.com;
#     
#     # Configuration SSL
#     ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_prefer_server_ciphers on;
#     ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
#     
#     # En-têtes de sécurité
#     add_header X-Content-Type-Options nosniff;
#     add_header X-Frame-Options SAMEORIGIN;
#     add_header X-XSS-Protection "1; mode=block";
#     
#     # Fichiers media et statiques
#     location /media/ {
#         alias /var/www/my-blog/src/mediafiles/;
#         expires 1d;
#     }
#     
#     location /static/ {
#         alias /var/www/my-blog/src/staticfiles/;
#         expires 1d;
#     }
#     
#     # Transmettre les requêtes à Gunicorn
#     location / {
#         proxy_set_header Host \$host;
#         proxy_set_header X-Real-IP \$remote_addr;
#         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto \$scheme;
#         proxy_pass http://unix:/tmp/my-blog.sock;
#         proxy_redirect off;
#         client_max_body_size 10M;
#     }
#     
#     # Logs
#     access_log /var/log/nginx/my-blog.access.log;
#     error_log /var/log/nginx/my-blog.error.log;
# }
EOL

# Créer un lien symbolique pour activer le site
sudo ln -s /etc/nginx/sites-available/my-blog /etc/nginx/sites-enabled/

# Tester la configuration Nginx
sudo nginx -t

# Si le test réussit, redémarrer Nginx
sudo systemctl restart nginx
```

## 6. Configuration de Django pour la Production

```bash
# Créer un fichier de paramètres de production
cat > /var/www/my-blog/src/config/production_settings.py << EOL
# Se base sur les paramètres existants
from .settings import *

# Désactiver le mode debug
DEBUG = False

# Ajouter votre domaine ici
ALLOWED_HOSTS = ['votre-domaine.com', 'www.votre-domaine.com', 'localhost', '127.0.0.1']

# Paramètres HTTPS (à activer une fois SSL configuré)
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
# SECURE_BROWSER_XSS_FILTER = True
# SECURE_CONTENT_TYPE_NOSNIFF = True
# SECURE_HSTS_SECONDS = 31536000  # 1 an
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True

# Fichiers statiques (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = '/var/www/my-blog/src/staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = '/var/www/my-blog/src/mediafiles'

# Backend d'email pour la production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.votre-fournisseur-email.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = 'noreply@votre-domaine.com'
EOL

# Mettre à jour le fichier wsgi.py pour utiliser les paramètres de production
cat > /var/www/my-blog/src/config/wsgi.py << EOL
"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.production_settings')

application = get_wsgi_application()
EOL

# Mettre à jour le fichier .env pour inclure les paramètres d'email
echo "EMAIL_HOST_USER=your_email@example.com" >> /var/www/my-blog/.env
echo "EMAIL_HOST_PASSWORD=your_email_password" >> /var/www/my-blog/.env
```

## 7. Configuration SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir un certificat SSL (remplacer votre-domaine.com)
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Certbot mettra automatiquement à jour la configuration Nginx
# Tester le processus de renouvellement
sudo certbot renew --dry-run

# Activer les paramètres HTTPS dans production_settings.py (décommenter les lignes)
```

## 8. Configuration du Pare-feu (si nécessaire)

```bash
sudo apt install ufw -y
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

## 9. Permissions et Sécurité

```bash
# S'assurer que www-data a les permissions nécessaires
sudo chown -R www-data:www-data /var/www/my-blog
find /var/www/my-blog -type d -exec chmod 755 {} \;
find /var/www/my-blog -type f -exec chmod 644 {} \;

# S'assurer que les scripts sont exécutables
chmod +x /var/www/my-blog/run_server.sh
chmod +x /var/www/my-blog/run_livereload.sh

# S'assurer que le répertoire media est accessible en écriture
sudo chmod -R 775 /var/www/my-blog/src/mediafiles
```

## 10. Maintenance et Mises à Jour

Pour mettre à jour votre site :
```bash
cd /var/www/my-blog

# Activer l'environnement virtuel
source env/bin/activate

# Tirer les derniers changements (si vous utilisez Git)
git pull origin main

# Ou synchroniser les fichiers manuellement
rsync -avz --exclude='env' --exclude='__pycache__' /chemin/vers/source/ /var/www/my-blog/

# Mettre à jour les dépendances
pip install -r requirements.txt

# Appliquer les migrations
cd src
python manage.py collectstatic --no-input
python manage.py migrate

# Redémarrer Gunicorn
sudo systemctl restart my-blog
```

## 11. Surveillance des Logs

```bash
# Logs Gunicorn
sudo tail -f /var/log/gunicorn/error.log
sudo tail -f /var/log/gunicorn/access.log

# Logs Nginx
sudo tail -f /var/log/nginx/my-blog.error.log
sudo tail -f /var/log/nginx/my-blog.access.log
```

## 12. Problèmes Courants et Dépannage

1. **Problèmes de Permissions** :
   ```bash
   sudo chown -R www-data:www-data /var/www/my-blog
   sudo chown -R www-data:www-data /var/log/gunicorn
   ```

2. **Problèmes de Connexion au Socket** :
   ```bash
   # Vérifier si Gunicorn est lié au socket
   sudo ss -lp | grep gunicorn
   
   # Vérifier les permissions du socket
   ls -la /tmp/my-blog.sock
   ```

3. **Erreurs Django** :
   ```bash
   sudo tail -f /var/log/gunicorn/error.log
   ```

4. **Redémarrage des Services** :
   ```bash
   sudo systemctl daemon-reload  # Après avoir modifié les fichiers systemd
   sudo systemctl restart my-blog
   sudo systemctl restart nginx
   ```

5. **Si Gunicorn ne démarre pas** :
   ```bash
   # Démarrer Gunicorn manuellement pour voir les erreurs
   cd /var/www/my-blog/src
   ../env/bin/gunicorn --config ../gunicorn_config.py config.wsgi:application
   ```
