"""Bertrand Maçonnerie — entreprise de maçonnerie fictive."""
from ._base import _etape, _groupe, _jour, _ligne, _ns, _offre, _realisation, _site


def _chantier(image, titre, filtre, offre, alt, detail):
    return _realisation(image, titre, filtre, offre, alt, detail=detail, key="macon")


def _etape_delai(numero, titre, texte, delai=""):
    """Une étape du déroulé. `delai` : la cote affichée entre cette étape et la suivante."""
    etape = _etape(numero, titre, texte)
    etape.delai = delai
    return etape


def _jour_chantier(jour, titre, texte, image=""):
    """Une entrée du carnet de chantier. `image` : chemin statique facultatif."""
    return _ns(jour=jour, titre=titre, texte=texte, image=image)


MACON = _site(
    key="macon",
    nom="Bertrand Maçonnerie",
    # Logo : la marque (un parpaing vu de dessus, deux alvéoles), le nom, le métier en petites capitales.
    logo=_ns(nom="Bertrand", metier="Maçonnerie"),
    ville="Paris",
    eyebrow="Maçonnerie générale à Paris et en petite couronne",
    role_line="Julien Bertrand, artisan maçon",
    footer_line="Julien Bertrand, artisan maçon — SIRET fictif",
    nature="une entreprise de maçonnerie fictive",
    adresse="31 rue Saint-Maur",
    code_postal="75011",
    telephone="01 99 00 45 45",
    telephone_lien="0199004545",
    email="contact@bertrand-maconnerie.example",
    horaires="Lundi au vendredi, 7h30–17h30. Devis sur rendez-vous.",
    titre="Bertrand Maçonnerie — Maçon à Paris",
    description="Entreprise de maçonnerie fictive à Paris. Gros œuvre, rénovation, extension, extérieurs. Devis détaillé après visite. Démonstration de site vitrine.",
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
        _ns(label="Téléphone", value="01 99 00 45 45", href="tel:0199004545"),
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
        liens=[_ns(label="01 99 00 45 45", href="tel:0199004545")],
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
        steps_intro="Quatre étapes, et ce qui les sépare : le délai annoncé est celui qui est tenu.",
        about_legende="Une cloison porteuse en brique, montée au mortier de chaux. Paris 11e.",
        hero_primary="Le savoir-faire",
        hero_secondary="Demander un devis",
        more="En savoir plus",
        contact_title="Décrire votre chantier",
        contact_text="Quelques lignes suffisent : le lieu, le type de travaux, et quand vous voulez commencer. Julien vous rappelle pour fixer une visite.",
        message_placeholder="Le lieu, les travaux, et la période souhaitée. Une photo peut suivre par email.",
        cta_title="Un mur, une ouverture, une dalle ?",
        cta_text="Décrivez le chantier. On vous dit si on peut passer voir, et quand.",
        cta_button="Demander un devis",
        cta_cote="72 h entre la visite et le devis",
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
        realisations_note="Un chantier ressemble au vôtre ? Dites-le à la visite : on part de ce qui a été fait pour chiffrer le vôtre.",
        avis_kicker="Clients",
        avis_title="Ils ont fait construire",
        faq_kicker="Avant de commencer",
        faq_title="Les questions qu'on nous pose",
        horaires_title="Bureau et visites",
        signature_kicker="Carnet de chantier",
        signature_title="Un chantier, jour par jour",
        signature_intro="Le carnet d'un chantier récent, tel que le client l'a reçu chaque soir. Ce que l'on a fait, ce qui reste, et rien de caché.",
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
    carnet=_ns(
        chantier="Ouverture d'un mur porteur de 3 m, entre cuisine et séjour",
        lieu="Maison individuelle, Montreuil",
        duree="5 jours ouvrés, comme annoncé au devis",
        responsable="Julien Bertrand",
        entrees=[
            _jour_chantier("Lundi", "Protection et étaiement",
                           "Sols protégés, bâches tendues entre la cuisine et le séjour. Les étais sont posés de part et d'autre du mur avant toute découpe."),
            _jour_chantier("Mardi", "Ouverture du mur",
                           "Sciage du parpaing sur 3,00 × 2,15 m. La poussière reste derrière les bâches : la cuisine reste utilisable le soir."),
            _jour_chantier("Mercredi", "Pose du linteau",
                           "Deux poutres métalliques calées au mortier sans retrait, dimensionnées par le bureau d'études. Note de calcul remise au client.",
                           "vitrine/photos/macon/realisations/mur-brique.jpg"),
            _jour_chantier("Jeudi", "Reprises des tableaux",
                           "Jambages et dessous de l'ouverture repris à l'enduit. Les étais restent en place pendant la prise."),
            _jour_chantier("Vendredi", "Dépose des étais et réception",
                           "Étais et gravats évacués. Tour du chantier avec les clients, aucune réserve. Le point écrit de la semaine part le soir même.",
                           "vitrine/photos/macon/renovation-enduit.jpg"),
        ],
        # Notes en marge : `jour` = le numéro de l'entrée qu'elles commentent (trait de rappel).
        notes=[
            _ns(jour=1, titre="Un seul interlocuteur", texte="Le responsable du chantier signe chaque entrée du carnet. Vous savez qui appeler."),
            _ns(jour=3, titre="Les imprévus notés tout de suite", texte="Si quelque chose change le planning ou le prix, vous le lisez le jour même, avant que l'on continue."),
            _ns(jour=5, titre="Un point écrit chaque soir", texte="Ce qui a été fait, avec une photo, et ce qui est prévu le lendemain."),
        ],
        # Le tampon posé sur le carnet une fois le dernier jour lu.
        reception=_ns(titre="Réception sans réserve", detail="Vendredi, 17 h · J. Bertrand"),
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
    offres=[
        _offre(
            "gros-oeuvre", "Gros œuvre", "Murs porteurs, dalles, ouvertures.",
            "On reprend un mur porteur, on coule une dalle, on ouvre une baie. L'étaiement, le linteau et les reprises sont dans le devis, avec la note de calcul du bureau d'études.",
            ["Ouverture de mur porteur", "Dalle et fondations", "Murs en parpaing ou en brique", "Linteaux et chaînages"],
            "vitrine/photos/macon/realisations/maison-elevation.jpg",
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
        _chantier("escalier-pierre.jpg", "Escalier et murs de terrasse", "Extérieur", "exterieur", "Terrasse entourée de murs en pierre avec un escalier", "Saint-Maur, 2 semaines"),
        _chantier("maison-elevation.jpg", "Maison R+1, élévation des murs", "Gros œuvre", "gros-oeuvre", "Maison à étage en cours de construction, murs en briques montés", "Fontenay-sous-Bois, 9 semaines"),
        _chantier("dalle.jpg", "Coulage d'une dalle de 60 m²", "Gros œuvre", "gros-oeuvre", "Deux maçons tirent le béton d'une dalle armée", "Vincennes, 3 jours"),
        _chantier("mur-pierre.jpg", "Mur en pierre rejointoyé", "Rénovation", "renovation", "Mur de pierres sèches rejointoyé à la chaux", "Paris 20e, 6 jours"),
        _chantier("mur-brique.jpg", "Cloison porteuse en brique", "Gros œuvre", "gros-oeuvre", "Maçon posant une brique au mortier à la truelle", "Paris 11e, 4 jours"),
        _chantier("allee-pierre.jpg", "Allée et murets de jardin", "Extérieur", "exterieur", "Allée en pierre bordée de murets et de pots de fleurs", "Sceaux, 8 jours"),
        _chantier("pierre-taille.jpg", "Façade en pierre de taille", "Rénovation", "renovation", "Parement en pierre de taille restauré", "Paris 6e, 3 semaines"),
        _chantier("maison-livree.jpg", "Extension de plain-pied livrée", "Extension", "extension", "Maison de plain-pied en briques avec panneaux solaires", "Montreuil, 7 semaines"),
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
        _etape_delai("01", "La visite", "On passe voir le lieu, on mesure, on regarde ce qui porte. Sans visite, pas de prix ferme.", "72 h"),
        _etape_delai("02", "Le devis détaillé", "Les postes, les quantités, le délai et ce qui n'est pas inclus. Vous signez avant que le chantier démarre.", "date fixée ensemble"),
        _etape_delai("03", "Le chantier", "Un responsable, un planning annoncé, un point écrit chaque vendredi, et un avenant signé si un imprévu change le prix.", "durée du devis"),
        _etape_delai("04", "La réception", "On fait le tour ensemble. Les réserves sont notées et levées avant le solde."),
    ],
    # L'équipe (bloc « L'entreprise ») et la légende de sa photo
    equipe=[
        _ns(initiales="JB", nom="Julien Bertrand", role="Gérant, responsable de chantier"),
        _ns(initiales="KM", nom="Karim M.", role="Compagnon maçon"),
        _ns(initiales="TL", nom="Thomas L.", role="Compagnon maçon"),
    ],
)
