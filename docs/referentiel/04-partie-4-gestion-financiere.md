# PARTIE IV - GESTION FINANCIERE (Chapitres 15 a 23 : Moteur comptable, Tableaux de bord, Exports, Notifications, Communication, Changement de groupe, Abonnements, Droits abonnement, Referentiels metier)

PARTIE IV — GESTION FINANCIÈRE

## CHAPITRE 15 — LE MOTEUR COMPTABLE
15.1 Objet
Le présent chapitre définit le fonctionnement du moteur comptable de GROUPI.
Il décrit :
Les comptes de suivi comptables des inscriptions ; 
Les écritures générées par les opérations pédagogiques et financières ; 
Les règles de calcul des soldes ; 
Les indicateurs financiers ; 
Les règles d’historisation des opérations comptables. 
Le moteur comptable garantit la traçabilité complète des mouvements financiers entre les Parents et les Professeurs, sans intervenir dans les transactions.

15.2Principes
GROUPI ne gère jamais les paiements entre les Parents et les Professeurs.Le moteur comptable constitue un registre de suivi permettant au Professeur et au Parent de connaître à tout moment la situation financière de chaque inscription.Toutes les transactions financières continuent d’être réalisées directement entre le Parent et le Professeur.
GROUPI enregistre uniquement les opérations permettant de calculer les soldes et les indicateurs financiers.

15.3 Compte de suivicomptable
Chaque inscription possède son propre compte de suivicomptable.Un compte de suivicomptable est créé automatiquement lors de l’activation d’une inscription.Le compte appartient à l’inscription.
Il ne dépend ni du Parent ni de l’Élève.
Ainsi :
Un même Élève inscrit dans trois groupes possède trois comptes comptables distincts ;
Chaque compte évolue indépendamment selon les paiements et les séances du groupe concerné.

15.4Période comptable
Les écritures comptables sont rattachées à une période comptable.
Une période comptable correspond généralement à une année académique.
Une période possède notamment :
Une date d’ouverture ; 
Une date de clôture ; 
Un état (ouverte, verrouillée, archivée). 
Lorsqu’une période est verrouillée, aucune nouvelle écriture ne peut être créée, modifiée ou annulée, sauf ajustement administratif autorisé.

15.5Principe d’immutabilité
Le moteur comptable de GROUPI repose sur le principe d’immutabilité des écritures comptables.
Une écriture comptable validée n’est jamais supprimée. Toute correction est réalisée par la création d’une ou plusieurs nouvelles écritures permettant de conserver un historique complet des opérations.
Ce principe garantit la traçabilité, l’auditabilité et la reproductibilité des calculs financiers.

15.6 Fonctionnement
Le compte de suivicomptable est constitué d’écritures.Le premier état du compte est :
Total crédits = 0
Total débits = 0
Solde = 0
Chaque écriture possède :
Un identifiant unique ; 
Une date de création ; 
Un montant ; 
Un type ; 
Une inscription ; 
Un auteur ; 
Une référence éventuelle (séance, paiement ou ajustement).
Deux familles d’écritures existent.
Crédit
Correspond aux paiements enregistrés par le Professeur.
Exemple :+100 TND
Débit
Correspond aux séances facturées.
Exemple :-20 TND
Chaque écriture est datée, historisée et rattachée à son inscription.

15.7 Calcul du solde
Le solde est calculé automatiquement.
Solde = Total des crédits − Total des débits
Exemple 1
Opération
Montant
Paiement
+100 TND
Séance
-20 TND
Séance
-20 TND
Séance
-20 TND
Solde : +40 TND
Le Parent dispose d’une avance de quarante dinars.
Exemple 2
Opération
Montant
Paiement
+40 TND
Séances
-60 TND
Solde : -20 TND
Le Parent doit vingt dinars.
Un solde positif représente une avance du Parent.Un solde négatif représente une dette du Parent.
Le solde est recalculé automatiquement après :
Création d’un paiement ;
Modificationd’un paiement ;
Suppression logique d’un paiement (écriture inverse) ;
Validation des présences ;
Correction des présences ;
Ajustement comptable ;
Ajustement administratif.
Un solde débiteur est considéré comme ‘important’ lorsqu’il dépasse l’équivalent de 4 séances au tarif appliqué. Ce seuil est paramétrable dans la création de groupe.

15.8 Types d’écritures
Le moteur comptable distingue plusieurs types d’écritures.
PAYMENT
Paiement enregistré par le Professeur.
SESSION
Facturation automatique d’une séance.
ADJUSTMENT
Ajustement exceptionnel autorisé pendant la période de modification de quarante-huit heures.Chaque écriture conserve son type durant toute sa durée de vie.
La raison du ADJUSTMENT peut être :
Erreur de saisie
Correction de présence
Remise exceptionnelle
Correction administrative

Type
Description
Création
PAYMENT
Paiement enregistré par le Professeur
Manuel
SESSION
Facturation automatique d’une séance
Automatique (validation des présences)
ADJUSTMENT
Ajustement comptable (correction)
Manuel (pendant la fenêtre de 48h)
ADMIN_ADJUSTMENT
Ajustement administratif (hors délai)
Administrateur uniquement

Les écritures doivent avoir un numéro séquentiel de type : ECR-2026-000001.Le numéro est attribué automatiquement lors de la validation de l’écriture et est unique à l’échelle de la plateforme.

15.9 Règles de facturation
Les règles de facturation sont définies au niveau du groupe.
Selon ces règles :
Une présence peut être facturée ;
Une absence excusée peut être facturée ou non ;
Une absence non excusée peut être facturée ou non.
Ces règles sont connues du Parent avant l’inscription.
Le moteur comptable applique automatiquement ces paramètres lors de la validation des présences.
Une écriture SESSION n’est générée qu’après validation définitive des présences.

15.10 Enregistrement des paiements
Le Professeur enregistre manuellement chaque paiement reçu.
GROUPI ne reçoit jamais l’argent.
Dans la version 1, aucun paiement électronique n’est réalisé par la plateforme.
Chaque paiement génère automatiquement une écriture de type PAYMENT.
Le Professeur peut enregistrer des paiements partiels. Chaque paiement est enregistré comme une écriture PAYMENT distincte. Le solde est recalculé après chaque paiement. Les modalités de paiement (échéancier) peuvent être définies à l’inscription.
Les ajustements comptables sont autorisés pendant la fenêtre de 48 heures suivant la séance. Passé ce délai, un ajustement administratif est nécessaire.

15.11 Consultation par le Parent
Le Parent ne peut consulter que les comptes correspondant à ses propres enfants.Le Parent peut consulter la situation financière de chacun de ses enfants.
Pour chaque enfant, GROUPI affiche :
Les groupes suivis ;
Le Professeur ;
La matière ;
Le tarif appliqué ;
Le solde actuel.
Le Parent peut ensuite consulter le détail complet de chaque compte de suivicomptable.

15.12Indicateurs financiers
Le moteur comptable calcule automatiquement plusieurs indicateurs financiers mis à disposition des tableaux de bord de GROUPI.
Ces indicateurs sont recalculés en temps réel après chaque opération susceptible d’avoir un impact sur la situation financière du Professeur.
Ils comprennent notamment :
Chiffre d’affaires prévisionnel
Le chiffre d’affaires prévisionnel est calculé à partir des séances futures planifiées susceptibles de générer une facturation.Il est mis à jour automatiquement à chaque modification de la situation du groupe.
Le prévisionnel est notamment recalculé lorsque :
Une nouvelle séance est créée ;
Une séance future est annulée ou supprimée ;
Une séance est déplacée vers une autre période ;
Une inscription est créée, suspendue ou terminée ;
Un tarif personnalisé est modifié pour des séances futures.
Le chiffre d’affaires prévisionnel constitue un indicateur dynamique reflétant le potentiel de facturation selon les informations actuellement enregistrées dans GROUPI.
Chiffre d’affaires réalisé
Le chiffre d’affaires réalisé correspond aux séances effectivement réalisées et facturées.
Une fois les séances verrouillées, cet indicateur ne peut plus être modifié, sauf dans le cadre d’un ajustement exceptionnel prévu par GROUPI.
Chiffre d’affaires encaissé
Le chiffre d’affaires encaissé correspond exclusivement aux paiements enregistrés par le Professeur.
Il permet de distinguer les montants effectivement perçus des montants restant à encaisser.
Chiffre d’affaires à recevoir
Le chiffre d’affaires à recevoir correspond au chiffre d’affaires réalisé – chiffre d’affaires encaissé.
Solde des comptes
Le moteur comptable calcule également le solde individuel de chaque compte de suivicomptable d’inscription ainsi que les agrégats financiers nécessaires aux tableaux de bord.
15.12.1 Indicateurs du compte
Indicateur
Description
Solde actuel
Solde courant du compte de suivi comptable.
Montant payé
Somme des écritures de type PAYMENT.
Montant facturé
Somme des écritures de type SESSION.
Montant restant à payer
Différence entre le montant facturé et le montant payé lorsque le solde est débiteur.
Nombre de paiements
Nombre de paiements enregistrés.
Montant moyen payé
Moyenne des paiements enregistrés.
Montant moyen facturé
Moyenne des montants facturés par séance.
Nombre de séances facturées
Nombre d’écritures SESSION.
Dernier paiement
Montant du dernier paiement enregistré.
Date du dernier paiement
Date du dernier paiement enregistré.
Nombre de jours depuis le dernier paiement
Nombre de jours écoulés depuis le dernier paiement.
Ancienneté de la dette
Nombre de jours depuis l’apparition d’un solde débiteur non régularisé.
Solde moyen
Moyenne des soldes du compte sur une période donnée.
Évolution du solde
Historique chronologique de l’évolution du solde.
Nombre de jours créditeur
Nombre de jours durant lesquels le compte est resté créditeur.
Nombre de jours débiteur
Nombre de jours durant lesquels le compte est resté débiteur.
Plus forte avance
Solde créditeur maximal atteint depuis la création du compte.
Plus forte dette
Solde débiteur maximal atteint depuis la création du compte.
Nombre total d’ajustements
Nombre total d’écritures d’ajustement (ADJUSTMENT et ADMIN_ADJUSTMENT) enregistrées sur le compte de suivi comptable.
Dernier ajustement
Date et montant du dernier ajustement comptable effectué sur le compte.
Montant total des ajustements
Somme des montants des ajustements comptables appliqués au compte.
Montant total des remises accordées
Total des remises commerciales ou exceptionnelles accordées au Parent sur ce compte.
Nombre de rappels de paiement envoyés
Nombre de notifications de rappel de paiement adressées au Parent pour cette inscription.
Nombre de jours sans mouvement
Nombre de jours écoulés depuis la dernière écriture comptable enregistrée sur le compte.
Nombre de paiements annulés
Nombre de paiements ayant fait l’objet d’une annulation par écriture inverse.
Taux de paiement
Pourcentage du montant facturé qui a déjà été réglé par le Parent pour cette inscription.

15.12.2 Indicateurs du professeur
Indicateur
Description
Chiffre d’affaires prévisionnel
Montant estimé des séances futures susceptibles d’être facturées.
Chiffre d’affaires réalisé
Total des séances effectivement facturées.
Chiffre d’affaires encaissé
Total des paiements enregistrés.
Chiffre d’affaires à recevoir
Différence entre le chiffre d’affaires réalisé et le chiffre d’affaires encaissé.
Nombre de comptes débiteurs
Nombre d’inscriptions présentant une dette.
Nombre de comptes créditeurs
Nombre d’inscriptions présentant une avance.
Solde moyen des comptes
Moyenne des soldes de toutes les inscriptions du Professeur.
Retard moyen de paiement
Retard moyen constaté entre la facturation et les paiements.
Taux d’encaissement
Pourcentage du chiffre d’affaires réalisé effectivement encaissé.
Taux d’impayés
Pourcentage des montants restant à encaisser.
Encours total
Somme totale des montants restant à encaisser.
Plus ancienne dette
Ancienneté de la dette la plus ancienne parmi toutes les inscriptions.
Nombre de paiements du mois
Nombre de paiements enregistrés sur le mois en cours.
Chiffre d’affaires du mois
Chiffre d’affaires réalisé sur le mois en cours.
Chiffre d’affaires de l’année
Chiffre d’affaires réalisé depuis le début de l’année académique.
Nombre de comptes en alerte
Nombre de comptes dont le solde débiteur dépasse le seuil d’alerte défini.
Encours moyen par inscription
Montant moyen restant à encaisser pour l’ensemble des comptes de suivi comptable du Professeur.
Nombre de comptes en risque élevé
Nombre de comptes dont la dette dépasse le seuil d’alerte défini pour le groupe.
Montant moyen des paiements
Moyenne des montants des paiements enregistrés par le Professeur.
Délai moyen d’encaissement
Nombre moyen de jours séparant la facturation d’une séance de son paiement.
Meilleur mois d’encaissement
Mois ayant enregistré le montant total des paiements le plus élevé.
Pire mois d’encaissement
Mois ayant enregistré le montant total des paiements le plus faible.
Taux de régularisation des dettes
Pourcentage des comptes débiteurs ayant retrouvé un solde nul ou créditeur sur une période donnée.
Taux global de paiement
Rapport entre le montant total encaissé et le montant total facturé pour l’ensemble des inscriptions du Professeur.

15.12.3 Indicateurs du groupe
Indicateur
Description
Nombre de séances facturées
Nombre total de séances facturées pour le groupe.
Montant total facturé
Total des montants facturés aux inscriptions du groupe.
Montant total encaissé
Total des paiements enregistrés pour les inscriptions du groupe.
Montant restant à recevoir
Différence entre le montant total facturé et le montant total encaissé.
Nombre de comptes débiteurs
Nombre d’inscriptions du groupe présentant une dette.
Nombre de comptes créditeurs
Nombre d’inscriptions du groupe présentant une avance.
Solde moyen des inscriptions
Moyenne des soldes des comptes de suivi comptable du groupe.
Retard moyen de paiement
Retard moyen de paiement observé pour les inscriptions du groupe.
Taux de paiement du groupe
Pourcentage du montant facturé effectivement payé.
Dette moyenne par inscription
Dette moyenne des comptes débiteurs du groupe.
Avance moyenne par inscription
Avance moyenne des comptes créditeurs du groupe.
Total des dettes
Somme des soldes débiteurs des inscriptions du groupe.
Total des avances
Somme des soldes créditeurs des inscriptions du groupe.
Taux d’encaissement du groupe
Rapport entre le montant encaissé et le montant facturé pour le groupe.
Taux de comptes débiteurs
Pourcentage des comptes de suivi comptable du groupe présentant un solde débiteur.
Taux de comptes créditeurs
Pourcentage des comptes de suivi comptable du groupe présentant un solde créditeur.
Encours moyen par inscription
Montant moyen restant à encaisser pour les inscriptions du groupe.
Paiement moyen par inscription
Moyenne des montants effectivement payés par inscription dans le groupe.
Facturation moyenne par inscription
Moyenne des montants facturés par inscription dans le groupe.
Nombre de comptes en alerte
Nombre d’inscriptions dont le solde débiteur dépasse le seuil d’alerte défini pour le groupe.
Âge moyen des dettes
Nombre moyen de jours d’ancienneté des dettes des inscriptions débiteurs du groupe.

15.13 Historique
Toutes les écritures comptables sont conservées.Aucune écriture n’est supprimée.Même un ajustement crée une nouvelle écriture.
Le moteur comptable historise notamment :
Les paiements ;
Les débits liés aux séances ;
Les ajustements ;
Les modifications autorisées ;
Les dates et auteurs des opérations ;
Date d’effet comptable ;
Ancienne valeur ;
Nouvelle valeur ;
Auteur ;
Date ;
Motif ;
Origine (Mobile / Web) ;
Cette historisation garantit une traçabilité complète des opérations financières réalisées dans GROUPI.
L’indicateur de comportement de paiement du Parent est calculé à partir des données du moteur comptable : respect des délais, nombre d’impayés, etc.

15.14Contraintes d’intégrité
Exemples :
Une écriture appartient à un seul compte ; 
Un compte appartient à une seule inscription ; 
Un paiement ne peut pas être négatif ; 
Une écriture verrouillée est immuable ; 
Un compte archivé est en lecture seule ;
Une écriture possède un montant strictement positif ;
Le type d’une écriture est immuable. 
Ces contraintes sont différentes des règles métier : elles expriment les invariants du modèle.

15.15Glossaire comptable
Les notions utilisées dans le chapitre :
Compte de suivi comptable 
Ecriture comptable 
Ecriture de Débit 
Ecriture de Crédit 
Solde 
Paiement 
Ajustement 
Solde créditeur 
Solde débiteur 
Chiffre d’affaires réalisé 
Chiffre d’affaires encaissé 
Chiffre d’affaires prévisionnel 

15.16Cycle de vie des comptes et des écritures
Comptes
Etat actuel
Etat suivant autorisé
CREATED
ACTIVE
ACTIVE
LOCKED
LOCKED
CLOSED
CLOSED
ARCHIVED
ARCHIVED
—

Etat compte
Description
CREATED
Le compte de suivi comptable vient d’être créé automatiquement lors de l’activation de l’inscription ; aucune écriture n’y est encore enregistrée.
ACTIVE
Le compte enregistre normalement les écritures (paiements, facturations, ajustements) liées à l’inscription.
LOCKED
Le compte est verrouillé à la clôture de la période comptable (fin d’année académique) ; plus aucune nouvelle écriture ne peut y être ajoutée, sauf ajustement administratif exceptionnel.
CLOSED
Le compte est définitivement clôturé, généralement à la clôture de l’inscription correspondante.
ARCHIVED
Le compte est archivé ; il reste consultable mais n’est plus utilisé dans les calculs courants.

Ecritures
Etat actuel
Etat suivant autorisé
CREATED
POSTED
POSTED
REVERSED
REVERSED
LOCKED
LOCKED
—

Etat écriture 
Description
CREATED
Écriture créée mais non encore validée.
POSTED
Écriture validée et prise en compte dans les calculs comptables.
REVERSED
Écriture annulée par une écriture inverse tout en restant historisée.
LOCKED
Écriture définitivement figée et non modifiable.

15.17 Objets métier concernés
Enrollment 
AccountingAccount 
AccountingEntry
Payment 
Session 
Attendance
AdjustmentReason
AccountingBalance
AccountingEntryType
AccountingEntryStatus
AccountingAdjustment
AccountingIndicator
AccountingPeriod
15.18Cas d’erreur
Code
Situation
Résultat attendu
ERR-CPT-001
Paiement négatif
Enregistrement refusé
ERR-CPT-002
Paiement sur inscription archivée
Enregistrement refusé
ERR-CPT-003
Écriture verrouillée
Modification refusée
ERR-CPT-004
Ajustement hors délai
Création refusée
ERR-CPT-005
Paiement supérieur au montant autorisé
Avertissement ou refus
ERR-CPT-006
Inscription inexistante
Opération refusée
ERR-CPT-007
Solde débiteur supérieur au seuil d’alerte
Avertissement au Parent et au Professeur
ERR-CPT-008
Modification d’écriture sur compte verrouillé
Modification refusée
ERR-CPT-009
Paiement sans inscription active
Enregistrement refusé
ERR-CPT-010
Ajustement comptable sans justification
Opération refusée
ERR-CPT-011
Écriture déjà générée pour cette séance.
Opération refusée

15.19Notifications
Code
Notification
Destinataire
Priorité
NOT-CPT-001
Paiement enregistré
Parent
Information
NOT-CPT-002
Paiement modifié
Parent
Important
NOT-CPT-003
Solde débiteur important
Parent, Professeur
Important
NOT-CPT-004
Ajustement comptable effectué
Parent
Important
NOT-CPT-005
Nouvelle séance facturée
Parent
Information
NOT-CPT-006
Solde créditeur important
Parent
Information
NOT-CPT-007
Rappel de paiement automatique
Parent
Important
NOT-CPT-008
Écriture comptable modifiée
Parent
Important
NOT-CPT-009
Compte de suivi comptable verrouillé (fin d’année)
Professeur, Parent
Important
NOT-CPT-010
Solde créditeur important (alerte préventive)
Parent
Information
NOT-CPT-011
Ajustement comptable administratif
Parent
Critique
NOT-CPT-012
CA prévisionnel mis à jour
Professeur
Information
NOT-CPT-013
Paiement supprimé
Parent
Important
NOT-CPT-014
Paiement annulé
Parent
Important
NOT-CPT-015
Compte archivé
Parent
Important

15.20Evènements métier
Code
Événement
Description
EVT-CPT-001
Compte de suivi comptable créé
Un compte de suivi comptable est créé automatiquement lors de l’activation d’une inscription.
EVT-CPT-002
Paiement enregistré
Le Professeur enregistre un paiement reçu pour une inscription.
EVT-CPT-003
Séance facturée
La validation des présences génère automatiquement une écriture comptable de type SESSION.
EVT-CPT-004
Ajustement comptable créé
Une écriture d’ajustement est créée pendant la période de modification autorisée.
EVT-CPT-005
Compte de suivi comptable recalculé
Les totaux du compte de suivi comptable (crédits, débits, solde et indicateurs financiers) sont recalculés automatiquement après toute opération ayant un impact financier.
EVT-CPT-006
Paiement modifié
Un paiement précédemment enregistré est modifié pendant la période autorisée.
EVT-CPT-007
Paiement annulé
Un paiement est annulé par la création d’une écriture inverse afin de préserver la traçabilité comptable.
EVT-CPT-008
Compte de suivi comptable verrouillé
Le compte de suivi comptable devient non modifiable à la clôture de la période comptable ou de l’année académique.
EVT-CPT-009
Ajustement administratif
Un Administrateur réalise un ajustement comptable exceptionnel en dehors de la période normale de modification.
EVT-CPT-010
Écriture comptable créée
Une nouvelle écriture comptable est créée dans un compte (PAYMENT, SESSION, ADJUSTMENT ou ADMIN_ADJUSTMENT).
EVT-CPT-011
Écriture comptable annulée
Une écriture comptable est annulée au moyen d’une écriture inverse, sans suppression de l’écriture d’origine.
EVT-CPT-012
Solde débiteur important détecté
Le solde débiteur d’un compte dépasse le seuil d’alerte défini pour le groupe.
EVT-CPT-013
Solde créditeur important détecté
Le solde créditeur d’un compte dépasse le seuil d’information défini pour le groupe.
EVT-CPT-014
Compte de suivi comptable archivé
Le compte de suivi comptable est archivé à la clôture définitive de l’inscription ou de l’année académique.
EVT-CPT-015
Chiffre d’affaires prévisionnel recalculé
Le chiffre d’affaires prévisionnel est recalculé à la suite d’une modification impactant la facturation future.
EVT-CPT-016
Chiffre d’affaires réalisé recalculé
Le chiffre d’affaires réalisé est recalculé après une modification autorisée des écritures comptables ou des présences.

15.21Règles métier
Code
Règle
RM-CPT-001
Chaque inscription possède son propre compte de suivi comptable.
RM-CPT-002
Un compte de suivi comptable est créé automatiquement lors de l’activation d’une inscription.
RM-CPT-003
Le compte appartient à l’inscription. Il ne dépend ni du Parent ni de l’Élève.
RM-CPT-004
Le compte de suivi comptable est constitué d’écritures.
RM-CPT-005
Une écriture est soit un crédit (paiement), soit un débit (séance facturée).
RM-CPT-006
Le solde est calculé automatiquement selon la formule : Solde = Total des crédits - Total des débits.
RM-CPT-007
Le solde est recalculé automatiquement après chaque création, modification autorisée ou annulation d’écriture.
RM-CPT-008
Les types d’écritures sont : PAYMENT (paiement), SESSION (facturation automatique), ADJUSTMENT (ajustement exceptionnel).
RM-CPT-009
Une écriture SESSION n’est générée qu’après validation définitive des présences.
RM-CPT-010
Les règles de facturation sont définies au niveau du groupe et connues du Parent avant l’inscription.
RM-CPT-011
Le Professeur enregistre manuellement chaque paiement reçu.
RM-CPT-012
GROUPI ne reçoit jamais l’argent. Dans la Version 1, aucun paiement électronique n’est réalisé par la plateforme.
RM-CPT-013
Le Parent ne peut consulter que les comptes correspondant à ses propres enfants.
RM-CPT-014
Le chiffre d’affaires prévisionnel est calculé à partir des séances futures planifiées susceptibles de générer une facturation.
RM-CPT-015
Le chiffre d’affaires réalisé correspond aux séances effectivement réalisées et facturées.
RM-CPT-016
Le chiffre d’affaires encaissé correspond exclusivement aux paiements enregistrés par le Professeur.
RM-CPT-017
Toutes les écritures comptables sont conservées. Aucune écriture n’est supprimée. Un ajustement crée une nouvelle écriture.
RM-CPT-018
Un paiement peut être partiel. Plusieurs paiements partiels peuvent être enregistrés pour la même inscription.
RM-CPT-019
Les ajustements comptables sont autorisés pendant la fenêtre de 48 heures suivant la séance. Passé ce délai, un ajustement administratif est nécessaire.
RM-CPT-020
À la fin de chaque année académique, les comptes sont verrouillés. Aucune modification n’est autorisée sauf ajustement exceptionnel validé par un Administrateur.
RM-CPT-021
L’indicateur de comportement de paiement du Parent est calculé à partir des données du moteur comptable.
RM-CPT-022
Un solde débiteur est considéré comme "important" lorsqu’il dépasse l’équivalent de 4 séances au tarif appliqué.
RM-CPT-023
Les modes de paiement (espèces, chèque, virement, etc.) peuvent être indiqués à titre indicatif lors de l’enregistrement d’un paiement.
RM-CPT-024
Une écriture appartient définitivement à un seul compte de suivi comptable.
RM-CPT-025
Une écriture appartient définitivement à une seule inscription.
RM-CPT-026
Une séance ne peut générer qu’une seule écriture SESSION.
RM-CPT-027
Un paiement ne peut générer qu’une seule écriture PAYMENT.
RM-CPT-028
Une écriture comptable ne peut jamais être supprimée.
RM-CPT-029
L’annulation d’une opération comptable est réalisée par une nouvelle écriture.
RM-CPT-030
Les montants enregistrés sont toujours positifs. Le sens comptable (crédit ou débit) est déterminé par le type d’écriture.
RM-CPT-031
Le solde d’un compte est toujours calculé. Il n’est jamais stocké comme valeur métier de référence.
RM-CPT-032
Toute écriture est horodatée.
RM-CPT-033
Toute écriture possède un auteur.
RM-CPT-034
Toute écriture possède une référence métier.
RM-CPT-035
Une écriture comptable est créée dans l’ordre chronologique de sa date d’effet.
RM-CPT-036
Une écriture ne peut jamais être rattachée à plusieurs comptes de suivi comptable.
RM-CPT-037
Les indicateurs financiers sont calculés exclusivement à partir des écritures comptables validées.
RM-CPT-038
Les écritures doivent avoir un numéro séquentiel de type : ECR-2026-000001.
RM-CPT-039
Chaque paiement génère exactement une écriture comptable de type PAYMENT.
RM-CPT-040
Chaque validation définitive de séance génère exactement une écriture SESSION.

## CHAPITRE 16 — LES TABLEAUX DE BORD
16.1 Objet
Le présent chapitre définit les tableaux de bord mis à disposition des différents utilisateurs de GROUPI.
Il précise les indicateurs affichés, les informations accessibles selon le rôle de l’utilisateur, les mécanismes d’actualisation ainsi que les alertes permettant d’orienter les actions prioritaires.

16.2 Principes
Chaque utilisateur dispose d’un tableau de bord adapté à son rôle.
Le tableau de bord constitue le point d’entrée principal de GROUPI.
Il permet d’accéder rapidement :
Aux informations essentielles ;
Aux indicateurs de suivi ;
Aux alertes ;
Aux actions prioritaires.
Les informations affichées dépendent des autorisations de l’utilisateur.

16.3 Tableau de bord du Professeur
Le tableau de bord du Professeur est organisé autour de plusieurs espaces.
Activité
Le Professeur visualise notamment :
Les groupes actifs ;
Le nombre total d’élèves inscrits ;
Les séances du jour ;
Les prochaines séances ;
Les demandes d’inscription en attente ;
Les demandes de changement de groupe.
Présences
Le tableau de bord affiche notamment :
Les absences du jour ;
Les retards ;
Les élèves fréquemment absents ;
Les alertes d’abandon.
Ces informations permettent au Professeur de détecter rapidement les situations nécessitant une intervention.
Comptabilité
Le tableau de bord présente notamment :
Le chiffre d’affaires prévisionnel du mois en cours ;
Le chiffre d’affaires réalisé ;
Le chiffre d’affaires effectivement encaissé ;
Le montant restant à encaisser ;
Les comptes débiteurs ;
Les comptes créditeurs.
Le chiffre d’affaires prévisionnel est calculé automatiquement à partir :
Des élèves actuellement inscrits ;
Du tarif appliqué à chacun ;
Des séances prévues pour le mois en cours.
Paiements
Le Professeur visualise immédiatement :
Les Parents présentant des retards de paiement ;
Les comptes en solde négatif ;
Les derniers paiements enregistrés.
Groupes
Le tableau de bord présente notamment :
Le taux d’occupation de chaque groupe : nombre d’élèves inscrit / capacité du groupe ;
Les groupes prochainement complets ;
Les groupes complets ;
Les groupes nécessitant de nouveaux élèves.
Profil
GROUPI affiche également :
Le score de complétude du profil ;
Les informations restant à compléter.
Lorsque certaines modifications nécessitent une validation administrative (nouvelle matière ou nouveau niveau), leur état est clairement indiqué.
Statistiques
Les statistiques avancées sont accessibles selon l’abonnement du Professeur.
L’offre Découverte affiche une présentation des fonctionnalités disponibles dans les offres supérieures ainsi qu’une invitation à évoluer vers une formule plus adaptée.
Préinscriptions
Le tableau de bord affiche notamment :
Le nombre de préinscriptions reçues ; 
Les niveaux les plus demandés ; 
Les matières les plus demandées ; 
Les préinscriptions en attente de traitement.
Depuis la section Préinscriptions, le Professeur peut : visualiser les demandes, contacter les Parents, créer un groupe à partir d’une préinscription.
Le Professeur peut exporter son tableau de bord aux formats PDF et Excel, selon les droits associés à son abonnement. L’offre Découverte ne permet pas l’export.
En Version 2, le Professeur pourra personnaliser son tableau de bord en choisissant les indicateurs et widgets affichés (favoris).

16.4 Tableau de bord du Parent
Le Parent dispose d’une vue consolidée de la situation de chacun de ses enfants.
Pour chaque enfant sont notamment affichés :
Les groupes suivis ;
Les prochaines séances ;
Les commentaires pédagogiques ;
Les présences ;
Les retards ;
Les alertes éventuelles.
Le Parent peut également consulter :
Les prochaines séances annulées ;
Les modifications exceptionnelles du planning ;
Les changements de mode d’enseignement ;
Le solde comptable de chaque groupe ;
La situation financière globale de chaque enfant.
Les comptes de suivi comptables restent toujours distincts par groupe.
Signalement d’absence
Avant le début d’une séance, le Parent peut signaler l’absence prévisible de son enfant depuis son tableau de bord. Le statut de Absent excusé ou non excusé est défini selon la politique du groupe définie par le professeur.
Le signalement peut comporter :
Un motif facultatif ;
Un commentaire facultatif.
Le Professeur reçoit immédiatement une notification.
Le signalement ne modifie jamais automatiquement la présence.
Le Professeur reste seul responsable de la validation définitive du statut de présence lors de la séance.
Cette fonctionnalité respecte les règles d’absence définies pour le groupe concerné, notamment les délais de signalement d’une absence excusée.
Lorsque le délai autorisé est dépassé, le signalement n’est plus possible depuis l’application.

16.5 Tableau de bord de l’Administrateur
Le contenu du tableau de bord dépend entièrement des autorisations accordées par le Super Administrateur.
Selon ses droits, l’Administrateur peut notamment consulter :
Le nombre de professeurs actifs ;
Le nombre de parents actifs ;
Le nombre de groupes actifs ;
Les validations en attente ;
Les demandes de modification des profils ;
Les abonnements en cours ;
Les statistiques générales ;
Les référentiels ;
Les alertes administratives.
Selon ses autorisations, il peut également consulter les journaux d’audit relatifs aux opérations relevant de son périmètre.

16.6 Tableau de bord du Super Administrateur
Le Super Administrateur dispose d’une vision complète de l’ensemble de la plateforme.
Son tableau de bord lui permet notamment de consulter :
Les indicateurs globaux d’activité ;
Les comptes utilisateurs ;
Les validations en attente ;
Les abonnements ;
Les statistiques générales ;
Les référentiels.
Il peut également accéder, lorsque cela est nécessaire, aux tableaux de bord des autres utilisateurs.Cet accès s’effectue exclusivement en mode consultation.
Cette fonctionnalité facilite :
L’assistance ;
L’audit ;
La résolution des incidents ;
Le support fonctionnel.
Aucun autre utilisateur ne peut consulter le tableau de bord du Super Administrateur.

16.7 Actualisation
Les tableaux de bord sont mis à jour automatiquement après chaque opération importante.
Sont notamment prises en compte :
Les nouvelles inscriptions ;
Les validations ;
Les présences ;
Les paiements ;
Les écritures comptables ;
Les modifications autorisées des séances.
Les utilisateurs disposent ainsi en permanence d’une vision actualisée de leur activité.
Les tableaux de bord reflètent l’état courant des données enregistrées dans GROUPI.Certains indicateurs statistiques peuvent être recalculés de manière différée afin d’optimiser les performances de la plateforme.

16.8 Alertes
GROUPI met en évidence les situations nécessitant une action rapide.
Exemples :
Demande d’inscription en attente ;
Groupe complet ;
Élève susceptible d’avoir abandonné ;
Compte débiteur important ;
Abonnement arrivant à échéance ;
Profil incomplet ;
Validation administrative en attente.
Les alertes apparaissent directement sur le tableau de bord concerné afin de guider l’utilisateur dans ses priorités.
Les alertes peuvent être classées selon leur niveau de priorité :
Critique ; 
Importante ; 
Informative.

16.9 Objets métier concernés
Dashboard 
TeacherProfile 
ParentProfile 
Enrollment 
AccountingAccount 
AccountingEntry 
Attendance 
Session 
Notification 
Subscription

16.10 Cas d’erreur
Code
Situation
Résultat attendu
ERR-DSH-001
Utilisateur non authentifié
Accès refusé
ERR-DSH-002
Permission insuffisante
Informations masquées
ERR-DSH-003
Tableau indisponible
Message d’information
ERR-DSH-004
Données en cours d’actualisation
Dernière version disponible affichée
ERR-DSH-005
Tentative d’accès à un tableau de bord sans autorisation
Accès refusé
ERR-DSH-006
Données de tableau de bord non disponibles
Message d’attente
ERR-DSH-007
Signalement d’absence hors délai
Signalement refusé

16.11 Notifications
Code
Notification
Destinataire
Priorité
NOT-DSH-001
Nouvelle alerte sur le tableau de bord
Utilisateur concerné
Important
NOT-DSH-002
Alerte résolue
Utilisateur concerné
Information
NOT-DSH-003
Indicateurs clés mis à jour
Utilisateur concerné
Information
NOT-DSH-004
Indicateur clé dépassé (ex: CA prévisionnel en baisse)
Professeur
Importante
NOT-DSH-005
Nouvel indicateur disponible sur le tableau de bord
Utilisateur concerné
Informative
NOT-DSH-006
Dernier délai pour signaler une absence
Parent
Importante

16.12Evènements métier
Code
Événement
Description
EVT-DSH-001
Tableau de bord actualisé
Les indicateurs du tableau de bord sont recalculés
EVT-DSH-002
Alerte générée
Une nouvelle alerte est créée sur le tableau de bord
EVT-DSH-003
Alerte résolue
Une alerte est marquée comme résolue
EVT-DSH-004
Indicateurs recalculés
Les indicateurs statistiques sont recalculés
EVT-DSH-005
Export du tableau de bord
Le Professeur exporte son tableau de bord
EVT-DSH-006
Personnalisation du tableau de bord
Le Professeur personnalise son affichage (Version 2)
EVT-DSH-007
Signalement d’absence depuis le tableau de bord
Le Parent signale une absence via le tableau de bord

16.13 Règles métier
Code
Règle
RM-DSH-001
Chaque utilisateur dispose d’un tableau de bord adapté à son rôle.
RM-DSH-002
Le tableau de bord constitue le point d’entrée principal de GROUPI.
RM-DSH-003
Les informations affichées dépendent des autorisations de l’utilisateur.
RM-DSH-004
Le tableau de bord du Professeur est organisé autour de plusieurs espaces : Activité, Présences, Comptabilité, Paiements, Groupes, Profil, Statistiques, Préinscriptions.
RM-DSH-005
Le tableau de bord du Parent présente une vue consolidée par enfant (groupes, séances, commentaires, présences, retards, solde comptable).
RM-DSH-006
Le Parent peut signaler l’absence prévisible de son enfant avant le début d’une séance.
RM-DSH-007
Le contenu du tableau de bord de l’Administrateur dépend entièrement des autorisations accordées par le Super Administrateur.
RM-DSH-008
Le Super Administrateur dispose d’une vision complète de l’ensemble de la plateforme. Il peut accéder aux tableaux de bord des autres utilisateurs en mode consultation.
RM-DSH-009
Les tableaux de bord sont mis à jour automatiquement après chaque opération importante.
RM-DSH-010
GROUPI met en évidence les situations nécessitant une action rapide (alertes).
RM-DSH-011
Les statistiques avancées sont accessibles à partir de l’offre Intermédiaire. L’offre Découverte affiche une invitation à évoluer.
RM-DSH-012
Le tableau de bord du Professeur peut être exporté aux formats PDF et Excel selon les droits d’abonnement.
RM-DSH-013
Les indicateurs du tableau de bord sont calculés en temps réel. Les statistiques historiques sont recalculées périodiquement.


## CHAPITRE 17 — EXPORTATION DES DONNÉES
17.1 Objet
Le présent chapitre définit les règles d’exportation des données mises à disposition des Professeurs, des administrateurs et du super administrateur.
Il précise les données exportables, les formats disponibles, les restrictions liées aux abonnements ainsi que les règles de sécurité et de traçabilité applicables.

17.2 Principes
GROUPI permet aux utilisateurs autorisés (Professeurs, Parents, Administrateurs et Super Administrateur selon leurs droits) d’exporter certaines données de leur activité. Les fonctionnalités disponibles dépendent du rôle de l’utilisateur ainsi que de son abonnement lorsqu’il s’agit d’un Professeur.

17.3 Objectifs
Les exports permettent notamment :
D’archiver les données ;
D’effectuer des analyses personnelles ;
D’imprimer certains documents ;
De produire des états destinés au suivi administratif.
Les exports ne modifient jamais les données de GROUPI. Ils constituent uniquement une copie des informations sélectionnées.

17.4 Données exportables
Un Professeur ne peut exporter que les données auxquelles il est autorisé à accéder.
Fonctionnalités disponibles selon l’abonnement :
La liste des groupes ;
La liste des élèves ;
Les présences ;
Les retards ;
Les commentaires pédagogiques uniquement dans l’offre Pro ;
Les comptes de suivi comptables ;
Les paiements enregistrés ;
Les statistiques ;
Les indicateurs des tableaux de bord.
De nouveaux types d’export pourront être ajoutés dans les versions futures.
Par contre, il ne peut jamais exporter :
Les données d’un autre Professeur ; 
Les données d’un groupe ne lui appartenant pas ; 
Les informations administratives de GROUPI ; 
Les données réservées aux Administrateurs. 
Les règles d’autorisation appliquées dans GROUPI sont également appliquées lors de chaque export.
Fonction
Découverte
Intermédiaire
Pro
PDF
❌
✔
✔
Excel
❌
✔
✔
CSV
❌
✔
✔
Exports programmés (Version2)
❌
❌
✔

Les Parents peuvent exporter les données de suivi de leurs enfants :
Présences
Commentaires pédagogiques
Comptes de suivi comptables
Historique des paiements
Restrictions
Format : PDF uniquement
Période : année académique en cours ou historique complet
Les données sont organisées par enfant
Les Administrateurs peuvent exporter des données statistiques agrégées pour les besoins de la plateforme, selon les permissions définies par le Super Administrateur. Ces exports sont également tracés dans le journal des exports.
Le super administrateur peut exporter toutes les données disponibles.
Les utilisateurs peuvent demander l’export de leurs données personnelles conformément au droit à la portabilité. Cet export est indépendant des restrictions liées à l’abonnement.Cette demande est traitée par un Administrateur dans un délai de 30 jours. Les données sont fournies dans un format structuré et couramment utilisé.

17.5 Critères de sélection
Avant de lancer un export, l’utilisateur peut préciser différents critères afin de limiter les données exportées aux seules informations utiles.
Selon son rôle et le type d’export demandé, il peut notamment sélectionner :
Un ou plusieurs groupes ; 
Une période ; 
Un élève particulier ; 
Une matière ; 
Un niveau scolaire. 
Les critères proposés sont adaptés aux droits d’accès de l’utilisateur et aux données qu’il est autorisé à exporter.

17.6 Formats disponibles
GROUPI propose plusieurs formats d’export.
Les formats disponibles sont notamment :
PDF : destiné à l’impression ou à l’archivage ;
Microsoft Excel : destiné aux traitements bureautiques ;
CSV : destiné aux traitements informatiques ou à l’import dans d’autres applications.
La liste des formats pourra évoluer dans les futures versions.
Le nom du fichier d’export sera de type : GROUPI_<TypeExport>_<Groupe>_<Date>.xlsx

17.7 Confidentialité
Les exports contiennent des données personnelles. L’utilisateur est responsable de leur utilisation et de leur conservation. GROUPI rappelle que ces documents doivent être protégés conformément à la réglementation applicable. GROUPI ne peut garantir leur confidentialité une fois qu’ils ont quitté la plateforme.

17.8 Journal des exports
Chaque export est automatiquement enregistré dans le journal des exports.
GROUPI conserve notamment :
L’utilisateur ayant réalisé l’export ; 
La date ; 
L’heure ; 
Le type de données exportées ; 
Les critères utilisés ; 
Le format choisi. 
Ce journal permet d’assurer une parfaite traçabilité des opérations d’export.
Le journal des exports est accessible uniquement au Super Administrateur ainsi qu’aux Administrateurs disposant des autorisations nécessaires.

17.9 Intégrité des données
Les fichiers exportés constituent une photographie des données au moment de leur génération. Toute modification ultérieure dans GROUPI n’entraîne aucune modification des fichiers déjà exportés.
Les exports sont donc considérés comme des instantanés de l’activité. Le contenu du fichier est généré au moment du lancement de l’export.Les modifications réalisées après cette génération ne modifient jamais le fichier déjà produit.
Les exports doivent toujours respecter les droits d’accès applicables au moment de leur génération, même si ces droits ont évolué depuis la création des données.
Les exports ne sont jamais indexés ; 
Les liens de téléchargement sont temporaires ; 
Un export ne peut être téléchargé que par son auteur ; 

17.10 Évolutions futures
Les versions futures de GROUPI pourront proposer :
Le Professeur pourra programmer des exports automatiques (quotidiens, hebdomadaires, mensuels). Les fichiers seront envoyés par email ou déposés dans un espace dédié. La programmation est accessible uniquement aux offres Pro;
Le Professeur pourra créer et sauvegarder des modèles d’export (sélection de colonnes, filtres, mise en forme). Ces modèles seront accessibles depuis son espace personnel ;
L’envoi automatique par courrier électronique ;
Des modèles d’export personnalisables ;
L’intégration avec des outils bureautiques ou décisionnels.
Temps de génération
Les exports importants peuvent nécessiter plusieurs secondes ou plusieurs minutes.
GROUPI peut alors :
Générer le fichier en arrière-plan ; 
Informer le Professeur lorsque celui-ci est disponible ; 
Permettre son téléchargement depuis le centre d’activités.
Si le volume de données dépasse 10 000 lignes ou 5 Mo, l’export est réalisé de manière asynchrone. Le seuil est paramétrable par GROUPI.
Ces fonctionnalités dépendront de l’offre d’abonnement souscrite.
Les fichiers d’export générés sont conservés pendant 7 jours sur la plateforme. Passé ce délai, ils sont automatiquement supprimés. Le Professeur doit les télécharger avant cette échéance.

17.11 Objets métier concernés
ExportJob 
ExportTemplate (Version 2)
TeacherProfile 
Group 
Enrollment 
Attendance 
AccountingEntry 
Payment 
ExportAudit 

17.12 Cas d’erreur
Code
Situation
Résultat attendu
ERR-EXP-001
Abonnement ne permettant pas l’export
Export refusé
ERR-EXP-002
Aucune donnée correspondant aux critères
Export vide ou message d’information
ERR-EXP-003
Format de fichier non disponible
Export refusé
ERR-EXP-004
Utilisateur non autorisé
Export refusé
ERR-EXP-005
Volume de données excessif
Export asynchrone avec notification
ERR-EXP-006
Lien de téléchargement expiré
Téléchargement refusé
ERR-EXP-007
Export déjà supprimé
Fichier indisponible
ERR-EXP-008
Export en cours de génération
Téléchargement impossible

17.13 Notifications
Code
Notification
Destinataire
Priorité
NOT-EXP-001
Export demandé en cours de génération
Utilisateur
Information
NOT-EXP-002
Export généré et disponible
Utilisateur
Information
NOT-EXP-003
Export refusé (abonnement insuffisant)
Utilisateur
Important
NOT-EXP-004
Export programmé déclenché (Version 2)
Utilisateur
Information
NOT-EXP-005
Échec de génération d’export
Utilisateur
Critique
NOT-EXP-006
Export expiré
Utilisateur
Information

17.14 Evènements métier
Code
Événement
Description
EVT-EXP-001
Export demandé
Un utilisateur demande un export de données
EVT-EXP-002
Export généré
Le fichier d’export est généré
EVT-EXP-003
Export téléchargé
L’utilisateur télécharge le fichier généré
EVT-EXP-004
Export refusé
L’export est refusé (abonnement insuffisant)
EVT-EXP-005
Export programmé (Version 2)
Un export automatique programmé est déclenché
EVT-EXP-006
Export programmé créé (Version 2)
L’utilisateur crée un export automatique programmé
EVT-EXP-007
Export programmé supprimé (Version 2)
L’utilisateur supprime un export programmé
EVT-EXP-008
Export RGPD demandé
Un utilisateur demande l’export de ses données personnelles
EVT-EXP-009
Export expiré
Le fichier est supprimé automatiquement

17.15 Règles métier
Code
Règle
RM-EXP-001
Les fonctionnalités d’export sont réservées aux offres payantes.
RM-EXP-002
Un Professeur ne peut exporter que les données auxquelles il est autorisé à accéder.
RM-EXP-003
Le Professeur ne peut jamais exporter les données d’un autre Professeur, d’un groupe ne lui appartenant pas, ou les informations administratives de GROUPI.
RM-EXP-004
Les formats disponibles sont : PDF, Excel, CSV.
RM-EXP-005
Le Professeur est seul responsable des fichiers exportés après leur téléchargement.
RM-EXP-006
Chaque export est automatiquement enregistré dans le journal des exports.
RM-EXP-007
Les fichiers exportés constituent une photographie des données au moment de leur génération.
RM-EXP-008
Les fichiers d’export générés sont conservés pendant 7 jours sur la plateforme. Passé ce délai, ils sont automatiquement supprimés.
RM-EXP-009
La limite de volume pour un export synchrone est fixée à 10 000 lignes ou 5 Mo. Au-delà, l’export est généré de manière asynchrone.
RM-EXP-010
Les Parents peuvent exporter les données de suivi de leurs enfants au format PDF uniquement.
RM-EXP-011
Les Administrateurs peuvent exporter des données statistiques agrégées selon leurs autorisations.
RM-EXP-012
Le journal des exports ne contient pas les données exportées elles-mêmes.
RM-EXP-013
Les statistiques avancées peuvent être exportées à partir de l’offre Intermédiaire.
RM-EXP-014
Les exports respectent toujours les droits d’accès applicables au moment de leur génération.
RM-EXP-015
Un lien de téléchargement est personnel, temporaire et ne peut être utilisé que par son auteur.

## CHAPITRE 18 — NOTIFICATIONS ET CENTRE D’ACTIVITÉS

18.1 Objet
Le présent chapitre définit le fonctionnement du centre d’activités et du système de notifications de GROUPI.Il précise les événements générant une activité, les niveaux de priorité, les canaux de diffusion ainsi que les règles de traçabilité des informations communiquées aux utilisateurs.

18.2Principes
GROUPI repose sur une communication proactive.Les utilisateurs ne doivent jamais découvrir une information importante par hasard.Toute action importante réalisée dans GROUPI génère automatiquement une activité.Selon sa nature et son niveau d’importance, cette activité peut également produire une notification.L’objectif est de garantir une information rapide, transparente et traçable.
Toute alerte est une activité, mais toute activité n’est pas nécessairement une alerte.

18.3 Centre d’activités
Chaque utilisateur dispose d’un centre d’activités personnel.Le centre d’activités constitue l’historique chronologique des événements concernant l’utilisateur.
Chaque activité comporte notamment :
Une date ;
Une heure ;
Un type d’événement ;
Un niveau de priorité ;
Un état (lu ou non lu).
Les activités sont classées automatiquement de la plus récente à la plus ancienne.Une activité est systématiquement créée, même lorsqu’aucune notification n’est pas envoyée.

18.4 Activités du Professeur
Le Professeur reçoit notamment des activités concernant :
Une nouvelle demande d’inscription ;
Une demande de changement de groupe ;
Un paiement enregistré ;
Une modification d’un paiement ;
Un abonnement arrivant à échéance ;
La validation de son compte ;
La suspension de son compte ;
Groupe créé ;
Groupe modifié ;
Nouvel élève ajouté ;
Une alerte d’abandon ;
Une modification de présence ;
Une modification de séance ;
Nouvelle préinscription reçue ; 
Préinscription confirmée ; 
Préinscription expirée ; 
Demande d’absence signalée par un Parent ; 
Validation d’une nouvelle matière ; 
Validation d’un nouveau niveau scolaire ;
Le tableau de bord met en évidence les activités nécessitant une action.

18.5 Activités du Parent
Le Parent reçoit notamment des activités concernant :
Une inscription acceptée ;
Enfant ajouté au profil ;
Enfant modifié ;
Situation scolaire mise à jour ;
Une inscription refusée ;
Un commentaire pédagogique ;
Une modification de présence ;
Une modification de facturation ;
Une modification d’une séance ;
Un report de séance ;
Une annulation de séance ;
Nouvelle séance générée ;
Tarif personnalisé modifié ;
Un passage exceptionnel en ligne ;
Une demande de changement de groupe acceptée ou refusée ;
L’enregistrement d’un paiement ;
Ouverture des préinscriptions pour une nouvelle année ; 
Invitation à confirmer une préinscription ; 
Expiration d’une préinscription ; 
Refus automatique pour groupe complet ;
Une validation de préinscription et transformation en inscription.
Chaque activité précise l’enfant concerné lorsqu’un Parent possède plusieurs enfants.

18.6 Niveaux de priorité
GROUPI distingue trois niveaux de priorité.
Information
Simple information.
Exemples :
Nouvelle séance planifiée ;
Paiement enregistré ;
Commentaire pédagogique.
Important
Une action ou une vigilance est recommandée.
Exemples :
Votre enfant est absent ;
Une demande d’inscription est en attente ;
Un groupe est bientôt complet.
Critique
Une action rapide est nécessaire.
Exemples :
Compte suspendu ;
Abonnement expiré ;
Abonnement arrivant à échéance dans trois jours ;
Seuil d’abandon atteint ;
Compte de suivicomptable fortement débiteur.
Les activités critiques sont mises en évidence sur le tableau de bord.
Le niveau de priorité est défini automatiquement par GROUPI selon la nature de l’événement.

18.7 Notifications
Certaines activités donnent lieu à une notification immédiate.Les notifications utilisent le canal de communication configuré par GROUPI.Un même événement ne peut générer qu’une seule notification par canal de communication.Certaines notifications sont obligatoires et ne peuvent jamais être désactivées par l’utilisateur.
Dans la version 1, GROUPI utilise le canal officiel défini par l’administration de la plateforme.
Les versions futures permettront la gestion de plusieurs canaux :
Courrier électronique ;
SMS ;
Notifications mobiles ;
Autres canaux compatibles.

18.8 Canaux de notification
GROUPI utilise plusieurs canaux de communication selon la nature de l’événement.
Dans la version 1, les canaux suivants sont disponibles :
Centre d’activités de l’application (obligatoire) ; 
Courrier électronique (e-mail). 
L’envoi de SMS pourra être ajouté dans une version ultérieure.
Toutes les notifications sont systématiquement enregistrées dans le centre d’activités de l’utilisateur.

18.9 Politique de diffusion
GROUPI adapte automatiquement le canal de notification selon le niveau de priorité.Lorsque plusieurs événements identiques surviennent sur une période de 5 minutes, GROUPI peut les regrouper afin d’éviter une multiplication des notifications.
Informations
Exemples :
Nouvelle séance ; 
Nouveau commentaire ; 
Paiement enregistré. 
Canal utilisé :
Centre d’activités. 
Notifications importantes
Exemples :
Demande d’inscription ; 
Changement de groupe ; 
Modification d’une présence ; 
Modification d’une séance. 
Canaux utilisés :
Centre d’activités ; 
E-mail. 
Notifications critiques
Les notifications critiques concernent les événements susceptibles d’empêcher l’utilisation normale de GROUPI.
Exemples :
Suspension d’un compte ; 
Validation ou refus d’un compte ; 
Expiration imminente d’un abonnement ; 
Désactivation d’un compte ; 
Décision administrative importante ;
Tentative de connexion suspecte ; 
Réinitialisation du mot de passe ; 
Déconnexion forcée ; 
Changement d’adresse e-mail.
Canaux utilisés :
Centre d’activités ; 
E-mail. 
Lorsque le service SMS sera disponible dans une version ultérieure, les notifications critiques pourront également être transmises par SMS selon les paramètres de communication définis par GROUPI.
En Version 2, les utilisateurs pourront personnaliser leurs préférences de notification (activer/désactiver certains types, choisir les canaux). En Version 1, les notifications sont obligatoires.

18.10 Notifications programmées
GROUPI peut générer automatiquement des notifications récurrentes destinées à rappeler les informations importantes aux utilisateurs.
En Version 1, une synthèse quotidienne est générée chaque matin.
Le Professeur reçoit notamment :
Les séances du jour ; 
Les paiements attendus ; 
Les anniversaires éventuels ; 
Les groupes complets ; 
Les élèves absents depuis plusieurs séances. 
Le Parent reçoit notamment :
Les prochaines séances ; 
Les absences signalées ; 
Les paiements à prévoir.

18.11 Historique
Toutes les activités sont conservées.L’utilisateur peut consulter son historique à tout moment.L’utilisateur peut marquer une activité comme lue.Cette opération ne modifie jamais l’historique.Les activités peuvent être archivées mais jamais supprimées.Chaque activité constitue une preuve de l’événement ayant eu lieu.
GROUPI conserve notamment :
La date ;
L’heure ;
L’utilisateur concerné ;
Le type d’événement ;
Son niveau de priorité ;
Son état.
Cette traçabilité participe à la transparence générale de la plateforme.Les notifications envoyées (date, canal, état d’envoi) sont également historisées.


18.12Concepts
Concept
Définition
Exemple
Persistance
Action requise
Activité
Enregistrement systématique d’un événement
"Demande d’inscription reçue"
Historique permanent
Non
Alerte
Activité mise en évidence sur le tableau de bord
"3 demandes en attente"
Temporaire (résolue)
Oui
Notification
Activité diffusée via un canal externe
Email "Demande d’inscription reçue"
Historique + Envoi
Peut être

18.13 Objets métier concernés
Notification 
Activity 
User 
Enrollment 
Session 
Attendance 
Payment 
Subscription

18.14 Cas d’erreur
Code
Situation
Résultat attendu
ERR-NOT-001
Utilisateur inexistant
Notification non créée
ERR-NOT-002
Adresse e-mail invalide
Échec d’envoi enregistré
ERR-NOT-003
Canal indisponible
Notification conservée dans le centre d’activités
ERR-NOT-004
Événement déjà notifié
Aucun doublon envoyé
ERR-NOT-005
Taux d’échec d’envoi de notification élevé
Alerte Administrateur
ERR-NOT-006
Préférences de notification invalides (Version 2)
Modification refusée
ERR-NOT-007
Envoi hors des plages horaires configurées
Envoi différé

18.15Evènementsmétier
Code
Événement
Description
EVT-NOT-001
Activité créée
Une nouvelle activité est créée dans le centre d’activités
EVT-NOT-002
Notification envoyée
Une notification est envoyée à un utilisateur
EVT-NOT-003
Notification consultée
Un utilisateur consulte ses notifications
EVT-NOT-004
Notification archivée
Une notification est marquée comme archivée
EVT-NOT-005
Notification lue
Un utilisateur marque une notification comme lue
EVT-NOT-006
E-mail envoyé
Un e-mail de notification est envoyé

18.16Règles métier
Code
Règle
RM-NOT-001
Toute action importante génère automatiquement une activité.
RM-NOT-002
Une activité peut produire une notification selon sa nature et son niveau d’importance.
RM-NOT-003
Chaque utilisateur dispose d’un centre d’activités personnel.
RM-NOT-004
Une activité est systématiquement créée, même lorsqu’aucune notification n’est envoyée.
RM-NOT-005
Les activités sont classées automatiquement de la plus récente à la plus ancienne.
RM-NOT-006
GROUPI distingue trois niveaux de priorité : Information, Important, Critique.
RM-NOT-007
Un même événement ne peut générer qu’une seule notification par canal de communication.
RM-NOT-008
Dans la Version 1, les canaux disponibles sont : Centre d’activités (obligatoire) et Courrier électronique.
RM-NOT-009
Les notifications critiques sont transmises par Centre d’activités + E-mail.
RM-NOT-010
Les activités peuvent être archivées mais jamais supprimées.
RM-NOT-011
Chaque activité conserve : date, heure, utilisateur concerné, type d’événement, niveau de priorité, état.
RM-NOT-012
Les alertes du tableau de bord sont générées à partir des activités critiques et importantes.
RM-NOT-013
Les événements identiques sont regroupés sur une période de 5 minutes pour les notifications informatives.
RM-NOT-014
Les notifications critiques font l’objet d’une tentative de réenvoi en cas d’échec de délivrance.
RM-NOT-015
En Version 2, les utilisateurs pourront personnaliser leurs préférences de notification. En Version 1, les notifications sont obligatoires.
RM-NOT-016
Les notifications critiques et importantes sont envoyées immédiatement.
RM-NOT-017
Les notifications d’information peuvent être regroupées dans une synthèse quotidienne.



CHAPITRE19— COMMUNICATION ENTRE ACTEURS
19.1 Objet
Le présent chapitre définit les mécanismes de communication mis à disposition des utilisateurs de GROUPI.
Il précise les différents moyens d’échange, leurs règles d’utilisation, leurs niveaux de confidentialité ainsi que leur conservation dans le temps.

19.2 Principes
GROUPI ne se limite pas à la gestion administrative et pédagogique.La plateforme facilite également les échanges entre les différents acteurs, dans le respect des règles de confidentialité et de traçabilité.
Tous les échanges sont historisés et conservés conformément aux règles définies par GROUPI.
Deux mécanismes de communication sont proposés en version 1 :
Le fil de commentaires de l’inscription ;
Les annonces de groupe.
Les nouveaux échanges ne peuvent être créés que pour une inscription active. Les échanges existants restent consultables après la clôture de l’inscription.Aucune messagerie générale ou instantanée n’est proposée dans la version 1.Cette approche garantit la pertinence des échanges et la traçabilité des communications pédagogiques.

19.3 Fil de commentaires de l’inscription
Définition
Chaque inscription possède un fil de commentaires privé.
Ce fil est accessible uniquement par :
Le Professeur responsable du groupe ;
Le Parent de l’élève concerné.
Le fil de commentaires est lié à l’inscription.Il reste accessible même après la clôture de l’inscription.Les commentaires sont présentés dans un ordre chronologique afin de conserver le contexte des échanges entre le Parent et le Professeur.
Commentaires pédagogiques
Ils concernent :
Les progrès ; 
Les difficultés ; 
Les conseils. 
Commentaires administratifs
Ils concernent :
Une absence ; 
Un retard ; 
Une demande particulière ; 
Un changement d’horaire.
Utilisation
Le fil de commentaires permet notamment :
De déposer des commentaires pédagogiques structurés ;
De poser des questions sur le suivi de l’élève ;
D’échanger sur une situation particulière (absences, difficultés, etc.) ;
De fournir un retour personnalisé au Parent.
Statuts des commentaires
Un commentaire peut être :
Rédigé par le Professeur ou le Parent ;
Modifié tant qu’il n’a reçu aucune réponse et dans un délai maximal de 48 heures ; 
Supprimé uniquement dans ces mêmes conditions.
Figé (non modifiable après réponse ou après 48 heures).
Notification
Tout nouveau commentaire génère une notification.
Niveau de priorité : Important
Canal : Centre d’activités + E-mail
Cette notification permet aux deux parties de réagir rapidement sans avoir à consulter constamment la plateforme.
Dans la version 1, les commentaires sont exclusivement textuels. En Version 2, les pièces jointes (documents, images) pourront être ajoutées aux commentaires et aux annonces, dans la limite de 5 Mo par fichier. Les formats autorisés seront : PDF, JPG, PNG, DOCX.

19.4 Annonces de groupe
Définition
Le Professeur peut publier des annonces destinées à l’ensemble des Parents d’un groupe.Chaque annonce est visible par tous les Parents du groupe.Le Parent ne peut pas répondre à une annonce via la plateforme.Les annonces sont exclusivement unidirectionnelles : Professeur → Parents.
Le Professeur peut :
Publier immédiatement ; 
Programmer une publication ; 
Programmer une date d’expiration. 
Par exemple
"L’annonce disparaît automatiquement le 15 septembre."
Utilisation
Les annonces permettent notamment :
D’informer d’un changement de planning ;
De communiquer une date exceptionnelle ;
De partager une information collective ;
De rappeler une règle du groupe.
Cycle de vie d’une annonce
Une annonce peut être :
Créée par le Professeur ;
Publiée immédiatement ou programmée ;
Modifiée tant qu’elle n’a pas été lue par tous les Parents ;
Supprimée (mais l’historique est conservé).
Notification
Toute nouvelle annonce génère une notification.
Niveau de priorité : Important
Canal : Centre d’activités + E-mail
Le Parent peut consulter l’annonce. GROUPI enregistre automatiquement sa date et heure de lecture.Cet indicateur est visible uniquement par le Professeur (ex: "Annonce lue par 8 Parents sur 12").Cette fonctionnalité permet au Professeur de savoir si son message a bien été reçu.
Le Professeur peut consulter :
Le nombre de Parents ayant lu l’annonce ; 
La date de première lecture ; 
La liste des Parents n’ayant pas encore consulté l’annonce.


19.5Communication interdite
Il est interdit :
D’utiliser GROUPI pour diffuser de la publicité ; 
D’envoyer des messages sans lien avec l’activité pédagogique ; 
De publier des contenus offensants, diffamatoires ou illicites ; 
De partager des données personnelles d’autres utilisateurs sans leur accord.

19.6 Confidentialité
Les échanges restent strictement privés.
Le Professeur ne peut pas consulter :
Les commentaires entre un autre Professeur et un Parent ;
Les annonces d’un autre groupe.
Le Parent ne peut pas consulter :
Les commentaires concernant un autre élève ;
Les annonces d’un groupe auquel son enfant n’est pas inscrit.
Cette règle garantit la confidentialité des échanges pédagogiques.Aucun Administrateur ne peut modifier les échanges entre un Professeur et un Parent.
Le Super Administrateur peut uniquement les consulter dans le cadre d’une procédure d’assistance ou d’audit.

19.7Historique et conservation des échanges
Tous les échanges réalisés dans GROUPI sont historisés.
GROUPI conserve notamment :
Les commentaires publiés ; 
Les réponses ; 
Les annonces ; 
Les dates de création ; 
Les éventuelles modifications ; 
Les suppressions logiques ; 
Les dates de lecture des annonces. 
Aucun échange n’est supprimé physiquement.
Les échanges restent associés à l’inscription, même après sa clôture. Ils demeurent consultables par :
Le Professeur responsable ; 
Le Parent concerné ; 
Le Super Administrateur dans le cadre d’une procédure d’assistance ou d’audit. 
Les échanges sont conservés pendant une durée de 7 ans à compter de la clôture de l’inscription, conformément aux obligations légales applicables. À l’issue de cette période, ils peuvent être archivés ou anonymisés conformément à la politique de conservation des données de GROUPI.
Les échanges archivés restent consultables mais ne peuvent plus recevoir de nouveaux commentaires ni de nouvelles réponses.
Cette conservation permet de préserver l’historique pédagogique et administratif de l’inscription, notamment en cas de litige ou de demande d’audit.

19.8 Évolutions futures
Les versions futures pourront enrichir les mécanismes de communication.
Parmi les évolutions envisagées :
Prise de contact avant inscription (Version 2), un Parent pourra contacter un Professeur avant d’effectuer une demande d’inscription via un formulaire sécurisé. L’échange reste limité à 3 messages maximum et est historisé ;
Gestion des pièces jointes (Version 2) ;
Notifications push (Version 2) ;
Modèles de commentaires pédagogiques pourront être proposés (ex: ‘Progrès’, ‘Difficulté’, ‘Objectif’), permettant une meilleure structuration des échanges (Version 2)
Messagerie instantanée pour les situations urgentes (Version 3).
Le Professeur peut publier une annonce destinée :
À tous les Parents du groupe ; 
Uniquement aux Parents des élèves absents ; 
Uniquement aux Parents des élèves concernés par une séance exceptionnelle.
Ces évolutions respecteront toujours les principes de confidentialité et de traçabilité définis par GROUPI.
En Version 2, un mécanisme de signalement des messages inappropriés sera disponible. Le signalement est transmis au Super Administrateur pour analyse.
Règles
Le Parent peut envoyer un message via un formulaire sécurisé
Le Professeur peut répondre
L’échange est limité à 3 messages au total
L’historique est conservé mais n’est pas rattaché à une inscription
Une fois la demande d’inscription validée, l’échange est rattaché à l’inscription
Limites
Pas de pièces jointes
Pas de messagerie instantanée
L’échange est asynchrone et modéré par le Professeur

19.9Objets métier concernés
EnrollmentConversation
GroupAnnouncement 
Enrollment 
Group 
Parent 
TeacherProfile 
Notification 
Activity

19.10Cas d’erreur
Code
Situation
Résultat attendu
ERR-COM-001
Utilisateur non autorisé
Accès refusé
ERR-COM-002
Inscription terminée ou archivée
Nouveau commentaire impossible
ERR-COM-003
Groupe archivé
Annonce impossible
ERR-COM-004
Commentaire figé
Modification refusée
ERR-COM-005
Annonce expirée
Modification interdite
ERR-COM-006
Tentative de consultation d’un fil de commentaires sans autorisation
Accès refusé
ERR-COM-007
Annonce programmée sans date de publication
Publication refusée
ERR-COM-008
Pièce jointe non autorisée (Version 2)
Téléversement refusé
ERR-COM-009
Taille de pièce jointe excessive (Version 2)
Téléversement refusé
ERR-COM-010
Nombre de messages de contact avant inscription dépassé (Version 2)
Message refusé

19.11Notifications
Code
Notification
Destinataire
Priorité
NOT-COM-001
Nouveau commentaire pédagogique
Parent
Important
NOT-COM-002
Réponse à un commentaire
Professeur
Important
NOT-COM-003
Nouvelle annonce de groupe
Parents du groupe
Important
NOT-COM-004
Annonce de groupe mise à jour
Parents du groupe
Important
NOT-COM-005
Annonce de groupe expirée
Professeur
Information
NOT-COM-006
Annonce programmée publiée
Professeur
Information

19.12Evènements métier
Code
Événement
Description
EVT-COM-001
Commentaire créé
Un commentaire est ajouté au fil d’une inscription
EVT-COM-002
Commentaire modifié
Un commentaire est modifié par son auteur
EVT-COM-003
Commentaire supprimé logiquement
Un commentaire est supprimé (conservé dans l’historique)
EVT-COM-004
Annonce publiée
Le Professeur publie une annonce de groupe
EVT-COM-005
Annonce lue par un Parent
Un Parent consulte l’annonce
EVT-COM-006
Annonce expirée
L’annonce arrive à sa date d’expiration
EVT-COM-007
Annonce programmée publiée
Une annonce programmée est automatiquement publiée
EVT-COM-008
Commentaire signalé (Version 2)
Un commentaire est signalé comme inapproprié

19.13Règles métier
Code
Règle
RM-COM-001
Tous les échanges sont historisés et conservés conformément aux règles définies par GROUPI.
RM-COM-002
Les échanges se font exclusivement dans le cadre des groupes et des inscriptions actives.
RM-COM-003
Aucune messagerie générale ou instantanée n’est proposée dans la Version 1.
RM-COM-004
Le fil de commentaires est accessible uniquement par le Professeur et le Parent concerné.
RM-COM-005
Le fil de commentaires est lié à l’inscription. Il reste accessible même après la clôture.
RM-COM-006
Un commentaire peut être modifié tant qu’il n’a reçu aucune réponse et dans un délai maximal de 48 heures.
RM-COM-007
Un commentaire peut être supprimé uniquement dans les mêmes conditions.
RM-COM-008
Les commentaires sont exclusivement textuels dans la Version 1.
RM-COM-009
Les annonces sont exclusivement unidirectionnelles : Professeur → Parents.
RM-COM-010
Le Parent ne peut pas répondre à une annonce via la plateforme.
RM-COM-011
Le Professeur peut consulter le nombre de Parents ayant lu l’annonce.
RM-COM-012
Aucun Administrateur ne peut modifier les échanges entre un Professeur et un Parent.
RM-COM-013
Le Super Administrateur peut uniquement consulter les échanges dans le cadre d’une procédure d’assistance ou d’audit.
RM-COM-014
Aucun échange n’est supprimé physiquement.
RM-COM-015
Les nouveaux commentaires et annonces génèrent une activité dans le centre d’activités.
RM-COM-016
Les échanges sont conservés pendant une durée de 7 ans à compter de la clôture de l’inscription.
RM-COM-017
En Version 2, les pièces jointes (PDF, JPG, PNG, DOCX) seront autorisées dans la limite de 5 Mo par fichier.
RM-COM-018
En Version 2, des modèles de commentaires pédagogiques seront proposés pour structurer les retours.
RM-COM-019
Le tableau de bord affiche le nombre de commentaires non lus ainsi que le nombre d’annonces non consultées.
RM-COM-020
Le Parent peut réagir à une annonce en contactant le Professeur via le fil de commentaires de l’inscription.


## CHAPITRE 20 — CHANGEMENT DE GROUPE
20.1 Objet
Le présent chapitre définit les règles applicables au changement de groupe d’un élève.Il précise les différents types de changement, les validations nécessaires, les impacts pédagogiques et comptables ainsi que la conservation des historiques.

20.2 Principe
Au cours de l’année académique, un élève peut être amené à changer de groupe.
Ce changement peut être motivé notamment par :
Une incompatibilité d’horaires ;
Une évolution du niveau de l’élève ;
Une réorganisation des groupes ;
Une demande du Parent ;
Une proposition du Professeur.
Le changement de groupe ne supprime jamais l’historique de l’élève. Le changement de groupe n’est effectué qu’entre deux groupes du même professeur.
Si le Parent souhaite changer de professeur, il fera une nouvelle demande d’inscription au groupe du nouveau professeur. Il s’agit d’un processus distinct qui ne peut pas être fusionné avec un changement de groupe.
Un changement de groupe n’affecte pas les préinscriptions existantes. Les préinscriptions restent rattachées à l’élève et au Professeur d’origine.

20.3 Initiateur de la demande
Le changement de groupe peut être initié par :
Le Parent ;
Le Professeur.
Lorsque le changement est proposé par le Professeur, le Parent est invité à accepter ou à refuser cette proposition.Dans tous les cas, aucune modification n’est réalisée sans validation des parties concernées.


20.4 Types de changement
GROUPI distingue deux types de changement.
Changement temporaire
L’élève rejoint un autre groupe pour une seule séance.À la fin de cette séance, il réintègre automatiquement son groupe d’origine.L’inscription initiale reste active.
Pendant toute la durée du changement temporaire, l’élève est considéré comme appartenant temporairement au groupe d’accueil, les présences et les écritures comptables sont enregistrées dans le groupe d’accueil.Aucune présence n’est attendue dans le groupe d’origine.
Un changement temporaire ne libère pas de place dans le groupe d’origine sauf pour un autre changement temporaire effectué par un autre parent. Le groupe reste masqué parce que complet.
Changement définitif
L’inscription actuelle est clôturée.L’historique pédagogique et comptable de l’inscription d’origine est conservé. Une nouvelle inscription est créée dans le groupe de destination afin de poursuivre le suivi de l’élève sans altérer les données historiques.
GROUPI vérifie que la capacité de l’abonnement du Professeur est suffisante pour créer une nouvelle inscription dans le groupe de destination.Le changement devient effectif à une date définie.Toutes les séances antérieures restent rattachées au groupe d’origine.Toutes les séances postérieures sont rattachées au groupe d’accueil.
Les séances déjà planifiées dans l’ancien groupe après la date d’effet sont automatiquement annulées pour l’élève concerné. Les séances déjà planifiées dans le nouveau groupe après la date d’effet sont maintenues.
Un changement définitif libère une place dans le groupe d’origine. Si le groupe était masqué parce que complet, il redevient visible automatiquement.
Date d’effet
Le changement n’est pas forcément immédiat.
Exemple :
Aujourd’hui nous sommes mardi.
Le Parent demande un changement.
Le professeur accepte.
Le changement prendra effet lundi prochain.Cela évite de casser le planning en milieu de semaine.
Toute demande de changement comporte une date d’effet.Cette date est définie par le Professeur lors de la validation.Avant cette date, l’élève continue de participer normalement aux séances de son groupe actuel.À compter de cette date, toutes les nouvelles séances sont rattachées au groupe de destination.
Les séances déjà planifiées dans l’ancien groupe après la date d’effet sont automatiquement annulées pour l’élève concerné et celles planifiées dans le nouveau groupe après la date d’effet sont maintenues.

20.5 Validation
Toute demande de changement est soumise au Professeur du groupe concerné.
Le Professeur peut :
Accepter ;
Refuser.
Le Parent est immédiatement informé de la décision.
Lorsque le changement est proposé par le Professeur, le Parent doit également donner son accord avant sa mise en œuvre.En cas de refus, le Professeur peut ajouter un commentaire explicatif. Ce commentaire est inclus dans la notification envoyée au Parent.
Les changements de groupe concernent uniquement des groupes appartenant au même Professeur.

20.6 Vérifications automatiques
Avant de valider un changement, GROUPI vérifie automatiquement :
Que le groupe de destination est actif ;
Que le groupe de destination enseigne la même matière ;
Que le groupe de destination enseigne le même niveau ;
Qu’il reste des places disponibles (Le professeur peut forcer l’acceptation même si le groupe est complet) ;
Que la date d’effet est compatible avec le calendrier des groupes ;
Que le changement est compatible avec les règles de fonctionnement de la plateforme ;
Qu’aucun changement similaire n’est déjà en attente.
Si l’une de ces conditions n’est pas respectée, le changement est refusé.

20.7 Impact pédagogique
Le changement de groupe ne modifie jamais l’historique de l’ancien groupe.
Les éléments suivants restent définitivement associés à l’inscription d’origine :
Les présences ;
Les commentaires pédagogiques ;
Les statistiques ;
Les séances réalisées.
Le nouvel historique débute à compter de la nouvelle inscription.

20.8 Impact comptable
Le compte de suivi comptable de l’inscription d’origine est conservé et clôturé avec cette inscription. Une nouvelle inscription entraîne la création d’un nouveau compte de suivi comptable. Le solde restant éventuel est automatiquement reporté sur le nouveau compte afin d’assurer la continuité du suivi financier de l’élève.

20.9 Notifications possibles
Chaque étape du changement génère automatiquement une activité.
Selon les cas, GROUPI informe :
Le Parent ;
Le Professeur.
Les notifications concernent notamment :
La création de la demande ;
L’acceptation ;
Le refus ;
De la date de début du changement ;
De la date de fin lorsqu’il s’agit d’un changement temporaire.

20.10 Historique
Toutes les demandes de changement sont conservées.
Pour chacune d’elles, GROUPI enregistre notamment :
La date de la demande ;
Son initiateur ;
Le motif de changement ;
Le groupe d’origine ;
Le groupe de destination ;
Le type de changement ;
La décision finale ;
La date d’effet ;
La validation du Parent et du Professeur (selon le cas).
Aucune demande n’est supprimée.Cette conservation garantit une traçabilité complète des parcours des élèves.Les motifs éventuellement renseignés lors de la demande sont également conservés.
GROUPI ne limite pas le nombre de changements par élève. Toutefois, un changement trop fréquent (plus de 3 par année académique) génère une alerte à destination du Professeur.

20.11 Objets métier concernés
Enrollment 
Group 
Student 
TeacherProfile 
AccountingAccount 
Attendance 
Comment 
GroupTransferRequest

20.12 Cas d’erreur
Code
Situation
Résultat attendu
ERR-CHG-001
Groupe de destination complet
Changement refusé
ERR-CHG-002
Groupe archivé
Changement impossible
ERR-CHG-003
Changement déjà en attente
Nouvelle demande refusée
ERR-CHG-004
Date de début invalide
Validation refusée
ERR-CHG-005
Élève déjà présent dans le groupe cible
Changement refusé
ERR-CHG-006
Groupe de destination suspendu
Changement refusé
ERR-CHG-007
Élève avec solde débiteur dans l’ancien groupe
Changement autorisé avec avertissement
ERR-CHG-008
Changement entre Professeurs différents
Changement refusé
ERR-CHG-009
Date d’effet antérieure à la date du jour
Date invalide
ERR-CHG-010
Élève avec solde débiteur important
Changement autorisé avec avertissement
ERR-CHG-011
Nombre de changements excessif (alerte)
Avertissement, changement autorisé
ERR-CHG-012
Annulation de changement hors délai
Annulation refusée
ERR-CHG-013
Changement temporaire demandé sur une séance déjà réalisée
Changement refusé

20.13 Notifications
Code
Notification
Destinataire
Priorité
NOT-CHG-001
Demande de changement de groupe reçue
Professeur
Important
NOT-CHG-002
Demande de changement de groupe acceptée
Parent
Important
NOT-CHG-003
Demande de changement de groupe refusée
Parent
Important
NOT-CHG-004
Changement temporaire effectué
Parent, Professeur
Important
NOT-CHG-005
Changement définitif effectué
Parent, Professeur
Important
NOT-CHG-006
Retour automatique au groupe d’origine
Parent, Professeur
Important
NOT-CHG-007
Date d’effet du changement atteinte
Parent, Professeur
Important
NOT-CHG-008
Changement proposé par le Professeur
Parent
Important
NOT-CHG-009
Proposition de changement acceptée par le Parent
Professeur
Information


20.14Evènements métier
Code
Événement
Description
EVT-CHG-001
Demande de changement créée
Un Parent ou Professeur demande un changement de groupe
EVT-CHG-002
Demande de changement acceptée
Le Professeur accepte le changement
EVT-CHG-003
Demande de changement refusée
Le Professeur refuse le changement
EVT-CHG-004
Changement définitif appliqué
Le changement définitif est effectué
EVT-CHG-005
Retour automatique (temporaire)
L’élève réintègre automatiquement son groupe d’origine
EVT-CHG-006
Changement temporaire appliqué
Le changement temporaire est effectué
EVT-CHG-007
Date d’effet atteinte
La date d’effet du changement est atteinte

20.15Règles métier
Code
Règle
RM-CHG-001
Le changement de groupe ne supprime jamais l’historique de l’élève.
RM-CHG-002
Le changement de groupe peut être initié par le Parent ou le Professeur.
RM-CHG-003
Aucune modification n’est réalisée sans validation des parties concernées.
RM-CHG-004
Le changement temporaire implique un retour automatique au groupe d’origine après la période déterminée.
RM-CHG-005
Pendant le changement temporaire, les présences et les écritures comptables sont enregistrées dans le groupe d’accueil.
RM-CHG-006
Le changement définitif clôture l’inscription actuelle et crée une nouvelle inscription dans le nouveau groupe.
RM-CHG-007
L’historique pédagogique et comptable de l’ancien groupe est définitivement conservé.
RM-CHG-008
Toute demande de changement comporte une date d’effet définie par le Professeur lors de la validation.
RM-CHG-009
Avant la date d’effet, l’élève continue de participer normalement aux séances de son groupe actuel.
RM-CHG-010
Les changements de groupe concernent uniquement des groupes appartenant au même Professeur.
RM-CHG-011
GROUPI vérifie automatiquement les conditions de validation du changement, notamment : - Groupe de destination actif ; - Même matière ; - Niveau compatible ; - Capacité disponible ou dérogation autorisée ; - Date d’effet valide ; - Absence de demande similaire en attente.
RM-CHG-012
Le compte de suivi comptable de l’ancienne inscription est conservé. Une nouvelle inscription entraîne la création d’un nouveau compte de suivi comptable indépendant.
RM-CHG-013
Le solde restant du compte de suivi comptable précédent est automatiquement reporté sur le nouveau compte.
RM-CHG-014
Un changement définitif libère une place dans le groupe d’origine. Si le groupe était masqué, il redevient visible automatiquement.
RM-CHG-015
Un changement temporaire ne libère pas de place dans le groupe d’origine sauf pour un autre changement temporaire effectué par un autre parent. Le groupe reste masqué parce que complet.
RM-CHG-016
Les séances déjà planifiées dans l’ancien groupe après la date d’effet sont automatiquement annulées pour l’élève concerné.
RM-CHG-017
Un changement temporaire est prévu pour une seule séance. L’élève réintègre automatiquement son groupe d’origine à cette date.
RM-CHG-018
GROUPI ne limite pas le nombre de changements par élève. Plus de 3 changements par année académique génèrent une alerte.
RM-CHG-019
Un changement de groupe n’affecte pas les préinscriptions existantes.
RM-CHG-020
GROUPI vérifie la capacité du groupe d’accueil pour le changement temporaire. Si le groupe est complet, le Professeur peut exceptionnellement autoriser le dépassement temporaire de la capacité maximale du groupe pour cette séance. Cette dérogation n’entraîne aucune modification permanente de la capacité du groupe.
RM-CHG-021
Une seule demande de changement de groupe peut être en attente pour une même inscription.


## CHAPITRE 21 — GESTION DES ABONNEMENTS
21.1 Objet
Ce chapitre définit les règles de gestion des abonnements des Professeurs au sein de GROUPI.
Il précise notamment :
Les principes de fonctionnement des abonnements ; 
Les droits associés à chaque offre ; 
Les modalités de souscription, de renouvellement et de suspension ; 
Les conséquences fonctionnelles d’un abonnement actif ou expiré. 

21.2 Principes
Les abonnements concernent exclusivement les Professeurs.
Les Parents utilisent GROUPI gratuitement.
Chaque Professeur doit disposer d’un abonnement actif pour accéder aux fonctionnalités correspondant à son offre.
Les caractéristiques détaillées de chaque abonnement sont définies dans le Catalogue des offres GROUPI, document commercial indépendant du présent référentiel.
Cette séparation permet de faire évoluer les offres sans modifier les règles fonctionnelles de la plateforme.

21.3 Offres disponibles
GROUPI propose plusieurs niveaux d’abonnement.
Chaque offre définit notamment :
Le nombre maximal d’inscriptions actives ;
Les fonctionnalités disponibles ;
Les capacités d’export ;
Les statistiques accessibles ;
Les services complémentaires.
Les intitulés, tarifs et contenus des offres sont définis dans le Catalogue des offres.

21.4 Fonctionnalités liées à l’abonnement
Chaque abonnement ouvre l’accès à un ensemble de fonctionnalités.

Exemples :
Tableaux de bord avancés ;
Statistiques ;
Exports ;
Outils d’analyse ;
Fonctionnalités premium ;
Futures évolutions de GROUPI.
Lorsqu’une fonctionnalité n’est pas disponible dans l’abonnement courant, GROUPI informe le Professeur et lui présente l’offre permettant d’y accéder.

21.5 Durée
Chaque abonnement est rattaché à une seule année académique. Il prend effet à sa date d’activation et expire automatiquement à la fin de l’année académique correspondante, quelle que soit sa date de souscription.
L’offre Découverte constitue une exception. Elle est également rattachée à une année académique, mais sa durée est limitée à 30 jours calendaires à compter de sa date d’activation.
Un Professeur ne peut posséder qu’un seul abonnement actif pour une même année académique.

21.6 Paiement de l’abonnement
Le paiement de l’abonnement est effectué directement auprès de GROUPI.
Dans la version 1 :
Le paiement est réalisé exclusivement en espèces ;
La validation est effectuée manuellement par le Super Administrateur ou par un Administrateur autorisé.
Les versions futures pourront intégrer des moyens de paiement électroniques.

21.7 Renouvellement
À l’approche de l’échéance de son abonnement, GROUPI informe automatiquement le Professeur au moyen de rappels. Le tableau de bord affiche également la durée restante de l’abonnement.
Pour continuer à utiliser GROUPI au-delà de son échéance, le Professeur doit souscrire un nouvel abonnement correspondant à l’année académique suivante. Il peut choisir la même offre ou une offre différente, conformément au Catalogue des offres en vigueur.
Les abonnements ne sont jamais reconduits automatiquement.

21.8 Suspension
En cas de non-paiement de l’abonnement, le Super Administrateur ou un Administrateur autorisé peut suspendre l’abonnement du Professeur.
Le Professeur est immédiatement informé par le canal officiel de communication de GROUPI.
Pendant la suspension :
Les données sont conservées ;
Les groupes restent enregistrés ;
Les historiques sont préservés ;
Aucune nouvelle opération n’est autorisée.
Lorsque le Professeur accède à son compte, une page l’invitant à prendre contact avec l’administration de GROUPI pour régulariser sa situation.

21.9 Réactivation
Après régularisation de la situation, l’abonnement peut être réactivé.La réactivation restitue automatiquement les droits correspondant à l’abonnement actif.Aucune donnée n’est perdue.

21.10 Catalogue des offres
Le détail commercial des abonnements est volontairement séparé du présent référentiel.
Ce catalogue précise notamment :
Les tarifs ;
Les limitations ;
Les fonctionnalités disponibles ;
Les services inclus ;
Les options complémentaires.
Cette organisation permet à GROUPI de faire évoluer son offre commerciale sans remettre en cause son fonctionnement métier.

21.11 Evolutions prévues
À partir de la Version 2, les abonnements pourront être complétés par des Add-ons permettant au Professeur de personnaliser son environnement de travail selon ses besoins.Les Add-ons sont indépendants de l’abonnement principal.Les règles de gestion des Add-ons sont décrites dans le chapitre consacré au modèle économique.

21.12 Objets métier concernés
Subscription 
SubscriptionPlan 
AcademicYear 
TeacherProfile

21.13 Cas d’erreur
Code
Situation
Résultat attendu
ERR-ABO-001
Tentative d’opération avec un abonnement expiré
Opération refusée
ERR-ABO-002
Tentative d’accès à une fonctionnalité non incluse
Accès refusé avec proposition de mise à niveau
ERR-ABO-003
Souscription pour une année académique déjà clôturée
Souscription refusée
ERR-ABO-004
Réactivation sans abonnement valide
Réactivation impossible
ERR-ABO-005
Deuxième abonnement demandé pour la même année
Création refusée
ERR-ABO-006
Add-on incompatible avec l’offre active (Version 2)
Activation refusée

21.14 Notifications
Code
Notification
Destinataire
Priorité
NOT-ABO-001
Abonnement bientôt expiré (J-15)
Professeur
Important
NOT-ABO-002
Abonnement bientôt expiré (J-7)
Professeur
Critique
NOT-ABO-003
Abonnement bientôt expiré (J-3)
Professeur
Critique
NOT-ABO-004
Abonnement expiré
Professeur
Critique
NOT-ABO-005
Abonnement renouvelé avec succès
Professeur
Information
NOT-ABO-006
Abonnement suspendu pour non-paiement
Professeur
Critique
NOT-ABO-007
Abonnement réactivé
Professeur
Important

21.15 Evènements métier
Code
Événement
Description
EVT-ABO-001
Abonnement souscrit
Le Professeur souscrit un abonnement
EVT-ABO-002
Abonnement renouvelé
Abonnement souscrit pour une nouvelle année académique
EVT-ABO-003
Abonnement suspendu
L’abonnement est suspendu (non-paiement)
EVT-ABO-004
Abonnement réactivé
L’abonnement est réactivé après régularisation
EVT-ABO-005
Abonnement arrivé à échéance
L’abonnement expire en fin d’année académique
EVT-ABO-006
Rappel d’échéance envoyé
GROUPI envoie un rappel avant l’expiration

21.16 Règles métier
Code
Règle
RM-ABO-001
Chaque abonnement est obligatoirement rattaché à une seule année académique. L’offre Découverte est également rattachée à une année académique mais expire automatiquement 30 jours calendaires après son activation.
RM-ABO-002
L’abonnement expire automatiquement à la fin de l’année académique correspondante, quelle que soit sa date de souscription à l’exception de l’offre Découverte qui expire automatiquement 30 jours calendaires après son activation.
RM-ABO-003
Un Professeur souhaitant continuer à utiliser GROUPI pour l’année suivante doit souscrire un nouvel abonnement.
RM-ABO-004
Les abonnements ne sont jamais reconduits automatiquement.
RM-ABO-005
Un Professeur ne peut posséder qu’un seul abonnement actif par année académique.
RM-ABO-006
Des rappels automatiques sont envoyés avant l’échéance de l’abonnement.
RM-ABO-007
En cas de non-paiement, le Super Administrateur ou un Administrateur autorisé peut suspendre l’abonnement du Professeur.
RM-ABO-008
Pendant la suspension, les données sont conservées, les groupes restent enregistrés, les historiques sont préservés et aucune nouvelle opération n’est autorisée.
RM-ABO-009
Après régularisation, l’abonnement compte peut-être réactivé. Aucune donnée n’est perdue.


## CHAPITRE 22 — GESTION DES DROITS LIÉS AUX ABONNEMENTS
22.1 Objet
Le présent chapitre définit les règles de contrôle des fonctionnalités accessibles au Professeur selon l’abonnement souscrit.
Il précise notamment :
Les principes généraux de contrôle des droits ; 
Les fonctionnalités soumises à abonnement ; 
Les règles de vérification des autorisations ; 
Le comportement de GROUPI lorsqu’une fonctionnalité n’est pas disponible ; 
Les mécanismes d’évolution des droits. 

22.2 Principes
Les droits d’accès aux fonctionnalités sont déterminés automatiquement à partir de l’abonnement actif du Professeur pour l’année académique en cours.
Avant toute opération soumise à restriction, GROUPI vérifie automatiquement que le Professeur dispose des autorisations nécessaires. Les contrôles d’autorisation sont systématiquement réalisés avant l’exécution de toute fonctionnalité soumise à restriction.

22.3 Fonctionnalités soumises à contrôle
Selon l’abonnement souscrit, les fonctionnalités pouvant être soumises à autorisation comprennent notamment :
Les exports de données ; 
Les statistiques avancées ; 
Les tableaux de bord enrichis ; 
Les outils d’analyse pédagogique ; 
Les fonctionnalités premium ; 
Les futures fonctionnalités optionnelles proposées par GROUPI. 
Cette liste pourra évoluer au fil des versions de la plateforme.

22.4 Vérification des droits
Avant l’exécution d’une fonctionnalité restreinte, GROUPI vérifie notamment :
Qu’un abonnement actif existe pour l’année académique en cours ; 
Que la fonctionnalité est incluse dans l’offre souscrite ; 
Que l’abonnement du Professeur n’est pas suspendu ; 
Que les éventuels modules complémentaires nécessaires sont actifs. 
Si l’une de ces conditions n’est pas satisfaite, l’opération est refusée.
Le Catalogue des offres définit pour chaque offre la liste des fonctionnalités incluses. GROUPI associe chaque fonctionnalité aux droits requis pour son utilisation.
Les fonctionnalités premium sont des fonctionnalités avancées réservées à l’offre Pro. Elles sont définies dans le Catalogue des offres.

22.5 Fonctionnalité indisponible
Lorsqu’un Professeur tente d’utiliser une fonctionnalité non incluse dans son abonnement, GROUPI :
Refuse l’exécution de l’opération ; 
Affiche un message explicatif ; 
Présente l’offre permettant d’accéder à cette fonctionnalité. 
Aucune donnée n’est modifiée.
En Version 2, certains modules complémentaires (Add-ons) peuvent être souscrits indépendamment. Les droits correspondants sont activés dès la souscription et révoqués à l’expiration de l’Add-on.

22.6 Évolution des droits
Toute modification de l’état de l’abonnement (activation, expiration, suspension ou changement d’offre) entraîne automatiquement un recalcul des droits du Professeur. Les nouvelles autorisations sont appliquées immédiatement, sans intervention technique.

22.7 Consultation après expiration
Lorsque l’abonnement est expiré ou suspendu, GROUPI distingue les droits de consultation des droits de modification.
Par défaut :
Fonction
Actif
Expiré (délai de grâce)
Expiré
Suspendu
Connexion
✔
✔
✔
✔
Consultation
✔
✔
✔
✔
Création / Modification
✔
✔
❌
❌
Exports
Selon l’offre
❌
❌
❌

Les droits effectifs pourront évoluer selon les politiques commerciales définies par GROUPI.
Pendant le délai de grâce de 7 jours suivant l’expiration, les droits de modification sont maintenus pour permettre la régularisation. Passé ce délai, l’espace Professeur bascule en mode ‘Lecture seule’.

22.8 Objets métier concernés
Subscription 
SubscriptionPlan 
Feature 
TeacherProfile 

22.9 Cas d’erreur
Code
Situation
Résultat attendu
ERR-PERM-001
Aucun abonnement actif
Fonction refusée
ERR-PERM-002
Fonctionnalité non incluse
Fonction refusée avec proposition de mise à niveau
ERR-PERM-003
Abonnement suspendu
Fonction refusée
ERR-PERM-004
Module complémentaire absent
Fonction refusée
ERR-PERM-005
Tentative d’utilisation d’un Add-on non souscrit (Version 2)
Fonction refusée avec proposition
ERR-PERM-006
Abonnement en délai de grâce --- fonction de modification
Autorisée (temporairement)

22.10 Notifications
Code
Notification
Destinataire
Priorité
NOT-PERM-001
Fonctionnalité indisponible dans l’offre actuelle
Professeur
Information
NOT-PERM-002
Nouveaux droits activés
Professeur
Information
NOT-PERM-003
Droits suspendus
Professeur
Important
NOT-PERM-004
Droits retirés (changement d’offre)
Professeur
Important


22.11Evènements métier
Code
Événement
Description
EVT-PERM-001
Droit accordé
Une fonctionnalité devient disponible
EVT-PERM-002
Droit retiré
Une fonctionnalité devient indisponible
EVT-PERM-003
Contrôle d’autorisation refusé
Une opération est refusée pour insuffisance de droits
EVT-PERM-004
Droits modifiés (changement d’offre)
Les droits sont mis à jour suite à un changement d’offre
EVT-PERM-005
Droits en délai de grâce
Les droits sont maintenus pendant le délai de grâce

22.12 Règles métier
Code
Règle
RM-PERM-001
Les droits sont déterminés exclusivement par l’abonnement actif du Professeur.
RM-PERM-002
Toute fonctionnalité soumise à restriction fait l’objet d’un contrôle d’autorisation avant son exécution.
RM-PERM-003
Une fonctionnalité non incluse dans l’offre est refusée sans modifier les données.
RM-PERM-004
GROUPI informe le Professeur de l’offre permettant d’accéder à une fonctionnalité indisponible.
RM-PERM-005
Les droits sont mis à jour automatiquement lors de l’activation, de l’expiration ou de la suspension d’un abonnement.
RM-PERM-006
L’expiration ou la suspension d’un abonnement n’entraîne jamais la suppression des données du Professeur.
RM-PERM-007
Les droits de consultation peuvent être maintenus après expiration ou suspension selon les règles définies par GROUPI.
RM-PERM-008
Pendant le délai de grâce de 7 jours suivant l’expiration, les droits de modification sont maintenus pour permettre la régularisation.
RM-PERM-009
Les droits des Administrateurs et du Super Administrateur sont déterminés par leur rôle et ne dépendent jamais d’un abonnement.
RM-PERM-010
En Version 2, les Add-ons activent des droits complémentaires révoqués à leur expiration.


## CHAPITRE 23 — LES RÉFÉRENTIELS MÉTIER
23.1 Objet
Ce chapitre définit les référentiels métier utilisés par GROUPI.
Les référentiels constituent les données de référence communes à l’ensemble de la plateforme. Ils garantissent l’uniformité des informations, la cohérence des traitements, le respect des règles métier et la qualité des recherches, des contrôles et des statistiques.
Ils sont utilisés par l’ensemble des fonctionnalités de GROUPI, notamment pour :
La gestion des profils ; 
La création des groupes ; 
Les inscriptions ; 
Les situations scolaires ; 
Les recherches ; 
Les contrôles de cohérence ; 
Les statistiques. 
Les référentiels sont administrés exclusivement par les Administrateurs habilités de GROUPI.

23.2 Principes
GROUPI s’appuie sur plusieurs référentiels métier.
Ces référentiels constituent la base commune utilisée par l’ensemble des utilisateurs.
Ils garantissent :
La cohérence des données ;
L’uniformité des informations ;
Le respect des règles métier ;
La qualité des recherches et des statistiques.
Les référentiels sont exclusivement administrés par les Administrateurs autorisés de GROUPI.
Aucun Professeur ni Parent ne peut créer ou modifier ces données.

23.3 Référentiels disponibles
La version 1 comprend notamment les référentiels suivants :
Matières ;
Niveaux scolaires ;
Établissements scolaires ;
Villes ;
Relations Matière / Niveau (SubjectLevel).
D’autres référentiels pourront être ajoutés dans les versions futures.
Toute nouvelle entrée dans un référentiel (matière, niveau, établissement) est soumise à validation par le Super Administrateur avant d’être activée. Une validation est nécessaire pour garantir la qualité et la cohérence des données.

23.4 Matières
Le référentiel des matières contient la liste officielle des disciplines pouvant être enseignées.
Exemples :
Mathématiques ;
Physique ;
Sciences naturelles ;
Français ;
Anglais ;
Philosophie.
Le Professeur sélectionne ses matières dans cette liste.
Aucune saisie libre n’est autorisée.

23.5 Niveaux scolaires
Le référentiel des niveaux scolaires contient la liste officielle des niveaux pris en charge par GROUPI.
Exemples :
7ᵉ année ;
8ᵉ année ;
9ᵉ année ;
1ʳᵉ année secondaire ;
Bac Sciences ;
Bac Lettres.
Les niveaux sont utilisés dans :
Les profils des Professeurs ;
Les profils des élèves ;
Les groupes ;
Les statistiques.
En cas de modification d’un niveau scolaire (ex: changement de nom), une nouvelle entrée est créée dans le référentiel. L’ancienne entrée est marquée comme inactive. Les données historiques restent rattachées à l’ancienne entrée.

23.6 Établissements scolaires
Le référentiel des établissements contient la liste officielle des établissements scolaires reconnus par GROUPI.
Chaque établissement comporte notamment :
Son nom officiel ;
Son type (collège, lycée, école primaire) ;
Sa ville ;
Son adresse ;
Ses coordonnées géographiques (latitude et longitude).
Les coordonnées GPS ne sont pas exploitées dans la version 1.
Elles sont conservées afin de permettre, dans une version future, la recherche de groupes selon la proximité géographique.Les Parents sélectionnent exclusivement un établissement existant dans ce référentiel.Aucune saisie libre n’est autorisée.
Les Parents peuvent demander l’ajout d’un établissement scolaire via leur espace. La demande est transmise à l’Administrateur. L’Administrateur vérifie l’existence de l’établissement et l’ajoute au référentiel si les conditions sont remplies. Le Parent est informé de la décision.

23.7 Villes
Le référentiel des villes contient la liste officielle des villes utilisées par GROUPI.
Il est notamment utilisé pour :
Les profils des utilisateurs ;
Les établissements scolaires ;
Les recherches de groupes ;
Les statistiques géographiques.

23.8 SubjectLevel
Le référentiel SubjectLevel constitue l’une des règles métier fondamentales de GROUPI.
Il définit les combinaisons autorisées entre les matières et les niveaux scolaires.
Exemple :
Matière
Niveau
Autorisé
Mathématiques
Bac Sciences
✔
Mathématiques
Bac Lettres
✘
Philosophie
Bac Lettres
✔

Lorsqu’un Professeur met à jour les matières et niveaux de son profil ou crée un groupe, GROUPI vérifie automatiquement la compatibilité. 
Toute combinaison interdite est immédiatement refusée.Cette vérification garantit la cohérence pédagogique de l’ensemble de la plateforme.
Le référentiel SubjectLevel constitue la seule source officielle permettant de déterminer les associations autorisées entre les matières et les niveaux scolaires.

23.9 Utilisation des référentiels
Les référentiels interviennent automatiquement dans de nombreuses fonctionnalités.
Ils sont notamment utilisés pour :
La création des profils ;
La création des groupes ;
Les inscriptions ;
Les recherches ;
Les statistiques ;
Les contrôles de cohérence.
Les utilisateurs travaillent ainsi toujours avec des données homogènes.
Les modifications sont historisées pour assurer la traçabilité.

23.10 Évolution des référentiels
Les référentiels peuvent évoluer au fil du temps.
Exemples :
Création d’une nouvelle matière ;
Ajout d’un nouveau niveau scolaire ;
Ouverture d’un nouvel établissement.
Ces évolutions sont réalisées exclusivement par l’un des Administrateurs disposant des autorisations nécessaires et validées par le Super Administrateur.
Toute modification est immédiatement prise en compte pour les nouvelles opérations, sans altérer les données historiques.
Les Administrateurs peuvent exporter les référentiels au format CSV pour des besoins d’audit ou d’analyse.

23.11 Données d’initialisation (Seeds)
Lors du déploiement de GROUPI, les principaux référentiels sont initialisés à partir des données officielles de la plateforme (Seeds).
Ces données constituent la version de référence utilisée par GROUPI.
Les référentiels sont ensuite administrés exclusivement par les Administrateurs autorisés.
Les mises à jour des référentiels sont réalisées selon un mécanisme d’ajout ou de mise à jour (upsert).
Ce mécanisme permet notamment :
D’ajouter de nouvelles données de référence ; 
De mettre à jour certaines informations existantes ; 
De conserver les données déjà utilisées par les historiques de GROUPI. 
Les mises à jour ne doivent jamais entraîner la suppression de données encore référencées par des groupes, des inscriptions ou des historiques pédagogiques.
Lorsqu’une donnée ne doit plus être proposée aux nouveaux utilisateurs, elle est déclarée inactive plutôt que supprimée.
Cette approche garantit :
La cohérence des historiques ; 
La traçabilité des données ; 
La compatibilité avec les évolutions futures de GROUPI. 
Gestion des référentiels obsolètes
Une matière, un niveau scolaire ou un établissement devenu obsolète ne peut pas être supprimé s’il est encore utilisé par des données historiques.
Dans ce cas, GROUPI le rend simplement inactif.
Une donnée inactive :
Reste visible dans les historiques ; 
N’est plus proposée lors des nouvelles créations ; 
Peut être réactivée ultérieurement si nécessaire. 
Cette règle évite un problème classique :
En 2028, le ministère change le nom d’un niveau scolaire.
Si on le supprime :
Les anciens groupes deviennent incohérents ; 
Les statistiques sont cassées ; 
Les historiques ne sont plus compréhensibles. 
Avec le principe upsert + inactivation, on conserve l’intégrité de toutes les données historiques tout en permettant au référentiel d’évoluer. C’est une approche robuste qui sera particulièrement utile lorsque GROUPI sera utilisé sur plusieurs années académiques.
En Version 2, chaque entrée de référentiel pourra être enrichie de métadonnées (codes officiels, identifiants nationaux, etc.) pour faciliter les interopérabilités.

23.12 Objets métier concernés
Subject 
SchoolLevel 
SubjectLevel 
School 
City 
ReferenceData 

23.13Cas d’erreur
Code
Situation
Résultat attendu
ERR-REF-001
Référentiel inexistant
Sélection impossible
ERR-REF-002
Donnée de référence déjà utilisée dans des historiques
Suppression interdite
ERR-REF-003
Duplication de donnée de référence
Création refusée
ERR-REF-004
Référentiel inactif
Utilisation impossible pour les nouvelles créations
ERR-REF-005
Établissement scolaire déjà existant
Ajout refusé
ERR-REF-006
Tentative de suppression d’un référentiel utilisé par des données actives
Suppression refusée
ERR-REF-007
Tentative de modification d’un référentiel sans autorisation
Opération refusée

23.14Notifications
Code
Notification
Destinataire
Priorité
NOT-REF-001
Nouveau référentiel ajouté
Administrateur
Information
NOT-REF-002
Référentiel modifié
Administrateur
Information
NOT-REF-003
Demande d’ajout d’établissement
Administrateur
Important
NOT-REF-004
Demande d’ajout d’établissement acceptée
Parent
Information
NOT-REF-005
Demande d’ajout d’établissement refusée
Parent
Information
NOT-REF-006
Référentiel inactivé
Administrateur
Information

23.15Evènements métier
Code
Événement
Description
EVT-REF-001
Nouvelle entrée de référentiel créée
Une nouvelle entrée est ajoutée dans un référentiel (matière, niveau, établissement ou ville).
EVT-REF-002
Nouvelle entrée de référentiel modifié
Une entrée existante d’un référentiel est modifiée.
EVT-REF-003
Référentiel inactivé
Un référentiel est marqué comme inactif
EVT-REF-004
Référentiel réactivé
Un référentiel inactif est réactivé
EVT-REF-005
Demande d’ajout d’établissement
Un Parent ou Professeur demande l’ajout d’un établissement

23.16Règles métier
Code
Règle
RM-REF-001
Seuls le Super Administrateur et les Administrateurs disposant des permissions spécifiques peuvent modifier les référentiels.
RM-REF-002
Aucun Professeur ni Parent ne peut créer ou modifier les données des référentiels.
RM-REF-003
Le référentiel SubjectLevel définit les combinaisons autorisées entre les matières et les niveaux scolaires.
RM-REF-004
Lorsqu’un Professeur met à jour les matières et niveaux de son profil ou crée un groupe, GROUPI vérifie automatiquement la compatibilité.
RM-REF-005
Toute combinaison interdite est immédiatement refusée.
RM-REF-006
Les mises à jour des référentiels sont réalisées selon un mécanisme d’ajout ou de mise à jour (upsert).
RM-REF-007
Les mises à jour ne doivent jamais entraîner la suppression de données encore référencées par des groupes, des inscriptions ou des historiques.
RM-REF-008
Lorsqu’une donnée ne doit plus être proposée aux nouveaux utilisateurs, elle est déclarée inactive plutôt que supprimée.
RM-REF-009
Une donnée inactive reste visible dans les historiques, n’est plus proposée lors des nouvelles créations, et peut être réactivée ultérieurement.
RM-REF-010
Les établissements scolaires sont rattachés à une ville du référentiel City.
RM-REF-011
Toute nouvelle entrée dans un référentiel est soumise à validation par le Super Administrateur avant activation.
RM-REF-012
Chaque entrée de référentiel possède une date de création, une date de dernière modification et un état (actif/inactif).
RM-REF-013
Les Administrateurs peuvent exporter les référentiels au format CSV pour des besoins d’audit.









