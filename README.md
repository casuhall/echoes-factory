# Echoes Factory

Echoes Factory est une application web légère, en français, destinée à aider les industriels d’**EVE Echoes** à suivre une usine de fabrication. Elle rassemble les recettes, les prix de marché, le stock et les liquidités, puis estime le coût de fabrication et indique s’il est préférable de produire ou d’acheter un objet.

L’application fonctionne dans un navigateur sans serveur applicatif : les données de l’usine sont enregistrées localement dans le `localStorage` du navigateur. Il s’agit d’un outil de suivi et d’estimation ; les prix sont saisis ou importés par l’utilisateur, et ne sont pas synchronisés avec le jeu.

## Fonctionnalités implémentées

### Accueil

- Modifier le nom de l’usine et consulter les nombres de produits, tarifs et types d’objets en stock, ainsi que les liquidités.
- Réinitialiser les données de l’usine locale.

### Marché

- Enregistrer un tarif unitaire ou importer des lignes TSV EVE Echoes (`index`, `nom`, `quantité`, `valeur totale`), avec calcul du prix unitaire.
- Importer un TSV alternatif sans index (`Material`, `Quantity`, `ISK`) : seules les lignes racines (non indentées) sont retenues ; les sous-sections et les totaux sont ignorés.
- Afficher le montant et la date d’effet des tarifs ; trier le tableau par nom, prix ou date et rechercher par nom.
- Refuser une mise à jour antidatée et recalculer les estimations des produits concernés.

### Produits et recettes

- Créer, modifier, consulter et supprimer des recettes. Décrire les ingrédients, les frais, la quantité produite par cycle et le taux de réussite.
- Ajouter des ingrédients un par un ou les importer depuis un TSV (`index`, `nom`, `quantité`, `valeur totale`) ou depuis le format alternatif (`Material`, `Quantity`, `ISK`) ; leurs tarifs unitaires sont aussi actualisés.
- Estimer le coût de revient à partir des tarifs disponibles. Pour un ingrédient qui est un produit `BUILD`, son coût de revient est utilisé ; sinon le calcul utilise son tarif de marché.
- Classer les produits `BUILD`, `BUY` ou `NA`, et afficher rentabilité, gain estimé et commentaire. Le tableau se trie par nom, rentabilité ou gain et se filtre par nom.
- Afficher la date de référence la plus ancienne utilisée dans l’estimation. Les estimations de plus de sept jours sont signalées ; le seuil est fixé dans la page et n’est pas configurable depuis l’application.

Au-delà de 15 % de rentabilité, le commentaire est « Commercialisable » ; une rentabilité positive jusqu’à 15 % est commentée « Pour consommation interne ».

### Stock et liquidités

- Ajouter des objets individuellement ou en lot depuis un TSV (`index`, `nom`, `quantité`, `valeur totale`) ou depuis le format alternatif (`Material`, `Quantity`, `ISK`) ; ajuster ou supprimer les quantités.
- Rechercher dans le stock et trier par nom ou quantité.
- Modifier les liquidités et vider le stock / remettre les liquidités à zéro depuis la page Stock.
- Refuser le retrait d’une quantité supérieure au stock disponible.

### Stockage

- Stockage local par défaut dans le `localStorage` du navigateur.
- Mode Pantry optionnel : saisie d'un identifiant Pantry pour stocker les données dans le cloud (https://getpantry.cloud/).
- Transition automatique lors de la première saisie d'un identifiant Pantry : transfert silencieux si un seul côté contient des données, demande de choix si les deux contiennent des données.
- L'identifiant Pantry est mémorisé pour les sessions suivantes.

### Planification de production

- Générer un plan de production pour un produit cible et une quantité souhaitée.
- Afficher la liste récursive des composants nécessaires avec la décision système par défaut : `Acheter` ou `Produire`.
- Permettre la surcharge manuelle de la décision sur chaque étape pour privilégier l'achat ou la fabrication d'un sous-produit.
- Afficher le coût total estimé du plan et la quantité de stock disponible pour chaque composant.
- Exporter les données du tableau des matériaux nécessaires/manquants au format CSV.

## Utilisation

Ouvrir `index.html` dans un navigateur moderne. La navigation permet d’accéder à l’accueil, au marché, aux produits, au stock et à la planification. Aucune étape de compilation ni dépendance d’exécution n’est requise.

Les données sont propres au navigateur et à son origine. Effacer les données du site ou utiliser un autre navigateur/profil ne conserve pas l’usine. Le bouton de réinitialisation de l’accueil remplace l’usine locale par une nouvelle usine vide.

## Organisation du projet

- `index.html`, `marché.html`, `produits.html`, `edition_produit.html`, `stock.html`, `planification.html` : pages et interactions de l’interface.
- `app/domain.js` : modèles métier et calculs.
- `app/service.js` : façade `Usine`, propagation des mises à jour, sérialisation et `Planificateur`.
- `app/planification.js` : modèles du plan de production (`ÉtapePlan`, `PlanProduction`).
- `app/presentation.js` : décodage TSV, formatage et notifications.
- `app/*SortFilter.js` : fonctions de tri/filtrage ; `app/péremption.js` : détection des estimations périmées.
- `style/style.css` : styles de l’interface.
- `__test__/` : tests Mocha du domaine, des services, de la présentation et des fonctions UI.
- `.kiro/specs/echoes-factory-specs/` : exigences, conception et suivi des tâches.

## Limites et travaux restants

- Les données de l’usine sont locales par défaut ; un mode Pantry optionnel est disponible pour le stockage distant.
- Les calculs dépendent de prix saisis/importés et peuvent être incomplets ou périmés.
- Les mouvements de production ne déduisent pas automatiquement les matériaux ni ne créditent les objets produits ; les achats et gains ne modifient pas automatiquement stock ou liquidités.
- L’internationalisation et la mise à jour automatique des prix ne sont pas implémentées.
- Répliquer les boutons enregistrer et annuler en haut du tableau des ingrédients dans la page d'ajout/modification de produits.
- Correction de bug sur l'affichage des messages d'erreur dans la page d'ajout de produits : l'enregistrement échoue en cas d'absence de composants (comportement correct), mais aucun message visible n'est remonté à l'utilisateur (comportement incorrect).
- Correction de bug sur la modification de produit : les chances de succès sont affichées par défaut avec une probabilité de 1% pour des produits pourtant enregistrés avec un taux de réussite de 100%.

## Développement et état des tests

Le projet utilise des modules JavaScript natifs et Mocha. Installer les dépendances puis lancer `npm test`. Lors de la dernière exécution observée : **149 tests réussis, 1 en attente et 1 en échec** (échec non lié à la planification).

```sh
npm install
npm test
```
