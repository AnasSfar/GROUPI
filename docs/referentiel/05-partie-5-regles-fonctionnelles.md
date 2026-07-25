# PARTIE V - REGLES FONCTIONNELLES (Chapitres 24 a 30 : Regles transversales, Regles de calcul, Regles metier generales, Architecture metier, Workflows metier, Feuille de route, Conclusion)

PARTIE V — RÈGLES FONCTIONNELLES

## CHAPITRE 24 — RÈGLES TRANSVERSALES
24.1 Objet
Les règles décrites dans ce chapitre s’appliquent à l’ensemble des fonctionnalités de GROUPI.Elles complètent les règles spécifiques décrites dans les chapitres fonctionnels.Les règles transversales s’appliquent à l’ensemble de la plateforme sauf lorsqu’une règle spécifique est explicitement définie dans un chapitre fonctionnel. En cas de conflit entre une règle transversale et une règle spécifique à un chapitre, la règle spécifique prévaut.

24.2 Gestion du temps
Toutes les dates et heures sont enregistrées au format UTC puis affichées dans le fuseau horaire officiel de la plateforme lors de l’affichage.Les opérations sont horodatées automatiquement.
Chaque enregistrement comporte au minimum :
Date de création ; 
Auteur de la création ;
Date de dernière modification ; 
Auteur de la modification. 

24.3 Année académique
Toutes les données pédagogiques sont rattachées à une année académique.
Exemples :
Groupes ; 
Préinscriptions ; 
Inscriptions ; 
Séances ; 
Présences ; 
Statistiques. 
La clôture d’une année académique verrouille toutes les données associées. Aucune modification, création ou suppression n’est possible sur les données de cette année. Les données restent consultables en lecture seule.

24.4 Historisation
Les données métier importantes sont historisées.
GROUPI ne supprime jamais :
Les inscriptions ; 
Les séances réalisées ; 
Les présences ; 
Les commentaires ; 
Les écritures comptables. 
Les données historisées restent disponibles en consultation selon les droits d’accès de l’utilisateur.

24.5 Archivage
Les objets terminés peuvent être archivés.
L’archivage :
Interdit toute modification ; 
Conserve l’historique ; 
Permet les consultations. 
L’archivage ne constitue pas une suppression.

24.6 Suppression
La suppression physique des données métier est interdite.
Lorsqu’un utilisateur demande la suppression de son compte, GROUPI applique une désactivation logique du compte conformément aux règles de conservation des données.
Les données nécessaires :
Aux obligations légales ; 
Aux historiques pédagogiques ; 
Aux historiques comptables ; 
restent conservées.

24.7 Traçabilité
Toutes les opérations importantes sont enregistrées.
Exemples :
Validation ; 
Suspension ; 
Paiement ; 
Modification d’une présence ; 
Changement de groupe ; 
Export. 
Chaque journal précise notamment :
L’utilisateur ; 
La date ; 
L’opération réalisée. 
Les logs d’audit peuvent être consultés par le Super Administrateur et, sur demande, par les autorités compétentes.

24.8 Notifications
Les notifications sont générées automatiquement selon les règles décrites dans chaque chapitre.
Les événements critiques sont transmis :
Dans le centre d’activités ; 
Par e-mail. 
Les notifications par SMS pourront être proposées dans une version ultérieure.

24.9 Recalcul automatique
Certains indicateurs métier sont recalculés automatiquement. 
Exemples :
Solde du compte de suivicomptable ; 
Taux de présence ; 
Statistiques ; 
Capacité restante d’un groupe ;
Comportement de paiement du Parent ; 
Chiffre d’affaires prévisionnel ; 
Chiffre d’affaires réalisé ; 
Chiffre d’affaires encaissé. 
Les utilisateurs n’effectuent jamais ces recalculs manuellement.

24.10 Verrouillage des données
Certaines données deviennent définitivement verrouillées.
Exemples :
Une séance après expiration du délai de modification ; 
Une année académique clôturée ; 
Une inscription archivée. 
Une donnée verrouillée ne peut plus être modifiée.

24.11 Confidentialité
Chaque utilisateur n’accède qu’aux données strictement nécessaires à l’exercice de ses fonctions.Le principe du moindre privilège est appliqué dans toute la plateforme.Toute tentative d’accès à une donnée non autorisée est automatiquement refusée.

24.12Intégrité référentielle
GROUPI garantit la cohérence des relations entre les objets métier.Une opération qui entraînerait une incohérence est refusée automatiquement.
Exemple :
Suppression d’un groupe contenant encore des inscriptions actives ; 
Création d’une séance pour un groupe archivé ;
Création d’une inscription sur un groupe clôturé ; 
Création d’un groupe avec une combinaison Matière/Niveau interdite ; 
Suppression d’un établissement scolaire encore utilisé. 

24.13Atomicité des opérations
Certaines opérations métier sont exécutées de manière atomique.Lorsqu’une opération comprend plusieurs traitements dépendants, soit l’ensemble est exécuté avec succès, soit aucune modification n’est conservée.
Exemples :
Acceptation d’une inscription ; 
Changement de groupe ; 
Validation des présences ; 
Enregistrement d’un paiement ; 
Modification d’une présence entraînant une mise à jour comptable. 
Cette règle garantit la cohérence permanente des données.
Les opérations longues (génération d’export, recalcul massif) sont exécutées de manière asynchrone. L’utilisateur est notifié à la fin du traitement.

24.14Objets métier concernés
AuditLog 
Notification 
Activity 
AcademicYear 

24.15Cas d’erreur
Code
Situation
Résultat attendu
ERR-TRS-001
Modification d’une donnée verrouillée
Refus.
ERR-TRS-002
Suppression physique interdite
Refus.
ERR-TRS-003
Création d’une donnée sur une année académique clôturée
Refus.
ERR-TRS-004
Tentative d’accès à une donnée non autorisée
Accès refusé.

24.16Evènements métier
Code
Événement
Description
EVT-TRS-001
Donnée historisée
Une donnée métier est transférée dans l’historique tout en restant consultable selon les droits de l’utilisateur.
EVT-TRS-002
Donnée archivée
Un objet métier est archivé et devient non modifiable tout en restant consultable.
EVT-TRS-003
Recalcul automatique effectué
GROUPI recalcule automatiquement un ou plusieurs indicateurs métier à la suite d’une opération ayant un impact sur les données.
EVT-TRS-004
Donnée verrouillée
Une donnée devient définitivement non modifiable en raison d’une règle métier (clôture d’année académique, archivage, expiration d’un délai, etc.).
EVT-TRS-005
Année académique clôturée
L’année académique est clôturée et l’ensemble des données associées bascule automatiquement en lecture seule.
EVT-TRS-006
Opération refusée pour incohérence
GROUPI refuse automatiquement une opération qui entraînerait une incohérence fonctionnelle ou référentielle.
EVT-TRS-007
Traitement asynchrone terminé
Une opération exécutée en arrière-plan (export, recalcul massif, etc.) est terminée et son résultat est disponible.

24.17 Règles métier
Code
Règle
RM-TRS-001
Toutes les données pédagogiques sont rattachées à une année académique.
RM-TRS-002
La clôture d’une année académique verrouille définitivement toutes les données associées qui deviennent consultables en lecture seule.
RM-TRS-003
Les données métier importantes sont historisées. GROUPI ne supprime jamais : les inscriptions, les séances réalisées, les présences, les commentaires, les écritures comptables.
RM-TRS-004
L’archivage interdit toute modification, conserve l’historique et permet les consultations.
RM-TRS-005
La suppression physique des données métier est interdite.
RM-TRS-006
Toutes les opérations importantes sont enregistrées dans des journaux de traçabilité.
RM-TRS-007
Les notifications sont générées automatiquement selon les règles décrites dans chaque chapitre.
RM-TRS-008
Les indicateurs métier sont recalculés automatiquement après toute modification ayant un impact sur leur valeur.
RM-TRS-009
Une donnée verrouillée ne peut plus être modifiée.
RM-TRS-010
Le principe du moindre privilège est appliqué dans toute la plateforme.
RM-TRS-011
Une opération qui entraînerait une incohérence est refusée automatiquement.
RM-TRS-012
En cas de conflit entre une règle transversale et une règle spécifique, la règle spécifique prévaut.
RM-TRS-013
Les données sont conservées conformément aux obligations légales (7 ans pour les données comptables). Passé ce délai, les données peuvent être anonymisées.
RM-TRS-014
Chaque enregistrement comporte : date de création, auteur de la création, date de dernière modification, auteur de la dernière modification.
RM-TRS-015
Les opérations longues (exports, recalculs massifs) sont exécutées de manière asynchrone avec notification à l’utilisateur.
RM-TRS-016
Les logs d’audit sont conservés pendant 7 ans.
RM-TRS-017
Les sessions utilisateur expirent après 30 minutes d’inactivité. Ce délai est paramétrable.
RM-TRS-018
Les dates sont stockées en UTC et converties dans le fuseau horaire officiel de la plateforme lors de l’affichage.

## CHAPITRE 25 — RÈGLES DE CALCUL
25.1 Objet
Le présent chapitre décrit les formules de calcul utilisées par GROUPI.Ces calculs sont réalisés automatiquement par la plateforme.Les utilisateurs ne peuvent jamais modifier directement les résultats calculés.

25.2Principes
Les indicateurs sont calculés à partir des données métier. Certains indicateurs peuvent être matérialisés (cache) pour des raisons de performance, mais leur valeur reste entièrement dérivable des données métier et ne constitue jamais la source officielle.Les utilisateurs ne peuvent jamais modifier directement une valeur calculée.
Les calculs sont exécutés dans l’ordre suivant : 
1. Écritures comptables et paiements, 
2. Solde comptable, 
3. Indicateurs financiers (CA), 
4. Indicateurs pédagogiques (assiduité, absences).
Les pourcentages et les montants financiers sont arrondis à deux décimales selon la règle de l’arrondi bancaire.
25.3 Solde comptable
Chaque inscription possède un solde comptable exprimé en TND.
Formule
Solde = Total des crédits − Total des débits
Avec :
Crédit = écriture comptable de type Crédit
Débit = écriture comptable de type Débit
Les ajustements comptables sont pris en compte dans le calcul du solde. Les ajustements comptables modifient le solde mais n’ont pas d’impact sur les indicateurs pédagogiques (taux d’assiduité, absences).

25.4 Taux d’assiduité
Le taux d’assiduité est calculé pour chaque inscription et exprimé en %.
Formule
Taux d’assiduité =(Nombre de présences / Nombre de séances auxquelles l’élève était inscrit)× 100
Les retards sont considérés comme des présences.Les absences excusées et non excusées sont considérées comme des absences.Le taux d’assiduité est calculé sur l’année académique en cours.
Nombre de retards = Compteur cumulé des retards enregistrés pour l’inscription. 

25.5 Nombre d’absences consécutives
Le compteur d’absences consécutives est utilisé pour détecter un risque d’abandon.
Règle
Présence→ compteur = 0Absence→ compteur = compteur +1
Lorsque le seuil défini dans le groupe est atteint, une alerte est générée.

25.6 Taux d’occupation d’un groupe
Formule
Taux d’occupation =(Nombre d’inscriptions actives /Capacité maximale)×100
Les inscriptions suspendues, terminées ou archivées ne sont pas prises en compte.
Taux d’occupation global du Professeur = (Total des inscriptions actives / Capacité totale de l’abonnement) × 100.
Les taux d’occupation sont exprimés en pourcentage (%) et arrondis à deux décimales.

25.7 Nombre de places disponibles
Places disponibles =Capacité maximale−Nombre d’inscriptions actives

25.8 Score de complétude du profil
Le score est calculé automatiquement en %.Chaque information obligatoire ou facultative possède un poids.
Exemple :
Élément
Pondération
Nom
10 %
Téléphone
10 %
Ville
10 %
Matières
20 %
Niveaux
20 %
Photo
10 %
Biographie
10 %
Disponibilités
10 %

Score de complétude = Somme des pondérations des informations renseignées
La pondération des éléments du score de complétude est définie par GROUPI. Elle peut évoluer sans modification du présent référentiel. La somme des pondérations est toujours égale à 100%.

25.9 Comportement de paiement
Le comportement de paiement est déterminé à partir des critères suivants:
Du nombre de paiements attendus ; 
Du nombre de paiements réalisés ; 
Des retards de paiement ; 
Des impayés. 
Le mode de calcul détaillé est paramétrable par GROUPI.
Le résultat est classé automatiquement :
Excellent 
Moyen 
Mauvais 
Les seuils par défaut sont : Excellent (≥ 90% de paiements à temps), Moyen (50% à 89%), Mauvais (< 50% ou présence d’impayés). Ces seuils sont paramétrables.

25.10 Solde global d’un Parent
Pour chaque enfant :
Somme des soldesde toutes ses inscriptions
Pour le Parent :
Somme des soldesde tous les enfants
Les soldes sont exprimés en TND.

25.11 Chiffre d’affaires prévisionnel
Le chiffre d’affaires prévisionnel correspond à la somme des séances futures susceptibles d’être facturées selon les inscriptions actuellement actives et les tarifs appliqués à ces inscriptions. Il est recalculé automatiquement après toute modification des groupes, des inscriptions, des séances ou des tarifs.Il est exprimé en TND.
Le CA prévisionnel est calculé sur les séances futures planifiées jusqu’à la fin de l’année académique ou la fin du mois selon la demande du professeur.

25.12 Chiffre d’affaires encaissé
Le chiffre d’affaires encaissé correspond uniquement aux paiements enregistrés. Il est exprimé en TND.
CA encaissé =Somme des Écritures comptables (crédits)sur la période sélectionnée.

25.13 Chiffre d’affaires facturé
Le chiffre d’affaires facturé correspond à la somme des écritures comptables de type Débit enregistrées sur la période sélectionnée. Il est exprimé en TND.
CA facturé =Somme des Écritures comptables (débits)sur la période sélectionnée.

25.14 Tarif appliqué
Le tarif utilisé lors de la facturation est déterminé selon la règle suivante :
Tarif personnalisé de l’inscription (si défini) ; 
À défaut, tarif public du groupe. 
Le tarif de référence du Professeur n’est jamais utilisé pour la facturation.
Le tarif est exprimé en TND.

25.15 Statistiques
Les tableaux de bord utilisent exclusivement les données validées.Les statistiques sont recalculées automatiquement après toute modification ayant un impact sur :
Les présences ; 
Les séances ; 
Les paiements ; 
Les inscriptions. 
Les calculs peuvent être exécutés de manière asynchrone pour préserver les performances de la plateforme. L’utilisateur est informé lorsque le résultat est disponible.
En Version 2, des statistiques agrégées par matière et par niveau seront calculées à partir des données de tous les Professeurs.
Matrice des calculs
Calcul
Utilisé par
Dépend de
Solde comptable
Tableau de bord Professeur, Parent
Écritures comptables (Crédits, Débits, Ajustements)
Taux d’assiduité
Tableaux de bord
Présences, Séances planifiées
Places disponibles
Recherche des groupes
Inscriptions actives, Capacité du groupe
Taux d’occupation
Tableau de bord Professeur
Groupes, Inscriptions actives
Score de complétude
Tableau de bord Professeur
Profil (informations renseignées)
Comportement de paiement
Inscriptions
Paiements, Échéances
Solde global Parent
Tableau de bord Parent
Soldes des inscriptions des enfants
CA prévisionnel
Tableau de bord Professeur
Groupes, Séances futures, Inscriptions, Tarifs
CA facturé
Tableau de bord Professeur
Écritures comptables (débits)
CA encaissé
Tableau de bord Professeur
Écritures comptables (Crédits)
Compteur d’absences
Détection d’abandon
Présences, Absences consécutives
Taux d’occupation global
Tableau de bord Professeur
Inscriptions actives totales, Capacité abonnement

25.16 Objets métier concernés
AccountingEntry 
Attendance 
Group 
GroupMembership
Subscription 
Payment 

25.17Cas d’erreur
Code
Situation
Résultat attendu
ERR-CAL-001
Division par zéro
Le résultat est fixé à la valeur neutre définie pour l’indicateur (0 %, 0 TND ou calcul impossible).
ERR-CAL-002
Données incomplètes
Calcul impossible, résultat non disponible.
ERR-CAL-003
Référence métier absente
Calcul refusé.

25.18Evènements métier
Code
Événement
Description
EVT-CAL-001
Recalcul automatique déclenché
Un événement déclenche le recalcul d’un indicateur
EVT-CAL-002
Recalcul asynchrone terminé
Un calcul asynchrone est terminé, le résultat est disponible

25.19Règles métier
Code
Règle
RM-CAL-001
Tous les indicateurs métier sont calculés automatiquement par GROUPI. Aucun utilisateur ne peut les modifier manuellement.
RM-CAL-002
Toute modification d’une donnée source entraîne le recalcul automatique des indicateurs impactés.
RM-CAL-003
Les calculs opérationnels utilisent exclusivement des données validées et non archivées. Les données archivées ou verrouillées restent utilisées uniquement pour les calculs historiques.
RM-CAL-004
Les calculs sont réalisés dans le contexte d’une année académique déterminée, sauf pour les indicateurs explicitement définis comme globaux.
RM-CAL-005
Le solde comptable d’une inscription est toujours calculé à partir des écritures comptables enregistrées.
RM-CAL-006
Le tarif appliqué à une séance est déterminé selon la hiérarchie définie dans le référentiel (tarif personnalisé puis tarif du groupe).
RM-CAL-007
Les données verrouillées ou archivées ne peuvent plus être modifiées mais restent prises en compte dans les calculs historiques.
RM-CAL-008
Les exports utilisent les valeurs calculées au moment de leur génération et ne sont jamais mis à jour automatiquement.
RM-CAL-009
Les formules de calcul peuvent évoluer entre deux versions de GROUPI sans remettre en cause les données historiques déjà enregistrées.
RM-CAL-010
Les montants sont arrondis à deux décimales selon la règle de l’arrondi bancaire.
RM-CAL-011
Les calculs sont exécutés dans l’ordre de dépendance : paiements/écritures → solde → indicateurs financiers → indicateurs pédagogiques.
RM-CAL-012
Les seuils de comportement de paiement sont paramétrables. Les valeurs par défaut sont : Excellent (≥ 90%), Moyen (50% à 89%), Mauvais (< 50%).
RM-CAL-013
Le taux d’assiduité est calculé sur l’année académique en cours.
RM-CAL-014
Les ajustements comptables modifient le solde mais n’ont pas d’impact sur les indicateurs pédagogiques.
RM-CAL-015
Les statistiques agrégées par matière et par niveau seront disponibles en Version 2.




## CHAPITRE 26 — RÈGLES MÉTIER GÉNÉRALES
26.1 Objet
Le présent chapitre définit les règles métier transversales applicables à l’ensemble de GROUPI.
Ces règles s’imposent à toutes les fonctionnalités de la plateforme.
En cas de conflit entre une contrainte technique et une règle métier, la règle métier prévaut.

26.2 Unicité des comptes
Chaque utilisateur possède un compte unique.Un même utilisateur peut cumuler plusieurs rôles.
Exemple :
Professeur ;
Parent.
Dans ce cas, l’utilisateur conserve :
Une seule adresse électronique ;
Un seul mot de passe ;
Un seul profil utilisateur.
Les fonctionnalités disponibles dépendent uniquement des rôles qui lui sont attribués.

26.3 Validation des utilisateurs
Les Professeurs et les Parents doivent être validés avant d’accéder aux fonctionnalités nécessitant une autorisation.
Les validations sont réalisées exclusivement par :
Le Super Administrateur ;
Un Administrateur disposant des autorisations nécessaires.
La validation d’un compte est effectuée après vérification des informations obligatoires et des éventuelles alertes de sécurité. L’Administrateur peut refuser la validation si les conditions ne sont pas remplies.

26.4 Séparation des responsabilités
GROUPI distingue clairement les responsabilités des différents acteurs.
Par exemple :
Le Parent recherche les groupes ;
Le Professeur décide des inscriptions ;
GROUPI ne réalise aucun paiement entre les Parents et les Professeurs ;
Le Super Administrateur définit les permissions des Administrateurs.
Le Super Administrateur peut déléguer certaines responsabilités à des Administrateurs. La délégation est tracée et peut être révoquée à tout moment.
Cette séparation garantit une organisation claire et cohérente.
Un utilisateur cumulant plusieurs rôles (Professeur et Parent) doit respecter l’ensemble des règles applicables à chaque rôle. En cas de conflit, le rôle Professeur prévaut pour les opérations pédagogiques.

26.5 Intégrité pédagogique
Chaque groupe est obligatoirement associé :
À un seul Professeur ;
À une seule matière ;
À un seul niveau scolaire.
Les combinaisons matière / niveau sont systématiquement vérifiées à l’aide du référentiel SubjectLevel.
Toute combinaison interdite est refusée.

26.6 Intégrité comptable
Chaque inscription possède un compte de suivicomptable totalement indépendant.
Les écritures comptables ne peuvent jamais être fusionnées entre plusieurs inscriptions.
Le calcul du solde est entièrement automatique.
Toutes les opérations comptables restent historisées.

26.7 Immuabilité des données
Certaines informations deviennent définitivement non modifiables après validation.
Exemples :
Les séances verrouillées ;
Les écritures comptables ;
Les historiques.
Lorsqu’une correction est autorisée, GROUPI conserve toujours une trace de la modification.
Aucune donnée historique n’est supprimée.

26.8 Délai de correction des séances
Une séance réalisée peut être corrigée uniquement pendant les quarante-huit heures suivant son déroulement.
Les corrections autorisées concernent exclusivement :
La présence des élèves ;
La facturation de la séance.
Toute correction validée entraîne automatiquement une notification au Parent concerné.Toute correction validée entraîne automatiquement le recalcul des écritures comptables, des soldes, des statistiques et des indicateurs concernés.
À l’issue de ce délai, la séance est définitivement verrouillée.

26.9 Traçabilité
Les opérations importantes réalisées dans GROUPI sont historisées.
Selon leur nature, GROUPI enregistre notamment :
L’utilisateur concerné ;
La date ;
L’heure ;
L’opération réalisée.
Cette traçabilité permet :
L’audit ;
Le support ;
La résolution des litiges.

26.10 Confidentialité
Chaque utilisateur ne peut consulter que les informations correspondant à son rôle.
Ainsi :
Le Parent ne peut jamais consulter :
Les autres élèves d’un groupe ;
Les comptes de suivi comptables des autres familles ;
Les commentaires concernant d’autres élèves.
Le Professeur ne peut consulter que les données relatives à ses propres groupes.
Les Administrateurs ne visualisent que les informations autorisées par le Super Administrateur.
GROUPI applique les règles de confidentialité et de protection des données personnelles définies au paragraphe 26.14. Les utilisateurs disposent d’un droit d’accès, de rectification et de suppression de leurs données personnelles.

26.11 Notifications
Toute opération importante susceptible d’avoir un impact sur un utilisateur génère automatiquement une activité.Les règles détaillées de diffusion des notifications sont définies dans le chapitre consacré aux Notifications.Selon les cas, GROUPI envoie également une notification.
Les utilisateurs disposent ainsi d’une information rapide et transparente sur les événements les concernant.

26.12 Évolutivité
GROUPI est conçu pour évoluer progressivement.Les nouvelles fonctionnalités devront respecter l’ensemble des règles métier définies dans le présent référentiel.
Aucune évolution ne devra remettre en cause :
L’intégrité des données ;
La traçabilité ;
La cohérence comptable ;
La confidentialité ;
La séparation des responsabilités.
Toute nouvelle fonctionnalité devra s’intégrer au modèle métier existant sans remettre en cause les objets métier déjà définis.
Les règles métier générales ne peuvent être modifiées que par décision du Super Administrateur, après validation par l’équipe de direction de GROUPI. Toute modification est tracée et communiquée à l’ensemble des Administrateurs.

26.13 Modifications des règles métier générales
Les règles métier générales constituent le socle fondamental de GROUPI. Elles ne peuvent être modifiées que dans les conditions suivantes :
Initiative : La proposition de modification est soumise par un Administrateur ou le Super Administrateur
Validation : La modification est approuvée par le Super Administrateur
Impact : L’impact de la modification sur les fonctionnalités existantes est analysé
Traçabilité : La modification est enregistrée dans l’historique des règles métier
Communication : La modification est communiquée à l’ensemble des Administrateurs

26.14 Protection des données personnelles
GROUPI s’engage à respecter la réglementation applicable en matière de protection des données personnelles.
Principes
Les données personnelles sont collectées pour des finalités déterminées, explicites et légitimes ;
Les données sont conservées pendant une durée limitée ;
Les utilisateurs disposent d’un droit d’accès, de rectification et de suppression ;
Les données personnelles sont protégées contre tout accès, toute modification, toute divulgation ou toute destruction non autorisé.
Les données personnelles ne sont accessibles qu’aux utilisateurs autorisés selon leurs droits.

26.15 Objets métier concernés
User 
UserRole 
TeacherProfile 
ParentProfile 
Student 

Group 
Enrollment 
Session 
Attendance 

AccountingEntry 
Subscription

Notification 
Activity
AuditLog

AcademicYear

26.16 Cas d’erreur
Code
Situation
Résultat attendu
ERR-GEN-001
Opération interdite par une règle métier
Refus avec message explicite.
ERR-GEN-002
Modification d’un objet verrouillé
Modification refusée.
ERR-GEN-003
Accès à une ressource non autorisée
Accès refusé.
ERR-GEN-004
Violation d’une règle d’intégrité
Transaction annulée.

26.17 Evènements métier
Code
Événement
Description
EVT-GEN-001
Règle métier validée
Une règle métier générale est validée par le Super Administrateur.
EVT-GEN-002
Opération refusée
Une opération est refusée car elle ne respecte pas une règle métier générale.
EVT-GEN-003
Objet verrouillé
Un objet métier devient définitivement non modifiable.
EVT-GEN-004
Objet archivé
Un objet métier est archivé conformément aux règles de conservation.
EVT-GEN-005
Notification métier générée
Une activité ou une notification est générée automatiquement suite à une opération métier.

26.18 Règles métier
Code
Règle
RM-GEN-001
Chaque utilisateur possède un compte unique dans GROUPI, quel que soit le nombre de rôles qui lui sont attribués.
RM-GEN-002
Un utilisateur peut cumuler plusieurs rôles tout en conservant une authentification unique.
RM-GEN-003
Les Professeurs et les Parents doivent être validés avant d’accéder aux fonctionnalités nécessitant une autorisation.
RM-GEN-004
Les responsabilités des différents acteurs sont strictement séparées conformément aux principes métier de GROUPI.
RM-GEN-005
Chaque groupe est associé à un seul Professeur, une seule matière et un seul niveau scolaire.
RM-GEN-006
Toute combinaison matière / niveau est contrôlée à l’aide du référentiel SubjectLevel.
RM-GEN-007
Chaque inscription possède un compte de suivi comptable totalement indépendant des autres inscriptions.
RM-GEN-008
Les écritures comptables de deux inscriptions différentes ne peuvent jamais être fusionnées.
RM-GEN-009
Les données historiques ne sont jamais supprimées ; seules des corrections historisées sont autorisées lorsque les règles métier le permettent.
RM-GEN-010
Une séance ne peut être corrigée que pendant la période de modification autorisée définie par GROUPI.
RM-GEN-011
Toute opération métier importante est historisée afin de garantir la traçabilité complète de la plateforme.
RM-GEN-012
Chaque utilisateur ne peut consulter que les informations correspondant à ses droits d’accès.
RM-GEN-013
Toute opération susceptible d’avoir un impact sur un utilisateur génère automatiquement une activité et, le cas échéant, une notification.
RM-GEN-014
Toute évolution fonctionnelle de GROUPI doit respecter les principes fondamentaux d’intégrité, de traçabilité, de confidentialité et de séparation des responsabilités définis dans le présent référentiel.
RM-GEN-015
Toute opération métier doit respecter les droits d’accès de l’utilisateur avant toute exécution.
RM-GEN-016
Toute opération métier composée de plusieurs traitements dépendants est exécutée de manière atomique.
RM-GEN-017
Les règles métier générales ne peuvent être modifiées que par décision du Super Administrateur. Toute modification est tracée.
RM-GEN-018
GROUPI respecte la réglementation applicable en matière de protection des données personnelles.
RM-GEN-019
Un utilisateur cumulant plusieurs rôles respecte les règles applicables à chaque rôle. En cas de conflit, le rôle Professeur prévaut pour les opérations pédagogiques.
RM-GEN-020
Les données sont conservées conformément aux obligations légales (7 ans pour les données comptables).
RM-GEN-021
Les règles de sécurité définies au Chapitre 9 s’appliquent à l’ensemble des fonctionnalités de GROUPI.



## CHAPITRE 27 — ARCHITECTURE METIER

27.1 Objet
Ce chapitre décrit l’organisation fonctionnelle de GROUPI en domaines métier.
Il présente les principaux domaines fonctionnels de la plateforme, leurs responsabilités respectives ainsi que leurs interactions.
Cette architecture constitue la référence fonctionnelle utilisée pour la conception de l’architecture logicielle de GROUPI.

27.2 Principes
L’architecture fonctionnelle de GROUPI est organisée autour de plusieurs domaines métier indépendants.
Chaque domaine est responsable d’un ensemble cohérent de fonctionnalités.
Domaines cœur
Utilisateurs 
Pédagogique 
Comptable 
Commercial 
Domaines support
Communication 
Pilotage 
Référentiels 
Administration
Les domaines échangent leurs informations afin de garantir la cohérence globale de la plateforme.Les échanges entre domaines se font via des évènements métier asynchrones. Exemple : un événement ‘Présence validée’ est émis par le domaine Pédagogique et consommé par les domaines Comptable, Communication et Pilotage.
GROUPI distingue les Domaines Cœur (Utilisateurs, Pédagogique, Comptable et Commercial) des Domaines Support (Communication, Pilotage, Référentiels et Administration). Les domaines cœur sont prioritaires en matière de disponibilité, de robustesse et de performance.
Chaque domaine expose des APIs permettant aux autres domaines d’accéder à ses fonctionnalités. Les APIs sont documentées et versionnées.
Cette organisation facilite :
La maintenance ;
L’évolution fonctionnelle ;
La séparation des responsabilités ;
L’architecture logicielle.
Chaque donnée métier possède un domaine propriétaire unique (Source of Truth). Les autres domaines ne conservent que les informations nécessaires à leur fonctionnement et ne peuvent jamais modifier directement les données dont ils ne sont pas propriétaires.

27.3 Domaine Utilisateurs
Ce domaine gère :
Les comptes utilisateurs ;
Les rôles ;
Les validations ;
Les profils ;
Les autorisations ;
L’authentification ;
La gestion des sessions ;
La gestion des mots de passe ;
La gestion des connexions ;
Gestion des appareils connectés (Version 2).
Il constitue le point d’entrée de tous les utilisateurs de GROUPI.

27.4 Domaine Pédagogique
Le domaine pédagogique constitue le cœur de GROUPI.
Il gère notamment :
Les groupes ;
Les séances ;
Les modèles de séances ;
Les inscriptions ;
Les préinscriptions ;
Les changements de groupe ;
Les présences ;
Les retards ;
Les commentaires pédagogiques ;
Le calendrier scolaire ;
Les vacances ;
planification récurrente.
Toutes les activités liées à l’enseignement sont pilotées par ce domaine.

27.5 Domaine Comptable
Le domaine comptable assure le suivi financier des inscriptions.
Il est responsable notamment :
Des comptes de suivi comptables ;
Des écritures comptables ;
Des paiements enregistrés ;
Des débits ;
Des crédits ;
Des soldes ;
Du chiffre d’affaires prévisionnel ;
Du chiffre d’affaires facturé ;
Du chiffre d’affaires encaissé ;
Des ajustements comptables.
Ce domaine ne réalise jamais les paiements.Il en assure uniquement le suivi.

27.6 Domaine commercial
Le domaine commercial pilote les relations entre les Professeurs et GROUPI.
Il gère notamment :
Les offres commerciales ; 
Les abonnements ; 
Les renouvellements ; 
Les paiements d’abonnement ; 
Les suspensions pour non-paiement ; 
Catalogue des offres ;
Les limitations liées aux offres ; 
Les statistiques commerciales ;
La gestion des Add-ons (Version 2). 
Les opérations de ce domaine sont totalement indépendantes du moteur comptable des inscriptions.
Les paiements des abonnements ne sont jamais enregistrés dans les comptes de suivi comptables des élèves.

27.7 Domaine Communication
Ce domaine centralise toutes les interactions entre GROUPI et ses utilisateurs.
Il gère notamment :
Les notifications ;
Le centre d’activités ;
Les alertes ;
Commentaires privés ;
Messages système ;
Annonces de groupe ;
Les rappels ;
Modèles de notifications ;
Préférences de notification.
L’objectif est d’assurer une communication proactive avec les utilisateurs.

27.8 Domaine Référentiels
Ce domaine regroupe l’ensemble des données de référence utilisées par GROUPI.
Il comprend notamment :
Les matières ;
Les niveaux scolaires ;
Les établissements ;
Les villes ;
Les relations SubjectLevel.
Ces référentiels garantissent la cohérence de toutes les données métier.

27.9 Domaine Pilotage
Le domaine Pilotage regroupe les fonctionnalités d’aide à la décision.
Il produit notamment :
Les tableaux de bord ;
Les statistiques ;
Les indicateurs d’activité ;
Les indicateurs de performance ;
Historique des indicateurs ;
Exports statistiques ;
Les rapports ;
Les indicateurs IA (Version 2).
Les informations présentées sont calculées automatiquement à partir des autres domaines fonctionnels.

27.10 Domaine Administration
Responsable de :
Validations administratives ; 
Gestion des administrateurs ; 
Audit ; 
Supervision ; 
Paramétrage de la plateforme.
Gestion des référentiels ;
Gestion des paramètres système ;
Gestion des années académiques ;
Gestion des audits ;
Gestion des autorisations administratives ;
Gestion des logs ;
Gestion des événements système ;
Gestion des tâches planifiées ;
Surveillance des traitements asynchrones ;
Configuration générale.

27.11 Collaboration entre les domaines
Les domaines fonctionnels restent indépendants mais coopèrent en permanence. Ils échangent des informations mais restent faiblement couplés.
Exemple :
Une présence validée par le Professeur entraîne automatiquement :
Une mise à jour du domaine pédagogique ;
Une écriture dans le domaine comptable selon les règles du groupe ;
Une activité dans le domaine Communication ;
Une mise à jour des tableaux de bord du domaine Pilotage.
Cette organisation garantit que chaque information est enregistrée une seule fois puis exploitée par les différents domaines concernés.
Les domaines ne partagent jamais directement leurs bases de données. Les échanges s’effectuent exclusivement via des évènements métier ou des APIs versionnées.

27.12 Dépendances entre domaines
Domaine
Dépend de
Utilisateurs
Aucun
Référentiels
Aucun
Commercial
Utilisateurs
Pédagogique
Utilisateurs, Référentiels
Comptable
Pédagogique
Communication
Tous
Pilotage
Tous
Administration
Tous

Un domaine métier ne peut jamais modifier directement les données d’un autre domaine.Toute interaction entre domaines s’effectue par des évènements métier ou des services clairement définis.



27.13 Évolutivité
Cette architecture est conçue pour évoluer.
Les futurs modules de GROUPI devront s’intégrer dans l’un des domaines existants ou constituer un nouveau domaine fonctionnel, sans remettre en cause les principes généraux de la plateforme.
Cette approche garantit une architecture stable, cohérente et durable.

27.14 Objets métier concernés
User 
UserRole 
TeacherProfile 
ParentProfile 
Student 
Group 
Session 
Attendance 
Activity
AuditLog
Enrollment 
AccountingEntry 
Subscription 
Notification 
Dashboard 
AcademicYear 
Subject 
Level 
School 
City
AddOn

27.15Cas d’erreur
Code
Situation
Résultat attendu
ERR-ARC-001
Domaine indisponible
Opération différée ou refusée
ERR-ARC-002
Evènement métier invalide
Événement rejeté
ERR-ARC-003
Dépendance circulaire détectée
Refus de l’opération
ERR-ARC-004
Accès direct à un domaine interdit
Refus
ERR-ARC-005
API incompatible
Refus de la requête
ERR-ARC-006
Version d’événement inconnue
Événement ignoré et journalisé

27.16 Evènements métier
Code
Événement
Description
EVT-ARC-001
Domaine créé
Un nouveau domaine fonctionnel est intégré à GROUPI
EVT-ARC-002
Événement inter-domaines publié
Un domaine publie un évènement métier
EVT-ARC-003
Événement inter-domaines consommé
Un domaine traite un événement provenant d’un autre domaine
EVT-ARC-004
API inter-domaines appelée
Un domaine utilise un service exposé par un autre domaine
EVT-ARC-005
Synchronisation terminée
Les domaines sont synchronisés
EVT-ARC-006
Rejeu d’événements
Relecture des événements après incident

27.17 Règles métier
Code
Règle
RM-ARC-001
Chaque domaine métier est responsable exclusivement de ses propres données.
RM-ARC-002
Les domaines communiquent par évènements métier ou services exposés.
RM-ARC-003
Un domaine ne modifie jamais directement les données d’un autre domaine.
RM-ARC-004
Les domaines cœur sont prioritaires en matière de disponibilité.
RM-ARC-005
Toute nouvelle fonctionnalité est rattachée à un domaine métier.
RM-ARC-006
Les APIs inter-domaines sont versionnées.
RM-ARC-007
Les évènements métier constituent le mécanisme privilégié de communication asynchrone.
RM-ARC-008
Les référentiels sont la source unique des données de référence.
RM-ARC-009
Les tableaux de bord utilisent uniquement les données publiées par les domaines producteurs.
RM-ARC-010
Les domaines restent faiblement couplés afin de faciliter l’évolution de GROUPI.
RM-ARC-011
Chaque domaine est propriétaire exclusif de ses objets métier.
RM-ARC-012
Les échanges inter-domaines doivent être idempotents afin de garantir la cohérence en cas de retraitement.
RM-ARC-013
Les évènements métier sont immuables après leur publication.
RM-ARC-014
Les domaines consommateurs restent tolérants aux évolutions de version des événements publiés.
RM-ARC-015
Toute communication synchrone entre domaines doit utiliser une API officiellement versionnée.



## CHAPITRE 28 — WORKFLOWS MÉTIER
WF-001 — Cycle de vie d’un Professeur
Rubrique
Contenu
Code
WF-001
Nom
Cycle de vie d’un Professeur
Objectif
Permettre à un Professeur de créer son compte, d’être validé, d’exercer son activité, de modifier son profil et, le cas échéant, de voir son compte suspendu, désactivé ou archivé.
Acteurs
Professeur, Administrateur (ou Super Administrateur), Système
Déclencheur
Le Professeur crée son compte utilisateur.
Préconditions
Aucune.
Postconditions
Le compte utilisateur existe avec un statut final (PENDING_VALIDATION, ACTIVE, SUSPENDED, DISABLED ou ARCHIVED). Le profil Professeur est associé.
Étapes nominales :
Le Professeur s’inscrit sur GROUPI : création du compte User et du TeacherProfile associé (statut PENDING_VALIDATION).
Le Professeur complète son profil (nom, prénom, téléphone, ville, au moins une matière, au moins un niveau). Le score de complétude est recalculé à chaque modification.
Un Administrateur (ou Super Administrateur) valide le compte si les informations obligatoires sont présentes et que le contrôle de cohérence SubjectLevel est satisfait. Le compte passe en ACTIVE.
Le Professeur peut alors créer des groupes, accepter des inscriptions, gérer des séances, saisir des présences, enregistrer des paiements, etc., dans la limite de son abonnement.
Le Professeur peut modifier son profil à tout moment ; toute modification des matières ou niveaux est soumise à validation administrative.
En fin d’année académique, si l’abonnement n’est pas renouvelé, le compte bascule en mode lecture seule, puis est suspendu après le délai de grâce (7 jours).
Le Professeur peut demander la désactivation de son compte ; si aucun historique métier n’existe, le compte peut être supprimé physiquement ; sinon, il est anonymisé ou archivé selon les règles.
Variantes / exceptions :
Le compte peut être suspendu par un Administrateur pour non-paiement de l’abonnement, fraude, ou non-respect des CGU.
Le compte suspendu peut être réactivé par un Administrateur après régularisation.
Le compte peut être désactivé à la demande du Professeur ou par décision administrative.
Un compte archivé ne peut pas être réactivé.
Règles métier associées : RM-ACC-001 à RM-ACC-021, RM-TPR-001 à RM-TPR-015, RM-CYC-001 à RM-CYC-033
Evènements métier : EVT-CYC-001, EVT-CYC-002, EVT-CYC-003, EVT-CYC-004, EVT-CYC-005, EVT-CYC-007, EVT-CYC-009, EVT-TPR-001 à EVT-TPR-007
Notifications : NOT-CYC-001, NOT-CYC-002, NOT-CYC-003, NOT-CYC-004, NOT-CYC-005, NOT-CYC-009, NOT-CYC-010, NOT-TPR-001 à NOT-TPR-005
Cas d’erreur : ERR-ACC-001 à ERR-ACC-008, ERR-TPR-001 à ERR-TPR-009, ERR-CYC-001 à ERR-CYC-008
Objets métier impactés : User, TeacherProfile, Subject, SchoolLevel, Subscription, AcademicYear


WF-002 — Cycle de vie d’un Parent
Rubrique
Contenu
Code
WF-002
Nom
Cycle de vie d’un Parent
Objectif
Permettre à un Parent de créer son compte, d’être validé, de gérer ses enfants et leurs situations scolaires, et d’interagir avec les Professeurs via les inscriptions, préinscriptions et commentaires.
Acteurs
Parent, Administrateur, Système
Déclencheur
Le Parent crée son compte utilisateur.
Préconditions
Aucune.
Postconditions
Le compte utilisateur existe avec un statut final (PENDING_VALIDATION, ACTIVE, SUSPENDED, DISABLED ou ARCHIVED). Le profil Parent et éventuellement des profils Élèves sont créés.
Étapes nominales :
Le Parent s’inscrit sur GROUPI : création du compte User et du ParentProfile associé (statut PENDING_VALIDATION).
Le Parent complète son profil (nom, prénom, téléphone, ville).
Le Parent ajoute un ou plusieurs enfants (Student) et renseigne pour chacun la situation scolaire initiale (niveau, établissement, classe).
Un Administrateur valide le compte Parent (après vérification des informations obligatoires).
Une fois validé, le Parent peut rechercher des groupes, soumettre des demandes d’inscription, gérer des préinscriptions pour l’année suivante, consulter les présences, commentaires et comptes de suivi comptable de ses enfants.
Le Parent peut mettre à jour la situation scolaire de ses enfants (passage en nouvelle année, changement d’établissement, redoublement, etc.) ; certaines modifications sont soumises à validation administrative.
Le Parent peut demander la désactivation de son compte ; les profils des enfants et leurs historiques sont conservés.
Variantes / exceptions :
Le compte Parent peut être suspendu pour fraude ou non-respect des CGU.
Un enfant peut être archivé s’il ne suit plus aucun groupe, puis réactivé.
Un élève peut être rattaché à plusieurs comptes Parent uniquement en Version 2.
Règles métier associées : RM-PAR-001 à RM-PAR-018, RM-SCH-001 à RM-SCH-020, RM-CYC-001 à RM-CYC-033
Evènements métier : EVT-PAR-001 à EVT-PAR-009, EVT-CYC-001, EVT-CYC-002, EVT-SCH-001 à EVT-SCH-008
Notifications : NOT-PAR-001 à NOT-PAR-011, NOT-CYC-001, NOT-CYC-002, NOT-CYC-003, NOT-SCH-001 à NOT-SCH-009
Cas d’erreur : ERR-PAR-001 à ERR-PAR-009, ERR-CYC-001 à ERR-CYC-008, ERR-SCH-001 à ERR-SCH-010
Objets métier impactés : User, ParentProfile, Student, StudentSchoolSituation, School, SchoolLevel, AcademicYear


WF-003 — Cycle de vie d’une Préinscription
Rubrique
Contenu
Code
WF-003
Nom
Cycle de vie d’une préinscription
Objectif
Permettre à un Parent de manifester son intérêt pour une future année académique auprès d’un Professeur, et au Professeur de transformer cette manifestation en demande d’inscription lorsque les groupes sont créés.
Acteurs
Parent, Professeur, Système
Déclencheur
Le Parent crée une préinscription pour un enfant, un Professeur et une année académique future.
Préconditions
Le Parent est validé ; la période de préinscription est ouverte pour le Professeur concerné ; l’enfant appartient au Parent ; l’année académique visée est future.
Postconditions
Une préinscription existe avec un statut (OUVERTE, PROPOSEE, CONFIRMEE, TRANSFORMEE, EXPIREE, CLOTUREE, ANNULEE ou REFUSEE). Si transformée, une demande d’inscription est créée.
Étapes nominales :
Le Parent crée une préinscription pour son enfant, le Professeur choisi, le niveau scolaire prévu et éventuellement la matière.
Le Professeur consulte les préinscriptions reçues dans son tableau de bord.
Lorsque le Professeur crée un groupe pour l’année académique visée, le système recherche automatiquement les préinscriptions compatibles (même Professeur, même matière, même niveau).
Les préinscriptions compatibles sont proposées au Professeur, qui peut décider de les transformer ou non.
Le Professeur peut envoyer une proposition au Parent (invitation à confirmer la préinscription). La préinscription passe à l’état PROPOSEE.
Le Parent reçoit une notification et peut confirmer ou refuser la proposition.
Si le Parent confirme, le système vérifie que le groupe dispose encore de places disponibles et que la capacité d’abonnement du Professeur le permet. Si oui, la préinscription est transformée en demande d’inscription (statut TRANSFORMEE). Sinon, la confirmation est refusée.
Si le Parent refuse ou ne répond pas avant la date d’expiration, la préinscription passe à REFUSEE ou EXPIREE.
Variantes / exceptions :
Le Parent peut annuler sa préinscription tant qu’aucune proposition n’a été envoyée.
Une préinscription peut expirer sans proposition si le Professeur ne crée pas de groupe correspondant avant la rentrée.
Une préinscription transformée en demande d’inscription ne peut plus être réutilisée.
Règles métier associées : RM-PRE-001 à RM-PRE-031, RM-INS-001 à RM-INS-010
Evènements métier : EVT-PRE-001 à EVT-PRE-010
Notifications : NOT-PRE-001 à NOT-PRE-012
Cas d’erreur : ERR-PRE-001 à ERR-PRE-018
Objets métier impactés : PreEnrollment, Student, TeacherProfile, Group, Enrollment (en cas de transformation)



WF-004 — Cycle de vie d’une Inscription
Rubrique
Contenu
Code
WF-004
Nom
Cycle de vie d’une inscription
Objectif
Permettre à un Parent d’inscrire son enfant dans un groupe, avec validation du Professeur, création d’une inscription active et de son compte de suivi comptable.
Acteurs
Parent, Professeur, Système
Déclencheur
Le Parent soumet une demande d’inscription pour un enfant dans un groupe.
Préconditions
Compte Parent validé ; compte Professeur actif ; groupe ouvert et non complet ; capacité d’abonnement du Professeur disponible ; année académique ouverte ; situation scolaire active de l’élève pour l’année concernée ; l’élève n’est pas déjà inscrit dans ce groupe.
Postconditions
En cas d’acceptation : une inscription ACTIVE existe, une place est consommée dans le groupe, un compte de suivi comptable est créé, le Parent en est notifié. En cas de refus ou d’expiration : la demande est clôturée sans inscription.
Étapes nominales :
Le Parent recherche un groupe et envoie une demande pour l’un de ses enfants (statut EN_ATTENTE).
Le système vérifie automatiquement les préconditions ; si l’une échoue, la demande est immédiatement refusée et notifiée au Parent.
Le Professeur reçoit une notification de la demande.
Le Professeur consulte la demande et les informations du Parent et de l’élève (y compris le comportement de paiement du Parent).
Le Professeur accepte ou refuse :
Acceptation : le système crée l’inscription ACTIVE, consomme la place, crée le compte de suivi comptable, et notifie le Parent. Un tarif personnalisé peut être défini.
Refus : le système clôture la demande (statut REFUSEE) et notifie le Parent.
L’inscription active permet à l’élève de participer aux séances, d’avoir des présences, des commentaires, et génère des écritures comptables.
L’inscription peut être suspendue ou réactivée par le Professeur.
En fin d’année académique ou sur décision du Professeur, l’inscription est archivée (statut ARCHIVEE).
Variantes / exceptions :
Le Parent peut annuler sa demande tant qu’elle est EN_ATTENTE.
Le Professeur dispose d’un délai de 7 jours pour répondre ; passé ce délai, la demande expire automatiquement.
Si le groupe devient complet entre la demande et la décision, l’acceptation est refusée.
L’inscription peut être suspendue pour non-paiement ou à la demande du Professeur, puis réactivée.
Un changement de groupe peut être demandé (voir WF-004bis – Changement de groupe).
Règles métier associées : RM-INS-001 à RM-INS-058, RM-SUB-009, RM-SUB-011, RM-SUB-025, RM-GRP-012, RM-GRP-014, RM-GRP-019
Evènements métier : EVT-INS-001 à EVT-INS-018, EVT-CPT-001
Notifications : NOT-INS-001 à NOT-INS-016
Cas d’erreur : ERR-INS-001 à ERR-INS-032
Objets métier impactés : Enrollment, AccountingAccount, Group, Student, Subscription, Attendance (ultérieurement)


WF-005 — Cycle de vie d’une Séance
Rubrique
Contenu
Code
WF-005
Nom
Cycle de vie d’une séance
Objectif
Gérer la planification, la génération automatique, les modifications, l’annulation et le verrouillage des séances d’un groupe, ainsi que la saisie des présences et l’impact comptable.
Acteurs
Professeur, Système, Parents (information)
Déclencheur
La séance est générée automatiquement à partir du planning hebdomadaire du groupe, ou créée manuellement par le Professeur (séance exceptionnelle).
Préconditions
Le groupe existe et est actif ; un planning hebdomadaire est défini ; l’année académique est ouverte ; l’abonnement du Professeur est actif.
Postconditions
Une séance est créée avec un statut final (PLANIFIEE, EN_COURS, TERMINEE, ANNULEE ou VERROUILLEE). Les présences peuvent être saisies, et des écritures comptables peuvent être générées.
Étapes nominales :
Génération automatique : selon le planning hebdomadaire, le système crée les séances futures jusqu’à la fin de l’année académique.
Modifications : le Professeur peut déplacer, annuler ou créer des séances exceptionnelles. Une séance annulée ne génère pas d’écriture comptable.
Déroulement : le jour de la séance, le Professeur la marque comme EN_COURS puis TERMINEE.
Saisie des présences : dans les 48 heures suivant la séance, le Professeur saisit le statut de chaque élève (PRESENT, ABSENT_EXCUSE, ABSENT_NON_EXCUSE, RETARD).
Facturation : dès validation des présences, le système génère automatiquement les écritures comptables SESSION selon les règles de facturation du groupe.
Verrouillage : 48 heures après la fin de la séance, celle-ci passe en VERROUILLEE ; plus aucune modification n’est autorisée (sauf ajustement exceptionnel par un Administrateur).
Variantes / exceptions :
Le Professeur peut définir des périodes d’interruption (vacances, congés) suspendent la génération des séances.
Une séance peut être reportée à une autre date ; la séance initiale est annulée et une nouvelle séance est créée.
En cas de conflit de planning avec une autre séance du même Professeur, une alerte est générée (non bloquante en Version 1).
Si l’abonnement du Professeur expire ou si aucun élève n’est inscrit, la génération est suspendue.
Une séance annulée ne peut pas être réactivée.
Règles métier associées : RM-SES-001 à RM-SES-047, RM-ATT-001 à RM-ATT-032, RM-CPT-009, RM-CPT-026
Evènements métier : EVT-SES-001 à EVT-SES-026, EVT-ATT-001 à EVT-ATT-018, EVT-CPT-003
Notifications : NOT-SES-001 à NOT-SES-018, NOT-ATT-001 à NOT-ATT-019
Cas d’erreur : ERR-SES-001 à ERR-SES-030, ERR-ATT-001 à ERR-ATT-022
Objets métier impactés : Session, Attendance, AccountingEntry, Payment, Group, Enrollment


WF-006 — Workflow comptable
Rubrique
Contenu
Code
WF-006
Nom
Workflow comptable d’une inscription
Objectif
Assurer le suivi financier des inscriptions en générant des écritures pour les séances facturées et les paiements enregistrés, en maintenant un solde à jour et en déclenchant des alertes en cas de dérive.
Acteurs
Professeur, Parent, Système, Administrateur (pour ajustements exceptionnels)
Déclencheur
Soit la validation des présences d’une séance, soit l’enregistrement d’un paiement par le Professeur.
Préconditions
Pour une facturation : inscription active ; séance terminée et présences validées ; règles de facturation du groupe définies. Pour un paiement : le Professeur a reçu l’argent directement du Parent.
Postconditions
Une écriture comptable (SESSION ou PAYMENT) est créée et rattachée au compte de suivi comptable de l’inscription. Le solde est recalculé. Des notifications et alertes peuvent être générées.
Étapes nominales (facturation) :
Le Professeur saisit les présences d’une séance.
Le système valide les présences (tous les élèves ont un statut).
Pour chaque élève, le système applique les règles de facturation du groupe (présent → facturé ; absent excusé → selon politique ; absent non excusé → selon politique).
Une écriture comptable de type SESSION est créée pour chaque inscription concernée, avec le tarif applicable (personnalisé ou public).
Le solde du compte de suivi comptable est recalculé (Crédits - Débits).
Le Parent reçoit une notification si une nouvelle séance est facturée.
Si le solde débiteur dépasse le seuil d’alerte (4 séances par défaut), une alerte critique est émise vers le Professeur et le Parent.
Étapes nominales (paiement) :
Le Parent paie le Professeur (hors plateforme).
Le Professeur enregistre le paiement dans GROUPI (montant, mode, date, éventuel commentaire).
Le système crée une écriture comptable de type PAYMENT pour le montant indiqué.
Le solde du compte de suivi comptable est recalculé.
Le Parent reçoit une notification de l’enregistrement du paiement.
Variantes / exceptions :
Le Professeur peut modifier ou supprimer un paiement dans les 48 heures suivant son enregistrement (création d’une écriture inverse).
Un ajustement comptable (ADJUSTMENT) peut être créé par le Professeur pour corriger une erreur, dans le délai de 48 heures suivant la séance.
Un ajustement administratif (ADMIN_ADJUSTMENT) peut être effectué par un Administrateur en dehors du délai, pour des corrections exceptionnelles.
En fin d’année académique, le compte de suivi comptable est verrouillé (LOCKED) puis archivé (ARCHIVED).
Règles métier associées : RM-CPT-001 à RM-CPT-040, RM-ATT-007, RM-ATT-008, RM-CAL-001 à RM-CAL-015
Evènements métier : EVT-CPT-001 à EVT-CPT-016, EVT-ATT-014
Notifications : NOT-CPT-001 à NOT-CPT-015
Cas d’erreur : ERR-CPT-001 à ERR-CPT-011
Objets métier impactés : AccountingAccount, AccountingEntry, Payment, Attendance, Session, Enrollment


WF-007 — Workflow d’abonnement
Rubrique
Contenu
Code
WF-007
Nom
Workflow d’abonnement d’un Professeur
Objectif
Permettre au Professeur de souscrire, renouveler, modifier ou voir suspendre son abonnement, et gérer les droits associés.
Acteurs
Professeur, Administrateur (ou Super Administrateur), Système
Déclencheur
Souscription d’un nouvel abonnement (offre Découverte, Intermédiaire ou Pro) par le Professeur, ou échéance de l’abonnement en cours.
Préconditions
Le Professeur a un compte validé ; l’année académique est ouverte ou va s’ouvrir ; le Professeur n’a pas d’autre abonnement actif pour la même année.
Postconditions
Un abonnement est créé avec un statut (PENDING_PAYMENT, ACTIVE, SUSPENDED, EXPIRED, DISABLED, ARCHIVED). Les droits d’accès aux fonctionnalités sont ajustés en conséquence.
Étapes nominales (souscription) :
Le Professeur choisit une offre dans le catalogue (Découverte, Intermédiaire, Pro).
Le système vérifie l’éligibilité (ex: offre Découverte non déjà utilisée) et crée l’abonnement avec le statut PENDING_PAYMENT.
Le paiement est effectué en espèces (Version 1) ; un Administrateur valide manuellement le paiement, l’abonnement passe en ACTIVE.
Les droits correspondant à l’offre sont immédiatement appliqués (capacité, fonctionnalités).
L’abonnement est valable jusqu’à la fin de l’année académique (sauf offre Découverte : 30 jours).
Des rappels automatiques sont envoyés avant l’échéance (J-15, J-7, J-3).
Étapes nominales (renouvellement) :
Le Professeur souscrit un nouvel abonnement pour l’année académique suivante (même offre ou autre).
Le paiement est validé ; un nouvel abonnement est créé, l’ancien est marqué EXPIRED.
Les droits sont actualisés.
Variantes / exceptions :
Si le paiement n’est pas effectué, l’abonnement reste PENDING_PAYMENT jusqu’à expiration (ou annulation).
En cas de non-paiement après la date d’échéance, l’abonnement est suspendu (statut SUSPENDED) ; le Professeur est en mode lecture seule.
Le Professeur peut changer d’offre en cours d’année (passage à une offre supérieure immédiat, retour à une offre inférieure soumis à capacité).
Un add-on (Version 2) peut être souscrit indépendamment.
Règles métier associées : RM-SUB-001 à RM-SUB-026, RM-ABO-001 à RM-ABO-009, RM-PERM-001 à RM-PERM-010
Evènements métier : EVT-SUB-001 à EVT-SUB-007, EVT-ABO-001 à EVT-ABO-006, EVT-PERM-001 à EVT-PERM-005
Notifications : NOT-ABO-001 à NOT-ABO-007, NOT-PERM-001 à NOT-PERM-004
Cas d’erreur : ERR-SUB-001 à ERR-SUB-007, ERR-ABO-001 à ERR-ABO-006, ERR-PERM-001 à ERR-PERM-006
Objets métier impactés : Subscription, SubscriptionPlan, TeacherProfile, User (pour les droits)


WF-008 — Workflow d’une notification
Rubrique
Contenu
Code
WF-008
Nom
Workflow de génération et d’envoi d’une notification
Objectif
Garantir que tout événement important est porté à la connaissance des utilisateurs concernés via le centre d’activités et, si nécessaire, par des canaux externes (email, SMS à terme).
Acteurs
Système, Utilisateurs (destinataires)
Déclencheur
Un évènement métier (EVT-xxx) ou une action utilisateur nécessitant une information ou une alerte.
Préconditions
L’événement a été produit ; les données de l’utilisateur destinataire sont disponibles (email, préférences).
Postconditions
Une notification est enregistrée dans le centre d’activités de l’utilisateur, avec le niveau de priorité approprié ; un email est envoyé pour les notifications importantes et critiques.
Étapes nominales :
Un évènement métier est émis (ex: EVT-INS-001 – nouvelle demande d’inscription).
Le système identifie le ou les utilisateurs concernés par l’événement (destinataires).
Le système détermine le niveau de priorité (INFORMATION, IMPORTANT, CRITIQUE) et le canal de diffusion approprié.
Une activité est créée dans le centre d’activités de chaque destinataire (obligatoire).
Si la priorité est IMPORTANT ou CRITIQUE, une notification est envoyée par email.
L’événement est enregistré dans les logs de notification.
L’utilisateur peut consulter ses notifications, les marquer comme lues, ou les archiver.
Variantes / exceptions :
En cas d’échec d’envoi email, le système tente une nouvelle fois (jusqu’à 3 tentatives) et enregistre l’échec.
Les événements informatifs peuvent être regroupés dans une synthèse quotidienne.
Les notifications critiques font l’objet d’une transmission prioritaire.
En Version 2, l’utilisateur pourra personnaliser ses préférences (activer/désactiver certains types de notifications).
Règles métier associées : RM-NOT-001 à RM-NOT-017, RM-COM-015
Evènements métier : EVT-NOT-001, EVT-NOT-002, EVT-NOT-003, EVT-NOT-004, EVT-NOT-005, EVT-NOT-006
Notifications : (cette workflow génère les notifications listées dans les autres domaines)
Cas d’erreur : ERR-NOT-001 à ERR-NOT-007
Objets métier impactés : Notification, Activity, User, EmailLog (éventuellement)




## CHAPITRE 29 — FEUILLE DE ROUTE ET ÉVOLUTIONS

29.1 Objet
Ce chapitre présente les principales évolutions fonctionnelles envisagées pour les futures versions de GROUPI.
Il ne constitue pas un engagement contractuel mais décrit la vision d’évolution de la plateforme ainsi que les orientations retenues à moyen et long terme.
Ces évolutions respecteront les principes métier définis dans le présent référentiel.

29.2 Philosophie
GROUPI est conçu comme une plateforme évolutive.La version 1 répond aux besoins essentiels des professeurs de cours particuliers tout en préparant les évolutions futures.
Les développements seront réalisés progressivement, sans remettre en cause les principes métier définis dans le présent référentiel.

Version
Période indicatrice
Fonctionnalités principales
1
Lancement
Gestion des groupes, inscriptions, séances, présences, comptabilité, abonnements.
2
12-18 mois après Version 1
IA (assistant pédagogique, détection d’abandon), paiement électronique, liste d’attente, diplômes, calendrier intelligent.
3
24-36 mois après Version 1
Géolocalisation, assistant pédagogique intelligent, analyse comportementale.
4
Au-delà de 36 mois
Marketplace, cours en visioconférence, application élève, API publique, connecteurs.
Ces échéances sont indicatives et pourront être ajustées en fonction des priorités produit et des retours utilisateurs.
Les évolutions de GROUPI sont validées par le comité de pilotage produit. Les priorités sont définies en fonction des retours utilisateurs, des opportunités de marché et de la vision stratégique de GROUPI.
La feuille de route de GROUPI est enrichie en continu par les retours des utilisateurs. Les Professeurs et Parents sont invités à partager leurs suggestions via le centre d’assistance. La feuille de route de GROUPI est régulièrement ajustée en fonction des évolutions du marché des cours particuliers et des offres concurrentes.
Les nouvelles fonctionnalités seront proposées selon les offres d’abonnement en vigueur. Certaines fonctionnalités avancées pourront être proposées sous forme d’Add-ons payants.
Parallèlement aux évolutions fonctionnelles, GROUPI investira dans la performance (temps de réponse), la scalabilité (support d’un nombre croissant d’utilisateurs) et la sécurité (renforcement des mécanismes de protection).
Les évolutions futures devront préserver la compatibilité avec les données historiques des versions précédentes. Aucune nouvelle fonctionnalité ne devra remettre en cause l’intégrité, la traçabilité ou la cohérence des données déjà enregistrées dans GROUPI.
29.3Court terme
La deuxième version de GROUPI enrichira principalement les fonctionnalités existantes.
Intelligence artificielle
L’intelligence artificielle viendra assister le Professeur dans son activité quotidienne.
Assistant administratif :
L’assistant administratif automatise les tâches chronophages.
Fonctionnalité
Description
Génération automatique des séances selon calendrier scolaire
L’IA génère automatiquement les séances du groupe en prenant en compte le calendrier scolaire officiel, les vacances et les jours fériés. Le Professeur n’a plus à saisir manuellement chaque séance.
Détection des risques de retard de paiement
L’IA analyse l’historique des paiements et alerte le Professeur lorsque le comportement de paiement d’un Parent se dégrade, lui permettant d’agir préventivement.
Recommandations d’organisation des groupes
L’IA analyse la demande (préinscriptions, niveaux, matières) et suggère au Professeur une organisation optimale de ses groupes pour la rentrée suivante.

Assistant pédagogique :
L’assistant pédagogique accompagne le Professeur dans son cœur de métier.
Fonctionnalité
Description
Détection automatique des abandons
L’IA analyse les absences, les retards et la participation pour identifier les élèves susceptibles d’abandonner. Elle alerte le Professeur afin qu’il puisse intervenir rapidement.
Analyse de l’assiduité des élèves
L’IA synthétise les données de présence pour fournir une vision claire de l’assiduité de chaque élève, en mettant en évidence les tendances (ex: baisse de présence).
Recommandations pédagogiques
L’IA suggère des actions pédagogiques adaptées à chaque élève en fonction de son profil (progrès, difficultés, assiduité) afin d’améliorer sa progression.
Aide à la rédaction des commentaires
L’IA propose des trames de commentaires pédagogiques personnalisables, à partir des données disponibles (présences, notes, comportement). Le Professeur gagne du temps tout en conservant la maîtrise du contenu final.
Génération de synthèses destinées aux Parents
L’IA produit automatiquement des synthèses claires et structurées à destination des Parents, reprenant les éléments clés du suivi de l’élève.

Assistant décisionnel : 
L’assistant décisionnel aide le Professeur à piloter son activité.
Fonctionnalité
Description
Prévision du chiffre d’affaires prévisionnel
L’IA calcule une projection du chiffre d’affaires à venir en combinant les séances planifiées, le taux de présence historique observé et les tarifs appliqués. Le Professeur peut ainsi anticiper ses revenus.

L’IA restera un outil d’aide à la décision.Le Professeur conservera toujours la décision finale.
Une version future pourra permettre à certains élèves majeurs de disposer d’un espace personnel dédié.
Paiement électronique
La plateforme pourra intégrer plusieurs moyens de paiement.
Exemples :
Carte bancaire ;
Portefeuille électronique ;
Paiement mobile ;
Virements.
Le paiement électronique concernera dans un premier temps exclusivement les abonnements GROUPI.
L’intégration éventuelle des paiements entre Parents et Professeurs fera l’objet d’une décision stratégique ultérieure et pourrait être proposée sous forme d’un service optionnel.
Liste d’attente
Lorsqu’un groupe est complet, les Parents pourront demander à être placés sur une liste d’attente.
Ils seront automatiquement informés lorsqu’une place deviendra disponible.
Vérification des diplômes
Les Professeurs pourront transmettre leurs diplômes.
GROUPI permettra :
Leur dépôt ;
Leur validation ;
Leur affichage sur le profil.
Cette fonctionnalité renforcera la confiance des Parents.
Calendrier intelligent
Le calendrier pourra proposer automatiquement :
Les meilleures dates de rattrapage ;
Des réorganisations de planning ;
Des optimisations d’emploi du temps.
Les fonctionnalités de Version 2 seront priorisées selon les retours utilisateurs, le rapport valeur/effort et les évolutions du marché. L’ordre de livraison pourra être ajusté.Les versions futures permettront également l’ajout d’extensions fonctionnelles (Add-ons) permettant aux Professeurs de personnaliser leur environnement selon leurs besoins.
Une application mobile pour les Parents (consultation des présences, paiements, notifications) est envisagée en Version 2. Une application complète pour tous les acteurs est prévue pour Version3/Version 4.

29.4Moyen terme
La troisième version introduira des services à forte valeur ajoutée.
Géolocalisation
La recherche de groupes pourra s’effectuer selon :
La proximité géographique ;
Le temps de trajet ;
La localisation des établissements scolaires.
Les coordonnées GPS déjà présentes dans les référentiels permettront cette évolution.
Assistant pédagogique intelligent
L’intelligence artificielle deviendra un véritable assistant du Professeur.
Elle pourra notamment :
Détecter les élèves en difficulté ;
Identifier les risques d’abandon ;
Proposer des exercices adaptés ;
Analyser la progression des élèves ;
Suggérer des actions de fidélisation des Parents ;
Recommander des améliorations d’organisation.
Analyse comportementale
GROUPI pourra produire des indicateurs avancés concernant :
Les comportements de paiement ;
L’assiduité ;
Les retards ;
Les abandons ;
La fidélité des familles.
Ces informations aideront le Professeur dans ses décisions.

29.5Long terme
Écosystème éducatif complet
Marketplace de professeurs 
Cours en visioconférence 
Gestion documentaire 
Exercices interactifs 
Application élève 
API publique 
Connecteurs avec les ERP scolaires 
Analyse prédictive avancée

29.6 GROUPI School
Une déclinaison de la plateforme sera développée pour les établissements de soutien scolaire.
GROUPI School pourra gérer :
Plusieurs enseignants 
Plusieurs secrétaires 
Plusieurs administrateurs 
Plusieurs salles 
Plusieurs sites 
Emplois du temps 
Affectation automatique des enseignants 
Comptabilité centralisée 
Statistiques par établissement
Les principes métier resteront identiques à ceux de GROUPI.
GROUPI School nécessitera une extension des modèles de données (Salle, Site, Enseignant, Secrétaire) et des règles de gestion adaptées (comptabilité centralisée, planning multi-enseignants).
Dans les versions futures, un rôle ‘Assistant’ ou ‘Secrétaire’ pourra être créé pour aider les Professeurs dans la gestion administrative.

29.7 Ouverture de la plateforme
À plus long terme, GROUPI pourra proposer :
Une application mobile complète ;
Une API publique sécurisée ;
Des intégrations avec des services tiers ;
Des connecteurs vers des solutions comptables ou pédagogiques.

29.8 Vision
La vocation de GROUPI est de devenir la plateforme de référence pour la gestion des cours particuliers.
Chaque évolution devra respecter les principes fondamentaux de la plateforme :
Simplicité ;
Transparence ;
Traçabilité ;
Sécurité ;
Évolutivité.
Les innovations technologiques viendront enrichir GROUPI sans remettre en cause son fonctionnement métier.

29.9Priorisation des fonctionnalités Version 2
Les fonctionnalités de Version 2 seront livrées par vagues successives, selon l’ordre de priorité suivant :
Liste d’attente : Forte demande des Professeurs, faible complexité technique.
Vérification des diplômes : Renforce la confiance, complexité modérée.
IA de détection d’abandon : Valeur ajoutée forte, complexité technique modérée.
Calendrier intelligent : Améliore l’expérience Professeur, complexité modérée.
IA de rédaction des commentaires : Gain de temps pour les Professeurs, complexité technique élevée.
Paiement électronique : Complexité technique et juridique élevée, nécessite une préparation approfondie.

29.10Formation et accompagnement
Chaque évolution majeure de GROUPI sera accompagnée de :
Vidéos de démonstration des nouvelles fonctionnalités
Tutoriels écrits pas à pas
FAQ dédiée aux nouvelles fonctionnalités
Webinaires de présentation (pour les évolutions majeures)
Support prioritaire pendant la phase de lancement

29.11 Objets métier concernés
AIRecommendation 
WaitingList 
TeacherDiploma 
ElectronicPayment 
AddOn 
School 
Campus 
Classroom 
MobileNotification

29.12Evènements métier
Code
Événement
Description
EVT-ROAD-001
Fonctionnalité Version 2 activée
Une fonctionnalité de la Version 2 est activée
EVT-ROAD-002
Add-on souscrit
Un Professeur souscrit un Add-on
EVT-ROAD-003
Diplôme validé
Un diplôme de Professeur est validé
EVT-ROAD-004
Élève ajouté à une liste d’attente
Un Parent inscrit son enfant sur une liste d’attente
EVT-ROAD-005
Paiement électronique confirmé
Un paiement électronique est confirmé

29.13 Règles métier
Code
Règle
RM-ROAD-001
Les évolutions de GROUPI sont validées par le comité de pilotage produit.
RM-ROAD-002
Les migrations entre versions préservent les données historiques. Les utilisateurs sont informés des évolutions.
RM-ROAD-003
Chaque évolution majeure est accompagnée de supports de formation (vidéos, tutoriels, FAQ).
RM-ROAD-004
Les nouvelles fonctionnalités sont proposées selon les offres d’abonnement en vigueur.
RM-ROAD-005
La feuille de route est enrichie en continu par les retours des utilisateurs.



## CHAPITRE 30 — CONCLUSION
Ce chapitre clôt le référentiel fonctionnel de GROUPI.Il rappelle les principes fondateurs du projet, la portée du document et son rôle comme référence officielle pour toute évolution fonctionnelle de la plateforme.
GROUPI est conçu comme une plateforme complète de gestion des cours particuliers, couvrant l’ensemble du cycle de vie de l’activité d’un Professeur : création de son profil, gestion des groupes, inscriptions, suivi pédagogique, comptabilité, communication avec les Parents et pilotage de son activité.
GROUPI n’a pas vocation à remplacer le Professeur dans ses décisions. La plateforme automatise les tâches administratives, comptables et organisationnelles afin de lui permettre de consacrer davantage de temps à sa mission principale : l’accompagnement pédagogique de ses élèves.
Le projet repose sur trois principes fondamentaux :
Simplicité d’utilisation ;
Transparence des échanges ;
Traçabilité des opérations ;
Cohérence des données ;
Sécurité des informations ;
Évolutivité de la plateforme.
L’architecture retenue permet d’ajouter progressivement de nouvelles fonctionnalités tout en garantissant la stabilité du système.
Le présent référentiel constitue la référence fonctionnelle officielle de GROUPI. Toute évolution, correction ou nouvelle fonctionnalité devra être conçue dans le respect des règles métier, des principes d’architecture et des contraintes fonctionnelles définis dans ce document afin de préserver la cohérence globale de la plateforme.









