# PARTIE VI - ANNEXES DE REFERENCE (Lexique, Index des regles, Catalogues, Matrices RBAC/CRUD, Diagrammes, Dictionnaire des objets metier)

PARTIE VI — ANNEXES DE RÉFÉRENCE

## Annexe A — Lexique métier
A.1 Objet
Le présent lexique définit l’ensemble des termes métier utilisés dans le référentiel fonctionnel de GROUPI. Les définitions constituent la référence officielle. Lorsqu’un terme est utilisé dans un chapitre, il doit être interprété conformément à la définition donnée dans ce lexique.

A.2Concepts métier

A

Abonnement (Subscription)
Contrat liant un Professeur à GROUPI et lui donnant accès à un ensemble de fonctionnalités pendant une période déterminée.
L’abonnement est personnel, non transférable et rattaché à une année académique.
Voir aussi : Offre Découverte, Offre Intermédiaire, Offre Pro, Add-on

Abonnement actif
Abonnement validé permettant l’utilisation normale de la plateforme.

Abonnement suspendu
Abonnement temporairement désactivé suite à une décision administrative ou à un défaut de paiement.

Activité (Activity)
Événement enregistré dans le Centre d’activités d’un utilisateur.
Toute opération importante génère automatiquement une activité.

Add-on
Option complémentaire permettant au Professeur d’activer des fonctionnalités spécifiques sans changer d’offre d’abonnement.
Disponible à partir de la Version 2.


Administrateur (Administrator)
Utilisateur disposant d’autorisations de gestion accordées par le Super Administrateur.
Ses autorisations sont configurables individuellement.

Ajustement comptable (Adjustment)
Écriture comptable exceptionnelle permettant de corriger une opération financière tout en conservant la traçabilité complète des mouvements.
Un ajustement crée une nouvelle écriture et ne modifie jamais les écritures précédentes.

Alerte
Information nécessitant une attention particulière de l’utilisateur.
Les alertes apparaissent directement sur le tableau de bord concerné.

Année académique (AcademicYear)
Période scolaire de référence utilisée par GROUPI pour regrouper l’ensemble des données pédagogiques, comptables et statistiques.
Toutes les inscriptions, groupes, séances et abonnements sont rattachés à une année académique.
Voir aussi : Situation scolaire

Annonce (GroupAnnouncement)
Message collectif publié par un Professeur à destination de tous les Parents d’un groupe.
Les annonces sont exclusivement unidirectionnelles : Professeur → Parents.

Archivage
Changement d’état d’un objet métier le rendant non modifiable tout en conservant définitivement ses données pour consultation.
L’archivage ne constitue pas une suppression.

Audit
Processus de vérification et de contrôle des opérations réalisées dans GROUPI.
Toutes les opérations importantes sont traçables grâce aux journaux d’audit.


B

Bénéficiaire
Personne ou organisation tirant profit de l’utilisation de GROUPI.
Les bénéficiaires sont : les Professeurs, les Parents, les Élèves (indirectement), les Administrateurs et le Super Administrateur.

C

Calendrier scolaire
Calendrier officiel des périodes scolaires (jours fériés, vacances, examens, etc.).
À partir de la Version 2, GROUPI pourra exploiter automatiquement le calendrier scolaire officiel.

Capacité maximale
Nombre maximal d’élèves pouvant être inscrits simultanément dans un groupe.
La capacité est définie par le Professeur lors de la création du groupe.

Catalogue des offres
Document commercial indépendant du présent référentiel définissant les tarifs, les limitations et les fonctionnalités des offres d’abonnement.

Centre d’activités
Historique chronologique des événements concernant un utilisateur.
Toutes les activités sont conservées et classées de la plus récente à la plus ancienne.
Voir aussi : Activité, Notification

Changement de groupe
Transfert temporaire ou définitif d’un élève d’un groupe vers un autre.
Le changement ne supprime jamais l’historique de l’élève.

Chiffre d’affaires encaissé
Montant total des paiements enregistrés par le Professeur sur une période donnée.
Chiffre d’affaires facturé
Montant total correspondant aux séances effectivement facturées sur une période donnée.

Chiffre d’affaires prévisionnel
Montant estimé des séances futures susceptibles d’être facturées selon les inscriptions, les tarifs et les séances planifiées.

Classe scolaire
Information indicative renseignée par le Parent pour préciser l’environnement scolaire de l’élève.
La classe scolaire ne modifie jamais le niveau scolaire officiel utilisé par GROUPI.

Clôture d’inscription
Fin officielle d’une inscription.
L’historique pédagogique et comptable reste conservé.

Commentaire pédagogique (Comment)
Observation rédigée par le Professeur ou le Parent concernant un élève dans le cadre d’une inscription.
Les commentaires sont exclusivement textuels dans la Version 1.

Compte de suivicomptable (AccountingAccount)
Registre des écritures financières associé à une inscription.
Chaque inscription possède son propre compte de suivicomptable.
Voir aussi : Écriture comptable, Solde comptable

Confiance
Valeur fondamentale de GROUPI.
Les comptes Professeurs et Parents sont soumis à une procédure de validation afin de garantir la fiabilité des informations diffusées sur la plateforme.

Crédit
Écriture représentant un paiement enregistré.Un crédit augmente le solde du compte de suivicomptable.
Voir aussi : Débit, Écriture comptable

D

Dashboard
Voir Tableau de bord

Débit
Écriture représentant une séance facturée.
Un débit diminue le solde du compte de suivicomptable.
Voir aussi : Crédit, Écriture comptable

Demande d’inscription
Demande envoyée par un Parent afin qu’un élève rejoigne un groupe.
Une demande d’inscription ne garantit jamais l’admission dans le groupe.

Désactivation
Action administrative rendant un compte ou un objet métier inutilisable.
La désactivation conserve l’intégralité des données historiques.

Domaine fonctionnel
Ensemble cohérent de fonctionnalités partageant une même responsabilité métier.
GROUPI est organisé autour de plusieurs domaines : Utilisateurs, Pédagogique, Comptable, Commercial, Communication, Référentiels, Pilotage et Administration.

E

Écriture comptable (AccountingEntry)
Mouvement enregistré dans le compte de suivicomptable d’une inscription.
Une écriture est soit un crédit (paiement), soit un débit (séance facturée).
Aucune écriture n’est supprimée ; les corrections sont effectuées par de nouvelles écritures.
Voir aussi : Crédit, Débit, Ajustement comptable

Élève (Student)
Personne bénéficiant des cours dispensés par un Professeur.
Dans la Version 1, l’Élève ne possède pas de compte utilisateur. Toutes les interactions sont réalisées par l’intermédiaire de son Parent.

Établissement scolaire (School)
Établissement scolaire reconnu par GROUPI.
Les établissements sont gérés via un référentiel officiel et sont partagés par l’ensemble de la plateforme.

Evènement métier (BusinessEvent)
Événement significatif généré automatiquement par GROUPI à la suite d’une opération fonctionnelle.
Chaque évènement métier est identifié par un code unique (EVT-xxx).

Évolutivité
Valeur fondamentale de GROUPI.
L’architecture fonctionnelle de GROUPI est pensée pour permettre l’ajout de nouvelles fonctionnalités sans remettre en cause les fondations du système.

Export
Extraction de données au format PDF, Excel ou CSV.
Les exports sont réservés aux offres payantes (Intermédiaire et Pro).

F

Fil de commentaires
Espace de discussion privé associé à une inscription.
Le fil de commentaires est accessible uniquement par le Professeur et le Parent concerné.

Fuseau horaire
Le fuseau horaire de référence de GROUPI est Africa/Tunis (UTC+1).
Tous les horodatages sont enregistrés en temps universel coordonné (UTC) puis convertis pour l’affichage.
G

Glossaire
Référentiel définissant le vocabulaire officiel utilisé dans GROUPI.

Groupe (Group)
Unité pédagogique principale de GROUPI.
Un groupe représente un ensemble d’élèves suivant une même matière avec un même Professeur.
Voir aussi : Groupe actif, Groupe archivé

Groupe actif
Groupe pouvant accueillir des séances et des inscriptions.

Groupe archivé
Groupe conservé à des fins historiques mais ne pouvant plus être modifié.

Groupe complet
Groupe ayant atteint sa capacité maximale.
Un groupe complet ne peut plus accepter de nouvelles inscriptions.

Groupe masqué
Groupe disparaissant automatiquement des résultats de recherche lorsque sa capacité maximale est atteinte.

Groupe visible
Groupe restant affiché dans les résultats de recherche même lorsque sa capacité maximale est atteinte (mention "Complet").

H

Historique
Ensemble des informations conservées afin d’assurer la traçabilité complète des opérations réalisées dans GROUPI.Aucune donnée historique n’est supprimée.
Horodatage
Date et heure enregistrées automatiquement lors d’une opération.

I

Immuabilité
Principe selon lequel certaines données deviennent définitivement non modifiables.
Exemples : les séances verrouillées, les écritures comptables, les historiques.

Information
Niveau de priorité le plus bas pour une activité ou une notification.
Exemples : nouvelle séance planifiée, paiement enregistré, commentaire pédagogique.
Voir aussi : Important, Critique

Important
Niveau de priorité moyen pour une activité ou une notification.Une action ou une vigilance est recommandée.
Exemples : votre enfant est absent, une demande d’inscription est en attente.
Voir aussi : Information, Critique

Inscription (Enrollment)
Lien administratif, pédagogique et comptable entre un Parent, un Élève et un Groupe.Chaque inscription est totalement indépendante.
Voir aussi : Inscription active, Inscription suspendue

Inscription active
Inscription autorisant la participation aux séances.

Inscription suspendue
Inscription temporairement interrompue.


Intelligence artificielle (IA)
Technologie utilisée à partir de la Version 2 pour assister le Professeur dans son activité quotidienne.
L’IA reste un outil d’aide à la décision ; le Professeur conserve toujours la décision finale.

Intégrité des données
Garantie que les informations restent cohérentes entre elles.
GROUPI garantit l’intégrité pédagogique et comptable de toutes les données.

J

Journal d’audit
Historique des opérations importantes réalisées dans GROUPI.
Le journal d’audit est accessible uniquement aux utilisateurs autorisés.

Journal des connexions
Historique des connexions d’un utilisateur.
Chaque utilisateur peut consulter l’historique de ses connexions.

L

Lieu d’enseignement (TeachingLocation)
Lieu physique ou virtuel où se déroulent les séances d’un groupe.

Liste d’attente
Liste des demandes d’inscription enregistrées lorsque la capacité maximale d’un groupe est atteinte.
Les demandes sont traitées lorsqu’une place devient disponible.
Fonctionnalité prévue pour la Version 2.



M

Matière (Subject)
Discipline enseignée dans un groupe.
Les matières sont gérées via un référentiel officiel de GROUPI.

Moindre privilège (Least Privilege)
Principe de sécurité selon lequel chaque utilisateur ne peut accéder qu’aux informations et aux fonctionnalités nécessaires à l’exercice de son rôle.

N

Niveau scolaire (SchoolLevel)
Classe scolaire ou niveau d’études officiel associé aux groupes et aux élèves.
Les niveaux sont gérés via un référentiel officiel de GROUPI.

Notification (Notification)
Information transmise automatiquement à un utilisateur.
Les notifications sont générées à la suite d’événements importants et utilisent plusieurs canaux de communication selon leur niveau de priorité.
Voir aussi : Centre d’activités, Activité

O

Offre Découverte (Discovery Plan)
Offre d’abonnement gratuite d’une durée d’un mois permettant de découvrir les principales fonctionnalités de GROUPI.
Capacité : 20 inscriptions actives simultanées.

Offre Intermédiaire (Intermediate Plan)
Offre d’abonnement payante à 49 TND.
Capacité : 50 inscriptions actives simultanées.
Fonctionnalités : statistiques, exports PDF, Excel et CSV.

Offre Pro (Pro Plan)
Offre d’abonnement payante à 99 TND.
Capacité : illimitée.
Fonctionnalités : toutes les fonctionnalités de GROUPI, y compris les fonctionnalités Premium.

P

Paiement (Payment)
Montant reçu par le Professeur et enregistré dans GROUPI.
GROUPI n’intervient jamais dans la transaction financière ; il assure uniquement le suivi comptable.

Parent (Parent)
Responsable légal d’un ou plusieurs élèves.
Le Parent est l’interlocuteur principal entre sa famille et le Professeur.

Période d’interruption
Période pendant laquelle aucune séance n’est générée pour un groupe.
Exemples : vacances scolaires, congés personnels, examens.

Permission
Droit accordé à un utilisateur d’accéder à une fonctionnalité ou d’effectuer une opération.
Les permissions sont gérées selon un modèle RBAC (Role Based Access Control).

Planning hebdomadaire
Modèle récurrent définissant les séances d’un groupe.
Le planning est composé de créneaux (jour, heure, durée, mode, lieu).

Préinscription (PreEnrollment)
Manifestation d’intérêt d’un Parent pour inscrire son enfant auprès d’un Professeur pour une future année académique.
Une préinscription n’engage ni le Parent ni le Professeur.

Présence (Attendance)
Enregistrement décrivant la participation d’un Élève à une séance donnée.
Voir aussi : Présent, Absent excusé, Absent non excusé, Retard

Présent
Élève ayant participé normalement à la séance.

Absent excusé
Élève absent ayant prévenu le Professeur avant ou pendant la séance.

Absent non excusé
Élève absent n’ayant pas informé le Professeur.

Retard
Élève arrivé après le début de la séance.

Principe fondateur
Principe fondamental guidant la conception de GROUPI.
Exemples : une seule source de vérité, aucune suppression des données historiques, automatisation maximale des tâches répétitives.

Professeur (Teacher)
Utilisateur principal de GROUPI.
Le Professeur crée et administre des groupes, gère les inscriptions, organise les séances, saisit les présences et suit les paiements.

Profil
Ensemble des informations décrivant un utilisateur.
GROUPI distingue le Profil Professeur, le Profil Parent et le Profil Élève.


R

Réactivation
Action permettant de rétablir les droits d’un compte, d’une inscription ou d’un abonnement précédemment suspendu.

Référentiel (ReferenceData)
Liste officielle de données communes administrées par GROUPI.
Exemples : matières, niveaux scolaires, établissements scolaires, villes, relations SubjectLevel.

Registre de présence
Historique officiel des présences d’un groupe.
Le registre constitue une preuve historique des participations aux séances.

Règle métier (BusinessRule)
Règle définissant le fonctionnement métier de GROUPI.
Chaque règle est identifiée par un code unique (RM-xxx).

Rôle (Role)
Fonction attribuée à un utilisateur.
Les rôles possibles sont : Professeur, Parent, Administrateur, Super Administrateur.

S

Séance (Session)
Cours programmé appartenant à un groupe.
La séance constitue l’unité opérationnelle de base de l’activité pédagogique de GROUPI.

Séance verrouillée
Séance devenue définitivement non modifiable.
Une séance est verrouillée 48 heures après sa réalisation.

Seed
Jeu de données de référence utilisé pour initialiser automatiquement les référentiels lors du déploiement de GROUPI.

Signalement d’absence
Fonctionnalité permettant au Parent de signaler l’absence prévisible de son enfant avant le début d’une séance.
Le signalement ne modifie jamais automatiquement la présence ; le Professeur reste seul responsable de la validation définitive.

Simplicité
Valeur fondamentale de GROUPI.
L’application doit rester intuitive et accessible, quel que soit le niveau de maîtrise informatique de ses utilisateurs.

Situation scolaire (StudentSchoolSituation)
Ensemble des informations décrivant la scolarité actuelle d’un élève.
Un élève possède une seule situation scolaire active à un instant donné.

Solde comptable
Différence entre les crédits et les débits d’une inscription.
Solde = Total des crédits − Total des débits.

Super Administrateur (SuperAdmin)
Utilisateur possédant tous les droits d’administration de GROUPI.
Le Super Administrateur est créé uniquement lors de l’installation du système.

Suspension
État temporaire empêchant l’utilisation normale d’un compte, d’une inscription ou d’un abonnement sans supprimer les données associées.



T

Tableau de bord (Dashboard)
Vue synthétique des informations essentielles d’un utilisateur.
Chaque utilisateur dispose d’un tableau de bord adapté à son rôle.

Tarif de référence GROUPI
Tarif calculé automatiquement par GROUPI à partir des tarifs publics pratiqués par les groupes actifs de la plateforme.
Ce tarif est indicatif et ne peut pas être modifié par le Professeur.

Tarif personnalisé
Tarif spécifique appliqué à une inscription.
Le tarif personnalisé remplace le tarif public du groupe uniquement pour l’inscription concernée.

Tarif public
Tarif standard défini au niveau d’un groupe.
Le tarif public est visible par tous les Parents avant toute demande d’inscription.

Taux d’assiduité
Pourcentage représentant la participation effective d’un Élève aux séances réalisées.

Taux d’occupation
Rapport entre le nombre d’inscriptions actives et la capacité maximale d’un groupe.

Traçabilité
Valeur fondamentale de GROUPI.
Capacité à retrouver l’historique complet d’une opération.
Aucune opération importante n’est supprimée ; les informations essentielles sont historisées.

Transparence
Valeur fondamentale de GROUPI.
Chaque acteur doit disposer d’une information claire et fiable.
Toute modification importante est communiquée immédiatement aux personnes concernées.

U

Upsert
Mécanisme consistant à créer une donnée si elle n’existe pas ou à mettre à jour la donnée existante dans le cas contraire.
Ce mécanisme est utilisé pour les mises à jour des référentiels.

Utilisateur (User)
Toute personne disposant d’un compte GROUPI.
Un utilisateur peut cumuler plusieurs rôles.

V

Validation
Action autorisant officiellement un compte, une demande ou une opération.
Les validations sont réalisées exclusivement par le Super Administrateur ou un Administrateur habilité.

Valeur
Principe fondamental guidant le développement de GROUPI.
Les valeurs sont : Simplicité, Transparence, Confiance, Traçabilité, Évolutivité.

Ville (City)
Localité de référence utilisée dans GROUPI.
Les villes sont gérées via un référentiel officiel.

Visibilité
Paramètre définissant si un groupe reste visible dans les résultats de recherche lorsqu’il est complet.
Deux options possibles : Visible ou Masqué.
Vision
Ambition à long terme de GROUPI : devenir la plateforme de référence pour la gestion des cours particuliers en Tunisie.

W

Workflow
Enchaînement d’opérations métier définissant un processus complet.
GROUPI définit plusieurs workflows : cycle de vie d’un compte, processus d’inscription, génération des séances, etc.

Termes techniques
Terme
Définition
API
Interface de programmation permettant à des applications tierces d’interagir avec GROUPI.
CRUD
Acronyme désignant les quatre opérations de base : Create, Read, Update, Delete.
DDD
Domain-Driven Design, approche de conception logicielle centrée sur le domaine métier.
ERD
Entity-Relationship Diagram, diagramme représentant les entités et leurs relations.
JWT
JSON Web Token, standard utilisé pour l’authentification.
MFA
Multi-Factor Authentication, authentification à plusieurs facteurs (prévue en Version 2).
RBAC
Role-Based Access Control, modèle de gestion des permissions basé sur les rôles.
SMS
Short Message Service, canal de notification prévu dans une version ultérieure.
UUID
Identifiant unique universel utilisé pour identifier les objets métier.
UTC
Coordinated Universal Time, temps universel coordonné utilisé pour les horodatages.

A.3 Objets métier
Objet
Description
AcademicYear
Représente une année académique.
User
Compte utilisateur de la plateforme.
TeacherProfile
Profil Professeur associé à un utilisateur.
ParentProfile
Profil Parent associé à un utilisateur.
StudentProfile
Profil Élève.
Group
Groupe pédagogique.
GroupMembership
Inscription d’un élève dans un groupe.
Session
Séance pédagogique.
Attendance
Présence d’un élève à une séance.
AttendanceStatus
Statut d’une présence.
AccountingAccount
Compte de suivicomptable d’une inscription.
AccountingEntry
Écriture comptable.
Payment
Paiement enregistré.
PaymentMethod
Moyen de paiement.
Subscription
Abonnement d’un Professeur.
SubscriptionPlan
Offre d’abonnement.
Notification
Notification envoyée à un utilisateur.
Activity
Activité du centre d’activités.

A.4Indicateurs métier
Indicateur
Description
Solde comptable
Crédit − Débit.
Taux d’assiduité
Pourcentage de présence.
Taux d’occupation
Occupation d’un groupe.
Places disponibles
Capacité restante d’un groupe.
Score de complétude
Niveau de complétude du profil.
Comportement de paiement
Indicateur calculé sur les paiements.
Solde global Parent
Somme des soldes des inscriptions de tous les enfants.
Chiffre d’affaires prévisionnel
Estimation des recettes futures.
Chiffre d’affaires facturé
Somme des séances facturées.
Chiffre d’affaires encaissé
Somme des paiements enregistrés.

A.5Concepts techniques
Terme
Description
Seed
Jeu initial de données utilisé pour peupler les référentiels.
Upsert
Créer si absent, mettre à jour sinon.
Donnée inactive
Donnée conservée mais non proposée aux nouvelles créations.
Evènement métier
Événement fonctionnel généré par GROUPI.
Cas d’erreur
Situation métier entraînant un refus de l’opération.
Historisation
Conservation permanente des données métier.
Archivage
Passage d’un objet en lecture seule.
Suspension
Désactivation temporaire d’un objet ou d’un compte.
Réactivation
Retour à l’état actif.
Audit
Vérification de la traçabilité des opérations.
RBAC
Gestion des droits basée sur les rôles.
UUID
Identifiant unique universel.
API
Interface de programmation.
JWT
Jeton d’authentification.
UTC
Temps universel coordonné.



## Annexe B — Index des règles métier
Chaque règle reçoit un identifiant unique (RM-xxx), qui pourra être cité dans le référentiel fonctionnel, les User Stories, le code (// RM-023) et les tests.
Cet index constitue la synthèse consolidée de toutes les règles métier de GROUPI. Chaque chapitre reste la source de vérité normative ; cet index en est le reflet et doit être régénéré en cas de modification des chapitres.
Total : 626 règles réparties sur 27 domaines.
Domaine NAM — Conventions de nommage
Code
Règle
Chap.
RM-NAM-001
Tous les objets métier sont nommés en anglais, au singulier et en PascalCase.
2
RM-NAM-002
Toutes les tables de base de données utilisent le snake_case au singulier.
2
RM-NAM-003
Les états métier sont exprimés exclusivement à l’aide d’énumérations officielles.
2
RM-NAM-004
Les permissions suivent obligatoirement le format [RESOURCE]_[ACTION], où RESOURCE est l’abréviation officielle de la ressource.
2
RM-NAM-005
Les codes des règles métier, événements, calculs et cas d’erreur sont uniques dans tout le référentiel.
2
RM-NAM-006
Les routes API utilisent REST, l’anglais, le pluriel et le kebab-case.
2
RM-NAM-007
La terminologie officielle du référentiel est obligatoire dans toute la documentation, le code et les interfaces utilisateur.
2
RM-NAM-008
Les dates techniques sont stockées en UTC et affichées selon le fuseau Africa/Tunis.
2

Domaine ACC — Comptes et sécurité
Code
Règle
Chap.
RM-ACC-001
Un utilisateur possède un seul compte GROUPI.
3
RM-ACC-002
Un utilisateur peut cumuler plusieurs rôles (Professeur, Parent).
3
RM-ACC-003
Le Super Administrateur est créé uniquement lors de l’installation.
3
RM-ACC-004
Un Professeur ne peut utiliser GROUPI qu’après validation.
3
RM-ACC-005
Un Parent ne peut inscrire un enfant qu’après validation.
3
RM-ACC-006
Un compte suspendu ne peut plus accéder aux fonctionnalités nécessitant une authentification.
3
RM-ACC-007
Un compte désactivé ne peut plus être utilisé pour aucune connexion.
3
RM-ACC-008
Les données d’un compte désactivé ou suspendu sont conservées intégralement.
3
RM-ACC-009
La désactivation d’un compte entraîne la fermeture immédiate de toutes les sessions actives.
3
RM-ACC-010
Aucun utilisateur ayant produit des données métier ne peut être supprimé physiquement.
3
RM-ACC-011
Un compte ne peut jamais être partagé entre plusieurs personnes.
3
RM-ACC-012
Un Administrateur ne peut jamais attribuer ou modifier ses propres permissions.
3
RM-ACC-013
Les permissions prennent effet immédiatement après leur modification.
3
RM-ACC-014
Le rôle de Super Administrateur est unique. À un instant donné, un seul compte peut posséder ce rôle.
3
RM-ACC-015
Un compte utilisateur ne peut être validé que par un Super Administrateur ou un Administrateur habilité.
3
RM-ACC-016
La désactivation d’un compte Parent ne supprime pas les profils Élèves associés. Ces derniers peuvent être réaffectés par un Administrateur à un nouveau compte Parent
3
RM-ACC-017
Une adresse électronique ne peut être associée qu’à un seul compte utilisateur
3
RM-ACC-018
Un Élève ne peut être rattaché qu’à un seul Parent dans la Version 1
3
RM-ACC-019
Toute connexion utilisateur est enregistrée dans le journal d’audit (AuditLog).
3
RM-ACC-020
Toute action métier significative est historisée et rattachée à l’utilisateur qui l’a réalisée.
3
RM-ACC-021
Les droits d’accès d’un utilisateur sont strictement déterminés par les permissions qui lui sont attribuées.
3

Domaine SUB — Abonnements
Code
Règle
Chap.
RM-SUB-001
Les abonnements concernent uniquement les Professeurs.
4
RM-SUB-002
Les Parents utilisent GROUPI gratuitement.
4
RM-SUB-003
Les abonnements sont personnels et non transférables.
4
RM-SUB-004
L’offre Découverte est gratuite et d’une durée de 30 jours calendaires.
4
RM-SUB-005
L’offre Découverte ne peut être utilisée qu’une seule fois par Professeur.
4
RM-SUB-006
L’offre Découverte permet de gérer jusqu’à 20 inscriptions actives simultanées. Le dépassement de cette capacité suit le régime générique décrit en 4.5 (blocage des nouvelles inscriptions uniquement).
4
RM-SUB-007
L’offre Intermédiaire permet de gérer jusqu’à 50 inscriptions actives simultanées.
4
RM-SUB-008
L’offre Pro permet de gérer un nombre illimité d’inscriptions actives.
4
RM-SUB-009
Une inscription est comptabilisée lorsqu’elle est dans un état considéré comme actif conformément au chapitre des inscriptions.
4
RM-SUB-010
Les inscriptions clôturées ou archivées ne sont pas comptabilisées dans la capacité.
4
RM-SUB-011
Lorsque la capacité maximale est atteinte, aucune nouvelle inscription ne peut être acceptée.
4
RM-SUB-012
Le passage à une offre supérieure prend effet dès l’activation du nouvel abonnement.
4
RM-SUB-013
Le retour vers une offre inférieure est refusé si le nombre d’inscriptions actives dépasse la capacité de la nouvelle offre.
4
RM-SUB-014
L’offre Découverte ne donne pas accès aux statistiques avancées.
4
RM-SUB-015
L’offre Découverte ne donne pas accès aux exports.
4
RM-SUB-016
L’offre Découverte ne donne pas accès aux fonctionnalités réservées aux offres payantes.
4
RM-SUB-017
L’abonnement du Professeur n’est jamais reconduit automatiquement : il expire à son échéance (RM-SUB-024) si le Professeur ne souscrit pas activement un nouvel abonnement. Ce non-renouvellement n’entraîne ni remboursement partiel, ni suppression des données du Professeur.
4
RM-SUB-018
Les paiements des abonnements sont totalement indépendants des paiements réalisés entre les Parents et les Professeurs pour les séances.
4
RM-SUB-019
La création de plusieurs comptes pour bénéficier de plusieurs offres Découverte est interdite.
4
RM-SUB-020
À l’expiration de l’offre Découverte, le compte Professeur bascule en mode « Lecture Seule ». Il peut consulter ses données historiques, mais ne peut plus créer de nouvelles séances ou accepter de nouvelles inscriptions tant qu’un abonnement payant n’est pas souscrit.
4
RM-SUB-021
Le système peut proposer automatiquement au Professeur la clôture d’une inscription lorsqu’aucune séance n’a été enregistrée depuis trois mois (paramétrable). La décision finale appartient toujours au Professeur.
4
RM-SUB-022
La suspension d’un abonnement pour impayé entraîne une restriction des fonctionnalités (création et acceptation bloquées) mais ne supprime pas l’accès en consultation pendant un délai de grâce de 7 jours.
4
RM-SUB-023
Un Professeur ne peut posséder qu’un seul abonnement actif par année académique.
4
RM-SUB-024
Tout abonnement expire automatiquement à la fin de son année académique.
4
RM-SUB-025
Le renouvellement d’un abonnement crée un nouvel abonnement pour l’année académique suivante.
4
RM-SUB-026
Un abonnement souscrit en cours d’année académique expire à la fin de la même année. Le tarif est calculé selon les règles commerciales définies par GROUPI.
4

Domaine TPR — Profil Professeur
Code
Règle
Chap.
RM-TPR-001
Le profil minimum d’un Professeur comprend : nom, prénom, téléphone, ville, au moins une matière, au moins un niveau.
5
RM-TPR-002
Les matières et niveaux sont obligatoirement sélectionnés dans les référentiels officiels de GROUPI.
5
RM-TPR-003
Toute modification des matières nécessite une validation administrative.
5
RM-TPR-004
Toute modification des niveaux nécessite une validation administrative.
5
RM-TPR-005
Tant qu’une modification est en attente de validation, les informations précédemment validées continuent d’être utilisées.
5
RM-TPR-006
Le Professeur ne peut enseigner que des combinaisons Matière/Niveau autorisées par SubjectLevel.
5
RM-TPR-007
Le Professeur doit toujours disposer d’au moins une matière et d’au moins un niveau validés.
5
RM-TPR-008
La vérification SubjectLevel est effectuée lors de la création du profil, de la modification du profil et de la création d’un groupe.
5
RM-TPR-009
Le score de complétude est recalculé automatiquement après chaque modification du profil.
5
RM-TPR-010
Le score de complétude n’influence pas la validation du compte.
5
RM-TPR-011
Le score de complétude n’est jamais visible par les Parents.
5
RM-TPR-012
Le dépôt d’un diplôme est disponible dès la Version 1 mais reste facultatif et non vérifié. La vérification officielle des diplômes sera introduite dans une version ultérieure.
5
RM-TPR-013
Les informations suivantes sont publiques : Nom et prénom, ville, matières, niveaux, biographie, photo, expérience, lieux d’enseignement, Disponibilités.
5
RM-TPR-014
Les informations suivantes sont privées : téléphone, historique, abonnement, tableaux de bord, diplôme.
5
RM-TPR-015
Seul le Professeur ou un Administrateur autorisé peut modifier les informations du profil professionnel.
5

Domaine PAR — Profil Parent
Code
Règle
Chap.
RM-PAR-001
Les informations suivantes sont nécessaires pour la validation du compte Parent : nom, prénom, téléphone, ville.
6
RM-PAR-002
Le Parent peut gérer un nombre illimité d’enfants.
6
RM-PAR-003
Les informations propres au profil de l’enfant sont : nom, prénom. Le niveau scolaire, l’établissement et la classe scolaire sont déclarés par le Parent lors de la création du profil et gérés ensuite via la situation scolaire de l’élève (voir Chapitre La Situation Scolaire), qui seule fait foi sur ces informations.
6
RM-PAR-004
L’établissement scolaire est obligatoirement sélectionné dans le référentiel officiel de GROUPI.
6
RM-PAR-005
Aucune saisie libre d’établissement scolaire n’est autorisée.
6
RM-PAR-006
Les établissements sont partagés par l’ensemble de la plateforme.
6
RM-PAR-007
Le Professeur peut consulter : l’identité de l’élève (nom, prénom), ainsi que le niveau, la classe scolaire et l’établissement issus de sa situation scolaire active.
6
RM-PAR-008
Le Professeur ne voit jamais l’historique des autres enfants, les autres groupes ou les comptes comptables des autres inscriptions.
6
RM-PAR-009
Un profil Élève n’est jamais supprimé dès lors qu’il possède un historique pédagogique ou comptable.
6
RM-PAR-010
La classe scolaire constitue une information indicative. Elle ne modifie jamais le niveau scolaire officiel.
6
RM-PAR-011
Le Parent ne peut jamais consulter les informations concernant d’autres familles.
6
RM-PAR-012
Un Parent peut représenter plusieurs élèves. Chaque élève reste rattaché à un seul compte Parent dans la Version 1. L’association à plusieurs Parents est prévue en Version 2.
6
RM-PAR-013
Le compte Parent est validé après vérification des informations obligatoires par un Administrateur.
6
RM-PAR-014
Le Parent est informé lorsque la capacité maximale du Professeur est atteinte. La demande d’inscription peut être refusée ou mise en attente conformément aux règles de gestion des inscriptions.
6
RM-PAR-015
Le profil élève archivé peut être réactivé à tout moment par le Parent.
6
RM-PAR-016
Un Parent ne peut pas créer deux profils représentant le même enfant.
6
RM-PAR-017
La désactivation d’un compte Parent n’entraîne jamais la suppression des données pédagogiques ou comptables des enfants.
6
RM-PAR-018
Le Professeur ne peut consulter les informations d’un élève que si celui-ci est ou a été inscrit dans l’un de ses groupes.
6

Domaine SCH — Situation scolaire
Code
Règle
Chap.
RM-SCH-001
Une situation scolaire est toujours rattachée à un seul élève.
7
RM-SCH-002
Un élève possède une seule situation scolaire active à un instant donné.
7
RM-SCH-003
Une situation scolaire est toujours rattachée à une année académique.
7
RM-SCH-004
Une nouvelle situation scolaire est créée notamment lors : de la création du profil de l’élève, du passage à une nouvelle année académique, d’un changement de niveau, d’un changement d’établissement, d’un redoublement, d’une réorientation.
7
RM-SCH-005
GROUPI conserve toutes les situations scolaires successives.
7
RM-SCH-006
Aucune situation scolaire n’est supprimée.
7
RM-SCH-007
Les groupes suivis, les inscriptions et les statistiques restent rattachés à la situation scolaire qui était active au moment des faits.
7
RM-SCH-008
Le Parent est invité à mettre à jour la situation scolaire de son enfant au début de chaque année académique.
7
RM-SCH-009
Toute demande d’inscription nécessite une situation scolaire active pour l’élève concerné, sur l’année académique correspondante.
7
RM-SCH-010
En cas de changement de situation en cours d’année, les inscriptions existantes restent rattachées à l’ancienne situation.
7
RM-SCH-011
La mise à jour de routine de la situation scolaire (passage à une nouvelle année académique avec progression de niveau attendue, sans changement d’établissement) est déclarée par le Parent et devient active automatiquement, sous réserve de la vérification de cohérence âge/niveau.
7
RM-SCH-012
Les autres cas de modification --- changement d’établissement, redoublement, réorientation, ou changement de niveau ne correspondant pas à une progression standard --- sont soumis à validation par un Administrateur.
7
RM-SCH-013
Tant qu’une modification est en attente de validation, la situation scolaire précédemment validée continue d’être utilisée par GROUPI.
7
RM-SCH-014
Une situation scolaire clôturée est figée définitivement. Aucune opération de modification, de réouverture ou de suppression n’est autorisée. Toute correction d’une situation scolaire clôturée nécessite la création d’une nouvelle situation scolaire ou, à titre exceptionnel, une intervention d’un Administrateur autorisé, obligatoirement tracée dans le journal d’audit.
7
RM-SCH-015
Les périodes de validité de deux situations scolaires d’un même élève ne peuvent jamais se chevaucher.
7
RM-SCH-016
Toute nouvelle situation scolaire devient la situation scolaire active après sa validation, le cas échéant.
7
RM-SCH-017
Une situation scolaire active peut être clôturée uniquement lors de la création d’une nouvelle situation scolaire ou par une opération administrative exceptionnelle.
7
RM-SCH-018
Une situation scolaire est créée pour une seule année académique et ne peut jamais être réutilisée pour une autre année académique.
7
RM-SCH-019
GROUPI vérifie la cohérence entre l’âge de l’élève et son niveau scolaire lors de toute création ou modification de situation scolaire. Une alerte est générée en cas d’incohérence significative
7
RM-SCH-020
La création initiale d’une situation scolaire, lors de l’inscription du Parent, suit le même régime automatique que la mise à jour de routine, sous réserve de la vérification de cohérence âge/niveau
7

Domaine CYC — Cycle de vie des comptes
Code
Règle
Chap.
RM-CYC-001
Le changement d’état d’un compte n’entraîne jamais la suppression des données produites par l’utilisateur.
8
RM-CYC-002
Les transitions possibles sont : En attente → Actif, Actif → Suspendu, Suspendu → Actif, Actif → Désactivé, Suspendu → Désactivé, Désactivé → Archivé (Version 2).
8
RM-CYC-003
Toute autre transition que celles définies est interdite.
8
RM-CYC-004
Chaque changement d’état est historisé.
8
RM-CYC-005
Avant validation, le Professeur peut compléter son profil et consulter son tableau de bord.
8
RM-CYC-006
Avant validation, le Professeur ne peut pas créer de groupes, accepter des inscriptions ou utiliser les fonctionnalités réservées.
8
RM-CYC-007
Avant validation, le Parent peut compléter son profil, enregistrer ses enfants et sélectionner leurs établissements.
8
RM-CYC-008
Avant validation, le Parent ne peut pas rechercher des groupes, envoyer des demandes d’inscription ou consulter les informations pédagogiques.
8
RM-CYC-009
La suspension peut intervenir notamment en cas de non-paiement de l’abonnement, de fraude, d’utilisation abusive ou de non-respect des conditions générales.
8
RM-CYC-010
Pendant la suspension, les données restent accessibles aux Administrateurs et les historiques sont conservés.
8
RM-CYC-011
Un compte suspendu devient indisponible pour tous les rôles qui lui sont associés.
8
RM-CYC-012
La désactivation entraîne : fermeture des sessions, impossibilité de se connecter, conservation des données métier.
8
RM-CYC-013
Lorsqu’un compte possède un historique métier, la suppression physique n’est pas autorisée. Seule l’anonymisation est possible.
8
RM-CYC-014
L’utilisateur est immédiatement informé de toute suspension ou désactivation selon les canaux de communication de GROUPI.
8
RM-CYC-015
Un compte utilisateur ne peut se trouver que dans un seul état à un instant donné. Les états PENDING_VALIDATION, ACTIVE, SUSPENDED, DISABLED et ARCHIVED sont mutuellement exclusifs.
8
RM-CYC-016
La suspension ne modifie jamais les rôles attribués au compte.
8
RM-CYC-017
La réactivation restitue automatiquement les rôles précédemment attribués.
8
RM-CYC-018
Une opération d’anonymisation ne modifie jamais les identifiants techniques utilisés par les historiques.
8
RM-CYC-019
Un compte archivé ne peut jamais être réactivé.
8
RM-CYC-020
L’expiration d’un abonnement entraîne la suspension automatique du compte Professeur après un délai de grâce de 7 jours.
8
RM-CYC-021
Pendant la suspension, les fonctionnalités de création, modification et acceptation sont bloquées. La consultation reste possible.
8
RM-CYC-022
Les Administrateurs sont créés exclusivement par le Super Administrateur. Ils ne sont pas soumis au processus de validation des autres utilisateurs.
8
RM-CYC-023
Les critères d’archivage d’un compte sont définis par la politique d’archivage de GROUPI. Une période prolongée d’inactivité constitue un critère possible mais ne déclenche pas automatiquement l’archivage.
8
RM-CYC-024
La validation d’un compte Parent ou Professeur est effectuée par un Administrateur autorisé.
8
RM-CYC-025
Un compte en attente de validation depuis plus de 30 jours est automatiquement signalé à un Administrateur.
8
RM-CYC-026
Toute tentative de transition vers un état non autorisé est refusée et enregistrée dans le journal d’audit.
8
RM-CYC-027
Tout changement d’état rendant le compte indisponible (SUSPENDED, DISABLED ou ARCHIVED) entraîne immédiatement l’invalidation de l’ensemble des sessions actives et des jetons d’authentification.
8
RM-CYC-028
Les rôles attribués à un utilisateur sont conservés lors d’une suspension ou d’une désactivation. Seul l’état du compte détermine les fonctionnalités accessibles.
8
RM-CYC-029
Toute modification de l’état d’un compte enregistre automatiquement : - la date, - l’auteur, - l’ancien état, - le nouvel état, - le motif, - le commentaire éventuel.
8
RM-CYC-030
Le compte Super Administrateur ne peut jamais être désactivé, suspendu, anonymisé ou archivé depuis l’application.
8
RM-CYC-031
Les changements d’état d’un compte sont atomiques : une transition est soit entièrement appliquée, soit totalement annulée en cas d’erreur.
8
RM-CYC-032
Les notifications liées à un changement d’état sont émises uniquement après la validation complète de la transition et l’enregistrement réussi de celle-ci dans le journal d’audit.
8
RM-CYC-033
Toute transition d’état est réalisée dans une transaction garantissant la cohérence entre l’état du compte, les sessions actives, les jetons d’authentification, le journal d’audit et les notifications.
8

Domaine SEC — Sécurité des accès
Code
Règle
Chap.
RM-SEC-001
L’adresse e-mail ou le numéro de téléphone (au choix de l’utilisateur à l’inscription) constitue l’identifiant unique du compte.
9
RM-SEC-002
Les mots de passe sont stockés sous forme hachée.
9
RM-SEC-003
Les mots de passe ne sont jamais accessibles aux administrateurs.
9
RM-SEC-004
La demande de réinitialisation du mot de passe invalide automatiquement tous les liens de réinitialisation précédemment émis.
9
RM-SEC-005
Le lien de réinitialisation possède une durée de validité limitée et un usage unique.
9
RM-SEC-006
Chaque connexion crée une session utilisateur.
9
RM-SEC-007
La session expire automatiquement après une période d’inactivité ou après une déconnexion volontaire.
9
RM-SEC-008
Les comptes GROUPI sont strictement personnels. Le partage volontaire d’un compte est interdit.
9
RM-SEC-009
Après plusieurs tentatives d’authentification échouées, GROUPI peut retarder les nouvelles tentatives, verrouiller temporairement le compte ou notifier l’utilisateur.
9
RM-SEC-010
Le Super Administrateur peut invalider toutes les sessions d’un utilisateur en cas de demande du titulaire, de suspicion de compromission, de perte d’un appareil, de fraude ou de suspension du compte.
9
RM-SEC-011
Les sessions expirent après 30 minutes d’inactivité.
9
RM-SEC-012
Les comptes Administrateur sont soumis à des exigences de sécurité renforcées dès la Version 1 (mots de passe d’au moins 16 caractères, journalisation exhaustive, non-partage de session, principe du moindre privilège). L’authentification à deux facteurs, également prévue pour ces comptes, sera disponible en Version 2.
9
RM-SEC-013
Le score de risque d’un compte est calculé sur une échelle de 0 à 100, à partir des indices de connexions inhabituelles et de partage de compte. Un score > 70 génère une alerte.
9
RM-SEC-014
Toute connexion depuis un nouvel appareil génère une notification à l’utilisateur.
9
RM-SEC-015
Les liens de réinitialisation de mot de passe ont une validité de 15 minutes.
9
RM-SEC-016
Après 5 tentatives de connexion échouées consécutives, le compte est verrouillé pour 15 minutes.
9
RM-SEC-017
La modification du mot de passe entraîne la déconnexion de toutes les sessions actives.
9
RM-SEC-018
Les Administrateurs ne peuvent pas consulter les mots de passe des utilisateurs.
9
RM-SEC-019
La réinitialisation du mot de passe invalide immédiatement toutes les sessions actives.
9
RM-SEC-020
Un utilisateur peut disposer simultanément de plusieurs sessions actives sur différents appareils.
9
RM-SEC-021
Les événements de sécurité sont conservés conformément à la politique de conservation des journaux de GROUPI.
9
RM-SEC-022
Les mécanismes de détection produisent uniquement des indicateurs de risque et ne constituent jamais une preuve de fraude.
9
RM-SEC-023
Une session invalidée nécessite systématiquement une nouvelle authentification.
9
RM-SEC-024
Toute authentification vérifie préalablement l’état du compte utilisateur.
9
RM-SEC-025
Les sessions utilisateur sont indépendantes les unes des autres et possèdent chacune un identifiant unique.
9
RM-SEC-026
Toute authentification réussie est enregistrée dans le journal des connexions.
9
RM-SEC-027
Toute tentative d’authentification échouée est enregistrée dans le journal de sécurité.
9
RM-SEC-028
Les journaux de connexion et de sécurité ne peuvent être modifiés par aucun utilisateur.
9
RM-SEC-029
Les mesures de sécurité automatiques appliquées à un compte sont proportionnées au niveau de risque calculé.
9
RM-SEC-030
Toute invalidation d’une session entraîne la suppression immédiate des jetons d’authentification associés.
9
RM-SEC-031
Les informations relatives aux appareils utilisés sont conservées uniquement aux fins de sécurité et conformément à la politique de protection des données de GROUPI.
9
RM-SEC-032
Les informations de localisation utilisées pour l’analyse des connexions sont approximatives et ne peuvent jamais constituer une preuve de fraude.
9
RM-SEC-033
Les changements de mot de passe, les réinitialisations et les invalidations de session sont réalisés de manière atomique afin de garantir la cohérence de la sécurité du compte.
9
RM-SEC-034
Toute authentification réussie régénère un nouveau jeton d’authentification sécurisé.
9
RM-SEC-035
Les jetons d’authentification possèdent une durée de validité limitée conformément à la politique de sécurité de GROUPI.
9
RM-SEC-036
Toute déconnexion volontaire invalide immédiatement le jeton d’authentification utilisé.
9
RM-SEC-037
Un compte verrouillé automatiquement retrouve son état normal à l’expiration du délai de verrouillage sans modification de son état métier.
9
RM-SEC-038
Les informations collectées pour le calcul du score de risque ne sont utilisées qu’à des fins de sécurité et ne peuvent être exploitées à des fins commerciales.
9

Domaine GRP — Groupes
Code
Règle
Chap.
RM-GRP-001
Un groupe est obligatoirement associé à un seul Professeur.
10
RM-GRP-002
Un groupe est obligatoirement associé à une seule matière.
10
RM-GRP-003
Un groupe est obligatoirement associé à un seul niveau scolaire.
10
RM-GRP-004
Un groupe est obligatoirement associé à une année académique.
10
RM-GRP-005
La combinaison Matière/Niveau est systématiquement vérifiée grâce au référentiel SubjectLevel.
10
RM-GRP-006
Toute combinaison interdite entraîne le refus de création du groupe.
10
RM-GRP-007
Le planning du groupe est défini par un ou plusieurs créneaux récurrents (jour, heure, durée, mode, lieu).
10
RM-GRP-008
Les séances sont générées automatiquement à partir du planning hebdomadaire du groupe.
10
RM-GRP-009
Le Professeur peut interrompre temporairement la génération automatique des séances (vacances scolaires, jours fériés ou période d’absence) sans modifier le planning hebdomadaire du groupe.
10
RM-GRP-010
Chaque séance est toujours rattachée à un seul lieu d’enseignement.
10
RM-GRP-011
Le Professeur définit librement le tarif public de son groupe.
10
RM-GRP-012
La capacité maximale du groupe est définie par le Professeur lors de la création.
10
RM-GRP-013
Lorsque la capacité maximale est atteinte, le comportement du groupe dépend du choix de visibilité du Professeur.
10
RM-GRP-014
Un groupe complet ne peut plus accepter de nouvelles inscriptions.
10
RM-GRP-015
Un groupe peut être dupliqué par le Professeur. La duplication ne conserve jamais les élèves, les présences, les paiements, les commentaires ou les séances réalisées.
10
RM-GRP-016
Après la première inscription, le Professeur ne peut plus modifier la matière, le niveau ou l’année académique du groupe.
10
RM-GRP-017
Un groupe clôturé ou archivé conserve son historique pédagogique et comptable.
10
RM-GRP-018
La capacité maximale du groupe est limitée par la capacité de l’abonnement actif du Professeur.
10
RM-GRP-019
L’acceptation d’une inscription est conditionnée par la capacité disponible du groupe ET de l’abonnement.
10
RM-GRP-020
Un groupe peut être créé sans élève et maintenu actif par le Professeur.
10
RM-GRP-021
GROUPI détecte les conflits de planning entre groupes d’un même Professeur et génère une alerte non bloquante en Version 1.
10
RM-GRP-022
La modification du tarif public d’un groupe ne s’applique qu’aux nouvelles inscriptions.
10
RM-GRP-023
La suppression d’un créneau de planning entraîne la suppression des séances futures non réalisées associées (avec confirmation).
10
RM-GRP-024
Un Professeur ne peut pas créer deux groupes actifs ayant simultanément la même matière, le même niveau scolaire, la même année académique et le même planning hebdomadaire.
10
RM-GRP-025
La capacité maximale d’un groupe ne peut jamais être inférieure au nombre d’élèves actuellement inscrits.
10
RM-GRP-026
Le tarif public du groupe doit être supérieur ou égal à zéro.
10
RM-GRP-027
La duplication d’un groupe crée systématiquement un nouveau groupe indépendant disposant d’un nouvel identifiant.
10
RM-GRP-028
Toute modification du planning hebdomadaire n’affecte que les séances futures générées après cette modification.
10
RM-GRP-029
Une séance exceptionnelle ne modifie jamais le planning hebdomadaire du groupe.
10
RM-GRP-030
L’interruption temporaire de la génération des séances n’entraîne ni la suppression du groupe ni la modification de ses paramètres.
10
RM-GRP-031
Un groupe peut être associé à plusieurs lieux d’enseignement, mais chaque séance est obligatoirement rattachée à un seul lieu.
10
RM-GRP-032
La visibilité d’un groupe dans les recherches dépend exclusivement des paramètres définis par le Professeur.
10
RM-GRP-033
Seul un Professeur dont le compte est ACTIVE peut créer un groupe.
10
RM-GRP-034
Seul un Professeur propriétaire du groupe peut modifier celui-ci.
10
RM-GRP-035
Le groupe appartient toujours à un unique Professeur.
10
RM-GRP-036
Les séances déjà réalisées ne sont jamais modifiées automatiquement.
10
RM-GRP-037
Le groupe dupliqué est créé avec un nouvel identifiant et un statut BROUILLON.
10
RM-GRP-038
Un groupe ARCHIVE ne peut jamais redevenir OUVERT.
10
RM-GRP-039
Toute modification importante du groupe est historisée.
10
RM-GRP-040
La suppression physique d’un groupe possédant un historique pédagogique ou comptable est interdite.
10
RM-GRP-041
La date de fin d’un groupe, lorsqu’elle est renseignée, doit être postérieure à sa date de début.
10
RM-GRP-042
Un groupe ne peut être ouvert que s’il possède au moins un créneau de planning actif et valide.
10
RM-GRP-043
Lorsqu’une place se libère dans un groupe COMPLET, celui-ci repasse automatiquement à l’état OUVERT, sauf s’il a été préalablement clôturé.
10
RM-GRP-044
Un groupe BROUILLON n’est visible que par son Professeur et ne peut recevoir aucune demande d’inscription tant qu’il n’a pas été ouvert.
10
RM-GRP-045
Un groupe clôturé ne peut plus être rouvert ni accepter de nouvelles inscriptions.
10

Domaine PRE — Préinscriptions
Code
Règle
Chap.
RM-PRE-001
Une préinscription concerne exclusivement une année académique future.
11
RM-PRE-002
Une préinscription n’engage ni le Parent ni le Professeur.
11
RM-PRE-003
Une préinscription n’empêche jamais le Parent d’effectuer une demande d’inscription classique sur un autre groupe.
11
RM-PRE-004
Un même élève peut disposer simultanément de plusieurs préinscriptions pour une même année académique.
11
RM-PRE-005
Le Professeur choisit librement la date d’ouverture et de fermeture des préinscriptions.
11
RM-PRE-006
Le Professeur peut consulter ses préinscriptions dans un espace dédié.
11
RM-PRE-007
Les préinscriptions ne créent jamais automatiquement un groupe ni une inscription.
11
RM-PRE-008
À la création d’un groupe, GROUPI recherche automatiquement les préinscriptions compatibles (même année académique, même matière, même niveau).
11
RM-PRE-009
Les préinscriptions compatibles sont proposées au Professeur.
11
RM-PRE-010
Après la création du groupe, GROUPI informe automatiquement les Parents concernés.
11
RM-PRE-011
En cas de confirmation du Parent, GROUPI transforme automatiquement la préinscription en demande d’inscription.
11
RM-PRE-012
Une fois la demande d’inscription créée, la préinscription est automatiquement clôturée et ne peut plus être réutilisée.
11
RM-PRE-013
Chaque proposition possède une date limite de réponse. À l’expiration, la préinscription passe à l’état Expirée.
11
RM-PRE-014
Les confirmations sont traitées selon l’ordre chronologique. Une fois la capacité maximale atteinte, les confirmations suivantes ne peuvent plus être transformées en demandes d’inscription.
11
RM-PRE-015
Une préinscription ne peut être créée que si les préinscriptions sont ouvertes pour le Professeur concerné.
11
RM-PRE-016
Une préinscription ne peut concerner qu’un élève appartenant au Parent connecté.
11
RM-PRE-017
Une préinscription expirée ne peut jamais être réactivée.
11
RM-PRE-018
Une préinscription transformée en demande d’inscription conserve l’intégralité de son historique.
11
RM-PRE-019
Une préinscription clôturée ne peut plus être modifiée.
11
RM-PRE-020
Le Parent peut annuler une préinscription tant qu’aucune proposition ne lui a été envoyée.
11
RM-PRE-021
Une proposition envoyée ne réserve jamais une place dans le groupe.
11
RM-PRE-022
La confirmation d’une proposition déclenche la création d’une demande d’inscription si les capacités du groupe et de l’abonnement le permettent.
11
RM-PRE-023
Une préinscription ne peut jamais être créée pour une année académique déjà terminée ou actuellement en cours.
11
RM-PRE-024
La transformation d’une préinscription en demande d’inscription est conditionnée par la capacité disponible du groupe et par la capacité disponible de l’abonnement du Professeur.
11
RM-PRE-025
Un élève ne peut avoir qu’une seule préinscription active par Professeur et par année académique.
11
RM-PRE-026
Le Parent peut retirer sa confirmation tant que la demande d’inscription issue de la préinscription n’a pas été traitée par le Professeur.
11
RM-PRE-027
Le niveau scolaire indiqué dans la préinscription doit être cohérent avec la progression naturelle de l’élève. Une incohérence génère une alerte.
11
RM-PRE-028
Si le Professeur ne crée pas de groupe correspondant avant la date de début de l’année académique, la préinscription est automatiquement clôturée.
11
RM-PRE-029
Les administrateurs peuvent consulter l’ensemble des préinscriptions dans le cadre de leurs autorisations.
11
RM-PRE-030
Une place est réservée uniquement lors de la création effective de la demande d’inscription, sous réserve que le groupe dispose encore de places disponibles.
11
RM-PRE-031
Une préinscription ne peut être modifiée que tant qu’aucune proposition n’a été envoyée.
11

Domaine INS — Inscriptions
Code
Règle
Chap.
RM-INS-001
Une inscription concerne un seul enfant.
12
RM-INS-002
Une inscription concerne un seul groupe.
12
RM-INS-003
Chaque inscription possède son propre historique pédagogique, historique des présences, historique des commentaires et compte de suivi comptable.
12
RM-INS-004
Un même élève peut être inscrit simultanément dans plusieurs groupes.
12
RM-INS-005
Les informations d’une inscription n’ont aucune incidence sur les autres inscriptions de l’élève.
12
RM-INS-006
Le Parent est toujours à l’origine de la recherche.
12
RM-INS-007
La recherche peut s’effectuer par : nom du Professeur, matière, niveau, ville, mode d’enseignement.
12
RM-INS-008
Avant inscription, le Parent peut consulter toutes les informations publiques du groupe.
12
RM-INS-009
Une demande d’inscription ne garantit jamais l’admission dans le groupe.
12
RM-INS-010
Un élève ne peut posséder qu’une seule inscription active dans un même groupe pour une même année académique.
12
RM-INS-011
Avant validation, GROUPI vérifie automatiquement : compte actif, abonnement compatible, groupe actif, groupe non complet, parent validé, année académique ouverte, élève non déjà inscrit.
12
RM-INS-012
Si l’une des vérifications échoue, la demande est refusée automatiquement.
12
RM-INS-013
Le Professeur est seul décisionnaire pour accepter ou refuser une inscription.
12
RM-INS-014
Le comportement de paiement est calculé automatiquement par GROUPI à partir de l’historique des paiements du Parent pour l’année académique en cours.
12
RM-INS-015
Seul un indicateur synthétique (Excellent, Moyen ou Mauvais) est communiqué au Professeur.
12
RM-INS-016
Aucune information détaillée concernant les autres Professeurs, les montants ou les impayés n’est jamais affichée.
12
RM-INS-017
Le tarif personnalisé s’applique uniquement aux séances futures.
12
RM-INS-018
Les séances déjà réalisées ne peuvent jamais être recalculées.
12
RM-INS-019
Le tarif personnalisé reste modifiable tant qu’aucune séance future n’a été facturée.
12
RM-INS-020
Le paiement reste toujours réalisé directement entre le Parent et le Professeur. GROUPI n’intervient jamais dans la transaction.
12
RM-INS-021
Chaque inscription possède son propre compte de suivi comptable.
12
RM-INS-022
Deux inscriptions d’un même élève possèdent toujours deux comptes comptables distincts.
12
RM-INS-023
Les historiques pédagogiques et comptables restent définitivement rattachés au groupe d’origine en cas de changement.
12
RM-INS-024
Une inscription est toujours rattachée à une seule année académique.
12
RM-INS-025
L’acceptation d’une inscription est conditionnée par la capacité disponible du groupe et par la capacité disponible de l’abonnement du Professeur.
12
RM-INS-026
Le Professeur dispose d’un délai de 7 jours pour répondre à une demande d’inscription. Passé ce délai, la demande expire automatiquement.
12
RM-INS-027
En cas de changement de groupe, une place se libère dans l’ancien groupe et une place est consommée dans le nouveau groupe.
12
RM-INS-028
Les groupes complets masqués ne sont jamais affichés dans les résultats de recherche.
12
RM-INS-029
En début d’année académique, le comportement de paiement est calculé sur l’année précédente si disponible.
12
RM-INS-030
Un Parent ne peut pas soumettre une nouvelle demande d’inscription pour un élève déjà inscrit dans le même groupe (ERR-INS-002).
12
RM-INS-031
Une inscription est toujours rattachée à la situation scolaire active de l’élève au moment de sa création.
12
RM-INS-032
Une inscription refusée ne peut jamais être réactivée.
12
RM-INS-033
Une inscription archivée ne peut plus être modifiée.
12
RM-INS-034
Une inscription suspendue conserve l’ensemble de ses données pédagogiques et comptables.
12
RM-INS-035
La suspension d’une inscription n’entraîne jamais la suppression des séances déjà réalisées.
12
RM-INS-036
Une inscription ne peut être créée que dans un groupe dont les inscriptions sont ouvertes.
12
RM-INS-037
Une inscription ne peut être créée que pour un groupe appartenant à une année académique ouverte.
12
RM-INS-038
Une demande d’inscription en attente peut être annulée par le Parent tant qu’aucune décision n’a été prise par le Professeur.
12
RM-INS-039
Un Professeur ne peut accepter une demande d’inscription que si une place est encore disponible au moment de sa décision.
12
RM-INS-040
Une demande d’inscription annulée ne peut jamais être réactivée.
12
RM-INS-041
Une inscription ACTIVE consomme immédiatement une place dans le groupe ainsi qu’une capacité de l’abonnement du Professeur.
12
RM-INS-042
Une inscription suspendue continue d’exister administrativement mais ne permet plus la participation aux séances tant qu’elle n’est pas réactivée.
12
RM-INS-043
Une inscription archivée est conservée sans limite de durée à des fins de traçabilité pédagogique et comptable.
12
RM-INS-044
Le changement de groupe crée systématiquement une nouvelle inscription indépendante. Les historiques de l’inscription d’origine ne sont jamais transférés.
12
RM-INS-045
Le compte de suivi comptable est créé uniquement lors de l’activation de l’inscription. Il est définitivement rattaché à cette inscription.
12
RM-INS-046
Une inscription ne peut jamais appartenir simultanément à plusieurs groupes.
12
RM-INS-047
Un Parent peut consulter à tout moment l’état de ses demandes d’inscription.
12
RM-INS-048
Toutes les décisions du Professeur concernant une demande d’inscription sont historisées avec leur date et leur auteur.
12
RM-INS-049
Une demande d’inscription ne peut plus être annulée dès qu’une décision du Professeur est enregistrée.
12
RM-INS-050
Le changement de groupe crée une nouvelle inscription disposant de son propre compte de suivi comptable, de son propre tarif personnalisé, de son propre historique pédagogique et de ses propres présences.
12
RM-INS-051
Une place libérée à la suite d’une archive ou d’un changement de groupe redevient immédiatement disponible.
12
RM-INS-052
Une inscription suspendue ne peut générer aucune nouvelle présence, absence, facturation ou séance tant qu’elle n’est pas réactivée.
12
RM-INS-053
Une inscription archivée ne peut jamais revenir à l’état ACTIVE.
12
RM-INS-054
L’acceptation d’une demande d’inscription déclenche automatiquement la création de l’inscription ACTIVE ainsi que de son compte de suivi comptable.
12
RM-INS-055
L’acceptation d’une demande d’inscription entraîne automatiquement le passage de l’état EN_ATTENTE à ACTIVE.
12
RM-INS-056
La capacité de l’abonnement est vérifiée une seconde fois au moment exact de l’acceptation par le Professeur.
12
RM-INS-057
Une inscription ACTIVE ne peut jamais être dupliquée.
12
RM-INS-058
Une demande d’inscription expirée conserve son historique mais ne peut jamais être réactivée.
12

Domaine SES — Séances
Code
Règle
Chap.
RM-SES-001
Une séance est toujours rattachée à un seul groupe.
13
RM-SES-002
Une séance est en présentiel ou en ligne.
13
RM-SES-003
Les séances sont générées automatiquement à partir du planning hebdomadaire du groupe.
13
RM-SES-004
GROUPI garantit qu’une même séance n’est jamais générée deux fois pour un même groupe, une même date et un même créneau horaire.
13
RM-SES-005
Le Professeur peut créer une séance exceptionnelle, déplacer une séance future ou supprimer une séance future.
13
RM-SES-006
Les modifications du Professeur n’ont aucune incidence sur le planning hebdomadaire du groupe.
13
RM-SES-007
Pendant une période d’interruption, aucune nouvelle séance n’est générée, les inscriptions restent actives et les historiques restent inchangés.
13
RM-SES-008
Les périodes d’interruption n’affectent jamais le planning hebdomadaire du groupe. Elles suspendent uniquement la génération.
13
RM-SES-009
Une séance initialement prévue en présentiel peut exceptionnellement être transformée en séance en ligne.
13
RM-SES-010
Le changement de mode d’enseignement ne modifie jamais le mode d’enseignement habituel du groupe.
13
RM-SES-011
Les Parents sont immédiatement informés d’un changement de mode. Chaque Parent peut accepter ou refuser la participation de son enfant.
13
RM-SES-012
En cas de refus, l’élève est considéré comme Absent excusé. Cette absence n’est pas prise en compte dans le calcul des absences consécutives.
13
RM-SES-013
Pendant les 48 heures suivant la fin d’une séance, le Professeur peut corriger la présence d’un élève ou la facturation.
13
RM-SES-014
Toute modification entraîne une notification immédiate au Parent, une mise à jour du compte de suivi comptable et l’enregistrement dans l’historique.
13
RM-SES-015
Après 48 heures, la séance devient définitivement verrouillée. Aucune modification n’est alors autorisée.
13
RM-SES-016
Une séance planifiée peut être annulée par le Professeur avant sa réalisation.
13
RM-SES-017
L’annulation entraîne une notification aux Parents, l’absence de génération d’écritures comptables et la conservation de la trace.
13
RM-SES-018
Une séance annulée ne peut jamais être réactivée. Si nécessaire, une nouvelle séance devra être créée.
13
RM-SES-019
Une séance verrouillée constitue un élément historique. Elle ne peut jamais être modifiée, supprimée ou remplacée.
13
RM-SES-020
En cas d’erreur exceptionnelle, seule une opération d’ajustement comptable pourra être réalisée, sans modifier les données pédagogiques.
13
RM-SES-021
Les séances exceptionnelles sont gérées exactement comme les séances générées automatiquement.
13
RM-SES-022
La génération de nouvelles séances est suspendue si aucun élève ne s’est inscrit au groupe.
13
RM-SES-023
La génération de nouvelles séances est suspendue lorsque l’abonnement du Professeur est expiré ou suspendu.
13
RM-SES-024
GROUPI détecte les conflits de planning pour un même Professeur et génère une alerte non bloquante en Version 1.
13
RM-SES-025
Pour chaque séance et chaque élève, le Professeur peut saisir : Présent, Absent non excusé, Absent excusé, Retard.
13
RM-SES-026
Lorsqu’un élève atteint le seuil d’abandon (3 absences consécutives non excusées), une alerte est générée.
13
RM-SES-027
Le report d’une séance annule la séance initiale et crée une nouvelle séance à la date choisie.
13
RM-SES-028
À la fin d’une période d’interruption, les séances sont générées à partir de la date de reprise. Aucune séance n’est générée rétroactivement.
13
RM-SES-029
GROUPI limite la génération automatique des séances dans le futur à la durée de l’année académique.
13
RM-SES-030
Une séance appartient toujours à une seule année académique.
13
RM-SES-031
Une séance est toujours rattachée à un seul Professeur via son groupe.
13
RM-SES-032
Une séance ne peut être créée que pour un groupe actif appartenant à une année académique ouverte.
13
RM-SES-033
Une séance annulée ne génère jamais d’écriture comptable.
13
RM-SES-034
Une séance reportée conserve la référence de la séance d’origine afin d’assurer la traçabilité.
13
RM-SES-035
Toute modification autorisée d’une séance est historisée avec la date, l’auteur et les valeurs avant/après modification.
13
RM-SES-036
Une séance verrouillée ne peut jamais être déverrouillée automatiquement. Seul un Super Administrateur peut effectuer un déverrouillage exceptionnel, lequel est obligatoirement historisé.
13
RM-SES-037
Les présences ne peuvent être saisies que pour une séance dont l’état est TERMINEE.
13
RM-SES-038
Une séance ne peut être marquée comme TERMINEE que lorsque son heure de fin planifiée est atteinte ou dépassée.
13
RM-SES-039
La suppression d’une séance future ne supprime jamais son historique d’audit.
13
RM-SES-040
Les présences ne peuvent être saisies qu’une seule fois. Toute modification ultérieure est considérée comme une correction et suit les règles de modification des séances.
13
RM-SES-041
Les commentaires pédagogiques peuvent être modifiés pendant la période autorisée de correction de la séance. Chaque modification est historisée.
13
RM-SES-042
Les écritures comptables d’une séance ne peuvent être générées qu’une seule fois. Toute correction ultérieure est réalisée exclusivement au moyen d’écritures d’ajustement.
13
RM-SES-043
Le report d’une séance conserve l’ensemble des inscriptions du groupe. Aucune nouvelle inscription n’est créée.
13
RM-SES-044
Toute modification exceptionnelle d’une séance entraîne automatiquement une notification aux Parents concernés.
13
RM-SES-045
À chaque modification du planning hebdomadaire, des périodes d’interruption ou de la date de fin du groupe, GROUPI recalcule uniquement les séances futures concernées. Les séances passées ne sont jamais modifiées.
13
RM-SES-046
Une séance exceptionnelle n’entraîne jamais la modification du planning hebdomadaire du groupe.
13
RM-SES-047
L’enregistrement d’un paiement pendant une séance ne modifie jamais les informations pédagogiques de la séance. Il impacte uniquement le compte de suivi comptable de l’inscription concernée.
13

Domaine ATT — Présences
Code
Règle
Chap.
RM-ATT-001
Une présence est enregistrée pour une séance et pour un élève.
14
RM-ATT-002
Une présence ne peut être saisie que par le Professeur responsable du groupe.
14
RM-ATT-003
Chaque élève doit obligatoirement recevoir un statut.
14
RM-ATT-004
Les statuts autorisés sont : Présent, Absent excusé, Absent non excusé, Retard.
14
RM-ATT-005
Le retard est un indicateur d’assiduité. La séance reste facturée en entier au tarif habituel.
14
RM-ATT-006
Dès validation des présences, GROUPI informe automatiquement le Parent concerné.
14
RM-ATT-007
La validation des présences peut entraîner automatiquement la création d’écritures comptables selon les règles du groupe.
14
RM-ATT-008
Une écriture comptable n’est générée qu’une seule fois pour une présence validée.
14
RM-ATT-009
Pendant les 48 heures suivant la fin de la séance, le Professeur peut modifier une présence.
14
RM-ATT-010
Après expiration du délai, aucune modification directe n’est autorisée. Toute correction ultérieure est réalisée sous forme d’ajustement administratif.
14
RM-ATT-011
Toutes les présences sont conservées définitivement. Aucune présence n’est supprimée.
14
RM-ATT-012
Les présences alimentent automatiquement les tableaux de bord et les statistiques.
14
RM-ATT-013
Le seuil d’abandon est fixé par défaut à 3 absences consécutives non excusées. Le Professeur peut modifier ce seuil.
14
RM-ATT-014
Lorsque le seuil est atteint, GROUPI affiche une alerte. La décision appartient exclusivement au Professeur.
14
RM-ATT-015
L’ensemble des présences constitue le registre officiel de présence du groupe.
14
RM-ATT-016
Le Parent peut signaler l’absence de son enfant jusqu’à 24 heures avant le début de la séance via la messagerie intégrée.
14
RM-ATT-017
Le statut "Retard" est un sous-statut de "Présent". L’élève est considéré comme présent, avec un indicateur de retard.
14
RM-ATT-018
Les statistiques d’assiduité sont calculées depuis le début du groupe, depuis le début de l’année académique et sur les 30 derniers jours.
14
RM-ATT-019
Pour les séances en ligne, le Professeur peut indiquer une durée effective de connexion.
14
RM-ATT-020
Le signalement d’absence effectué par le Parent avant la séance constitue une information transmise au Professeur. Celui-ci reste seul habilité à qualifier définitivement l’absence comme excusée ou non excusée.
14
RM-ATT-021
Une présence appartient définitivement à une seule séance.
14
RM-ATT-022
Une présence appartient définitivement à une seule inscription.
14
RM-ATT-023
Une présence verrouillée ne peut jamais être supprimée.
14
RM-ATT-024
La désinscription d’un élève n’affecte jamais les présences déjà enregistrées.
14
RM-ATT-025
Le signalement d’une absence par le Parent ne modifie jamais automatiquement le statut de présence.
14
RM-ATT-026
Un élève ne peut posséder qu’une seule présence par séance.
14
RM-ATT-027
Une séance ne peut être validée définitivement que lorsque tous les élèves disposent d’un statut de présence.
14
RM-ATT-028
Toute modification autorisée d’une présence est historisée avec la date, l’auteur, les anciennes valeurs et les nouvelles valeurs.
14
RM-ATT-029
Le verrouillage d’une présence est automatique à l’expiration du délai de modification défini au Chapitre Les séances.
14
RM-ATT-030
Les écritures comptables générées à partir des présences respectent exclusivement les règles de facturation définies pour le groupe.
14
RM-ATT-031
Le seuil de retards déclenchant une alerte est paramétrable par le Professeur.
14
RM-ATT-032
Les absences sont calculées uniquement pendant que l’inscription est ACTIVE.
14

Domaine CPT — Comptabilité
Code
Règle
Chap.
RM-CPT-001
Chaque inscription possède son propre compte de suivi comptable.
15
RM-CPT-002
Un compte de suivi comptable est créé automatiquement lors de l’activation d’une inscription.
15
RM-CPT-003
Le compte appartient à l’inscription. Il ne dépend ni du Parent ni de l’Élève.
15
RM-CPT-004
Le compte de suivi comptable est constitué d’écritures.
15
RM-CPT-005
Une écriture est soit un crédit (paiement), soit un débit (séance facturée).
15
RM-CPT-006
Le solde est calculé automatiquement selon la formule : Solde = Total des crédits - Total des débits.
15
RM-CPT-007
Le solde est recalculé automatiquement après chaque création, modification autorisée ou annulation d’écriture.
15
RM-CPT-008
Les types d’écritures sont : PAYMENT (paiement), SESSION (facturation automatique), ADJUSTMENT (ajustement exceptionnel).
15
RM-CPT-009
Une écriture SESSION n’est générée qu’après validation définitive des présences.
15
RM-CPT-010
Les règles de facturation sont définies au niveau du groupe et connues du Parent avant l’inscription.
15
RM-CPT-011
Le Professeur enregistre manuellement chaque paiement reçu.
15
RM-CPT-012
GROUPI ne reçoit jamais l’argent. Dans la Version 1, aucun paiement électronique n’est réalisé par la plateforme.
15
RM-CPT-013
Le Parent ne peut consulter que les comptes correspondant à ses propres enfants.
15
RM-CPT-014
Le chiffre d’affaires prévisionnel est calculé à partir des séances futures planifiées susceptibles de générer une facturation.
15
RM-CPT-015
Le chiffre d’affaires réalisé correspond aux séances effectivement réalisées et facturées.
15
RM-CPT-016
Le chiffre d’affaires encaissé correspond exclusivement aux paiements enregistrés par le Professeur.
15
RM-CPT-017
Toutes les écritures comptables sont conservées. Aucune écriture n’est supprimée. Un ajustement crée une nouvelle écriture.
15
RM-CPT-018
Un paiement peut être partiel. Plusieurs paiements partiels peuvent être enregistrés pour la même inscription.
15
RM-CPT-019
Les ajustements comptables sont autorisés pendant la fenêtre de 48 heures suivant la séance. Passé ce délai, un ajustement administratif est nécessaire.
15
RM-CPT-020
À la fin de chaque année académique, les comptes sont verrouillés. Aucune modification n’est autorisée sauf ajustement exceptionnel validé par un Administrateur.
15
RM-CPT-021
L’indicateur de comportement de paiement du Parent est calculé à partir des données du moteur comptable.
15
RM-CPT-022
Un solde débiteur est considéré comme "important" lorsqu’il dépasse l’équivalent de 4 séances au tarif appliqué.
15
RM-CPT-023
Les modes de paiement (espèces, chèque, virement, etc.) peuvent être indiqués à titre indicatif lors de l’enregistrement d’un paiement.
15
RM-CPT-024
Une écriture appartient définitivement à un seul compte de suivi comptable.
15
RM-CPT-025
Une écriture appartient définitivement à une seule inscription.
15
RM-CPT-026
Une séance ne peut générer qu’une seule écriture SESSION.
15
RM-CPT-027
Un paiement ne peut générer qu’une seule écriture PAYMENT.
15
RM-CPT-028
Une écriture comptable ne peut jamais être supprimée.
15
RM-CPT-029
L’annulation d’une opération comptable est réalisée par une nouvelle écriture.
15
RM-CPT-030
Les montants enregistrés sont toujours positifs. Le sens comptable (crédit ou débit) est déterminé par le type d’écriture.
15
RM-CPT-031
Le solde d’un compte est toujours calculé. Il n’est jamais stocké comme valeur métier de référence.
15
RM-CPT-032
Toute écriture est horodatée.
15
RM-CPT-033
Toute écriture possède un auteur.
15
RM-CPT-034
Toute écriture possède une référence métier.
15
RM-CPT-035
Une écriture comptable est créée dans l’ordre chronologique de sa date d’effet.
15
RM-CPT-036
Une écriture ne peut jamais être rattachée à plusieurs comptes de suivi comptable.
15
RM-CPT-037
Les indicateurs financiers sont calculés exclusivement à partir des écritures comptables validées.
15
RM-CPT-038
Les écritures doivent avoir un numéro séquentiel de type : ECR-2026-000001.
15
RM-CPT-039
Chaque paiement génère exactement une écriture comptable de type PAYMENT.
15
RM-CPT-040
Chaque validation définitive de séance génère exactement une écriture SESSION.
15

Domaine DSH — Tableaux de bord
Code
Règle
Chap.
RM-DSH-001
Chaque utilisateur dispose d’un tableau de bord adapté à son rôle.
16
RM-DSH-002
Le tableau de bord constitue le point d’entrée principal de GROUPI.
16
RM-DSH-003
Les informations affichées dépendent des autorisations de l’utilisateur.
16
RM-DSH-004
Le tableau de bord du Professeur est organisé autour de plusieurs espaces : Activité, Présences, Comptabilité, Paiements, Groupes, Profil, Statistiques, Préinscriptions.
16
RM-DSH-005
Le tableau de bord du Parent présente une vue consolidée par enfant (groupes, séances, commentaires, présences, retards, solde comptable).
16
RM-DSH-006
Le Parent peut signaler l’absence prévisible de son enfant avant le début d’une séance.
16
RM-DSH-007
Le contenu du tableau de bord de l’Administrateur dépend entièrement des autorisations accordées par le Super Administrateur.
16
RM-DSH-008
Le Super Administrateur dispose d’une vision complète de l’ensemble de la plateforme. Il peut accéder aux tableaux de bord des autres utilisateurs en mode consultation.
16
RM-DSH-009
Les tableaux de bord sont mis à jour automatiquement après chaque opération importante.
16
RM-DSH-010
GROUPI met en évidence les situations nécessitant une action rapide (alertes).
16
RM-DSH-011
Les statistiques avancées sont accessibles à partir de l’offre Intermédiaire. L’offre Découverte affiche une invitation à évoluer.
16
RM-DSH-012
Le tableau de bord du Professeur peut être exporté aux formats PDF et Excel selon les droits d’abonnement.
16
RM-DSH-013
Les indicateurs du tableau de bord sont calculés en temps réel. Les statistiques historiques sont recalculées périodiquement.
16

Domaine EXP — Exports
Code
Règle
Chap.
RM-EXP-001
Les fonctionnalités d’export sont réservées aux offres payantes.
17
RM-EXP-002
Un Professeur ne peut exporter que les données auxquelles il est autorisé à accéder.
17
RM-EXP-003
Le Professeur ne peut jamais exporter les données d’un autre Professeur, d’un groupe ne lui appartenant pas, ou les informations administratives de GROUPI.
17
RM-EXP-004
Les formats disponibles sont : PDF, Excel, CSV.
17
RM-EXP-005
Le Professeur est seul responsable des fichiers exportés après leur téléchargement.
17
RM-EXP-006
Chaque export est automatiquement enregistré dans le journal des exports.
17
RM-EXP-007
Les fichiers exportés constituent une photographie des données au moment de leur génération.
17
RM-EXP-008
Les fichiers d’export générés sont conservés pendant 7 jours sur la plateforme. Passé ce délai, ils sont automatiquement supprimés.
17
RM-EXP-009
La limite de volume pour un export synchrone est fixée à 10 000 lignes ou 5 Mo. Au-delà, l’export est généré de manière asynchrone.
17
RM-EXP-010
Les Parents peuvent exporter les données de suivi de leurs enfants au format PDF uniquement.
17
RM-EXP-011
Les Administrateurs peuvent exporter des données statistiques agrégées selon leurs autorisations.
17
RM-EXP-012
Le journal des exports ne contient pas les données exportées elles-mêmes.
17
RM-EXP-013
Les statistiques avancées peuvent être exportées à partir de l’offre Intermédiaire.
17
RM-EXP-014
Les exports respectent toujours les droits d’accès applicables au moment de leur génération.
17
RM-EXP-015
Un lien de téléchargement est personnel, temporaire et ne peut être utilisé que par son auteur.
17

Domaine NOT — Notifications
Code
Règle
Chap.
RM-NOT-001
Toute action importante génère automatiquement une activité.
18
RM-NOT-002
Une activité peut produire une notification selon sa nature et son niveau d’importance.
18
RM-NOT-003
Chaque utilisateur dispose d’un centre d’activités personnel.
18
RM-NOT-004
Une activité est systématiquement créée, même lorsqu’aucune notification n’est envoyée.
18
RM-NOT-005
Les activités sont classées automatiquement de la plus récente à la plus ancienne.
18
RM-NOT-006
GROUPI distingue trois niveaux de priorité : Information, Important, Critique.
18
RM-NOT-007
Un même événement ne peut générer qu’une seule notification par canal de communication.
18
RM-NOT-008
Dans la Version 1, les canaux disponibles sont : Centre d’activités (obligatoire) et Courrier électronique.
18
RM-NOT-009
Les notifications critiques sont transmises par Centre d’activités + E-mail.
18
RM-NOT-010
Les activités peuvent être archivées mais jamais supprimées.
18
RM-NOT-011
Chaque activité conserve : date, heure, utilisateur concerné, type d’événement, niveau de priorité, état.
18
RM-NOT-012
Les alertes du tableau de bord sont générées à partir des activités critiques et importantes.
18
RM-NOT-013
Les événements identiques sont regroupés sur une période de 5 minutes pour les notifications informatives.
18
RM-NOT-014
Les notifications critiques font l’objet d’une tentative de réenvoi en cas d’échec de délivrance.
18
RM-NOT-015
En Version 2, les utilisateurs pourront personnaliser leurs préférences de notification. En Version 1, les notifications sont obligatoires.
18
RM-NOT-016
Les notifications critiques et importantes sont envoyées immédiatement.
18
RM-NOT-017
Les notifications d’information peuvent être regroupées dans une synthèse quotidienne.
18

Domaine COM — Communication
Code
Règle
Chap.
RM-COM-001
Tous les échanges sont historisés et conservés conformément aux règles définies par GROUPI.
19
RM-COM-002
Les échanges se font exclusivement dans le cadre des groupes et des inscriptions actives.
19
RM-COM-003
Aucune messagerie générale ou instantanée n’est proposée dans la Version 1.
19
RM-COM-004
Le fil de commentaires est accessible uniquement par le Professeur et le Parent concerné.
19
RM-COM-005
Le fil de commentaires est lié à l’inscription. Il reste accessible même après la clôture.
19
RM-COM-006
Un commentaire peut être modifié tant qu’il n’a reçu aucune réponse et dans un délai maximal de 48 heures.
19
RM-COM-007
Un commentaire peut être supprimé uniquement dans les mêmes conditions.
19
RM-COM-008
Les commentaires sont exclusivement textuels dans la Version 1.
19
RM-COM-009
Les annonces sont exclusivement unidirectionnelles : Professeur → Parents.
19
RM-COM-010
Le Parent ne peut pas répondre à une annonce via la plateforme.
19
RM-COM-011
Le Professeur peut consulter le nombre de Parents ayant lu l’annonce.
19
RM-COM-012
Aucun Administrateur ne peut modifier les échanges entre un Professeur et un Parent.
19
RM-COM-013
Le Super Administrateur peut uniquement consulter les échanges dans le cadre d’une procédure d’assistance ou d’audit.
19
RM-COM-014
Aucun échange n’est supprimé physiquement.
19
RM-COM-015
Les nouveaux commentaires et annonces génèrent une activité dans le centre d’activités.
19
RM-COM-016
Les échanges sont conservés pendant une durée de 7 ans à compter de la clôture de l’inscription.
19
RM-COM-017
En Version 2, les pièces jointes (PDF, JPG, PNG, DOCX) seront autorisées dans la limite de 5 Mo par fichier.
19
RM-COM-018
En Version 2, des modèles de commentaires pédagogiques seront proposés pour structurer les retours.
19
RM-COM-019
Le tableau de bord affiche le nombre de commentaires non lus ainsi que le nombre d’annonces non consultées.
19
RM-COM-020
Le Parent peut réagir à une annonce en contactant le Professeur via le fil de commentaires de l’inscription.
19

Domaine CHG — Changement de groupe
Code
Règle
Chap.
RM-CHG-001
Le changement de groupe ne supprime jamais l’historique de l’élève.
20
RM-CHG-002
Le changement de groupe peut être initié par le Parent ou le Professeur.
20
RM-CHG-003
Aucune modification n’est réalisée sans validation des parties concernées.
20
RM-CHG-004
Le changement temporaire implique un retour automatique au groupe d’origine après la période déterminée.
20
RM-CHG-005
Pendant le changement temporaire, les présences et les écritures comptables sont enregistrées dans le groupe d’accueil.
20
RM-CHG-006
Le changement définitif clôture l’inscription actuelle et crée une nouvelle inscription dans le nouveau groupe.
20
RM-CHG-007
L’historique pédagogique et comptable de l’ancien groupe est définitivement conservé.
20
RM-CHG-008
Toute demande de changement comporte une date d’effet définie par le Professeur lors de la validation.
20
RM-CHG-009
Avant la date d’effet, l’élève continue de participer normalement aux séances de son groupe actuel.
20
RM-CHG-010
Les changements de groupe concernent uniquement des groupes appartenant au même Professeur.
20
RM-CHG-011
GROUPI vérifie automatiquement les conditions de validation du changement, notamment : - Groupe de destination actif ; - Même matière ; - Niveau compatible ; - Capacité disponible ou dérogation autorisée ; - Date d’effet valide ; - Absence de demande similaire en attente.
20
RM-CHG-012
Le compte de suivi comptable de l’ancienne inscription est conservé. Une nouvelle inscription entraîne la création d’un nouveau compte de suivi comptable indépendant.
20
RM-CHG-013
Le solde restant du compte de suivi comptable précédent est automatiquement reporté sur le nouveau compte.
20
RM-CHG-014
Un changement définitif libère une place dans le groupe d’origine. Si le groupe était masqué, il redevient visible automatiquement.
20
RM-CHG-015
Un changement temporaire ne libère pas de place dans le groupe d’origine sauf pour un autre changement temporaire effectué par un autre parent. Le groupe reste masqué parce que complet.
20
RM-CHG-016
Les séances déjà planifiées dans l’ancien groupe après la date d’effet sont automatiquement annulées pour l’élève concerné.
20
RM-CHG-017
Un changement temporaire est prévu pour une seule séance. L’élève réintègre automatiquement son groupe d’origine à cette date.
20
RM-CHG-018
GROUPI ne limite pas le nombre de changements par élève. Plus de 3 changements par année académique génèrent une alerte.
20
RM-CHG-019
Un changement de groupe n’affecte pas les préinscriptions existantes.
20
RM-CHG-020
GROUPI vérifie la capacité du groupe d’accueil pour le changement temporaire. Si le groupe est complet, le Professeur peut exceptionnellement autoriser le dépassement temporaire de la capacité maximale du groupe pour cette séance. Cette dérogation n’entraîne aucune modification permanente de la capacité du groupe.
20
RM-CHG-021
Une seule demande de changement de groupe peut être en attente pour une même inscription.
20

Domaine ABO — Gestion des abonnements
Code
Règle
Chap.
RM-ABO-001
Chaque abonnement est obligatoirement rattaché à une seule année académique. L’offre Découverte est également rattachée à une année académique mais expire automatiquement 30 jours calendaires après son activation.
21
RM-ABO-002
L’abonnement expire automatiquement à la fin de l’année académique correspondante, quelle que soit sa date de souscription à l’exception de l’offre Découverte qui expire automatiquement 30 jours calendaires après son activation.
21
RM-ABO-003
Un Professeur souhaitant continuer à utiliser GROUPI pour l’année suivante doit souscrire un nouvel abonnement.
21
RM-ABO-004
Les abonnements ne sont jamais reconduits automatiquement.
21
RM-ABO-005
Un Professeur ne peut posséder qu’un seul abonnement actif par année académique.
21
RM-ABO-006
Des rappels automatiques sont envoyés avant l’échéance de l’abonnement.
21
RM-ABO-007
En cas de non-paiement, le Super Administrateur ou un Administrateur autorisé peut suspendre l’abonnement du Professeur.
21
RM-ABO-008
Pendant la suspension, les données sont conservées, les groupes restent enregistrés, les historiques sont préservés et aucune nouvelle opération n’est autorisée.
21
RM-ABO-009
Après régularisation, l’abonnement compte peut être réactivé. Aucune donnée n’est perdue.
21

Domaine PERM — Droits liés aux abonnements
Code
Règle
Chap.
RM-PERM-001
Les droits sont déterminés exclusivement par l’abonnement actif du Professeur.
22
RM-PERM-002
Toute fonctionnalité soumise à restriction fait l’objet d’un contrôle d’autorisation avant son exécution.
22
RM-PERM-003
Une fonctionnalité non incluse dans l’offre est refusée sans modifier les données.
22
RM-PERM-004
GROUPI informe le Professeur de l’offre permettant d’accéder à une fonctionnalité indisponible.
22
RM-PERM-005
Les droits sont mis à jour automatiquement lors de l’activation, de l’expiration ou de la suspension d’un abonnement.
22
RM-PERM-006
L’expiration ou la suspension d’un abonnement n’entraîne jamais la suppression des données du Professeur.
22
RM-PERM-007
Les droits de consultation peuvent être maintenus après expiration ou suspension selon les règles définies par GROUPI.
22
RM-PERM-008
Pendant le délai de grâce de 7 jours suivant l’expiration, les droits de modification sont maintenus pour permettre la régularisation.
22
RM-PERM-009
Les droits des Administrateurs et du Super Administrateur sont déterminés par leur rôle et ne dépendent jamais d’un abonnement.
22
RM-PERM-010
En Version 2, les Add-ons activent des droits complémentaires révoqués à leur expiration.
22

Domaine REF — Référentiels
Code
Règle
Chap.
RM-REF-001
Seuls le Super Administrateur et les Administrateurs disposant des permissions spécifiques peuvent modifier les référentiels.
23
RM-REF-002
Aucun Professeur ni Parent ne peut créer ou modifier les données des référentiels.
23
RM-REF-003
Le référentiel SubjectLevel définit les combinaisons autorisées entre les matières et les niveaux scolaires.
23
RM-REF-004
Lorsqu’un Professeur met à jour les matières et niveaux de son profil ou crée un groupe, GROUPI vérifie automatiquement la compatibilité.
23
RM-REF-005
Toute combinaison interdite est immédiatement refusée.
23
RM-REF-006
Les mises à jour des référentiels sont réalisées selon un mécanisme d’ajout ou de mise à jour (upsert).
23
RM-REF-007
Les mises à jour ne doivent jamais entraîner la suppression de données encore référencées par des groupes, des inscriptions ou des historiques.
23
RM-REF-008
Lorsqu’une donnée ne doit plus être proposée aux nouveaux utilisateurs, elle est déclarée inactive plutôt que supprimée.
23
RM-REF-009
Une donnée inactive reste visible dans les historiques, n’est plus proposée lors des nouvelles créations, et peut être réactivée ultérieurement.
23
RM-REF-010
Les établissements scolaires sont rattachés à une ville du référentiel City.
23
RM-REF-011
Toute nouvelle entrée dans un référentiel est soumise à validation par le Super Administrateur avant activation.
23
RM-REF-012
Chaque entrée de référentiel possède une date de création, une date de dernière modification et un état (actif/inactif).
23
RM-REF-013
Les Administrateurs peuvent exporter les référentiels au format CSV pour des besoins d’audit.
23

Domaine TRS — Règles transversales
Code
Règle
Chap.
RM-TRS-001
Toutes les données pédagogiques sont rattachées à une année académique.
24
RM-TRS-002
La clôture d’une année académique verrouille définitivement toutes les données associées qui deviennent consultables en lecture seule.
24
RM-TRS-003
Les données métier importantes sont historisées. GROUPI ne supprime jamais : les inscriptions, les séances réalisées, les présences, les commentaires, les écritures comptables.
24
RM-TRS-004
L’archivage interdit toute modification, conserve l’historique et permet les consultations.
24
RM-TRS-005
La suppression physique des données métier est interdite.
24
RM-TRS-006
Toutes les opérations importantes sont enregistrées dans des journaux de traçabilité.
24
RM-TRS-007
Les notifications sont générées automatiquement selon les règles décrites dans chaque chapitre.
24
RM-TRS-008
Les indicateurs métier sont recalculés automatiquement après toute modification ayant un impact sur leur valeur.
24
RM-TRS-009
Une donnée verrouillée ne peut plus être modifiée.
24
RM-TRS-010
Le principe du moindre privilège est appliqué dans toute la plateforme.
24
RM-TRS-011
Une opération qui entraînerait une incohérence est refusée automatiquement.
24
RM-TRS-012
En cas de conflit entre une règle transversale et une règle spécifique, la règle spécifique prévaut.
24
RM-TRS-013
Les données sont conservées conformément aux obligations légales (7 ans pour les données comptables). Passé ce délai, les données peuvent être anonymisées.
24
RM-TRS-014
Chaque enregistrement comporte : date de création, auteur de la création, date de dernière modification, auteur de la dernière modification.
24
RM-TRS-015
Les opérations longues (exports, recalculs massifs) sont exécutées de manière asynchrone avec notification à l’utilisateur.
24
RM-TRS-016
Les logs d’audit sont conservés pendant 7 ans.
24
RM-TRS-017
Les sessions utilisateur expirent après 30 minutes d’inactivité. Ce délai est paramétrable.
24
RM-TRS-018
Les dates sont stockées en UTC et converties dans le fuseau horaire officiel de la plateforme lors de l’affichage.
24

Domaine CAL — Règles de calcul
Code
Règle
Chap.
RM-CAL-001
Tous les indicateurs métier sont calculés automatiquement par GROUPI. Aucun utilisateur ne peut les modifier manuellement.
25
RM-CAL-002
Toute modification d’une donnée source entraîne le recalcul automatique des indicateurs impactés.
25
RM-CAL-003
Les calculs opérationnels utilisent exclusivement des données validées et non archivées. Les données archivées ou verrouillées restent utilisées uniquement pour les calculs historiques.
25
RM-CAL-004
Les calculs sont réalisés dans le contexte d’une année académique déterminée, sauf pour les indicateurs explicitement définis comme globaux.
25
RM-CAL-005
Le solde comptable d’une inscription est toujours calculé à partir des écritures comptables enregistrées.
25
RM-CAL-006
Le tarif appliqué à une séance est déterminé selon la hiérarchie définie dans le référentiel (tarif personnalisé puis tarif du groupe).
25
RM-CAL-007
Les données verrouillées ou archivées ne peuvent plus être modifiées mais restent prises en compte dans les calculs historiques.
25
RM-CAL-008
Les exports utilisent les valeurs calculées au moment de leur génération et ne sont jamais mis à jour automatiquement.
25
RM-CAL-009
Les formules de calcul peuvent évoluer entre deux versions de GROUPI sans remettre en cause les données historiques déjà enregistrées.
25
RM-CAL-010
Les montants sont arrondis à deux décimales selon la règle de l’arrondi bancaire.
25
RM-CAL-011
Les calculs sont exécutés dans l’ordre de dépendance : paiements/écritures → solde → indicateurs financiers → indicateurs pédagogiques.
25
RM-CAL-012
Les seuils de comportement de paiement sont paramétrables. Les valeurs par défaut sont : Excellent (≥ 90%), Moyen (50% à 89%), Mauvais (< 50%).
25
RM-CAL-013
Le taux d’assiduité est calculé sur l’année académique en cours.
25
RM-CAL-014
Les ajustements comptables modifient le solde mais n’ont pas d’impact sur les indicateurs pédagogiques.
25
RM-CAL-015
Les statistiques agrégées par matière et par niveau seront disponibles en Version 2.
25

Domaine GEN — Règles métier générales
Code
Règle
Chap.
RM-GEN-001
Chaque utilisateur possède un compte unique dans GROUPI, quel que soit le nombre de rôles qui lui sont attribués.
26
RM-GEN-002
Un utilisateur peut cumuler plusieurs rôles tout en conservant une authentification unique.
26
RM-GEN-003
Les Professeurs et les Parents doivent être validés avant d’accéder aux fonctionnalités nécessitant une autorisation.
26
RM-GEN-004
Les responsabilités des différents acteurs sont strictement séparées conformément aux principes métier de GROUPI.
26
RM-GEN-005
Chaque groupe est associé à un seul Professeur, une seule matière et un seul niveau scolaire.
26
RM-GEN-006
Toute combinaison matière / niveau est contrôlée à l’aide du référentiel SubjectLevel.
26
RM-GEN-007
Chaque inscription possède un compte de suivi comptable totalement indépendant des autres inscriptions.
26
RM-GEN-008
Les écritures comptables de deux inscriptions différentes ne peuvent jamais être fusionnées.
26
RM-GEN-009
Les données historiques ne sont jamais supprimées ; seules des corrections historisées sont autorisées lorsque les règles métier le permettent.
26
RM-GEN-010
Une séance ne peut être corrigée que pendant la période de modification autorisée définie par GROUPI.
26
RM-GEN-011
Toute opération métier importante est historisée afin de garantir la traçabilité complète de la plateforme.
26
RM-GEN-012
Chaque utilisateur ne peut consulter que les informations correspondant à ses droits d’accès.
26
RM-GEN-013
Toute opération susceptible d’avoir un impact sur un utilisateur génère automatiquement une activité et, le cas échéant, une notification.
26
RM-GEN-014
Toute évolution fonctionnelle de GROUPI doit respecter les principes fondamentaux d’intégrité, de traçabilité, de confidentialité et de séparation des responsabilités définis dans le présent référentiel.
26
RM-GEN-015
Toute opération métier doit respecter les droits d’accès de l’utilisateur avant toute exécution.
26
RM-GEN-016
Toute opération métier composée de plusieurs traitements dépendants est exécutée de manière atomique.
26
RM-GEN-017
Les règles métier générales ne peuvent être modifiées que par décision du Super Administrateur. Toute modification est tracée.
26
RM-GEN-018
GROUPI respecte la réglementation applicable en matière de protection des données personnelles.
26
RM-GEN-019
Un utilisateur cumulant plusieurs rôles respecte les règles applicables à chaque rôle. En cas de conflit, le rôle Professeur prévaut pour les opérations pédagogiques.
26
RM-GEN-020
Les données sont conservées conformément aux obligations légales (7 ans pour les données comptables).
26
RM-GEN-021
Les règles de sécurité définies au Chapitre 9 s’appliquent à l’ensemble des fonctionnalités de GROUPI.
26

Domaine ARC — Architecture métier
Code
Règle
Chap.
RM-ARC-001
Chaque domaine métier est responsable exclusivement de ses propres données.
27
RM-ARC-002
Les domaines communiquent par évènements métier ou services exposés.
27
RM-ARC-003
Un domaine ne modifie jamais directement les données d’un autre domaine.
27
RM-ARC-004
Les domaines cœur sont prioritaires en matière de disponibilité.
27
RM-ARC-005
Toute nouvelle fonctionnalité est rattachée à un domaine métier.
27
RM-ARC-006
Les APIs inter-domaines sont versionnées.
27
RM-ARC-007
Les évènements métier constituent le mécanisme privilégié de communication asynchrone.
27
RM-ARC-008
Les référentiels sont la source unique des données de référence.
27
RM-ARC-009
Les tableaux de bord utilisent uniquement les données publiées par les domaines producteurs.
27
RM-ARC-010
Les domaines restent faiblement couplés afin de faciliter l’évolution de GROUPI.
27
RM-ARC-011
Chaque domaine est propriétaire exclusif de ses objets métier.
27
RM-ARC-012
Les échanges inter-domaines doivent être idempotents afin de garantir la cohérence en cas de retraitement.
27
RM-ARC-013
Les évènements métier sont immuables après leur publication.
27
RM-ARC-014
Les domaines consommateurs restent tolérants aux évolutions de version des événements publiés.
27
RM-ARC-015
Toute communication synchrone entre domaines doit utiliser une API officiellement versionnée.
27

Domaine ROAD — Feuille de route et évolutions
Code
Règle
Chap.
RM-ROAD-001
Les évolutions de GROUPI sont validées par le comité de pilotage produit.
29
RM-ROAD-002
Les migrations entre versions préservent les données historiques. Les utilisateurs sont informés des évolutions.
29
RM-ROAD-003
Chaque évolution majeure est accompagnée de supports de formation (vidéos, tutoriels, FAQ).
29
RM-ROAD-004
Les nouvelles fonctionnalités sont proposées selon les offres d’abonnement en vigueur.
29
RM-ROAD-005
La feuille de route est enrichie en continu par les retours des utilisateurs.
29



## Annexe C — Catalogue des règles de calcul
Cette annexe recense l’ensemble des règles de calcul (formules) utilisées par GROUPI. Chaque règle est identifiée par un code unique (CAL-xxx) et précise sa formule, ses données d’entrée, les objets métier concernés et les règles métier associées. Ces calculs sont réalisés automatiquement par la plateforme ; les utilisateurs ne peuvent jamais en modifier directement les résultats.
Cette annexe constitue la synthèse consolidée des règles de calcul de GROUPI. Le Chapitre 25 (Règles de calcul) reste la source de vérité normative ; cette annexe en est le reflet et doit être régénérée en cas de modification du chapitre.
Total : 14 règles de calcul.
CAL-001 — Solde comptable
Description
Calcule le solde d’un compte de suivi comptable d’inscription.
Formule
Solde = Total des crédits − Total des débits
Avec : Crédit = somme des paiements enregistrés ; Débit = somme des séances facturées. Les ajustements comptables sont pris en compte.
Données d’entrée
Liste des écritures du compte ; type de chaque écriture (PAYMENT, SESSION, ADJUSTMENT, ADMIN_ADJUSTMENT)
Objets métier
AccountingAccount, AccountingEntry
Règles métier associées
RM-CPT-006, RM-CPT-007, RM-CAL-005
Chapitre(s)
15, 25

CAL-002 — Taux d’assiduité
Description
Calcule le taux de participation d’un élève aux séances.
Formule
Taux d’assiduité = (Nombre de présences / Nombre de séances auxquelles l’élève était inscrit) × 100
Règles
Les retards sont considérés comme des présences ; les absences excusées et non excusées sont considérées comme des absences ; calculé sur l’année académique en cours.
Données d’entrée
Liste des présences de l’élève ; liste des séances du groupe pendant la période d’inscription
Objets métier
Attendance, Student, Enrollment
Règles métier associées
RM-CAL-013
Chapitre(s)
14, 25




CAL-003 — Nombre d’absences consécutives
Description
Calcule le nombre d’absences consécutives d’un élève pour détecter un risque d’abandon.
Formule
Présence → compteur = 0 ; Absence → compteur = compteur + 1. Lorsque le seuil défini dans le groupe est atteint, une alerte est générée.
Données d’entrée
Liste des présences de l’élève (ordonnées par date) ; seuil d’abandon du groupe
Objets métier
Attendance, Student, Group
Règles métier associées
RM-ATT-013, RM-ATT-014
Chapitre(s)
14, 25

CAL-004 — Taux d’occupation d’un groupe
Description
Calcule le taux de remplissage d’un groupe.
Formule
Taux d’occupation = (Nombre d’inscriptions actives / Capacité maximale) × 100
Règles
Les inscriptions suspendues, terminées ou archivées ne sont pas prises en compte.
Données d’entrée
Capacité maximale du groupe ; liste des inscriptions actives du groupe
Objets métier
Group, Enrollment
Règles métier associées
RM-GRP-012, RM-GRP-014
Chapitre(s)
10, 25

CAL-005 — Nombre de places disponibles
Description
Calcule le nombre de places encore disponibles dans un groupe.
Formule
Places disponibles = Capacité maximale − Nombre d’inscriptions actives
Données d’entrée
Capacité maximale du groupe ; liste des inscriptions actives du groupe
Objets métier
Group, Enrollment
Règles métier associées
RM-GRP-012, RM-GRP-025
Chapitre(s)
10, 25





CAL-006 — Score de complétude du profil
Description
Calcule le niveau de complétude du profil d’un Professeur.
Formule
Score = Somme des pondérations des informations renseignées
Règles
Le mode de calcul détaillé est paramétrable par GROUPI ; le score n’influence pas la validation du compte ; le score n’est jamais visible par les Parents.
Données d’entrée
Profil du Professeur ; pondérations définies par GROUPI
Objets métier
TeacherProfile
Règles métier associées
RM-TPR-009 à RM-TPR-011
Chapitre(s)
5, 25

CAL-007 — Comportement de paiement
Description
Détermine le comportement de paiement d’un Parent.
Formule
Taux de paiement à temps = (Paiements effectués à temps / Paiements attendus) × 100
Règles
Le calcul est effectué sur l’année académique en cours ; seul l’indicateur synthétique est communiqué au Professeur.
Données d’entrée
Historique des paiements du Parent ; échéances de paiement attendues
Objets métier
Payment, ParentProfile, Enrollment
Règles métier associées
RM-INS-014 à RM-INS-016, RM-CAL-012
Chapitre(s)
12, 25

CAL-008 — Solde global d’un Parent
Description
Calcule le solde global d’un Parent.
Formule
Solde global du Parent = Somme des soldes de tous ses enfants. Pour chaque enfant : Solde de l’enfant = Somme des soldes de toutes ses inscriptions.
Données d’entrée
Liste des enfants du Parent ; soldes comptables de chaque inscription
Objets métier
ParentProfile, Student, AccountingAccount
Règles métier associées
RM-CAL-005
Chapitre(s)
15, 25


CAL-009 — Chiffre d’affaires prévisionnel
Description
Calcule le chiffre d’affaires prévisionnel d’un Professeur.
Formule
CA prévisionnel = Somme des séances futures planifiées × Tarif appliqué à chaque élève
Règles
Calcul dynamique, recalculé automatiquement ; seules les séances futures susceptibles d’être facturées sont prises en compte ; les séances annulées ou supprimées ne sont pas comptabilisées.
Données d’entrée
Inscriptions actives ; tarifs appliqués (public ou personnalisé) ; séances futures planifiées
Objets métier
Enrollment, Session, Group
Règles métier associées
RM-CPT-014
Chapitre(s)
15, 25

CAL-010 — Chiffre d’affaires encaissé
Description
Calcule le chiffre d’affaires effectivement encaissé par un Professeur.
Formule
CA encaissé = Somme des paiements enregistrés sur la période sélectionnée
Données d’entrée
Liste des paiements du Professeur ; période de calcul
Objets métier
Payment, TeacherProfile
Règles métier associées
RM-CPT-016
Chapitre(s)
15, 25

CAL-011 — Chiffre d’affaires réalisé
Description
Calcule le chiffre d’affaires effectivement réalisé (facturé) par un Professeur.
Formule
CA réalisé = Somme des débits (écritures SESSION) sur la période sélectionnée
Données d’entrée
Liste des écritures comptables de type SESSION ; période de calcul
Objets métier
AccountingEntry, TeacherProfile
Règles métier associées
RM-CPT-015
Chapitre(s)
15, 25




CAL-012 — Tarif appliqué
Description
Détermine le tarif à appliquer pour une séance.
Formule
1) Si un tarif personnalisé est défini pour l’inscription → utiliser celui-ci. 2) À défaut, utiliser le tarif public du groupe. Le tarif de référence GROUPI n’est jamais utilisé pour la facturation.
Données d’entrée
Tarif personnalisé de l’inscription (le cas échéant) ; tarif public du groupe
Objets métier
Enrollment, Group
Règles métier associées
RM-GRP-011, RM-INS-017, RM-INS-019, RM-CAL-006
Chapitre(s)
10, 12, 25

CAL-013 — Statistiques des tableaux de bord
Description
Les statistiques des tableaux de bord sont recalculées automatiquement.
Formule
Taux de présence = (Présences/Séances)×100 ; Taux d’occupation = (Inscriptions actives/Capacité)×100 ; Places disponibles = Capacité − Inscriptions actives ; Solde comptable = Crédits − Débits ; Score de complétude = Somme des pondérations.
Règles
Calculs automatiques et récurrents ; les tableaux de bord utilisent exclusivement les données validées ; recalcul après toute modification ayant un impact.
Données d’entrée

Objets métier
Dashboard, Attendance, Enrollment, Payment, AccountingEntry
Règles métier associées
RM-DSH-013, RM-CAL-002
Chapitre(s)
16, 25

CAL-014 — Compteur d’absences consécutives (détection d’abandon)
Description
Calcule le nombre d’absences consécutives d’un élève.
Formule
Si présent → compteur = 0. Si absent → compteur = compteur + 1.
Règles
Seules les séances réalisées sont prises en compte ; le compteur est réinitialisé après une présence ; le seuil d’abandon est défini par le Professeur (défaut : 3).
Données d’entrée
Présences de l’élève ; seuil d’abandon du groupe
Objets métier
Attendance, Student, Group
Règles métier associées
RM-ATT-013, RM-ATT-014
Chapitre(s)
14, 25

## Annexe D — Catalogue des indicateurs KPI et tableaux de bord

Cette annexe recense l’ensemble des indicateurs métier (KPI) utilisés par GROUPI pour alimenter les tableaux de bord des différents acteurs.
Cette annexe constitue la synthèse consolidée des indicateurs de GROUPI. Le Chapitre 16 (Les tableaux de bord) reste la source de vérité normative pour leur usage ; cette annexe en est le reflet et doit être régénérée en cas de modification des chapitres.
Total : 40 indicateurs répartis sur 7 catégories.
Indicateurs d’activité (Chapitre 16)
Code
Indicateur
Objectif
Calcul
KPI-001
Nombre de groupes actifs
Mesurer le nombre de groupes actuellement en activité (ouverts ou complets, hors brouillon/clôturé/archivé).
COUNT(Group WHERE status IN (OUVERT, COMPLET))
KPI-002
Nombre total d’élèves actifs
Mesurer le nombre d’inscriptions actives.
COUNT(Enrollment WHERE status = ACTIVE)
KPI-003
Nombre de séances planifiées
Afficher les séances à venir.
COUNT(Session WHERE status = PLANIFIEE AND date >= Aujourd’hui)
KPI-004
Nombre de séances réalisées
Mesurer l’activité pédagogique réalisée.
COUNT(Session WHERE status IN (TERMINEE, VERROUILLEE))
KPI-005
Nombre de séances annulées
Suivre les séances non tenues.
COUNT(Session WHERE status = ANNULEE)
KPI-006
Nombre de préinscriptions
Mesurer l’intérêt exprimé pour la prochaine année académique.
COUNT(PreEnrollment WHERE status = OUVERTE)
KPI-007
Nombre d’inscriptions validées
Mesurer les inscriptions actives.
COUNT(Enrollment WHERE status = ACTIVE)
KPI-008
Nombre de changements de groupe
Suivre la mobilité des élèves entre groupes.
Nombre de GroupTransferRequest acceptées sur la période.

Indicateurs pédagogiques (Chapitres 13, 14)
Code
Indicateur
Objectif
Calcul
KPI-009
Taux de présence moyen

(Présences / Séances prévues) × 100
KPI-010
Taux d’absence

(Absences / Séances prévues) × 100
KPI-011
Taux de retard

(Retards / Présences) × 100
KPI-012
Nombre moyen d’élèves par groupe

Total élèves actifs / Nombre de groupes
KPI-013
Taux moyen d’occupation

(Total élèves / Capacité totale) × 100
KPI-014
Nombre moyen de séances par groupe

Séances réalisées / Nombre de groupes
KPI-015
Nombre moyen de séances par élève

Présences / Nombre d’élèves

Indicateurs comptables (Chapitre 15)
Code
Indicateur
Objectif
Calcul
KPI-016
Chiffre d’affaires réalisé
Valeur totale facturée (séances réalisées).
Voir CAL-011 (Annexe C)
KPI-017
Chiffre d’affaires encaissé
Valeur totale encaissée.
Voir CAL-010 (Annexe C)
KPI-018
Chiffre d’affaires prévisionnel
Projection calculée.
Voir CAL-009 (Annexe C)
KPI-019
Solde total des familles
Somme des soldes de tous les comptes de suivi comptable.
Voir CAL-008 (Annexe C)
KPI-020
Total des débits


KPI-021
Total des crédits


KPI-022
Montant restant à encaisser

Total des débits − Total des crédits
KPI-023
Délai moyen de paiement
Mesurer le retard moyen entre facturation et paiement.
⚠ Formule à documenter (voir remarque ci-dessous) — moyenne, par paiement, du nombre de jours entre la date de la séance facturée et la date du paiement correspondant.
KPI-024
Nombre de paiements enregistrés



Indicateurs commerciaux (Chapitres 4, 21)
Code
Indicateur
Objectif
Calcul
KPI-025
Nombre d’abonnements actifs

COUNT(Subscription WHERE status = ACTIVE)
KPI-026
Nombre d’abonnements expirés

COUNT(Subscription WHERE status = EXPIRED)
KPI-027
Taux de renouvellement
Mesurer la fidélisation des Professeurs d’une année académique à l’autre.
⚠ Formule à documenter (voir remarque ci-dessous) — (Professeurs ayant souscrit l’année N+1 / Professeurs actifs l’année N) × 100
KPI-028
Nombre d’essais gratuits
Suivi des souscriptions à l’offre Découverte.
COUNT(Subscription WHERE plan = DECOUVERTE)
KPI-029
Répartition des abonnements par offre
Découverte / Intermédiaire / Pro
COUNT(Subscription) GROUP BY plan

Communication (Chapitres 18, 19)
Code
Indicateur
Objectif
Calcul
KPI-030
Nombre de notifications envoyées


KPI-031
Nombre d’activités générées


KPI-032
Nombre d’annonces publiées



Administration (Chapitre 3, 8)
Code
Indicateur
Objectif
Calcul
KPI-033
Nombre d’utilisateurs


KPI-034
Nombre de Professeurs validés

COUNT(User WHERE role = Professeur AND status = ACTIVE)
KPI-035
Nombre de Parents validés

COUNT(User WHERE role = Parent AND status = ACTIVE)
KPI-036
Nombre d’administrateurs


KPI-037
Nombre d’opérations d’audit



Performance de la plateforme (Chapitre 27)
Code
Indicateur
Objectif
Calcul
KPI-038
Temps moyen de réponse
Mesure technique destinée au pilotage de la plateforme.

KPI-039
Disponibilité de la plateforme
Pourcentage de disponibilité sur la période.

KPI-040
Nombre d’erreurs système
Nombre d’erreurs enregistrées durant la période.


Remarques issues de la vérification
⚠ KPI-023 (Délai moyen de paiement) et KPI-027 (Taux de renouvellement) citaient des règles de calcul CAL-039 et CAL-037 qui n’existent pas dans l’Annexe C régénérée (limitée à CAL-001 à CAL-014). Une formule provisoire a été rédigée directement dans cette annexe ; il conviendrait soit de l’ajouter formellement à l’Annexe C, soit de confirmer que ces indicateurs restent hors du périmètre couvert par le Chapitre 25.



## Annexe E — Catalogue des calculs techniques et analytiques

Cette annexe décrit les calculs internes utilisés par GROUPI pour produire les statistiques, alimenter les tableaux de bord, réaliser les analyses automatiques et optimiser le fonctionnement de la plateforme. Ces calculs ne constituent pas des règles métier : ils sont utilisés par les services applicatifs, les traitements analytiques et les tableaux de bord.
Contrairement aux Annexes B à D, ce catalogue ne correspond pas à un chapitre unique du référentiel : chaque calcul est ici relié, lorsque cela est pertinent, au chapitre ou à l’annexe qui l’utilise.
Total : 45 calculs répartis sur 7 catégories.
Calculs de périodes
Code
Calcul
Description / lien avec le référentiel
TEC-001
Calcul de la semaine académique
Détermine les bornes (début/fin) de la semaine académique en cours, utilisées pour le planning hebdomadaire des groupes (Ch.10).
TEC-002
Calcul du mois académique
Détermine les bornes du mois académique en cours, utilisées notamment pour les statistiques mensuelles (CA du mois, Ch.15).
TEC-003
Calcul du trimestre
Détermine les bornes du trimestre en cours au sein de l’année académique.
TEC-004
Calcul de l’année académique
Détermine les dates de début et de fin de l’année académique active, utilisées par la Situation scolaire (Ch.7) et les Référentiels (Ch.23).
TEC-005
Calcul de la période glissante
Calcule une fenêtre glissante (ex. 30 derniers jours) utilisée notamment pour les statistiques d’assiduité (Ch.14, 14.9).

Agrégations
Code
Calcul
Description / lien avec le référentiel
TEC-006
Somme
Opération d’agrégation générique utilisée par la plupart des indicateurs financiers et statistiques (Annexes C et D).
TEC-007
Moyenne
Opération d’agrégation générique (ex. taux de présence moyen, KPI-009).
TEC-008
Médiane
Opération d’agrégation générique utilisée en complément de la moyenne pour limiter l’effet des valeurs extrêmes.
TEC-009
Minimum

TEC-010
Maximum

TEC-011
Écart-type
Mesure de dispersion utilisée pour qualifier la régularité d’un comportement (paiement, présence).
TEC-012
Pourcentage
Opération d’agrégation générique utilisée par la quasi-totalité des indicateurs de l’Annexe C (taux, ratios).
TEC-013
Évolution (%)
Calcule la variation relative d’un indicateur entre deux périodes.
TEC-014
Cumul
Calcule une valeur cumulée sur une période (ex. chiffre d’affaires cumulé depuis le début de l’année académique).
TEC-015
Classement
Ordonne un ensemble de valeurs (ex. classement des groupes par taux d’occupation).

Tableaux de bord
Code
Calcul
Description / lien avec le référentiel
TEC-016
Regroupement par professeur
Agrégation utilisée par le tableau de bord du Super Administrateur (Ch.16.6, indicateurs globaux).
TEC-017
Regroupement par matière
Utilisé notamment pour le tarif de référence GROUPI (Ch.10.7, calculé par combinaison Matière/Niveau).
TEC-018
Regroupement par niveau
Idem, utilisé pour le tarif de référence et les statistiques par niveau scolaire (Ch.10.7, 23.5).
TEC-019
Regroupement par ville
Utilisé pour le tarif de référence à l’échelle de la ville ou de la région (Ch.10.7).
TEC-020
Regroupement par période
Agrégation temporelle générique utilisée par les tableaux de bord (Ch.16).
TEC-021
Tri dynamique
Fonction technique des tableaux de bord et des listes (ex. tri des demandes d’inscription).
TEC-022
Filtrage
Fonction technique utilisée par la recherche de groupes (Ch.12.3) et les critères de sélection des exports (Ch.17.5).
TEC-023
Pagination
Fonction technique générique d’affichage des listes volumineuses.

Exports
Code
Calcul
Description / lien avec le référentiel
TEC-024
Nombre total de lignes
Utilisé pour déterminer si un export doit être traité de manière synchrone ou asynchrone (Ch.17.10, seuil de 10 000 lignes).
TEC-025
Taille estimée de l’export
Utilisé pour le même seuil de bascule synchrone/asynchrone (Ch.17.10, seuil de 5 Mo).
TEC-026
Nombre de pages PDF
Calcul technique utilisé lors de la génération d’un export au format PDF (Ch.17.6).
TEC-027
Nombre de feuilles Excel
Calcul technique utilisé lors de la génération d’un export au format Excel (Ch.17.6).
TEC-028
Temps estimé d’export
Utilisé pour informer l’utilisateur et décider du mode de génération (Ch.17.10).

Analyses
Code
Calcul
Description / lien avec le référentiel
TEC-029
Tendance
Analyse de l’évolution d’un indicateur dans le temps (ex. évolution du solde, Ch.15.12.1).
TEC-030
Variation
Mesure ponctuelle de changement entre deux valeurs consécutives.
TEC-031
Croissance
Mesure de progression sur une période, utilisée notamment pour le chiffre d’affaires (Ch.15.12.2).
TEC-032
Répartition
Analyse de la distribution d’un ensemble de valeurs (ex. répartition des inscriptions par matière, Ch.12.14).
TEC-033
Concentration
Mesure de la part que représentent quelques éléments dans un ensemble (ex. part des impayés les plus anciens).
TEC-034
Corrélation simple
Analyse exploratoire entre deux indicateurs (ex. lien entre retards et absences).
TEC-035
Historique
Reconstitution chronologique d’un indicateur à partir des données historisées (Ch.15.13, 14.8).

Optimisation
Code
Calcul
Description / lien avec le référentiel
TEC-036
Taille d’un groupe de traitements
Paramètre technique de traitement par lots (batch), sans lien direct avec les groupes pédagogiques (Ch.10) — attention à l’homonymie.
TEC-037
Nombre de notifications à envoyer
Utilisé pour le regroupement des notifications sur une fenêtre de 5 minutes (Ch.17.9, RM-NOT-013).
TEC-038
Découpage des traitements
Paramètre technique de traitement par lots, lié à TEC-036.
TEC-039
Temps moyen de traitement
Indicateur de performance technique de la plateforme (Ch.27).
TEC-040
File d’attente des événements
Mécanisme technique de traitement asynchrone des évènements métier (Annexe F).



Préparation IA (Version 2)
Code
Calcul
Description / lien avec le référentiel
TEC-041
Score d’assiduité
⚠ Chevauchement à clarifier avec CAL-002 (Taux d’assiduité, Annexe C) : s’agit-il de la même valeur réutilisée pour l’IA, ou d’un score composite distinct incluant d’autres facteurs ?
TEC-042
Score de régularité des paiements
⚠ Chevauchement à clarifier avec CAL-007 (Comportement de paiement, Annexe C) : même question que ci-dessus.
TEC-043
Score de fidélité
Score prospectif combinant ancienneté et régularité, en préparation du moteur IA de détection d’abandon (Ch.14.10).
TEC-044
Projection de fréquentation
Anticipation de l’évolution du nombre d’élèves, en lien avec le moteur intelligent de planification (Ch.13.13).
TEC-045
Projection financière
Anticipation de l’évolution du chiffre d’affaires, en complément du chiffre d’affaires prévisionnel (CAL-009, Annexe C).
Remarque : ces calculs servent de base aux fonctionnalités d’intelligence artificielle prévues en Version 2. Ils ne constituent pas des décisions automatiques et ne remplacent pas l’intervention du Professeur.



## Annexe F — Catalogue des évènements métier
Chaque évènement métier reçoit un identifiant unique (EVT-xxx). Les événements matérialisent les faits marquants du système et peuvent déclencher des notifications, des recalculs ou des écritures d’audit.
Cet index constitue la synthèse consolidée de tous les évènements métier de GROUPI. Chaque chapitre reste la source de vérité normative ; cet index en est le reflet et doit être régénéré en cas de modification des chapitres.
Total : 241 événements répartis sur 26 domaines.
Domaine NAM — Conventions de nommage
Code
Événement
Description
Chap.
EVT-NAM-001
Convention de nommage mise à jour
Une convention de nommage du référentiel (Chapitre 2) est ajoutée, modifiée ou supprimée.
2
EVT-NAM-002
Terminologie officielle modifiée
Un terme de la terminologie officielle (2.19) est ajouté, modifié ou supprimé.
2

Domaine SUB — Abonnements
Code
Événement
Description
Chap.
EVT-SUB-001
Abonnement souscrit
Un Professeur souscrit un abonnement (offre Découverte, Intermédiaire ou Pro)
4
EVT-SUB-002
Paiement validé
Le paiement de l’abonnement est validé par un Administrateur
4
EVT-SUB-003
Offre modifiée
Le Professeur change d’offre d’abonnement
4
EVT-SUB-004
Capacité atteinte
Le nombre d’inscriptions actives atteint la limite de l’abonnement
4
EVT-SUB-005
Abonnement expiré
L’abonnement du Professeur arrive à expiration. Pour l’offre Découverte, ce passage déclenche la bascule en mode Lecture Seule
4
EVT-SUB-006
Add-on activé (Version 2)
Un Professeur active une option complémentaire
4
EVT-SUB-007
Abonnement suspendu
L’abonnement du Professeur est suspendu
4

Domaine TPR — Profil Professeur
Code
Événement
Description
Chap.
EVT-TPR-001
Profil Professeur créé
Le Professeur crée son profil professionnel
5
EVT-TPR-002
Profil Professeur modifié
Le Professeur modifie les informations de son profil
5
EVT-TPR-003
Nouvelle matière ajoutée
Le Professeur ajoute une matière à son profil
5
EVT-TPR-004
Nouveau niveau ajouté
Le Professeur ajoute un niveau à son profil
5
EVT-TPR-005
Profil Professeur validé
Le profil du Professeur est validé par un Administrateur
5
EVT-TPR-006
Modification de profil validée
Une modification de profil (matière/niveau) est validée
5
EVT-TPR-007
Modification de profil refusée
Une modification de profil (matière/niveau) est refusée
5

Domaine PAR — Profil Parent
Code
Événement
Description
Chap.
EVT-PAR-001
Compte Parent créé
Le Parent crée son compte
6
EVT-PAR-002
Compte Parent validé
Le compte Parent est validé par un Administrateur
6
EVT-PAR-003
Enfant ajouté
Le Parent ajoute un enfant à son profil
6
EVT-PAR-004
Enfant modifié
Le Parent modifie les informations d’un enfant
6
EVT-PAR-005
Situation scolaire mise à jour
Le Parent met à jour la situation scolaire d’un enfant
6
EVT-PAR-006
Établissement demandé
Le Parent demande l’ajout d’un établissement scolaire
6
EVT-PAR-007
Enfant archivé
Le Parent archive le profil d’un enfant
6
EVT-PAR-008
Enfant réactivé
Le Parent réactive un profil archivé
6
EVT-PAR-009
Compte désactivé
Le compte Parent est désactivé (à la demande du Parent ou par GROUPI)
6

Domaine SCH — Situation scolaire
Code
Événement
Description
Chap.
EVT-SCH-001
Situation scolaire créée
Une nouvelle situation scolaire est créée pour un élève
7
EVT-SCH-002
Demande de modification de situation scolaire
Une situation scolaire existante est modifiée
7
EVT-SCH-003
Situation scolaire clôturée
Une situation scolaire est clôturée (passage à une nouvelle)
7
EVT-SCH-004
Nouvelle année académique
Une nouvelle année académique est créée dans GROUPI
7
EVT-SCH-005
Situation scolaire expirée
Une situation scolaire arrive à sa date de fin de validité
7
EVT-SCH-006
Incohérence détectée
Une incohérence entre âge et niveau est détectée
7
EVT-SCH-007
Situation scolaire validée
Un Administrateur valide une modification de situation
7
EVT-SCH-008
Modification de situation scolaire refusée
Une modification de situation scolaire est refusée par un Administrateur
7

Domaine CYC — Cycle de vie des comptes
Code
Événement
Description
Chap.
EVT-CYC-001
Compte créé
Un nouvel utilisateur crée son compte GROUPI
8
EVT-CYC-002
Compte validé
Un Administrateur valide le compte d’un utilisateur
8
EVT-CYC-003
Compte suspendu
Un compte utilisateur est suspendu
8
EVT-CYC-004
Compte réactivé
Un compte suspendu est réactivé
8
EVT-CYC-005
Compte désactivé
Un compte utilisateur est désactivé définitivement
8
EVT-CYC-006
Permissions modifiées
Les autorisations d’un Administrateur sont modifiées
8
EVT-CYC-007
Compte anonymisé
Les données personnelles d’un utilisateur sont anonymisées conformément aux règles de conservation des données, tout en préservant les historiques métier.
8
EVT-CYC-008
Compte archivé (Version 2)
Le compte est placé en archivage définitif afin de préserver son historique tout en le retirant de l’utilisation courante.
8
EVT-CYC-009
Demande de suppression déposée
L’utilisateur demande la suppression de son compte.
8
EVT-CYC-010
Suppression refusée
La suppression est refusée en raison de la présence d’un historique métier.
8
EVT-CYC-011
Transition d’état refusée
Une tentative de changement d’état non autorisée a été rejetée.
8

Domaine SEC — Sécurité des accès
Code
Événement
Description
Chap.
EVT-SEC-001
Connexion réussie
Un utilisateur se connecte avec succès
9
EVT-SEC-002
Connexion échouée
Une tentative de connexion échoue
9
EVT-SEC-003
Déconnexion
Un utilisateur se déconnecte
9
EVT-SEC-004
Mot de passe modifié
Un utilisateur modifie son mot de passe
9
EVT-SEC-005
Mot de passe réinitialisé
Un utilisateur réinitialise son mot de passe
9
EVT-SEC-006
Connexion inhabituelle
Une connexion suspecte est détectée
9
EVT-SEC-007
Session expirée
Une session utilisateur expire automatiquement
9
EVT-SEC-008
Compte verrouillé
Un compte est verrouillé après plusieurs échecs
9
EVT-SEC-009
Déconnexion forcée
Le Super Administrateur force la déconnexion d’un utilisateur
9
EVT-SEC-010
Score de risque élevé
Un score de risque > 70 est détecté pour un compte
9
EVT-SEC-011
2FA activée (Version 2)
Un utilisateur active l’authentification à deux facteurs
9
EVT-SEC-012
Appareil inconnu détecté
Une connexion est effectuée depuis un appareil jamais utilisé
9
EVT-SEC-013
Nouvel appareil reconnu
Un nouvel appareil est associé au compte utilisateur après authentification réussie.
9
EVT-SEC-014
Compte verrouillé automatiquement
Le compte est verrouillé après dépassement du nombre maximal de tentatives d’authentification.
9
EVT-SEC-015
Lien de réinitialisation expiré
Le lien de réinitialisation n’est plus valide car sa durée de validité est dépassée.
9
EVT-SEC-016
Toutes les sessions invalidées
Toutes les sessions actives de l’utilisateur sont invalidées à la suite d’une opération de sécurité.
9

Domaine GRP — Groupes
Code
Événement
Description
Chap.
EVT-GRP-001
Groupe créé
Le Professeur crée un nouveau groupe.
10
EVT-GRP-002
Groupe ouvert
Le groupe passe du statut **BROUILLON** au statut **OUVERT** et devient visible selon ses paramètres.
10
EVT-GRP-003
Groupe modifié
Les paramètres du groupe sont modifiés.
10
EVT-GRP-004
Planning modifié
Le planning hebdomadaire du groupe est modifié.
10
EVT-GRP-005
Lieu modifié
Le lieu d’enseignement du groupe est modifié.
10
EVT-GRP-006
Tarif modifié
Le tarif public du groupe est modifié.
10
EVT-GRP-007
Groupe complet
Le groupe atteint sa capacité maximale.
10
EVT-GRP-008
Place libérée
Une place se libère dans un groupe complet.
10
EVT-GRP-009
Groupe clôturé
Le groupe est clôturé (fin d’année académique ou décision du Professeur).
10
EVT-GRP-010
Groupe archivé
Le groupe est archivé ; son historique reste consultable conformément aux règles d’autorisation.
10
EVT-GRP-011
Groupe complet masqué
Le groupe devient invisible dans les résultats de recherche car il est complet et configuré comme masqué.
10
EVT-GRP-012
Capacité d’abonnement atteinte
Le Professeur atteint la capacité maximale autorisée par son abonnement.
10
EVT-GRP-013
Conflit de planning détecté
Un conflit est détecté entre deux plannings d’un même Professeur ou d’un même élève.
10
EVT-GRP-014
Groupe dupliqué
Un nouveau groupe est créé par duplication d’un groupe existant avec un nouvel identifiant et le statut **BROUILLON**.
10
EVT-GRP-015
Groupe supprimé définitivement
Un groupe ne possédant ni séance, ni inscription, ni historique pédagogique ou comptable est supprimé définitivement.
10

Domaine PRE — Préinscriptions
Code
Événement
Description
Chap.
EVT-PRE-001
Préinscription créée
Un Parent crée une préinscription pour une année future
11
EVT-PRE-002
Proposition envoyée
Le Professeur envoie une proposition au Parent
11
EVT-PRE-003
Préinscription confirmée
Le Parent confirme la préinscription
11
EVT-PRE-004
Préinscription refusée
Le Parent refuse la proposition
11
EVT-PRE-005
Préinscription transformée
La préinscription est transformée en demande d’inscription
11
EVT-PRE-006
Préinscription expirée
La proposition arrive à expiration
11
EVT-PRE-007
Préinscription annulée
Le Parent annule sa préinscription avant réception d’une proposition
11
EVT-PRE-008
Préinscription clôturée automatiquement
La préinscription est clôturée sans création de groupe
11
EVT-PRE-009
Transformation refusée (capacité insuffisante)
La transformation en demande échoue pour cause de capacité
11
EVT-PRE-010
Préinscriptions compatibles détectées
GROUPI identifie automatiquement les préinscriptions compatibles avec un nouveau groupe.
11



Domaine INS — Inscriptions
Code
Événement
Description
Chap.
EVT-INS-001
Demande d’inscription créée
Le Parent crée une nouvelle demande d’inscription pour un élève dans un groupe.
12
EVT-INS-002
Demande d’inscription acceptée
Le Professeur accepte la demande d’inscription. Une inscription ACTIVE est créée automatiquement.
12
EVT-INS-003
Demande d’inscription refusée
Le Professeur refuse la demande d’inscription. Aucun lien d’inscription n’est créé.
12
EVT-INS-004
Tarif personnalisé modifié
Le Professeur modifie le tarif personnalisé appliqué à une inscription active.
12
EVT-INS-005
Inscription suspendue
L’inscription est suspendue manuellement par le Professeur ou un Administrateur.
12
EVT-INS-006
Inscription terminée
L’inscription est clôturée à la fin de l’année académique avant son archivage définitif.
12
EVT-INS-007
Changement de groupe
L’élève est transféré vers un autre groupe. Une nouvelle inscription est créée conformément aux règles métier.
12
EVT-INS-008
Inscription archivée
L’inscription est archivée définitivement. Aucune modification ultérieure n’est autorisée.
12
EVT-INS-009
Inscription réactivée
Une inscription suspendue est réactivée et redevient active.
12
EVT-INS-010
Demande expirée
La demande d’inscription expire automatiquement après le délai de réponse du Professeur.
12
EVT-INS-011
Inscription refusée automatiquement
GROUPI refuse automatiquement la demande à la suite d’un échec des vérifications métier.
12
EVT-INS-012
Demande annulée par le Parent
Le Parent annule une demande d’inscription encore en attente de décision du Professeur.
12
EVT-INS-013
Inscription suspendue automatiquement
GROUPI suspend automatiquement une inscription selon les règles métier (par exemple : groupe suspendu, Professeur suspendu ou décision administrative).
12
EVT-INS-014
Tarif personnalisé créé
Le Professeur définit un tarif personnalisé lors de l’acceptation de l’inscription ou ultérieurement.
12
EVT-INS-015
Demande rejetée automatiquement
GROUPI rejette automatiquement une demande d’inscription devenue invalide avant traitement (par exemple : groupe archivé, année académique clôturée, Parent archivé ou élève supprimé).
12
EVT-INS-016
Compte de suivi comptable créé
GROUPI crée automatiquement le compte de suivi comptable associé lors de l’activation de l’inscription.
12
EVT-INS-017
Demande d’inscription consultée
Le Professeur consulte une demande d’inscription avant de prendre sa décision.
12
EVT-INS-018
Tarif public appliqué
L’inscription est créée sans tarif personnalisé ; le tarif public du groupe est appliqué automatiquement.
12

Domaine SES — Séances
Code
Événement
Description
Chap.
EVT-SES-001
Séance générée automatiquement
Une séance est créée à partir du planning
13
EVT-SES-002
Séance exceptionnelle créée
Le Professeur crée une séance hors planning
13
EVT-SES-003
Séance déplacée
Une séance future est déplacée
13
EVT-SES-004
Séance annulée
Une séance future est annulée
13
EVT-SES-005
Passage exceptionnel en ligne
Une séance présentielle devient en ligne
13
EVT-SES-006
Présences enregistrées
Le Professeur saisit les présences de la séance
13
EVT-SES-007
Séance verrouillée
La séance devient définitive (après 48h)
13
EVT-SES-008
Période d’interruption définie
Le Professeur définit une période sans séances
13
EVT-SES-009
Période d’interruption terminée
La génération automatique des séances reprend
13
EVT-SES-010
Séance reportée
Une séance est reportée à une autre date
13
EVT-SES-011
Seuil d’abandon atteint
Un élève atteint le seuil d’abandon défini pour le groupe
13
EVT-SES-012
Conflit de planning détecté
Un conflit est détecté avec une autre séance du Professeur
13
EVT-SES-013
Présence modifiée
Le Professeur corrige le statut de présence d’un élève dans le délai autorisé.
13
EVT-SES-014
Facturation corrigée
Une correction comptable est réalisée après modification autorisée de la séance.
13
EVT-SES-015
Séance générée après reprise
GROUPI génère automatiquement les séances après la fin d’une période d’interruption.
13
EVT-SES-016
Commentaires pédagogiques enregistrés
Le Professeur enregistre les commentaires pédagogiques de la séance.
13
EVT-SES-017
Paiement enregistré pendant la séance
Le Professeur enregistre un paiement associé à une inscription.
13
EVT-SES-018
Séance créée manuellement
Une séance est créée indépendamment de la génération automatique.
13
EVT-SES-019
Séance supprimée avant réalisation
Une séance future est supprimée par le Professeur.
13
EVT-SES-020
Séance déverrouillée administrativement
Opération exceptionnelle réalisée par un Super Administrateur.
13
EVT-SES-021
Ecritures comptables générées
GROUPI génère automatiquement les écritures comptables de la séance selon les règles de facturation.
13
EVT-SES-022
Présence supprimée
Une correction supprime un statut de présence.
13
EVT-SES-023
Mode d’enseignement rétabli
Une séance revient au mode initial avant son déroulement.
13
EVT-SES-024
Séance automatiquement non générée
GROUPI ne génère pas une séance en raison d’une règle métier (abonnement suspendu, groupe sans élève, période d’interruption, etc.).
13
EVT-SES-025
Séance ignorée (doublon)
Une tentative de génération détecte une séance déjà existante.
13
EVT-SES-026
Historique de séance consulté
Consultation de l’historique d’audit d’une séance (utile pour les audits).
13

Domaine ATT — Présences
Code
Événement
Description
Chap.
EVT-ATT-001
Présence enregistrée
Un élève est marqué Présent à une séance
14
EVT-ATT-002
Présence modifiée
Le statut de présence d’un élève est modifié
14
EVT-ATT-003
Retard enregistré
Un élève est marqué Retard à une séance
14
EVT-ATT-004
Absence excusée enregistrée
Un élève est marqué Absent excusé
14
EVT-ATT-005
Absence non excusée enregistrée
Un élève est marqué Absent non excusé
14
EVT-ATT-006
Seuil d’abandon atteint
Un élève atteint le nombre d’absences consécutives
14
EVT-ATT-007
Signalement d’absence
Le Parent signale l’absence de son enfant
14
EVT-ATT-008
Registre exporté
Le Professeur exporte le registre de présence
14
EVT-ATT-009
Présence en ligne enregistrée
Une présence est enregistrée pour une séance en ligne
14
EVT-ATT-010
Présences validées
Toutes les présences de la séance sont validées.
14
EVT-ATT-011
Présence verrouillée
La présence devient définitivement non modifiable.
14
EVT-ATT-012
Présence corrigée administrativement
Un Super Administrateur réalise un ajustement exceptionnel.
14
EVT-ATT-013
Statistiques d’assiduité recalculées
GROUPI recalcule automatiquement les indicateurs.
14
EVT-ATT-014
Ecriture comptable générée
La validation de la présence déclenche une écriture comptable.
14
EVT-ATT-015
Signalement d’absence traité
Le Professeur qualifie définitivement l’absence signalée.
14
EVT-ATT-016
Toutes les présences renseignées
Tous les élèves de la séance possèdent désormais un statut.
14
EVT-ATT-017
Retard important détecté
Le retard dépasse le seuil défini par le Professeur.
14
EVT-ATT-018
Validation annulée
Avant la validation définitive de la séance, le Professeur remet au moins une présence à l’état NON_RENSEIGNEE.
14

Domaine CPT — Comptabilité
Code
Événement
Description
Chap.
EVT-CPT-001
Compte de suivi comptable créé
Un compte de suivi comptable est créé automatiquement lors de l’activation d’une inscription.
15
EVT-CPT-002
Paiement enregistré
Le Professeur enregistre un paiement reçu pour une inscription.
15
EVT-CPT-003
Séance facturée
La validation des présences génère automatiquement une écriture comptable de type SESSION.
15
EVT-CPT-004
Ajustement comptable créé
Une écriture d’ajustement est créée pendant la période de modification autorisée.
15
EVT-CPT-005
Compte de suivi comptable recalculé
Les totaux du compte de suivi comptable (crédits, débits, solde et indicateurs financiers) sont recalculés automatiquement après toute opération ayant un impact financier.
15
EVT-CPT-006
Paiement modifié
Un paiement précédemment enregistré est modifié pendant la période autorisée.
15
EVT-CPT-007
Paiement annulé
Un paiement est annulé par la création d’une écriture inverse afin de préserver la traçabilité comptable.
15
EVT-CPT-008
Compte de suivi comptable verrouillé
Le compte de suivi comptable devient non modifiable à la clôture de la période comptable ou de l’année académique.
15
EVT-CPT-009
Ajustement administratif
Un Administrateur réalise un ajustement comptable exceptionnel en dehors de la période normale de modification.
15
EVT-CPT-010
Écriture comptable créée
Une nouvelle écriture comptable est créée dans un compte (PAYMENT, SESSION, ADJUSTMENT ou ADMIN_ADJUSTMENT).
15
EVT-CPT-011
Écriture comptable annulée
Une écriture comptable est annulée au moyen d’une écriture inverse, sans suppression de l’écriture d’origine.
15
EVT-CPT-012
Solde débiteur important détecté
Le solde débiteur d’un compte dépasse le seuil d’alerte défini pour le groupe.
15
EVT-CPT-013
Solde créditeur important détecté
Le solde créditeur d’un compte dépasse le seuil d’information défini pour le groupe.
15
EVT-CPT-014
Compte de suivi comptable archivé
Le compte de suivi comptable est archivé à la clôture définitive de l’inscription ou de l’année académique.
15
EVT-CPT-015
Chiffre d’affaires prévisionnel recalculé
Le chiffre d’affaires prévisionnel est recalculé à la suite d’une modification impactant la facturation future.
15
EVT-CPT-016
Chiffre d’affaires réalisé recalculé
Le chiffre d’affaires réalisé est recalculé après une modification autorisée des écritures comptables ou des présences.
15

Domaine DSH — Tableaux de bord
Code
Événement
Description
Chap.
EVT-DSH-001
Tableau de bord actualisé
Les indicateurs du tableau de bord sont recalculés
16
EVT-DSH-002
Alerte générée
Une nouvelle alerte est créée sur le tableau de bord
16
EVT-DSH-003
Alerte résolue
Une alerte est marquée comme résolue
16
EVT-DSH-004
Indicateurs recalculés
Les indicateurs statistiques sont recalculés
16
EVT-DSH-005
Export du tableau de bord
Le Professeur exporte son tableau de bord
16
EVT-DSH-006
Personnalisation du tableau de bord
Le Professeur personnalise son affichage (Version 2)
16
EVT-DSH-007
Signalement d’absence depuis le tableau de bord
Le Parent signale une absence via le tableau de bord
16

Domaine EXP — Exports
Code
Événement
Description
Chap.
EVT-EXP-001
Export demandé
Un utilisateur demande un export de données
17
EVT-EXP-002
Export généré
Le fichier d’export est généré
17
EVT-EXP-003
Export téléchargé
L’utilisateur télécharge le fichier généré
17
EVT-EXP-004
Export refusé
L’export est refusé (abonnement insuffisant)
17
EVT-EXP-005
Export programmé (Version 2)
Un export automatique programmé est déclenché
17
EVT-EXP-006
Export programmé créé (Version 2)
L’utilisateur crée un export automatique programmé
17
EVT-EXP-007
Export programmé supprimé (Version 2)
L’utilisateur supprime un export programmé
17
EVT-EXP-008
Export RGPD demandé
Un utilisateur demande l’export de ses données personnelles
17
EVT-EXP-009
Export expiré
Le fichier est supprimé automatiquement
17

Domaine NOT — Notifications et centre d’activités
Code
Événement
Description
Chap.
EVT-NOT-001
Activité créée
Une nouvelle activité est créée dans le centre d’activités
18
EVT-NOT-002
Notification envoyée
Une notification est envoyée à un utilisateur
18
EVT-NOT-003
Notification consultée
Un utilisateur consulte ses notifications
18
EVT-NOT-004
Notification archivée
Une notification est marquée comme archivée
18
EVT-NOT-005
Notification lue
Un utilisateur marque une notification comme lue
18
EVT-NOT-006
E-mail envoyé
Un e-mail de notification est envoyé
18

Domaine COM — Communication
Code
Événement
Description
Chap.
EVT-COM-001
Commentaire créé
Un commentaire est ajouté au fil d’une inscription
19
EVT-COM-002
Commentaire modifié
Un commentaire est modifié par son auteur
19
EVT-COM-003
Commentaire supprimé logiquement
Un commentaire est supprimé (conservé dans l’historique)
19
EVT-COM-004
Annonce publiée
Le Professeur publie une annonce de groupe
19
EVT-COM-005
Annonce lue par un Parent
Un Parent consulte l’annonce
19
EVT-COM-006
Annonce expirée
L’annonce arrive à sa date d’expiration
19
EVT-COM-007
Annonce programmée publiée
Une annonce programmée est automatiquement publiée
19
EVT-COM-008
Commentaire signalé (Version 2)
Un commentaire est signalé comme inapproprié
19

Domaine CHG — Changement de groupe
Code
Événement
Description
Chap.
EVT-CHG-001
Demande de changement créée
Un Parent ou Professeur demande un changement de groupe
20
EVT-CHG-002
Demande de changement acceptée
Le Professeur accepte le changement
20
EVT-CHG-003
Demande de changement refusée
Le Professeur refuse le changement
20
EVT-CHG-004
Changement définitif appliqué
Le changement définitif est effectué
20
EVT-CHG-005
Retour automatique (temporaire)
L’élève réintègre automatiquement son groupe d’origine
20
EVT-CHG-006
Changement temporaire appliqué
Le changement temporaire est effectué
20
EVT-CHG-007
Date d’effet atteinte
La date d’effet du changement est atteinte
20

Domaine ABO — Gestion des abonnements
Code
Événement
Description
Chap.
EVT-ABO-001
Abonnement souscrit
Le Professeur souscrit un abonnement
21
EVT-ABO-002
Abonnement renouvelé
Abonnement souscrit pour une nouvelle année académique
21
EVT-ABO-003
Abonnement suspendu
L’abonnement est suspendu (non-paiement)
21
EVT-ABO-004
Abonnement réactivé
L’abonnement est réactivé après régularisation
21
EVT-ABO-005
Abonnement arrivé à échéance
L’abonnement expire en fin d’année académique
21
EVT-ABO-006
Rappel d’échéance envoyé
GROUPI envoie un rappel avant l’expiration
21




Domaine PERM — Droits liés aux abonnements
Code
Événement
Description
Chap.
EVT-PERM-001
Droit accordé
Une fonctionnalité devient disponible
22
EVT-PERM-002
Droit retiré
Une fonctionnalité devient indisponible
22
EVT-PERM-003
Contrôle d’autorisation refusé
Une opération est refusée pour insuffisance de droits
22
EVT-PERM-004
Droits modifiés (changement d’offre)
Les droits sont mis à jour suite à un changement d’offre
22
EVT-PERM-005
Droits en délai de grâce
Les droits sont maintenus pendant le délai de grâce
22

Domaine REF — Référentiels
Code
Événement
Description
Chap.
EVT-REF-001
Nouvelle entrée de référentiel créée
Une nouvelle entrée est ajoutée dans un référentiel (matière, niveau, établissement ou ville).
23
EVT-REF-002
Nouvelle entrée de référentiel modifié
Une entrée existante d’un référentiel est modifiée.
23
EVT-REF-003
Référentiel inactivé
Un référentiel est marqué comme inactif
23
EVT-REF-004
Référentiel réactivé
Un référentiel inactif est réactivé
23
EVT-REF-005
Demande d’ajout d’établissement
Un Parent ou Professeur demande l’ajout d’un établissement
23

Domaine TRS — Règles transversales
Code
Événement
Description
Chap.
EVT-TRS-001
Donnée historisée
Une donnée métier est transférée dans l’historique tout en restant consultable selon les droits de l’utilisateur.
24
EVT-TRS-002
Donnée archivée
Un objet métier est archivé et devient non modifiable tout en restant consultable.
24
EVT-TRS-003
Recalcul automatique effectué
GROUPI recalcule automatiquement un ou plusieurs indicateurs métier à la suite d’une opération ayant un impact sur les données.
24
EVT-TRS-004
Donnée verrouillée
Une donnée devient définitivement non modifiable en raison d’une règle métier (clôture d’année académique, archivage, expiration d’un délai, etc.).
24
EVT-TRS-005
Année académique clôturée
L’année académique est clôturée et l’ensemble des données associées bascule automatiquement en lecture seule.
24
EVT-TRS-006
Opération refusée pour incohérence
GROUPI refuse automatiquement une opération qui entraînerait une incohérence fonctionnelle ou référentielle.
24
EVT-TRS-007
Traitement asynchrone terminé
Une opération exécutée en arrière-plan (export, recalcul massif, etc.) est terminée et son résultat est disponible.
24

Domaine CAL — Règles de calcul
Code
Événement
Description
Chap.
EVT-CAL-001
Recalcul automatique déclenché
Un événement déclenche le recalcul d’un indicateur
25
EVT-CAL-002
Recalcul asynchrone terminé
Un calcul asynchrone est terminé, le résultat est disponible
25

Domaine GEN — Règles métier générales
Code
Événement
Description
Chap.
EVT-GEN-001
Règle métier validée
Une règle métier générale est validée par le Super Administrateur.
26
EVT-GEN-002
Opération refusée
Une opération est refusée car elle ne respecte pas une règle métier générale.
26
EVT-GEN-003
Objet verrouillé
Un objet métier devient définitivement non modifiable.
26
EVT-GEN-004
Objet archivé
Un objet métier est archivé conformément aux règles de conservation.
26
EVT-GEN-005
Notification métier générée
Une activité ou une notification est générée automatiquement suite à une opération métier.
26

Domaine ARC — Architecture métier
Code
Événement
Description
Chap.
EVT-ARC-001
Domaine créé
Un nouveau domaine fonctionnel est intégré à GROUPI
27
EVT-ARC-002
Événement inter-domaines publié
Un domaine publie un évènement métier
27
EVT-ARC-003
Événement inter-domaines consommé
Un domaine traite un événement provenant d’un autre domaine
27
EVT-ARC-004
API inter-domaines appelée
Un domaine utilise un service exposé par un autre domaine
27
EVT-ARC-005
Synchronisation terminée
Les domaines sont synchronisés
27
EVT-ARC-006
Rejeu d’événements
Relecture des événements après incident
27

Domaine ROAD — Feuille de route et évolutions
Code
Événement
Description
Chap.
EVT-ROAD-001
Fonctionnalité Version 2 activée
Une fonctionnalité de la Version 2 est activée
29
EVT-ROAD-002
Add-on souscrit
Un Professeur souscrit un Add-on
29
EVT-ROAD-003
Diplôme validé
Un diplôme de Professeur est validé
29
EVT-ROAD-004
Élève ajouté à une liste d’attente
Un Parent inscrit son enfant sur une liste d’attente
29
EVT-ROAD-005
Paiement électronique confirmé
Un paiement électronique est confirmé
29




## Annexe G — Catalogue des statuts

Ce catalogue recense, pour chaque objet métier possédant un cycle de vie, l’ensemble des statuts (états) qu’il peut prendre, avec leur code lorsqu’il est formalisé (ex. INS-STAT-002) et leur description.
Cet index constitue la synthèse consolidée de tous les statuts de GROUPI. Chaque chapitre reste la source de vérité normative ; cet index en est le reflet et doit être régénéré en cas de modification des chapitres.
Total : 51 statuts répartis sur 9 objets métier.

Compte utilisateur (Chapitres 3, 8)
Code
Statut
Description
Chap.
—
PENDING_VALIDATION
Le compte a été créé mais n’a pas encore été validé.
3
—
ACTIVE
Le compte est validé ; toutes les fonctionnalités correspondant aux rôles de l’utilisateur sont disponibles.
3
—
SUSPENDED
Le compte reste existant mais certaines fonctionnalités sont temporairement bloquées (réversible).
3
—
DISABLED
Le compte n’est plus utilisable ; aucune connexion n’est possible. Les données restent conservées.
3
—
ARCHIVED
Le compte est définitivement clôturé (Version 2). Aucune réactivation n’est prévue.
3

Abonnement (Chapitres 4, 21)
Code
Statut
Description
Chap.
—
PENDING_PAYMENT
Paiement en attente de validation.
4
—
ACTIVE
Abonnement actif.
4
—
SUSPENDED
Suspension temporaire (ex. non-paiement).
4
—
EXPIRED
Arrivé à échéance.
4
—
DISABLED
Désactivé.
4
—
ARCHIVED
Conservé uniquement pour l’historique.
4



Groupe (Chapitre 10)
Code
Statut
Description
Chap.
—
BROUILLON
Groupe en cours de création, non visible.
10
—
OUVERT
Groupe visible, accepte les inscriptions.
10
—
COMPLET
Capacité atteinte (visible ou masqué selon paramètre).
10
—
CLOTURE
Groupe terminé, plus d’inscriptions.
10
—
ARCHIVE
Groupe archivé, historique conservé.
10

Préinscription (Chapitre 11)
Code
Statut
Description
Chap.
PRE-STAT-001
OUVERTE
Préinscription active, en attente de proposition.
11
PRE-STAT-002
PROPOSEE
Une proposition a été envoyée au Parent.
11
PRE-STAT-003
CONFIRMEE
Le Parent a confirmé son intérêt.
11
PRE-STAT-004
TRANSFORMEE
La préinscription a été transformée en demande d’inscription.
11
PRE-STAT-005
EXPIREE
La proposition ou la préinscription est arrivée à expiration.
11
PRE-STAT-006
CLOTUREE
La préinscription est clôturée sans transformation.
11
PRE-STAT-007
ANNULEE
Préinscription annulée par le Parent avant toute transformation.
11
PRE-STAT-008
REFUSEE
Le Parent a refusé la proposition.
11

Inscription (Chapitre 12)
Code
Statut
Description
Chap.
INS-STAT-001
EN_ATTENTE
Demande soumise, en attente de décision.
12
INS-STAT-002
ACTIVE
Inscription validée, élève participant.
12
INS-STAT-003
SUSPENDUE
Participation momentanément interrompue.
12
INS-STAT-004
REFUSEE
Demande refusée par le Professeur.
12
INS-STAT-005
EXPIREE
Demande expirée sans réponse.
12
INS-STAT-006
ARCHIVEE
Inscription définitivement clôturée.
12
INS-STAT-007
ANNULEE
Demande annulée par le Parent avant toute décision du Professeur.
12
Séance (Chapitre 13)
Code
Statut
Description
Chap.
SES-STAT-001
PLANIFIEE
Séance générée et prévue.
13
SES-STAT-002
EN_COURS
Séance en cours.
13
SES-STAT-003
TERMINEE
Séance terminée.
13
SES-STAT-004
ANNULEE
Séance annulée.
13
SES-STAT-005
VERROUILLEE
Séance définitivement figée. ⚠ Code SES-STAT-005 absent (saut de numérotation à corriger).
13

Présence (Chapitre 14)
Code
Statut
Description
Chap.
ATT-STAT-001
NON_RENSEIGNEE
Présence non encore saisie.
14
ATT-STAT-002
PRESENT
Élève présent.
14
ATT-STAT-003
ABSENT_EXCUSE
Absence justifiée.
14
ATT-STAT-004
ABSENT_NON_EXCUSE
Absence non justifiée.
14
ATT-STAT-005
RETARD
Élève présent avec retard.
14
ATT-STAT-006
VERROUILLEE
Présence définitivement figée.
14

Compte de suivi comptable (Chapitre 15)
Code
Statut
Description
Chap.
—
CREATED
Le compte de suivi comptable vient d’être créé automatiquement lors de l’activation de l’inscription ; aucune écriture n’y est encore enregistrée.
15
—
ACTIVE
Le compte enregistre normalement les écritures (paiements, facturations, ajustements) liées à l’inscription.
15
—
LOCKED
Le compte est verrouillé à la clôture de la période comptable (fin d’année académique) ; plus aucune nouvelle écriture ne peut y être ajoutée, sauf ajustement administratif exceptionnel.
15
—
CLOSED
Le compte est définitivement clôturé, généralement à la clôture de l’inscription correspondante.
15
—
ARCHIVED
Le compte est archivé ; il reste consultable mais n’est plus utilisé dans les calculs courants.
15

Écriture comptable (Chapitre 15)
Code
Statut
Description
Chap.
—
CREATED
Écriture créée mais non encore validée.
15
—
POSTED
Écriture validée et prise en compte dans les calculs comptables.
15
—
REVERSED
Écriture annulée par une écriture inverse tout en restant historisée.
15
—
LOCKED
Écriture définitivement figée et non modifiable.
15



## Annexe H — Catalogue des notifications
Chaque notification reçoit un identifiant unique (NOT-xxx). Les notifications diffusent vers l’utilisateur concerné un sous-ensemble des évènements métier jugé suffisamment important pour justifier une communication active.
Cet index constitue la synthèse consolidée de toutes les notifications de GROUPI. Chaque chapitre reste la source de vérité normative ; cet index en est le reflet et doit être régénéré en cas de modification des chapitres.
Total : 180 notifications réparties sur 18 domaines.

Domaine TPR — Profil Professeur
Code
Notification
Destinataire
Priorité
Chap.
NOT-TPR-001
Profil validé
Professeur
Important
5
NOT-TPR-002
Nouvelle matière validée
Professeur
Information
5
NOT-TPR-003
Modification de profil refusée
Professeur
Important
5
NOT-TPR-004
Profil en attente de validation
Professeur
Information
5
NOT-TPR-005
Nouveau niveau validé
Professeur
Information
5

Domaine PAR — Profil Parent
Code
Notification
Destinataire
Priorité
Chap.
NOT-PAR-001
Compte Parent validé
Parent
Important
6
NOT-PAR-002
Nouvel établissement accepté
Parent
Information
6
NOT-PAR-003
Demande d’établissement refusée
Parent
Information
6
NOT-PAR-004
Enfant ajouté au profil
Parent
Information
6
NOT-PAR-005
Situation scolaire à mettre à jour
Parent
Important
6
NOT-PAR-006
Profil enfant incomplet
Parent
Important
6
NOT-PAR-007
Demande d’inscription acceptée
Parent
Important
6
NOT-PAR-008
Demande d’inscription refusée
Parent
Important
6
NOT-PAR-009
Nouveau commentaire pédagogique
Parent
Information
6
NOT-PAR-010
Absence non justifiée détectée
Parent
Important
6
NOT-PAR-011
Compte Parent désactivé
Parent
Critique
6
Domaine SCH — Situation scolaire
Code
Notification
Destinataire
Priorité
Chap.
NOT-SCH-001
Nouvelle année académique disponible
Parent
Information
7
NOT-SCH-002
Situation scolaire mise à jour
Parent
Information
7
NOT-SCH-003
Situation scolaire en attente de mise à jour
Parent
Important
7
NOT-SCH-004
Situation scolaire expirant (J-15)
Parent
Important
7
NOT-SCH-005
Situation scolaire expirée - Inscriptions bloquées
Parent
Critique
7
NOT-SCH-006
Modification de la situation scolaire validée
Parent
Information
7
NOT-SCH-007
Incohérence âge/niveau détectée
Administrateur
Important
7
NOT-SCH-008
Modification de situation scolaire refusée
Parent
Information
7
NOT-SCH-009
Incohérence âge/niveau détectée
Parent
Information
7

Domaine CYC — Cycle de vie des comptes
Code
Notification
Destinataire
Priorité
Chap.
NOT-CYC-001
Compte validé
Utilisateur
Important
8
NOT-CYC-002
Compte suspendu
Utilisateur
Critique
8
NOT-CYC-003
Compte réactivé
Utilisateur
Important
8
NOT-CYC-004
Compte en attente de validation (rappel J-7)
Utilisateur
Information
8
NOT-CYC-005
Compte en attente de validation (rappel J-30)
Utilisateur
Information
8
NOT-CYC-006
Compte archivé (Version 2)
Utilisateur
Important
8
NOT-CYC-007
Données personnelles anonymisées
Utilisateur
Critique
8
NOT-CYC-008
Suppression du compte refusée
Utilisateur
Important
8
NOT-CYC-009
Compte désactivé suite à une demande de suppression
Utilisateur
Information
8
NOT-CYC-010
Compte désactivé
Utilisateur
Critique
8




Domaine SEC — Sécurité des accès
Code
Notification
Destinataire
Priorité
Chap.
NOT-SEC-001
Connexion inhabituelle détectée
Utilisateur
Critique
9
NOT-SEC-002
Réinitialisation du mot de passe demandée
Utilisateur
Important
9
NOT-SEC-003
Mot de passe modifié avec succès
Utilisateur
Information
9
NOT-SEC-004
Déconnexion forcée
Utilisateur
Critique
9
NOT-SEC-005
Compte verrouillé (trop d’échecs)
Utilisateur
Critique
9
NOT-SEC-006
Tentative de connexion depuis un nouvel appareil
Utilisateur
Important
9
NOT-SEC-007
Compte déconnecté suite à une connexion suspecte
Utilisateur
Critique
9
NOT-SEC-008
Nouveau mot de passe validé
Utilisateur
Information
9
NOT-SEC-009
Échec de connexion multiple depuis un nouvel appareil
Utilisateur
Important
9
NOT-SEC-010
Sécurité du compte renforcée (2FA activé)
Utilisateur
Information
9
NOT-SEC-011
Nouveau navigateur détecté
Utilisateur
Information
9
NOT-SEC-012
Compte déverrouillé automatiquement
Utilisateur
Information
9

Domaine GRP — Groupes
Code
Notification
Destinataire
Priorité
Chap.
NOT-GRP-001
Groupe créé
Professeur
Information
10
NOT-GRP-002
Planning modifié
Professeur, Parents
Important
10
NOT-GRP-003
Lieu modifié
Professeur, Parents
Important
10
NOT-GRP-004
Capacité du groupe atteinte (100%)
Professeur
Important
10
NOT-GRP-005
Groupe clôturé
Professeur, Parents
Important
10
NOT-GRP-006
Place libérée dans un groupe complet
Parents en liste d’attente (Version 2)
Important
10
NOT-GRP-007
Capacité du groupe bientôt atteinte (80%)
Professeur
Information
10
NOT-GRP-008
Nouveau groupe dans votre matière/niveau
Parents (recherche)
Information
10
NOT-GRP-009
Planning modifié - conflit détecté
Professeur
Important
10

Domaine PRE — Préinscriptions
Code
Notification
Destinataire
Priorité
Chap.
NOT-PRE-001
Préinscription créée
Professeur
Information
11
NOT-PRE-002
Proposition de préinscription envoyée
Parent
Important
11
NOT-PRE-003
Confirmation de préinscription enregistrée
Professeur
Information
11
NOT-PRE-004
Proposition expirée
Parent
Important
11
NOT-PRE-005
Nouvelle préinscription pour l’année suivante
Professeur
Information
11
NOT-PRE-006
Groupe créé, préinscriptions compatibles trouvées
Professeur
Important
11
NOT-PRE-007
Préinscription expirée sans proposition
Parent
Information
11
NOT-PRE-008
Préinscription clôturée (fin de période)
Professeur
Information
11
NOT-PRE-009
Groupe créé --- aucune préinscription compatible
Professeur
Information
11
NOT-PRE-010
Rappel : préinscriptions ouvertes pour l’année prochaine
Professeur
Information
11
NOT-PRE-011
Préinscription annulée
Professeur
Information
11
NOT-PRE-012
Préinscription refusée
Professeur
Information
11

Domaine INS — Inscriptions
Code
Notification
Destinataire
Priorité
Chap.
NOT-INS-001
Nouvelle demande d’inscription reçue
Professeur
Important
12
NOT-INS-002
Demande d’inscription acceptée
Parent
Important
12
NOT-INS-003
Demande d’inscription refusée
Parent
Important
12
NOT-INS-004
Tarif personnalisé modifié
Parent
Information
12
NOT-INS-005
Inscription suspendue
Parent
Important
12
NOT-INS-006
Inscription réactivée
Parent
Information
12
NOT-INS-007
Changement de groupe accepté
Parent
Important
12
NOT-INS-008
Changement de groupe refusé
Parent
Important
12
NOT-INS-009
Inscription terminée (fin d’année)
Parent
Information
12
NOT-INS-010
Demande d’inscription expirée (Professeur sans réponse)
Parent
Important
12
NOT-INS-011
Demande d’inscription reçue --- rappel J+3
Professeur
Information
12
NOT-INS-012
Nouvelle place disponible dans un groupe complet
Parent (en liste d’attente Version 2)
Important
12
NOT-INS-013
Inscription automatiquement refusée (vérification échouée)
Parent
Critique
12
NOT-INS-014
Demande d’inscription annulée par le Parent
Professeur
Information
12
NOT-INS-015
Inscription suspendue automatiquement
Parent
Important
12
NOT-INS-016
Inscription créée
Professeur
Information
12

Domaine SES — Séances
Code
Notification
Destinataire
Priorité
Chap.
NOT-SES-001
Nouvelle séance exceptionnelle créée
Parents du groupe
Important
13
NOT-SES-002
Séance déplacée
Parents du groupe
Important
13
NOT-SES-003
Séance annulée
Parents du groupe
Important
13
NOT-SES-004
Passage exceptionnel en ligne
Parents du groupe
Important
13
NOT-SES-005
Période d’interruption définie
Parents du groupe
Information
13
NOT-SES-006
Période d’interruption terminée
Parents du groupe
Information
13
NOT-SES-007
Séance reportée
Parents du groupe
Important
13
NOT-SES-008
Nouvelle séance générée
Parent
Information
13
NOT-SES-009
Rappel : séance dans 24h
Professeur, Parents
Information
13
NOT-SES-010
Absence non justifiée détectée (seuil d’abandon)
Professeur
Important
13
NOT-SES-011
Séance verrouillée (corrections impossibles)
Professeur
Information
13
NOT-SES-012
Conflit de planning détecté
Professeur
Important
13
NOT-SES-013
Présences non saisies (rappel J+1)
Professeur
Important
13
NOT-SES-014
Présence corrigée
Parent
Information
13
NOT-SES-015
Facturation corrigée
Parent
Information
13
NOT-SES-016
Commentaires pédagogiques publiés
Parent
Information
13
NOT-SES-017
Paiement enregistré
Parent
Information
13
NOT-SES-018
Séance créée après report
Parent
Information
13

Domaine ATT — Présences
Code
Notification
Destinataire
Priorité
Chap.
NOT-ATT-001
Présence enregistrée
Parent
Information
14
NOT-ATT-002
Absence excusée enregistrée
Parent
Important
14
NOT-ATT-003
Absence non excusée enregistrée
Parent
Important
14
NOT-ATT-004
Retard enregistré
Parent
Information
14
NOT-ATT-005
Modification de présence
Parent
Important
14
NOT-ATT-006
Seuil d’abandon atteint
Professeur
Critique
14
NOT-ATT-007
Signalement d’absence reçu
Professeur
Important
14
NOT-ATT-008
Signalement d’absence confirmé
Parent
Information
14
NOT-ATT-009
Rappel : présences non saisies (J+1)
Professeur
Important
14
NOT-ATT-010
Présences verrouillées (corrections impossibles)
Professeur
Information
14
NOT-ATT-011
Absence signalée par le Parent
Professeur
Information
14
NOT-ATT-012
Taux d’absence élevé (alerte préventive)
Professeur
Important
14
NOT-ATT-013
Registre de présence exporté
Professeur
Information
14
NOT-ATT-014
Présences validées
Professeur
Information
14
NOT-ATT-015
Présences entièrement validées
Parent
Information
14
NOT-ATT-016
Présence corrigée après ajustement administratif
Parent
Information
14
NOT-ATT-017
Retard important détecté
Parent
Information
14
NOT-ATT-018
Seuil de retards atteint
Professeur
Information
14
NOT-ATT-019
Votre enfant présente plusieurs absences consécutives
Parent
Important
14



Domaine CPT — Comptabilité
Code
Notification
Destinataire
Priorité
Chap.
NOT-CPT-001
Paiement enregistré
Parent
Information
15
NOT-CPT-002
Paiement modifié
Parent
Important
15
NOT-CPT-003
Solde débiteur important
Parent, Professeur
Important
15
NOT-CPT-004
Ajustement comptable effectué
Parent
Important
15
NOT-CPT-005
Nouvelle séance facturée
Parent
Information
15
NOT-CPT-006
Solde créditeur important
Parent
Information
15
NOT-CPT-007
Rappel de paiement automatique
Parent
Important
15
NOT-CPT-008
Écriture comptable modifiée
Parent
Important
15
NOT-CPT-009
Compte de suivi comptable verrouillé (fin d’année)
Professeur, Parent
Important
15
NOT-CPT-010
Solde créditeur important (alerte préventive)
Parent
Information
15
NOT-CPT-011
Ajustement comptable administratif
Parent
Critique
15
NOT-CPT-012
CA prévisionnel mis à jour
Professeur
Information
15
NOT-CPT-013
Paiement supprimé
Parent
Important
15
NOT-CPT-014
Paiement annulé
Parent
Important
15
NOT-CPT-015
Compte archivé
Parent
Important
15

Domaine DSH — Tableaux de bord
Code
Notification
Destinataire
Priorité
Chap.
NOT-DSH-001
Nouvelle alerte sur le tableau de bord
Utilisateur concerné
Important
16
NOT-DSH-002
Alerte résolue
Utilisateur concerné
Information
16
NOT-DSH-003
Indicateurs clés mis à jour
Utilisateur concerné
Information
16
NOT-DSH-004
Indicateur clé dépassé (ex: CA prévisionnel en baisse)
Professeur
Importante
16
NOT-DSH-005
Nouvel indicateur disponible sur le tableau de bord
Utilisateur concerné
Informative
16
NOT-DSH-006
Dernier délai pour signaler une absence
Parent
Importante
16


Domaine EXP — Exports
Code
Notification
Destinataire
Priorité
Chap.
NOT-EXP-001
Export demandé en cours de génération
Utilisateur
Information
17
NOT-EXP-002
Export généré et disponible
Utilisateur
Information
17
NOT-EXP-003
Export refusé (abonnement insuffisant)
Utilisateur
Important
17
NOT-EXP-004
Export programmé déclenché (Version 2)
Utilisateur
Information
17
NOT-EXP-005
Échec de génération d’export
Utilisateur
Critique
17
NOT-EXP-006
Export expiré
Utilisateur
Information
17

Domaine COM — Communication
Code
Notification
Destinataire
Priorité
Chap.
NOT-COM-001
Nouveau commentaire pédagogique
Parent
Important
19
NOT-COM-002
Réponse à un commentaire
Professeur
Important
19
NOT-COM-003
Nouvelle annonce de groupe
Parents du groupe
Important
19
NOT-COM-004
Annonce de groupe mise à jour
Parents du groupe
Important
19
NOT-COM-005
Annonce de groupe expirée
Professeur
Information
19
NOT-COM-006
Annonce programmée publiée
Professeur
Information
19

Domaine CHG — Changement de groupe
Code
Notification
Destinataire
Priorité
Chap.
NOT-CHG-001
Demande de changement de groupe reçue
Professeur
Important
20
NOT-CHG-002
Demande de changement de groupe acceptée
Parent
Important
20
NOT-CHG-003
Demande de changement de groupe refusée
Parent
Important
20
NOT-CHG-004
Changement temporaire effectué
Parent, Professeur
Important
20
NOT-CHG-005
Changement définitif effectué
Parent, Professeur
Important
20
NOT-CHG-006
Retour automatique au groupe d’origine
Parent, Professeur
Important
20
NOT-CHG-007
Date d’effet du changement atteinte
Parent, Professeur
Important
20
NOT-CHG-008
Changement proposé par le Professeur
Parent
Important
20
NOT-CHG-009
Proposition de changement acceptée par le Parent
Professeur
Information
20

Domaine ABO — Gestion des abonnements
Code
Notification
Destinataire
Priorité
Chap.
NOT-ABO-001
Abonnement bientôt expiré (J-15)
Professeur
Important
21
NOT-ABO-002
Abonnement bientôt expiré (J-7)
Professeur
Critique
21
NOT-ABO-003
Abonnement bientôt expiré (J-3)
Professeur
Critique
21
NOT-ABO-004
Abonnement expiré
Professeur
Critique
21
NOT-ABO-005
Abonnement renouvelé avec succès
Professeur
Information
21
NOT-ABO-006
Abonnement suspendu pour non-paiement
Professeur
Critique
21
NOT-ABO-007
Abonnement réactivé
Professeur
Important
21

Domaine PERM — Droits liés aux abonnements
Code
Notification
Destinataire
Priorité
Chap.
NOT-PERM-001
Fonctionnalité indisponible dans l’offre actuelle
Professeur
Information
22
NOT-PERM-002
Nouveaux droits activés
Professeur
Information
22
NOT-PERM-003
Droits suspendus
Professeur
Important
22
NOT-PERM-004
Droits retirés (changement d’offre)
Professeur
Important
22

Domaine REF — Référentiels
Code
Notification
Destinataire
Priorité
Chap.
NOT-REF-001
Nouveau référentiel ajouté
Administrateur
Information
23
NOT-REF-002
Référentiel modifié
Administrateur
Information
23
NOT-REF-003
Demande d’ajout d’établissement
Administrateur
Important
23
NOT-REF-004
Demande d’ajout d’établissement acceptée
Parent
Information
23
NOT-REF-005
Demande d’ajout d’établissement refusée
Parent
Information
23
NOT-REF-006
Référentiel inactivé
Administrateur
Information
23

## Annexe I — Matrice des autorisations (RBAC)

RBAC = Role Based Access Control
Le présent catalogue définit l’ensemble des permissions fonctionnelles de GROUPI. Chaque permission autorise une action métier précise sur un domaine fonctionnel. Les permissions sont attribuées à des rôles par le Super Administrateur. Les rôles standards sont : Super Administrateur, Administrateur, Professeur, Parent.
Cet index constitue la synthèse consolidée des autorisations de GROUPI. Chaque chapitre reste la source de vérité normative ; cet index en est le reflet et doit être régénéré en cas de modification des chapitres.
Légende
Code
Signification
C
Créer
L
Lire / Consulter
M
Modifier
S
Supprimer
V
Valider / Approuver
O
Seulement sur ses propres données
D
Par délégation du Super Administrateur
---
Interdit

Domaine ACC — Comptes utilisateurs
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-ACC-001
Créer un administrateur
Permet de créer un nouveau compte Administrateur
C
---
---
---
PERM-ACC-002
Modifier un administrateur
Permet de modifier les informations d’un Administrateur
M
---
---
---
PERM-ACC-003
Supprimer un administrateur
Permet de supprimer un compte Administrateur
S
---
---
---
PERM-ACC-004
Consulter les administrateurs
Permet de consulter la liste des Administrateurs
L
L(D)
---
---
PERM-ACC-005
Valider un professeur
Permet de valider le compte d’un Professeur
V
V(D)
---
---
PERM-ACC-006
Valider la modification de profil professeur
Permet de valider les modifications de profil d’un Professeur (matières/niveaux)
V
V(D)
---
---
PERM-ACC-007
Suspendre un professeur
Permet de suspendre le compte d’un Professeur
V
V(D)
---
---
PERM-ACC-008
Réactiver un professeur
Permet de réactiver le compte d’un Professeur suspendu
V
V(D)
---
---
PERM-ACC-009
Valider un parent
Permet de valider le compte d’un Parent
V
V(D)
---
---
PERM-ACC-010
Suspendre un parent
Permet de suspendre le compte d’un Parent
V
V(D)
---
---
PERM-ACC-011
Réactiver un parent
Permet de réactiver le compte d’un Parent suspendu
V
V(D)
---
---
PERM-ACC-012
Désactiver un compte utilisateur
Permet de désactiver définitivement un compte utilisateur
V
V(D)
---
---

Domaine SEC — Sécurité des accès (Authentification, sessions)
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-SEC-001
Réinitialiser son mot de passe
Permet de demander la réinitialisation de son propre mot de passe
C(O)
C(O)
C(O)
C(O)
PERM-SEC-002
Consulter son journal de connexions
Permet de consulter l’historique de ses propres connexions
L(O)
L(O)
L(O)
L(O)
PERM-SEC-003
Déconnecter un appareil
Permet de mettre fin à distance à une session ouverte sur un appareil non reconnu
S(O)
S(O)
S(O)
S(O)
PERM-SEC-004
Forcer la déconnexion d’un utilisateur
Permet d’invalider toutes les sessions actives d’un utilisateur (suspicion de compromission, fraude, demande du titulaire)
S
---
---
---
PERM-SEC-005
Activer l’authentification à deux facteurs (Version 2)
Permet d’activer la 2FA sur son propre compte
C(O)
C(O)
C(O)
---
PERM-SEC-006
Consulter les journaux de sécurité
Permet de consulter les journaux de connexion à des fins de sécurité ou d’audit
L
L(D)
---
---

Domaine TPR — Profil Professeur
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-TPR-001
Consulter un profil professeur
Permet de consulter les informations du profil d’un Professeur
L
L(D)
L(O)
L
PERM-TPR-002
Modifier son propre profil
Permet de modifier les informations de son propre profil
---
---
M(O)
---
PERM-TPR-003
Modifier les matières enseignées
Permet d’ajouter ou de supprimer des matières enseignées (*en attente de validation*)
---
---
M(O)*
---
PERM-TPR-004
Modifier les niveaux enseignés
Permet d’ajouter ou de supprimer des niveaux enseignés (*en attente de validation*)
---
---
M(O)*
---
PERM-TPR-005
Consulter le score de complétude
Permet de consulter le score de complétude du profil
L
L(D)
L(O)
---
PERM-TPR-006
Ajouter un lieu d’enseignement
Permet d’ajouter un nouveau lieu d’enseignement
---
---
C(O)
---
PERM-TPR-007
Modifier un lieu d’enseignement
Permet de modifier un lieu d’enseignement existant
---
---
M(O)
---
PERM-TPR-008
Supprimer un lieu d’enseignement
Permet de supprimer un lieu d’enseignement
---
---
S(O)
---

Domaine PAR — Profil Parent
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-PAR-001
Consulter un parent
Permet de consulter les informations du profil d’un Parent
L
L(D)
L*
L(O)
PERM-PAR-002
Modifier son propre profil
Permet de modifier les informations de son propre profil Parent
---
---
---
M(O)
PERM-PAR-003
Ajouter un enfant
Permet d’ajouter un enfant au profil Parent
---
---
---
C(O)
PERM-PAR-004
Modifier un enfant
Permet de modifier les informations d’un enfant
---
---
---
M(O)
PERM-PAR-005
Supprimer un enfant
Permet de supprimer un enfant du profil Parent (si aucun historique)
---
---
---
S(O)
PERM-PAR-006
Consulter le profil d’un enfant
Permet de consulter les informations du profil d’un enfant
L
L(D)
L*
L(O)
PERM-PAR-007
Modifier la situation scolaire d’un enfant
Permet de modifier la situation scolaire d’un enfant (niveau, établissement, classe scolaire)
---
---
---
M(O)

Domaine GRP — Groupes
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-GRP-001
Créer un groupe
Permet de créer un nouveau groupe
---
---
C(O)
---
PERM-GRP-002
Modifier un groupe
Permet de modifier les paramètres d’un groupe existant
---
---
M(O)
---
PERM-GRP-003
Clôturer un groupe
Permet de clôturer un groupe (fin d’année ou décision)
---
---
M(O)
---
PERM-GRP-004
Archiver un groupe
Permet d’archiver définitivement un groupe
---
---
M(O)
---
PERM-GRP-005
Consulter un groupe
Permet de consulter les informations d’un groupe
L
L
L(O)
L
PERM-GRP-006
Choisir la visibilité du groupe complet
Permet de choisir si le groupe reste visible lorsqu’il est complet
---
---
M(O)
---
PERM-GRP-007
Dupliquer un groupe
Permet de dupliquer un groupe existant (sans les élèves)
---
---
C(O)
---
PERM-GRP-008
Définir une période d’interruption
Permet de définir une période pendant laquelle aucune séance n’est générée
---
---
C(O)
---

Domaine PRE — Préinscriptions
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-PRE-001
Créer une préinscription
Permet de créer une préinscription pour une future année académique
---
---
---
C(O)
PERM-PRE-002
Consulter ses préinscriptions
Permet de consulter la liste de ses préinscriptions
L
L(D)
L(O)
L(O)
PERM-PRE-003
Consulter les préinscriptions reçues
Permet de consulter les préinscriptions reçues de Parents
L
L(D)
L(O)
---
PERM-PRE-004
Transformer une préinscription en demande
Permet de transformer une préinscription confirmée en demande d’inscription
---
---
V(O)
---
PERM-PRE-005
Annuler une préinscription
Permet d’annuler une préinscription
---
---
V(O)
V(O)
PERM-PRE-006
Ouvrir/fermer les préinscriptions
Permet d’activer ou de désactiver la période de préinscription
---
---
M(O)
---

Domaine INS — Inscriptions
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-INS-001
Demander une inscription
Permet de soumettre une demande d’inscription pour un enfant
---
---
---
C(O)
PERM-INS-002
Accepter une inscription
Permet d’accepter une demande d’inscription
---
---
V(O)
---
PERM-INS-003
Refuser une inscription
Permet de refuser une demande d’inscription
---
---
V(O)
---
PERM-INS-004
Modifier le tarif personnalisé
Permet de modifier le tarif personnalisé d’une inscription
---
---
M(O)
---
PERM-INS-005
Consulter le comportement de paiement
Permet de consulter le comportement de paiement du Parent
---
---
L(O)
---
PERM-INS-006
Suspendre une inscription
Permet de suspendre temporairement une inscription
---
---
M(O)
---
PERM-INS-007
Réactiver une inscription
Permet de réactiver une inscription suspendue
---
---
M(O)
---
PERM-INS-008
Archiver une inscription
Permet d’archiver définitivement une inscription
---
---
M(O)
---
PERM-INS-009
Consulter les inscriptions d’un groupe
Permet de consulter la liste des inscriptions d’un groupe
L
L
L(O)
L(O)

Domaine SES — Séances
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-SES-001
Créer une séance
Permet de créer une séance exceptionnelle
---
---
C(O)
---
PERM-SES-002
Modifier une séance future
Permet de modifier une séance future (horaire, lieu, etc.)
---
---
M(O)
---
PERM-SES-003
Annuler une séance
Permet d’annuler une séance planifiée
---
---
M(O)
---
PERM-SES-004
Passer une séance en ligne
Permet de transformer exceptionnellement une séance présentielle en séance en ligne
---
---
M(O)
---
PERM-SES-005
Accepter une séance en ligne
Permet d’accepter la participation à une séance en ligne exceptionnelle
---
---
---
V(O)
PERM-SES-006
Refuser une séance en ligne
Permet de refuser la participation à une séance en ligne exceptionnelle
---
---
---
V(O)
PERM-SES-007
Consulter les séances d’un groupe
Permet de consulter la liste des séances d’un groupe
L
L
L(O)
L(O)
PERM-SES-008
Consulter les séances d’une inscription
Permet de consulter la liste des séances d’une inscription
L
L
L(O)
L(O)

Domaine ATT — Présences
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-ATT-001
Saisir les présences
Permet de saisir les présences des élèves après une séance
---
---
C(O)
---
PERM-ATT-002
Corriger une présence (< 48h)
Permet de corriger une présence dans les 48 heures suivant la séance
---
---
M(O)
---
PERM-ATT-003
Consulter les présences
Permet de consulter les présences des élèves
L
L
L(O)
L(O)
PERM-ATT-004
Consulter le registre de présence
Permet de consulter le registre officiel de présence du groupe
L
L
L(O)
---
PERM-ATT-005
Exporter le registre de présence
Permet d’exporter le registre de présence (*offres payantes uniquement*)
L
L
L(O)*
---
PERM-ATT-006
Signaler une absence
Permet de signaler l’absence prévisible d’un enfant avant une séance
---
---
---
C(O)

Domaine CPT — Comptabilité
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-CPT-001
Enregistrer un paiement
Permet d’enregistrer un paiement reçu d’un Parent
---
---
C(O)
---
PERM-CPT-002
Corriger un paiement
Permet de corriger un paiement enregistré
---
---
M(O)
---
PERM-CPT-003
Consulter le compte de suivi comptable
Permet de consulter le compte de suivi comptable d’une inscription
L
L
L(O)
L(O)
PERM-CPT-004
Consulter le solde
Permet de consulter le solde d’une inscription
L
L
L(O)
L(O)
PERM-CPT-005
Consulter le comportement de paiement
Permet de consulter le comportement de paiement d’un Parent
L
L
L(O)
L(O)
PERM-CPT-006
Créer un ajustement comptable
Permet de créer un ajustement comptable pour corriger une erreur
---
---
M(O)
---

Domaine DSH — Tableaux de bord
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-DSH-001
Consulter le tableau de bord Super Admin
Permet de consulter le tableau de bord Super Admin (vue globale de la plateforme)
L
---
---
---
PERM-DSH-002
Consulter le tableau de bord Admin
Permet de consulter le tableau de bord Administrateur
L
L(O)
---
---
PERM-DSH-003
Consulter le tableau de bord Professeur
Permet de consulter son tableau de bord Professeur
---
---
L(O)
---
PERM-DSH-004
Consulter le tableau de bord Parent
Permet de consulter son tableau de bord Parent
---
---
---
L(O)

Domaine COM — Communication
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-COM-001
Créer un commentaire pédagogique
Permet de créer un commentaire pédagogique sur une inscription
---
---
C(O)
C(O)
PERM-COM-002
Modifier un commentaire
Permet de modifier un commentaire existant (dans les 48h, sans réponse)
---
---
M(O)
M(O)
PERM-COM-003
Supprimer un commentaire
Permet de supprimer un commentaire (logiquement, historiquement conservé)
---
---
S(O)
S(O)
PERM-COM-004
Consulter les commentaires d’une inscription
Permet de consulter tous les commentaires d’une inscription
L
L
L(O)
L(O)
PERM-COM-005
Publier une annonce de groupe
Permet de publier une annonce à destination des Parents d’un groupe
---
---
C(O)
---
PERM-COM-006
Modifier une annonce
Permet de modifier une annonce publiée
---
---
M(O)
---
PERM-COM-007
Supprimer une annonce
Permet de supprimer une annonce (logiquement, historiquement conservée)
---
---
S(O)
---
PERM-COM-008
Consulter les annonces d’un groupe
Permet de consulter les annonces d’un groupe
L
L
L(O)
L(O)
PERM-COM-009
Consulter les statistiques de lecture d’une annonce
Permet de consulter le nombre de Parents ayant lu l’annonce
L
L
L(O)
---

Domaine CHG — Changement de groupe
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-CHG-001
Demander un changement de groupe
Permet de demander un changement de groupe (temporaire ou définitif)
---
---
---
C(O)
PERM-CHG-002
Proposer un changement de groupe
Permet de proposer un changement de groupe à un Parent
---
---
C(O)
---
PERM-CHG-003
Accepter un changement de groupe
Permet d’accepter une demande de changement de groupe
---
---
V(O)
---
PERM-CHG-004
Refuser un changement de groupe
Permet de refuser une demande de changement de groupe
---
---
V(O)
---
PERM-CHG-005
Consulter les demandes de changement
Permet de consulter les demandes de changement de groupe
L
L
L(O)
L(O)

Domaine EXP — Exports
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-EXP-001
Exporter les données
Permet d’exporter des données (PDF, Excel, CSV) (*offres payantes uniquement*)
L
L(D)
L(O)*
---
PERM-EXP-002
Consulter le journal des exports
Permet de consulter l’historique des exports réalisés
L
L(D)
---
---


Domaine ABO — Gestion des abonnements
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-ABO-001
Souscrire un abonnement
Permet de souscrire un abonnement (offre Découverte, Intermédiaire ou Pro)
---
---
C(O)
---
PERM-ABO-002
Modifier un abonnement
Permet de modifier les paramètres d’un abonnement
---
---
M(O)
---
PERM-ABO-003
Changer d’offre
Permet de changer d’offre d’abonnement (montée ou descente)
---
---
M(O)
---
PERM-ABO-004
Consulter son abonnement
Permet de consulter les informations de son abonnement
L
L(D)
L(O)
---
PERM-ABO-005
Valider un paiement d’abonnement
Permet de valider manuellement un paiement d’abonnement (espèces en Version 1)
V
V(D)
---
---
PERM-ABO-006
Suspendre un abonnement
Permet de suspendre un abonnement pour non-paiement ou décision administrative
V
V(D)
---
---
PERM-ABO-007
Réactiver un abonnement
Permet de réactiver un abonnement suspendu après régularisation
V
V(D)
---
---
PERM-ABO-008
Souscrire un Add-on (Version 2)
Permet de souscrire une option complémentaire (Add-on)
---
---
C(O)
---

Domaine REF — Référentiels
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-REF-001
Créer un référentiel
Permet de créer un nouveau référentiel (matière, niveau, etc.)
C
C(D)
---
---
PERM-REF-002
Modifier un référentiel
Permet de modifier un référentiel existant
M
M(D)
---
---
PERM-REF-003
Supprimer un référentiel
Permet de supprimer un référentiel (uniquement s’il n’est pas utilisé)
S
S(D)
---
---
PERM-REF-004
Consulter un référentiel
Permet de consulter les données d’un référentiel
L
L
L
L
PERM-REF-005
Inactiver un référentiel
Permet de marquer un référentiel comme inactif (conservation historique)
M
M(D)
---
---
PERM-REF-006
Réactiver un référentiel
Permet de réactiver un référentiel inactif
M
M(D)
---
---
PERM-REF-007
Traiter une demande d’ajout d’établissement
Permet de traiter une demande d’ajout d’établissement scolaire
V
V(D)
---
---




Domaine NOT — Gestion des notifications
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-NOT-001
Consulter ses notifications
Permet de consulter la liste de ses notifications
L
L
L(O)
L(O)
PERM-NOT-002
Marquer une notification comme lue
Permet de marquer une notification comme lue
---
---
M(O)
M(O)
PERM-NOT-003
Archiver une notification
Permet d’archiver une notification
---
---
M(O)
M(O)
PERM-NOT-004
Consulter le centre d’activités
Permet de consulter le centre d’activités (historique des événements)
L
L
L(O)
L(O)

Domaine ROAD — Feuille de route et évolutions
Code
Permission
Description
Super Admin
Admin
Prof.
Parent
PERM-ROAD-001
Activer une fonctionnalité Version 2
Permet d’activer une fonctionnalité de la Version 2
V
V(D)
---
---
PERM-ROAD-002
Souscrire un Add-on
Permet de souscrire une option complémentaire
---
---
C(O)
---
PERM-ROAD-003
Valider un diplôme
Permet de valider le diplôme d’un Professeur
V
V(D)
---
---
PERM-ROAD-004
Gérer la liste d’attente
Permet de consulter et gérer la liste d’attente
---
---
L(O)
L(O)

Récapitulatif
Domaine
Libellé
Nb permissions
ACC
Comptes utilisateurs
12
SEC
Sécurité des accès (Authentification, sessions)
6
TPR
Profil Professeur
8
PAR
Profil Parent
7
GRP
Groupes
8
PRE
Préinscriptions
6
INS
Inscriptions
9
SES
Séances
8
ATT
Présences
6
CPT
Comptabilité
6
DSH
Tableaux de bord
4
COM
Communication
9
CHG
Changement de groupe
5
EXP
Exports
2
ABO
Gestion des abonnements
8
REF
Référentiels
7
NOT
Gestion des notifications
4
ROAD
Feuille de route et évolutions
4
Total : 119 permissions réparties sur 18 domaines.
Matrice de correspondance avec les règles métier
Domaine
Plage de règles métier correspondante
ACC
RM-ACC-001 à RM-ACC-021
SEC
RM-SEC-001 à RM-SEC-038
TPR
RM-TPR-001 à RM-TPR-015
PAR
RM-PAR-001 à RM-PAR-018
GRP
RM-GRP-001 à RM-GRP-046
PRE
RM-PRE-001 à RM-PRE-031
INS
RM-INS-001 à RM-INS-058
SES
RM-SES-001 à RM-SES-047
ATT
RM-ATT-001 à RM-ATT-032
CPT
RM-CPT-001 à RM-CPT-040
DSH
RM-DSH-001 à RM-DSH-013
COM
RM-COM-001 à RM-COM-020
CHG
RM-CHG-001 à RM-CHG-021
EXP
RM-EXP-001 à RM-EXP-015
ABO
RM-SUB-001 à RM-SUB-026, RM-ABO-001 à RM-ABO-009
REF
RM-REF-001 à RM-REF-013
NOT
RM-NOT-001 à RM-NOT-017
ROAD
RM-ROAD-001 à RM-ROAD-005

Matrice de correspondance avec les évènements métier
Domaine
Plage d’évènements métier correspondante
ACC
EVT-CYC-001 à EVT-CYC-011 (les évènements de cycle de vie du compte sont désormais rattachés au Chapitre 8 / domaine CYC)
SEC
EVT-SEC-001 à EVT-SEC-016
TPR
EVT-TPR-001 à EVT-TPR-007
PAR
EVT-PAR-001 à EVT-PAR-009
GRP
EVT-GRP-001 à EVT-GRP-015
PRE
EVT-PRE-001 à EVT-PRE-010
INS
EVT-INS-001 à EVT-INS-018
SES
EVT-SES-001 à EVT-SES-026
ATT
EVT-ATT-001 à EVT-ATT-018
CPT
EVT-CPT-001 à EVT-CPT-016
DSH
EVT-DSH-001 à EVT-DSH-007
COM
EVT-COM-001 à EVT-COM-008
CHG
EVT-CHG-001 à EVT-CHG-007
EXP
EVT-EXP-001 à EVT-EXP-009
ABO
EVT-SUB-001 à EVT-SUB-007, EVT-ABO-001 à EVT-ABO-006
REF
EVT-REF-001 à EVT-REF-005
NOT
EVT-NOT-001 à EVT-NOT-006
ROAD
EVT-ROAD-001 à EVT-ROAD-005






## Annexe J — Matrice CRUD
Cette matrice recense, pour chaque objet métier significatif de GROUPI, les opérations Create / Read / Update / Delete autorisées, leur(s) acteur(s), et les conditions ou nuances associées (suppression logique, conditionnelle, ou interdite).
Cet index constitue la synthèse consolidée des droits CRUD de GROUPI. Chaque chapitre reste la source de vérité normative ; cet index en est le reflet et doit être régénéré en cas de modification des chapitres.
Total : 27 objets métier répartis sur 10 groupes fonctionnels.
Comptes & sécurité
Objet métier (Chap.)
CREATE
READ
UPDATE
DELETE (logique)
User (Ch. 3, 8)
✅ (self, inscription)
✅ (self / Admin)
✅ (self / Admin : validation, suspension)
⚠ Conditionnelle — suppression physique si aucun historique métier, sinon anonymisation (Ch.8)
Role / Permission (Ch. 3)
✅ (Super Admin)
✅ (Admin / Super Admin)
✅ (Super Admin)
❌ Jamais si utilisée
AuditLog (Ch. 3, 8)
✅ Automatique uniquement
✅ (Admin / Super Admin selon droits)
❌
❌ Jamais
UserSession / LoginHistory (Ch. 9)
✅ Automatique (connexion)
✅ (self / Admin pour audit)
❌
✅ (self, déconnexion d’un appareil) / automatique à expiration
PasswordResetToken (Ch. 9)
✅ (self, demande de réinitialisation)
❌ (technique)
❌
✅ Automatique (usage unique / expiration)





Profils
Objet métier (Chap.)
CREATE
READ
UPDATE
DELETE (logique)
TeacherProfile (Ch. 5)
✅ (self)
✅ (self / public partiel / Admin)
✅ (self ; matière/niveau soumis à validation Admin)
❌ Suit le cycle de vie du User
ParentProfile (Ch. 6)
✅ (self)
✅ (self / Admin)
✅ (self)
❌ Suit le cycle de vie du User
Student (Ch. 6)
✅ (Parent)
✅ (Parent / Professeur si inscription active ou passée)
✅ (Parent)
Conditionnelle — archivage si historique, suppression sinon (Ch.6)
StudentSchoolSituation (Ch. 7)
✅ (Parent ; automatique ou soumis à validation Admin selon le cas)
✅ (Parent / Professeur si inscription / Admin)
❌ Jamais modifiée : une nouvelle situation est créée, l’ancienne est clôturée
❌ Jamais supprimée, historisée
Diploma (Ch. 5)
✅ (Professeur)
✅ (Professeur / Admin ; non public en V1)
✅ (Professeur)
✅ (Professeur ; dépôt facultatif, non vérifié)

Groupes & planning
Objet métier (Chap.)
CREATE
READ
UPDATE
DELETE (logique)
Group (Ch. 10)
✅ (Professeur)
✅ (Professeur / Parent selon visibilité)
✅ (Professeur ; matière/niveau/année verrouillés après 1ʳᵉ inscription)
Conditionnelle — suppression réelle si aucun historique, sinon clôture/archivage (Ch.10.13)
GroupSchedule (Ch. 10)
✅ (Professeur)
✅ (Professeur / Parent)
✅ (Professeur)
✅ (Professeur, créneau sans séance future)

Préinscriptions, inscriptions & transferts
Objet métier (Chap.)
CREATE
READ
UPDATE
DELETE (logique)
PreEnrollment (Ch. 11)
✅ (Parent)
✅ (Parent / Professeur / Admin)
✅ (Parent, tant qu’aucune proposition envoyée)
❌ Annulée ou clôturée, jamais supprimée
Enrollment (Ch. 12)
✅ (Parent, demande) → activation automatique après acceptation
✅ (Parent / Professeur concernés / Admin)
✅ (Professeur : décision, tarif, suspension)
❌ Jamais supprimée, historisée/archivée
GroupTransferRequest (Ch. 19, 20)
✅ (Parent ou Professeur)
✅ (Parent / Professeur concernés)
✅ (Professeur, décision)
❌ Historisée

Séances & présences
Objet métier (Chap.)
CREATE
READ
UPDATE
DELETE (logique)
Session (Ch. 13)
✅ (automatique / Professeur pour séance exceptionnelle)
✅ (Professeur / Parents du groupe)
✅ (Professeur, tant que non verrouillée)
Conditionnelle — suppression possible avant réalisation, sinon annulation ; jamais après verrouillage
Attendance (Ch. 14)
✅ (Professeur, à l’issue de la séance)
✅ (Professeur / Parent concernés)
✅ (Professeur, fenêtre de 48h)
❌ Jamais supprimée, verrouillée







Comptabilité
Objet métier (Chap.)
CREATE
READ
UPDATE
DELETE (logique)
AccountingAccount (Ch. 15)
✅ Automatique (activation de l’inscription)
✅ (Parent / Professeur concernés)
❌ Jamais modifié directement (seules ses écritures le sont)
❌ Jamais
AccountingEntry (Ch. 15)
✅ (Professeur : PAYMENT/ADJUSTMENT / automatique : SESSION / Admin : ADMIN_ADJUSTMENT)
✅ (Parent / Professeur concernés)
❌ Immuable
❌ Jamais ; correction via écriture inverse
Payment (Ch. 12, 15)
✅ (Professeur)
✅ (Parent / Professeur concernés)
✅ (Professeur, fenêtre autorisée)
Suppression logique (écriture inverse), jamais physique

Abonnements
Objet métier (Chap.)
CREATE
READ
UPDATE
DELETE (logique)
Subscription (Ch. 4, 21)
✅ (Professeur, souscription)
✅ (Professeur / Admin)
✅ (Admin : validation paiement / Professeur : changement d’offre)
❌ Jamais ; expire naturellement








Communication
Objet métier (Chap.)
CREATE
READ
UPDATE
DELETE (logique)
Comment (EnrollmentConversation) (Ch. 19)
✅ (Professeur / Parent)
✅ (Professeur / Parent concernés)
✅ (auteur, 48h et tant que sans réponse)
✅ (auteur, mêmes conditions) — suppression logique, historique conservé
GroupAnnouncement (Ch. 19)
✅ (Professeur)
✅ (Parents du groupe)
✅ (Professeur, tant que non lue par tous)
✅ (Professeur) — suppression logique, historique conservé
Notification (Ch. 18)
✅ Automatique
✅ (self)
✅ (self, marquer comme lue)
❌ Jamais ; archivée seulement

Exports
Objet métier (Chap.)
CREATE
READ
UPDATE
DELETE (logique)
ExportJob (Ch. 17)
✅ (Professeur / Parent / Admin selon droits)
✅ (auteur uniquement)
❌
✅ Automatique (après 7 jours)

Référentiels
Objet métier (Chap.)
CREATE
READ
UPDATE
DELETE (logique)
Subject / SchoolLevel / SubjectLevel / City / School (Ch. 23)
✅ (Admin, avec validation Super Admin) — proposition possible par le Parent pour School
✅ (tous)
✅ (Admin)
❌ Jamais ; inactivation à la place (upsert, Ch.23)
AcademicYear (Ch. 6, 7, 23)
✅ (Admin)
✅ (tous)
✅ (Admin : ouverture/clôture)
❌



AnnexeK — Matrice des dépendances fonctionnelles

L’idée est simple : chaque module indique de quels autres modules il dépend, et par quels modules il est utilisé en retour.
Cette matrice constitue la synthèse consolidée des dépendances fonctionnelles de GROUPI. Chaque chapitre reste la source de vérité normative ; cette matrice en est le reflet et doit être régénérée en cas de modification des chapitres.
Total : 19 modules fonctionnels.
Module
Chap.
Dépend de
Utilisé par
Acteurs
3
—
Tous les modules
Profils utilisateurs
5, 6
Acteurs
Groupes, Situation scolaire, Inscriptions, Sécurité des accès
Situation scolaire
7
Profils utilisateurs, Référentiels
Inscriptions, Groupes, Préinscriptions
Cycle de vie des comptes
8
Profils utilisateurs
Groupes, Inscriptions, Sécurité des accès
Sécurité des accès
9
Profils utilisateurs, Cycle de vie des comptes
Tous les modules
Groupes
10
Professeur validé, Référentiels, Abonnements, Préinscriptions
Inscriptions, Séances, Changement de groupe
Préinscriptions
11
Profils utilisateurs (Parent, Professeur), Référentiels
Groupes (recherche à la création), Inscriptions
Inscriptions
12
Groupes, Situation scolaire, Préinscriptions, Profils utilisateurs
Comptabilité, Présences, Changement de groupe, Communication
Séances
13
Groupes, Abonnements
Présences, Comptabilité
Présences
14
Séances, Inscriptions
Tableaux de bord, Comptabilité
Comptabilité (Moteur comptable)
15
Inscriptions, Séances, Présences
Tableaux de bord, Changement de groupe
Tableaux de bord
16
Tous les modules
—
Exports
17
Tous les modules, Abonnements
—
Notifications
18
Tous les modules
Tous les utilisateurs
Communication
19
Inscriptions, Groupes
Tableaux de bord Parent, Notifications
Changement de groupe
19, 20
Inscriptions, Groupes
Comptabilité, Préinscriptions (non affectées)
Abonnements
4, 21
Profils utilisateurs (Professeur)
Groupes, Séances, Exports, Gestion des droits, Tableaux de bord
Gestion des droits liés aux abonnements
22
Abonnements
Groupes, Séances, Exports, Tableaux de bord
Référentiels
23
—
Profils utilisateurs, Situation scolaire, Groupes, Préinscriptions


## Annexe L — Matrice de traçabilité

Cette matrice met en correspondance, pour chaque domaine fonctionnel, les plages de codes des règles métier (RM), des évènements (EVT), des cas d’erreur (ERR) et des notifications (NOT), avec le chapitre source qui fait foi.
Cette matrice constitue la synthèse consolidée de la traçabilité de GROUPI. Chaque chapitre reste la source de vérité normative ; cette matrice en est le reflet et doit être régénérée en cas de modification des chapitres.
Total : 27 domaines fonctionnels couverts.
Domaine (chapitre)
Règles métier
Évènements
Cas d’erreur
Notifications
Conventions de nommage (Ch.2)
RM-NAM-001 à 008
EVT-NAM-001 à 002
ERR-NAM-001 à 004
—
Acteurs (Ch.3)
RM-ACC-001 à 021
EVT-CYC-001 à 011 (rattachés au Ch.8, domaine CYC)
ERR-ACC-001 à 008
NOT-CYC-001 à 010 (idem)
Modèle économique (Ch.4)
RM-SUB-001 à 026
EVT-SUB-001 à 007
ERR-SUB-001 à 007
—
Profil Professeur (Ch.5)
RM-TPR-001 à 015
EVT-TPR-001 à 007
ERR-TPR-001 à 009
NOT-TPR-001 à 005
Profil Parent (Ch.6)
RM-PAR-001 à 018
EVT-PAR-001 à 009
ERR-PAR-001 à 009
NOT-PAR-001 à 011
Situation scolaire (Ch.7)
RM-SCH-001 à 020
EVT-SCH-001 à 008
ERR-SCH-001 à 010
NOT-SCH-001 à 009
Cycle de vie des comptes (Ch.8)
RM-CYC-001 à 033
EVT-CYC-001 à 011
ERR-CYC-001 à 008
NOT-CYC-001 à 010
Authentification, sessions et sécurité (Ch.9)
RM-SEC-001 à 038
EVT-SEC-001 à 016
ERR-SEC-001 à 014
NOT-SEC-001 à 012
Groupes (Ch.10)
RM-GRP-001 à 046
EVT-GRP-001 à 015
ERR-GRP-001 à 021
NOT-GRP-001 à 009
Préinscriptions (Ch.11)
RM-PRE-001 à 031
EVT-PRE-001 à 010
ERR-PRE-001 à 018
NOT-PRE-001 à 012
Inscriptions (Ch.12)
RM-INS-001 à 058
EVT-INS-001 à 018
ERR-INS-001 à 032
NOT-INS-001 à 016
Séances (Ch.13)
RM-SES-001 à 047
EVT-SES-001 à 026
ERR-SES-001 à 030
NOT-SES-001 à 018
Présences (Ch.14)
RM-ATT-001 à 032
EVT-ATT-001 à 018
ERR-ATT-001 à 022
NOT-ATT-001 à 019
Moteur comptable (Ch.15)
RM-CPT-001 à 040
EVT-CPT-001 à 016
ERR-CPT-001 à 011
NOT-CPT-001 à 015
Tableaux de bord (Ch.16)
RM-DSH-001 à 013
EVT-DSH-001 à 007
ERR-DSH-001 à 007
NOT-DSH-001 à 006
Exportation des données (Ch.17)
RM-EXP-001 à 015
EVT-EXP-001 à 009
ERR-EXP-001 à 008
NOT-EXP-001 à 006
Notifications et centre d’activités (Ch.18)
RM-NOT-001 à 017
EVT-NOT-001 à 006
ERR-NOT-001 à 007
—
Communication entre acteurs (Ch.19)
RM-COM-001 à 020
EVT-COM-001 à 008
ERR-COM-001 à 010
NOT-COM-001 à 006
Changement de groupe (Ch.20)
RM-CHG-001 à 021
EVT-CHG-001 à 007
ERR-CHG-001 à 013
NOT-CHG-001 à 009
Gestion des abonnements (Ch.21)
RM-ABO-001 à 009
EVT-ABO-001 à 006
ERR-ABO-001 à 006
NOT-ABO-001 à 007
Gestion des droits liés aux abonnements (Ch.22)
RM-PERM-001 à 010
EVT-PERM-001 à 005
ERR-PERM-001 à 006
NOT-PERM-001 à 004
Référentiels métier (Ch.23)
RM-REF-001 à 013
EVT-REF-001 à 005
ERR-REF-001 à 007
NOT-REF-001 à 006
Règles transversales (Ch.24)
RM-TRS-001 à 018
EVT-TRS-001 à 007 
ERR-TRS-001 à 004
—
Règles de calcul (Ch.25)
RM-CAL-001 à 015
EVT-CAL-001 à 002
ERR-CAL-001 à 003
—
Règles métier générales (Ch.26)
RM-GEN-001 à 021
EVT-GEN-001 à 005
ERR-GEN-001 à 004
—
Architecture métier (Ch.27)
RM-ARC-001 à 015
EVT-ARC-001 à 006
ERR-ARC-001 à 006
—
Feuille de route et évolutions (Ch.29)
RM-ROAD-001 à 005
EVT-ROAD-001 à 005
—
—


## Annexe M — Catalogue des cas d’erreur

Chaque cas d’erreur reçoit un identifiant unique (ERR-xxx). Il décrit une situation de blocage ou de refus prévue par les règles métier, ainsi que le résultat attendu par GROUPI dans cette situation.
Cet index constitue la synthèse consolidée de tous les cas d’erreur de GROUPI. Chaque chapitre reste la source de vérité normative ; cet index en est le reflet et doit être régénéré en cas de modification des chapitres.
Total : 281 cas d’erreur répartis sur 26 domaines.

Domaine NAM — Conventions de nommage
Code
Situation
Résultat attendu
Chap.
ERR-NAM-001
Création d’une nouvelle règle ne respectant pas la convention de nommage
Refus.
2
ERR-NAM-002
Utilisation d’un terme non officiel dans le référentiel
Correction demandée.
2
ERR-NAM-003
Création d’un code déjà utilisé (RM, EVT, CAL, ERR...)
Refus.
2
ERR-NAM-004
Déclaration d’une route API ne respectant pas les conventions REST
Refus.
2

Domaine ACC — Comptes et sécurité
Code
Situation
Résultat attendu
Chap.
ERR-ACC-001
Compte non validé
Accès aux fonctionnalités restreint
3
ERR-ACC-002
Permissions insuffisantes
Opération refusée
3
ERR-ACC-003
Compte suspendu
Accès refusé, invitation à contacter l’administration
3
ERR-ACC-004
Compte désactivé
Connexion impossible
3
ERR-ACC-005
Transition d’état interdite
Opération refusée
3
ERR-ACC-006
Tentative d’accès à un groupe dont le professeur propriétaire est désactivé
Les groupes concernés ne sont plus proposés aux nouvelles inscriptions
3
ERR-ACC-007
Tentative de validation d’un compte déjà validé
Les inscriptions existantes restent accessibles conformément aux règles métier
3
ERR-ACC-008
Tentative de création d’un second compte avec un identifiant (adresse e-mail ou numéro de téléphone) déjà utilisé
Opération refusée Création refusée
3
Domaine SUB — Abonnements
Code
Situation
Résultat attendu
Chap.
ERR-SUB-001
Capacité d’abonnement dépassée
Nouvelles inscriptions refusées
4
ERR-SUB-002
Paiement refusé
Abonnement non activé
4
ERR-SUB-003
Retour vers une offre incompatible
Changement refusé
4
ERR-SUB-004
Offre Découverte déjà utilisée
Nouvelle souscription refusée
4
ERR-SUB-005
Add-on incompatible avec l’offre active
Activation refusée (Version 2)
4
ERR-SUB-006
Tentative de souscription à deux abonnements actifs pour la même année académique
Opération refusée
4
ERR-SUB-007
Fin du délai de grâce
Accès restreint
4

Domaine TPR — Profil Professeur
Code
Situation
Résultat attendu
Chap.
ERR-TPR-001
Matière interdite pour ce niveau
Ajout refusé
5
ERR-TPR-002
Niveau incompatible avec les matières
Ajout refusé
5
ERR-TPR-003
Profil incomplet
Validation impossible
5
ERR-TPR-004
Modification en attente de validation
Opération différée
5
ERR-TPR-005
Professeur non validé
Création de groupe impossible
5
ERR-TPR-006
Abonnement expiré
Fonctionnalités restreintes
5
ERR-TPR-007
Suppression de la dernière matière du profil
Opération refusée
5
ERR-TPR-008
Suppression du dernier niveau du profil
Opération refusée
5
ERR-TPR-009
Tentative de création d’un groupe avec une matière ou un niveau en attente de validation
Création refusée
5

Domaine PAR — Profil Parent
Code
Situation
Résultat attendu
Chap.
ERR-PAR-001
Compte Parent non validé
Inscription impossible
6
ERR-PAR-002
Établissement inexistant
Sélection impossible
6
ERR-PAR-003
Profil enfant incomplet
Enregistrement refusé
6
ERR-PAR-004
Compte désactivé
Connexion impossible
6
ERR-PAR-005
Enfant déjà inscrit dans ce groupe
Nouvelle demande refusée
6
ERR-PAR-006
Demande d’établissement déjà soumise
Nouvelle demande refusée
6
ERR-PAR-007
Tentative de consultation des données d’un autre Parent
Accès refusé
6
ERR-PAR-008
Enfant déjà archivé
Archivage impossible
6
ERR-PAR-009
Demande d’inscription d’un enfant archivé
Opération refusée
6

Domaine SCH — Situation scolaire
Code
Situation
Résultat attendu
Chap.
ERR-SCH-001
Niveau scolaire obligatoire non renseigné
Enregistrement refusé
7
ERR-SCH-002
Établissement inexistant
Sélection impossible
7
ERR-SCH-003
Deux situations scolaires actives
Création refusée
7
ERR-SCH-004
Année académique invalide
Situation rejetée
7
ERR-SCH-005
Situation scolaire non active
Inscription impossible
7
ERR-SCH-006
Aucune situation active pour l’année académique
Inscription refusée
7
ERR-SCH-007
Situation scolaire en attente de validation
Modifications non prises en compte temporairement
7
ERR-SCH-008
Tentative de modification d’une situation clôturée
Modification refusée
7
ERR-SCH-009
Chevauchement de périodes entre deux situations scolaires
Création refusée
7
ERR-SCH-010
Situation scolaire déjà clôturée
Clôture refusée
7

Domaine CYC — Cycle de vie des comptes
Code
Situation
Résultat attendu
Chap.
ERR-CYC-001
Compte suspendu
Accès refusé
8
ERR-CYC-002
Compte désactivé
Connexion impossible
8
ERR-CYC-003
Compte non validé
Fonctionnalités restreintes
8
ERR-CYC-004
Transition d’état interdite
Opération refusée
8
ERR-CYC-005
Tentative de réactivation d’un compte archivé (Version 2)
Réactivation impossible
8
ERR-CYC-006
Tentative de suppression physique d’un compte possédant un historique
Suppression refusée. Procédure d’anonymisation proposée
8
ERR-CYC-007
Compte en attente de validation depuis plus de 30 jours
Notification automatique à l’Administrateur
8
ERR-CYC-008
Compte archivé - tentative de connexion (Version 2)
Connexion refusée
8

Domaine SEC — Sécurité des accès
Code
Situation
Résultat attendu
Chap.
ERR-SEC-001
Mot de passe incorrect
Authentification refusée
9
ERR-SEC-002
Compte verrouillé (trop d’échecs)
Authentification temporairement bloquée
9
ERR-SEC-003
Lien de réinitialisation expiré
Nouvelle demande requise
9
ERR-SEC-004
Session expirée
Réauthentification requise
9
ERR-SEC-005
Compte suspendu
Authentification refusée
9
ERR-SEC-006
Compte suspecté de partage
Suspension temporaire, demande de vérification
9
ERR-SEC-007
Lien de réinitialisation utilisé sur IP différente de la demande
Authentification renforcée requise
9
ERR-SEC-008
Trop de changements de mot de passe (attaque par fatigue)
Changement temporairement bloqué
9
ERR-SEC-009
Connexion depuis un pays non autorisé (si restriction géographique)
Connexion refusée
9
ERR-SEC-010
Compte non validé
Authentification autorisée mais fonctionnalités restreintes.
9
ERR-SEC-011
Session invalidée
Nouvelle authentification requise.
9
ERR-SEC-012
Adresse e-mail non vérifiée
Accès limité
9
ERR-SEC-013
Conditions d’utilisation non acceptées
Accès limité
9
ERR-SEC-014
Jeton d’authentification invalide
Nouvelle authentification requise
9


Domaine GRP — Groupes
Code
Situation
Résultat attendu
Chap.
ERR-GRP-001
Matière interdite pour ce niveau
Création refusée
10
ERR-GRP-002
Professeur non validé
Création impossible
10
ERR-GRP-003
Abonnement expiré
Création impossible
10
ERR-GRP-004
Nom déjà utilisé par le même professeur
Création refusée
10
ERR-GRP-005
Lieu d’enseignement inexistant
Sélection impossible
10
ERR-GRP-006
Capacité invalide (inférieure à 1)
Création refusée
10
ERR-GRP-007
Planning vide
Création refusée
10
ERR-GRP-008
Année académique fermée
Création impossible
10
ERR-GRP-009
Modification interdite après inscription
Opération refusée
10
ERR-GRP-010
Groupe archivé
Modification impossible
10
ERR-GRP-011
Duplication d’un groupe archivé
Opération refusée
10
ERR-GRP-012
Groupe complet
Nouvelles inscriptions refusées
10
ERR-GRP-013
Capacité du groupe > capacité d’abonnement
Création refusée
10
ERR-GRP-014
Conflit de planning avec un autre groupe du même Professeur
Avertissement
10
ERR-GRP-015
Tentative d’ajout d’un élève à un groupe complet (masqué)
Demande impossible
10
ERR-GRP-016
Suppression d’un créneau de planning avec des séances futures
Avertissement avant suppression
10
ERR-GRP-017
Modification de planning affectant des séances déjà planifiées
Option de conserver ou recréer les séances
10
ERR-GRP-018
Tentative de création d’un groupe par un Professeur suspendu
Création refusée
10
ERR-GRP-019
Groupe clôturé
Nouvelle inscription impossible.
10
ERR-GRP-020
Tentative de suppression d’un groupe possédant un historique
Suppression refusée.
10
ERR-GRP-021
Date de fin antérieure à la date de début
Création refusée
10


Domaine PRE — Préinscriptions
Code
Situation
Résultat attendu
Chap.
ERR-PRE-001
Préinscription déjà existante
Nouvelle demande refusée
11
ERR-PRE-002
Année académique invalide
Création refusée
11
ERR-PRE-003
Préinscriptions fermées
Nouvelle demande impossible
11
ERR-PRE-004
Groupe déjà complet lors de la confirmation
Transformation en demande refusée
11
ERR-PRE-005
Proposition expirée
Confirmation impossible
11
ERR-PRE-006
Période de préinscription non ouverte
Création refusée
11
ERR-PRE-007
Élève n’appartenant pas au Parent
Création refusée
11
ERR-PRE-008
Préinscription déjà clôturée
Modification impossible
11
ERR-PRE-009
Préinscription déjà transformée
opération impossible
11
ERR-PRE-010
Transformation impossible --- capacité d’abonnement insuffisante
Transformation refusée, Parent informé
11
ERR-PRE-011
Transformation impossible --- capacité du groupe insuffisante
Transformation refusée, Parent informé
11
ERR-PRE-012
Plusieurs préinscriptions pour le même Professeur/élève
Nouvelle demande refusée
11
ERR-PRE-013
Niveau scolaire incohérent avec la progression
Avertissement, création autorisée
11
ERR-PRE-014
Préinscription transformée --- tentative d’utilisation ultérieure
Opération refusée
11
ERR-PRE-015
Transformation impossible : groupe clôturé
Transformation refusée
11
ERR-PRE-016
Transformation impossible : groupe archivé
Transformation refusée
11
ERR-PRE-017
Préinscription déjà annulée
Opération impossible
11
ERR-PRE-018
Modification d’une préinscription après l’envoi d’une proposition
Modification refusée
11

Domaine INS — Inscriptions
Code
Situation
Résultat attendu
Chap.
ERR-INS-001
Groupe complet
Création de la demande refusée.
12
ERR-INS-002
Élève déjà inscrit dans ce groupe pour la même année académique
Création de la demande refusée.
12
ERR-INS-003
Groupe archivé
Création de la demande impossible.
12
ERR-INS-004
Parent non validé
Création de la demande refusée.
12
ERR-INS-005
Professeur suspendu ou inactif
Création de la demande impossible.
12
ERR-INS-006
Année académique clôturée
Création de la demande impossible.
12
ERR-INS-007
Groupe suspendu
Création de la demande impossible.
12
ERR-INS-008
Capacité de l’abonnement du Professeur atteinte
Création ou acceptation de la demande impossible.
12
ERR-INS-009
Demande d’inscription déjà existante pour le même élève et le même groupe
Nouvelle demande refusée.
12
ERR-INS-010
Élève archivé
Création de la demande impossible.
12
ERR-INS-011
Délai de réponse dépassé
La demande passe automatiquement à l’état **EXPIREE**.
12
ERR-INS-012
Changement de groupe impossible : nouveau groupe complet
Changement refusé.
12
ERR-INS-013
Changement de groupe impossible : capacité d’abonnement insuffisante
Changement refusé.
12
ERR-INS-014
Modification d’un tarif personnalisé après facturation des séances concernées
Modification refusée.
12
ERR-INS-015
Comportement de paiement du Parent évalué à « Mauvais »
Avertissement affiché au Professeur ; décision laissée à son appréciation.
12
ERR-INS-016
Inscriptions fermées pour ce groupe
Création de la demande impossible.
12
ERR-INS-017
Demande déjà traitée
Nouvelle décision impossible.
12
ERR-INS-018
Inscription archivée
Toute modification est interdite.
12
ERR-INS-019
Demande déjà annulée
Toute opération sur cette demande est refusée.
12
ERR-INS-020
Tentative de traitement d’une demande annulée
Acceptation ou refus impossible.
12
ERR-INS-021
Tentative de réactivation d’une inscription archivée
Réactivation impossible.
12
ERR-INS-022
Tentative de réactivation d’une inscription refusée
Réactivation impossible.
12
ERR-INS-023
Tentative de réactivation d’une inscription expirée
Réactivation impossible.
12
ERR-INS-024
Parent archivé
Création de la demande impossible.
12
ERR-INS-025
Élève supprimé ou archivé avant la décision du Professeur
La demande est automatiquement clôturée.
12
ERR-INS-026
Groupe fermé, suspendu ou archivé avant la décision du Professeur
Acceptation de la demande impossible.
12
ERR-INS-027
L’année académique du groupe est incompatible avec la situation scolaire active de l’élève
Création de la demande refusée.
12
ERR-INS-028
L’élève n’appartient pas au Parent connecté
Création de la demande refusée.
12
ERR-INS-029
Groupe supprimé avant le traitement de la demande
La demande est automatiquement clôturée.
12
ERR-INS-030
La capacité du groupe n’est plus disponible au moment de l’acceptation
Acceptation refusée, le Parent est informé.
12
ERR-INS-031
Groupe supprimé pendant le traitement de la demande
La demande est automatiquement clôturée et le Parent est informé.
12
ERR-INS-032
Inscription ACTIVE déjà existante pour le même élève, le même groupe et la même année académique
Création refusée.
12

Domaine SES — Séances
Code
Situation
Résultat attendu
Chap.
ERR-SES-001
Séance verrouillée
Modification refusée
13
ERR-SES-002
Groupe archivé
Ajout de séance impossible
13
ERR-SES-003
Année académique clôturée
Création refusée
13
ERR-SES-004
Séance déjà existante sur le même créneau
Création refusée
13
ERR-SES-005
Créneau en dehors de la période du groupe
Création refusée
13
ERR-SES-006
Séance située dans une période d’interruption
Création refusée
13
ERR-SES-007
Séance planifiée déjà réalisée
Annulation impossible
13
ERR-SES-008
Période d’interruption en cours
Modification de planning impossible
13
ERR-SES-009
Conflit de planning avec une autre séance du Professeur
Avertissement, création autorisée
13
ERR-SES-010
Séance reportée sur une date en période d’interruption
Report refusé
13
ERR-SES-011
Abonnement expiré --- génération de séance
Génération suspendue
13
ERR-SES-012
Tentative de modification d’une séance verrouillée
Modification refusée
13
ERR-SES-013
Séance sans élève inscrit
Création autorisée avec avertissement
13
ERR-SES-014
Tentative de report d’une séance verrouillée
Report refusé.
13
ERR-SES-015
Tentative de suppression d’une séance verrouillée
Suppression impossible.
13
ERR-SES-016
Séance déjà annulée
Nouvelle annulation impossible.
13
ERR-SES-017
Séance déjà reportée vers une autre séance
Nouvelle opération refusée.
13
ERR-SES-018
Présences déjà verrouillées
Modification impossible.
13
ERR-SES-019
Mode d’enseignement identique
Aucune modification effectuée.
13
ERR-SES-020
Date de report antérieure à aujourd’hui
Report refusé.
13
ERR-SES-021
Professeur suspendu
Création ou modification refusée.
13
ERR-SES-022
Séance en dehors de l’année académique
Création refusée.
13
ERR-SES-023
Séance appartenant à un groupe fermé
Création impossible.
13
ERR-SES-024
Séance appartenant à un groupe sans planning
Génération impossible.
13
ERR-SES-025
Tentative de saisie des présences avant la date de la séance
Saisie refusée.
13
ERR-SES-026
Tentative de saisie des présences pour une séance annulée
Saisie refusée.
13
ERR-SES-027
Tentative de génération d’une séance en doublon
Génération ignorée.
13
ERR-SES-028
Tentative de création d’une séance sans Professeur actif
Création refusée.
13
ERR-SES-029
Tentative de report sur un créneau déjà occupé
Report refusé.
13
ERR-SES-030
Tentative de suppression d’une séance ayant déjà généré des écritures comptables
Suppression refusée.
13



Domaine ATT — Présences
Code
Situation
Résultat attendu
Chap.
ERR-ATT-001
Présence verrouillée
Modification refusée
14
ERR-ATT-002
Élève non inscrit au groupe
Saisie impossible
14
ERR-ATT-003
Séance annulée
Saisie impossible
14
ERR-ATT-004
Séance non encore commencée
Validation refusée
14
ERR-ATT-005
Présence déjà validée
Nouvelle validation impossible.
14
ERR-ATT-006
Présence hors délai de modification
Correction refusée
14
ERR-ATT-007
Signalement d’absence après le début de la séance
Signalement accepté mais statut laissé à la discrétion du Professeur
14
ERR-ATT-008
Tentative de modification après verrouillage
Modification refusée, ajustement administratif requis
14
ERR-ATT-009
Double saisie pour le même élève/séance
Seconde saisie refusée
14
ERR-ATT-010
Séance en ligne --- absence de connexion
L’élève peut être marqué comme absent
14
ERR-ATT-011
Tentative de saisie par un autre Professeur
Saisie refusée.
14
ERR-ATT-012
Inscription suspendue
Présence impossible.
14
ERR-ATT-013
Inscription archivée
Présence impossible.
14
ERR-ATT-014
Séance verrouillée
Nouvelle saisie impossible.
14
ERR-ATT-015
Statut de présence invalide
Enregistrement refusé.
14
ERR-ATT-016
Retard négatif
Enregistrement refusé.
14
ERR-ATT-017
Retard supérieur à la durée de la séance
Enregistrement refusé.
14
ERR-ATT-018
Présence enregistrée après clôture administrative de l’année académique
Modification refusée.
14
ERR-ATT-019
Signalement d’absence effectué pour une séance annulée
Signalement refusé.
14
ERR-ATT-020
Présence inexistante
Modification impossible.
14
ERR-ATT-021
Aucun statut sélectionné
Validation impossible.
14
ERR-ATT-022
Retard non renseigné (si le statut = Retard)
Enregistrement refusé.
14


Domaine CPT — Comptabilité
Code
Situation
Résultat attendu
Chap.
ERR-CPT-001
Paiement négatif
Enregistrement refusé
15
ERR-CPT-002
Paiement sur inscription archivée
Enregistrement refusé
15
ERR-CPT-003
Écriture verrouillée
Modification refusée
15
ERR-CPT-004
Ajustement hors délai
Création refusée
15
ERR-CPT-005
Paiement supérieur au montant autorisé
Avertissement ou refus
15
ERR-CPT-006
Inscription inexistante
Opération refusée
15
ERR-CPT-007
Solde débiteur supérieur au seuil d’alerte
Avertissement au Parent et au Professeur
15
ERR-CPT-008
Modification d’écriture sur compte verrouillé
Modification refusée
15
ERR-CPT-009
Paiement sans inscription active
Enregistrement refusé
15
ERR-CPT-010
Ajustement comptable sans justification
Opération refusée
15
ERR-CPT-011
Écriture déjà générée pour cette séance.
Opération refusée
15

Domaine DSH — Tableaux de bord
Code
Situation
Résultat attendu
Chap.
ERR-DSH-001
Utilisateur non authentifié
Accès refusé
16
ERR-DSH-002
Permission insuffisante
Informations masquées
16
ERR-DSH-003
Tableau indisponible
Message d’information
16
ERR-DSH-004
Données en cours d’actualisation
Dernière version disponible affichée
16
ERR-DSH-005
Tentative d’accès à un tableau de bord sans autorisation
Accès refusé
16
ERR-DSH-006
Données de tableau de bord non disponibles
Message d’attente
16
ERR-DSH-007
Signalement d’absence hors délai
Signalement refusé
16




Domaine EXP — Exports
Code
Situation
Résultat attendu
Chap.
ERR-EXP-001
Abonnement ne permettant pas l’export
Export refusé
17
ERR-EXP-002
Aucune donnée correspondant aux critères
Export vide ou message d’information
17
ERR-EXP-003
Format de fichier non disponible
Export refusé
17
ERR-EXP-004
Utilisateur non autorisé
Export refusé
17
ERR-EXP-005
Volume de données excessif
Export asynchrone avec notification
17
ERR-EXP-006
Lien de téléchargement expiré
Téléchargement refusé
17
ERR-EXP-007
Export déjà supprimé
Fichier indisponible
17
ERR-EXP-008
Export en cours de génération
Téléchargement impossible
17

Domaine NOT — Notifications et centre d’activités
Code
Situation
Résultat attendu
Chap.
ERR-NOT-001
Utilisateur inexistant
Notification non créée
18
ERR-NOT-002
Adresse e-mail invalide
Échec d’envoi enregistré
18
ERR-NOT-003
Canal indisponible
Notification conservée dans le centre d’activités
18
ERR-NOT-004
Événement déjà notifié
Aucun doublon envoyé
18
ERR-NOT-005
Taux d’échec d’envoi de notification élevé
Alerte Administrateur
18
ERR-NOT-006
Préférences de notification invalides (Version 2)
Modification refusée
18
ERR-NOT-007
Envoi hors des plages horaires configurées
Envoi différé
18

Domaine COM — Communication
Code
Situation
Résultat attendu
Chap.
ERR-COM-001
Utilisateur non autorisé
Accès refusé
19
ERR-COM-002
Inscription terminée ou archivée
Nouveau commentaire impossible
19
ERR-COM-003
Groupe archivé
Annonce impossible
19
ERR-COM-004
Commentaire figé
Modification refusée
19
ERR-COM-005
Annonce expirée
Modification interdite
19
ERR-COM-006
Tentative de consultation d’un fil de commentaires sans autorisation
Accès refusé
19
ERR-COM-007
Annonce programmée sans date de publication
Publication refusée
19
ERR-COM-008
Pièce jointe non autorisée (Version 2)
Téléversement refusé
19
ERR-COM-009
Taille de pièce jointe excessive (Version 2)
Téléversement refusé
19
ERR-COM-010
Nombre de messages de contact avant inscription dépassé (Version 2)
Message refusé
19

Domaine CHG — Changement de groupe
Code
Situation
Résultat attendu
Chap.
ERR-CHG-001
Groupe de destination complet
Changement refusé
20
ERR-CHG-002
Groupe archivé
Changement impossible
20
ERR-CHG-003
Changement déjà en attente
Nouvelle demande refusée
20
ERR-CHG-004
Date de début invalide
Validation refusée
20
ERR-CHG-005
Élève déjà présent dans le groupe cible
Changement refusé
20
ERR-CHG-006
Groupe de destination suspendu
Changement refusé
20
ERR-CHG-007
Élève avec solde débiteur dans l’ancien groupe
Changement autorisé avec avertissement
20
ERR-CHG-008
Changement entre Professeurs différents
Changement refusé
20
ERR-CHG-009
Date d’effet antérieure à la date du jour
Date invalide
20
ERR-CHG-010
Élève avec solde débiteur important
Changement autorisé avec avertissement
20
ERR-CHG-011
Nombre de changements excessif (alerte)
Avertissement, changement autorisé
20
ERR-CHG-012
Annulation de changement hors délai
Annulation refusée
20
ERR-CHG-013
Changement temporaire demandé sur une séance déjà réalisée
Changement refusé
20

Domaine ABO — Gestion des abonnements
Code
Situation
Résultat attendu
Chap.
ERR-ABO-001
Tentative d’opération avec un abonnement expiré
Opération refusée
21
ERR-ABO-002
Tentative d’accès à une fonctionnalité non incluse
Accès refusé avec proposition de mise à niveau
21
ERR-ABO-003
Souscription pour une année académique déjà clôturée
Souscription refusée
21
ERR-ABO-004
Réactivation sans abonnement valide
Réactivation impossible
21
ERR-ABO-005
Deuxième abonnement demandé pour la même année
Création refusée
21
ERR-ABO-006
Add-on incompatible avec l’offre active (Version 2)
Activation refusée
21

Domaine PERM — Droits liés aux abonnements
Code
Situation
Résultat attendu
Chap.
ERR-PERM-001
Aucun abonnement actif
Fonction refusée
22
ERR-PERM-002
Fonctionnalité non incluse
Fonction refusée avec proposition de mise à niveau
22
ERR-PERM-003
Abonnement suspendu
Fonction refusée
22
ERR-PERM-004
Module complémentaire absent
Fonction refusée
22
ERR-PERM-005
Tentative d’utilisation d’un Add-on non souscrit (Version 2)
Fonction refusée avec proposition
22
ERR-PERM-006
Abonnement en délai de grâce --- fonction de modification
Autorisée (temporairement)
22

Domaine REF — Référentiels
Code
Situation
Résultat attendu
Chap.
ERR-REF-001
Référentiel inexistant
Sélection impossible
23
ERR-REF-002
Donnée de référence déjà utilisée dans des historiques
Suppression interdite
23
ERR-REF-003
Duplication de donnée de référence
Création refusée
23
ERR-REF-004
Référentiel inactif
Utilisation impossible pour les nouvelles créations
23
ERR-REF-005
Établissement scolaire déjà existant
Ajout refusé
23
ERR-REF-006
Tentative de suppression d’un référentiel utilisé par des données actives
Suppression refusée
23
ERR-REF-007
Tentative de modification d’un référentiel sans autorisation
Opération refusée
23

Domaine TRS — Règles transversales
Code
Situation
Résultat attendu
Chap.
ERR-TRS-001
Modification d’une donnée verrouillée
Refus.
24
ERR-TRS-002
Suppression physique interdite
Refus.
24
ERR-TRS-003
Création d’une donnée sur une année académique clôturée
Refus.
24
ERR-TRS-004
Tentative d’accès à une donnée non autorisée
Accès refusé.
24

Domaine CAL — Règles de calcul
Code
Situation
Résultat attendu
Chap.
ERR-CAL-001
Division par zéro
Le résultat est fixé à la valeur neutre définie pour l’indicateur (0 %, 0 TND ou calcul impossible).
25
ERR-CAL-002
Données incomplètes
Calcul impossible, résultat non disponible.
25
ERR-CAL-003
Référence métier absente
Calcul refusé.
25

Domaine GEN — Règles métier générales
Code
Situation
Résultat attendu
Chap.
ERR-GEN-001
Opération interdite par une règle métier
Refus avec message explicite.
26
ERR-GEN-002
Modification d’un objet verrouillé
Modification refusée.
26
ERR-GEN-003
Accès à une ressource non autorisée
Accès refusé.
26
ERR-GEN-004
Violation d’une règle d’intégrité
Transaction annulée.
26



Domaine ARC — Architecture métier
Code
Situation
Résultat attendu
Chap.
ERR-ARC-001
Domaine indisponible
Opération différée ou refusée
27
ERR-ARC-002
Evènement métier invalide
Événement rejeté
27
ERR-ARC-003
Dépendance circulaire détectée
Refus de l’opération
27
ERR-ARC-004
Accès direct à un domaine interdit
Refus
27
ERR-ARC-005
API incompatible
Refus de la requête
27
ERR-ARC-006
Version d’événement inconnue
Événement ignoré et journalisé
27



## Annexe N — Catalogue des cas limite (Edge cases)

Cette annexe recense des situations particulières, rares ou à la frontière entre plusieurs règles métier, afin de garantir que leur traitement par GROUPI est explicite et cohérent avec le reste du référentiel.
Cette annexe constitue une synthèse illustrative. Les chapitres et les codes cités restent la source de vérité normative ; cette annexe doit être régénérée en cas de modification des chapitres concernés.
Total : 10 cas limite documentés.
Cas limite
Description
Impact / Traitement
Références
Groupe complet
Un Parent demande une inscription alors que le groupe est complet.
Demande refusée.
ERR-GRP-012 ; liste d’attente prévue en Version 2 (NOT-GRP-006).
Double demande
Un Parent demande deux fois l’inscription du même enfant dans le même groupe.
Demande refusée.
ERR-INS-002, ERR-INS-009, ERR-INS-032.
Changement d’avis du Professeur
Un Professeur accepte une inscription puis souhaite l’annuler.
L’historique est conservé ; l’inscription est suspendue plutôt que supprimée.
Suspension manuelle de l’inscription par le Professeur (EVT-INS-005) ; RM-INS-034, RM-INS-042.
Élève absent sur toute la période
Un élève ne participe jamais aux séances de son groupe.
Le seuil d’abandon est atteint, une alerte est générée ; la décision (maintien, suspension, clôture) revient au Professeur.
RM-ATT-013, RM-ATT-014 ; NOT-ATT-006.
Élève change de niveau en cours d’année
L’élève change de niveau ou d’établissement scolaire en cours d’année académique.
Une nouvelle situation scolaire est créée et soumise à validation ; l’ancienne est clôturée mais conservée ; les inscriptions en cours restent rattachées à l’ancienne situation.
RM-SCH-004, RM-SCH-010, RM-SCH-012 (Ch.7).
Professeur change de lieu d’enseignement en cours d’année
Le Professeur modifie le ou les lieux d’enseignement d’un groupe existant.
Les séances futures reflètent le nouveau lieu ; les Parents concernés sont notifiés ; les séances déjà réalisées ne sont jamais modifiées.
RM-GRP-010 (Ch.10) ; NOT-GRP-003 ; EVT-GRP-005.
Inscription demandée pour une année académique pas encore ouverte
Un Parent tente une inscription pour une année académique future, non encore ouverte par le Professeur.
Création de la demande impossible.
⚠ Aucun code ERR dédié à ce cas précis n’existe actuellement (ERR-INS-006 couvre le cas inverse : année académique déjà clôturée). Règle applicable : RM-INS-037 (une inscription ne peut être créée que pour un groupe appartenant à une année académique ouverte). Un code ERR-INS dédié à ce cas devrait être ajouté au Chapitre 12.
Paiement en trop
Le Parent règle un montant supérieur au solde dû.
Le compte de suivi comptable devient créditeur ; l’excédent constitue une avance pour les séances futures.
NOT-CPT-006 (Solde créditeur important) ; RM-CPT-006 (calcul du solde).
Compte Parent désactivé alors que l’enfant reste inscrit
Le compte du Parent est désactivé, mais son enfant conserve des inscriptions actives.
Les profils des enfants et leurs historiques restent conservés et accessibles pour la gestion pédagogique en cours ; le Parent lui-même perd l’accès jusqu’à réactivation.
RM-PAR-017 (Ch.6) ; RM-CYC-012 (Ch.8).
Professeur suspendu alors que des élèves restent inscrits
Le compte du Professeur est suspendu, mais ses groupes conservent des inscriptions actives.
Aucune nouvelle opération (inscription, séance, modification) n’est autorisée ; les inscriptions existantes restent suspendues jusqu’à réactivation du compte.
ERR-INS-005 ; EVT-INS-013 (suspension automatique des inscriptions) ; RM-INS-042, RM-INS-052.



## Annexe O — Diagrammes
Cette annexe présente les principaux diagrammes fonctionnels de GROUPI. Chaque diagramme est accompagné d’une description synthétique et du code PlantUML permettant sa génération. Ces diagrammes illustrent les cas d’utilisation, les processus métier clés, les cycles de vie des objets principaux et l’architecture métier.
1 Diagramme des cas d’utilisation
Ce diagramme présente les grandes fonctionnalités de GROUPI par acteur. Il met en évidence les actions réalisables par le Super Administrateur, l’Administrateur, le Professeur, le Parent et le Système, ainsi que les périmètres fonctionnels de chacun.

2 Processus d’inscription
Ce diagramme détaille le déroulement d’une demande d’inscription, depuis la recherche par le Parent jusqu’à l’acceptation par le Professeur, en passant par les vérifications automatiques et la création du compte de suivi comptable.




3 Processus de changement de groupe
Ce diagramme illustre les deux types de changement de groupe (temporaire et définitif), depuis la demande jusqu’à son application, en passant par la validation du Professeur et les impacts pédagogiques et comptables.


4 Compte utilisateur
Ce diagramme présente les états possibles d’un compte utilisateur (PENDING_VALIDATION, ACTIVE, SUSPENDED, DISABLED, ARCHIVED) et les transitions autorisées, telles que définies au Chapitre 8.


5 Inscription
Ce diagramme décrit les états d’une inscription (EN_ATTENTE, ACTIVE, SUSPENDUE, REFUSEE, EXPIREE, ANNULEE, ARCHIVEE) et les transitions autorisées, conformément au Chapitre 12.


6 Séance
Ce diagramme présente le cycle de vie d’une séance : PLANIFIEE, EN_COURS, TERMINEE, ANNULEE, VERROUILLEE. Il reflète les règles du Chapitre 13.


7 Groupe
Ce diagramme décrit les états d’un groupe (BROUILLON, OUVERT, COMPLET, CLOTURE, ARCHIVE) et les transitions autorisées, telles que définies au Chapitre 10.


8 Diagramme de classes métier (conceptuel)
Ce diagramme présente les principales entités métier de GROUPI et leurs relations (héritages, associations, compositions). Il est centré sur les objets clés : Utilisateur, Profils, Élève, Groupe, Inscription, Séance, Présence, Comptabilité, Abonnement, etc.


9 Génération des séances
Ce diagramme montre comment GROUPI génère automatiquement les séances à partir du planning hebdomadaire d’un groupe, en tenant compte des périodes d’interruption, de la capacité et de l’abonnement du Professeur.


10 Workflow comptable
Ce diagramme d’activités décrit le processus comptable d’une inscription, depuis la saisie des présences jusqu’à l’enregistrement des paiements, la génération des écritures, le calcul du solde et les ajustements éventuels.


11 Notification
Ce diagramme illustre le processus de génération et d’envoi d’une notification, depuis l’émission d’un évènement métier jusqu’à la réception par l’utilisateur via le centre d’activités et éventuellement par email.











## Annexe P — Dictionnaire des objets métier

Cette annexe décrit, pour chaque objet métier de GROUPI, ses attributs principaux, ses relations avec les autres objets, ainsi que les règles métier et évènements qui lui sont associés.
Cette annexe constitue la synthèse consolidée des objets métier de GROUPI. Chaque chapitre reste la source de vérité normative ; cette annexe en est le reflet et doit être régénérée en cas de modification des chapitres.
Total : 30 objets métier.
Abonnement (Subscription)
Description : Contrat liant un Professeur à GROUPI et lui donnant accès à un ensemble de fonctionnalités pendant une période déterminée. L’abonnement est personnel, non transférable et rattaché à une année académique.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
teacherId
UUID
Obligatoire
Référence vers TeacherProfile
plan
SubscriptionPlan
Obligatoire
Plan souscrit (Découverte, Intermédiaire, Pro)
status
SubscriptionStatus
Obligatoire
PENDING_PAYMENT, ACTIVE, EXPIRED, SUSPENDED, CANCELLED
academicYearId
UUID
Obligatoire
Référence vers AcademicYear
startDate
Date
Obligatoire
Date de début
endDate
Date
Obligatoire
Date de fin (expiration auto en fin d\’année)
paidAt
DateTime
Optionnel
Date de paiement
paymentMethod
PaymentMethod
Optionnel
Mode de paiement
Relations :
Appartient à un TeacherProfile
Définit les fonctionnalités disponibles via le Plan
Peut être complété par des Add-ons (Version 2)
Règles métier : RM-SUB-001 à RM-SUB-026
Evènements métier : EVT-SUB-001 à EVT-SUB-007


Activité (Activity)
Description : Événement enregistré dans le centre d’activités d’un utilisateur. Une activité est créée automatiquement par GROUPI à la suite de toute opération importante.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
userId
UUID
Obligatoire
Référence vers User
type
ActivityType
Obligatoire
Type d\’événement
priority
Priority
Obligatoire
INFORMATION, IMPORTANT, CRITIQUE
title
String
Obligatoire
Titre de l\’activité
content
String
Obligatoire
Contenu
readAt
DateTime
Optionnel
Date de lecture
metadata
JSON
Optionnel
Données contextuelles (lien vers objet métier)
createdAt
DateTime
Obligatoire
Date de création
Relations :
Appartient à un User
Peut être liée à un objet métier (Enrollment, Payment, Session,
Règles métier : RM-NOT-001 à RM-NOT-017
Evènements métier : EVT-NOT-001, EVT-NOT-003, EVT-NOT-005

Administrateur (Administrator)
Description : Utilisateur disposant d’autorisations de gestion accordées par le Super Administrateur. Les autorisations sont configurables individuellement.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique (hérité de User)
permissions
Permission\[\]
Obligatoire
Liste des permissions accordées
createdBy
UUID
Obligatoire
Super Administrateur créateur
disabledAt
DateTime
Optionnel
Date de désactivation
Relations :
Hérite de User
Délégation du Super Administrateur
Règles métier : RM-ACC-013
Evènements métier :  EVT-CYC-006 
Année académique (AcademicYear)
Description : Période scolaire de référence utilisée par GROUPI pour regrouper l’ensemble des données pédagogiques, comptables et statistiques.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
label
String
Obligatoire, Unique
Libellé (ex: \"2026-2027\")
startDate
Date
Obligatoire
Date de début
endDate
Date
Obligatoire
Date de fin
status
AcademicYearStatus
Obligatoire
OPEN, CLOSED
Relations :
Référencée par les Groupes, Inscriptions, Séances, Abonnements et
Règles métier : RM-TRS-002, RM-TRS-003
Evènements métier : EVT-SCH-004

Annonce de groupe (GroupAnnouncement)
Description : Message collectif publié par un Professeur à destination de tous les Parents d’un groupe. Les annonces sont exclusivement unidirectionnelles.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
groupId
UUID
Obligatoire
Référence vers Group
teacherId
UUID
Obligatoire
Référence vers TeacherProfile
title
String
Obligatoire
Titre
content
String
Obligatoire
Contenu
status
AnnouncementStatus
Obligatoire
DRAFT, PUBLISHED, EXPIRED
publishedAt
DateTime
Optionnel
Date de publication
expiresAt
DateTime
Optionnel
Date d\’expiration
readCount
Number
Calculé
Nombre de Parents ayant lu
Relations :
Appartient à un Groupe
Visible par les Parents du groupe
Règles métier : RM-COM-009 à RM-COM-020
Evènements métier : EVT-COM-004, EVT-COM-005, EVT-COM-006


AuditLog
Description : Journal d’audit enregistrant toutes les opérations importantes réalisées dans GROUPI.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
userId
UUID
Optionnel
Utilisateur ayant réalisé l\’opération
action
String
Obligatoire
Type d\’opération
targetType
String
Obligatoire
Type d\’objet métier concerné
targetId
UUID
Obligatoire
Identifiant de l\’objet concerné
oldValues
JSON
Optionnel
Anciennes valeurs
newValues
JSON
Optionnel
Nouvelles valeurs
metadata
JSON
Optionnel
Données contextuelles
ipAddress
String
Optionnel
Adresse IP
userAgent
String
Optionnel
Navigateur
createdAt
DateTime
Obligatoire
Date et heure
Relations :
Associé à un User
Peut être lié à un objet métier
Règles métier : RM-TRS-007

Chiffre d\’affaires (Revenue)
Description : Indicateur financier calculé automatiquement par GROUPI à partir des paiements enregistrés et des séances facturées.
Attribut
Type
Contrainte
Description
teacherId
UUID
Obligatoire
Référence vers TeacherProfile
period
Period
Obligatoire
Période de calcul
forecast
Decimal
Calculé
CA prévisionnel
realized
Decimal
Calculé
CA réalisé
collected
Decimal
Calculé
CA encaissé
calculatedAt
DateTime
Obligatoire
Date de calcul
Relations :
Calculé à partir des Inscriptions, Séances et Paiements
Règles métier : RM-CPT-014 à RM-CPT-040

Commentaire (Comment)
Description : Observation rédigée par le Professeur ou le Parent concernant un élève dans le cadre d’une inscription.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
enrollmentId
UUID
Obligatoire
Référence vers Enrollment
authorId
UUID
Obligatoire
Référence vers User
content
String
Obligatoire
Contenu
status
CommentStatus
Obligatoire
PUBLISHED, MODIFIED, DELETED
parentId
UUID
Optionnel
Référence vers un commentaire parent (réponse)
createdAt
DateTime
Obligatoire
Date de création
updatedAt
DateTime
Optionnel
Date de modification
Relations :
Appartient à une Inscription
Rédigé par un Utilisateur
Règles métier : RM-COM-001 à RM-COM-020
Evènements métier : EVT-COM-001, EVT-COM-002, EVT-COM-003

Compte de suivi comptable (AccountingAccount)
Description : Registre des écritures financières associé à une inscription. Créé automatiquement lors de l’activation d’une inscription.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
enrollmentId
UUID
Obligatoire, Unique
Référence vers Enrollment
balance
Decimal
Calculé
Solde calculé automatiquement
createdAt
DateTime
Obligatoire
Date de création
Relations :
Appartient à une Inscription
Contient des Écritures comptables
Règles métier : RM-CPT-001 à RM-CPT-040
Evènements métier : EVT-CPT-001, EVT-CPT-005

Écriture comptable (AccountingEntry)
Description : Mouvement enregistré dans le compte de suivi comptable d’une inscription. Une écriture est soit un crédit, soit un débit.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
accountId
UUID
Obligatoire
Référence vers AccountingAccount
type
EntryType
Obligatoire
PAYMENT, SESSION, ADJUSTMENT
amount
Decimal
Obligatoire
Montant (positif = crédit, négatif = débit)
referenceId
UUID
Optionnel
Référence vers l\’objet source (Session, Payment)
authorId
UUID
Obligatoire
Auteur de l\’écriture
description
String
Optionnel
Description
createdAt
DateTime
Obligatoire
Date de création
Relations :
Appartient à un Compte de suivi comptable
Peut être liée à une Séance ou un Paiement
Règles métier : RM-CPT-004 à RM-CPT-040, RM-CPT-017

Élève (Student)
Description : Personne bénéficiant des cours dispensés par un Professeur. Dans la Version 1, l’Élève ne possède pas de compte utilisateur.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
parentId
UUID
Obligatoire
Référence vers ParentProfile
firstName
String
Obligatoire
Prénom
lastName
String
Obligatoire
Nom
dateOfBirth
Date
Optionnel
Date de naissance
currentSchoolSituationId
UUID
Optionnel
Référence vers la situation active
status
StudentStatus
Obligatoire
ACTIVE, ARCHIVED
Relations :
Appartient à un ParentProfile
Possède plusieurs StudentSchoolSituation
Possède plusieurs Enrollments
Règles métier : RM-PAR-003, RM-PAR-009
Evènements métier : EVT-PAR-003, EVT-PAR-004

Établissement scolaire (School)
Description : Établissement scolaire reconnu par GROUPI. Géré via un référentiel officiel.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
name
String
Obligatoire, Unique
Nom officiel
type
SchoolType
Obligatoire
COLLEGE, HIGH_SCHOOL, PRIMARY, OTHER
cityId
UUID
Obligatoire
Référence vers City
address
String
Optionnel
Adresse
latitude
Decimal
Optionnel
Coordonnées GPS
longitude
Decimal
Optionnel
Coordonnées GPS
isActive
Boolean
Obligatoire
True si disponible
Relations :
Utilisé par les Élèves (via la Situation scolaire)
Situé dans une Ville
Règles métier : RM-PAR-004 à RM-PAR-018, RM-REF-001 à RM-REF-013
Evènements métier : EVT-PAR-006, EVT-REF-001 à EVT-REF-005

Export (Export)
Description : Extraction de données au format PDF, Excel ou CSV. Réservée aux offres payantes.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
teacherId
UUID
Obligatoire
Référence vers TeacherProfile
type
ExportType
Obligatoire
GROUPS, STUDENTS, ATTENDANCE, PAYMENTS, etc.
format
ExportFormat
Obligatoire
PDF, EXCEL, CSV
filters
JSON
Optionnel
Critères de sélection
status
ExportStatus
Obligatoire
PENDING, GENERATING, COMPLETED, FAILED
fileUrl
String
Optionnel
URL du fichier généré
fileSize
Number
Optionnel
Taille en octets
downloadedAt
DateTime
Optionnel
Date de téléchargement
requestedAt
DateTime
Obligatoire
Date de la demande
completedAt
DateTime
Optionnel
Date de génération
Relations :
Demandé par un TeacherProfile
Règles métier : RM-EXP-001 à RM-EXP-015
Evènements métier : EVT-EXP-001 à EVT-EXP-009

Groupe (Group)
Description : Unité pédagogique principale de GROUPI. Représente un ensemble d’élèves suivant une même matière avec un même Professeur.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
name
String
Obligatoire
Nom du groupe
teacherId
UUID
Obligatoire
Référence vers TeacherProfile
subjectId
UUID
Obligatoire
Référence vers Subject
schoolLevelId
UUID
Obligatoire
Référence vers SchoolLevel
academicYearId
UUID
Obligatoire
Référence vers AcademicYear
capacity
Number
Obligatoire, \> 0
Capacité maximale
publicPrice
Decimal
Obligatoire, \> 0
Tarif public
teachingMode
TeachingMode
Obligatoire
PRESENTIAL, ONLINE
absenceBillingPolicy
AbsenceBillingPolicy
Obligatoire
ALL_BILLED, EXCUSED_NOT_BILLED, NONE_BILLED
abandonmentThreshold
Number
Obligatoire, \>= 1
Seuil d\’abandon (défaut: 3)
visibilityWhenFull
VisibilityWhenFull
Obligatoire
VISIBLE, HIDDEN
startDate
Date
Obligatoire
Date de début
endDate
Date
Optionnel
Date de fin
status
GroupStatus
Obligatoire
DRAFT, ACTIVE, FULL, SUSPENDED, CLOSED, ARCHIVED
Relations :
Appartient à un TeacherProfile
Possède plusieurs GroupSchedule
Possède plusieurs Enrollments
Possède plusieurs Sessions
Règles métier : RM-GRP-001 à RM-GRP-046
Evènements métier : EVT-GRP-001 à EVT-GRP-015

Inscription (Enrollment)
Description : Lien administratif, pédagogique et comptable entre un Parent, un Élève et un Groupe.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
studentId
UUID
Obligatoire
Référence vers Student
groupId
UUID
Obligatoire
Référence vers Group
status
EnrollmentStatus
Obligatoire
PENDING_VALIDATION, ACTIVE, SUSPENDED, REJECTED, ARCHIVED
customPrice
Decimal
Optionnel
Tarif personnalisé
paymentMethod
PaymentMethod
Optionnel
Mode de paiement préféré
requestedAt
DateTime
Obligatoire
Date de la demande
decidedAt
DateTime
Optionnel
Date de la décision
decidedBy
UUID
Optionnel
Professeur décisionnaire
Relations :
Concerne un Student
Concerne un Group
Possède un AccountingAccount
Possède des Attendance
Possède des Comment
Règles métier : RM-INS-001 à RM-INS-058
Evènements métier : EVT-INS-001 à EVT-INS-018

Matière (Subject)
Description : Discipline enseignée dans un groupe. Gérée via un référentiel officiel.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
name
String
Obligatoire, Unique
Nom de la matière
code
String
Obligatoire, Unique
Code
isActive
Boolean
Obligatoire
True si disponible
Relations :
Utilisée par TeacherProfile
Utilisée par Group
Associée à SchoolLevel via SubjectLevel
Règles métier : RM-TPR-002, RM-TPR-006, RM-REF-001 à RM-REF-013

Notification (Notification)
Description : Information transmise automatiquement à un utilisateur.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
userId
UUID
Obligatoire
Référence vers User
type
NotificationType
Obligatoire
Type de notification
priority
Priority
Obligatoire
INFORMATION, IMPORTANT, CRITIQUE
channel
Channel
Obligatoire
ACTIVITY_CENTER, EMAIL, SMS (Version2)
title
String
Obligatoire
Titre
content
String
Obligatoire
Contenu
readAt
DateTime
Optionnel
Date de lecture
sentAt
DateTime
Optionnel
Date d\’envoi
metadata
JSON
Optionnel
Données contextuelles
Relations :
Destinée à un User
Règles métier : RM-NOT-001 à RM-NOT-017
Evènements métier : EVT-NOT-002 à EVT-NOT-006

Niveau scolaire (SchoolLevel)
Description : Classe scolaire ou niveau d’études officiel associé aux groupes et aux élèves. Géré via un référentiel officiel.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
name
String
Obligatoire, Unique
Nom du niveau
code
String
Obligatoire, Unique
Code
order
Number
Obligatoire
Ordre de classement
isActive
Boolean
Obligatoire
True si disponible
Relations :
Utilisé par TeacherProfile
Utilisé par StudentSchoolSituation
Utilisé par Group
Associé à Subject via SubjectLevel
Règles métier : RM-TPR-002, RM-TPR-006, RM-REF-001 à RM-REF-013

Paiement (Payment)
Description : Montant reçu par le Professeur et enregistré dans GROUPI.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
enrollmentId
UUID
Obligatoire
Référence vers Enrollment
amount
Decimal
Obligatoire, \> 0
Montant
method
PaymentMethod
Obligatoire
Mode de paiement
date
DateTime
Obligatoire
Date de l\’enregistrement
teacherId
UUID
Obligatoire
Professeur enregistreur
comment
String
Optionnel
Commentaire
status
PaymentStatus
Obligatoire
RECORDED, MODIFIED, DELETED
Relations :
Associé à une Inscription
Génère une Écriture comptable de type PAYMENT
Règles métier : RM-CPT-011, RM-CPT-012
Evènements métier : EVT-CPT-002, EVT-CPT-006, EVT-CPT-007

Parent (Parent)
Description : Responsable légal d’un ou plusieurs élèves. Interlocuteur principal entre sa famille et le Professeur.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique (hérité de User)
firstName
String
Obligatoire
Prénom
lastName
String
Obligatoire
Nom
phone
String
Obligatoire
Numéro de téléphone
city
String
Obligatoire
Ville
validatedAt
DateTime
Optionnel
Date de validation
Relations :
Hérite de User
Gère plusieurs Students
Règles métier : RM-PAR-001 à RM-PAR-018
Evènements métier : EVT-PAR-001 à EVT-PAR-009

Préinscription (PreEnrollment)
Description : Manifestation d’intérêt d’un Parent pour inscrire son enfant auprès d’un Professeur pour une future année académique.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
parentId
UUID
Obligatoire
Référence vers ParentProfile
studentId
UUID
Obligatoire
Référence vers Student
teacherId
UUID
Obligatoire
Référence vers TeacherProfile
schoolLevelId
UUID
Obligatoire
Niveau scolaire prévu
subjectId
UUID
Optionnel
Matière concernée
academicYearId
UUID
Obligatoire
Année académique visée
status
PreEnrollmentStatus
Obligatoire
PENDING, PROPOSAL_SENT, CONFIRMED, REJECTED, TRANSFORMED, EXPIRED
expiresAt
DateTime
Optionnel
Date d\’expiration de la proposition
Relations :
Appartient à un Parent
Concerne un Student
Cible un TeacherProfile
Peut être transformée en Enrollment
Règles métier : RM-PRE-001 à RM-PRE-031
Evènements métier : EVT-PRE-001 à EVT-PRE-010

Présence (Attendance)
Description : Enregistrement de la participation d’un Élève à une séance donnée.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
sessionId
UUID
Obligatoire
Référence vers Session
studentId
UUID
Obligatoire
Référence vers Student
status
AttendanceStatus
Obligatoire
PRESENT, EXCUSED_ABSENT, UNEXCUSED_ABSENT, LATE
lateDuration
Number
Optionnel
Durée du retard (minutes)
comment
String
Optionnel
Commentaire
recordedAt
DateTime
Obligatoire
Date d\’enregistrement
modifiedAt
DateTime
Optionnel
Date de modification
Relations :
Associée à une Session
Associée à un Student
Déclenche la création d’Écritures comptables
Règles métier : RM-ATT-001 à RM-ATT-032
Evènements métier : EVT-ATT-001 à EVT-ATT-018

Professeur (Teacher)
Description : Utilisateur principal de GROUPI. Crée et administre des groupes, gère les inscriptions, organise les séances.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique (hérité de User)
firstName
String
Obligatoire
Prénom
lastName
String
Obligatoire
Nom
phone
String
Obligatoire
Numéro de téléphone
city
String
Obligatoire
Ville
bio
String
Optionnel
Biographie
photo
String
Optionnel
URL de la photo
experience
String
Optionnel
Expérience professionnelle
subjects
Subject\[\]
Obligatoire
Matières enseignées
schoolLevels
SchoolLevel\[\]
Obligatoire
Niveaux enseignés
completenessScore
Number
Calculé
Score de complétude (0-100)
status
TeacherProfileStatus
Obligatoire
DRAFT, PENDING_VALIDATION, VALIDATED, SUSPENDED
Relations :
Hérite de User
Crée des Groupes
Possède un Abonnement
Règles métier : RM-TPR-001 à RM-TPR-015
Evènements métier : EVT-TPR-001 à EVT-TPR-007

Séance (Session)
Description : Cours programmé appartenant à un groupe. Unité opérationnelle de base de l’activité pédagogique.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
groupId
UUID
Obligatoire
Référence vers Group
date
Date
Obligatoire
Date
startTime
Time
Obligatoire
Heure de début
duration
Number
Obligatoire
Durée en minutes
teachingMode
TeachingMode
Obligatoire
PRESENTIAL, ONLINE
teachingLocationId
UUID
Optionnel
Référence vers TeachingLocation
status
SessionStatus
Obligatoire
PLANNED, POSTPONED, CANCELLED, COMPLETED, LOCKED
lockedAt
DateTime
Optionnel
Date de verrouillage
Relations :
Appartient à un Group
Contient des Attendance
Peut générer des AccountingEntry
Règles métier : RM-SES-001 à RM-SES-047
Evènements métier : EVT-SES-001 à EVT-SES-026

Situation scolaire (StudentSchoolSituation)
Description : Ensemble des informations décrivant la scolarité actuelle d’un élève pour une année académique donnée.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
studentId
UUID
Obligatoire
Référence vers Student
academicYearId
UUID
Obligatoire
Référence vers AcademicYear
schoolLevelId
UUID
Obligatoire
Référence vers SchoolLevel
schoolId
UUID
Obligatoire
Référence vers School
class
String
Optionnel
Classe scolaire
startDate
Date
Obligatoire
Date de début de validité
endDate
Date
Optionnel
Date de fin de validité
isActive
Boolean
Calculé
True si la situation est active
Relations :
Appartient à un Student
Référence un AcademicYear
Référence un SchoolLevel
Référence un School
Règles métier : RM-SCH-001 à RM-SCH-020
Evènements métier : EVT-SCH-001 à EVT-SCH-008

SubjectLevel (Combinaison Matière / Niveau)
Description : Référentiel officiel définissant les combinaisons autorisées entre une Matière et un Niveau scolaire. Utilisé pour valider la cohérence pédagogique lors de la constitution du profil d’un Professeur et de la création d’un Groupe.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
subjectId
UUID
Obligatoire
Référence vers Subject
schoolLevelId
UUID
Obligatoire
Référence vers SchoolLevel
isAllowed
Boolean
Obligatoire
True si la combinaison est autorisée
isActive
Boolean
Obligatoire
True si la combinaison est active
Relations :
Associe une Matière (Subject) à un Niveau scolaire (SchoolLevel)
Utilisé lors de la validation du profil Professeur (TeacherProfile)
Utilisé lors de la création d’un Groupe (Group)
Règles métier : RM-REF-003, RM-TPR-006, RM-TPR-008, RM-GRP-005, RM-GEN-006

Super Administrateur (SuperAdmin)
Description : Utilisateur possédant tous les droits d’administration de GROUPI. Créé uniquement lors de l’installation du système.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique (hérité de User)
createdAt
DateTime
Obligatoire
Date de création
Relations :
Hérite de User
Crée et gère les Administrateurs
Règles métier : RM-ACC-003, RM-ACC-015

Tableau de bord (Dashboard)
Description : Vue synthétique des informations essentielles d’un utilisateur selon son rôle dans GROUPI.
Attribut
Type
Contrainte
Description
userId
UUID
Obligatoire, Unique
Référence vers User
type
DashboardType
Obligatoire
TEACHER, PARENT, ADMIN, SUPER_ADMIN
data
JSON
Calculé
Données du tableau de bord
lastUpdatedAt
DateTime
Obligatoire
Dernière actualisation
Relations :
Appartient à un User
Règles métier : RM-DSH-001 à RM-DSH-013
Evènements métier : EVT-DSH-001 à EVT-DSH-007

Utilisateur (User)
Description : Toute personne disposant d’un compte GROUPI. Un utilisateur peut cumuler plusieurs rôles.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
email
String
Obligatoire, Unique
Adresse e-mail (identifiant de connexion)
passwordHash
String
Obligatoire
Mot de passe haché
status
UserStatus
Obligatoire
PENDING_VALIDATION, ACTIVE, SUSPENDED, DISABLED, ARCHIVED
roles
Role\[\]
Obligatoire
Liste des rôles
emailVerifiedAt
DateTime
Optionnel
Date de vérification de l\’e-mail
lastLoginAt
DateTime
Optionnel
Date de dernière connexion
createdAt
DateTime
Obligatoire
Date de création
updatedAt
DateTime
Obligatoire
Date de dernière modification
deletedAt
DateTime
Optionnel
Date de suppression logique
Relations :
Un User peut avoir un TeacherProfile (0..1)
Un User peut avoir un ParentProfile (0..1)
Un User peut avoir plusieurs Sessions
Un User peut avoir plusieurs Notifications
Règles métier : RM-ACC-001 à RM-ACC-021



Ville (City)
Description : Localité de référence utilisée dans GROUPI. Gérée via un référentiel officiel.
Attribut
Type
Contrainte
Description
id
UUID
Obligatoire, Unique
Identifiant technique
name
String
Obligatoire, Unique
Nom de la ville
isActive
Boolean
Obligatoire
True si disponible

