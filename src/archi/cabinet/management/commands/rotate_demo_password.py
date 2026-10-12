"""
Commande rotate_demo_password : génère un nouveau mot de passe aléatoire
pour le compte 'demo' et ferme ses sessions ouvertes.

À lancer :
- À chaque nouveau prospect
- Au minimum le 1er de chaque mois (rappel agenda)
"""
import secrets
import string
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.db import transaction


class Command(BaseCommand):
    help = 'Génère un nouveau mot de passe aléatoire pour le compte demo et ferme ses sessions'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--length',
            type=int,
            default=16,
            help='Longueur du mot de passe (défaut: 16)'
        )
    
    def handle(self, *args, **options):
        length = options['length']
        
        if length < 12:
            raise CommandError("Le mot de passe doit faire au moins 12 caractères.")
        
        try:
            user = User.objects.get(username='demo')
        except User.DoesNotExist:
            raise CommandError(
                "Le compte 'demo' n'existe pas. "
                "Lancez d'abord : python manage.py create_demo_user"
            )
        
        # Génère un mot de passe fort
        alphabet = string.ascii_letters + string.digits + '!@#$%&*'
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        
        with transaction.atomic():
            # Change le mot de passe
            user.set_password(password)
            user.save()
            
            # Ferme toutes les sessions du compte demo
            # (user.session_set n'existe pas directement, on passe par Session.get_decoded)
            sessions_deleted = 0
            for session in Session.objects.all():
                session_data = session.get_decoded()
                if session_data.get('_auth_user_id') == str(user.id):
                    session.delete()
                    sessions_deleted += 1
        
        self.stdout.write(self.style.SUCCESS(
            f"\n✓ Mot de passe du compte 'demo' renouvelé :\n\n"
            f"  {password}\n\n"
            f"⚠️  Notez ce mot de passe (il ne sera plus affiché).\n"
            f"✓ {sessions_deleted} session(s) fermée(s).\n"
        ))
