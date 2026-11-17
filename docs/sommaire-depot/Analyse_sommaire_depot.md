# Sommaire de dépôt — application Courses

Analyse statique du 17 novembre 2026. Les deux bibliothèques fournies ont été lues sans lancer l'application et sans connexion à Oracle. Les requêtes n'ont pas été exécutées sur la base réelle.

## Résultat

Le rapport original a été identifié dans les bibliothèques PowerBuilder. Il n'est pas limité à une table : sa requête référence **neuf tables distinctes**. Les reçus déterminent la date et le lieu; les montants des lignes proviennent de `COUT_PAIE.MT_DU`.

| Bibliothèque | Objet identifié | Rôle établi par les éléments retrouvés |
|---|---|---|
| `cou_rapport.pbd` | `w_sommaire_dépôt.win` | Fenêtre des critères date, endroit et bordereau; références de prévisualisation |
| `cou_rapport_datawindow.pbd` | `d_select_sommaire_dépôt.dwo` | Saisie des critères |
| `cou_rapport_datawindow.pbd` | `d_sommaire_dépôt_princip.dwo` | Rapport composite avec titre et quatre rapports enfants |
| `cou_rapport_datawindow.pbd` | `d_sommaire_dépôt.dwo` | Lignes de détail, tri SQL par numéro de reçu |
| `cou_rapport_datawindow.pbd` | `d_sommaire_dépôt_mode_paie.dwo` | Récapitulatif des montants par mode de paiement |
| `cou_rapport_datawindow.pbd` | `d_sommaire_dépôt_type_paie.dwo` | Récapitulatif par type de transaction, avec poste comptable |
| `cou_rapport_datawindow.pbd` | `d_sommaire_total_depot.dwo` | Total des droits et frais |

## Tables réellement référencées dans la requête

| Table | Utilisation dans la requête originale |
|---|---|
| `COU.COUT_RECU` | `NO_RECU`, `DT_RECU`, `CO_ENDR`, `CO_MODE_PAIE`; filtres date et lieu |
| `COU.COUT_PAIE` | Lien reçu/paiement dû, montant `MT_DU`, type de transaction |
| `COU.COUT_PAIE_DU` | Dossier `NO_DOSS`, type `CO_TYP_PAIE`, lien vers sanction |
| `COU.COUT_TYP_TRANS_PAIE` | Libellé du type de transaction et `NO_POST_CPTA` |
| `COU.COUT_VALR_PROP` | Utilisée deux fois : alias `endroit` et `mod` pour les libellés de référence |
| `COU.COUT_SANC` | Sanction associée au paiement dû et lien vers décision |
| `COU.COUT_DCIS` | Lien entre sanction et intervention |
| `COU.COUT_IRVEN` | Lien vers les manquements |
| `COU.COUT_MANQ` | Construction de l'identifiant de l'événement |

La requête originale ne qualifie pas les tables par leur schéma. La version principale fournie ajoute `COU`, schéma confirmé pendant l'exploration SQL Developer. Les droits de lecture sur l'ensemble des neuf tables restent à vérifier dans la connexion utilisée.

## Critères confirmés

| Champ de la fenêtre | Traitement retrouvé |
|---|---|
| Date du dépôt | Paramètre `date_recu`; comparaison avec le jour de `COUT_RECU.DT_RECU` |
| Lieu dépôt | Paramètre `endroit`; comparaison avec `COUT_RECU.CO_ENDR` |
| Numéro de bordereau | Absent des paramètres et des conditions des quatre requêtes extraites; références `bordereau.Text` et `no_bordereau` présentes dans la fenêtre |

Le filtre de date d'origine est `TO_DATE(TO_CHAR(cout_recu.dt_recu,'yyyy-mm-dd'),'yyyy-mm-dd') = TO_DATE(:date_recu,'yyyy-mm-dd')`. Il compare le jour civil stocké dans Oracle, sans la partie horaire. Le filtre de lieu est `cout_recu.co_endr = :endroit`.

Les références de la fenêtre montrent que le bordereau est utilisé pour modifier le texte du rapport. Ce constat ne constitue pas une décompilation intégrale de tous les scripts de la fenêtre et ne prouve pas son absence de toute autre partie de l'application.

Les libellés de référence sont joints avec `endroit.nm_prop = 'CO_ENDR'` et `mod.nm_prop = 'CO_MODE_PAI'`. Le nom de propriété du mode est bien `CO_MODE_PAI`, tandis que la colonne du reçu s'appelle `CO_MODE_PAIE`.

## Relations de la requête

- `COUT_RECU.NO_RECU = COUT_PAIE.NO_RECU`.
- `COUT_PAIE.NO_PAIE_DU = COUT_PAIE_DU.NO_PAIE_DU`.
- `COUT_PAIE.CO_TYP_TRANS_PAIE = COUT_TYP_TRANS_PAIE.CO_TYP_TRANS_PAIE`.
- `COUT_RECU.CO_ENDR = endroit.CO_VALR_PROP`, avec propriété `CO_ENDR`.
- `COUT_RECU.CO_MODE_PAIE = mod.CO_VALR_PROP`, avec propriété `CO_MODE_PAI`.
- Liaisons externes successives vers `COUT_SANC`, `COUT_DCIS`, `COUT_IRVEN` et `COUT_MANQ` via les clés présentes dans la requête.

Les jointures externes Oracle `(+)` sont conservées. Le chemin vers les manquements peut influencer la cardinalité du résultat; il faut comparer les résultats au rapport original avant de refactoriser les jointures ou de dédupliquer les lignes.

## Montants, regroupements et contenu

- Les quatre requêtes récupèrent les mêmes treize colonnes utiles, avec des différences de mise en forme SQL et de tri.
- La requête du détail trie par `COUT_RECU.NO_RECU`.
- Les totaux par groupe sont calculés dans les DataWindows, avec l'expression `sum(cout_paie_mt_du for group 1)`; ils ne sont pas des `GROUP BY` de la requête SQL.
- Les chaînes de définition indiquent un regroupement par `cout_recu_co_mode_paie` pour le récapitulatif des modes et par `cout_paie_co_typ_trans_paie` pour celui des types de transaction.
- Le total explicitement retrouvé est « Montant des droits et des frais », calculé avec `sum(cout_paie_mt_du for all)`.
- Le libellé « Montant encaissé » est présent, mais son éventuel calcul distinct n'a pas été établi par cette extraction.
- `COUT_RECU.MT_RECU` n'est sélectionné dans aucune des quatre requêtes extraites. Il ne faut pas substituer son total à celui de `MT_DU` en supposant qu'ils sont égaux.
- Aucune condition sur `IND_NSF`, `IND_REMB` ou `IND_SUPP` ne figure dans les requêtes extraites. La règle NSF de `PK_COURSE.ObPaiement` ne doit donc pas être ajoutée à ce rapport sans validation. Ceci porte sur les requêtes récupérées, pas sur tout comportement possible du système.
- La colonne événement est construite par `COUT_MANQ.CO_ENDR || TO_CHAR(COUT_MANQ.DT_MANQ,'yyyymmdd') || COUT_MANQ.NO_MANQ`.

Le rapport composite référence `dw_detail`, `dw_mode`, `dw_type` et `dw_total`. Les textes retrouvés comprennent le nom de la Régie, « Sommaire de dépôt », « (courses) », le code imprimé `131E`, les colonnes Reçu, Type paiement, Dossier, Événement, Mode paiement et Montant, ainsi que Date, Signature et Remarques. La pagination utilise `page() + ' / ' + pagecount()`.

## Prévisualisation et éléments restant à valider

La fenêtre contient les références `Retrieve`, `GetChild`, `RowsCopy`, `Modify`, `SaveAs` et le chemin `C:\temp\psr.psr`. Ce chemin est une piste concrète pour récupérer un exemplaire de prévisualisation ou comprendre une dépendance au poste. Sa présence ne démontre pas la cause de la panne et ne confirme pas qu'un fichier existe actuellement à cet emplacement.

La récupération porte sur les chaînes SQL, les noms d'objets et plusieurs éléments de présentation de bibliothèques compilées; ce n'est pas un export `.srd` ni une restitution complète du code PowerScript. Un PDF original ou un fichier de prévisualisation, et idéalement les sources `.pbl`/`.srd`, permettront de vérifier la mise en page, les polices, les sauts de page et les montants avant de promettre un PDF identique.

## Utilisation des fichiers SQL

1. Exécuter `liste_lieux_depot.sql` pour identifier le code de l'endroit désiré.
2. Ouvrir `sommaire_depot.sql` dans SQL Developer sur la connexion appropriée.
3. Sélectionner uniquement le `SELECT` et utiliser Ctrl+Entrée.
4. Saisir le paramètre `date_recu` sous forme de texte `YYYY-MM-DD` et `endroit` avec le code réel du lieu.
5. Comparer les lignes et les totaux à un sommaire original produit pour les mêmes critères.

Les requêtes sont en lecture seule. Les variantes dans `sources_sql/` conservent les noms de tables sans schéma de l'extraction, avec les deux marqueurs compilés remplacés par les paramètres nommés. Les fichiers `extraits_texte/` sont des chaînes lisibles avec leur position dans chaque objet reconstitué, pas du code source intégral.

## Méthode et validation de l'extraction

Les entrées de bibliothèque et leurs blocs de données liés ont été reconstitués statiquement. La longueur de chacun des sept objets ciblés a été vérifiée contre sa longueur déclarée. Les deux arguments `:date_recu` et `:endroit` apparaissent dans les métadonnées des quatre DataWindows SQL. Leurs marqueurs compilés ont été remplacés dans l'ordre correspondant aux conditions date puis lieu. La liste des neuf tables, l'absence de caractères de contrôle non attendus et le caractère uniquement SELECT des requêtes ont été contrôlés. Aucune validation d'exécution Oracle ou de rendu PDF n'a été réalisée.
