# PARTIE I - CADRE GENERAL (Chapitres 1 a 4 : Vision, Conventions de nommage, Acteurs, Modele economique)

PARTIE I — CADRE GÉNÉRAL


## CHAPITRE 1 — VISION ET PRÉSENTATION DE GROUPI
1.1 Objet du référentiel
Le présent référentiel fonctionnel constitue le document de référence décrivant le fonctionnement métier de GROUPI.
Il définit :
Les acteurs ; 
Les objets métier ; 
Les règles métier ; 
Les processus fonctionnels ; 
Les règles de calcul ; 
Les contraintes générales ; 
Les évolutions prévues. 
Ce document sert de référence commune aux équipes métier, fonctionnelles, techniques et qualité.
Le présent référentiel constitue la référence fonctionnelle officielle de GROUPI. En cas de divergence entre plusieurs documents (spécifications techniques ou documentation utilisateur), les règles définies dans ce référentiel prévalent. Les évolutions prévues sont décrites dans un chapitre plus tard.

1.2 Contexte
Les cours particuliers occupent une place importante dans le système éducatif tunisien. De nombreux professeurs organisent quotidiennement des séances de soutien pour accompagner les élèves dans leur parcours scolaire.
Malgré cette importance, la gestion de cette activité repose encore très largement sur des outils généralistes ou des méthodes manuelles : cahiers, feuilles Excel, agendas papier, groupes WhatsApp, appels téléphoniques ou encore messages individuels.
Cette organisation présente de nombreuses limites :
Perte ou dispersion des informations ;
Communication difficile avec les parents ;
Suivi complexe des présences et des absences ;
Gestion manuelle des paiements ;
Absence de statistiques fiables ;
Manque de visibilité sur l’activité du professeur ;
Temps important consacré aux tâches administratives au détriment de l’enseignement.
Face à ce constat, il est apparu nécessaire de concevoir une solution spécifiquement adaptée au métier des professeurs de cours particuliers.GROUPI est née de cette réflexion.
1.3 Présentation de GROUPI
GROUPI est une plateforme numérique de gestion des cours particuliers.
Elle a été conçue pour accompagner les professeurs dans la gestion quotidienne de leur activité tout en offrant aux parents une visibilité claire sur le suivi pédagogique et administratif de leurs enfants.
GROUPI ne cherche pas à remplacer les méthodes pédagogiques du professeur (voir 1.10 — Ce que GROUPI n’est pas). Son objectif est d’automatiser les tâches administratives répétitives afin que celui-ci puisse consacrer davantage de temps à l’accompagnement de ses élèves.
La plateforme constitue ainsi un véritable assistant numérique au service du professeur, du parent et, indirectement, de l’élève.GROUPI centralise l’ensemble des informations relatives à l’activité du Professeur dans un environnement unique et sécurisé.

1.4 Mission
La mission de GROUPI est de simplifier et de fiabiliser la gestion des cours particuliers en mettant à disposition des professeurs et des parents une plateforme unique, sécurisée et spécialisée. GROUPI automatise les tâches administratives répétitives afin de permettre aux professeurs de consacrer davantage de temps à l’accompagnement pédagogique de leurs élèves, tout en offrant aux parents une meilleure visibilité sur le suivi scolaire et administratif de leurs enfants.
Pour les professeurs
Mettre à leur disposition un environnement unique leur permettant de gérer simplement et efficacement :
Leurs groupes ;
Leurs élèves ;
Leurs séances ;
Les présences ;
Les commentaires pédagogiques ;
Les paiements ;
Les statistiques et le pilotage de leur activité.
Pour les parents
Offrir un espace sécurisé leur permettant de :
Rechercher un professeur ;
Inscrire leurs enfants dans des groupes ;
Suivre les présences et les absences ;
Consulter les commentaires pédagogiques du professeur ;
Suivre la situation financière de chaque inscription ;
Disposer d’une information claire et actualisée sur le parcours de leurs enfants.
1.5 Vision
GROUPI ambitionne de devenir la plateforme de référence pour la gestion des cours particuliers, en priorité sur le marché tunisien, avec une capacité d’extension internationale à moyen terme.
À moyen terme, la plateforme évoluera afin de répondre également aux besoins des établissements privés de soutien scolaire grâce à une version spécifique.
Cette ambition suppose une base technique et fonctionnelle modulaire, dont les principes sont détaillés dans le paragraphe 1.9.

1.6 Objectifs
GROUPI poursuit notamment les objectifs suivants :
Automatiser les tâches administratives ; 
Fiabiliser le suivi des présences et des paiements ; 
Améliorer la communication entre les professeurs et les parents ; 
Garantir une gestion fiable, traçable, complète et sécurisée des données pédagogiques et administratives ;
Préparer une montée en charge vers une plateforme nationale.

1.7 Bénéficiaires
GROUPI est destinée à :
Professeurs de cours particuliers ; 
Parents ; 
Élèves (indirectement) ; 
Ces trois catégories constituent les bénéficiaires finaux de la plateforme, au sens des utilisateurs pour lesquels GROUPI crée de la valeur. Les rôles internes de gestion et d’exploitation de la plateforme (Administrateur, Super Administrateur) sont décrits au chapitre consacré aux Acteurs.

1.8 Principes fondateurs
GROUPI repose sur les principes suivants :
Une seule source de vérité ; 
Automatisation maximale des tâches répétitives ; 
Aucune suppression des données historiques ;
Séparation entre la gestion pédagogique et la gestion comptable ; 
Indépendance entre les inscriptions ; 
Transparence des règles métier ;
Les règles métier sont appliquées automatiquement par la plateforme afin de limiter les interventions manuelles et de garantir leur application uniforme.

1.9 Valeurs
Le développement de GROUPI repose sur cinq valeurs fondamentales.
Simplicité
L’application doit rester intuitive et accessible, quel que soit le niveau de maîtrise informatique de ses utilisateurs.
Transparence
Chaque acteur doit disposer d’une information claire et fiable. Toute modification importante est communiquée immédiatement aux personnes concernées.
Confiance
GROUPI garantit la fiabilité des informations diffusées sur la plateforme et la légitimité des comptes qui y interagissent.
Traçabilité
GROUPI garantit un suivi fiable et intègre de l’ensemble des activités, décisions et opérations comptables, conformément au principe de non-suppression des données énoncé en dans les principes fondateurs.
Évolutivité
L’architecture fonctionnelle de GROUPI est pensée pour permettre l’ajout de nouvelles fonctionnalités sans remettre en cause les fondations du système.

1.10 Ce que GROUPI n’est pas
Afin d’éviter toute ambiguïté, GROUPI ne constitue pas :
Une plateforme bancaire ou un intermédiaire de paiement entre les parents et les professeurs ;
Un système de gestion pédagogique d’établissement scolaire (LMS) ;
Une plateforme de visioconférence.
Les paiements entre les parents et les professeurs restent réalisés directement entre eux.GROUPI assure uniquement leur suivi comptable.
La plateforme peut néanmoins s’interfacer, dans ses futures versions, avec des solutions de paiement ou de visioconférence lorsque cela apportera une valeur ajoutée aux utilisateurs.
GROUPI n’a pas vocation à remplacer la relation pédagogique entre le Professeur et ses élèves.GROUPI ne prend jamais de décision pédagogique à la place du Professeur.Elle constitue exclusivement un outil de gestion et d’assistance.
Le paiement électronique des abonnements GROUPI des professeurs pourra être intégré dans une version ultérieure. L’intégration d’un système de paiement entre les Parents et les Professeurs fera l’objet d’une décision stratégique indépendante.

1.11 Positionnement
GROUPI est une plateforme métier spécialisée dans la gestion des cours particuliers. Les fonctionnalités décrites dans le présent référentiel correspondent exclusivement à la Version 1 de la plateforme, sauf mention contraire. Conçue initialement pour le marché tunisien, GROUPI s’appuie sur les référentiels officiels nationaux tout en reposant sur une architecture permettant son extension à d’autres pays et à d’autres modèles d’organisation.

1.12 Périmètre fonctionnel de la Version 1
Fonctionnalités incluses :
Gestion des profils (Professeur, Parent, Élève) ;
Gestion des groupes et planning ;
Préinscriptions et inscriptions ;
Séances et présence ;
Comptabilité (suivi, pas paiement) ;
Communication (commentaires, annonces) ;
Abonnements professeurs ;
Exports (sous conditions) ;
Tableaux de bord.
Limites explicites de la V1 :
Pas de paiement électronique entre parents et professeurs ;
Pas de visioconférence intégrée ;
Pas de messagerie instantanée ;
Pas de géolocalisation ;
Pas d’intelligence artificielle ;
Pas d’API publique ;
Pas de gestion multi-établissement ;
Pas de compte élève autonome.
Exclusions structurelles :
GROUPI n’est pas un ERP scolaire, ni une place de marché de cours ;
Il ne remplace pas les décisions pédagogiques du professeur.
Utilisateurs cibles de la V1 (Professeurs, Parents, Administrateurs, Super Admin) et volume prévu.

1.13 Vue d’ensemble métier
GROUPI s’articule autour de deux acteurs principaux : le Professeur et le Parent. Le Professeur crée des Groupes, définit leur planning et y inscrit des Élèves. Le Parent recherche des Groupes, inscrit ses enfants, et suit leur assiduité. Chaque Inscription génère des Séances automatiquement. À l’issue de chaque Séance, le Professeur saisit les Présences, ce qui déclenche automatiquement la Facturation dans le compte de suivi comptable de l’élève. Le Professeur enregistre les Paiements reçus hors plateforme, et le solde est recalculé en temps réel. L’ensemble est piloté par des Tableaux de bord et des Abonnements.

1.14 Cartographie des domaines métier
GROUPI est structuré autour de six domaines fonctionnels qui couvrent l’intégralité du cycle de vie de l’activité d’un professeur de cours particuliers.
Domaine Pédagogique : pilier central de GROUPI. Il orchestre la création des groupes, la génération automatique des séances, la gestion des inscriptions (y compris les préinscriptions), le suivi des présences et les commentaires pédagogiques.
Domaine Comptable : garant de la fiabilité financière. Il tient les comptes de suivi de chaque inscription, génère les écritures de facturation et de paiement, et calcule les soldes et indicateurs de chiffre d’affaires.
Domaine Utilisateurs : socle identitaire de la plateforme. Il gère les comptes, les profils Professeur et Parent, l’authentification, les sessions, la sécurité et le cycle de vie des comptes.
Domaine Commercial : moteur du modèle économique. Il administre les offres d’abonnement, les souscriptions, les renouvellements et les droits d’accès aux fonctionnalités.
Domaine Communication : interface d’échange. Il centralise le centre d’activités, les notifications (email et application), les annonces de groupe et le fil de commentaires entre Professeur et Parent.
Domaine Pilotage & Référentiels : socle commun et aide à la décision. Il fournit les tableaux de bord, les exports, les indicateurs de performance, et les données de référence (matières, niveaux, établissements, villes).

Ces domaines interagissent de manière fluide mais restent indépendants dans leurs responsabilités : par exemple, la validation d’une présence (pédagogique) déclenche automatiquement une écriture comptable (comptable) et une notification (communication).

## CHAPITRE 2 — CONVENTIONS DE NOMMAGE
2.1. Objectif
Le présent chapitre définit les conventions de nommage utilisées dans l’ensemble du projet GROUPI.Ces conventions s’appliquent :
Au référentiel fonctionnel ; 
Aux objets métier ; 
À la base de données ; 
Aux API ; 
Au code source ; 
Aux tests ; 
À la documentation. 
L’objectif est d’assurer une terminologie homogène et une traçabilité complète.

2.2. Langue utilisée
Les intitulés fonctionnels du référentiel sont rédigés en français. 
Les noms techniques (base de données, API, code) sont rédigés en anglais. 
Les acronymes courants (API, RBAC, UUID, JWT, MFA...) sont conservés. 

2.3. Objets métier
Les objets métier sont nommés au singulier et avec une majuscule.
Exemples : User ; TeacherProfile ; ParentProfile ; Student; Group ; Session ; Enrollment ; Payment ; Notification ; AcademicYear
Les objets métier composés utilisent PascalCase (ex: TeacherProfile, ParentProfile, AccountingAccount). 
User représente le compte générique d’un utilisateur (authentification et rôle). TeacherProfile, ParentProfile représentent les données métier spécifiques à un rôle, rattachées à un User. Student est une entité métier autonome, sans compte utilisateur associé en Version 1 ; à ce titre, elle ne suit pas la convention.

2.4. Tables de base de données
Les tables utilisent exclusivement des noms en anglais, au singulier et en snake_case.
Exemples : user; teacher_profile; parent_profile; student; group; session; attendance; payment; notification; academic_year
Les clés primaires composées sont utilisées uniquement pour les tables d’association (ex: subject_level). Elles suivent le format : [table1]id, [table2]id. Les index de base de données suivent le format : idx[table][column].

2.5. Colonnes
Toujours en anglais et en snake_case.
Exemples : created_at; updated_at; deleted_at; first_name; last_name; phone_number; school_level_id; group_id

2.6. Identifiants
Toutes les tables possèdent une clé primaire nommée id, de type UUID.
Toutes les clés étrangères utilisent le nom de l’objet référencé suivi du suffixe _id.
teacher_profile_id 
student_id 
parent_profile_id 
group_id session_id 
subscription_id 
Lorsqu’une relation référence directement le compte générique (par exemple un journal de connexion, indépendant du rôle métier), la clé étrangère utilise user_id.

2.7. Énumérations
Les valeurs d’énumération sont écrites :
en anglais ; 
en MAJUSCULES. 
Exemple :PENDING ;ACTIVE; SUSPENDED; ARCHIVED; COMPLETED

2.8. États métier
Chaque objet métier possède son propre jeu d’états défini par une énumération officielle.
Exemple :EnrollmentStatus ; PENDING_VALIDATION ; ACTIVE; SUSPENDED; COMPLETED; ARCHIVED

2.9. Permissions RBAC
Les permissions suivent le format :GRP_CREATE; GRP_UPDATE; GRP_DELETE; SES_VALIDATE; PAY_CREATE
2.10. Règles métier
Les règles métier sont identifiées par un code unique au format RM-[DOMAINE]-[NUMÉRO].
Exemple :RM-GRP-001; RM-GRP-002; RM-INS-004; RM-CPT-003

2.11. Workflows
Chaque workflow possède un identifiant.
Exemple :WF-INS-001 ; WF-GRP-002 ; WF-PAY-003

2.12. Cas d’erreur
Chaque cas d’erreur possède un identifiant.
Exemple :ERR-GRP-001 ; ERR-INS-002 ; ERR-CPT-005

2.13. Règles de calcul
Les règles de calcul sont identifiées.
Exemple :CAL-PAY-001 ; CAL-ATT-002 ; CAL-CPT-003

2.14. Notifications
Les notifications possèdent un identifiant unique au format NOT-[DOMAINE]-[NUMÉRO].Exemples : NOT-INS-001, NOT-PAR-002, NOT-CPT-003(Cohérent avec les conventions des autres chapitres, ex: NOT-ABO-001)

2.15. API
Les routes REST utilisent :
Anglais ; 
Pluriel ; 
Kebab-case. 
Exemple :/api/groups. /api/students. /api/enrollments. /api/payments
GET Lecture
POST Création
PATCH Modification partielle
DELETE Suppression logique (Soft Delete)
Les API sont versionnées dans l’URL (ex: /api/v1/groups, /api/v2/groups).
« GROUPI privilégie PATCH plutôt que PUT afin de limiter les mises à jour complètes d’objets métier. »

2.16. Variables
Les variables utilisent le camelCase.
Exemples :
teacherId
groupCapacity
attendanceStatus
paymentStatus
createdAt

2.17. Classes
PascalCase. TeacherService. EnrollmentController. PaymentRepository. NotificationManager

2.18. Fichiers
Pour les composants :PascalCase ; TeacherCard.tsx ; PaymentDialog.tsx.
Pour les utilitaires :payment-utils.ts ; date-helper.ts

2.19. Terminologie officielle
Elle évite les synonymes.
Terme officiel
Termes à éviter
Précision
Groupe
Classe, Cours
Ensemble d’élèves inscrits ensemble sur une période donnée.
Séance
Cours
Occurrence ponctuelle dans le temps, rattachée à un Groupe.
Inscription
Adhésion

Préinscription
Réservation

Utilisateur
Membre, Usager

Parent
Client

Professeur
Enseignant, Formateur

Élève
Apprenant

Tarif personnalisé
Remise

Compte
Profil (lorsqu’il s’agit du compte d’authentification)
Désigne exclusivement le compte d’authentification (identifiants, accès).
Liste d’attente
File d’attente

Situation scolaire
Dossier scolaire

Lieu d’enseignement
Salle, Local

Compte de suivi comptable
Solde élève, Portefeuille, Wallet
Désigne exclusivement l’entité comptable liée à une inscription ; à ne pas confondre avec « Compte » (authentification).
Année académique
Année scolaire

Le terme « Cours », dans le langage courant, est parfois utilisé indifféremment pour désigner un Groupe ou une Séance : il est proscrit dans les deux cas au profit du terme officiel correspondant, en fonction du contexte (ensemble d’élèves → Groupe ; occurrence dans le temps → Séance).
Ainsi, dans tout le projet, tout le monde utilise exactement le même vocabulaire.

2.20. Dates et heures
Les dates techniques utilisent le format YYYY-MM-DD.Les dates et heures affichées aux utilisateurs sont présentées selon les conventions tunisiennes.Le fuseau horaire de référence de GROUPI est Africa/Tunis (UTC+1).Tous les horodatages sont stockés en UTC afin de garantir leur cohérence. Ils sont convertis automatiquement dans le fuseau horaire Africa/Tunis lors de leur affichage.

2.21. Préfixes
Préfixe
Signification
RM
Règle métier
EVT
Evènement métier
ERR
Cas d’erreur
CAL
Règle de calcul
NOT
Notification
WF
Workflow
DTO
Data Transfer Object
VO
Value Object
Entity
Entité métier
Enum
Énumération

2.22. Conventions de développement
Les propriétés booléennes utilisent les préfixes is, has ou can selon leur signification.
Les booléens : is_active; is_public; is_archived; has_children ; can_cancel; isValidated ; hasPendingPayment

2.23. Objets métier concernés
User 
TeacherProfile 
ParentProfile 
Student 
Group 
Session 
Enrollment 
Attendance 
Payment 
Notification 
AcademicYear 
Subscription

2.24. Cas d’erreur
Code
Situation
Résultat attendu
ERR-NAM-001
Création d’une nouvelle règle ne respectant pas la convention de nommage
Refus.
ERR-NAM-002
Utilisation d’un terme non officiel dans le référentiel
Correction demandée.
ERR-NAM-003
Création d’un code déjà utilisé (RM, EVT, CAL, ERR...)
Refus.
ERR-NAM-004
Déclaration d’une route API ne respectant pas les conventions REST
Refus.

2.25.Evènements métier
Code
Événement
Description
EVT-NAM-001
Convention de nommage mise à jour
Une convention de nommage du référentiel (Chapitre 2) est ajoutée, modifiée ou supprimée.
EVT-NAM-002
Terminologie officielle modifiée
Un terme de la terminologie officielle (2.19) est ajouté, modifié ou supprimé.




2.26. Règles métier
Code
Règle
RM-NAM-001
Tous les objets métier sont nommés en anglais, au singulier et en PascalCase.
RM-NAM-002
Toutes les tables de base de données utilisent le snake_case au singulier.
RM-NAM-003
Les états métier sont exprimés exclusivement à l’aide d’énumérations officielles.
RM-NAM-004
Les permissions suivent obligatoirement le format [RESOURCE]_[ACTION], où RESOURCE est l’abréviation officielle de la ressource.
RM-NAM-005
Les codes des règles métier, événements, calculs et cas d’erreur sont uniques dans tout le référentiel.
RM-NAM-006
Les routes API utilisent REST, l’anglais, le pluriel et le kebab-case.
RM-NAM-007
La terminologie officielle du référentiel est obligatoire dans toute la documentation, le code et les interfaces utilisateur.
RM-NAM-008
Les dates techniques sont stockées en UTC et affichées selon le fuseau Africa/Tunis.


## CHAPITRE 3 — LES ACTEURS
3.1 Objet
Le présent chapitre décrit les différents acteurs intervenant dans GROUPI, leurs responsabilités, leurs rôles ainsi que les principes généraux de gestion des accès.Les droits d’accès détaillés sont définis dans l’annexeMatrice des PermissionsRBAC.

3.2 Principes
GROUPI repose sur cinq catégories d’acteurs.Chaque compte utilisateur possède un ou plusieurs rôles lui donnant accès aux fonctionnalités correspondant aux permissions qui lui sont attribuées.Les permissions détaillées sont définies dans l’Annexe G : « Matrice des permissions ».
Un Professeur peut également être Parent avec le même compte utilisateur.

3.3 Super Administrateur
Le Super Administrateur est le responsable fonctionnel de GROUPI.Il possède l’ensemble des droits de la plateforme.Son compte est créé directement lors de l’initialisation du système.Le Super Administrateur peut effectuer toutes les opérations d’administration, y compris celles déléguées aux Administrateurs.
Ses principales responsabilités sont notamment :
Créer, modifier, désactiver ou réactiver les Administrateurs ;
Attribuer ou retirer leurs autorisations ;
Valider les Professeurs ;
Valider les Parents ;
Administrer les référentiels métier ;
Gérer les offres commerciales ;
Gérer les abonnements ;
Superviser l’ensemble de la plateforme ;
Consulter tous les tableaux de bord ;
Accéder aux journaux d’audit.
Le tableau de bord du Super Administrateur est exclusivement réservé à ce rôle.Aucun autre utilisateur ne peut y accéder.Le rôle de Super Administrateur est unique.À un instant donné, un seul compte peut posséder ce rôle.En cas de changement de responsable, le rôle est transféré vers un nouveau compte selon les procédures d’administration prévues par GROUPI.

3.4 Administrateur
L’Administrateur agit par délégation du Super Administrateur.Il intervient uniquement dans le périmètre des autorisations qui lui sont attribuées.Les permissions sont configurées individuellement par le Super Administrateur à partir du référentiel officiel des permissions de GROUPI.
Selon ses droits, un Administrateur peut notamment :
Valider les Professeurs ;
Valider les Parents ;
Gérer certains référentiels métier ;
Gérer les abonnements ;
Assurer l’assistance fonctionnelle ;
Consulter certains tableaux de bord ;
Traiter des opérations administratives.
Les permissions exactes sont définies dans la Matrice des permissions (Annexe G : RBAC).Un Administrateur ne peut jamais attribuer ou modifier ses propres permissions.Les Administrateurs sont créés exclusivement par le Super Administrateur. Ils ne sont pas soumis au processus de validation des autres utilisateurs.

3.5 Gestion du cycle de vie d’un Administrateur
Lorsqu’un Administrateur quitte son poste ou perd ses responsabilités, son compte n’est pas supprimé.Le Super Administrateur procède à sa désactivation.
La désactivation :
Interdit toute nouvelle connexion ;
Retire automatiquement les autorisations accordées ;
Conserve l’intégralité de l’historique des actions réalisées.
Si des opérations administratives sont encore en attente (par exemple des validations non traitées), elles sont automatiquement réaffectées à un autre Administrateur ou au Super Administrateur.Cette règle garantit la continuité de fonctionnement de la plateforme.

3.6 Professeur
Le Professeur constitue l’utilisateur principal de GROUPI.
Le Professeur dispose de fonctionnalités différentes selon que son compte est validé ou non (voir le chapitre Cycle de vie des comptes). Une fois validé, il peut notamment gérer ses groupes, ses inscriptions, ses séances, ses présences, ses commentaires pédagogiques et ses paiements, consulter ses tableaux de bord, et exporter ses données selon son abonnement.
Le Professeur reste propriétaire exclusif des groupes qu’il crée.Les données d’un Professeur sont isolées des autres Professeurs sauf intervention exceptionnelle d’un Administrateur ou du Super Administrateur dans le cadre de leurs missions d’assistance ou d’audit.

3.7 Parent
Le Parent crée son compte puis complète son profil.
Il renseigne notamment :
Ses informations personnelles ;
Les profils de ses enfants ;
L’établissement scolaire de chaque enfant.
Le Parent dispose de fonctionnalités différentes selon que son compte est validé ou non (voir le chapitre Cycle de vie des comptes). Une fois validé, il peut notamment rechercher des groupes, inscrire ses enfants, suivre leur parcours pédagogique et leur situation comptable, et communiquer avec les Professeurs.
Le Parent ne peut jamais consulter les informations concernant d’autres familles.Un Parent peut représenter plusieurs élèves.Chaque élève reste rattaché à un seul compte Parent dans la Version 1.

3.8 Élève
Dans la version 1, l’Élève ne possède pas de compte utilisateur.Toutes les interactions avec GROUPI sont réalisées par son Parent.L’Élève est néanmoins un objet métier central de la plateforme.
Il possède notamment :
Son identité ;
Son niveau scolaire ;
Son établissement ;
Ses inscriptions ;
Son historique pédagogique.
Bien que l’Élève ne possède pas de compte en Version 1, il est considéré comme un acteur indirect de la plateforme. Ses besoins guident les évolutions futures.Dans une version ultérieure, un Élève pourra être rattaché à plusieurs comptes Parent (parents séparés, représentants légaux, etc.). Un espace dédié aux élèves pourra également être envisagé.
L’Élève constitue un objet métier indépendant. Son historique est conservé même si son Parent désactive ultérieurement son compte.



3.9 Etat des comptes
Un compte peut être :
PENDING_VALIDATION: Le compte attend sa validation administrative. Un prof attend la validation de son compte avant de commencer à créer ses groupes. Un parent attend la validation de son compte pour pouvoir demander des inscriptions aux groupes.
ACTIVE : compte validé et utilisable.
SUSPENDED : Le compte est temporairement bloqué, généralement pour des raisons administratives (ex : impayé, manquement aux CGU) ou à la demande de l’utilisateur
DISABLED : Un compte peut être désactivé volontairement (demande utilisateur) ou administrativement (initiée par un admin)
ARCHIVED : Compte définitivement retiré de l’exploitation tout en conservant son historique.

3.10 Objets métier concernés
User 
TeacherProfile 
ParentProfile 
Student 
Role 
Permission
AuditLog

3.11Cas d’erreur
Code
Situation
Résultat attendu
ERR-ACC-001
Compte non validé
Accès aux fonctionnalités restreint
ERR-ACC-002
Permissions insuffisantes
Opération refusée
ERR-ACC-003
Compte suspendu
Accès refusé, invitation à contacter l’administration
ERR-ACC-004
Compte désactivé
Connexion impossible
ERR-ACC-005
Transition d’état interdite
Opération refusée
ERR-ACC-006
Tentative d’accès à un groupe dont le professeur propriétaire est désactivé
Les groupes concernés ne sont plus proposés aux nouvelles inscriptions
ERR-ACC-007
Tentative de validation d’un compte déjà validé
Les inscriptions existantes restent accessibles conformément aux règles métier
ERR-ACC-008
Tentative de création d’un second compte avec un identifiant (adresse e-mail ou numéro de téléphone) déjà utilisé
Opération refusée Création refusée

3.12Règles métier
Code
Règle
RM-ACC-001
Un utilisateur possède un seul compte GROUPI.
RM-ACC-002
Un utilisateur peut cumuler plusieurs rôles (Professeur, Parent).
RM-ACC-003
Le Super Administrateur est créé uniquement lors de l’installation.
RM-ACC-004
Un Professeur ne peut utiliser GROUPI qu’après validation.
RM-ACC-005
Un Parent ne peut inscrire un enfant qu’après validation.
RM-ACC-006
Un compte suspendu ne peut plus accéder aux fonctionnalités nécessitant une authentification.
RM-ACC-007
Un compte désactivé ne peut plus être utilisé pour aucune connexion.
RM-ACC-008
Les données d’un compte désactivé ou suspendu sont conservées intégralement.
RM-ACC-009
La désactivation d’un compte entraîne la fermeture immédiate de toutes les sessions actives.
RM-ACC-010
Aucun utilisateur ayant produit des données métier ne peut être supprimé physiquement.
RM-ACC-011
Un compte ne peut jamais être partagé entre plusieurs personnes.
RM-ACC-012
Un Administrateur ne peut jamais attribuer ou modifier ses propres permissions.
RM-ACC-013
Les permissions prennent effet immédiatement après leur modification.
RM-ACC-014
Le rôle de Super Administrateur est unique. À un instant donné, un seul compte peut posséder ce rôle.
RM-ACC-015
Un compte utilisateur ne peut être validé que par un Super Administrateur ou un Administrateur habilité.
RM-ACC-016
La désactivation d’un compte Parent ne supprime pas les profils Élèves associés. Ces derniers peuvent être réaffectés par un Administrateur à un nouveau compte Parent
RM-ACC-017
Une adresse électronique ne peut être associée qu’à un seul compte utilisateur
RM-ACC-018
Un Élève ne peut être rattaché qu’à un seul Parent dans la Version 1
RM-ACC-019
Toute connexion utilisateur est enregistrée dans le journal d’audit (AuditLog).
RM-ACC-020
Toute action métier significative est historisée et rattachée à l’utilisateur qui l’a réalisée.
RM-ACC-021
Les droits d’accès d’un utilisateur sont strictement déterminés par les permissions qui lui sont attribuées.

## CHAPITRE 4 — MODÈLE ÉCONOMIQUE
4.1 Objet
Le présent chapitre décrit le modèle économique de GROUPI, les différentes offres d’abonnement, les règles de capacité ainsi que les évolutions prévues du modèle commercial.

4.2 Principes
Le modèle économique de GROUPI repose sur un principe simple :Les Parents utilisent la plateforme gratuitement tandis que les Professeurs souscrivent un abonnement leur donnant accès aux fonctionnalités de la plateforme selon l’offre choisie.Les abonnements sont personnels et non transférables.Ils permettent au Professeur de gérer son activité tout en bénéficiant d’un accompagnement évolutif.

4.3 Les offres d’abonnement
GROUPI propose trois offres destinées aux Professeurs.Les montants indiqués dans le présent chapitre correspondent à la version actuelle de la politique commerciale et peuvent évoluer sans modifier les règles métier.
Offre Découverte
Offre gratuite dont la durée de validité est de 30 jours calendaires à compter de son activation.
Capacité : 20 inscriptions actives simultanées
Cette offre permet de découvrir les principales fonctionnalités de GROUPI.
Fonctionnalités disponibles :
Gestion des groupes ;
Gestion des élèves ;
Gestion des séances ;
Gestion des présences ;
Gestion comptable des inscriptions ;
Notifications.
Fonctionnalités indisponibles :
Statistiques avancées ;
Exports ;
Fonctionnalités réservées aux offres payantes.


Offre Intermédiaire
Prix : 49 TND
Durée :Abonnement valable jusqu’à la fin de l’année académique concernée.
Capacité : 50 inscriptions actives simultanées.
Fonctionnalités disponibles :
Toutes les fonctionnalités de l’offre Découverte ;
Tableaux de bord avancés ;
Statistiques ;
Exports PDF, Excel et CSV.
Offre Pro
Prix : 99 TND
Durée :Abonnement valable jusqu’à la fin de l’année académique concernée.
Capacité : Illimitée.
Le Professeur bénéficie de l’ensemble des fonctionnalités disponibles sur la plateforme.
Les nouvelles fonctionnalités sont intégrées selon la politique commerciale de GROUPI. Certaines peuvent être réservées exclusivement à l’offre Pro.

4.4 Capacité d’abonnement
Chaque abonnement définit un nombre maximal d’inscriptions actives pouvant être gérées simultanément selon les règles de comptabilisation définies dans les règles métier.L’historique pédagogique et comptable est conservé sans limitation.
Exemple :
Un Professeur dispose d’une offre Découverte.
Situation :18 inscriptions actives et 27 inscriptions clôturées.
La capacité utilisée est de 18 inscriptions actives.
Le Professeur peut donc accepter 2 nouvelles inscriptions.
Le nombre maximal d’inscriptions actives est contrôlé en temps réel lors de toute validation d’inscription.

4.5 Dépassement de capacité
Quelle que soit l’offre, lorsque la capacité maximale est atteinte, aucune nouvelle inscription ne peut être acceptée. Les groupes existants continuent cependant à fonctionner normalement, les séances peuvent être réalisées, et les comptes comptables restent accessibles.
Le Professeur est automatiquement informé lorsque la limite approche ou est atteinte. Il peut alors clôturer des inscriptions devenues inactives, ou souscrire une offre supérieure. Les demandes d’inscription déjà en attente restent inchangées mais ne pourront pas être acceptées tant que la capacité maximale est atteinte. Toute clôture d’inscription libère immédiatement une place disponible.

4.6 Évolution des abonnements
Le Professeur peut changer d’offre à tout moment. Le passage à une offre supérieure prend effet dès l’activation du nouvel abonnement. En cas de retour vers une offre inférieure, le changement est refusé tant que le nombre d’inscriptions actives dépasse la capacité de la nouvelle offre — le Professeur peut alors régulariser sa situation en clôturant des inscriptions devenues inactives, ou en attendant leur expiration naturelle. 
Lorsqu’une fonctionnalité n’est plus disponible dans l’offre active, les données précédemment produites sont conservées mais deviennent uniquement consultables si le Professeur souscrit à nouveau une offre compatible.
Les règles de fin d’abonnement (expiration, renouvellement) sont détaillées dans le paragraphe règles métier.

4.7 Paiement des abonnements
Les abonnements concernent exclusivement la relation entre GROUPI et les Professeurs, indépendamment des paiements réalisés entre les Parents et les Professeurs pour les séances.
Dans la version 1 :
Le paiement des abonnements est effectué directement auprès de GROUPI ;
L’abonnement reste en état PENDING_PAYMENT jusqu’à validation ;
La validation du paiement est réalisée manuellement par un Administrateur autorisé.
Les modalités de paiement sont décrites dans le Chapitre Gestion des abonnements.

4.8 Etat desabonnements
PENDING_PAYMENT : Paiement en attente de validation
ACTIVE : Abonnement actif
SUSPENDED : Suspension temporaire
EXPIRED : Arrivé à échéance
DISABLED : Désactivé
ARCHIVED : Conservé uniquement pour l’historique
Les états d’abonnement sont distincts des états de compte définis au Chapitre 3. Les droits d’accès aux fonctionnalités sont déterminés par l’état de l’abonnement (voir Chapitre Gestion des droits).
En cas de suspension pour non-paiement, GROUPI peut maintenir un accès limité en consultation pendant une période de grâcede 7 jours.La période de grâce débute automatiquement à la date d’expiration de l’abonnement.
4.9 Prévention des abus
L’offre Découverte constitue une offre d’essai : chaque Professeur ne peut en bénéficier qu’une seule fois, et la création de plusieurs comptes dans ce but est interdite. GROUPI peut mettre en œuvre différents mécanismes de contrôle afin de détecter les créations multiples de comptes, notamment :
Numéro de téléphone ;
Adresse électronique ;
Identité validée ;
Vérifications administratives.
En cas de fraude avérée, le Super Administrateur peut notamment refuser la validation du compte, suspendre le compte concerné, ou bloquer définitivement l’accès à la plateforme.

4.10 Évolutions du modèle économique
À partir de la Version 2, GROUPI proposera, en complément des abonnements, des options complémentaires (« Add-ons »).
Les Add-ons permettent au Professeur d’activer uniquement les fonctionnalités dont il a besoin, sans changer d’offre.Ils sont indépendants de l’abonnement principal et peuvent être souscrits ou résiliés individuellement.Les Add-ons ne remplacent jamais l’abonnement principal.
Ils constituent des fonctionnalités complémentaires pouvant être activées indépendamment lorsque les conditions d’éligibilité sont satisfaites.

4.11Exemples de Add-ons
Les Add-ons envisagés comprennent notamment :
Assistant IA pédagogique ; 
Assistant IA de rédaction des commentaires ; 
Détection intelligente des risques d’abandon ; 
Paiement électronique ; 
SMS illimités ; 
Espace de stockage supplémentaire ; 
Signature électronique des documents ; 
Export avancé (Excel, PDF personnalisés) ; 
Synchronisation avec un agenda externe (Google Calendar, Outlook) ; 
Tableau de bord analytique avancé ; 
Multi-professeurs (pour les centres de soutien scolaire). 
Cette liste est indicative et pourra évoluer.
La désactivation d’un Add-on n’entraîne jamais la suppression des données produites.
4.12Compatibilité
Les Add-ons sont compatibles avec les offres payantes.
Certains Add-ons pourront être réservés à une offre minimale.
Exemple :
Add-on IA : disponible à partir de l’offre Intermédiaire ; 
Multi-professeurs : disponible uniquement avec l’offre Pro. 
Les conditions d’éligibilité sont définies par GROUPI.

4.13Tarification
Chaque Add-on possède sa propre tarification.
Les modalités (mensuelles, annuelles ou ponctuelles) sont définies indépendamment de l’abonnement principal.
Le Professeur peut souscrire plusieurs Add-ons simultanément.
Les tarifs sont exprimés en dinars tunisiens (TND).

4.14 Objets métier concernés
Subscription 
SubscriptionPlan 
SubscriptionPayment
SubscriptionTransaction (Version 2)
AddOn (Version 2)
Invoice (Version 2)

4.15Cas d’erreur
Code
Situation
Résultat attendu
ERR-SUB-001
Capacité d’abonnement dépassée
Nouvelles inscriptions refusées
ERR-SUB-002
Paiement refusé
Abonnement non activé
ERR-SUB-003
Retour vers une offre incompatible
Changement refusé
ERR-SUB-004
Offre Découverte déjà utilisée
Nouvelle souscription refusée
ERR-SUB-005
Add-on incompatible avec l’offre active
Activation refusée (Version 2)
ERR-SUB-006
Tentative de souscription à deux abonnements actifs pour la même année académique
Opération refusée
ERR-SUB-007
Fin du délai de grâce
Accès restreint

4.16Evènements métier
Code
Événement
Description
EVT-SUB-001
Abonnement souscrit
Un Professeur souscrit un abonnement (offre Découverte, Intermédiaire ou Pro)
EVT-SUB-002
Paiement validé
Le paiement de l’abonnement est validé par un Administrateur
EVT-SUB-003
Offre modifiée
Le Professeur change d’offre d’abonnement
EVT-SUB-004
Capacité atteinte
Le nombre d’inscriptions actives atteint la limite de l’abonnement
EVT-SUB-005
Abonnement expiré
L’abonnement du Professeur arrive à expiration. Pour l’offre Découverte, ce passage déclenche la bascule en mode Lecture Seule
EVT-SUB-006
Add-on activé (Version 2)
Un Professeur active une option complémentaire
EVT-SUB-007
Abonnement suspendu
L’abonnement du Professeur est suspendu

4.17Règles métier
Code
Règle
RM-SUB-001
Les abonnements concernent uniquement les Professeurs.
RM-SUB-002
Les Parents utilisent GROUPI gratuitement.
RM-SUB-003
Les abonnements sont personnels et non transférables.
RM-SUB-004
L’offre Découverte est gratuite et d’une durée de 30 jours calendaires.
RM-SUB-005
L’offre Découverte ne peut être utilisée qu’une seule fois par Professeur.
RM-SUB-006
L’offre Découverte permet de gérer jusqu’à 20 inscriptions actives simultanées. Le dépassement de cette capacité suit le régime générique décrit en 4.5 (blocage des nouvelles inscriptions uniquement).
RM-SUB-007
L’offre Intermédiaire permet de gérer jusqu’à 50 inscriptions actives simultanées.
RM-SUB-008
L’offre Pro permet de gérer un nombre illimité d’inscriptions actives.
RM-SUB-009
Une inscription est comptabilisée lorsqu’elle est dans un état considéré comme actif conformément au chapitre des inscriptions.
RM-SUB-010
Les inscriptions clôturées ou archivées ne sont pas comptabilisées dans la capacité.
RM-SUB-011
Lorsque la capacité maximale est atteinte, aucune nouvelle inscription ne peut être acceptée.
RM-SUB-012
Le passage à une offre supérieure prend effet dès l’activation du nouvel abonnement.
RM-SUB-013
Le retour vers une offre inférieure est refusé si le nombre d’inscriptions actives dépasse la capacité de la nouvelle offre.
RM-SUB-014
L’offre Découverte ne donne pas accès aux statistiques avancées.
RM-SUB-015
L’offre Découverte ne donne pas accès aux exports.
RM-SUB-016
L’offre Découverte ne donne pas accès aux fonctionnalités réservées aux offres payantes.
RM-SUB-017
L’abonnement du Professeur n’est jamais reconduit automatiquement : il expire à son échéance (RM-SUB-024) si le Professeur ne souscrit pas activement un nouvel abonnement. Ce non-renouvellement n’entraîne ni remboursement partiel, ni suppression des données du Professeur.
RM-SUB-018
Les paiements des abonnements sont totalement indépendants des paiements réalisés entre les Parents et les Professeurs pour les séances.
RM-SUB-019
La création de plusieurs comptes pour bénéficier de plusieurs offres Découverte est interdite.
RM-SUB-020
À l’expiration de l’offre Découverte, le compte Professeur bascule en mode « Lecture Seule ». Il peut consulter ses données historiques, mais ne peut plus créer de nouvelles séances ou accepter de nouvelles inscriptions tant qu’un abonnement payant n’est pas souscrit.
RM-SUB-021
Le système peut proposer automatiquement au Professeur la clôture d’une inscription lorsqu’aucune séance n’a été enregistrée depuis trois mois (paramétrable). La décision finale appartient toujours au Professeur.
RM-SUB-022
La suspension d’un abonnement pour impayé entraîne une restriction des fonctionnalités (création et acceptation bloquées) mais ne supprime pas l’accès en consultation pendant un délai de grâce de 7 jours.
RM-SUB-023
Un Professeur ne peut posséder qu’un seul abonnement actif par année académique.
RM-SUB-024
Tout abonnement expire automatiquement à la fin de son année académique.
RM-SUB-025
Le renouvellement d’un abonnement crée un nouvel abonnement pour l’année académique suivante.
RM-SUB-026
Un abonnement souscrit en cours d’année académique expire à la fin de la même année. Le tarif est calculé selon les règles commerciales définies par GROUPI.







