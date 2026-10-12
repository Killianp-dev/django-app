"""
Settings pour démo locale (SQLite au lieu de PostgreSQL)
Usage: python manage.py runserver --settings=settings_demo_local
"""
from config.settings import *

# Override database pour SQLite
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db_demo.sqlite3',
    }
}

print("🔧 Mode démo local : SQLite activé")
