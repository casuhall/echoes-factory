# Document d'Exigences — Echoes Factory

## Introduction

Echoes Factory est une application web sans serveur, destinée aux industriels du jeu **EVE Echoes**. Elle centralise la gestion des recettes de fabrication, des prix de marché, du stock et des liquidités d'une usine virtuelle. À partir de ces données, elle calcule le coût de revient de chaque produit et conseille l'utilisateur sur l'opportunité de produire ou d'acheter chaque objet.

Toutes les données sont persistées localement dans le `localStorage` du navigateur. Aucune étape de compilation ni de serveur applicatif n'est requise.

Ce document couvre les fonctionnalités actuellement implémentées (✅) ainsi que les améliorations planifiées (☐).

---

## Glossaire

- **Usine** : entité centrale regroupant le catalogue de produits, le marché, l'inventaire et les liquidités.
- **Produit** : représentation opérationnelle d'une recette, enrichie des indicateurs de rentabilité calculés.
- **Recette** : description d'une ligne de fabrication — nom, frais fixes, liste d'ingrédients, quantité produite par cycle et taux de réussite.
- **Ingrédient** : matériau ou sous-composant nécessaire à une recette, caractérisé par un nom et une quantité entière.
- **Tarif** : évaluation datée du prix unitaire d'un objet sur le marché.
- **Marché** / **Tarification** : ensemble des tarifs enregistrés pour les objets, avec contrôle de cohérence temporelle.
- **Catalogue** : collection de produits de l'usine, garantissant l'unicité des noms.
- **Inventaire** : stock courant de l'usine, exprimé en quantités entières par type d'objet.
- **Coût de revient** : somme des frais fixes et du coût des ingrédients pour un cycle de fabrication (`frais + Σ(tarif_unitaire × quantité)` par ingrédient). La ramification par quantité produite et taux de réussite intervient dans le calcul de la rentabilité, pas dans le coût de revient brut.
- **Rentabilité** : rapport `(prix_estimé × quantité_produite) / (coût_reviens / taux_réussite) − 1`, arrondi à deux décimales. Utilise la propriété `coût_reviens` du `Produit`.
- **Statut BUILD** : le produit est plus avantageux à fabriquer qu'à acheter (rentabilité > 0).
- **Statut BUY** : le produit est plus avantageux à acheter (rentabilité ≤ 0).
- **Statut NA** : données insuffisantes pour calculer la rentabilité.
- **TSV EVE Echoes** : format tabulé (tabulation) exporté par le jeu : `index\tnom\tquantité\tvaleur_totale`.
- **ISK** : devise in-game d'EVE Echoes utilisée pour tous les montants.


---

## Exigences

### Exigence 1 — Persistance et initialisation de l'usine

**User Story :** En tant qu'industriel EVE Echoes, je veux que mon usine soit automatiquement sauvegardée, afin de retrouver mes données à chaque ouverture de l'application.

#### Critères d'acceptation

1. ✅ THE Usine SHALL sérialiser l'intégralité de ses données (nom, recettes, tarifs, stock, liquidités) sous forme de chaîne JSON via la méthode `toString()`.
2. ✅ WHEN l'application est chargée dans le navigateur, THE Application SHALL initialiser l'usine à partir des dernières informations connues de celle-ci.
3. ✅ IF aucune information correspondante n'est trouvée, THEN THE Application SHALL initialiser une nouvelle `Usine` avec des collections vides et des liquidités à zéro.
4. ✅ WHEN une action modifie l'état de l'`Usine`, THE Application SHALL persister les changements de façon à les récupérer à la prochaine ouverture.
5. ✅ WHEN `Usine.parse()` reçoit une chaîne JSON malformée, THE Usine SHALL journaliser l'erreur dans la console et propager l'exception sans corrompre l'état existant.
6. ✅ THE Usine SHALL accepter des données d'initialisation dont les champs numériques sont fournis sous forme de chaînes de caractères, en les convertissant en nombres avant usage.
7. ☐ THE application SHALL pouvoir persister ses données dans un service externe de façon à les récupérer indépendamment de l'équipement utilisé pour faire tourner celle-ci.

---

### Exigence 2 — Gestion du nom et réinitialisation de l'usine

**User Story :** En tant qu'industriel, je veux pouvoir nommer mon usine et réinitialiser toutes ses données, afin d'identifier mon espace de travail et de repartir de zéro si nécessaire.

#### Critères d'acceptation

1. ✅ THE Application SHALL afficher le nom de l'`Usine` dans la barre de navigation sur toutes les pages.
2. ✅ WHEN l'utilisateur modifie le nom de l'`Usine`, THE Application SHALL mettre à jour et persister le nouveau nom immédiatement.
3. ✅ THE Page d'accueil SHALL afficher en lecture seule le nombre de produits, le nombre de tarifs enregistrés, le nombre de types d'objets en stock et le montant des liquidités disponibles.
4. ✅ WHEN l'utilisateur clique sur le bouton « Reset » de la page d'accueil, THE Application SHALL supprimer l'usine existante et en créer une nouvelle pour repartir de zéro.
5. ✅ IF l'utilisateur tente de définir un nom d'`Usine` vide, THEN THE Usine SHALL lever une erreur et conserver le nom précédent.

---

### Exigence 3 — Gestion des tarifs du marché

**User Story :** En tant qu'industriel, je veux enregistrer et consulter les prix des objets du marché, afin que l'application calcule automatiquement le coût de revient de mes recettes.

#### Critères d'acceptation

1. ✅ WHEN l'utilisateur saisit le nom et le prix d'un objet via le formulaire unitaire du marché, THE Application SHALL créer ou mettre à jour le `Tarif` correspondant dans la `Tarification` et persister l'`Usine`.
2. ✅ WHEN l'utilisateur colle une liste au format `TSV EVE Echoes` dans le formulaire d'import massif du marché, THE Application SHALL analyser chaque ligne valide, calculer le prix unitaire (`valeur_totale / quantité`), mettre à jour le `Tarif` et persister l'`Usine`.
3. ✅ THE Application SHALL afficher la liste des tarifs enregistrés avec le nom de l'objet, son prix unitaire formaté et la date d'effet.
4. ✅ IF un `Tarif` plus récent existe déjà pour le même objet, THEN THE Tarification SHALL rejeter la mise à jour et journaliser un avertissement.
5. ✅ WHEN le tarif d'un objet est mis à jour, THE Application SHALL déclencher le recalcul des indicateurs de tous les produits associés à cet objet (que ce soit le produit correspondant à l'objet lui-même, ou les produits dont l'objet est un ingrédient).
6. ✅ IF une ligne de la liste TSV ne respecte pas le format `index\tnom\tquantité\tvaleur`, THEN THE Application SHALL ignorer silencieusement cette ligne et continuer le traitement des autres lignes.
7. ✅ THE Tarif SHALL refuser la création si le prix fourni est nul ou négatif.
8. ✅ THE Application SHALL profiter de toute interprétation d'une liste d'objets au format TSV, quelle que soit la destination initiale de la saisie (produit, stock, etc.), pour mettre à jour le `Tarif` des objets correspondants.

---

### Exigence 4 — Catalogue des produits et calcul de rentabilité

**User Story :** En tant qu'industriel, je veux créer et consulter mes recettes de fabrication avec leur analyse de rentabilité, afin de décider pour chaque produit s'il vaut mieux le fabriquer ou l'acheter.

#### Critères d'acceptation

1. ✅ WHEN l'utilisateur enregistre une nouvelle recette, THE Application SHALL créer un `Produit` dans le `Catalogue`, calculer son coût de revient à partir des tarifs disponibles, et persister l'`Usine`.
2. ✅ THE Recette SHALL exiger un nom non vide, des frais de fabrication entiers strictement positifs, au moins un `Ingrédient`, une quantité produite entière strictement positive et un taux de réussite dans l'intervalle `]0, 1]`.
3. ✅ THE Ingrédient SHALL exiger un nom non vide et une quantité entière strictement positive.
4. ✅ THE Catalogue SHALL refuser l'inscription d'un doublon de Produit.
5. ✅ WHEN tous les tarifs d'ingrédients sont disponibles, THE Produit SHALL calculer le coût de revient comme la somme des frais de fabrication et du prix de chaque ingrédient (tarif unitaire multiplié par la quantité requise).
6. ✅ WHEN l'un des tarifs d'ingrédients est absent, THE Produit SHALL définir son statut à `NA` et son commentaire à `Rentabilité incalculable : coût de reviens inconnu.`.
7. ✅ WHEN le prix estimé du produit est absent, THE Produit SHALL définir son statut à `NA` et son commentaire à `Rentabilité incalculable : prix estimé inconnu.`.
8. ✅ WHEN la rentabilité est strictement supérieure à 15 %, THE Produit SHALL définir son statut à `BUILD` et son commentaire à `Commercialisable`.
9. ✅ WHEN la rentabilité est positive et inférieure ou égale à 15 %, THE Produit SHALL définir son statut à `BUILD` et son commentaire à `Pour consommation interne`.
10. ✅ WHEN la rentabilité est nulle ou négative, THE Produit SHALL définir son statut à `BUY`.
11. ✅ WHEN un ingrédient correspond à un produit du `Catalogue` ayant le statut `BUILD`, THE Produit SHALL utiliser le coût de revient de ce sous-produit comme prix unitaire de l'ingrédient dans son propre calcul.
12. ✅ WHEN un ingrédient correspond à un produit du `Catalogue` ayant le statut `BUY`, THE Produit SHALL utiliser le prix estimé (tarif marché) de ce sous-produit comme prix unitaire de l'ingrédient.
13. ✅ THE Page Produits SHALL afficher pour chaque produit : son nom, sa rentabilité en pourcentage, le gain estimé coloré en rouge si le statut est `BUY` et en vert sinon, son commentaire, ainsi que des boutons d'édition et de suppression.

---

### Exigence 5 — Édition et suppression des produits

**User Story :** En tant qu'industriel, je veux pouvoir modifier ou supprimer une recette existante, afin de maintenir mon catalogue à jour.

#### Critères d'acceptation

1. ✅ WHEN l'utilisateur clique sur le bouton d'édition d'un produit, THE Application SHALL initialiser les éléments de la recette dans une page permettant sa modification.
2. ✅ WHEN l'utilisateur enregistre une recette modifiée, THE Application SHALL remplacer l'ancien `Produit` dans le `Catalogue`, recalculer les indicateurs, propager les mises à jour aux produits dépendants, et persister l'`Usine`.
3. ✅ IF la création de la nouvelle version d'un produit échoue, THEN THE Application SHALL s'assurer que la version précédente du `Produit` reste bien inscrite au `Catalogue` et exposer l'erreur.
4. ✅ WHEN l'utilisateur confirme la suppression d'un produit, THE Application SHALL retirer le `Produit` du `Catalogue`, propager un événement `maj_produit` aux produits dépendants, et persister l'`Usine`.
5. ✅ THE Page Édition Produit SHALL synchroniser le curseur de taux de réussite avec le champ numérique en temps réel, dans les deux sens.

---

### Exigence 6 — Propagation automatique des mises à jour

**User Story :** En tant qu'industriel, je veux que tout changement de tarif ou de recette se répercute immédiatement sur les calculs des produits dépendants, afin de toujours disposer d'estimations à jour.

#### Critères d'acceptation

1. ✅ WHEN un Tarif est mis à jour, THE Application SHALL émettre un événement `maj_tarif` avec le nom de l'objet concerné.
2. ✅ WHEN un événement `maj_tarif` est reçu, THE Usine SHALL recalculer les indicateurs de tous les produits dont la recette contient cet ingrédient.
3. ✅ WHEN un produit est ajouté, modifié ou supprimé, THE Application SHALL émettre un événement `maj_produit` avec le nom du produit.
4. ✅ WHEN un événement `maj_produit` est reçu, THE Usine SHALL mettre à jour la référence de ce produit dans les ingrédients de tous les produits qui en dépendent, et recalculer leurs indicateurs.
5. ✅ WHEN l'`Usine` rencontre une recette dont certains ingrédients n'ont pas de tarif, THE Produit SHALL être initialisé avec le statut `NA` sans lever d'exception.

---

### Exigence 7 — Gestion du stock et des liquidités

**User Story :** En tant qu'industriel, je veux suivre les quantités d'objets en stock et mes liquidités disponibles, afin d'avoir une vision claire des ressources de mon usine.

#### Critères d'acceptation

1. ✅ WHEN l'utilisateur ajoute unitairement un objet au stock, THE Application SHALL ajouter l'objet dans la quantité requise, puis persister l'`Usine`.
2. ✅ WHEN l'utilisateur colle une liste TSV EVE Echoes dans le formulaire d'ajout massif au stock, THE Application SHALL ajouter chaque objet au stock pour une quantité correspondante.
3. ✅ THE Inventaire SHALL accepter uniquement des quantités entières strictement positives pour les opérations d'ajout et de retrait.
4. ✅ IF l'utilisateur tente de retirer une quantité supérieure au stock disponible, THEN THE Inventaire SHALL lever une erreur indiquant la quantité disponible.
5. ✅ WHEN la quantité en stock d'un objet atteint zéro après un retrait, THE Inventaire SHALL supprimer l'entrée de cet objet de son rapport de stock.
6. ✅ WHEN l'utilisateur modifie la quantité d'un objet en stock, THE Application SHALL ajouter ou retirer la quantité correspondante, et persister l'`Usine`.
7. ✅ WHEN l'utilisateur supprime un objet du stock, THE Application SHALL retirer l'intégralité du stock de cet objet après confirmation, et persister l'`Usine`.
8. ✅ WHEN l'utilisateur clique sur « Réinitialiser » dans la page stock, THE Application SHALL vider l'intégralité du stock et remettre les liquidités à zéro, puis persister l'`Usine`.
9. ✅ WHEN l'utilisateur clique sur le montant des liquidités, THE Application SHALL afficher un champ de saisie numérique pré-rempli avec la valeur actuelle.
10. ✅ WHEN l'utilisateur valide la saisie des liquidités, THE Usine SHALL accepter la nouvelle valeur si elle est un entier positif ou nul, persister l'`Usine` et masquer le champ de saisie.
11. ✅ IF l'utilisateur saisit un montant de liquidités non entier, négatif ou non numérique, THEN THE Usine SHALL lever une erreur et conserver la valeur précédente.
12. ✅ THE Usine SHALL accepter une chaîne numérique (ex. `"300"`) comme valeur de liquidités valide, en la convertissant en entier.
13. ☐ WHEN l'utilisateur consulte le plan de production dans la page de planification, THE Application SHALL afficher les quantités en stock résiduelles estimées après exécution du plan, en plus des quantités actuellement disponibles.
14. ☐ WHEN l'utilisateur consulte le plan de production dans la page de planification, THE Application SHALL afficher les liquidités restantes estimées après les achats prévus dans le plan.

---

### Exigence 8 — Navigation et interface utilisateur

**User Story :** En tant qu'industriel, je veux naviguer facilement entre les sections de l'application, afin d'accéder rapidement aux informations dont j'ai besoin.

#### Critères d'acceptation

1. ✅ THE Application SHALL proposer une barre de navigation persistante donnant accès aux pages : Accueil, Marché, Produits et Stock.
2. ✅ THE Application SHALL mettre en évidence le lien de navigation correspondant à la page courante.
3. ✅ THE Application SHALL afficher un message adapté lorsqu'une liste (produits, tarifs, stock) est vide.
4. ✅ WHEN une opération échoue, THE Application SHALL afficher une notification contextuelle avec le message d'erreur, qui disparaît automatiquement après 5 secondes.
5. ☐ WHEN l'utilisateur clique sur un en-tête de colonne du tableau du stock, THE Application SHALL trier les objets selon cette colonne, en alternant ordre croissant et décroissant.
6. ☐ WHEN l'utilisateur saisit du texte dans le champ de recherche du stock, THE Application SHALL filtrer l'affichage des lignes de l'inventaire pour n'afficher que les objets dont le nom contient la saisie.
7. ☐ WHEN l'utilisateur clique sur un en-tête de colonne du tableau des produits, THE Application SHALL trier les produits selon cette colonne, en alternant ordre croissant et décroissant.
8. ☐ WHEN l'utilisateur saisit du texte dans un champ de recherche du catalogue produits, THE Application SHALL filtrer les produits affichés selon leur nom.
9. ☐ WHEN l'utilisateur clique sur un en-tête de colonne du tableau des tarifs, THE Application SHALL trier les tarifs selon cette colonne, en alternant ordre croissant et décroissant.
10. ☐ WHEN l'utilisateur saisit du texte dans un champ de recherche du marché, THE Application SHALL filtrer les tarifs affichés selon leur nom.
11. ☐ WHEN la page de planification de production est disponible, THE Application SHALL ajouter un lien vers celle-ci dans la barre de navigation de toutes les pages.

---

### Exigence 9 — Planification de production

**User Story :** En tant qu'industriel, je veux choisir un produit et une quantité cible, afin que l'application me propose un plan d'achats et de fabrications optimisé selon mes recettes et mon stock.

#### Critères d'acceptation

1. ☐ WHEN l'utilisateur sélectionne un produit et saisit une quantité cible, THE Planificateur SHALL comparer le coût de fabrication et le coût d'achat pour chaque composant nécessaire.
2. ☐ WHEN le Planificateur a analysé tous les composants, THE Planificateur SHALL proposer une séquence d'achats et de fabrications ordonnée minimisant le coût total.
3. ☐ WHEN une fabrication est planifiée, THE Application SHALL réserver les composants nécessaires dans l'inventaire pour distinguer le stock disponible du stock engagé.
4. ☐ WHEN l'utilisateur valide un plan de production, THE Application SHALL enregistrer les fabrications en cours et permettre de suivre leur avancement.
5. ☐ WHEN l'utilisateur consulte la page d'accueil, THE Application SHALL afficher un résumé des fabrications en cours et des prochaines étapes nécessaires à leur avancement.
6. ☐ WHEN le plan est affiché, THE Application SHALL présenter le choix par défaut achat/fabrication pour chaque ingrédient qui est également un `Produit` du catalogue, et permettre à l'utilisateur de remplacer ce choix par une décision explicite pour chacun de ces ingrédients.
7. ☐ THE Planificateur SHALL permettre de produire un plan même si le stock ou les liquidités disponibles sont insuffisants pour couvrir l'intégralité des besoins.
8. ☐ WHEN le stock disponible est insuffisant pour un composant requis par le plan, THE Application SHALL mettre en évidence visuellement les quantités manquantes pour chaque composant en déficit.
9. ☐ WHEN les liquidités disponibles sont insuffisantes pour couvrir les achats et/ou les frais de fabrication prévus dans le plan, THE Application SHALL mettre en évidence visuellement le déficit de liquidités.
10. ☐ WHEN un plan est établi avec des ressources insuffisantes, THE Planificateur SHALL ordonner les prochaines étapes de fabrication en priorisant celles dont tous les composants nécessaires sont déjà disponibles en stock, avant celles qui nécessitent des achats ou des ressources manquantes.

---

### Exigence 10 — Export et import de la sauvegarde

**User Story :** En tant qu'industriel, je veux pouvoir exporter et importer les données de mon usine, afin de sauvegarder mes données hors navigateur ou de les transférer vers un autre appareil.

#### Critères d'acceptation

1. ☐ WHEN l'utilisateur clique sur « Exporter », THE Application SHALL générer un fichier JSON contenant la sérialisation complète de l'`Usine` et proposer son téléchargement.
2. ☐ WHEN l'utilisateur sélectionne un fichier JSON valide via le formulaire d'import, THE Application SHALL remplacer l'`Usine` courante par les données importées et les persister.
3. ☐ IF le fichier JSON importé est malformé ou incompatible, THEN THE Application SHALL afficher un message d'erreur explicite et conserver l'`Usine` existante intacte.

---

### Exigence 11 — Affichage des dates de référence des estimations

**User Story :** En tant qu'industriel, je veux voir la date de référence des prix utilisés pour chaque estimation, afin d'évaluer la fraîcheur des calculs de rentabilité.

#### Critères d'acceptation

1. ☐ WHEN un produit est affiché dans le catalogue, THE Application SHALL afficher la date d'effet du tarif le plus ancien utilisé dans le calcul de son coût de revient.
2. ☐ WHEN un tarif utilisé dans un calcul est plus ancien qu'un seuil configurable, THE Application SHALL signaler visuellement que l'estimation peut être périmée.

---

### Exigence 12 — Internationalisation (perspective long terme)

**User Story :** En tant qu'industriel non francophone, je veux pouvoir utiliser l'application dans ma langue, afin d'élargir son accessibilité.

#### Critères d'acceptation

1. ☐ WHERE une langue autre que le français est configurée par l'utilisateur, THE Application SHALL afficher tous les libellés, messages et commentaires dans la langue sélectionnée.
2. ☐ WHERE une langue est configurée, THE Application SHALL formater les nombres et les dates selon les conventions locales de cette langue.

---

### Exigence 13 — Synchronisation des prix (perspective long terme)

**User Story :** En tant qu'industriel, je veux pouvoir configurer une source de prix automatique, afin de réduire la saisie manuelle et de disposer de données de marché récentes.

#### Critères d'acceptation

1. ☐ WHERE une source de prix est configurée, THE Application SHALL récupérer périodiquement les prix depuis cette source et mettre à jour la `Tarification` en respectant la règle d'antidatage.
2. ☐ WHERE une source de prix est configurée, WHEN la récupération échoue, THE Application SHALL afficher une notification d'erreur et conserver les tarifs existants.
