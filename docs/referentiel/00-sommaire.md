# GROUPI - Table des matieres


RÉFÉRENTIEL FONCTIONNEL GROUPI
Version 1.0







Table des matières
PARTIE I — CADRE GÉNÉRAL17
## CHAPITRE 1 — VISION ET PRÉSENTATION DE GROUPI18
1.1 Objet du référentiel18
1.2 Contexte18
1.3 Présentation de GROUPI19
1.4 Mission19
1.5 Vision20
1.6 Objectifs20
1.7 Bénéficiaires20
1.8 Principes fondateurs20
1.9 Valeurs21
1.10 Ce que GROUPI n’est pas21
1.11 Positionnement22
1.12 Périmètre fonctionnel de la Version 122
1.13 Vue d’ensemble métier23
1.14 Cartographie des domaines métier23
## CHAPITRE 2 — CONVENTIONS DE NOMMAGE24
2.1. Objectif24
2.2. Langue utilisée24
2.3. Objets métier24
2.4. Tables de base de données24
2.5. Colonnes25
2.6. Identifiants25
2.7. Énumérations25
2.8. États métier25
2.9. Permissions RBAC25
2.10. Règles métier26
2.11. Workflows26
2.12. Cas d’erreur26
2.13. Règles de calcul26
2.14. Notifications26
2.15. API26
2.16. Variables27
2.17. Classes27
2.18. Fichiers27
2.19. Terminologie officielle27
2.20. Dates et heures28
2.21. Préfixes28
2.22. Conventions de développement28
2.23. Objets métier concernés29
2.24. Cas d’erreur29
2.25. Evènements métier29
2.26. Règles métier30
## CHAPITRE 3 — LES ACTEURS31
3.1 Objet31
3.2 Principes31
3.3 Super Administrateur31
3.4 Administrateur32
3.5 Gestion du cycle de vie d’un Administrateur32
3.6 Professeur32
3.7 Parent33
3.8 Élève33
3.9 Etat des comptes34
3.10 Objets métier concernés34
3.11 Cas d’erreur34
3.12 Règles métier35
## CHAPITRE 4 — MODÈLE ÉCONOMIQUE37
4.1 Objet37
4.2 Principes37
4.3 Les offres d’abonnement37
4.4 Capacité d’abonnement38
4.5 Dépassement de capacité38
4.6 Évolution des abonnements39
4.7 Paiement des abonnements39
4.8 Etat des abonnements39
4.9 Prévention des abus40
4.10 Évolutions du modèle économique40
4.11 Exemples de Add-ons40
4.12 Compatibilité41
4.13 Tarification41
4.14 Objets métier concernés41
4.15 Cas d’erreur41
4.16 Evènements métier42
4.17 Règles métier42
PARTIE II — GESTION DES UTILISATEURS44
## CHAPITRE 5 — LE PROFIL PROFESSEUR45
5.1 Objet45
5.2 Principes45
5.3 Informations obligatoires45
5.4 Vérification des matières et niveaux46
5.5 Score de complétude46
5.6 Visibilité du profil47
5.7 Validation des modifications47
5.8 Évolution du profil48
5.9 Objets métier concernés48
5.10 Cas d’erreur48
5.11 Notifications49
5.12 Evènements métier49
5.13 Règles métier49
## CHAPITRE 6 — LE PROFIL PARENT51
6.1 Objet51
6.2 Principes51
6.3 Création du compte51
6.4 Informations obligatoires51
6.5 Gestion des enfants51
6.6 Cycle de vie d’un profil élève52
6.7 Les établissements scolaires52
6.8 Visibilité52
6.9 Validation du compte52
6.10 Gestion de plusieurs enfants53
6.11 Confidentialité53
6.12 Règles de gestion53
6.13 Évolution du profil53
6.14 Droits des Parents sur leurs données53
6.15 Objets métier concernés54
6.16 Cas d’erreur54
6.17 Notifications54
6.18 Evènements métier55
6.19 Règles métier55
## CHAPITRE 7 — LA SITUATION SCOLAIRE57
7.1 Objet57
7.2 Principes57
7.3 Informations57
7.4 Évolution57
7.5 Historique58
7.6 Utilisation58
7.7 Mise à jour de la situation scolaire en début d’année académique59
7.8 Objets métier concernés59
7.9 Cas d’erreur59
7.10 Notifications60
7.11 Evènements métier60
7.12 Règles métier61
## CHAPITRE 8 — CYCLE DE VIE DES COMPTES63
8.1 Objet63
8.2 Principes63
8.3 Validation des Professeurs64
8.4 Validation des Parents64
8.5 Processus de validation des comptes65
8.6 Suspension65
8.7 Désactivation66
8.8 Demande de suppression d’un compte66
8.9 Archivage (évolution future)67
8.10 Historisation67
8.11 Objets métier concernés67
8.12 Cas d’erreur68
8.13 Notifications68
8.14 Evènements métier69
8.15 Règles métier69
## CHAPITRE 9 — AUTHENTIFICATION, SESSIONS ET SÉCURITÉ72
9.1 Objet72
9.2. Authentification72
9.3. Politique des mots de passe72
9.4. Mot de passe oublié73
9.5. Première connexion73
9.6. Sessions73
9.7. Détection des connexions inhabituelles74
9.8. Partage de compte74
9.9. Authentification à deux facteurs (Version 2)75
9.10. Journal des connexions75
9.11. Déconnexion forcée75
9.12. Verrouillage du compte76
9.13. Sécurité des comptes Administrateur76
9.14 Objets métier concernés76
9.15 Cas d’erreur76
9.16 Notifications77
9.17 Evènements métier78
9.18 Règles métier79
PARTIE III — GESTION PÉDAGOGIQUE82
## CHAPITRE 10 — LES GROUPES83
10.1 Objet83
10.2 Principes83
10.3 Paramètres du groupe83
10.4 Planning du groupe84
10.5 Informations visibles par les Parents85
10.6 Visibilité des groupes complets85
10.7 Tarif de référence GROUPI86
10.8 Tarif public du groupe86
10.9 Tarification personnalisée86
10.10 Duplication d’un groupe87
10.11 Modification d’un groupe88
10.12 Cycle de vie d’un groupe88
10.13 Suppression d’un groupe89
10.14 Indicateurs métier89
10.15 Objets métier concernés89
10.16 Cas d’erreur90
10.17 Notifications91
10.18 Evènements métier91
10.19 Règles métier92
## CHAPITRE 11 — LES PRÉINSCRIPTIONS95
11.1 Objet95
11.2 Principes95
11.3 Période95
11.4 Informations demandées95
11.5 Tableau de bord du Professeur96
11.6 Création des groupes96
11.7 Transformation des préinscriptions96
11.8 Proposition aux parents97
11.9 Confirmation par le parent97
11.10 Expiration97
11.11 Priorité98
11.12 Historique98
11.13 Indicateurs métier98
11.14 Cycle de vie98
11.15 Etats des préinscriptions99
11.16 Objets métier concernés99
11.17 Cas d’erreur100
11.18 Notifications100
11.19 Evènements métier101
11.20 Règles métier102
## CHAPITRE 12 — LES INSCRIPTIONS104
12.1 Objet104
12.2 Principes104
12.3 Recherche d’un groupe104
12.4 Informations disponibles avant inscription105
12.5 Demande d’inscription106
12.6 Vérifications automatiques106
12.7 Décision du Professeur106
12.8 Tarification personnalisée107
12.9 Modes de paiement107
12.10 Compte de suivi comptable108
12.11 États d’une inscription108
12.12 Changement de groupe109
12.13 Historique109
12.14 Indicateurs métier110
12.15 Cycle de vie110
12.16 Etats des inscriptions111
12.17 Objets métier concernés111
12.18 Cas d’erreur111
12.19 Notifications113
12.20 Evènements métier114
12.21 Règles métier115
## CHAPITRE 13 — LES SÉANCES119
13.1 Objet119
13.2 Principes119
13.3 Génération des séances120
13.4 Périodes d’interruption120
13.5 Déroulement d’une séance121
13.6 Modification exceptionnelle du mode d’enseignement121
13.7 Modification d’une séance réalisée121
13.8 Annulation d’une séance prévue122
13.9 Principe d’immuabilité122
13.10 Séances exceptionnelles122
13.11 Historique123
13.12 Statuts de présence123
13.13 Évolutions prévues123
13.14 Indicateurs métier123
13.15 Cycle de vie124
13.16 Etats des séances124
13.17 Objets métier concernés124
13.18 Cas d’erreur125
13.19 Notifications126
13.20 Evènements métier127
13.21 Règles métier128
## CHAPITRE 14 — GESTION DES PRÉSENCES132
14.1 Objet132
14.2 Principes132
14.3 Saisie des présences132
14.4 Statuts de présence132
14.5 Notifications133
14.6 Impact comptable134
14.7 Modification des présences134
14.8 Historique135
14.9 Statistiques135
14.10 Détection d’abandon136
14.11 Registre de présence136
14.12 Cycle de vie136
14.13 Etats des présences137
14.14 Indicateurs métier137
14.15 Objets métier concernés138
14.16 Cas d’erreur138
14.17 Notifications139
14.18 Evènements métier140
14.19 Règles métier141
PARTIE IV — GESTION FINANCIÈRE144
## CHAPITRE 15 — LE MOTEUR COMPTABLE145
15.1 Objet145
15.2 Principes145
15.3 Compte de suivi comptable145
15.4 Période comptable145
15.5 Principe d’immutabilité146
15.6 Fonctionnement146
15.7 Calcul du solde147
15.8 Types d’écritures147
15.9 Règles de facturation148
15.10 Enregistrement des paiements148
15.11 Consultation par le Parent149
15.12 Indicateurs financiers149
15.12.1 Indicateurs du compte150
15.12.2 Indicateurs du professeur151
15.12.3 Indicateurs du groupe152
15.13 Historique153
15.14 Contraintes d’intégrité154
15.15 Glossaire comptable154
15.16 Cycle de vie des comptes et des écritures155
15.17 Objets métier concernés156
15.18 Cas d’erreur156
15.19 Notifications156
15.20 Evènements métier157
15.21 Règles métier158
## CHAPITRE 16 — LES TABLEAUX DE BORD161
16.1 Objet161
16.2 Principes161
16.3 Tableau de bord du Professeur161
16.4 Tableau de bord du Parent163
16.5 Tableau de bord de l’Administrateur164
16.6 Tableau de bord du Super Administrateur164
16.7 Actualisation165
16.8 Alertes165
16.9 Objets métier concernés166
16.10 Cas d’erreur166
16.11 Notifications167
16.12 Evènements métier167
16.13 Règles métier167
## CHAPITRE 17 — EXPORTATION DES DONNÉES169
17.1 Objet169
17.2 Principes169
17.3 Objectifs169
17.4 Données exportables169
17.5 Critères de sélection171
17.6 Formats disponibles171
17.7 Confidentialité171
17.8 Journal des exports171
17.9 Intégrité des données172
17.10 Évolutions futures172
17.11 Objets métier concernés173
17.12 Cas d’erreur173
17.13 Notifications174
17.14 Evènements métier174
17.15 Règles métier174
## CHAPITRE 18 — NOTIFICATIONS ET CENTRE D’ACTIVITÉS176
18.1 Objet176
18.2 Principes176
18.3 Centre d’activités176
18.4 Activités du Professeur176
18.5 Activités du Parent177
18.6 Niveaux de priorité178
18.7 Notifications179
18.8 Canaux de notification179
18.9 Politique de diffusion179
18.10 Notifications programmées181
18.11 Historique181
18.12 Concepts182
18.13 Objets métier concernés182
18.14 Cas d’erreur182
18.15 Evènements métier183
18.16 Règles métier183
## CHAPITRE 19 — COMMUNICATION ENTRE ACTEURS185
19.1 Objet185
19.2 Principes185
19.3 Fil de commentaires de l’inscription185
19.4 Annonces de groupe186
19.5 Communication interdite188
19.6 Confidentialité188
19.7 Historique et conservation des échanges188
19.8 Évolutions futures189
19.9 Objets métier concernés190
19.10 Cas d’erreur190
19.11 Notifications191
19.12 Evènements métier191
19.13 Règles métier191
## CHAPITRE 20 — CHANGEMENT DE GROUPE193
20.1 Objet193
20.2 Principe193
20.3 Initiateur de la demande193
20.4 Types de changement194
20.5 Validation195
20.6 Vérifications automatiques195
20.7 Impact pédagogique195
20.8 Impact comptable196
20.9 Notifications possibles196
20.10 Historique196
20.11 Objets métier concernés197
20.12 Cas d’erreur197
20.13 Notifications198
20.14 Evènements métier198
20.15 Règles métier199
## CHAPITRE 21 — GESTION DES ABONNEMENTS201
21.1 Objet201
21.2 Principes201
21.3 Offres disponibles201
21.4 Fonctionnalités liées à l’abonnement201
21.5 Durée202
21.6 Paiement de l’abonnement202
21.7 Renouvellement202
21.8 Suspension203
21.9 Réactivation203
21.10 Catalogue des offres203
21.11 Evolutions prévues203
21.12 Objets métier concernés204
21.13 Cas d’erreur204
21.14 Notifications204
21.15 Evènements métier204
21.16 Règles métier205
## CHAPITRE 22 — GESTION DES DROITS LIÉS AUX ABONNEMENTS206
22.1 Objet206
22.2 Principes206
22.3 Fonctionnalités soumises à contrôle206
22.4 Vérification des droits206
22.5 Fonctionnalité indisponible207
22.6 Évolution des droits207
22.7 Consultation après expiration207
22.8 Objets métier concernés208
22.9 Cas d’erreur208
22.10 Notifications208
22.11 Evènements métier209
22.12 Règles métier209
## CHAPITRE 23 — LES RÉFÉRENTIELS MÉTIER210
23.1 Objet210
23.2 Principes210
23.3 Référentiels disponibles210
23.4 Matières211
23.5 Niveaux scolaires211
23.6 Établissements scolaires212
23.7 Villes212
23.8 SubjectLevel212
23.9 Utilisation des référentiels213
23.10 Évolution des référentiels213
23.11 Données d’initialisation (Seeds)214
23.12 Objets métier concernés215
23.13 Cas d’erreur215
23.14 Notifications215
23.15 Evènements métier216
23.16 Règles métier216
PARTIE V — RÈGLES FONCTIONNELLES218
## CHAPITRE 24 — RÈGLES TRANSVERSALES219
24.1 Objet219
24.2 Gestion du temps219
24.3 Année académique219
24.4 Historisation219
24.5 Archivage220
24.6 Suppression220
24.7 Traçabilité220
24.8 Notifications221
24.9 Recalcul automatique221
24.10 Verrouillage des données221
24.11 Confidentialité222
24.12 Intégrité référentielle222
24.13 Atomicité des opérations222
24.14 Objets métier concernés223
24.15 Cas d’erreur223
24.16 Evènements métier223
24.17 Règles métier224
## CHAPITRE 25 — RÈGLES DE CALCUL225
25.1 Objet225
25.2 Principes225
25.3 Solde comptable225
25.4 Taux d’assiduité225
25.5 Nombre d’absences consécutives226
25.6 Taux d’occupation d’un groupe226
25.7 Nombre de places disponibles226
25.8 Score de complétude du profil226
25.9 Comportement de paiement227
25.10 Solde global d’un Parent227
25.11 Chiffre d’affaires prévisionnel227
25.12 Chiffre d’affaires encaissé228
25.13 Chiffre d’affaires facturé228
25.14 Tarif appliqué228
25.15 Statistiques228
25.16 Objets métier concernés229
25.17 Cas d’erreur229
25.18 Evènements métier230
25.19 Règles métier230
## CHAPITRE 26 — RÈGLES MÉTIER GÉNÉRALES232
26.1 Objet232
26.2 Unicité des comptes232
26.3 Validation des utilisateurs232
26.4 Séparation des responsabilités232
26.5 Intégrité pédagogique233
26.6 Intégrité comptable233
26.7 Immuabilité des données233
26.8 Délai de correction des séances234
26.9 Traçabilité234
26.10 Confidentialité234
26.11 Notifications235
26.12 Évolutivité235
26.13 Modifications des règles métier générales235
26.14 Protection des données personnelles236
26.15 Objets métier concernés236
26.16 Cas d’erreur236
26.17 Evènements métier237
26.18 Règles métier237
## CHAPITRE 27 — ARCHITECTURE METIER239
27.1 Objet239
27.2 Principes239
27.3 Domaine Utilisateurs240
27.4 Domaine Pédagogique240
27.5 Domaine Comptable241
27.6 Domaine commercial241
27.7 Domaine Communication242
27.8 Domaine Référentiels242
27.9 Domaine Pilotage242
27.10 Domaine Administration243
27.11 Collaboration entre les domaines243
27.12 Dépendances entre domaines244
27.13 Évolutivité245
27.14 Objets métier concernés245
27.15 Cas d’erreur246
27.16 Evènements métier246
27.17 Règles métier246
## CHAPITRE 28 — WORKFLOWS MÉTIER248
## CHAPITRE 29 — FEUILLE DE ROUTE ET ÉVOLUTIONS259
29.1 Objet259
29.2 Philosophie259
29.3 Court terme260
29.4 Moyen terme262
29.5 Long terme263
29.6 GROUPI School263
29.7 Ouverture de la plateforme264
29.8 Vision264
29.9 Priorisation des fonctionnalités Version 2264
29.10 Formation et accompagnement265
29.11 Objets métier concernés265
29.12 Evènements métier265
29.13 Règles métier265
## CHAPITRE 30 — CONCLUSION267
PARTIE VI — ANNEXES DE RÉFÉRENCE268
## Annexe A — Lexique métier269
A.1 Objet269
A.2 Concepts métier269
A.3 Objets métier285
A.4 Indicateurs métier286
A.5 Concepts techniques286
## Annexe B — Index des règles métier288
## Annexe C — Catalogue des règles de calcul325
## Annexe D — Catalogue des indicateurs KPI et tableaux de bord330
## Annexe E — Catalogue des calculs techniques et analytiques334
## Annexe F — Catalogue des évènements métier338
## Annexe G — Catalogue des statuts353
## Annexe H — Catalogue des notifications357
## Annexe I — Matrice des autorisations (RBAC)367
## Annexe J — Matrice CRUD378
## Annexe K — Matrice des dépendances fonctionnelles384
## Annexe L — Matrice de traçabilité386
## Annexe M — Catalogue des cas d’erreur388
## Annexe N — Catalogue des cas limite (Edge cases)404
## Annexe O — Diagrammes406
## Annexe P — Dictionnaire des objets métier417









