"""Bertrand Maçonnerie — entreprise de maçonnerie fictive."""
from ._base import _etape, _eur, _groupe, _jour, _ligne, _ns, _offre, _realisation, _site


def _chantier(image, titre, filtre, offre, alt, detail):
    return _realisation(image, titre, filtre, offre, alt, detail=detail, key="macon")


def _poste(poste, detail, quantite, unite, prix_unitaire):
    total = round(quantite * prix_unitaire, 2)
    return _ns(
        poste=poste, detail=detail, unite=unite, total=total,
        quantite=f"{quantite:g}".replace(".", ","),
        prix_unitaire_txt=_eur(prix_unitaire), total_txt=_eur(total),
    )


def _taux(valeur, label, aide):
    tva = round(_TOTAL_HT * valeur / 100, 2)
    return _ns(valeur=valeur, label=label, aide=aide, tva_txt=_eur(tva), ttc_txt=_eur(_TOTAL_HT + tva))


_POSTES = [
    _poste("Installation de chantier", "Protection des sols, bâches, accès", 1, "forfait", 380),
    _poste("Étaiement provisoire", "Chandelles et bastaings, de part et d'autre du mur", 1, "forfait", 640),
    _poste("Ouverture du mur porteur", "Sciage et démolition, parpaing de 20 cm, 3,00 × 2,15 m", 6.45, "m²", 165),
    _poste("Linteau métallique", "2 IPN de 180, platines et calage au mortier sans retrait", 1, "ensemble", 1480),
    _poste("Reprises en tableau", "Jambages et sous-face, enduit au mortier bâtard", 7.3, "ml", 48),
    _poste("Évacuation des gravats", "Benne 3 m³ et mise en décharge agréée", 1, "forfait", 420),
]
_TOTAL_HT = round(sum(p.total for p in _POSTES), 2)
_TAUX = [
    _taux(10, "TVA 10 %", "Logement de plus de deux ans"),
    _taux(20, "TVA 20 %", "Construction neuve ou local professionnel"),
]


MACON = _site(
    key="macon",
    nom="Bertrand Maçonnerie",
    ville="Paris",
    eyebrow="Maçonnerie générale — Paris et petite couronne",
    role_line="Julien Bertrand, artisan maçon",
    footer_line="Julien Bertrand, artisan maçon — SIRET fictif",
    nature="une entreprise de maçonnerie fictive",
    adresse="31 rue Saint-Maur",
    code_postal="75011",
    telephone="01 43 55 45 45",
    telephone_lien="0143554545",
    email="contact@bertrand-maconnerie-demo.fr",
    horaires="Lundi au vendredi, 7h30–17h30. Devis sur rendez-vous.",
    horaires_hero=False,
    zone="Paris et petite couronne",
    titre="Bertrand Maçonnerie — Maçon à Paris",
    description="Entreprise de maçonnerie fictive à Paris. Gros œuvre, rénovation, extension, extérieurs. Devis détaillé après visite. Démonstration de site vitrine.",
    hero_variant="full",
    hero_title="Des murs droits, un devis lisible.",
    accroche="Gros œuvre, rénovation et extensions, à Paris et en petite couronne. On visite, on chiffre poste par poste, on tient le planning.",
    presentation=(
        "Julien Bertrand travaille avec deux compagnons depuis 2009. "
        "Il visite avant de chiffrer, et le devis décrit les postes, pas une ligne unique."
    ),
    a_propos=[
        "L'entreprise intervient sur des maisons et des petits immeubles, à Paris et dans les communes de la petite couronne. Pas de marché public, pas de tour de bureaux : des chantiers où le client habite souvent à côté.",
        "Le devis suit la visite. Il liste les postes, les quantités, les délais et ce qui reste à la charge du client, comme les accès ou le stationnement de la benne.",
        "Chaque chantier a un responsable, Julien ou l'un des deux compagnons. Vous savez qui appeler, et vous recevez un point écrit à la fin de chaque semaine.",
        "Les travaux sont couverts par une assurance décennale et une responsabilité civile professionnelle. Les attestations sont jointes au devis.",
    ],
    chiffres=[
        _ns(valeur="2009", label="création de l'entreprise"),
        _ns(valeur="3", label="maçons sur chaque chantier"),
        _ns(valeur="72 h", label="pour recevoir le devis après visite"),
        _ns(valeur="10 ans", label="de garantie décennale"),
    ],
    faits=[
        _ns(label="Zone", texte="Paris et petite couronne : Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne."),
        _ns(label="Visite", texte="Gratuite, sur rendez-vous, du lundi au vendredi."),
        _ns(label="Assurances", texte="Décennale et RC professionnelle, attestations fournies."),
        _ns(label="Paiement", texte="Acompte de 30 % à la commande, solde à la réception."),
    ],
    reperes=[
        _ns(label="Zone", value="Paris et petite couronne", href=""),
        _ns(label="Devis", value="Sous 72 h après visite", href=""),
        _ns(label="Téléphone", value="01 43 55 45 45", href="tel:0143554545"),
        _ns(label="Garantie", value="Décennale incluse", href=""),
    ],
    engagements=[
        "Visite et devis gratuits",
        "Devis détaillé poste par poste",
        "Assurance décennale incluse",
    ],
    gages=[
        _ns(titre="Le devis détaillé", texte="Chaque poste a sa quantité, son unité et son prix. Vous comparez ligne à ligne."),
        _ns(titre="Le planning tenu", texte="Une date de début, une durée, et un point écrit chaque vendredi."),
        _ns(titre="Le chantier propre", texte="Sols protégés, gravats évacués en benne agréée, accès dégagé le soir."),
    ],
    contact_aside=_ns(
        titre="Appeler l'entreprise",
        texte="Julien rappelle dans la journée, souvent en fin de chantier, vers 17h30.",
        liens=[_ns(label="01 43 55 45 45", href="tel:0143554545")],
        lignes=["31 rue Saint-Maur, 75011 Paris", "Visites du lundi au vendredi"],
    ),
    labels=_ns(
        offres="Savoir-faire",
        offres_kicker="Savoir-faire",
        offres_title="Ce que l'entreprise construit",
        offres_intro="Quatre types de chantier, du mur porteur à la terrasse, sur des maisons et des petits immeubles.",
        offre="Type de travaux",
        offre_placeholder="Choisir un type de travaux",
        offre_eyebrow="Savoir-faire",
        about="L'entreprise",
        about_link="L'entreprise",
        about_title="Trois maçons, un responsable par chantier",
        steps_kicker="Chantier",
        steps_title="De la visite à la réception",
        hero_primary="Le savoir-faire",
        hero_secondary="Demander un devis",
        more="En savoir plus",
        contact_title="Décrire votre chantier",
        contact_text="Quelques lignes suffisent : le lieu, le type de travaux, et quand vous voulez commencer. Julien vous rappelle pour fixer une visite.",
        message_placeholder="Le lieu, les travaux, et la période souhaitée. Une photo peut suivre par email.",
        cta_title="Un mur, une ouverture, une dalle ?",
        cta_text="Décrivez le chantier. On vous dit si on peut passer voir, et quand.",
        cta_button="Demander un devis",
        detail_button="Parler de ces travaux",
        nav_cta="Demander un devis",
        offre_meta_prix="Prix indicatif",
        offre_meta_duree="Durée",
        tarifs="Prix indicatifs",
        tarifs_kicker="Repères de prix",
        tarifs_link="Voir les prix indicatifs",
        realisations="Chantiers",
        realisations_kicker="Chantiers récents",
        realisations_title="Ce qui a été construit",
        realisations_intro="Des chantiers de maison et de petit collectif, à Paris et autour. Chaque photo indique le lieu et la durée.",
        avis_kicker="Clients",
        avis_title="Ils ont fait construire",
        faq_kicker="Avant de commencer",
        faq_title="Les questions qu'on nous pose",
        horaires_title="Bureau et visites",
        signature_kicker="Le devis",
        signature_title="Un devis que l'on peut lire",
    ),
    mail_tag="macon",
    photos=_ns(hero="vitrine/photos/macon/hero-parpaing.jpg", about="vitrine/photos/macon/entreprise.jpg"),
    schema_type="GeneralContractor",
    horaires_semaine=[
        _jour("Lundi", "Lun", "7:30", "17:30"),
        _jour("Mardi", "Mar", "7:30", "17:30"),
        _jour("Mercredi", "Mer", "7:30", "17:30"),
        _jour("Jeudi", "Jeu", "7:30", "17:30"),
        _jour("Vendredi", "Ven", "7:30", "17:00"),
        _jour("Samedi", "Sam"),
        _jour("Dimanche", "Dim"),
    ],
    devis=_ns(
        reference="Devis n° 2026-118",
        client="Maison individuelle — Montreuil",
        objet="Création d'une ouverture de 3 m dans un mur porteur, entre cuisine et séjour",
        postes=_POSTES,
        total_ht_txt=_eur(_TOTAL_HT),
        taux=_TAUX,
        delai="5 jours ouvrés",
        validite="Devis valable 3 mois",
        notes=[
            _ns(titre="Chaque poste est chiffré", texte="Quantité, unité, prix unitaire. Rien n'est caché dans un forfait global."),
            _ns(titre="Le calcul de structure est prévu", texte="Le linteau est dimensionné par un bureau d'études. La note de calcul vous est remise."),
            _ns(titre="Ce qui n'est pas inclus est écrit", texte="Peinture, électricité et sol restent à prévoir : c'est indiqué en bas du devis."),
        ],
        exclusions="Non compris : peinture, reprise électrique, revêtement de sol.",
    ),
    tarifs_note=(
        "Prix constatés sur nos chantiers récents, hors taxes, pour un accès normal. "
        "Ils servent de repère : le prix ferme vient après la visite, dans un devis détaillé."
    ),
    tarifs=[
        _groupe("Gros œuvre", [
            _ligne("Ouverture de mur porteur, jusqu'à 3 m", "dès 2 900 € HT", "3 à 5 jours", "Étaiement et linteau compris"),
            _ligne("Dalle béton armé", "dès 95 € HT / m²", "2 à 4 jours", "Hors terrassement"),
            _ligne("Mur en parpaing de 20", "dès 85 € HT / m²", "Selon surface"),
            _ligne("Reprise en sous-œuvre", "sur devis", "Après étude"),
        ]),
        _groupe("Rénovation", [
            _ligne("Rejointoiement de mur en pierre", "dès 70 € HT / m²", "Selon surface"),
            _ligne("Enduit de façade à la chaux", "dès 55 € HT / m²", "Hors échafaudage"),
            _ligne("Reprise de fissure structurelle", "dès 450 € HT", "1 jour", "Agrafage et injection"),
        ]),
        _groupe("Extension", [
            _ligne("Extension de plain-pied, gros œuvre", "dès 1 100 € HT / m²", "4 à 8 semaines", "Fondations, murs, chaînages"),
            _ligne("Surélévation, maçonnerie seule", "sur devis", "Après étude de structure"),
        ]),
        _groupe("Extérieur", [
            _ligne("Terrasse maçonnée", "dès 120 € HT / m²", "3 à 6 jours"),
            _ligne("Muret de clôture", "dès 160 € HT / ml", "Selon hauteur"),
            _ligne("Escalier extérieur en béton", "dès 1 800 € HT", "3 jours"),
        ]),
    ],
    theme={
        "--font-heading": '"Barlow Condensed", "Arial Narrow", Impact, sans-serif',
        "--color-bg": "#F4F1EC",
        "--color-surface": "#E9E4DC",
        "--color-ink": "#23201D",
        "--color-ink-soft": "#5A544E",
        "--color-accent": "#B4471A",
        "--color-accent-hover": "#8E3612",
        "--color-accent-soft": "#F0B98F",
        "--color-on-accent": "#FFFFFF",
        "--color-border": "#D6CEC2",
        "--focus-ring": "#B4471A",
        "--color-hero": "#1F1C19",
    },
    offres=[
        _offre(
            "gros-oeuvre", "Gros œuvre", "Murs porteurs, dalles, ouvertures.",
            "On reprend un mur porteur, on coule une dalle, on ouvre une baie. L'étaiement, le linteau et les reprises sont dans le devis, avec la note de calcul du bureau d'études.",
            ["Ouverture de mur porteur", "Dalle et fondations", "Murs en parpaing ou en brique", "Linteaux et chaînages"],
            "vitrine/photos/macon/gros-oeuvre-mur.jpg",
            prix="dès 2 900 € HT", duree="3 à 5 jours",
            suite="Pour une ouverture de 3 m dans un mur porteur, comptez une semaine, étaiement compris. Le chantier reste habitable : la poussière est confinée par des bâches.",
        ),
        _offre(
            "renovation", "Rénovation", "Pierre, enduits, fissures.",
            "Pierre, parpaing ou brique : on regarde ce qui porte encore avant de casser. Le devis sépare la dépose et la reconstruction, pour que vous sachiez ce que vous payez.",
            ["Piquage et dépose", "Rejointoiement à la chaux", "Reprise de fissures", "Enduits de façade"],
            "vitrine/photos/macon/renovation-enduit.jpg",
            prix="dès 55 € HT / m²", duree="selon surface",
            suite="Sur un mur ancien, on privilégie la chaux : elle laisse respirer la pierre. Le ciment est réservé aux parties neuves.",
        ),
        _offre(
            "extension", "Extension", "Une pièce de plus, au sol.",
            "Une extension se décide avec le plan et l'accès du chantier. On chiffre le gros œuvre complet ; la menuiserie et la cuisine ne sont comprises que si c'est écrit.",
            ["Fondations et dalle", "Élévation des murs", "Chaînages et linteaux", "Coordination avec les autres corps d'état"],
            "vitrine/photos/macon/extension-elevation.jpg",
            prix="dès 1 100 € HT / m²", duree="4 à 8 semaines",
            suite="Au-delà de 20 m² en zone urbaine, un permis de construire est nécessaire. On vous indique les pièces à fournir et l'architecte si la surface l'exige.",
        ),
        _offre(
            "exterieur", "Extérieur", "Terrasse, muret, escalier.",
            "La terrasse et les murets se font quand l'accès permet d'amener les matériaux. On prévient des jours de séchage et de la date où l'on peut marcher dessus.",
            ["Terrasse maçonnée", "Muret et clôture", "Escalier extérieur", "Évacuation des gravats"],
            "vitrine/photos/macon/exterieur-terrasse.jpg",
            prix="dès 120 € HT / m²", duree="3 à 6 jours",
            suite="Une dalle de terrasse se marche après 48 heures et se charge après 28 jours. Le planning en tient compte.",
        ),
    ],
    realisations=[
        _chantier("maison-elevation.jpg", "Maison R+1, élévation des murs", "Gros œuvre", "gros-oeuvre", "Maison à étage en cours de construction, murs en briques montés", "Fontenay-sous-Bois · 9 semaines"),
        _chantier("dalle.jpg", "Coulage d'une dalle de 60 m²", "Gros œuvre", "gros-oeuvre", "Deux maçons tirent le béton d'une dalle armée", "Vincennes · 3 jours"),
        _chantier("mur-pierre.jpg", "Mur en pierre rejointoyé", "Rénovation", "renovation", "Mur de pierres sèches rejointoyé à la chaux", "Paris 20e · 6 jours"),
        _chantier("escalier-pierre.jpg", "Escalier et murs de terrasse", "Extérieur", "exterieur", "Terrasse entourée de murs en pierre avec un escalier", "Saint-Maur · 2 semaines"),
        _chantier("mur-brique.jpg", "Cloison porteuse en brique", "Gros œuvre", "gros-oeuvre", "Maçon posant une brique au mortier à la truelle", "Paris 11e · 4 jours"),
        _chantier("allee-pierre.jpg", "Allée et murets de jardin", "Extérieur", "exterieur", "Allée en pierre bordée de murets et de pots de fleurs", "Sceaux · 8 jours"),
        _chantier("pierre-taille.jpg", "Façade en pierre de taille", "Rénovation", "renovation", "Parement en pierre de taille restauré", "Paris 6e · 3 semaines"),
        _chantier("maison-livree.jpg", "Extension de plain-pied livrée", "Extension", "extension", "Maison de plain-pied en briques avec panneaux solaires", "Montreuil · 7 semaines"),
    ],
    avis=[
        _ns(texte="Le devis faisait deux pages, chaque poste expliqué. Le chantier a duré exactement ce qui était prévu, et la cuisine est restée utilisable.", auteur="Nadia et Paul L.", detail="Ouverture de mur porteur", date="Septembre 2026"),
        _ns(texte="Julien a refusé de couler la dalle un jour de pluie annoncée. On a perdu deux jours, mais c'était la bonne décision. Travail soigné.", auteur="Marc D.", detail="Dalle de terrasse", date="Juin 2026"),
        _ns(texte="Un point par écrit chaque vendredi, avec photos. Pour nous qui vivions à 300 km, c'était précieux.", auteur="Hélène G.", detail="Rénovation de façade", date="Avril 2026"),
    ],
    avis_note="Avis fictifs, rédigés pour la démonstration.",
    faq=[
        _ns(question="La visite est-elle payante ?", reponse="Non. La visite et le devis sont gratuits, sans engagement. Comptez trente minutes à une heure sur place."),
        _ns(question="Faut-il une autorisation pour ouvrir un mur porteur ?", reponse="En maison individuelle, non, mais un calcul de structure est indispensable. En copropriété, l'accord de l'assemblée générale est obligatoire avant les travaux."),
        _ns(question="Quel taux de TVA s'applique ?", reponse="10 % pour des travaux dans un logement de plus de deux ans, 20 % pour du neuf ou un local professionnel. Le devis indique le taux retenu."),
        _ns(question="Pouvez-vous gérer les autres corps de métier ?", reponse="Nous coordonnons volontiers l'électricien, le plombier ou le menuisier avec qui nous travaillons. Leurs devis restent séparés et à votre nom."),
        _ns(question="Que se passe-t-il si un imprévu apparaît ?", reponse="On s'arrête, on vous montre, et on chiffre l'avenant par écrit. Rien n'est facturé sans votre accord signé."),
    ],
    barre_mobile=True,
    etapes=[
        _etape("01", "La visite", "On passe voir le lieu, on mesure, on regarde ce qui porte. Sans visite, pas de prix ferme."),
        _etape("02", "Le devis détaillé", "Sous 72 heures : les postes, les quantités, le délai et ce qui n'est pas inclus. Vous signez avant que le chantier démarre."),
        _etape("03", "Le chantier", "Un responsable, un planning annoncé, un point écrit chaque vendredi, et un avenant signé si un imprévu change le prix."),
        _etape("04", "La réception", "On fait le tour ensemble. Les réserves sont notées et levées avant le solde."),
    ],
)
