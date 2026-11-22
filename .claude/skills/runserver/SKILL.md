---
name: runserver
description: Lance le serveur de développement Django en local sur http://127.0.0.1:8000. À utiliser quand on demande de démarrer, lancer ou relancer le serveur local, ou de voir le site tourner.
---

# Lancer le serveur local

1. Vérifie si le port 8000 est déjà occupé : `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/`. Si ça répond (200, 301, 302…), le serveur tourne déjà : dis-le et n'en relance pas un second.
2. Sinon, lance-le **en arrière-plan** (`run_in_background: true`) depuis la racine du dépôt :

   ```bash
   source env/bin/activate && cd src && python manage.py runserver 127.0.0.1:8000
   ```

   Le virtualenv est `env/` à la racine (pas `.venv`). Le shell de connexion est fish, mais la commande est exécutée par bash.
3. Attends 2-3 secondes, puis revérifie avec le `curl` de l'étape 1 ; en cas d'échec, lis la sortie du processus en arrière-plan et rapporte l'erreur.
4. Réponds avec l'adresse : http://127.0.0.1:8000

Pour arrêter le serveur, arrête la tâche d'arrière-plan correspondante.

Variante : `./run_livereload.sh` lance `manage.py livereload` (rechargement auto du navigateur) ; ne l'utilise que si on le demande.
