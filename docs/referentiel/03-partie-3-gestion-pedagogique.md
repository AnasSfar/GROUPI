# PARTIE III - GESTION PEDAGOGIQUE (Chapitres 10 a 14 : Groupes, Preinscriptions, Inscriptions, Seances, Gestion des presences)

PARTIE III — GESTION PÉDAGOGIQUE

## CHAPITRE 10 — LES GROUPES
10.1 Objet
Un Groupe représente une organisation pédagogique durable créée par un Professeur afin d’accueillir un ensemble d’élèves partageant une même matière, un même niveau scolaire et des modalités d’enseignement communes.

10.2Principes
Le groupe constitue l’unité pédagogique principale de GROUPI.Il représente un ensemble d’élèves qui suivent régulièrement un même enseignement avec un même Professeur.
Un groupe est obligatoirement associé à :
Un Professeur ;
Une matière ;
Un niveau scolaire.
Chaque groupe possède sa propre organisation, son planning, ses règles de fonctionnement et son historique.La combinaison Matière / Niveau est systématiquement vérifiée grâce au référentiel SubjectLevel.Toute combinaison interdite entraîne le refus de création du groupe.

10.3 Paramètres du groupe
Lors de la création d’un groupe, le Professeur définit notamment :
Le nom du groupe ;
La matière enseignée ;
Le niveau scolaire ;
L’année académique ;
La capacité maximale ;
Le tarif public ;
Le ou les lieux d’enseignement ;
Le mode d’enseignement par défaut (présentiel ou en ligne) ;
Les règles de facturation des absences ;
Le seuil d’abandon (3 absences consécutives par défaut) ;
La visibilité du groupe lorsqu’il est complet ;
Activation de la liste d’attente (Version 2);
La date de début du groupe ;
La date de fin (facultative) ;
Activation des préinscriptions pour l’année académique suivante.Les règles de transformation des préinscriptions sont définies dans le chapitre consacré aux Préinscriptions.

10.4 Planning du groupe
Chaque groupe possède un planning hebdomadaire.Le Professeur définit un ou plusieurs créneaux récurrents.Pour chaque créneau, GROUPI enregistre :
Le jour de la semaine ;
L’heure de début ;
La durée prévue ;
Le mode d’enseignement (présentiel ou en ligne) ;
Le lieu d’enseignement.
Exemple
Mathématiques — Bac Sciences
Lundi : 18h00 → 20h00
Jeudi : 18h00 → 20h00
Le planning constitue le modèle hebdomadaire du groupe.À partir de ce modèle, GROUPI génère automatiquement les séances futures.Les séances déjà réalisées ne sont jamais modifiées automatiquement.
Le Professeur peut ensuite :
Ajouter une séance exceptionnelle ;
Déplacer une séance future ;
Supprimer une séance future.
Ces modifications n’altèrent pas le planning hebdomadaire du groupe.Le Professeur peut interrompre temporairement la génération automatique des séances, notamment pendant :
Les vacances scolaires ; 
Les jours fériés ; 
Une période d’absence.
La génération automatique reprend ensuite normalement.Cela évite de supprimer 10 séances une par une.En cas d’interruption temporaire des cours (vacances scolaires, congés du Professeur ou toute autre période sans enseignement), le Professeur peut choisir de ne pas générer les séances correspondantes ou de supprimer les séances futures déjà créées. Cette opération n’a aucune incidence sur l’existence ni sur les paramètres du groupe.
GROUPI détecte les conflits de planning pour un même Professeur et génère une alerte. Le conflit n’est pas bloquant en Version 1 mais est signalé en alerte critique à l’utilisateur.
10.5 Informations visibles par les Parents
Avant toute demande d’inscription, le Parent peut consulter les informations publiques du groupe.
Notamment :
Le nom du Professeur ;
La matière ;
Le niveau scolaire ;
Le planning hebdomadaire ;
Le ou les lieux d’enseignement. Chaque séance est toujours rattachée à un seul lieu d’enseignement ;
Le mode d’enseignement habituel ;
Le tarif public ;
La disponibilité de place ;
La capacité maximale ;
Les règles de facturation des absences.
Le Parent dispose ainsi de toutes les informations nécessaires avant d’effectuer une demande d’inscription.

10.6 Visibilité des groupes complets
Le Professeur choisit le comportement du groupe lorsque la capacité maximale est atteinte.
Deux possibilités existent.
Groupe visible
Le groupe reste affiché dans les résultats de recherche.
Les Parents voient notamment :
Complet — 20 / 20 élèves
Ils peuvent consulter les informations du groupe mais ne peuvent pas envoyer de demande d’inscription.
La fonctionnalité de liste d’attente sera disponible à partir de la Version 2.
Groupe masqué
Lorsque la capacité maximale est atteinte, le groupe disparaît automatiquement des résultats de recherche.
Il redevient visible dès qu’une place se libère.

10.7 Tarif de référence GROUPI
Pour chaque combinaison Matière / Niveau, GROUPI calcule automatiquement un tarif de référence.Ce tarif est obtenu à partir des tarifs publics pratiqués par les groupes actifs de la plateforme.Lorsque cela est possible, le calcul est réalisé à l’échelle de la ville ou de la région du Professeur.
À défaut, GROUPI utilise les données disponibles au niveau national.Le tarif de référence constitue uniquement une aide à la décision.Le tarif de référence est recalculé périodiquement à partir des groupes actifs de la plateforme.Ce tarif n’est jamais utilisé automatiquement pour la facturation. Le Professeur ne peut pas le modifier.
Exemple :
Matière
Niveau
Tarif de référence
Mathématiques
Bac Sciences
26 TND
Physique
Bac Sciences
30 TND

Le tarif de référence est affiché à titre indicatif pour le professeur au moment de la création du groupe.

10.8 Tarif public du groupe
Chaque groupe possède un tarif public.Ce tarif est librement défini par le Professeur.
GROUPI affiche également un tarif de référence calculé automatiquement afin d’aider le Professeur à fixer son prix.Le tarif public est visible par tous les Parents avant l’inscription.
Exemple :
Mathématiques — Bac Sciences
Tarif public : 25 TND par séance
Ce tarif est appliqué par défaut lors de toute nouvelle inscription.Il pourra ensuite être personnalisé individuellement pour chaque élève.
Toute modification du tarif public ne s’applique qu’aux nouvelles inscriptions.Les tarifs personnalisés existants restent inchangés.

10.9 Tarification personnalisée
Après validation d’une inscription, le Professeur peut appliquer un tarif spécifique à cet élève.Ce tarif personnalisé remplace le tarif public uniquement pour l’inscription concernée.




Exemple :
Élève
Tarif appliqué
Ahmed
18 TND
Mariem
22 TND
Youssef
Gratuit
Le Parent ne visualise que le tarif appliqué à son propre enfant.Les autres Parents continuent de voir uniquement le tarif public du groupe.Le tarif personnalisé peut être modifié ultérieurement tant que l’inscription reste active.

10.10 Duplication d’un groupe
Afin de faciliter la préparation d’une nouvelle année académique ou la création de groupes similaires, le Professeur peut dupliquer un groupe existant.
La duplication peut notamment conserver :
La matière ;
Le niveau scolaire ;
Le planning hebdomadaire ;
Les lieux d’enseignement ;
Les règles de facturation ;
Le seuil d’abandon ;
Le mode d’enseignement ;
Les paramètres de visibilité.
La duplication ne conserve jamais :
Les élèves 
Les présences 
Les paiements 
Les commentaires 
Les séances réalisées
Le nouveau groupe constitue une entité totalement indépendante.Le Professeur peut ensuite modifier librement les informations du groupe créé.
Le groupe dupliqué est créé avec le statut BROUILLON.


10.11 Modification d’un groupe
Après la première inscription :
Le professeur peut modifier :
Planning 
Lieu 
Tarif 
Capacité 
Visibilité 
Il ne peut plus modifier :
Matière 
Niveau 
Année académique 
Ces informations deviennent non modifiables afin de garantir la cohérence de l’historique pédagogique et comptable du groupe.

10.12 Cycle de vie d’un groupe
Un groupe évolue au cours de son existence.Il peut notamment être :
Brouillon ;
Créé ;
Ouvert aux inscriptions ;
Complet ;
Clôturé ;
Archivé.
La clôture ou l’archivage d’un groupe n’entraîne jamais la suppression de son historique pédagogique ou comptable.
Toutes les données restent consultables selon les règles d’autorisation définies par GROUPI.
Statut
Description
BROUILLON
Groupe en cours de création, non visible
OUVERT
Groupe visible, accepte les inscriptions
COMPLET
Capacité atteinte (visible ou masqué selon paramètre)
CLOTURE
Groupe terminé, plus d’inscriptions
ARCHIVE
Groupe archivé, historique conservé

État actuel
État suivant autorisé
BROUILLON
OUVERT
OUVERT
COMPLET
COMPLET
OUVERT
OUVERT
CLOTURE
COMPLET
CLOTURE
CLOTURE
ARCHIVE

Un groupe BROUILLON n’est visible que par son Professeur. Il ne peut pas recevoir d’inscription tant qu’il n’a pas été ouvert.

10.13Suppression d’un groupe
Le groupe ne peut jamais être supprimé physiquement dès lors qu’il possède une séance, une inscription ou un historique pédagogiqueou un historique comptable.
Lorsqu’aucun historique n’existe encore, le groupe peut être supprimé définitivement.

10.14 Indicateurs métier
Taux d’occupation du groupe
Nombre d’élèves inscrits
Nombre de places disponibles
Nombre de séances planifiées

10.15 Objets métier concernés
Group 
GroupSchedule 
GroupVisibility
TeachingLocation 
Subject 
SchoolLevel 
AcademicYear 
TeacherProfile


10.16Cas d’erreur
Code
Situation
Résultat attendu
ERR-GRP-001
Matière interdite pour ce niveau
Création refusée
ERR-GRP-002
Professeur non validé
Création impossible
ERR-GRP-003
Abonnement expiré
Création impossible
ERR-GRP-004
Nom déjà utilisé par le même professeur
Création refusée
ERR-GRP-005
Lieu d’enseignement inexistant
Sélection impossible
ERR-GRP-006
Capacité invalide (inférieure à 1)
Création refusée
ERR-GRP-007
Planning vide
Création refusée
ERR-GRP-008
Année académique fermée
Création impossible
ERR-GRP-009
Modification interdite après inscription
Opération refusée
ERR-GRP-010
Groupe archivé
Modification impossible
ERR-GRP-011
Duplication d’un groupe archivé
Opération refusée
ERR-GRP-012
Groupe complet
Nouvelles inscriptions refusées
ERR-GRP-013
Capacité du groupe > capacité d’abonnement
Création refusée
ERR-GRP-014
Conflit de planning avec un autre groupe du même Professeur
Avertissement
ERR-GRP-015
Tentative d’ajout d’un élève à un groupe complet (masqué)
Demande impossible
ERR-GRP-016
Suppression d’un créneau de planning avec des séances futures
Avertissement avant suppression
ERR-GRP-017
Modification de planning affectant des séances déjà planifiées
Option de conserver ou recréer les séances
ERR-GRP-018
Tentative de création d’un groupe par un Professeur suspendu
Création refusée
ERR-GRP-019
Groupe clôturé
Nouvelle inscription impossible.
ERR-GRP-020
Tentative de suppression d’un groupe possédant un historique
Suppression refusée.
ERR-GRP-021
Date de fin antérieure à la date de début
Création refusée

10.17Notifications
Code
Notification
Destinataire
Priorité
NOT-GRP-001
Groupe créé
Professeur
Information
NOT-GRP-002
Planning modifié
Professeur, Parents
Important
NOT-GRP-003
Lieu modifié
Professeur, Parents
Important
NOT-GRP-004
Capacité du groupe atteinte (100%)
Professeur
Important
NOT-GRP-005
Groupe clôturé
Professeur, Parents
Important
NOT-GRP-006
Place libérée dans un groupe complet
Parents en liste d’attente (Version 2)
Important
NOT-GRP-007
Capacité du groupe bientôt atteinte (80%)
Professeur
Information
NOT-GRP-008
Nouveau groupe dans votre matière/niveau
Parents (recherche)
Information
NOT-GRP-009
Planning modifié - conflit détecté
Professeur
Important

10.18Evènements métier
Code
Événement
Description
EVT-GRP-001
Groupe créé
Le Professeur crée un nouveau groupe.
EVT-GRP-002
Groupe ouvert
Le groupe passe du statut **BROUILLON** au statut **OUVERT** et devient visible selon ses paramètres.
EVT-GRP-003
Groupe modifié
Les paramètres du groupe sont modifiés.
EVT-GRP-004
Planning modifié
Le planning hebdomadaire du groupe est modifié.
EVT-GRP-005
Lieu modifié
Le lieu d’enseignement du groupe est modifié.
EVT-GRP-006
Tarif modifié
Le tarif public du groupe est modifié.
EVT-GRP-007
Groupe complet
Le groupe atteint sa capacité maximale.
EVT-GRP-008
Place libérée
Une place se libère dans un groupe complet.
EVT-GRP-009
Groupe clôturé
Le groupe est clôturé (fin d’année académique ou décision du Professeur).
EVT-GRP-010
Groupe archivé
Le groupe est archivé ; son historique reste consultable conformément aux règles d’autorisation.
EVT-GRP-011
Groupe complet masqué
Le groupe devient invisible dans les résultats de recherche car il est complet et configuré comme masqué.
EVT-GRP-012
Capacité d’abonnement atteinte
Le Professeur atteint la capacité maximale autorisée par son abonnement.
EVT-GRP-013
Conflit de planning détecté
Un conflit est détecté entre deux plannings d’un même Professeur ou d’un même élève.
EVT-GRP-014
Groupe dupliqué
Un nouveau groupe est créé par duplication d’un groupe existant avec un nouvel identifiant et le statut **BROUILLON**.
EVT-GRP-015
Groupe supprimé définitivement
Un groupe ne possédant ni séance, ni inscription, ni historique pédagogique ou comptable est supprimé définitivement.

10.19Règles métier
Code
Règle
RM-GRP-001
Un groupe est obligatoirement associé à un seul Professeur.
RM-GRP-002
Un groupe est obligatoirement associé à une seule matière.
RM-GRP-003
Un groupe est obligatoirement associé à un seul niveau scolaire.
RM-GRP-004
Un groupe est obligatoirement associé à une année académique.
RM-GRP-005
La combinaison Matière/Niveau est systématiquement vérifiée grâce au référentiel SubjectLevel.
RM-GRP-006
Toute combinaison interdite entraîne le refus de création du groupe.
RM-GRP-007
Le planning du groupe est défini par un ou plusieurs créneaux récurrents (jour, heure, durée, mode, lieu).
RM-GRP-008
Les séances sont générées automatiquement à partir du planning hebdomadaire du groupe.
RM-GRP-009
Le Professeur peut interrompre temporairement la génération automatique des séances (vacances scolaires, jours fériés ou période d’absence) sans modifier le planning hebdomadaire du groupe.
RM-GRP-010
Chaque séance est toujours rattachée à un seul lieu d’enseignement.
RM-GRP-011
Le Professeur définit librement le tarif public de son groupe.
RM-GRP-012
La capacité maximale du groupe est définie par le Professeur lors de la création.
RM-GRP-013
Lorsque la capacité maximale est atteinte, le comportement du groupe dépend du choix de visibilité du Professeur.
RM-GRP-014
Un groupe complet ne peut plus accepter de nouvelles inscriptions.
RM-GRP-015
Un groupe peut être dupliqué par le Professeur. La duplication ne conserve jamais les élèves, les présences, les paiements, les commentaires ou les séances réalisées.
RM-GRP-016
Après la première inscription, le Professeur ne peut plus modifier la matière, le niveau ou l’année académique du groupe.
RM-GRP-017
Un groupe clôturé ou archivé conserve son historique pédagogique et comptable.
RM-GRP-018
La capacité maximale du groupe est limitée par la capacité de l’abonnement actif du Professeur.
RM-GRP-019
L’acceptation d’une inscription est conditionnée par la capacité disponible du groupe ET de l’abonnement.
RM-GRP-020
Un groupe peut être créé sans élève et maintenu actif par le Professeur.
RM-GRP-021
GROUPI détecte les conflits de planning entre groupes d’un même Professeur et génère une alerte non bloquante en Version 1.
RM-GRP-022
La modification du tarif public d’un groupe ne s’applique qu’aux nouvelles inscriptions.
RM-GRP-023
La suppression d’un créneau de planning entraîne la suppression des séances futures non réalisées associées (avec confirmation).
RM-GRP-024
Un Professeur ne peut pas créer deux groupes actifs ayant simultanément la même matière, le même niveau scolaire, la même année académique et le même planning hebdomadaire.
RM-GRP-025
La capacité maximale d’un groupe ne peut jamais être inférieure au nombre d’élèves actuellement inscrits.
RM-GRP-026
Le tarif public du groupe doit être supérieur ou égal à zéro.
RM-GRP-027
La duplication d’un groupe crée systématiquement un nouveau groupe indépendant disposant d’un nouvel identifiant.
RM-GRP-028
Toute modification du planning hebdomadaire n’affecte que les séances futures générées après cette modification.
RM-GRP-029
Une séance exceptionnelle ne modifie jamais le planning hebdomadaire du groupe.
RM-GRP-030
L’interruption temporaire de la génération des séances n’entraîne ni la suppression du groupe ni la modification de ses paramètres.
RM-GRP-031
Un groupe peut être associé à plusieurs lieux d’enseignement, mais chaque séance est obligatoirement rattachée à un seul lieu.
RM-GRP-032
La visibilité d’un groupe dans les recherches dépend exclusivement des paramètres définis par le Professeur.
RM-GRP-033
Seul un Professeur dont le compte est ACTIVE peut créer un groupe.
RM-GRP-034
Seul un Professeur propriétaire du groupe peut modifier celui-ci.
RM-GRP-035
Le groupe appartient toujours à un unique Professeur.
RM-GRP-036
Les séances déjà réalisées ne sont jamais modifiées automatiquement.
RM-GRP-037
Le groupe dupliqué est créé avec un nouvel identifiant et un statut BROUILLON.
RM-GRP-038
Un groupe ARCHIVE ne peut jamais redevenir OUVERT.
RM-GRP-039
Toute modification importante du groupe est historisée.
RM-GRP-040
La suppression physique d’un groupe possédant un historique pédagogique ou comptable est interdite.
RM-GRP-041
La date de fin d’un groupe, lorsqu’elle est renseignée, doit être postérieure à sa date de début.
RM-GRP-042
Un groupe ne peut être ouvert que s’il possède au moins un créneau de planning actif et valide.
RM-GRP-043
Lorsqu’une place se libère dans un groupe COMPLET, celui-ci repasse automatiquement à l’état OUVERT, sauf s’il a été préalablement clôturé.
RM-GRP-044
Un groupe BROUILLON n’est visible que par son Professeur et ne peut recevoir aucune demande d’inscription tant qu’il n’a pas été ouvert.
RM-GRP-045
Un groupe clôturé ne peut plus être rouvert ni accepter de nouvelles inscriptions.


## CHAPITRE 11 — LES PRÉINSCRIPTIONS
11.1 Objet
Ce chapitre définit les règles de gestion des préinscriptions. Il précise notamment les principes de fonctionnement, les périodes d’ouverture, le processus de transformation en demande d’inscription et les règles de priorité.

11.2Principes
La préinscription permet à un Parent de signaler son intérêt pour inscrire son enfant auprès d’un Professeur pour une future année académique.Elle facilite l’organisation de la prochaine rentrée scolaire sans créer immédiatement une inscription.
Une préinscription n’engage ni le Parent, ni le Professeur. Elle constitue uniquement une manifestation d’intérêt permettant d’anticiper la préparation de la prochaine année académique.
Une préinscription n’empêche jamais le Parent d’effectuer une demande d’inscription classique sur un autre groupe ou auprès d’un autre Professeur. Un même élève peut ainsi disposer simultanément de plusieurs préinscriptions pour une même année académique.

11.3 Période
Les préinscriptions concernent exclusivement une année académique future.Le Professeur choisit librement la date d’ouverture des préinscriptions pour chacune des années académiques qu’il prépare.GROUPI peut lui proposer automatiquement, à partir d’une période recommandée (par exemple au mois de mai), d’activer les préinscriptions pour l’année académique suivante.
Le Professeur reste libre :
D’ouvrir les préinscriptions plus tôt ; 
De les ouvrir plus tard ; 
Ou de ne pas les ouvrir.
Exemple :
Pendant l’année académique 2026-2027, un Professeur peut ouvrir les préinscriptions pour 2027-2028 à partir du 15 mars 2027.
Les Parents peuvent alors enregistrer leur intérêt jusqu’à la fermeture des préinscriptions décidée par le Professeur.

11.4 Informations demandées
Le Parent sélectionne :
Le Professeur ; 
L’enfant concerné ; 
Le niveau scolaire prévu pour l’année suivante ; 
Éventuellement la matière concernée. 
Le niveau scolaire indiqué dans la préinscription doit être cohérent avec la progression naturelle de l’élève (passage à la classe scolaire supérieure). Une incohérence significative génère une alerte au Professeur.
Une préinscription est alors créée.

11.5 Tableau de bord du Professeur
Le Professeur dispose d’un espace « Préinscriptions ».
Il peut consulter notamment :
Le nombre de demandes ; 
Les niveaux concernés ; 
Les matières demandées ; 
Les coordonnées des Parents. 
Ces informations lui permettent d’anticiper la constitution de ses groupes pour la prochaine rentrée.

11.6 Création des groupes
Lorsque le Professeur prépare sa nouvelle année académique, il peut consulter les préinscriptions.
Les préinscriptions servent uniquement d’aide à l’organisation.
Elles ne créent jamais automatiquement un groupe ni une inscription.

11.7 Transformation des préinscriptions
Lorsque le Professeur prépare une nouvelle année académique, il crée les groupes correspondant aux niveaux et aux matières qu’il souhaite enseigner.À la création d’un groupe, GROUPI recherche automatiquement les préinscriptions compatibles.
Une préinscription est considérée comme compatible lorsque :
Elle concerne la même année académique ; 
Elle correspond à la matière du groupe ; 
Elle correspond au niveau scolaire demandé. 
Les préinscriptions compatibles sont alors proposées au Professeur.
La transformation d’une préinscription en demande d’inscription est conditionnée par la capacité disponible du groupe ET par la capacité disponible de l’abonnement du Professeur
11.8 Proposition aux parents
Après la création du groupe, GROUPI informe automatiquement les Parents concernés.
La notification précise notamment :
Le nom du Professeur ; 
La matière ; 
Le niveau scolaire ; 
Les horaires ; 
Le lieu des séances ; 
Le tarif public du groupe ; 
Le nombre de places encore disponibles ; 
La date limite de réponse. 
Cette notification constitue une invitation à confirmer la préinscription.
Elle ne crée pas automatiquement une inscription.

11.9 Confirmation par le parent
Le Parent peut :
Confirmer son intérêt ; 
Refuser la proposition ; 
Ne pas répondre. 
En cas de confirmation, GROUPI transforme automatiquement la préinscription en demande d’inscription.
Cette demande suit ensuite le processus normal décrit au chapitre « Les inscriptions ».Le Professeur reste libre d’accepter ou de refuser la demande.
Une fois la demande d’inscription créée, la préinscription est automatiquement clôturée et ne peut plus être réutilisée.

11.10 Expiration
Chaque proposition possède une date limite de réponse.
À l’expiration de ce délai :
Les places non confirmées redeviennent disponibles ; 
La préinscription passe à l’état Expirée. 
Le Parent peut toutefois effectuer une nouvelle préinscription si des groupes restent disponibles.

11.11 Priorité
Lorsqu’un groupe dispose d’un nombre limité de places, GROUPI traite les confirmations selon l’ordre chronologique des confirmations des préinscriptions.
Les premiers Parents ayant confirmé disposent de la priorité.
Une fois la capacité maximale atteinte, les confirmations suivantes ne peuvent plus être transformées automatiquement en demandes d’inscription.
Le Parent est immédiatement informé que le groupe est complet.

11.12 Historique
Toutes les étapes sont historisées :
Création de la préinscription ; 
Proposition envoyée ; 
Confirmation ou refus du Parent ; 
Transformation en demande d’inscription ; 
Expiration éventuelle. 
Cet historique garantit la traçabilité complète du processus de préparation de la rentrée scolaire.

11.13Indicateurs métier
Nombre de préinscriptions 
Taux de transformation des préinscriptions 
Taux de confirmation 
Taux d’expiration 
Nombre moyen de préinscriptions par groupe créé

11.14Cycle de vie

État actuel
État suivant autorisé
OUVERTE
PROPOSEE
OUVERTE
ANNULEE
OUVERTE
EXPIREE
PROPOSEE
CONFIRMEE
PROPOSEE
REFUSEE
PROPOSEE
EXPIREE
CONFIRMEE
TRANSFORMEE
CONFIRMEE
ANNULEE
TRANSFORMEE
—
EXPIREE
—
ANNULEE
—
CLOTUREE
—
REFUSEE
—

11.15Etats des préinscriptions
Code
État
Description
PRE-STAT-001
OUVERTE
Préinscription active, en attente de proposition
PRE-STAT-002
PROPOSEE
Une proposition a été envoyée au Parent
PRE-STAT-003
CONFIRMEE
Le Parent a confirmé son intérêt
PRE-STAT-004
TRANSFORMEE
La préinscription a été transformée en demande d’inscription
PRE-STAT-005
EXPIREE
La proposition ou la préinscription est arrivée à expiration
PRE-STAT-006
CLOTUREE
La préinscription est clôturée sans transformation
PRE-STAT-007
ANNULEE
Préinscription annulée par le Parent avant toute transformation
PRE-STAT-008
REFUSEE
Le Parent a refusé la proposition

11.16Objets métier concernés
PreEnrollment 
PreEnrollmentStatus 
AcademicYear 
Subject 
SchoolLevel 
TeacherProfile 
Student
Group
Notification
PreEnrollmentProposal



11.17Cas d’erreur
Code
Situation
Résultat attendu
ERR-PRE-001
Préinscription déjà existante
Nouvelle demande refusée
ERR-PRE-002
Année académique invalide
Création refusée
ERR-PRE-003
Préinscriptions fermées
Nouvelle demande impossible
ERR-PRE-004
Groupe déjà complet lors de la confirmation
Transformation en demande refusée
ERR-PRE-005
Proposition expirée
Confirmation impossible
ERR-PRE-006
Période de préinscription non ouverte
Création refusée
ERR-PRE-007
Élève n’appartenant pas au Parent
Création refusée
ERR-PRE-008
Préinscription déjà clôturée
Modification impossible
ERR-PRE-009
Préinscription déjà transformée
opération impossible
ERR-PRE-010
Transformation impossible --- capacité d’abonnement insuffisante
Transformation refusée, Parent informé
ERR-PRE-011
Transformation impossible --- capacité du groupe insuffisante
Transformation refusée, Parent informé
ERR-PRE-012
Plusieurs préinscriptions pour le même Professeur/élève
Nouvelle demande refusée
ERR-PRE-013
Niveau scolaire incohérent avec la progression
Avertissement, création autorisée
ERR-PRE-014
Préinscription transformée --- tentative d’utilisation ultérieure
Opération refusée
ERR-PRE-015
Transformation impossible : groupe clôturé
Transformation refusée
ERR-PRE-016
Transformation impossible : groupe archivé
Transformation refusée
ERR-PRE-017
Préinscription déjà annulée
Opération impossible
ERR-PRE-018
Modification d’une préinscription après l’envoi d’une proposition
Modification refusée

11.18Notifications
Code
Notification
Destinataire
Priorité
NOT-PRE-001
Préinscription créée
Professeur
Information
NOT-PRE-002
Proposition de préinscription envoyée
Parent
Important
NOT-PRE-003
Confirmation de préinscription enregistrée
Professeur
Information
NOT-PRE-004
Proposition expirée
Parent
Important
NOT-PRE-005
Nouvelle préinscription pour l’année suivante
Professeur
Information
NOT-PRE-006
Groupe créé, préinscriptions compatibles trouvées
Professeur
Important
NOT-PRE-007
Préinscription expirée sans proposition
Parent
Information
NOT-PRE-008
Préinscription clôturée (fin de période)
Professeur
Information
NOT-PRE-009
Groupe créé --- aucune préinscription compatible
Professeur
Information
NOT-PRE-010
Rappel : préinscriptions ouvertes pour l’année prochaine
Professeur
Information
NOT-PRE-011
Préinscription annulée
Professeur
Information
NOT-PRE-012
Préinscription refusée
Professeur
Information

11.19Evènements métier
Code
Événement
Description
EVT-PRE-001
Préinscription créée
Un Parent crée une préinscription pour une année future
EVT-PRE-002
Proposition envoyée
Le Professeur envoie une proposition au Parent
EVT-PRE-003
Préinscription confirmée
Le Parent confirme la préinscription
EVT-PRE-004
Préinscription refusée
Le Parent refuse la proposition
EVT-PRE-005
Préinscription transformée
La préinscription est transformée en demande d’inscription
EVT-PRE-006
Préinscription expirée
La proposition arrive à expiration
EVT-PRE-007
Préinscription annulée
Le Parent annule sa préinscription avant réception d’une proposition
EVT-PRE-008
Préinscription clôturée automatiquement
La préinscription est clôturée sans création de groupe
EVT-PRE-009
Transformation refusée (capacité insuffisante)
La transformation en demande échoue pour cause de capacité
EVT-PRE-010
Préinscriptions compatibles détectées
GROUPI identifie automatiquement les préinscriptions compatibles avec un nouveau groupe.


11.20Règles métier
Code
Règle
RM-PRE-001
Une préinscription concerne exclusivement une année académique future.
RM-PRE-002
Une préinscription n’engage ni le Parent ni le Professeur.
RM-PRE-003
Une préinscription n’empêche jamais le Parent d’effectuer une demande d’inscription classique sur un autre groupe.
RM-PRE-004
Un même élève peut disposer simultanément de plusieurs préinscriptions pour une même année académique.
RM-PRE-005
Le Professeur choisit librement la date d’ouverture et de fermeture des préinscriptions.
RM-PRE-006
Le Professeur peut consulter ses préinscriptions dans un espace dédié.
RM-PRE-007
Les préinscriptions ne créent jamais automatiquement un groupe ni une inscription.
RM-PRE-008
À la création d’un groupe, GROUPI recherche automatiquement les préinscriptions compatibles (même année académique, même matière, même niveau).
RM-PRE-009
Les préinscriptions compatibles sont proposées au Professeur.
RM-PRE-010
Après la création du groupe, GROUPI informe automatiquement les Parents concernés.
RM-PRE-011
En cas de confirmation du Parent, GROUPI transforme automatiquement la préinscription en demande d’inscription.
RM-PRE-012
Une fois la demande d’inscription créée, la préinscription est automatiquement clôturée et ne peut plus être réutilisée.
RM-PRE-013
Chaque proposition possède une date limite de réponse. À l’expiration, la préinscription passe à l’état Expirée.
RM-PRE-014
Les confirmations sont traitées selon l’ordre chronologique. Une fois la capacité maximale atteinte, les confirmations suivantes ne peuvent plus être transformées en demandes d’inscription.
RM-PRE-015
Une préinscription ne peut être créée que si les préinscriptions sont ouvertes pour le Professeur concerné.
RM-PRE-016
Une préinscription ne peut concerner qu’un élève appartenant au Parent connecté.
RM-PRE-017
Une préinscription expirée ne peut jamais être réactivée.
RM-PRE-018
Une préinscription transformée en demande d’inscription conserve l’intégralité de son historique.
RM-PRE-019
Une préinscription clôturée ne peut plus être modifiée.
RM-PRE-020
Le Parent peut annuler une préinscription tant qu’aucune proposition ne lui a été envoyée.
RM-PRE-021
Une proposition envoyée ne réserve jamais une place dans le groupe.
RM-PRE-022
La confirmation d’une proposition déclenche la création d’une demande d’inscription si les capacités du groupe et de l’abonnement le permettent.
RM-PRE-023
Une préinscription ne peut jamais être créée pour une année académique déjà terminée ou actuellement en cours.
RM-PRE-024
La transformation d’une préinscription en demande d’inscription est conditionnée par la capacité disponible du groupe et par la capacité disponible de l’abonnement du Professeur.
RM-PRE-025
Un élève ne peut avoir qu’une seule préinscription active par Professeur et par année académique.
RM-PRE-026
Le Parent peut retirer sa confirmation tant que la demande d’inscription issue de la préinscription n’a pas été traitée par le Professeur.
RM-PRE-027
Le niveau scolaire indiqué dans la préinscription doit être cohérent avec la progression naturelle de l’élève. Une incohérence génère une alerte.
RM-PRE-028
Si le Professeur ne crée pas de groupe correspondant avant la date de début de l’année académique, la préinscription est automatiquement clôturée.
RM-PRE-029
Les administrateurs peuvent consulter l’ensemble des préinscriptions dans le cadre de leurs autorisations.
RM-PRE-030
Une place est réservée uniquement lors de la création effective de la demande d’inscription, sous réserve que le groupe dispose encore de places disponibles.
RM-PRE-031
Une préinscription ne peut être modifiée que tant qu’aucune proposition n’a été envoyée.


## CHAPITRE 12 — LES INSCRIPTIONS
12.1 Objet
Une inscription matérialise l’admission d’un élève dans un groupe pour une année académique donnée. Elle constitue le lien administratif, pédagogique et comptable entre le Parent, l’Élève et le Groupe.

12.2Principes
L’inscription constitue le lien administratif, pédagogique et comptable entre :
Un Parent ;
Un Élève ;
Un Groupe.
Chaque inscription est totalement indépendante.Un même élève peut être inscrit simultanément dans plusieurs groupes.
Chaque inscription possède son propre :
Historique pédagogique ;
Historique des présences ;
Historique des commentaires ;
Compte de suivicomptable.
Les informations d’une inscription n’ont aucune incidence sur les autres inscriptions de l’élève.
Une inscription est toujours rattachée à une année académique. Elle n’est valable que pour l’année en cours.

12.3 Recherche d’un groupe
Le Parent est toujours à l’origine de la recherche.Le Professeur ne recherche jamais les Parents.
GROUPI permet au Parent de rechercher des groupes selon plusieurs critères, pouvant être utilisés seuls ou combinés :
Le nom du Professeur ; 
La matière enseignée ; 
Le niveau scolaire ; 
La ville ; 
Le mode d’enseignement (présentiel ou en ligne). 
Le Parent peut également utiliser plusieurs filtres simultanément afin d’affiner les résultats.

Exemple :
Mathématiques 
Bac Sciences 
Tunis 
Présentiel 
GROUPI affiche uniquement les groupes :
Correspondant aux critères sélectionnés ; 
Dont le Professeur est actif ; 
Dont la visibilité permet leur affichage ; 
Dont les inscriptions sont ouvertes. 
Les groupes sont présentés avec leurs principales caractéristiques afin de permettre au Parent de choisir celui qui correspond le mieux aux besoins de son enfant.
Les groupes complets masqués (visibilité désactivée) ne sont jamais affichés dans les résultats de recherche.
En version 2, on pourra ajouter :
Recherche par quartier ; 
Recherche par distance (géolocalisation) ; 
Recherche par disponibilité (jour/heure) ; 
Recherche par fourchette de tarif.
En Version 2, les Parents pourront s’inscrire sur une liste d’attente lorsque le groupe est complet. Ils seront automatiquement informés lorsqu’une place se libère.

12.4 Informations disponibles avant inscription
Avant toute demande d’inscription, le Parent peut consulter :
Le nom du Professeur ;
La matière ;
Le niveau scolaire ;
Le tarif public ;
Les horaires ;
Le lieu habituel ;
Le mode des séances (présentiel ou en ligne) ;
La disponibilité de places dans le groupe ;
La capacité maximale du groupe ;
Les règles de facturation des absences ;
Les modalités habituelles de paiement proposées par le Professeur.
Le Parent dispose ainsi de toutes les informations nécessaires avant de prendre sa décision.

12.5 Demande d’inscription
Le Parent sélectionne :
L’enfant concerné ;
Le groupe souhaité.
GROUPI crée alors une demande d’inscription.Le Professeur reçoit immédiatement une notification.
Une demande d’inscription ne garantit jamais l’admission dans le groupe.
Un élève ne peut posséder qu’une seule inscription active dans un même groupe pour une même année académique.

12.6 Vérifications automatiques
Avant toute validation, GROUPI vérifie automatiquement :
Que le prof est toujours actif ;
Que le nombre total d’inscriptions actives du Professeur (tous groupes confondus) n’excède pas la capacité de son abonnement et que le groupe cible n’a pas atteint sa capacité maximale. Les deux conditions doivent être remplies ;
Que le groupe est toujours actif ;
Que le groupe dispose encore d’au moins une place disponible;
Que le parent est validé ;
Que l’année académique est ouverte ;
Que l’élève ne soit pas déjà inscrit dans ce groupe.
Si l’une de ces conditions n’est pas respectée, la demande est refusée automatiquement.

12.7 Décision du Professeur
Avant d’accepter une inscription, le Professeur peut consulter :
Le profil du Parent ; 
Le profil de l’élève ; 
Son établissement scolaire ; 
Sa classe scolaire actuelle ; 
Le comportement de paiement du Parent.
Le comportement de paiement est calculé automatiquement par GROUPI à partir de l’historique des paiements du Parent sur l’ensemble de la plateforme, pour l’année académique en cours.En début d’année académique, le comportement est calculé sur l’année précédente si disponible, sinon l’indicateur est ‘Non disponible’. Aucune information détaillée concernant les autres Professeurs, les montants, les paiements ou les éventuels impayés n’est jamais affichée afin de préserver la confidentialité des données.
Trois niveaux sont calculés automatiquement. Seul un indicateur synthétique (Excellent, Moyen ou Mauvais) est communiqué au Professeur.
Ces informations constituent uniquement une aide à la décision.
Le Professeur reste seul décisionnaire. Sa décision est immédiatement notifiée au Parent.
Il peut :
Accepter ;
Refuser.
En cas de refus, le Professeur peut ajouter un commentaire explicatif.
L’acceptation d’une inscription est conditionnée par le respect des deux capacités : capacité du groupe et capacité de l’abonnement.
Le Professeur dispose d’un délai de 7 jours pour répondre à une demande d’inscription. Passé ce délai, la demande expire automatiquement et le Parent en est informé.

12.8 Tarification personnalisée
Après validation de l’inscription, le Professeur peut définir un tarif spécifique pour cet élève.
Cette personnalisation est totalement indépendante du tarif public du groupe.
Exemple :
Élève
Tarif
Ahmed
20 TND
Mariem
15 TND
Youssef
0 TND

Chaque Parent ne visualise que le tarif appliqué à son propre enfant.Le tarif personnalisé s’applique uniquement aux séances futures.Les séances déjà réalisées ne peuvent jamais être recalculées.
Toute modification du tarif personnalisé ne s’applique qu’aux séances futures non encore facturées.Toute modification du tarif personnalisé est historisée.

12.9 Modes de paiement
Lors de l’inscription, le Parent indique à titre indicatif son mode de paiement habituel.
Le Professeur peut proposer notamment :
Paiement à chaque séance ;
Paiement anticipé d’un certain nombre de séances ;
Paiement en fin de période de 4 séances.
Cette information est enregistrée à titre indicatif.Le paiement reste toujours réalisé directement entre le Parent et le Professeur.
GROUPI n’intervient jamais dans la transaction financière.

12.10 Compte de suivicomptable
Chaque inscription possède son propre compte de suivicomptable.
Ce compte de suivicomptable enregistre notamment :
Les paiements ;
Les séances facturées ;
Les ajustements éventuels.
Le solde est calculé automatiquement.
Deux inscriptions d’un même élève possèdent donc toujours deux comptes comptables distincts.
Le compte de suivicomptable est créé automatiquement lors de l’activation de l’inscription.

12.11 États d’une inscription
Une inscription peut se trouver dans différents états :
En attente ;
Active ;
Suspendue ;
Refusée ;
Archivée ;
Annulée ;
Expirée.
Etat
Description
En attente
La demande est en cours d’examen.
Active
L’élève participe normalement aux séances.
Suspendue
La participation est momentanément interrompue.
Refusée
La demande d’inscription a été rejetée par le Professeur. Aucune inscription active n’est créée. L’historique de la demande est conservé.
Archivée
L’inscription est définitivement clôturée. Aucune modification n’est alors possible.
Annulée
Le Parent a annulé sa demande avant toute décision du Professeur. Aucun lien d’inscription n’est créé.
Expirée
La demande d’inscription n’a reçu aucune décision du Professeur dans le délai prévu. Elle est automatiquement clôturée par GROUPI.

12.12 Changement de groupe
Le Parent peut demander :
Un changement temporaire ;
Un changement définitif.
La demande est transmise au Professeur.Le Professeur reste seul décisionnaire.
Pour le changement provisoire :
La demande porte sur une séance précise et un groupe cible précis.
L’acceptation du Professeur vérifie que le groupe cible a une place disponible pour cette séance.
La présence de l’élève est enregistrée dans le groupe B pour cette séance, et dans le groupe A comme absence excusée — ce qui est important pour ne pas déclencher les règles d’abandon automatique du groupe A.
Le débit comptable se fait au tarif habituel de l’élève, sur son compte existant.
Pour le définitif :
Le Professeur choisit la date effective lors de l’acceptation (pas le Parent).
À partir de cette date, les séances de l’élève sont générées dans le groupe B.
La place dans le groupe A est libérée à la date effective — pas rétroactivement.
Les séances du groupe A déjà verrouillées avant la date effective restent immuables.
Si le groupe B est plein, le Professeur ne peut pas accepter le transfert — la vérification de capacité est un prérequis.
Le changement de groupe suit le même processus de validation qu’une nouvelle inscription, notamment le contrôle de la capacité du groupe et de la capacité de l’abonnement du Professeur.
Les historiques pédagogiques et comptables restent définitivement rattachés au groupe d’origine et sont conservés séparément.Aucune donnée n’est perdue.
En cas de changement de groupe, une place se libère dans l’ancien groupe (capacité recalculée) et une place est consommée dans le nouveau groupe (sous réserve de capacité disponible).

12.13 Historique
Toutes les opérations relatives à une inscription sont historisées.
Sont notamment conservés :
Les décisions d’inscription ;
Les changements de groupe ;
Les présences ;
Les commentaires ;
Les paiements ;
Les ajustements comptables ;
Modification du tarif ;
Changements d’état ;
Annulations de demandes ;
Expirations automatiques ;
Les motifs de refus éventuels.
Cet historique garantit la traçabilité complète de la scolarité de chaque élève au sein de GROUPI.

12.14 Indicateurs métier
Nombre d’inscriptions actives 
Nombre de demandes en attente 
Nombre de demandes expirées
Nombre d’inscriptions suspendues 
Nombre d’inscriptions archivées 
Nombre moyen d’élèves par groupe
Taux d’acceptation 
Taux de refus 
Taux d’occupation des groupes
Taux de transformation des demandes en inscriptions actives
Taux d’annulation des demandes
Taux moyen de remplissage par Professeur
Répartition des inscriptions par matière
Répartition des inscriptions par niveau scolaire
Délai moyen de réponse du Professeur
12.15 Cycle de vie
État actuel
État suivant autorisé
EN_ATTENTE
ACTIVE
EN_ATTENTE
REFUSEE
EN_ATTENTE
EXPIREE
EN_ATTENTE
ANNULEE
ACTIVE
SUSPENDUE
ACTIVE
ARCHIVEE
SUSPENDUE
ACTIVE
SUSPENDUE
ARCHIVEE
REFUSEE
—
EXPIREE
—
ANNULEE
—
ARCHIVEE
—

12.16 Etats des inscriptions
Code
État
Description
INS-STAT-001
EN_ATTENTE
Demande soumise, en attente de décision
INS-STAT-002
ACTIVE
Inscription validée, élève participant
INS-STAT-003
SUSPENDUE
Participation momentanément interrompue
INS-STAT-004
REFUSEE
Demande refusée par le Professeur
INS-STAT-005
EXPIREE
Demande expirée sans réponse
INS-STAT-006
ARCHIVEE
Inscription définitivement clôturée
INS-STAT-007
ANNULEE
Demande annulée par le Parent avant toute décision du Professeur

12.17Objets métier concernés
Enrollment 
EnrollmentStatus 
Student 
ParentProfile 
TeacherProfile 
Group 
AccountingAccount 
Payment
StudentSchoolSituation
AcademicYear

12.18 Cas d’erreur
Code
Situation
Résultat attendu
ERR-INS-001
Groupe complet
Création de la demande refusée.
ERR-INS-002
Élève déjà inscrit dans ce groupe pour la même année académique
Création de la demande refusée.
ERR-INS-003
Groupe archivé
Création de la demande impossible.
ERR-INS-004
Parent non validé
Création de la demande refusée.
ERR-INS-005
Professeur suspendu ou inactif
Création de la demande impossible.
ERR-INS-006
Année académique clôturée
Création de la demande impossible.
ERR-INS-007
Groupe suspendu
Création de la demande impossible.
ERR-INS-008
Capacité de l’abonnement du Professeur atteinte
Création ou acceptation de la demande impossible.
ERR-INS-009
Demande d’inscription déjà existante pour le même élève et le même groupe
Nouvelle demande refusée.
ERR-INS-010
Élève archivé
Création de la demande impossible.
ERR-INS-011
Délai de réponse dépassé
La demande passe automatiquement à l’état **EXPIREE**.
ERR-INS-012
Changement de groupe impossible : nouveau groupe complet
Changement refusé.
ERR-INS-013
Changement de groupe impossible : capacité d’abonnement insuffisante
Changement refusé.
ERR-INS-014
Modification d’un tarif personnalisé après facturation des séances concernées
Modification refusée.
ERR-INS-015
Comportement de paiement du Parent évalué à « Mauvais »
Avertissement affiché au Professeur ; décision laissée à son appréciation.
ERR-INS-016
Inscriptions fermées pour ce groupe
Création de la demande impossible.
ERR-INS-017
Demande déjà traitée
Nouvelle décision impossible.
ERR-INS-018
Inscription archivée
Toute modification est interdite.
ERR-INS-019
Demande déjà annulée
Toute opération sur cette demande est refusée.
ERR-INS-020
Tentative de traitement d’une demande annulée
Acceptation ou refus impossible.
ERR-INS-021
Tentative de réactivation d’une inscription archivée
Réactivation impossible.
ERR-INS-022
Tentative de réactivation d’une inscription refusée
Réactivation impossible.
ERR-INS-023
Tentative de réactivation d’une inscription expirée
Réactivation impossible.
ERR-INS-024
Parent archivé
Création de la demande impossible.
ERR-INS-025
Élève supprimé ou archivé avant la décision du Professeur
La demande est automatiquement clôturée.
ERR-INS-026
Groupe fermé, suspendu ou archivé avant la décision du Professeur
Acceptation de la demande impossible.
ERR-INS-027
L’année académique du groupe est incompatible avec la situation scolaire active de l’élève
Création de la demande refusée.
ERR-INS-028
L’élève n’appartient pas au Parent connecté
Création de la demande refusée.
ERR-INS-029
Groupe supprimé avant le traitement de la demande
La demande est automatiquement clôturée.
ERR-INS-030
La capacité du groupe n’est plus disponible au moment de l’acceptation
Acceptation refusée, le Parent est informé.
ERR-INS-031
Groupe supprimé pendant le traitement de la demande
La demande est automatiquement clôturée et le Parent est informé.
ERR-INS-032
Inscription ACTIVE déjà existante pour le même élève, le même groupe et la même année académique
Création refusée.

12.19 Notifications
Code
Notification
Destinataire
Priorité
NOT-INS-001
Nouvelle demande d’inscription reçue
Professeur
Important
NOT-INS-002
Demande d’inscription acceptée
Parent
Important
NOT-INS-003
Demande d’inscription refusée
Parent
Important
NOT-INS-004
Tarif personnalisé modifié
Parent
Information
NOT-INS-005
Inscription suspendue
Parent
Important
NOT-INS-006
Inscription réactivée
Parent
Information
NOT-INS-007
Changement de groupe accepté
Parent
Important
NOT-INS-008
Changement de groupe refusé
Parent
Important
NOT-INS-009
Inscription terminée (fin d’année)
Parent
Information
NOT-INS-010
Demande d’inscription expirée (Professeur sans réponse)
Parent
Important
NOT-INS-011
Demande d’inscription reçue --- rappel J+3
Professeur
Information
NOT-INS-012
Nouvelle place disponible dans un groupe complet
Parent (en liste d’attente Version 2)
Important
NOT-INS-013
Inscription automatiquement refusée (vérification échouée)
Parent
Critique
NOT-INS-014
Demande d’inscription annulée par le Parent
Professeur
Information
NOT-INS-015
Inscription suspendue automatiquement
Parent
Important
NOT-INS-016
Inscription créée
Professeur
Information

12.20 Evènements métier
Code
Événement
Description
EVT-INS-001
Demande d’inscription créée
Le Parent crée une nouvelle demande d’inscription pour un élève dans un groupe.
EVT-INS-002
Demande d’inscription acceptée
Le Professeur accepte la demande d’inscription. Une inscription ACTIVE est créée automatiquement.
EVT-INS-003
Demande d’inscription refusée
Le Professeur refuse la demande d’inscription. Aucun lien d’inscription n’est créé.
EVT-INS-004
Tarif personnalisé modifié
Le Professeur modifie le tarif personnalisé appliqué à une inscription active.
EVT-INS-005
Inscription suspendue
L’inscription est suspendue manuellement par le Professeur ou un Administrateur.
EVT-INS-006
Inscription terminée
L’inscription est clôturée à la fin de l’année académique avant son archivage définitif.
EVT-INS-007
Changement de groupe
L’élève est transféré vers un autre groupe. Une nouvelle inscription est créée conformément aux règles métier.
EVT-INS-008
Inscription archivée
L’inscription est archivée définitivement. Aucune modification ultérieure n’est autorisée.
EVT-INS-009
Inscription réactivée
Une inscription suspendue est réactivée et redevient active.
EVT-INS-010
Demande expirée
La demande d’inscription expire automatiquement après le délai de réponse du Professeur.
EVT-INS-011
Inscription refusée automatiquement
GROUPI refuse automatiquement la demande à la suite d’un échec des vérifications métier.
EVT-INS-012
Demande annulée par le Parent
Le Parent annule une demande d’inscription encore en attente de décision du Professeur.
EVT-INS-013
Inscription suspendue automatiquement
GROUPI suspend automatiquement une inscription selon les règles métier (par exemple : groupe suspendu, Professeur suspendu ou décision administrative).
EVT-INS-014
Tarif personnalisé créé
Le Professeur définit un tarif personnalisé lors de l’acceptation de l’inscription ou ultérieurement.
EVT-INS-015
Demande rejetée automatiquement
GROUPI rejette automatiquement une demande d’inscription devenue invalide avant traitement (par exemple : groupe archivé, année académique clôturée, Parent archivé ou élève supprimé).
EVT-INS-016
Compte de suivi comptable créé
GROUPI crée automatiquement le compte de suivi comptable associé lors de l’activation de l’inscription.
EVT-INS-017
Demande d’inscription consultée
Le Professeur consulte une demande d’inscription avant de prendre sa décision.
EVT-INS-018
Tarif public appliqué
L’inscription est créée sans tarif personnalisé ; le tarif public du groupe est appliqué automatiquement.

12.21 Règles métier
Code
Règle
RM-INS-001
Une inscription concerne un seul enfant.
RM-INS-002
Une inscription concerne un seul groupe.
RM-INS-003
Chaque inscription possède son propre historique pédagogique, historique des présences, historique des commentaires et compte de suivi comptable.
RM-INS-004
Un même élève peut être inscrit simultanément dans plusieurs groupes.
RM-INS-005
Les informations d’une inscription n’ont aucune incidence sur les autres inscriptions de l’élève.
RM-INS-006
Le Parent est toujours à l’origine de la recherche.
RM-INS-007
La recherche peut s’effectuer par : nom du Professeur, matière, niveau, ville, mode d’enseignement.
RM-INS-008
Avant inscription, le Parent peut consulter toutes les informations publiques du groupe.
RM-INS-009
Une demande d’inscription ne garantit jamais l’admission dans le groupe.
RM-INS-010
Un élève ne peut posséder qu’une seule inscription active dans un même groupe pour une même année académique.
RM-INS-011
Avant validation, GROUPI vérifie automatiquement : compte actif, abonnement compatible, groupe actif, groupe non complet, parent validé, année académique ouverte, élève non déjà inscrit.
RM-INS-012
Si l’une des vérifications échoue, la demande est refusée automatiquement.
RM-INS-013
Le Professeur est seul décisionnaire pour accepter ou refuser une inscription.
RM-INS-014
Le comportement de paiement est calculé automatiquement par GROUPI à partir de l’historique des paiements du Parent pour l’année académique en cours.
RM-INS-015
Seul un indicateur synthétique (Excellent, Moyen ou Mauvais) est communiqué au Professeur.
RM-INS-016
Aucune information détaillée concernant les autres Professeurs, les montants ou les impayés n’est jamais affichée.
RM-INS-017
Le tarif personnalisé s’applique uniquement aux séances futures.
RM-INS-018
Les séances déjà réalisées ne peuvent jamais être recalculées.
RM-INS-019
Le tarif personnalisé reste modifiable tant qu’aucune séance future n’a été facturée.
RM-INS-020
Le paiement reste toujours réalisé directement entre le Parent et le Professeur. GROUPI n’intervient jamais dans la transaction.
RM-INS-021
Chaque inscription possède son propre compte de suivi comptable.
RM-INS-022
Deux inscriptions d’un même élève possèdent toujours deux comptes comptables distincts.
RM-INS-023
Les historiques pédagogiques et comptables restent définitivement rattachés au groupe d’origine en cas de changement.
RM-INS-024
Une inscription est toujours rattachée à une année académique.
RM-INS-025
L’acceptation d’une inscription est conditionnée par la capacité disponible du groupe et par la capacité disponible de l’abonnement du Professeur.
RM-INS-026
Le Professeur dispose d’un délai de 7 jours pour répondre à une demande d’inscription. Passé ce délai, la demande expire automatiquement.
RM-INS-027
En cas de changement de groupe, une place se libère dans l’ancien groupe et une place est consommée dans le nouveau groupe.
RM-INS-028
Les groupes complets masqués ne sont jamais affichés dans les résultats de recherche.
RM-INS-029
En début d’année académique, le comportement de paiement est calculé sur l’année précédente si disponible.
RM-INS-030
Un Parent ne peut pas soumettre une nouvelle demande d’inscription pour un élève déjà inscrit dans le même groupe (ERR-INS-002).
RM-INS-031
Une inscription est toujours rattachée à la situation scolaire active de l’élève au moment de sa création.
RM-INS-032
Une inscription refusée ne peut jamais être réactivée.
RM-INS-033
Une inscription archivée ne peut plus être modifiée.
RM-INS-034
Une inscription suspendue conserve l’ensemble de ses données pédagogiques et comptables.
RM-INS-035
La suspension d’une inscription n’entraîne jamais la suppression des séances déjà réalisées.
RM-INS-036
Une inscription ne peut être créée que dans un groupe dont les inscriptions sont ouvertes.
RM-INS-037
Une inscription ne peut être créée que pour un groupe appartenant à une année académique ouverte.
RM-INS-038
Une demande d’inscription en attente peut être annulée par le Parent tant qu’aucune décision n’a été prise par le Professeur.
RM-INS-039
Un Professeur ne peut accepter une demande d’inscription que si une place est encore disponible au moment de sa décision.
RM-INS-040
Une demande d’inscription annulée ne peut jamais être réactivée.
RM-INS-041
Une inscription ACTIVE consomme immédiatement une place dans le groupe ainsi qu’une capacité de l’abonnement du Professeur.
RM-INS-042
Une inscription suspendue continue d’exister administrativement mais ne permet plus la participation aux séances tant qu’elle n’est pas réactivée.
RM-INS-043
Une inscription archivée est conservée sans limite de durée à des fins de traçabilité pédagogique et comptable.
RM-INS-044
Le changement de groupe crée systématiquement une nouvelle inscription indépendante. Les historiques de l’inscription d’origine ne sont jamais transférés.
RM-INS-045
Le compte de suivi comptable est créé uniquement lors de l’activation de l’inscription. Il est définitivement rattaché à cette inscription.
RM-INS-046
Une inscription ne peut jamais appartenir simultanément à plusieurs groupes.
RM-INS-047
Un Parent peut consulter à tout moment l’état de ses demandes d’inscription.
RM-INS-048
Toutes les décisions du Professeur concernant une demande d’inscription sont historisées avec leur date et leur auteur.
RM-INS-049
Une demande d’inscription ne peut plus être annulée dès qu’une décision du Professeur est enregistrée.
RM-INS-050
Le changement de groupe crée une nouvelle inscription disposant de son propre compte de suivi comptable, de son propre tarif personnalisé, de son propre historique pédagogique et de ses propres présences.
RM-INS-051
Une place libérée à la suite d’une archive ou d’un changement de groupe redevient immédiatement disponible.
RM-INS-052
Une inscription suspendue ne peut générer aucune nouvelle présence, absence, facturation ou séance tant qu’elle n’est pas réactivée.
RM-INS-053
Une inscription archivée ne peut jamais revenir à l’état ACTIVE.
RM-INS-054
L’acceptation d’une demande d’inscription déclenche automatiquement la création de l’inscription ACTIVE ainsi que de son compte de suivi comptable.
RM-INS-055
L’acceptation d’une demande d’inscription entraîne automatiquement le passage de l’état EN_ATTENTE à ACTIVE.
RM-INS-056
La capacité de l’abonnement est vérifiée une seconde fois au moment exact de l’acceptation par le Professeur.
RM-INS-057
Une inscription ACTIVE ne peut jamais être dupliquée.
RM-INS-058
Une demande d’inscription expirée conserve son historique mais ne peut jamais être réactivée.


## CHAPITRE 13 — LES SÉANCES
13.1 Objet
Le présent chapitre décrit les règles de gestion relatives aux séances pédagogiques organisées dans le cadre d’un groupe.
Il définit notamment :
Les modalités de création et de génération automatique des séances ; 
Leur planification à partir du planning hebdomadaire du groupe ; 
Leur déroulement ; 
Les modifications exceptionnelles autorisées ; 
La gestion des périodes d’interruption ; 
Les règles d’immuabilité des séances réalisées ; 
Les impacts pédagogiques, comptables et de notification, associés à chaque séance. 
Les séances constituent l’unité opérationnelle de base de l’activité pédagogique de GROUPI.

13.2Principes
Une séance représente une rencontre pédagogique planifiée entre un Professeur et les élèves d’un groupe.Chaque séance est toujours rattachée à un seul groupe.Elle constitue l’unité de base de l’activité pédagogique de GROUPI.
Pour chaque séance, GROUPI conserve notamment :
Le groupe concerné ;
La date ;
L’heure de début ;
La durée ;
Le lieu ;
Le mode d’enseignement (présentiel ou en ligne) ;
Les présences ;
Les commentaires ;
Les écritures comptables éventuellement générées.
Une séance possède son propre historique et reste conservée pendant toute la durée de vie de la plateforme.

13.3 Génération des séances
Les séances sont générées automatiquement à partir du calendrier du groupe.
Ce calendrier est construit à partir :
Du planning hebdomadaire défini lors de la création du groupe ;
De la date de début du groupe ;
De la date de fin éventuelle ;
Des périodes d’interruption définies par le Professeur.
À partir de ces informations, GROUPI crée automatiquement les séances futures.
Le Professeur peut également :
Créer une séance exceptionnelle ;
Déplacer une séance future ;
Supprimer une séance future.
Ces opérations n’ont aucune incidence sur le planning hebdomadaire du groupe.
GROUPI garantit qu’une même séance n’est jamais générée deux fois pour un même groupe, une même date et un même créneau horaire.
GROUPI détecte les conflits de planning pour un même Professeur lors de la création ou du déplacement d’une séance. Une alerte est générée, mais la création reste autorisée en Version 1.
La génération de nouvelles séances est suspendue lorsque l’abonnement du Professeur est expiré ou suspendu ou si aucun élève ne s’est inscrit au groupe. Les séances déjà générées restent consultables.
Une séance peut être reportée à une autre date. Le report annule la séance initiale et crée une nouvelle séance à la date choisie. Les Parents en sont informés.
GROUPI limite la génération automatique des séances dans le futur à la durée de l’année académique afin de garantir la performance de la plateforme.

13.4 Périodes d’interruption
Le Professeur peut définir des périodes pendant lesquelles aucune séance ne doit être générée.
Exemples :
Vacances scolaires ;
Congés personnels ;
Examens ;
Interruption exceptionnelle.
Pendant une période d’interruption :
Aucune nouvelle séance n’est générée ;
Les inscriptions restent actives ;
Les historiques restent inchangés.
À la fin de cette période, la génération automatique reprend selon le planning habituel. À la fin d’une période d’interruption, les séances sont générées à partir de la date de reprise. Aucune séance n’est générée rétroactivement pour la période d’interruption.
Cette fonctionnalité évite au Professeur de devoir supprimer manuellement un grand nombre de séances.
Les périodes d’interruption n’affectent jamais le planning hebdomadaire du groupe. Elles suspendent uniquement la génération des séances durant la période concernée.

13.5 Déroulement d’une séance
À l’issue de chaque séance, le Professeur renseigne :
Saisie desstatuts de présences des élèves ;
Les éventuels commentaires pédagogiques ;
Selon les règles de facturation du groupe, GROUPI génère automatiquement les écritures comptables correspondantes.
Le Professeur peut également enregistrer immédiatement un paiement reçu.

13.6 Modification exceptionnelle du mode d’enseignement
Une séance initialement prévue en présentiel peut exceptionnellement être transformée en séance en ligne.Cette modification reste ponctuelle.Elle ne modifie jamais le mode d’enseignement habituel du groupe.Les Parents concernés sont immédiatement informés.
Chaque Parent peut confirmer que son enfant participera à la séance en ligne ou indiquer qu’il ne pourra pas y participer.
En cas de refus :
L’élève est considéré comme Absent excusé ;
Cette absence n’est pas prise en compte dans le calcul des absences consécutives ;
La séance est facturée ou non selon les règles de facturation du groupe acceptées lors de l’inscription.

13.7 Modification d’une séance réalisée
Pendant les quarante-huit heures suivant la fin d’une séance, Le Professeur peut exceptionnellement corriger:
La présence d’un élève ;
La facturation de cette séance.
Toute modification entraîne automatiquement :
Une notification immédiate au Parent concerné ;
Une mise à jour du compte de suivicomptable de l’inscription ;
L’enregistrement de cette modification dans l’historique.
Après quarante-huit heures, la séance devient définitivement verrouillée.
Aucune modification n’est alors autorisée.

13.8Annulation d’une séance prévue
Une séance planifiée peut être annulée par le Professeur avant sa réalisation.
L’annulation entraîne automatiquement :
Une notification aux Parents concernés ; 
L’absence de génération des écritures comptables associées ; 
La conservation de la trace de cette annulation dans l’historique. 
Une séance annulée ne peut jamais être réactivée.Si nécessaire, une nouvelle séance devra être créée.

13.9 Principe d’immuabilité
Une séance verrouillée constitue un élément historique.
Elle ne peut jamais être modifiée, supprimée ou remplacée.
En cas d’erreur exceptionnelle, seule une opération d’ajustement comptable pourra être réalisée conformément aux procédures prévues par GROUPI.
Les données pédagogiques de la séance restent inchangées.
Toute correction comptable ultérieure est réalisée au moyen d’une écriture d’ajustement, sans modifier les données historiques de la séance.

13.10 Séances exceptionnelles
Le Professeur peut organiser des séances exceptionnelles ne figurant pas dans le planning habituel.
Ces séances peuvent notamment correspondre à :
Une séance de rattrapage ;
Une révision avant examen ;
Une séance supplémentaire ;
Toute autre activité pédagogique.
Les séances exceptionnelles sont gérées exactement comme les séances générées automatiquement.
Les séances exceptionnelles sont prises en compte dans les statistiques, les présences et la facturation exactement comme les séances générées automatiquement.

13.11 Historique
Toutes les séances restent conservées.
GROUPI historise notamment :
Leur création ;
Leurs modifications autorisées ;
Les changements de mode d’enseignement ;
Les présences ;
Les commentaires ;
Les écritures comptables associées.
Cette historisation garantit une traçabilité complète de l’activité pédagogique.

13.12Statuts de présence
Les statuts de présence sont bien détaillés dans le chapitre Gestion de présences.

13.13 Évolutions prévues
À partir de la Version 2, GROUPI intégrera un moteur intelligent de planification.
L’intelligence artificielle pourra notamment :
Exploiter automatiquement le calendrier scolaire officiel ;
Tenir compte des jours fériés ;
Intégrer les périodes de vacances comme périodes d’interruption suggérées ;
Proposer des séances de rattrapage ;
Détecter les conflits de planning ;
Assister le Professeur dans l’organisation de ses groupes.

13.14Indicateurs métier
Nombre de séances planifiées
Nombre de séances réalisées
Nombre de séances annulées
Nombre de séances reportées
Nombre de séances exceptionnelles
Taux de présence moyen
Taux d’absence non justifiée
Taux d’absence justifiée
Nombre moyen de séances par groupe
Nombre moyen de séances par professeur
Nombre de conflits de planning détectés
Nombre de corrections de séances
Délai moyen de saisie des présences

13.15Cycle de vie
État actuel
État suivant autorisé
PLANIFIEE
EN_COURS
PLANIFIEE
ANNULEE
EN_COURS
TERMINEE
TERMINEE
VERROUILLEE
ANNULEE
—
VERROUILLEE
—

13.16Etats des séances
Code
Etat
Description
SES-STAT-001
PLANIFIEE
Séance générée et prévue
SES-STAT-002
EN_COURS
Séance en cours
SES-STAT-003
TERMINEE
Séance terminée
SES-STAT-004
ANNULEE
Séance annulée
SES-STAT-005
VERROUILLEE
Séance définitivement figée

13.17Objets métier concernés
Session
SessionStatus
SessionCancellationReason
SessionHistory
Attendance
AttendanceStatus
AttendanceHistory
Group
GroupSchedule
Enrollment
Comment
AccountingEntry
Payment
TeacherProfile
Student
AcademicYear

13.18Cas d’erreur
Code
Situation
Résultat attendu
ERR-SES-001
Séance verrouillée
Modification refusée
ERR-SES-002
Groupe archivé
Ajout de séance impossible
ERR-SES-003
Année académique clôturée
Création refusée
ERR-SES-004
Séance déjà existante sur le même créneau
Création refusée
ERR-SES-005
Créneau en dehors de la période du groupe
Création refusée
ERR-SES-006
Séance située dans une période d’interruption
Création refusée
ERR-SES-007
Séance planifiée déjà réalisée
Annulation impossible
ERR-SES-008
Période d’interruption en cours
Modification de planning impossible
ERR-SES-009
Conflit de planning avec une autre séance du Professeur
Avertissement, création autorisée
ERR-SES-010
Séance reportée sur une date en période d’interruption
Report refusé
ERR-SES-011
Abonnement expiré --- génération de séance
Génération suspendue
ERR-SES-012
Tentative de modification d’une séance verrouillée
Modification refusée
ERR-SES-013
Séance sans élève inscrit
Création autorisée avec avertissement
ERR-SES-014
Tentative de report d’une séance verrouillée
Report refusé.
ERR-SES-015
Tentative de suppression d’une séance verrouillée
Suppression impossible.
ERR-SES-016
Séance déjà annulée
Nouvelle annulation impossible.
ERR-SES-017
Séance déjà reportée vers une autre séance
Nouvelle opération refusée.
ERR-SES-018
Présences déjà verrouillées
Modification impossible.
ERR-SES-019
Mode d’enseignement identique
Aucune modification effectuée.
ERR-SES-020
Date de report antérieure à aujourd’hui
Report refusé.
ERR-SES-021
Professeur suspendu
Création ou modification refusée.
ERR-SES-022
Séance en dehors de l’année académique
Création refusée.
ERR-SES-023
Séance appartenant à un groupe fermé
Création impossible.
ERR-SES-024
Séance appartenant à un groupe sans planning
Génération impossible.
ERR-SES-025
Tentative de saisie des présences avant la date de la séance
Saisie refusée.
ERR-SES-026
Tentative de saisie des présences pour une séance annulée
Saisie refusée.
ERR-SES-027
Tentative de génération d’une séance en doublon
Génération ignorée.
ERR-SES-028
Tentative de création d’une séance sans Professeur actif
Création refusée.
ERR-SES-029
Tentative de report sur un créneau déjà occupé
Report refusé.
ERR-SES-030
Tentative de suppression d’une séance ayant déjà généré des écritures comptables
Suppression refusée.

13.19Notifications
Code
Notification
Destinataire
Priorité
NOT-SES-001
Nouvelle séance exceptionnelle créée
Parents du groupe
Important
NOT-SES-002
Séance déplacée
Parents du groupe
Important
NOT-SES-003
Séance annulée
Parents du groupe
Important
NOT-SES-004
Passage exceptionnel en ligne
Parents du groupe
Important
NOT-SES-005
Période d’interruption définie
Parents du groupe
Information
NOT-SES-006
Période d’interruption terminée
Parents du groupe
Information
NOT-SES-007
Séance reportée
Parents du groupe
Important
NOT-SES-008
Nouvelle séance générée
Parent
Information
NOT-SES-009
Rappel : séance dans 24h
Professeur, Parents
Information
NOT-SES-010
Absence non justifiée détectée (seuil d’abandon)
Professeur
Important
NOT-SES-011
Séance verrouillée (corrections impossibles)
Professeur
Information
NOT-SES-012
Conflit de planning détecté
Professeur
Important
NOT-SES-013
Présences non saisies (rappel J+1)
Professeur
Important
NOT-SES-014
Présence corrigée
Parent
Information
NOT-SES-015
Facturation corrigée
Parent
Information
NOT-SES-016
Commentaires pédagogiques publiés
Parent
Information
NOT-SES-017
Paiement enregistré
Parent
Information
NOT-SES-018
Séance créée après report
Parent
Information

13.20 Evènements métier
Code
Événement
Description
EVT-SES-001
Séance générée automatiquement
Une séance est créée à partir du planning
EVT-SES-002
Séance exceptionnelle créée
Le Professeur crée une séance hors planning
EVT-SES-003
Séance déplacée
Une séance future est déplacée
EVT-SES-004
Séance annulée
Une séance future est annulée
EVT-SES-005
Passage exceptionnel en ligne
Une séance présentielle devient en ligne
EVT-SES-006
Présences enregistrées
Le Professeur saisit les présences de la séance
EVT-SES-007
Séance verrouillée
La séance devient définitive (après 48h)
EVT-SES-008
Période d’interruption définie
Le Professeur définit une période sans séances
EVT-SES-009
Période d’interruption terminée
La génération automatique des séances reprend
EVT-SES-010
Séance reportée
Une séance est reportée à une autre date
EVT-SES-011
Seuil d’abandon atteint
Un élève atteint le seuil d’abandon défini pour le groupe
EVT-SES-012
Conflit de planning détecté
Un conflit est détecté avec une autre séance du Professeur
EVT-SES-013
Présence modifiée
Le Professeur corrige le statut de présence d’un élève dans le délai autorisé.
EVT-SES-014
Facturation corrigée
Une correction comptable est réalisée après modification autorisée de la séance.
EVT-SES-015
Séance générée après reprise
GROUPI génère automatiquement les séances après la fin d’une période d’interruption.
EVT-SES-016
Commentaires pédagogiques enregistrés
Le Professeur enregistre les commentaires pédagogiques de la séance.
EVT-SES-017
Paiement enregistré pendant la séance
Le Professeur enregistre un paiement associé à une inscription.
EVT-SES-018
Séance créée manuellement
Une séance est créée indépendamment de la génération automatique.
EVT-SES-019
Séance supprimée avant réalisation
Une séance future est supprimée par le Professeur.
EVT-SES-020
Séance déverrouillée administrativement
Opération exceptionnelle réalisée par un Super Administrateur.
EVT-SES-021
Ecritures comptables générées
GROUPI génère automatiquement les écritures comptables de la séance selon les règles de facturation.
EVT-SES-022
Présence supprimée
Une correction supprime un statut de présence.
EVT-SES-023
Mode d’enseignement rétabli
Une séance revient au mode initial avant son déroulement.
EVT-SES-024
Séance automatiquement non générée
GROUPI ne génère pas une séance en raison d’une règle métier (abonnement suspendu, groupe sans élève, période d’interruption, etc.).
EVT-SES-025
Séance ignorée (doublon)
Une tentative de génération détecte une séance déjà existante.
EVT-SES-026
Historique de séance consulté
Consultation de l’historique d’audit d’une séance (utile pour les audits).


13.21Règles métier
Code
Règle
RM-SES-001
Une séance est toujours rattachée à un seul groupe.
RM-SES-002
Une séance est en présentiel ou en ligne.
RM-SES-003
Les séances sont générées automatiquement à partir du planning hebdomadaire du groupe.
RM-SES-004
GROUPI garantit qu’une même séance n’est jamais générée deux fois pour un même groupe, une même date et un même créneau horaire.
RM-SES-005
Le Professeur peut créer une séance exceptionnelle, déplacer une séance future ou supprimer une séance future.
RM-SES-006
Les modifications du Professeur n’ont aucune incidence sur le planning hebdomadaire du groupe.
RM-SES-007
Pendant une période d’interruption, aucune nouvelle séance n’est générée, les inscriptions restent actives et les historiques restent inchangés.
RM-SES-008
Les périodes d’interruption n’affectent jamais le planning hebdomadaire du groupe. Elles suspendent uniquement la génération.
RM-SES-009
Une séance initialement prévue en présentiel peut exceptionnellement être transformée en séance en ligne.
RM-SES-010
Le changement de mode d’enseignement ne modifie jamais le mode d’enseignement habituel du groupe.
RM-SES-011
Les Parents sont immédiatement informés d’un changement de mode. Chaque Parent peut accepter ou refuser la participation de son enfant.
RM-SES-012
En cas de refus, l’élève est considéré comme Absent excusé. Cette absence n’est pas prise en compte dans le calcul des absences consécutives.
RM-SES-013
Pendant les 48 heures suivant la fin d’une séance, le Professeur peut corriger la présence d’un élève ou la facturation.
RM-SES-014
Toute modification entraîne une notification immédiate au Parent, une mise à jour du compte de suivi comptable et l’enregistrement dans l’historique.
RM-SES-015
Après 48 heures, la séance devient définitivement verrouillée. Aucune modification n’est alors autorisée.
RM-SES-016
Une séance planifiée peut être annulée par le Professeur avant sa réalisation.
RM-SES-017
L’annulation entraîne une notification aux Parents, l’absence de génération d’écritures comptables et la conservation de la trace.
RM-SES-018
Une séance annulée ne peut jamais être réactivée. Si nécessaire, une nouvelle séance devra être créée.
RM-SES-019
Une séance verrouillée constitue un élément historique. Elle ne peut jamais être modifiée, supprimée ou remplacée.
RM-SES-020
En cas d’erreur exceptionnelle, seule une opération d’ajustement comptable pourra être réalisée, sans modifier les données pédagogiques.
RM-SES-021
Les séances exceptionnelles sont gérées exactement comme les séances générées automatiquement.
RM-SES-022
La génération de nouvelles séances est suspendue si aucun élève ne s’est inscrit au groupe.
RM-SES-023
La génération de nouvelles séances est suspendue lorsque l’abonnement du Professeur est expiré ou suspendu.
RM-SES-024
GROUPI détecte les conflits de planning pour un même Professeur et génère une alerte non bloquante en Version 1.
RM-SES-025
Pour chaque séance et chaque élève, le Professeur peut saisir : Présent, Absent non excusé, Absent excusé, Retard.
RM-SES-026
Lorsqu’un élève atteint le seuil d’abandon (3 absences consécutives non excusées), une alerte est générée.
RM-SES-027
Le report d’une séance annule la séance initiale et crée une nouvelle séance à la date choisie.
RM-SES-028
À la fin d’une période d’interruption, les séances sont générées à partir de la date de reprise. Aucune séance n’est générée rétroactivement.
RM-SES-029
GROUPI limite la génération automatique des séances dans le futur à la durée de l’année académique.
RM-SES-030
Une séance appartient toujours à une seule année académique.
RM-SES-031
Une séance est toujours rattachée à un seul Professeur via son groupe.
RM-SES-032
Une séance ne peut être créée que pour un groupe actif appartenant à une année académique ouverte.
RM-SES-033
Une séance annulée ne génère jamais d’écriture comptable.
RM-SES-034
Une séance reportée conserve la référence de la séance d’origine afin d’assurer la traçabilité.
RM-SES-035
Toute modification autorisée d’une séance est historisée avec la date, l’auteur et les valeurs avant/après modification.
RM-SES-036
Une séance verrouillée ne peut jamais être déverrouillée automatiquement. Seul un Super Administrateur peut effectuer un déverrouillage exceptionnel, lequel est obligatoirement historisé.
RM-SES-037
Les présences ne peuvent être saisies que pour une séance dont l’état est TERMINEE.
RM-SES-038
Une séance ne peut être marquée comme TERMINEE que lorsque son heure de fin planifiée est atteinte ou dépassée.
RM-SES-039
La suppression d’une séance future ne supprime jamais son historique d’audit.
RM-SES-040
Les présences ne peuvent être saisies qu’une seule fois. Toute modification ultérieure est considérée comme une correction et suit les règles de modification des séances.
RM-SES-041
Les commentaires pédagogiques peuvent être modifiés pendant la période autorisée de correction de la séance. Chaque modification est historisée.
RM-SES-042
Les écritures comptables d’une séance ne peuvent être générées qu’une seule fois. Toute correction ultérieure est réalisée exclusivement au moyen d’écritures d’ajustement.
RM-SES-043
Le report d’une séance conserve l’ensemble des inscriptions du groupe. Aucune nouvelle inscription n’est créée.
RM-SES-044
Toute modification exceptionnelle d’une séance entraîne automatiquement une notification aux Parents concernés.
RM-SES-045
À chaque modification du planning hebdomadaire, des périodes d’interruption ou de la date de fin du groupe, GROUPI recalcule uniquement les séances futures concernées. Les séances passées ne sont jamais modifiées.
RM-SES-046
Une séance exceptionnelle n’entraîne jamais la modification du planning hebdomadaire du groupe.
RM-SES-047
L’enregistrement d’un paiement pendant une séance ne modifie jamais les informations pédagogiques de la séance. Il impacte uniquement le compte de suivi comptable de l’inscription concernée.


## CHAPITRE 14 — GESTION DES PRÉSENCES
14.1 Objet
Définir la gestion des présences des élèves lors des séances pédagogiques.Une présence représente la participation (ou non) d’un élève à une séance.

14.2Principes
La gestion des présences constitue l’un des piliers de GROUPI.Elle permet :
De suivre l’assiduité des élèves ;
D’informer les Parents ;
D’alimenter les tableaux de bord ;
D’alimenter les statistiques ;
De déclencher automatiquement les écritures comptables selon les règles du groupe.
Chaque présence est enregistrée pour une séance et pour un élève.

14.3 Saisie des présences
À l’issue de chaque séance, le Professeur renseigne la présence de chacun des élèves inscrits.
Une présence ne peut être saisie que par le Professeur responsable du groupe.Chaque élève doit obligatoirement recevoir un statut.Les présences peuvent être enregistrées progressivement. La séance ne peut toutefois être validée définitivement que lorsque tous les élèves disposent d’un statut.La désinscription d’un élève n’affecte jamais les présences déjà enregistrées.
Les présences ne peuvent être enregistrées que pour les élèves disposant d’une inscription active à la date de la séance. Une désinscription postérieure n’affecte jamais les présences déjà enregistrées.

14.4 Statuts de présence
Pour chaque élève, le Professeur sélectionne un unique statut.
Présent
L’élève a participé normalement à la séance.Selon les règles du groupe, la séance est facturée.
Absent excusé
Le Parent a prévenu le Professeur avant ou pendant la séance.La facturation dépend de la politique définie lors de la création du groupe.
Le Parent peut refuser la participation à une séance passée exceptionnellement en ligne. Dans ce cas Présence = Absent excusé.

Absent non excusé
Le Parent n’a pas informé le Professeur.La facturation dépend de la politique définie pour le groupe.
La qualification d’une absence (excusée ou non excusée) est déterminée conformément aux règles d’absence définies lors de la création du groupe.
Le Parent peut signaler une absence depuis l’application avant le début de la séance.Ce signalement ne modifie pas automatiquement le statut de présence.Il constitue une information transmise au Professeur, qui reste seul habilité à qualifier définitivement l’absence comme excusée ou non excusée.
Retard
Le retard est exprimé en minutes. L’élève est arrivé après le début de la séance.
Le Professeur peut préciser :
La durée du retard ;
Un commentaire pédagogique.
Exemple :
Ahmed est arrivé avec 20 minutes de retard.
Le statut ‘Retard’ est un sous-statut de ‘Présent’. L’élève est considéré comme présent, mais un indicateur de retard est enregistré. La séance est facturée en entier.Le retard est un indicateur d’assiduitéet est pris en compte dans les statistiques d’assiduité.La séance reste facturée en entier au tarif habituel.
Pour les séances en ligne, le statut ‘Présent’ est enregistré si l’élève s’est connecté.
Statut
Description
Facturation
Comptabilisée dans le seuil d’abandon
Présent
L’élève a participé à la séance
Oui
Non
Retard
L’élève est arrivé après le début de la séance (sous-statut de Présent)
Oui (en entier)
Non (un indicateur distinct est comptabilisé)
Absent excusé
Le Parent a prévenu avant la séance
Selon règles du groupe
Non
Absent non excusé
Le Parent n’a pas prévenu
Selon règles du groupe
Oui

14.5 Notifications
Dès validation des présences, GROUPI informe automatiquement le Parent concerné.
Exemple :
Votre enfant Ahmed est marqué Présent à la séance du lundi 15 septembre.
En cas de modification durant les quarante-huit heures autorisées, une nouvelle notification est envoyée.
La notification précise :
L’ancien statut ;
Le nouveau statut ;
La date de modification.

14.6 Impact comptable
La validation des présences peut entraîner automatiquement la création d’écritures comptables.
Le comportement dépend exclusivement des règles définies pour le groupe.
Exemple :
Absence excusée facturée ;
Absence excusée non facturée ;
Absence non excusée facturée.
Le Professeur n’a aucune opération comptable supplémentaire à effectuer.Une écriture comptable n’est générée qu’une seule fois pour une présence validée. Les règles de facturation des absences sont définies lors de la création du groupe.
Une correction de présence entraîne automatiquement l’annulation des écritures comptables précédemment générées et la création des écritures correctives correspondantes, conformément aux règles de facturation du groupe.

14.7 Modification des présences
La fenêtre de modification des présences est alignée sur la fenêtre de modification des séances définie au Chapitre : Les séances. Pendant cette fenêtre de modification, le Professeur peut modifier une présence.
Chaque modification entraîne automatiquement :
Une notification au Parent ;
Une mise à jour du compte de suivicomptable ;
Une mise à jour des statistiques.
Après expiration du délai de quarante-huit heures, aucune modification directe n’est autorisée.
Toute correction ultérieure devra être réalisée sous forme d’un ajustement administratif.
Chaque modification déclenche automatiquement le recalcul des indicateurs d’assiduité.



14.8 Historique
Toutes les présences sont conservées définitivement.Aucune présence n’est supprimée.
GROUPI conserve notamment :
Le statut initial ;
L’ancienne valeur ;
La nouvelle valeur ;
Les dates des modifications ;
L’auteur de chaque modification ;
Le motif de modification ;
Origine de la modification (Application mobile / Web).
Cet historique garantit une traçabilité complète.

14.9 Statistiques
Les présences alimentent automatiquement :
Le tableau de bord du Professeur ;
Le tableau de bord du Parent ;
Les statistiques annuelles.
Parmi les indicateurs calculés figurent notamment :
Nombre total de séances prévues ;
Nombre de séances suivies ;
Taux de présence ;
Nombre d’absences excusées ;
Nombre d’absences non excusées ;
Nombre de retards ;
Taux d’assiduité.
Ces statistiques sont recalculées automatiquement après chaque modification autorisée.
Les statistiques d’assiduité sont calculées : 
(a) depuis le début du groupe, 
(b) depuis le début de l’année académique, 
(c) sur les 30 derniers jours. 
Le Professeur peut choisir la période dans son tableau de bord.

14.10 Détection d’abandon
Chaque groupe possède un seuil d’abandon.Valeur par défaut : 3 absences consécutives non excusées. Le Professeur peut modifier cette valeur lors de la création du groupe ou ultérieurement. Les absences consécutives sont calculées uniquement sur les séances effectivement planifiées. Une séance annulée n’interrompt pas la séquence.
Lorsque ce seuil est atteint, GROUPI affiche une alerte.
Exemple :
Ahmed semble avoir abandonné le groupe.
Le Professeur peut alors :
Contacter le Parent ;
Maintenir l’inscription ;
Suspendre temporairement l’inscription ;
Clôturer définitivement l’inscription.
La décision appartient exclusivement au Professeur.
Dans la version 2, cette détection sera enrichie par un moteur d’intelligence artificielle prenant en compte de nombreux indicateurs (absences, retards, comportement de paiement, fréquence des participations, etc.).

14.11 Registre de présence
L’ensemble des présences constitue le registre officiel de présence du groupe.Ce registre est consultable à tout moment par le Professeur.Il peut être exporté selon les droits associés à son abonnement.
Le registre constitue une preuve historique des participations aux séances.Les exports reflètent toujours l’état courant des présences.

14.12 Cycle de vie
Etat actuel
Etat suivant autorisé
NON_RENSEIGNEE
PRESENT
NON_RENSEIGNEE
ABSENT_EXCUSE
NON_RENSEIGNEE
ABSENT_NON_EXCUSE
NON_RENSEIGNEE
RETARD
PRESENT
PRESENT
PRESENT
ABSENT_EXCUSE
PRESENT
ABSENT_NON_EXCUSE
PRESENT
RETARD
ABSENT_EXCUSE
PRESENT
ABSENT_EXCUSE
ABSENT_NON_EXCUSE
ABSENT_EXCUSE
RETARD
ABSENT_NON_EXCUSE
PRESENT
ABSENT_NON_EXCUSE
ABSENT_EXCUSE
ABSENT_NON_EXCUSE
RETARD
RETARD
PRESENT
RETARD
ABSENT_EXCUSE
RETARD
ABSENT_NON_EXCUSE
PRESENT
VERROUILLEE
ABSENT_EXCUSE
VERROUILLEE
ABSENT_NON_EXCUSE
VERROUILLEE
RETARD
VERROUILLEE

Les transitions entre les statuts de présence sont autorisées uniquement pendant la fenêtre de modification de quarante-huit heures définie au chapitre : Les séances.

14.13 Etats des présences
Code
Etat
Description
ATT-STAT-001
NON_RENSEIGNEE
Présence non encore saisie
ATT-STAT-002
PRESENT
Elève présent
ATT-STAT-003
ABSENT_EXCUSE
Absence justifiée
ATT-STAT-004
ABSENT_NON_EXCUSE
Absence non justifiée
ATT-STAT-005
RETARD
Elève présent avec retard
ATT-STAT-006
VERROUILLEE
Présence définitivement figée

14.14 Indicateurs métier
Nombre total de présences 
Nombre de présents 
Nombre d’absences excusées 
Nombre d’absences non excusées 
Nombre de retards 
Taux de présence 
Taux d’absence 
Taux d’assiduité 
Nombre d’élèves ayant atteint le seuil d’abandon 
Nombre de modifications de présence 
Délai moyen de saisie des présences par le Professeur

14.15 Objets métier concernés
Attendance 
Session 
Student 
Enrollment 
AccountingEntry 
AttendanceHistory 
AttendanceStatus 
AttendanceNotification 
AttendanceStatistics
AttendanceCorrection
AttendanceAlert
AttendanceRegister
AttendanceSignal

14.16 Cas d’erreur
Code
Situation
Résultat attendu
ERR-ATT-001
Présence verrouillée
Modification refusée
ERR-ATT-002
Élève non inscrit au groupe
Saisie impossible
ERR-ATT-003
Séance annulée
Saisie impossible
ERR-ATT-004
Séance non encore commencée
Validation refusée
ERR-ATT-005
Présence déjà validée
Nouvelle validation impossible.
ERR-ATT-006
Présence hors délai de modification
Correction refusée
ERR-ATT-007
Signalement d’absence après le début de la séance
Signalement accepté mais statut laissé à la discrétion du Professeur
ERR-ATT-008
Tentative de modification après verrouillage
Modification refusée, ajustement administratif requis
ERR-ATT-009
Double saisie pour le même élève/séance
Seconde saisie refusée
ERR-ATT-010
Séance en ligne --- absence de connexion
L’élève peut être marqué comme absent
ERR-ATT-011
Tentative de saisie par un autre Professeur
Saisie refusée.
ERR-ATT-012
Inscription suspendue
Présence impossible.
ERR-ATT-013
Inscription archivée
Présence impossible.
ERR-ATT-014
Séance verrouillée
Nouvelle saisie impossible.
ERR-ATT-015
Statut de présence invalide
Enregistrement refusé.
ERR-ATT-016
Retard négatif
Enregistrement refusé.
ERR-ATT-017
Retard supérieur à la durée de la séance
Enregistrement refusé.
ERR-ATT-018
Présence enregistrée après clôture administrative de l’année académique
Modification refusée.
ERR-ATT-019
Signalement d’absence effectué pour une séance annulée
Signalement refusé.
ERR-ATT-020
Présence inexistante
Modification impossible.
ERR-ATT-021
Aucun statut sélectionné
Validation impossible.
ERR-ATT-022
Retard non renseigné (si le statut = Retard)
Enregistrement refusé.

14.17 Notifications
Code
Notification
Destinataire
Priorité
NOT-ATT-001
Présence enregistrée
Parent
Information
NOT-ATT-002
Absence excusée enregistrée
Parent
Important
NOT-ATT-003
Absence non excusée enregistrée
Parent
Important
NOT-ATT-004
Retard enregistré
Parent
Information
NOT-ATT-005
Modification de présence
Parent
Important
NOT-ATT-006
Seuil d’abandon atteint
Professeur
Critique
NOT-ATT-007
Signalement d’absence reçu
Professeur
Important
NOT-ATT-008
Signalement d’absence confirmé
Parent
Information
NOT-ATT-009
Rappel : présences non saisies (J+1)
Professeur
Important
NOT-ATT-010
Présences verrouillées (corrections impossibles)
Professeur
Information
NOT-ATT-011
Absence signalée par le Parent
Professeur
Information
NOT-ATT-012
Taux d’absence élevé (alerte préventive)
Professeur
Important
NOT-ATT-013
Registre de présence exporté
Professeur
Information
NOT-ATT-014
Présences validées
Professeur
Information
NOT-ATT-015
Présences entièrement validées
Parent
Information
NOT-ATT-016
Présence corrigée après ajustement administratif
Parent
Information
NOT-ATT-017
Retard important détecté
Parent
Information
NOT-ATT-018
Seuil de retards atteint
Professeur
Information
NOT-ATT-019
Votre enfant présente plusieurs absences consécutives
Parent
Important

14.18 Evènements métier
Code
Événement
Description
EVT-ATT-001
Présence enregistrée
Un élève est marqué Présent à une séance
EVT-ATT-002
Présence modifiée
Le statut de présence d’un élève est modifié
EVT-ATT-003
Retard enregistré
Un élève est marqué Retard à une séance
EVT-ATT-004
Absence excusée enregistrée
Un élève est marqué Absent excusé
EVT-ATT-005
Absence non excusée enregistrée
Un élève est marqué Absent non excusé
EVT-ATT-006
Seuil d’abandon atteint
Un élève atteint le nombre d’absences consécutives
EVT-ATT-007
Signalement d’absence
Le Parent signale l’absence de son enfant
EVT-ATT-008
Registre exporté
Le Professeur exporte le registre de présence
EVT-ATT-009
Présence en ligne enregistrée
Une présence est enregistrée pour une séance en ligne
EVT-ATT-010
Présences validées
Toutes les présences de la séance sont validées.
EVT-ATT-011
Présence verrouillée
La présence devient définitivement non modifiable.
EVT-ATT-012
Présence corrigée administrativement
Un Super Administrateur réalise un ajustement exceptionnel.
EVT-ATT-013
Statistiques d’assiduité recalculées
GROUPI recalcule automatiquement les indicateurs.
EVT-ATT-014
Ecriture comptable générée
La validation de la présence déclenche une écriture comptable.
EVT-ATT-015
Signalement d’absence traité
Le Professeur qualifie définitivement l’absence signalée.
EVT-ATT-016
Toutes les présences renseignées
Tous les élèves de la séance possèdent désormais un statut.
EVT-ATT-017
Retard important détecté
Le retard dépasse le seuil défini par le Professeur.
EVT-ATT-018
Validation annulée
Avant la validation définitive de la séance, le Professeur remet au moins une présence à l’état NON_RENSEIGNEE.

14.19 Règles métier
Code
Règle
RM-ATT-001
Une présence est enregistrée pour une séance et pour un élève.
RM-ATT-002
Une présence ne peut être saisie que par le Professeur responsable du groupe.
RM-ATT-003
Chaque élève doit obligatoirement recevoir un statut.
RM-ATT-004
Les statuts autorisés sont : Présent, Absent excusé, Absent non excusé, Retard.
RM-ATT-005
Le retard est un indicateur d’assiduité. La séance reste facturée en entier au tarif habituel.
RM-ATT-006
Dès validation des présences, GROUPI informe automatiquement le Parent concerné.
RM-ATT-007
La validation des présences peut entraîner automatiquement la création d’écritures comptables selon les règles du groupe.
RM-ATT-008
Une écriture comptable n’est générée qu’une seule fois pour une présence validée.
RM-ATT-009
Pendant les 48 heures suivant la fin de la séance, le Professeur peut modifier une présence.
RM-ATT-010
Après expiration du délai, aucune modification directe n’est autorisée. Toute correction ultérieure est réalisée sous forme d’ajustement administratif.
RM-ATT-011
Toutes les présences sont conservées définitivement. Aucune présence n’est supprimée.
RM-ATT-012
Les présences alimentent automatiquement les tableaux de bord et les statistiques.
RM-ATT-013
Le seuil d’abandon est fixé par défaut à 3 absences consécutives non excusées. Le Professeur peut modifier ce seuil.
RM-ATT-014
Lorsque le seuil est atteint, GROUPI affiche une alerte. La décision appartient exclusivement au Professeur.
RM-ATT-015
L’ensemble des présences constitue le registre officiel de présence du groupe.
RM-ATT-016
Le Parent peut signaler l’absence de son enfant jusqu’à 24 heures avant le début de la séance via la messagerie intégrée.
RM-ATT-017
Le statut "Retard" est un sous-statut de "Présent". L’élève est considéré comme présent, avec un indicateur de retard.
RM-ATT-018
Les statistiques d’assiduité sont calculées depuis le début du groupe, depuis le début de l’année académique et sur les 30 derniers jours.
RM-ATT-019
Pour les séances en ligne, le Professeur peut indiquer une durée effective de connexion.
RM-ATT-020
Le signalement d’absence effectué par le Parent avant la séance constitue une information transmise au Professeur. Celui-ci reste seul habilité à qualifier définitivement l’absence comme excusée ou non excusée.
RM-ATT-021
Une présence appartient définitivement à une seule séance.
RM-ATT-022
Une présence appartient définitivement à une seule inscription.
RM-ATT-023
Une présence verrouillée ne peut jamais être supprimée.
RM-ATT-024
La désinscription d’un élève n’affecte jamais les présences déjà enregistrées.
RM-ATT-025
Le signalement d’une absence par le Parent ne modifie jamais automatiquement le statut de présence.
RM-ATT-026
Un élève ne peut posséder qu’une seule présence par séance.
RM-ATT-027
Une séance ne peut être validée définitivement que lorsque tous les élèves disposent d’un statut de présence.
RM-ATT-028
Toute modification autorisée d’une présence est historisée avec la date, l’auteur, les anciennes valeurs et les nouvelles valeurs.
RM-ATT-029
Le verrouillage d’une présence est automatique à l’expiration du délai de modification défini au Chapitre Les séances.
RM-ATT-030
Les écritures comptables générées à partir des présences respectent exclusivement les règles de facturation définies pour le groupe.
RM-ATT-031
Le seuil de retards déclenchant une alerte est paramétrable par le Professeur.
RM-ATT-032
Les absences sont calculées uniquement pendant que l’inscription est ACTIVE.










