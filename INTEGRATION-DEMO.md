# Intégration de la démo architecte dans killianp-dev.fr

Guide d'installation de la démo « site vitrine architecte » dans le site existant.

## ✅ Ce qui a été fait

### 1. Structure archi/ créée

```
src/archi/
  cabinet/      # SiteSettings (label: archi_cabinet)
  portfolio/    # MissionType, Project, ProjectPhoto (label: archi_portfolio)
  contact/      # Contact (label: archi_contact)
  views.py, urls.py, sitemaps.py, mixins.py, middleware.py
  admin_demo.py # DemoAdminSite sécurisé
  
src/templates/archi/  # Templates isolés (base, partials, components, pages)
src/static/archi/     # CSS + JS isolés
```

### 2. Modifications du site

**`config/settings.py`** :
- Ajout des 3 apps archi dans `INSTALLED_APPS`
- Ajout du middleware `ArchiDemoGuard` (sécurité)
- Ajout des réglages :
  ```python
  ARCHI_URL_PREFIX = 'demo-architecte/'
  ARCHI_DEMO_MODE = True
  ARCHI_DEMO_NOTIFY_EMAIL = 'contact@killianp-dev.fr'
  ADMIN_URL = 'secure-admin-portal/'
  ```

**`config/urls.py`** :
- Import `demo_admin_site` depuis `archi.admin_demo`
- Ajout des URLs :
  ```python
  path('demo-architecte/admin/', demo_admin_site.urls),  # Admin démo limité
  path('demo-architecte/', include('archi.urls')),       # Pages publiques
  ```

### 3. Migrations créées

```bash
python manage.py makemigrations
# → archi/cabinet/migrations/0001_initial.py
# → archi/contact/migrations/0001_initial.py
# → archi/portfolio/migrations/0001_initial.py
```

## 📝 Prochaines étapes (à faire sur le serveur)

### 1. Sauvegarde base de données

```bash
# Sur le serveur
pg_dump -Fc blog > backup-avant-demo-$(date +%Y%m%d).dump
```

### 2. Application des migrations

```bash
cd /var/www/django-app
source .venv/bin/activate
cd src
python manage.py migrate
# → Crée les tables archi_cabinet_sitesettings, archi_portfolio_*, archi_contact_*
```

### 3. Création du compte démo

```bash
python manage.py create_demo_user --password "MotDePasse2024!"
# → Crée l'utilisateur 'demo' et le groupe 'demo'
# → Permissions limitées à archi_cabinet et archi_portfolio
```

### 4. Génération des données fictives

```bash
python manage.py seed_demo --ville=Lyon
# → Crée SiteSettings, MissionType, Project fictifs
# → Marqué "DEMO-123456" (n° Ordre fictif)
```

### 5. Collectstatic

```bash
python manage.py collectstatic --no-input
# → Copie static/archi/ vers staticfiles/archi/
```

### 6. Redémarrage

```bash
sudo systemctl restart django-app
```

### 7. Vérification

- [ ] Accueil démo : https://killianp-dev.fr/demo-architecte/
- [ ] Admin démo : https://killianp-dev.fr/demo-architecte/admin/ (login : demo / mot de passe défini)
- [ ] Bandeau jaune "Démonstration" visible
- [ ] Meta `noindex` présente (View Page Source)
- [ ] Formulaire de contact envoie bien à contact@killianp-dev.fr avec `[DÉMO architecte]`
- [ ] Le compte démo reçoit 403 sur `/secure-admin-portal/`
- [ ] Le compte démo ne peut pas accéder à `/blog/create/`

## 🔒 Sécurité démo (déjà en place)

### Middleware ArchiDemoGuard

- Membre du groupe 'demo' = anonyme hors de `/demo-architecte/`
- 403 sur l'admin principal
- Empêche l'accès aux vues blog/create, blog/edit, blog/delete

### Admin démo limité

- Uniquement SiteSettings, MissionType, Project + ProjectPhoto
- Aucun modèle auth (User/Group)
- Changement de mot de passe désactivé
- Validateurs d'upload : jpg/jpeg/png/webp, ≤ 5 Mo, vérification Pillow

### Rotation mot de passe (mensuel recommandé)

```bash
python manage.py rotate_demo_password
# → Génère un mot de passe aléatoire 16+ caractères
# → Ferme toutes les sessions démo ouvertes
```

### Réinitialisation nocturne (optionnel)

Cron à 4h du matin :

```bash
0 4 * * * cd /var/www/django-app/src && /var/www/django-app/.venv/bin/python manage.py seed_demo --reset --ville=Lyon >> /var/log/archi-demo-reset.log 2>&1
```

Purge complète (tables archi_* + médias + sessions démo) puis recréation.

## 🚫 Isolation complète

- ✅ Tables `archi_*` séparées (pas de clé étrangère vers blog/contact_form)
- ✅ Templates `archi/` avec leur propre `base.html`
- ✅ CSS/JS sous `static/archi/` uniquement
- ✅ Classes CSS préfixées `.archi-`
- ✅ URLs namespace `archi:`
- ✅ Pas d'indexation (noindex + X-Robots-Tag)
- ✅ Sitemap principal non modifié (pas d'URLs démo)

## 📦 Portabilité (instance client)

Le même package `archi/` peut être déployé en instance client autonome :

1. Clone du repo `django-app`
2. Modification settings :
   ```python
   ARCHI_URL_PREFIX = ''  # Racine, pas de préfixe
   ARCHI_DEMO_MODE = False  # Indexation activée
   ```
3. URLs montées à la racine : `path('', include('archi.urls'))`
4. Seed avec vraies données : `seed_demo` remplacé par saisie admin

## 🐛 Troubleshooting

### Erreur « SiteSettings matching query does not exist »

```bash
python manage.py seed_demo --ville=Lyon
```

### CSS/JS non chargés

```bash
python manage.py collectstatic --no-input
sudo systemctl restart django-app
```

### Images non générées (variantes WebP)

Vérifier Pillow installé :

```bash
pip show pillow
# Si absent : pip install pillow
```

### Email contact non reçu

Vérifier `EMAIL_HOST` dans settings.py et `.env`.

---

**Contact** : Killian P. (contact@killianp-dev.fr)
**Version** : 1.0 (Oct 2026)
