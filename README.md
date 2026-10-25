# Echoes Factory

Echoes Factory est une application web légère, en français, destinée à aider les industriels d’**EVE Echoes** à suivre une usine de fabrication. Elle rassemble les recettes, les prix de marché, le stock et les liquidités, puis estime le coût de fabrication et indique s’il est préférable de produire ou d’acheter un objet.

L’application fonctionne dans un navigateur sans serveur applicatif : les données de l’usine sont enregistrées localement dans le `localStorage` du navigateur. Il s’agit d’un outil de suivi et d’estimation ; les prix sont saisis ou importés par l’utilisateur, et ne sont pas synchronisés avec le jeu.

## Fonctionnalités implémentées

### Accueil

- Modifier le nom de l’usine et consulter les nombres de produits, tarifs et types d’objets en stock, ainsi que les liquidités.
- Réinitialiser les données de l’usine locale.
- Afficher un résumé de fabrications présentes dans l’instance de l’usine. La page de planification ne permet pas encore de valider un plan pour créer une fabrication ; le suivi n’est pas persisté.

### Marché

- Enregistrer un tarif unitaire ou importer des lignes TSV EVE Echoes (`index`, `nom`, `quantité`, `valeur totale`), avec calcul du prix unitaire.
- Afficher le montant et la date d’effet des tarifs ; trier le tableau par nom, prix ou date et rechercher par nom.
- Refuser une mise à jour antidatée et recalculer les estimations des produits concernés.

### Produits et recettes

- Créer, modifier, consulter et supprimer des recettes. Décrire les ingrédients, les frais, la quantité produite par cycle et le taux de réussite.
- Ajouter des ingrédients un par un ou les importer depuis un TSV ; leurs tarifs unitaires sont aussi actualisés.
- Estimer le coût de revient à partir des tarifs disponibles. Pour un ingrédient qui est un produit `BUILD`, son coût de revient est utilisé ; sinon le calcul utilise son tarif de marché.
- Classer les produits `BUILD`, `BUY` ou `NA`, et afficher rentabilité, gain estimé et commentaire. Le tableau se trie par nom, rentabilité ou gain et se filtre par nom.
- Afficher la date de référence la plus ancienne utilisée dans l’estimation. Les estimations de plus de sept jours sont signalées ; le seuil est fixé dans la page et n’est pas configurable depuis l’application.

Au-delà de 15 % de rentabilité, le commentaire est « Commercialisable » ; une rentabilité positive jusqu’à 15 % est commentée « Pour consommation interne ».

### Stock et liquidités

- Ajouter des objets individuellement ou en lot depuis un TSV ; ajuster ou supprimer les quantités.
- Rechercher dans le stock et trier par nom ou quantité.
- Modifier les liquidités et vider le stock / remettre les liquidités à zéro depuis la page Stock.
- Refuser le retrait d’une quantité supérieure au stock disponible.

### Planification de production — état actuel

- Choisir un produit du catalogue et une quantité cible pour calculer un plan portant sur ses ingrédients directs.
- Le plan proposé n’affiche que les **sous-produits** (composants présents dans le catalogue). Les composants absents du catalogue sont masqués du plan mais restent pris en compte dans les estimations de coût.
- Pour les composants qui sont aussi des produits du catalogue, conserver la décision suggérée `BUILD`/`BUY` ou la remplacer ; le coût affiché est recalculé.
- Afficher les coûts estimés, les déficits de stock `BUY` et un déficit de liquidités calculé à partir des achats estimés.
- Afficher les **ressources nécessaires** à la production planifiée :
  - `Achat` pour les composants à acheter ;
  - `Stock` pour les sous-produits `BUILD` déjà disponibles en stock ;
  - `Fabrication` pour les sous-produits `BUILD` dont le stock est insuffisant, avec la liste des ingrédients nécessaires à leur fabrication.
- Le plan calcule également le coût des composants absents du catalogue (`coût_hors_catalogue`).

Le planificateur ne déroule pas toute une arborescence de sous-recettes en séquence opérationnelle. Les estimations de ressources portent sur les composants directs et ne constituent pas une comptabilité d’exécution. Le service contient des méthodes de réservation de stock et de suivi de fabrication, mais l’interface ne permet pas encore de valider un plan et l’état des fabrications/réservations n’est pas inclus dans la sauvegarde locale.

## Utilisation

Ouvrir `index.html` dans un navigateur moderne. La navigation permet d’accéder à l’accueil, au marché, aux produits, au stock et à la planification. Aucune étape de compilation ni dépendance d’exécution n’est requise.

Les données sont propres au navigateur et à son origine. Effacer les données du site ou utiliser un autre navigateur/profil ne conserve pas l’usine. Le bouton de réinitialisation de l’accueil remplace l’usine locale par une nouvelle usine vide.

## Organisation du projet

- `index.html`, `marché.html`, `produits.html`, `edition_produit.html`, `stock.html`, `planification.html` : pages et interactions de l’interface.
- `app/domain.js` : modèles métier et calculs.
- `app/service.js` : façade `Usine`, propagation des mises à jour, sérialisation, réservations et méthodes de suivi de fabrication.
- `app/planificateur.js` et `app/planificationSurcharge.js` : calcul du plan et coût des choix `BUILD`/`BUY`.
- `app/presentation.js` : décodage TSV, formatage et notifications.
- `app/*SortFilter.js` : fonctions de tri/filtrage ; `app/péremption.js` : détection des estimations périmées.
- `style/style.css` : styles de l’interface.
- `__test__/` : tests Mocha du domaine, des services, de la présentation et des fonctions UI.
- `.kiro/specs/echoes-factory-specs/` : exigences, conception et suivi des tâches.

## Limites et travaux restants

- Les données de l’usine sont locales ; aucun stockage distant, export/import de sauvegarde ou synchronisation entre appareils n’est implémenté.
- Les calculs dépendent de prix saisis/importés et peuvent être incomplets ou périmés.
- Le plan de production est une estimation directe, pas une séquence complète de fabrication exécutable. Les choix `BUILD`/`BUY` modifient le coût affiché, mais les indicateurs de ressources ne sont pas tous recalculés après une surcharge.
- La réservation de stock et le suivi de fabrication existent en partie dans le service, mais ne forment pas encore un flux persistant utilisable depuis l’interface.
- Les mouvements de production ne déduisent pas automatiquement les matériaux ni ne créditent les objets produits ; les achats et gains ne modifient pas automatiquement stock ou liquidités.
- L’internationalisation et la mise à jour automatique des prix ne sont pas implémentées.

## Développement et état des tests

Le projet utilise des modules JavaScript natifs et Mocha. Installer les dépendances puis lancer `npm test`. Lors de la dernière exécution observée : **173 tests réussis, 1 en attente et 0 en échec**.

```sh
npm install
npm test
```
