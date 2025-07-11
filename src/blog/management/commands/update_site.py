from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site


class Command(BaseCommand):
    help = 'Update site domain and name for production'

    def add_arguments(self, parser):
        parser.add_argument(
            '--domain',
            type=str,
            default='killianp-dev.fr',
            help='Domain name for the site'
        )
        parser.add_argument(
            '--name',
            type=str,
            default='Killian P. - Développeur Backend',
            help='Display name for the site'
        )

    def handle(self, *args, **options):
        domain = options['domain']
        name = options['name']

        try:
            site = Site.objects.get(pk=1)
            site.domain = domain
            site.name = name
            site.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully updated site: {domain} - {name}'
                )
            )
        except Site.DoesNotExist:
            site = Site.objects.create(pk=1, domain=domain, name=name)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created site: {domain} - {name}'
                )
            ) 