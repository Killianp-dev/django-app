"""
Commande create_demo_user : crée le compte 'demo' et le groupe 'demo'.
Permissions limitées aux modèles archi_cabinet et archi_portfolio.
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db import transaction

from archi.cabinet.models import SiteSettings
from archi.portfolio.models import MissionType, Project, ProjectPhoto


class Command(BaseCommand):
    help = 'Crée le compte demo et le groupe demo avec permissions limitées'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            help='Mot de passe initial (sera affiché)'
        )
        parser.add_argument(
            '--staff',
            action='store_true',
            help='Marquer is_staff=True (NON recommandé, utiliser seulement si nécessaire)'
        )
    
    def handle(self, *args, **options):
        password = options.get('password') or 'demo2024!'
        is_staff = options['staff']
        
        if is_staff:
            self.stdout.write(self.style.WARNING(
                '⚠️  Option --staff activée. Attention : cela permet au compte démo '
                'd\'accéder aux vues blog/create, blog/edit si middleware désactivé.'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                '✓ is_staff=False (recommandé) — le DemoAdminSite autorise l\'accès '
                'via has_permission() basé sur le groupe "demo".'
            ))
        
        with transaction.atomic():
            # Créer le groupe 'demo'
            group, group_created = Group.objects.get_or_create(name='demo')
            
            if group_created:
                # Permissions sur archi_cabinet (SiteSettings)
                ct_site = ContentType.objects.get_for_model(SiteSettings)
                perms_site = Permission.objects.filter(content_type=ct_site)
                group.permissions.add(*perms_site)
                
                # Permissions sur archi_portfolio (MissionType, Project, ProjectPhoto)
                for model in [MissionType, Project, ProjectPhoto]:
                    ct = ContentType.objects.get_for_model(model)
                    perms = Permission.objects.filter(content_type=ct)
                    group.permissions.add(*perms)
                
                self.stdout.write(f"  ✓ Groupe 'demo' créé avec permissions archi_cabinet et archi_portfolio")
            else:
                self.stdout.write(f"  • Groupe 'demo' existant")
            
            # Créer ou mettre à jour le compte 'demo'
            user, user_created = User.objects.get_or_create(
                username='demo',
                defaults={
                    'email': 'demo@killianp-dev.fr',
                    'is_staff': is_staff,
                    'is_superuser': False,
                    'is_active': True,
                }
            )
            
            if user_created:
                user.set_password(password)
                user.groups.add(group)
                user.save()
                self.stdout.write(self.style.SUCCESS(
                    f"\n✓ Compte 'demo' créé :\n"
                    f"  - Username : demo\n"
                    f"  - Password : {password}\n"
                    f"  - is_staff : {is_staff}\n"
                    f"  - Groupe : demo\n"
                ))
            else:
                # Utilisateur existant : mise à jour mot de passe si fourni
                if options.get('password'):
                    user.set_password(password)
                    user.save()
                    self.stdout.write(self.style.SUCCESS(
                        f"✓ Mot de passe du compte 'demo' mis à jour : {password}"
                    ))
                else:
                    self.stdout.write(f"  • Compte 'demo' existant (mot de passe inchangé)")
                
                # Assurer qu'il est dans le groupe
                if group not in user.groups.all():
                    user.groups.add(group)
                    self.stdout.write(f"  ✓ Ajouté au groupe 'demo'")
        
        self.stdout.write(self.style.SUCCESS(
            f"\n💡 Le compte démo peut accéder à /demo-architecte/admin/ uniquement."
        ))
