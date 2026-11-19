"""Pages « Création de site internet pour… » : une page de service par métier.

Chaque page vise la recherche d'un professionnel (« création site boulangerie »),
montre la démo du métier et renvoie vers le guide du blog correspondant.
Les textes s'appuient sur ce que montre réellement chaque démo, et sur les CGV.
"""
from types import SimpleNamespace

from django.urls import NoReverseMatch, reverse


def _metier(slug, demo, nom, pour, demo_nom, article, description, accroche, besoins, trouve, faq):
    return SimpleNamespace(
        slug=slug,              # adresse : /creation-site-internet/<slug>/
        demo=demo,              # espace de noms d'URL de la démo, et dossier de ses photos
        nom=nom,                # « Boulangerie » : libellés courts
        pour=pour,              # « pour boulangerie » : titres
        demo_nom=demo_nom,      # nom du commerce fictif de la démo
        article=article,        # slug du guide du blog
        description=description,
        accroche=accroche,
        besoins=besoins,        # [(titre, texte)] : ce que le site montre
        trouve=trouve,          # être trouvé par les clients
        faq=faq,                # [(question, réponse)] propres au métier
        apercu=f"vitrine/photos/{demo}/apercu.jpg",
    )


METIERS = [
    _metier(
        "boulangerie", "boulangerie", "Boulangerie", "pour boulangerie", "Maison Caron",
        "site-internet-boulangerie",
        "Création de site internet pour boulangerie : horaires à jour, fournées du jour, "
        "carte et prix, commandes de gâteaux. Un exemple concret, puis un site clé en main.",
        "Vos clients veulent savoir trois choses : êtes-vous ouvert maintenant, qu'est-ce qui "
        "sort du four, et comment commander un gâteau. Le site de votre boulangerie y répond "
        "en quelques secondes, sur leur téléphone.",
        [
            ("Ouvert maintenant ?", "Les horaires du jour s'affichent en direct, avec les "
             "fermetures exceptionnelles et les jours fériés. Plus d'appels pour demander si vous êtes ouvert."),
            ("Les fournées du jour", "La prochaine sortie du four, les pains et viennoiseries "
             "du moment : de quoi donner envie de passer avant qu'il n'y en ait plus."),
            ("La carte et les prix", "Pains, viennoiseries, pâtisseries et formules, avec leurs "
             "prix. Clair, lisible, mis à jour sans vous déranger."),
            ("Les commandes de gâteaux", "Entremets, pièces montées, gâteaux d'anniversaire : "
             "le délai à prévoir et un formulaire pour passer commande."),
        ],
        "Quand quelqu'un cherche « boulangerie » près de chez lui, Google s'appuie sur votre "
        "fiche d'établissement et sur votre site. Un site qui reprend votre adresse, vos "
        "horaires et vos spécialités, écrit avec les mots de vos clients, vous aide à "
        "apparaître devant les boulangeries voisines.",
        [
            ("Puis-je changer mes horaires ou mes produits moi-même ?",
             "Vous me les envoyez et je les mets à jour : les petites retouches sont comprises "
             "dans l'abonnement, dans la limite d'une heure par mois."),
            ("Peut-on prendre les commandes de gâteaux en ligne ?",
             "Oui : un formulaire de commande indique le délai à prévoir et vous transmet la "
             "demande par e-mail. Vous confirmez ensuite avec le client."),
        ],
    ),
    _metier(
        "salon-de-coiffure", "coiffeur", "Salon de coiffure", "pour salon de coiffure", "Salon Louise",
        "site-internet-salon-de-coiffure",
        "Création de site internet pour salon de coiffure : prestations et tarifs, galerie de "
        "réalisations, avis, horaires et prise de rendez-vous. Un exemple, puis un site clé en main.",
        "Avant de pousser la porte d'un salon, on regarde les coupes, les prix et les avis, "
        "puis on cherche à réserver. Le site de votre salon montre votre travail et mène au "
        "rendez-vous en deux clics, depuis un téléphone.",
        [
            ("Vos prestations et tarifs", "Coupes, couleurs, soins : chaque prestation avec "
             "son prix et sa durée, pour qu'on sache à quoi s'attendre."),
            ("Une galerie de réalisations", "Vos plus belles coupes en photo : c'est ce qui "
             "décide la plupart des nouveaux clients."),
            ("Les avis de vos clients", "Quelques avis bien choisis, mis en avant, pour "
             "rassurer ceux qui ne vous connaissent pas encore."),
            ("Le rendez-vous en deux clics", "Un bouton de réservation toujours visible, vers "
             "votre outil de prise de rendez-vous ou par téléphone."),
        ],
        "Une recherche « coiffeur » se fait presque toujours avec une ville ou un quartier. "
        "Un site qui nomme votre quartier, vos prestations et vos horaires, relié à votre "
        "fiche Google, vous rend visible au moment où l'on cherche un salon.",
        [
            ("Mon outil de réservation actuel est-il compatible ?",
             "Oui : le site renvoie vers votre outil de réservation en ligne, ou vers le "
             "téléphone si vous préférez. Vous n'avez rien à changer à vos habitudes."),
            ("Puis-je ajouter de nouvelles photos de coupes ?",
             "Envoyez-les-moi : je les ajoute à la galerie dans le cadre des retouches "
             "comprises dans l'abonnement."),
        ],
    ),
    _metier(
        "macon", "macon", "Maçonnerie", "pour maçon", "Bertrand Maçonnerie",
        "site-internet-macon",
        "Création de site internet pour maçon et entreprise de maçonnerie : chantiers réalisés, "
        "zone d'intervention, prix indicatifs et demande de devis. Un exemple, puis un site clé en main.",
        "Un particulier qui cherche un maçon veut voir des chantiers, savoir si vous intervenez "
        "chez lui et avoir une idée des prix. Le site de votre entreprise montre votre travail "
        "et transforme ces visites en demandes de devis.",
        [
            ("Vos chantiers en images", "Les réalisations classées par type de travaux, avec "
             "leur lieu : la meilleure preuve de votre savoir-faire."),
            ("Votre zone d'intervention", "Les communes où vous travaillez, présentées "
             "clairement, pour éviter les demandes trop lointaines."),
            ("Des prix indicatifs", "Quelques fourchettes de prix par type de travaux, pour "
             "que vos clients arrivent avec une idée réaliste."),
            ("Une demande de devis détaillée", "Un formulaire qui demande les bonnes "
             "informations : type de travaux, surface, adresse, photos."),
        ],
        "On cherche un maçon avec sa commune : « maçon », « ravalement de façade », "
        "« extension maison » suivis du nom de la ville. Un site qui décrit vos travaux et "
        "nomme votre secteur vous fait apparaître sur ces recherches.",
        [
            ("Puis-je montrer mes chantiers au fur et à mesure ?",
             "Oui : envoyez-moi vos photos de chantier et je les ajoute, dans le cadre des "
             "retouches comprises dans l'abonnement."),
            ("Le site peut-il recevoir des photos du projet du client ?",
             "Le formulaire de demande de devis peut recueillir la description des travaux et "
             "la surface ; les photos peuvent ensuite s'échanger par e-mail."),
        ],
    ),
    _metier(
        "avocat", "avocat", "Cabinet d'avocats", "pour avocat", "Aubert et Clerc",
        "site-internet-avocat",
        "Création de site internet pour avocat et cabinet d'avocats : domaines d'intervention, "
        "honoraires, présentation des associés et prise de contact. Un exemple, puis un site clé en main.",
        "Un client qui cherche un avocat veut comprendre si vous traitez son problème, comment "
        "vous travaillez et combien cela coûte. Le site de votre cabinet l'explique simplement, "
        "dans le respect des règles de communication de la profession.",
        [
            ("Vos domaines d'intervention", "Une page claire par domaine, qui explique les "
             "situations que vous traitez, avec les mots de vos clients."),
            ("Vos honoraires expliqués", "Le mode de facturation (forfait, temps passé, "
             "honoraire de résultat) présenté de façon transparente."),
            ("Les associés et le cabinet", "Le parcours de chacun, les langues parlées, "
             "l'adresse et l'accès au cabinet."),
            ("Les questions fréquentes", "Les réponses aux questions qu'on vous pose au "
             "premier rendez-vous, pour gagner du temps des deux côtés."),
        ],
        "Les recherches d'avocat associent un domaine et une ville : « avocat droit de la "
        "famille Paris », « avocat licenciement ». Une page par domaine d'intervention, qui "
        "mentionne votre barreau et votre ville, vous place sur ces recherches.",
        [
            ("Le site respecte-t-il les règles déontologiques ?",
             "Le site est conçu pour une information sobre et loyale : mentions obligatoires, "
             "pas de comparaison ni de promesse de résultat. Vous validez chaque texte avant la mise en ligne."),
            ("Peut-on présenter plusieurs associés et domaines ?",
             "Oui : chaque associé et chaque domaine d'intervention peut avoir sa propre page, "
             "selon ce que prévoit le devis."),
        ],
    ),
    _metier(
        "boucherie", "boucherie", "Boucherie", "pour boucherie", "Boucherie Morel",
        "site-internet-boucherie",
        "Création de site internet pour boucherie et boucherie-charcuterie : origine des viandes, "
        "prix au kilo, commandes et horaires. Un exemple concret, puis un site clé en main.",
        "Vos clients choisissent une boucherie pour la qualité et l'origine de la viande. Le "
        "site de votre boucherie le montre, aide à prévoir les quantités et facilite les "
        "commandes pour les repas de fête.",
        [
            ("L'origine de vos viandes", "Les élevages, les races et les régions : ce qui "
             "fait la différence avec la grande surface."),
            ("Les prix au kilo", "Les morceaux et leurs prix, présentés simplement, pour "
             "préparer ses courses."),
            ("Combien prévoir ?", "Un calculateur de quantités par convive, très utile pour "
             "un rôti, un barbecue ou un repas de famille."),
            ("Les pièces sur commande", "Volailles de fête, rôtis préparés, plateaux : les "
             "délais et un formulaire de commande."),
        ],
        "Quand on cherche « boucherie » ou « boucher » dans son quartier, Google met en avant "
        "les commerces dont la fiche et le site sont complets et à jour. Votre site renforce "
        "votre fiche et vous distingue des boucheries voisines.",
        [
            ("Peut-on prendre les commandes de fête en ligne ?",
             "Oui : un formulaire de commande indique les délais et vous transmet la demande "
             "par e-mail, vous confirmez ensuite avec le client."),
            ("Les prix doivent-ils être mis à jour souvent ?",
             "Vous m'envoyez les changements et je les reporte : les petites retouches sont "
             "comprises dans l'abonnement, dans la limite d'une heure par mois."),
        ],
    ),
    _metier(
        "institut-de-beaute", "beaute", "Institut de beauté", "pour institut de beauté", "Maison Iris",
        "site-internet-institut-de-beaute",
        "Création de site internet pour institut de beauté : carte des soins avec durées et prix, "
        "cartes cadeaux, horaires et réservation. Un exemple concret, puis un site clé en main.",
        "Avant de réserver un soin, on veut connaître la carte, la durée, le prix et l'ambiance "
        "de l'institut. Le site de votre institut présente tout cela avec élégance et mène à "
        "la réservation.",
        [
            ("La carte des soins", "Chaque soin avec sa durée, son prix et ce qu'il apporte, "
             "classé par catégorie."),
            ("Vos rituels signature", "Les soins qui font votre réputation, mis en avant "
             "avec les photos de l'institut."),
            ("Les cartes cadeaux", "Une page pour les offrir : une source de clients "
             "nouveaux, surtout avant les fêtes."),
            ("Horaires et réservation", "Les horaires du jour en direct et un accès direct à "
             "la prise de rendez-vous."),
        ],
        "Les recherches « institut de beauté », « épilation » ou « soin du visage » se font "
        "avec une ville. Un site qui décrit chaque soin et nomme votre quartier vous fait "
        "apparaître au moment où l'on cherche où réserver.",
        [
            ("Puis-je vendre des cartes cadeaux sur le site ?",
             "Le site présente vos cartes cadeaux et recueille les demandes par formulaire ; "
             "le paiement se fait ensuite à l'institut ou par votre moyen habituel."),
            ("Puis-je changer ma carte des soins ?",
             "Oui : envoyez-moi vos changements, ils sont faits dans le cadre des retouches "
             "comprises dans l'abonnement."),
        ],
    ),
]

# Questions communes à tous les métiers (reprennent les CGV).
FAQ_COMMUNE = [
    ("Combien de temps faut-il pour que mon site soit en ligne ?",
     "Environ trois semaines : une fois vos textes et photos reçus, la mise en ligne "
     "intervient sous 15 jours ouvrés environ, avec deux tours de corrections compris."),
    ("Combien coûte un site vitrine ?",
     "Le tarif est fixé dans un devis, après un premier échange : une création réglée en deux "
     "fois, puis un abonnement mensuel qui comprend l'hébergement, le nom de domaine, une "
     "adresse e-mail professionnelle et la maintenance."),
    ("Le site et le nom de domaine m'appartiennent-ils ?",
     "Oui : le nom de domaine est enregistré à votre nom, et à la fin du contrat vous "
     "récupérez vos textes, vos photos et le code source complet du site."),
]


def metiers():
    """Les pages métier, avec l'adresse de leur démo et de leur guide résolues."""
    for metier in METIERS:
        metier.url = reverse("metier", kwargs={"slug": metier.slug})
        metier.demo_url = reverse(f"{metier.demo}:home")
        try:
            metier.article_url = reverse("blog:detail", kwargs={"slug": metier.article})
        except NoReverseMatch:
            metier.article_url = ""
    return METIERS


def metier_par_slug(slug):
    return next((m for m in metiers() if m.slug == slug), None)


def metier_par_demo(demo):
    return next((m for m in metiers() if m.demo == demo), None)


def metier_par_article(article_slug):
    return next((m for m in metiers() if m.article == article_slug), None)
