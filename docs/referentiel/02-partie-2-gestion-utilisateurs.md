# PARTIE II - GESTION DES UTILISATEURS (Chapitres 5 a 9 : Profil Professeur, Profil Parent, Situation scolaire, Cycle de vie des comptes, Authentification/Sessions/Securite)

PARTIE II — GESTION DES UTILISATEURS

## CHAPITRE 5 — LE PROFIL PROFESSEUR
5.1 Objet
Le profil Professeur regroupe l’ensemble des informations professionnelles utilisées par GROUPI pour identifier le Professeur, permettre sa recherche par les Parents, contrôler les règles métier et personnaliser les fonctionnalités de la plateforme.

5.2 Principes
Le profil Professeur constitue le profil professionnel officiel du Professeur au sein de GROUPI.
Il regroupe l’ensemble des informations permettant :
La validation du compte ;
La recherche par les Parents ;
La création des groupes ;
Le calcul des indicateurs de qualité ;
La personnalisation des fonctionnalités.
Le Professeur peut compléter son profil progressivement.Certaines informations sont obligatoires, d’autres facultatives.

5.3 Informations obligatoires
Le compte peut être validé lorsque les informations obligatoires suivantes sont renseignées :
Informations obligatoires
Nom 
Prénom 
Téléphone 
Ville 
Au moins une matière 
Au moins un niveau 
Informations complémentaires
Biographie 
Photo 
Expérience 
Disponibilités 
Lieux d’enseignement 
Dans la Version 1, le Professeur peut déposer ses diplômes, mais leur vérification n’est pas réalisée.La vérification officielle des diplômes pourra être introduite dans une version ultérieure.

5.4 Vérification des matières et niveaux
Le Professeur ne peut enseigner que des combinaisons Matière / Niveau figurant dans le référentiel SubjectLevel.Lorsqu’il ajoute une nouvelle matière ou un nouveau niveau, GROUPI vérifie automatiquement la compatibilité grâce au référentiel SubjectLevel.Toute combinaison interdite est refusée.
Exemple :
Matière
Niveau
Résultat
Mathématiques
Bac Sciences
✔
Mathématiques
Bac Lettres
✘
Cette vérification garantit la cohérence pédagogique de la plateforme.
La vérification est réalisée lors :
De la création du profil ; 
De la modification du profil ; 
De la création d’un groupe.

5.5 Score de complétude
GROUPI calcule automatiquement un score de complétude du profil.Ce score reflète le niveau d’enrichissement du profil.Le calcul du score est entièrement automatique.

Exemple :
Élément
Statut
Nom
✔
Téléphone
✔
Ville
✔
Photo
✘
Biographie
✘
Expérience
✔
Score : 67 %
Le tableau de bord encourage le Professeur à améliorer son profil.Ce score n’influence pas la validation du compte. Le score de complétude n’est jamais visible par les Parents. Le score est utilisé en interne par GROUPI pour les campagnes d’incitation à la complétion du profil.
Les modalités de calcul du score peuvent évoluer sans remettre en cause les règles métier.

5.6 Visibilité du profil
GROUPI distingue :
Informations publiques
Nom et Prénom 
Ville 
Matières 
Niveaux 
Biographie 
Photo 
Expérience
Lieux d’enseignement
Disponibilités
Informations privées
Téléphone 
Historique 
Abonnement 
Tableaux de bord
Diplôme

5.7 Validation des modifications
Certaines modifications nécessitent une nouvelle validation.
Exemples :
Ajout d’une nouvelle matière ;
Ajout d’un nouveau niveau.
Ces modifications restent en attente jusqu’à validation par le Super Administrateur ou par un Administrateur autorisé.Les autres informations peuvent être modifiées librement et prennent effet immédiatement.Tant qu’une modification est en attente de validation, les informations précédemment validées continuent d’être utilisées par GROUPI.Les modifications refusées n’empêchent pas le Professeur de continuer à utiliser son profil actuellement validé.
5.8 Évolution du profil
Le profil du Professeur évolue tout au long de son activité.Les nouvelles informations, les groupes créés, l’expérience acquise et les indicateurs calculés par GROUPI viennent progressivement enrichir ce profil.
Les futures versions de la plateforme pourront utiliser ces informations afin de proposer :
Des recommandations pédagogiques ;
Des suggestions tarifaires plus précises ;
Des indicateurs de qualité ;
Des outils d’aide à la décision.
Le Professeur conserve toutefois la maîtrise de ses choix et de son organisation.

5.9 Objets métier concernés
User 
TeacherProfile 
Subject 
SchoolLevel 
SubjectLevel 
TeachingLocation
City
Diploma (dépôt en V1, vérification non implémentée)

5.10 Cas d’erreur
Code
Situation
Résultat attendu
ERR-TPR-001
Matière interdite pour ce niveau
Ajout refusé
ERR-TPR-002
Niveau incompatible avec les matières
Ajout refusé
ERR-TPR-003
Profil incomplet
Validation impossible
ERR-TPR-004
Modification en attente de validation
Opération différée
ERR-TPR-005
Professeur non validé
Création de groupe impossible
ERR-TPR-006
Abonnement expiré
Fonctionnalités restreintes
ERR-TPR-007
Suppression de la dernière matière du profil
Opération refusée
ERR-TPR-008
Suppression du dernier niveau du profil
Opération refusée
ERR-TPR-009
Tentative de création d’un groupe avec une matière ou un niveau en attente de validation
Création refusée

5.11Notifications
Code
Notification
Destinataire
Priorité
NOT-TPR-001
Profil validé
Professeur
Important
NOT-TPR-002
Nouvelle matière validée
Professeur
Information
NOT-TPR-003
Modification de profil refusée
Professeur
Important
NOT-TPR-004
Profil en attente de validation
Professeur
Information
NOT-TPR-005
Nouveau niveau validé
Professeur
Information

5.12Evènements métier
Code
Événement
Description
EVT-TPR-001
Profil Professeur créé
Le Professeur crée son profil professionnel
EVT-TPR-002
Profil Professeur modifié
Le Professeur modifie les informations de son profil
EVT-TPR-003
Nouvelle matière ajoutée
Le Professeur ajoute une matière à son profil
EVT-TPR-004
Nouveau niveau ajouté
Le Professeur ajoute un niveau à son profil
EVT-TPR-005
Profil Professeur validé
Le profil du Professeur est validé par un Administrateur
EVT-TPR-006
Modification de profil validée
Une modification de profil (matière/niveau) est validée
EVT-TPR-007
Modification de profil refusée
Une modification de profil (matière/niveau) est refusée

5.13Règles métier
Code
Règle
RM-TPR-001
Le profil minimum d’un Professeur comprend : nom, prénom, téléphone, ville, au moins une matière, au moins un niveau.
RM-TPR-002
Les matières et niveaux sont obligatoirement sélectionnés dans les référentiels officiels de GROUPI.
RM-TPR-003
Toute modification des matières nécessite une validation administrative.
RM-TPR-004
Toute modification des niveaux nécessite une validation administrative.
RM-TPR-005
Tant qu’une modification est en attente de validation, les informations précédemment validées continuent d’être utilisées.
RM-TPR-006
Le Professeur ne peut enseigner que des combinaisons Matière/Niveau autorisées par SubjectLevel.
RM-TPR-007
Le Professeur doit toujours disposer, d’au moins une matière et d’au moins un niveau, validés.
RM-TPR-008
La vérification SubjectLevel est effectuée lors de la création du profil, de la modification du profil et de la création d’un groupe.
RM-TPR-009
Le score de complétude est recalculé automatiquement après chaque modification du profil.
RM-TPR-010
Le score de complétude n’influence pas la validation du compte.
RM-TPR-011
Le score de complétude n’est jamais visible par les Parents.
RM-TPR-012
Le dépôt d’un diplôme est disponible dès la Version 1 mais reste facultatif et non vérifié. La vérification officielle des diplômes sera introduite dans une version ultérieure.
RM-TPR-013
Les informations suivantes sont publiques : Nom et prénom, ville, matières, niveaux, biographie, photo, expérience, lieux d’enseignement, Disponibilités.
RM-TPR-014
Les informations suivantes sont privées : téléphone, historique, abonnement, tableaux de bord, diplôme.
RM-TPR-015
Seul le Professeur ou un Administrateur autorisé peut modifier les informations du profil professionnel.

## CHAPITRE 6 — LE PROFIL PARENT
6.1 Objet
Le présent chapitre décrit le profil Parent, les informations qui le composent, la gestion des enfants ainsi que les règles de confidentialité applicables.

6.2 Principes
Le Parent est l’interlocuteur principal entre sa famille et les Professeurs des groupes auxquels ses enfants sont inscrits.
Il utilise GROUPI pour :
Inscrire ses enfants dans des groupes ;
Suivre leur parcours pédagogique ;
Consulter leur situation comptable ;
Communiquer avec les Professeurs.
Le Parent peut gérer plusieurs enfants à partir d’un seul compte utilisateur.Toutes les informations sont organisées par enfant afin de garantir un suivi individualisé.
Le Parent peut contacter un Professeur via la messagerie intégrée après validation d’une demande d’inscription.

6.3 Création du compte
Le Parent crée lui-même son compte.
Après création, il complète son profil avant validation par un Administrateur.
Tant que le compte n’est pas validé, l’accès du Parent aux fonctionnalités de GROUPI reste limité, conformément aux règles définies dans le chapitre Cycle de vie des comptes.

6.4 Informations obligatoires
Les informations obligatoires nécessaires à la validation du compte sont définies dans les règles métier. Elles permettent aux Professeurs d’identifier le Parent lors des demandes d’inscription.

6.5 Gestion des enfants
Le Parent crée le profil de chacun de ses enfants, en renseignant son nom, son prénom, ainsi que son niveau scolaire et son établissement initiaux. Cette déclaration initiale donne lieu à la création de la première situation scolaire de l’élève (voir Chapitre La Situation Scolaire), qui seule porte ces informations et leurs évolutions ultérieures.La classe scolaire permet au Professeur de mieux connaître l’environnement scolaire de l’élève et facilite la constitution de groupes homogènes. Il s’agit toutefois d’une information indicative : elle ne modifie jamais le niveau scolaire officiel utilisé par GROUPI pour contrôler les règles métier et les inscriptions.
Toute évolution ultérieure du niveau scolaire, de l’établissement ou de la classe scolaire est gérée via la situation scolaire de l’élève, selon les règles définies au chapitre La Situation Scolaire.
Chaque enfant constitue un objet métier indépendant. Il possède notamment : ses inscriptions, ses présences, ses commentaires pédagogiques, ses comptes comptables, son historique.
Toutes les informations restent séparées entre les enfants d’une même famille. Un Parent ne peut pas créer deux profils représentant le même enfant.

6.6 Cycle de vie d’un profil élève
Le Parent peut créer un profil, modifier les informations, ou archiver un profil lorsque l’élève ne fréquente plus aucun groupe.
Un profil Élève n’est jamais supprimé dès lors qu’il possède un historique pédagogique ou comptable, et peut être réactivé à tout moment tant que les conditions métier le permettent.

6.7 Les établissements scolaires
L’établissement scolaire est obligatoirement sélectionné dans le référentiel officiel de GROUPI, sans saisie libre. Cette règle garantit l’uniformité des données et facilite les recherches ainsi que les statistiques.
Si l’établissement recherché n’est pas présent dans la liste, le Parent peut transmettre une demande d’ajout à GROUPI. Après vérification, un Administrateur peut ajouter le nouvel établissement au référentiel, ou refuser la demande si elle est incorrecte ou si l’établissement existe déjà.
Le Parent est informé de la décision et peut, le cas échéant, compléter le profil de son enfant. Les établissements sont partagés par l’ensemble de la plateforme. Une demande d’ajout d’établissement reste en attente tant qu’elle n’a pas été traitée par un Administrateur.

6.8 Visibilité
Les informations qu’un Professeur peut consulter sur un élève, ainsi que celles qui lui restent inaccessibles, sont définies dans les règles métier.
Le Professeur ne peut consulter les informations d’un élève qu’à partir du moment où celui-ci possède une inscription active ou passée dans l’un de ses groupes. Les informations d’un Élève cessent d’être accessibles au Professeur lorsque les droits d’accès ou les règles de conservation ne le permettent plus.

6.9 Validation du compte
Le compte Parent est validé par un Administrateur, après vérification des informations obligatoires et absence de fraude avérée. Les fonctionnalités accessibles avant et après validation sont détaillées dans le chapitre Cycle de vie des comptes.
6.10 Gestion de plusieurs enfants
Un Parent peut gérer un nombre illimité d’enfants (voir règles de métier et paragraphe Gestion des enfants pour le détail des informations propres à chacun). Les tableaux de bord présentent les informations séparément pour chaque enfant afin d’éviter toute confusion.

6.11 Confidentialité
Le Parent accède uniquement aux informations concernant ses propres enfants et ne peut jamais consulter les données d’une autre famille. Cette règle garantit la confidentialité des données personnelles et pédagogiques : les données d’un enfant ne sont jamais visibles par un autre Parent, même si les enfants appartiennent au même groupe.

6.12 Règles de gestion
Le Parent peut demander la désactivation de son compte. GROUPI procède alors à la désactivation du compte, à l’arrêt des connexions, et à la conservation des données nécessaires au suivi pédagogique, comptable et aux obligations légales.
Les profils des enfants et leurs historiques restent conservés. Le Parent est informé des conséquences de cette demande avant sa validation.

6.13 Évolution du profil
Le profil Parent évolue automatiquement au fil de son utilisation de GROUPI.
Au fur et à mesure des inscriptions, des paiements et des interactions avec les Professeurs, GROUPI enrichit son historique.
Les versions futures pourront proposer de nouveaux services destinés aux Parents, tout en conservant le principe fondamental d’un compte unique permettant de gérer l’ensemble des enfants d’une même famille.En Version 2, un élève pourra être rattaché à plusieurs comptes Parent (ex. : parents séparés), avec des droits d’accès différenciés.

6.14Droits des Parents sur leurs données
Conformément à la réglementation en vigueur, le Parent dispose des droits suivants :
Droit d’accès : Le Parent peut consulter l’ensemble des données le concernant ainsi que ses enfants.
Droit de rectification : Le Parent peut modifier les informations de son profil et de ses enfants.
Droit à l’effacement : le Parent peut demander la suppression de son compte, sous réserve des obligations légales de conservation applicables.

6.15Objets métier concernés
User 
ParentProfile 
Student 
EducationalInstitution
SchoolLevel 
AcademicYear
Enrollment
Group
StudentSchoolSituation

6.16Cas d’erreur
Code
Situation
Résultat attendu
ERR-PAR-001
Compte Parent non validé
Inscription impossible
ERR-PAR-002
Établissement inexistant
Sélection impossible
ERR-PAR-003
Profil enfant incomplet
Enregistrement refusé
ERR-PAR-004
Compte désactivé
Connexion impossible
ERR-PAR-005
Enfant déjà inscrit dans ce groupe
Nouvelle demande refusée
ERR-PAR-006
Demande d’établissement déjà soumise
Nouvelle demande refusée
ERR-PAR-007
Tentative de consultation des données d’un autre Parent
Accès refusé
ERR-PAR-008
Enfant déjà archivé
Archivage impossible
ERR-PAR-009
Demande d’inscription d’un enfant archivé
Opération refusée

6.17Notifications
Code
Notification
Destinataire
Priorité
NOT-PAR-001
Compte Parent validé
Parent
Important
NOT-PAR-002
Nouvel établissement accepté
Parent
Information
NOT-PAR-003
Demande d’établissement refusée
Parent
Information
NOT-PAR-004
Enfant ajouté au profil
Parent
Information
NOT-PAR-005
Situation scolaire à mettre à jour
Parent
Important
NOT-PAR-006
Profil enfant incomplet
Parent
Important
NOT-PAR-007
Demande d’inscription acceptée
Parent
Important
NOT-PAR-008
Demande d’inscription refusée
Parent
Important
NOT-PAR-009
Nouveau commentaire pédagogique
Parent
Information
NOT-PAR-010
Absence non justifiée détectée
Parent
Important
NOT-PAR-011
Compte Parent désactivé
Parent
Critique

6.18Evènements métier
Code
Événement
Description
EVT-PAR-001
Compte Parent créé
Le Parent crée son compte
EVT-PAR-002
Compte Parent validé
Le compte Parent est validé par un Administrateur
EVT-PAR-003
Enfant ajouté
Le Parent ajoute un enfant à son profil
EVT-PAR-004
Enfant modifié
Le Parent modifie les informations d’un enfant
EVT-PAR-005
Situation scolaire mise à jour
Le Parent met à jour la situation scolaire d’un enfant
EVT-PAR-006
Établissement demandé
Le Parent demande l’ajout d’un établissement scolaire
EVT-PAR-007
Enfant archivé
Le Parent archive le profil d’un enfant
EVT-PAR-008
Enfant réactivé
Le Parent réactive un profil archivé
EVT-PAR-009
Compte désactivé
Le compte Parent est désactivé (à la demande du Parent ou par GROUPI)

6.19Règles métier
Code
Règle
RM-PAR-001
Les informations suivantes sont nécessaires pour la validation du compte Parent : nom, prénom, téléphone, ville.
RM-PAR-002
Le Parent peut gérer un nombre illimité d’enfants.
RM-PAR-003
Les informations propres au profil de l’enfant sont : nom, prénom. Le niveau scolaire, l’établissement et la classe scolaire sont déclarés par le Parent lors de la création du profil et gérés ensuite via la situation scolaire de l’élève (voir Chapitre La Situation Scolaire), qui seule fait foi sur ces informations.
RM-PAR-004
L’établissement scolaire est obligatoirement sélectionné dans le référentiel officiel de GROUPI.
RM-PAR-005
Aucune saisie libre d’établissement scolaire n’est autorisée.
RM-PAR-006
Les établissements sont partagés par l’ensemble de la plateforme.
RM-PAR-007
Le Professeur peut consulter : l’identité de l’élève (nom, prénom), ainsi que le niveau, la classe scolaire et l’établissement issus de sa situation scolaire active.
RM-PAR-008
Le Professeur ne voit jamais l’historique des autres enfants, les autres groupes ou les comptes comptables des autres inscriptions.
RM-PAR-009
Un profil Élève n’est jamais supprimé dès lors qu’il possède un historique pédagogique ou comptable.
RM-PAR-010
La classe scolaire constitue une information indicative. Elle ne modifie jamais le niveau scolaire officiel.
RM-PAR-011
Le Parent ne peut jamais consulter les informations concernant d’autres familles.
RM-PAR-012
Un Parent peut représenter plusieurs élèves. Chaque élève reste rattaché à un seul compte Parent dans la Version 1. L’association à plusieurs Parents est prévue en Version 2.
RM-PAR-013
Le compte Parent est validé après vérification des informations obligatoires par un Administrateur.
RM-PAR-014
Le Parent est informé lorsque la capacité maximale du Professeur est atteinte. La demande d’inscription peut être refusée ou mise en attente conformément aux règles de gestion des inscriptions.
RM-PAR-015
Le profil élève archivé peut être réactivé à tout moment par le Parent.
RM-PAR-016
Un Parent ne peut pas créer deux profils représentant le même enfant.
RM-PAR-017
La désactivation d’un compte Parent n’entraîne jamais la suppression des données pédagogiques ou comptables des enfants.
RM-PAR-018
Le Professeur ne peut consulter les informations d’un élève que si celui-ci est ou a été inscrit dans l’un de ses groupes.



## CHAPITRE 7 — LA SITUATION SCOLAIRE
7.1 Objet
Le présent chapitre décrit la situation scolaire de l’élève, son cycle de vie ainsi que son utilisation par les différents processus de GROUPI.

7.2Principes
La situation scolaire représente l’ensemble des informations décrivant la scolarité actuelle d’un élève.Elle permet à GROUPI de connaître précisément le contexte scolaire dans lequel évolue l’élève.Une situation scolaire est toujours rattachée à un seul élève.
Un élève possède une seule situation scolaire active à un instant donné.La situation scolaire est toujours rattachée à une année académique.Un élève peut donc posséder plusieurs situations scolaires successives correspondant à différentes années académiques.
Toute demande d’inscription nécessite une situation scolaire active pour l’élève concerné, sur l’année académique correspondante. Une situation scolaire ne peut être modifiée que tant qu’elle est active. Une situation clôturée devient consultable uniquement.
Une situation scolaire est créée pour une seule année académique et ne peut jamais être réutilisée pour une année académique différente.

7.3Informations
Une situation scolaire comprend notamment :
L’année académique ; 
Le niveau scolaire (référentiel officiel GROUPI); 
L’établissement scolaire ; 
La classe scolaire (information indicative); 
La date de début de validité ; 
La date de fin de validité (le cas échéant)
Statut (Active, Clôturée). 

7.4 Évolution
Une nouvelle situation scolaire est créée notamment lors :
De la création du profil de l’élève (première déclaration du Parent) ;
Du passage à une nouvelle année académique ;
D’un changement de niveau scolaire ;
D’un changement d’établissement ;
D’un redoublement ;
D’une réorientation.
La création d’une nouvelle situation entraîne automatiquement la clôture de la précédente. Les anciennes situations deviennent automatiquement historiques.
La création initiale de la situation scolaire et la mise à jour de routine associée au passage d’année sont déclarées par le Parent et deviennent actives automatiquement, sous réserve de la vérification de cohérence âge/niveau. Les autres cas (changement d’établissement, redoublement, réorientation, ou changement de niveau hors progression standard) restent soumis à validation par un Administrateur : tant que la validation est en attente, la situation scolaire précédemment validée continue d’être utilisée par GROUPI, et les inscriptions en cours ne sont pas affectées.

7.5 Historique
GROUPI conserve toutes les situations scolaires successives.
Aucune situation n’est supprimée.
Cela permet notamment :
De suivre le parcours scolaire ; 
D’interpréter correctement les anciens groupes ; 
De conserver la cohérence des statistiques. 
Les groupes suivis, les inscriptions et les statistiques restent rattachés à la situation scolaire qui était active au moment des faits.Les situations historiques restent consultables mais ne peuvent plus être modifiées.Les situations scolaires historiques restent consultables par le Parent et les Administrateurs autorisés.Les situations scolaires historiques restent également disponibles pour les traitements statistiques de GROUPI.

7.6 Utilisation
La situation scolaire est utilisée par plusieurs fonctionnalités.
La situation scolaire est utilisée pour :
Rechercher des groupes ; 
Proposer des groupes adaptés ; 
Constituer des groupes homogènes ; 
Préparer la nouvelle année académique ; 
Vérifier l’éligibilité d’un élève lors d’une demande d’inscription ;
Établir les statistiques pédagogiques ; 
Analyser les évolutions de l’élève au fil des années.


7.7Mise à jour de la situation scolaire en début d’année académique
Le Parent est invité à mettre à jour la situation scolaire de son enfant au début de chaque année académique.GROUPI peut lui rappeler cette opération.
La mise à jour de la situation scolaire est obligatoire pour que l’élève puisse effectuer de nouvelles inscriptions pour l’année académique suivante. Sans mise à jour, les recherches de groupes et les demandes d’inscription sont bloquées.
Tant que la situation scolaire n’est pas mise à jour pour la nouvelle année académique, les fonctionnalités dépendant de la situation scolaire sont limitées, selon les règles de GROUPI.

7.8Objets métier concernés
Student 
ParentProfile
StudentSchoolSituation
AcademicYear 
EducationalInstitution
SchoolLevel

7.9Cas d’erreur
Code
Situation
Résultat attendu
ERR-SCH-001
Niveau scolaire obligatoire non renseigné
Enregistrement refusé
ERR-SCH-002
Établissement inexistant
Sélection impossible
ERR-SCH-003
Deux situations scolaires actives
Création refusée
ERR-SCH-004
Année académique invalide
Situation rejetée
ERR-SCH-005
Situation scolaire non active
Inscription impossible
ERR-SCH-006
Aucune situation active pour l’année académique
Inscription refusée
ERR-SCH-007
Situation scolaire en attente de validation
Modifications non prises en compte temporairement
ERR-SCH-008
Tentative de modification d’une situation clôturée
Modification refusée
ERR-SCH-009
Chevauchement de périodes entre deux situations scolaires
Création refusée
ERR-SCH-010
Situation scolaire déjà clôturée
Clôture refusée

7.10Notifications
Code
Notification
Destinataire
Priorité
NOT-SCH-001
Nouvelle année académique disponible
Parent
Information
NOT-SCH-002
Situation scolaire mise à jour
Parent
Information
NOT-SCH-003
Situation scolaire en attente de mise à jour
Parent
Important
NOT-SCH-004
Situation scolaire expirant (J-15)
Parent
Important
NOT-SCH-005
Situation scolaire expirée - Inscriptions bloquées
Parent
Critique
NOT-SCH-006
Modification de la situation scolaire validée
Parent
Information
NOT-SCH-007
Incohérence âge/niveau détectée
Administrateur
Important
NOT-SCH-008
Modification de situation scolaire refusée
Parent
Information
NOT-SCH-009
Incohérence âge/niveau détectée
Parent
Information

7.11Evènements métier
Code
Événement
Description
EVT-SCH-001
Situation scolaire créée
Une nouvelle situation scolaire est créée pour un élève
EVT-SCH-002
Demande de modification de situation scolaire
Une situation scolaire existante est modifiée
EVT-SCH-003
Situation scolaire clôturée
Une situation scolaire est clôturée (passage à une nouvelle)
EVT-SCH-004
Nouvelle année académique
Une nouvelle année académique est créée dans GROUPI
EVT-SCH-005
Situation scolaire expirée
Une situation scolaire arrive à sa date de fin de validité
EVT-SCH-006
Incohérence détectée
Une incohérence entre âge et niveau est détectée
EVT-SCH-007
Situation scolaire validée
Un Administrateur valide une modification de situation
EVT-SCH-008
Modification de situation scolaire refusée
Une modification de situation scolaire est refusée par un Administrateur



7.12Règles métier
Code
Règle
RM-SCH-001
Une situation scolaire est toujours rattachée à un seul élève.
RM-SCH-002
Un élève possède une seule situation scolaire active à un instant donné.
RM-SCH-003
Une situation scolaire est toujours rattachée à une année académique.
RM-SCH-004
Une nouvelle situation scolaire est créée notamment lors : de la création du profil de l’élève, du passage à une nouvelle année académique, d’un changement de niveau, d’un changement d’établissement, d’un redoublement, d’une réorientation.
RM-SCH-005
GROUPI conserve toutes les situations scolaires successives.
RM-SCH-006
Aucune situation scolaire n’est supprimée.
RM-SCH-007
Les groupes suivis, les inscriptions et les statistiques restent rattachés à la situation scolaire qui était active au moment des faits.
RM-SCH-008
Le Parent est invité à mettre à jour la situation scolaire de son enfant au début de chaque année académique.
RM-SCH-009
Toute demande d’inscription nécessite une situation scolaire active pour l’élève concerné, sur l’année académique correspondante.
RM-SCH-010
En cas de changement de situation en cours d’année, les inscriptions existantes restent rattachées à l’ancienne situation.
RM-SCH-011
La mise à jour de routine de la situation scolaire (passage à une nouvelle année académique avec progression de niveau attendue, sans changement d’établissement) est déclarée par le Parent et devient active automatiquement, sous réserve de la vérification de cohérence âge/niveau.
RM-SCH-012
Les autres cas de modification --- changement d’établissement, redoublement, réorientation, ou changement de niveau ne correspondant pas à une progression standard --- sont soumis à validation par un Administrateur.
RM-SCH-013
Tant qu’une modification est en attente de validation, la situation scolaire précédemment validée continue d’être utilisée par GROUPI.
RM-SCH-014
Une situation scolaire clôturée est figée définitivement. Aucune opération de modification, de réouverture ou de suppression n’est autorisée. Toute correction d’une situation scolaire clôturée nécessite la création d’une nouvelle situation scolaire ou, à titre exceptionnel, une intervention d’un Administrateur autorisé, obligatoirement tracée dans le journal d’audit.
RM-SCH-015
Les périodes de validité de deux situations scolaires d’un même élève ne peuvent jamais se chevaucher.
RM-SCH-016
Toute nouvelle situation scolaire devient la situation scolaire active après sa validation, le cas échéant.
RM-SCH-017
Une situation scolaire active peut être clôturée uniquement lors de la création d’une nouvelle situation scolaire ou par une opération administrative exceptionnelle.
RM-SCH-018
Une situation scolaire est créée pour une seule année académique et ne peut jamais être réutilisée pour une autre année académique.
RM-SCH-019
GROUPI vérifie la cohérence entre l’âge de l’élève et son niveau scolaire lors de toute création ou modification de situation scolaire. Une alerte est générée en cas d’incohérence significative
RM-SCH-020
La création initiale d’une situation scolaire, lors de l’inscription du Parent, suit le même régime automatique que la mise à jour de routine, sous réserve de la vérification de cohérence âge/niveau


## CHAPITRE 8 — CYCLE DE VIE DES COMPTES
8.1 Objet
Le présent chapitre décrit les différents états d’un compte utilisateur, les transitions autorisées entre ces états ainsi que les conséquences fonctionnelles de chaque changement d’état.

8.2 Principes
Tout compte utilisateur de GROUPI suit un cycle de vie.
Les différents états garantissent la sécurité de la plateforme, la traçabilité des opérations et la conservation des données métier.Les états sont mutuellement exclusifs : un compte ne peut se trouver que dans un seul état à un instant donné.Le changement d’état d’un compte n’entraîne jamais la suppression des données produites par l’utilisateur. Les comptes Administrateur sont créés par le Super Administrateur qui leur accorde les permissions nécessaires à leur travail.
Selon son évolution, un compte peut être :
PENDING_VALIDATION : En attente de validation ;
Le compte a été créé mais n’a pas encore été validé.
L’utilisateur peut :
Se connecter ; 
Compléter son profil. 
Il ne peut pas accéder aux fonctionnalités nécessitant un compte validé.
ACTIVE : Actif ;
Le compte est validé.
Toutes les fonctionnalités correspondant aux rôles de l’utilisateur sont disponibles.
SUSPENDED : Suspendu ;
Le compte reste existant mais certaines fonctionnalités sont temporairement bloquées.
Exemples :
Abonnement expiré ; 
Fraude présumée ; 
Demande administrative. 
La suspension est réversible.
DISABLED : Désactivé ;
Le compte n’est plus utilisable.Aucune connexion n’est possible.Les données restent conservées.

ARCHIVED : Archivé (en Version 2) ;
Le compte est définitivement clôturé.Les données restent conservées conformément aux obligations légales et aux règles d’historisation.Aucune réactivation n’est prévue.
Chaque changement d’état est historisé.
Les transitions possibles sont :
État actuel
État suivant autorisé
En attente
Actif
Actif
Suspendu
Suspendu
Actif
Actif
Désactivé
Suspendu
Désactivé
Désactivé
Archivé (Version 2)

Toute autre transition est interdite.

8.3 Validation des Professeurs
La validation constitue une étape obligatoire.
Avant validation, le Professeur peut :
Compléter son profil ;
Préparer ses informations.
Il ne peut pas :
Créer de groupes ;
Accepter des inscriptions ;
Utiliser les fonctionnalités réservées aux comptes actifs.
Après validation, il accède aux fonctionnalités correspondant à son abonnement.

8.4 Validation des Parents
Avant validation, le Parent peut :
Compléter son profil ;
Enregistrer ses enfants ;
Sélectionner leurs établissements scolaires.

Après validation, il peut :
Rechercher des groupes ;
Envoyer des demandes d’inscription ;
Consulter les informations concernant ses enfants ;
Accéder à ses tableaux de bord.

8.5Processus de validation des comptes
Type de compte
Validé par
Conditions
Parent
Administrateur
Informations obligatoires renseignées, absence de fraude, profil conforme
Professeur
Administrateur
Informations obligatoires renseignées, absence de fraude, au moins une matière, au moins un niveau, contrôle de la cohérence des combinaisons Matière/Niveau avec le référentiel SubjectLevel de GROUPI

Le compte Administrateur est créé par le Super Administrateur donc n’a pas de validation. Le compte Super Administrateur est créé dans l’application donc n’a pas de validation.

8.6 Suspension
Le Super Administrateur ou un Administrateur autorisé peut suspendre un compte.
La suspension peut intervenir notamment dans les cas suivants :
Non-paiement de l’abonnement GROUPI (abonnement expiré);
Fraude détectée ;
Utilisation abusive de la plateforme ;
Non-respect des conditions générales d’utilisation ;
Demande de l’utilisateur ;
Demande du SuperAdmin.
Pendant la suspension :
Les données restent accessibles aux Administrateurs ; 
Leshistoriques de données restent conservées ;
Aucune suppression n’est effectuée ;
Les fonctionnalités sont limitées ou bloquées selon le motif de suspension.
L’utilisateur est immédiatement informé selon les canaux de communication de GROUPI.
Le changement d’état concerne le compte utilisateur dans son ensemble.Un compte suspendu devient indisponible pour tous les rôles qui lui sont associés.La suspension ne modifie jamais les rôles attribués à l’utilisateur.La suspension est réversible. Lors de la réactivation, le compte retrouve automatiquement son état ACTIVE, ses rôles, ses permissions et ses données sans modification.

8.7 Désactivation
Un compte peut être désactivé à la demande de son titulaire ou par décision administrative.
La désactivation entraîne :
La fermeture de toutes les sessions actives;
L’impossibilité de toute nouvelle connexion ;
La conservation intégrale des données métier ;
La conservation des historiques pédagogiques et comptables.
Lorsque la désactivation résulte d’une demande du titulaire ou d’une décision administrative réversible, une réactivation peut être autorisée conformément aux procédures internes de GROUPI.La réactivation restitue automatiquement les rôles précédemment attribués.

8.8 Demande de suppression d’un compte
Un utilisateur peut demander la suppression de son compte.
GROUPI distingue deux situations :
Aucun historique métier
Si le compte ne possède aucun historique pédagogique, administratif ou comptable, la suppression peut être réalisée.
Présence d’un historique métier
Lorsque le compte possède un historique (inscriptions, présences, commentaires, écritures comptables, validations ou autres données métier), la suppression physique n’est pas autorisée.
Dans ce cas, GROUPI applique une procédure d’anonymisation conforme aux obligations légales applicables.
Cette procédure peut notamment :
Supprimer ou anonymiser les données personnelles non indispensables ;
Désactiver définitivement le compte ;
Conserver les historiques pédagogiques, comptables et statistiques nécessaires à la cohérence de la plateforme.
Cette approche garantit simultanément :
Le respect des droits des utilisateurs ;
La conservation des historiques métier ;
La traçabilité des opérations.
Lorsqu’une anonymisation est réalisée, les identifiants techniques utilisés par les historiques restent inchangés.

8.9 Archivage (évolution future)
Les futures versions de GROUPI intégreront un mécanisme d’archivage automatique.
L’archivage concernera notamment les comptes devenus inactifs pendant une période prolongée.
Les critères précis (durée d’inactivité, absence d’inscription active, ancienneté des données, obligations légales de conservation, etc.) seront définis par la politique d’archivage de GROUPI.
Un compte archivé :
Ne pourra plus être utilisé normalement ;
Conservera l’ensemble de son historique ;

8.10 Historisation
Toutes les opérations importantes relatives au cycle de vie des comptes sont historisées.
GROUPI conserve notamment :
Les dates de création ;
Les validations ;
Les suspensions ;
Les réactivations ;
Les désactivations ;
Les demandes de suppression ;
Les opérations d’anonymisation ;
Lesopérations d’archivage.
Cette historisation garantit la transparence, la traçabilité et la sécurité de la plateforme.

8.11 Objets métier concernés
User 
UserStatus
Role
Permission
AuditLog

8.12Cas d’erreur
Code
Situation
Résultat attendu
ERR-CYC-001
Compte suspendu
Accès refusé
ERR-CYC-002
Compte désactivé
Connexion impossible
ERR-CYC-003
Compte non validé
Fonctionnalités restreintes
ERR-CYC-004
Transition d’état interdite
Opération refusée
ERR-CYC-005
Tentative de réactivation d’un compte archivé (Version 2)
Réactivation impossible
ERR-CYC-006
Tentative de suppression physique d’un compte possédant un historique
Suppression refusée. Procédure d’anonymisation proposée
ERR-CYC-007
Compte en attente de validation depuis plus de 30 jours
Notification automatique à l’Administrateur
ERR-CYC-008
Compte archivé - tentative de connexion (Version 2)
Connexion refusée

8.13Notifications
Code
Notification
Destinataire
Priorité
NOT-CYC-001
Compte validé
Utilisateur
Important
NOT-CYC-002
Compte suspendu
Utilisateur
Critique
NOT-CYC-003
Compte réactivé
Utilisateur
Important
NOT-CYC-004
Compte en attente de validation (rappel J-7)
Utilisateur
Information
NOT-CYC-005
Compte en attente de validation (rappel J-30)
Utilisateur
Information
NOT-CYC-006
Compte archivé (Version 2)
Utilisateur
Important
NOT-CYC-007
Données personnelles anonymisées
Utilisateur
Critique
NOT-CYC-008
Suppression du compte refusée
Utilisateur
Important
NOT-CYC-009
Compte désactivé suite à une demande de suppression
Utilisateur
Information
NOT-CYC-010
Compte désactivé
Utilisateur
Critique

8.14Evènements métier
Code
Événement
Description
EVT-CYC-001
Compte créé
Un nouvel utilisateur crée son compte GROUPI
EVT-CYC-002
Compte validé
Un Administrateur valide le compte d’un utilisateur
EVT-CYC-003
Compte suspendu
Un compte utilisateur est suspendu
EVT-CYC-004
Compte réactivé
Un compte suspendu est réactivé
EVT-CYC-005
Compte désactivé
Un compte utilisateur est désactivé définitivement
EVT-CYC-006
Permissions modifiées
Les autorisations d’un Administrateur sont modifiées
EVT-CYC-007
Compte anonymisé
Les données personnelles d’un utilisateur sont anonymisées conformément aux règles de conservation des données, tout en préservant les historiques métier.
EVT-CYC-008
Compte archivé (Version 2)
Le compte est placé en archivage définitif afin de préserver son historique tout en le retirant de l’utilisation courante.
EVT-CYC-009
Demande de suppression déposée
L’utilisateur demande la suppression de son compte.
EVT-CYC-010
Suppression refusée
La suppression est refusée en raison de la présence d’un historique métier.
EVT-CYC-011
Transition d’état refusée
Une tentative de changement d’état non autorisée a été rejetée.

8.15Règles métier
Code
Règle
RM-CYC-001
Le changement d’état d’un compte n’entraîne jamais la suppression des données produites par l’utilisateur.
RM-CYC-002
Les transitions possibles sont : En attente → Actif, Actif → Suspendu, Suspendu → Actif, Actif → Désactivé, Suspendu → Désactivé, Désactivé → Archivé (Version 2).
RM-CYC-003
Toute autre transition que celles définies est interdite.
RM-CYC-004
Chaque changement d’état est historisé.
RM-CYC-005
Avant validation, le Professeur peut compléter son profil et consulter son tableau de bord.
RM-CYC-006
Avant validation, le Professeur ne peut pas créer de groupes, accepter des inscriptions ou utiliser les fonctionnalités réservées.
RM-CYC-007
Avant validation, le Parent peut compléter son profil, enregistrer ses enfants et sélectionner leurs établissements.
RM-CYC-008
Avant validation, le Parent ne peut pas rechercher des groupes, envoyer des demandes d’inscription ou consulter les informations pédagogiques.
RM-CYC-009
La suspension peut intervenir notamment en cas de non-paiement de l’abonnement, de fraude, d’utilisation abusive ou de non-respect des conditions générales.
RM-CYC-010
Pendant la suspension, les données restent accessibles aux Administrateurs et les historiques sont conservés.
RM-CYC-011
Un compte suspendu devient indisponible pour tous les rôles qui lui sont associés.
RM-CYC-012
La désactivation entraîne : fermeture des sessions, impossibilité de se connecter, conservation des données métier.
RM-CYC-013
Lorsqu’un compte possède un historique métier, la suppression physique n’est pas autorisée. Seule l’anonymisation est possible.
RM-CYC-014
L’utilisateur est immédiatement informé de toute suspension ou désactivation selon les canaux de communication de GROUPI.
RM-CYC-015
Un compte utilisateur ne peut se trouver que dans un seul état à un instant donné. Les états PENDING_VALIDATION, ACTIVE, SUSPENDED, DISABLED et ARCHIVED sont mutuellement exclusifs.
RM-CYC-016
La suspension ne modifie jamais les rôles attribués au compte.
RM-CYC-017
La réactivation restitue automatiquement les rôles précédemment attribués.
RM-CYC-018
Une opération d’anonymisation ne modifie jamais les identifiants techniques utilisés par les historiques.
RM-CYC-019
Un compte archivé ne peut jamais être réactivé.
RM-CYC-020
L’expiration d’un abonnement entraîne la suspension automatique du compte Professeur après un délai de grâce de 7 jours.
RM-CYC-021
Pendant la suspension, les fonctionnalités de création, modification et acceptation sont bloquées. La consultation reste possible.
RM-CYC-022
Les Administrateurs sont créés exclusivement par le Super Administrateur. Ils ne sont pas soumis au processus de validation des autres utilisateurs.
RM-CYC-023
Les critères d’archivage d’un compte sont définis par la politique d’archivage de GROUPI. Une période prolongée d’inactivité constitue un critère possible mais ne déclenche pas automatiquement l’archivage.
RM-CYC-024
La validation d’un compte Parent ou Professeur est effectuée par un Administrateur autorisé.
RM-CYC-025
Un compte en attente de validation depuis plus de 30 jours est automatiquement signalé à un Administrateur.
RM-CYC-026
Toute tentative de transition vers un état non autorisé est refusée et enregistrée dans le journal d’audit.
RM-CYC-027
Tout changement d’état rendant le compte indisponible (SUSPENDED, DISABLED ou ARCHIVED) entraîne immédiatement l’invalidation de l’ensemble des sessions actives et des jetons d’authentification.
RM-CYC-028
Les rôles attribués à un utilisateur sont conservés lors d’une suspension ou d’une désactivation. Seul l’état du compte détermine les fonctionnalités accessibles.
RM-CYC-029
Toute modification de l’état d’un compte enregistre automatiquement : - la date, - l’auteur, - l’ancien état, - le nouvel état, - le motif, - le commentaire éventuel.
RM-CYC-030
Le compte Super Administrateur ne peut jamais être désactivé, suspendu, anonymisé ou archivé depuis l’application.
RM-CYC-031
Les changements d’état d’un compte sont atomiques : une transition est soit entièrement appliquée, soit totalement annulée en cas d’erreur.
RM-CYC-032
Les notifications liées à un changement d’état sont émises uniquement après la validation complète de la transition et l’enregistrement réussi de celle-ci dans le journal d’audit.
RM-CYC-033
Toute transition d’état est réalisée dans une transaction garantissant la cohérence entre l’état du compte, les sessions actives, les jetons d’authentification, le journal d’audit et les notifications.


## CHAPITRE 9 — AUTHENTIFICATION, SESSIONS ET SÉCURITÉ
9.1 Objet
Le présent chapitre décrit les mécanismes d’authentification, de gestion des sessions, de protection des comptes utilisateurs et de détection des comportements de connexion inhabituels.

9.2. Authentification
Chaque utilisateur accède à GROUPI au moyen de :
Son adresse e-mail ; 
Son mot de passe personnel. 
L’adresse e-mail constitue l’identifiant unique du compte.
L’authentification vérifie également l’état du compte utilisateur. Selon cet état, l’accès peut être autorisé, restreint ou refusé conformément au cycle de vie des comptes.
État du compte
Authentification
Résultat
PENDING_VALIDATION
Autorisée
Accès limité aux fonctionnalités disponibles avant validation.
ACTIVE
Autorisée
Accès complet selon les rôles et permissions attribués.
SUSPENDED
Refusée
Aucune session n’est créée. L’utilisateur est informé de la suspension de son compte.
DISABLED
Refusée
Aucune session n’est créée.
ARCHIVED (Version 2)
Refusée
Aucune session n’est créée. Le compte ne peut plus être utilisé.

9.3. Politique des mots de passe
Le mot de passe doit respecter les exigences minimales définies par GROUPI.
Les exigences de complexité des mots de passe sont définies dans la politique de sécurité de GROUPI et peuvent évoluer sans modification du présent référentiel.Les mots de passe sont stockés exclusivement sous forme de hachage cryptographique sécurisé conforme à la politique de sécurité de GROUPI.Ils ne sont jamais accessibles aux administrateurs.



9.4. Mot de passe oublié
Le Professeur ou le Parent peut demander la réinitialisation de son mot de passe.

La procédure est la suivante :
Demande de réinitialisation ; 
Envoi d’un lien sécurisé par e-mail ; 
Définition d’un nouveau mot de passe. 
Le lien possède :
Une durée de validité limitée ; 
Un usage unique. 
La demande de réinitialisation invalide automatiquement tous les liens de réinitialisation précédemment émis.La réinitialisation du mot de passe invalide automatiquement toutes les sessions actives de l’utilisateur.

9.5. Première connexion
Lors de la première connexion, GROUPI peut demander :
La vérification de l’adresse e-mail ; 
L’acceptation des conditions d’utilisation. 
Tant que la vérification de l’adresse e-mail ou l’acceptation obligatoire des conditions d’utilisation n’ont pas été réalisées, les fonctionnalités concernées restent indisponibles.

9.6. Sessions
Chaque connexion crée une session utilisateur.
La session expire automatiquement :
Après une période d’inactivité de 30 minutes ;
Après une déconnexion volontaire. 
L’utilisateur peut fermer toutes ses sessions depuis son profil.Une session expirée nécessite une nouvelle authentification.Un utilisateur peut disposer simultanément de plusieurs sessions actives sur différents appareils.
Toute suspension, désactivation ou archivage du compte invalide immédiatement l’ensemble des sessions actives.Toute réinitialisation du mot de passe invalide également l’ensemble des sessions actives.

9.7. Détection des connexions inhabituelles
GROUPI enregistre notamment : la date, l’heure, l’adresse IP, le navigateur, l’appareil utilisé.Ces éléments contribuent, avec les indices de partage de compte décrits en 9.8, au calcul d’un score de risque unique par utilisateur (voir RM-SEC-013). Lorsqu’une connexion inhabituelle est détectée, GROUPI peut automatiquement appliquer des mesures de sécurité complémentaires proportionnées au niveau de risque, et notifier immédiatement l’utilisateur.Les informations de localisation restent approximatives et ne constituent jamais une preuve de fraude. La détection repose sur des indicateurs de risque et ne constitue jamais une preuve d’utilisation frauduleuse.

9.8. Partage de compte
Les comptes GROUPI sont strictement personnels. Le partage volontaire d’un compte est interdit.
Plusieurs indices, combinés à ceux détaillés en 9.7, alimentent le score de risque global de l’utilisateur. Par exemple :
Connexions simultanées depuis deux villes éloignées ;
Alternance très rapide entre plusieurs appareils ;
Nombre inhabituellement élevé de connexions quotidiennes ;
Changement inhabituel de fuseau horaire ;
Échec répété des authentifications ;
Changement fréquent de navigateur ;
Utilisation simultanée de plusieurs adresses IP incompatibles avec une utilisation normale ;
Connexions impossibles géographiquement (Tunis à 9h00 puis Sfax à 9h20).
Chaque événement contribue au calcul du score de risque global de l’utilisateur (voir RM-SEC-013).
En cas de risque élevé, GROUPI peut :
Envoyer un e-mail d’alerte ;
Demander une nouvelle authentification ;
Suspendre temporairement la session ;
Alerter un Administrateur.





9.9. Authentification à deux facteurs (Version 2)
La Version 2 pourra proposer une authentification renforcée.
Exemple :
Code reçu par e-mail ; 
Application d’authentification ; 
SMS. 
Le Professeur pourra l’activer depuis son profil.

9.10. Journal des connexions
Chaque utilisateur peut consulter l’historique de ses connexions.
Pour chaque connexion :
Date ; 
Heure ; 
Appareil ; 
Navigateur ; 
Localisation approximative. 
Il pourra également déconnecter un appareil qu’il ne reconnaît pas.
Le journal est consultable uniquement par le propriétaire du compte ainsi que par les Administrateurs autorisés dans le cadre de leurs missions de sécurité.Les anciennes sessions peuvent être consultées mais ne peuvent jamais être supprimées par l’utilisateur.Les journaux de connexion sont horodatés et ne peuvent être modifiés par les utilisateurs et sont conservés conformément à la politique de conservation des données de GROUPI.

9.11. Déconnexion forcée
Le Super Administrateur peut invalider toutes les sessions d’un utilisateur en cas :
De suspicion de compromission ; 
De demande du titulaire ;
De perte d’un appareil ; 
De fraude ; 
De suspension du compte.
Après une déconnexion forcée :
Toutes les sessions deviennent invalides ; 
Une nouvelle authentification est obligatoire.
9.12. Verrouillage du compte
Après plusieurs tentatives d’authentification échouées, GROUPI peut :
Retarder les nouvelles tentatives ; 
Verrouiller temporairement le compte ; 
Notifier l’utilisateur.
Le verrouillage temporaire est levé automatiquement à l’issue du délai prévu ou après intervention d’un Administrateur autorisé. Le compte n’est pas suspendu.

9.13. Sécurité des comptes Administrateur
Les comptes Administrateur bénéficient de mesures de sécurité renforcées :
Authentification à deux facteurs obligatoire (Version 2)
Mots de passe d’au moins 16 caractères
Journalisation exhaustive de toutes les actions administratives
Sessions expirant après 30 minutes d’inactivité
Impossibilité de partager les sessions entre plusieurs personnes
Accès restreint aux données strictement nécessaires (principe du moindre privilège)
Les comptes Administrateur ne peuvent jamais partager une même session.

9.14 Objets métier concernés
User 
UserSession
UserDevice
LoginHistory
PasswordResetToken
SecurityEvent
RiskScore

9.15Cas d’erreur
Code
Situation
Résultat attendu
ERR-SEC-001
Mot de passe incorrect
Authentification refusée
ERR-SEC-002
Compte verrouillé (trop d’échecs)
Authentification temporairement bloquée
ERR-SEC-003
Lien de réinitialisation expiré
Nouvelle demande requise
ERR-SEC-004
Session expirée
Réauthentification requise
ERR-SEC-005
Compte suspendu
Authentification refusée
ERR-SEC-006
Compte suspecté de partage
Suspension temporaire, demande de vérification
ERR-SEC-007
Lien de réinitialisation utilisé sur IP différente de la demande
Authentification renforcée requise
ERR-SEC-008
Trop de changements de mot de passe (attaque par fatigue)
Changement temporairement bloqué
ERR-SEC-009
Connexion depuis un pays non autorisé (si restriction géographique)
Connexion refusée
ERR-SEC-010
Compte non validé
Authentification autorisée mais fonctionnalités restreintes.
ERR-SEC-011
Session invalidée
Nouvelle authentification requise.
ERR-SEC-012
Adresse e-mail non vérifiée
Accès limité
ERR-SEC-013
Conditions d’utilisation non acceptées
Accès limité
ERR-SEC-014
Jeton d’authentification invalide
Nouvelle authentification requise

9.16Notifications
Code
Notification
Destinataire
Priorité
NOT-SEC-001
Connexion inhabituelle détectée
Utilisateur
Critique
NOT-SEC-002
Réinitialisation du mot de passe demandée
Utilisateur
Important
NOT-SEC-003
Mot de passe modifié avec succès
Utilisateur
Information
NOT-SEC-004
Déconnexion forcée
Utilisateur
Critique
NOT-SEC-005
Compte verrouillé (trop d’échecs)
Utilisateur
Critique
NOT-SEC-006
Tentative de connexion depuis un nouvel appareil
Utilisateur
Important
NOT-SEC-007
Compte déconnecté suite à une connexion suspecte
Utilisateur
Critique
NOT-SEC-008
Nouveau mot de passe validé
Utilisateur
Information
NOT-SEC-009
Échec de connexion multiple depuis un nouvel appareil
Utilisateur
Important
NOT-SEC-010
Sécurité du compte renforcée (2FA activé)
Utilisateur
Information
NOT-SEC-011
Nouveau navigateur détecté
Utilisateur
Information
NOT-SEC-012
Compte déverrouillé automatiquement
Utilisateur
Information

9.17Evènements métier
Code
Événement
Description
EVT-SEC-001
Connexion réussie
Un utilisateur se connecte avec succès
EVT-SEC-002
Connexion échouée
Une tentative de connexion échoue
EVT-SEC-003
Déconnexion
Un utilisateur se déconnecte
EVT-SEC-004
Mot de passe modifié
Un utilisateur modifie son mot de passe
EVT-SEC-005
Mot de passe réinitialisé
Un utilisateur réinitialise son mot de passe
EVT-SEC-006
Connexion inhabituelle
Une connexion suspecte est détectée
EVT-SEC-007
Session expirée
Une session utilisateur expire automatiquement
EVT-SEC-008
Compte verrouillé
Un compte est verrouillé après plusieurs échecs
EVT-SEC-009
Déconnexion forcée
Le Super Administrateur force la déconnexion d’un utilisateur
EVT-SEC-010
Score de risque élevé
Un score de risque > 70 est détecté pour un compte
EVT-SEC-011
2FA activée (Version 2)
Un utilisateur active l’authentification à deux facteurs
EVT-SEC-012
Appareil inconnu détecté
Une connexion est effectuée depuis un appareil jamais utilisé
EVT-SEC-013
Nouvel appareil reconnu
Un nouvel appareil est associé au compte utilisateur après authentification réussie.
EVT-SEC-014
Compte verrouillé automatiquement
Le compte est verrouillé après dépassement du nombre maximal de tentatives d’authentification.
EVT-SEC-015
Lien de réinitialisation expiré
Le lien de réinitialisation n’est plus valide car sa durée de validité est dépassée.
EVT-SEC-016
Toutes les sessions invalidées
Toutes les sessions actives de l’utilisateur sont invalidées à la suite d’une opération de sécurité.

9.18Règles métier
Code
Règle
RM-SEC-001
L’adresse e-mail constitue l’identifiant unique du compte.
RM-SEC-002
Les mots de passe sont stockés sous forme hachée.
RM-SEC-003
Les mots de passe ne sont jamais accessibles aux administrateurs.
RM-SEC-004
La demande de réinitialisation du mot de passe invalide automatiquement tous les liens de réinitialisation précédemment émis.
RM-SEC-005
Le lien de réinitialisation possède une durée de validité limitée et un usage unique.
RM-SEC-006
Chaque connexion crée une session utilisateur.
RM-SEC-007
La session expire automatiquement après une période d’inactivité ou après une déconnexion volontaire.
RM-SEC-008
Les comptes GROUPI sont strictement personnels. Le partage volontaire d’un compte est interdit.
RM-SEC-009
Après plusieurs tentatives d’authentification échouées, GROUPI peut retarder les nouvelles tentatives, verrouiller temporairement le compte ou notifier l’utilisateur.
RM-SEC-010
Le Super Administrateur peut invalider toutes les sessions d’un utilisateur en cas de demande du titulaire, de suspicion de compromission, de perte d’un appareil, de fraude ou de suspension du compte.
RM-SEC-011
Les sessions expirent après 30 minutes d’inactivité.
RM-SEC-012
Les comptes Administrateur sont soumis à des exigences de sécurité renforcées dès la Version 1 (mots de passe d’au moins 16 caractères, journalisation exhaustive, non-partage de session, principe du moindre privilège). L’authentification à deux facteurs, également prévue pour ces comptes, sera disponible en Version 2.
RM-SEC-013
Le score de risque d’un compte est calculé sur une échelle de 0 à 100, à partir des indices de connexions inhabituelles et de partage de compte. Un score > 70 génère une alerte.
RM-SEC-014
Toute connexion depuis un nouvel appareil génère une notification à l’utilisateur.
RM-SEC-015
Les liens de réinitialisation de mot de passe ont une validité de 15 minutes.
RM-SEC-016
Après 5 tentatives de connexion échouées consécutives, le compte est verrouillé pour 15 minutes.
RM-SEC-017
La modification du mot de passe entraîne la déconnexion de toutes les sessions actives.
RM-SEC-018
Les Administrateurs ne peuvent pas consulter les mots de passe des utilisateurs.
RM-SEC-019
La réinitialisation du mot de passe invalide immédiatement toutes les sessions actives.
RM-SEC-020
Un utilisateur peut disposer simultanément de plusieurs sessions actives sur différents appareils.
RM-SEC-021
Les événements de sécurité sont conservés conformément à la politique de conservation des journaux de GROUPI.
RM-SEC-022
Les mécanismes de détection produisent uniquement des indicateurs de risque et ne constituent jamais une preuve de fraude.
RM-SEC-023
Une session invalidée nécessite systématiquement une nouvelle authentification.
RM-SEC-024
Toute authentification vérifie préalablement l’état du compte utilisateur.
RM-SEC-025
Les sessions utilisateur sont indépendantes les unes des autres et possèdent chacune un identifiant unique.
RM-SEC-026
Toute authentification réussie est enregistrée dans le journal des connexions.
RM-SEC-027
Toute tentative d’authentification échouée est enregistrée dans le journal de sécurité.
RM-SEC-028
Les journaux de connexion et de sécurité ne peuvent être modifiés par aucun utilisateur.
RM-SEC-029
Les mesures de sécurité automatiques appliquées à un compte sont proportionnées au niveau de risque calculé.
RM-SEC-030
Toute invalidation d’une session entraîne la suppression immédiate des jetons d’authentification associés.
RM-SEC-031
Les informations relatives aux appareils utilisés sont conservées uniquement aux fins de sécurité et conformément à la politique de protection des données de GROUPI.
RM-SEC-032
Les informations de localisation utilisées pour l’analyse des connexions sont approximatives et ne peuvent jamais constituer une preuve de fraude.
RM-SEC-033
Les changements de mot de passe, les réinitialisations et les invalidations de session sont réalisés de manière atomique afin de garantir la cohérence de la sécurité du compte.
RM-SEC-034
Toute authentification réussie régénère un nouveau jeton d’authentification sécurisé.
RM-SEC-035
Les jetons d’authentification possèdent une durée de validité limitée conformément à la politique de sécurité de GROUPI.
RM-SEC-036
Toute déconnexion volontaire invalide immédiatement le jeton d’authentification utilisé.
RM-SEC-037
Un compte verrouillé automatiquement retrouve son état normal à l’expiration du délai de verrouillage sans modification de son état métier.
RM-SEC-038
Les informations collectées pour le calcul du score de risque ne sont utilisées qu’à des fins de sécurité et ne peuvent être exploitées à des fins commerciales.









