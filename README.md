# Echoes Factory

Echoes Factory est une application web légère, en français, destinée à aider les industriels d’**EVE Echoes** à suivre une usine de fabrication. Elle rassemble les recettes, les prix de marché, le stock et les liquidités, puis estime le coût de fabrication et indique s’il est préférable de produire ou d’acheter un objet.

L’application fonctionne dans un navigateur sans serveur applicatif : les données de l’usine sont enregistrées localement dans le `localStorage` du navigateur. Il s’agit d’un outil de suivi et d’estimation ; les prix sont saisis ou importés par l’utilisateur, et ne sont pas synchronisés avec le jeu.

## Fonctionnalités

### Accueil et données de l’usine

- Afficher et modifier le nom de l’usine.
- Consulter le nombre de recettes, de tarifs et de types d’objets en stock, ainsi que les liquidités.
- Réinitialiser les données locales de l’usine.

### Marché

- Saisir le prix d’un objet individuellement ou importer une liste tabulée d’objets.
- Afficher les prix enregistrés et leur date d’effet.
- Utiliser les prix comme estimations pour calculer le coût des recettes et réévaluer les produits concernés.
- Refuser une mise à jour antidatée lorsqu’un tarif plus récent existe déjà.

### Produits et recettes

- Créer, consulter, modifier et supprimer des recettes.
- Décrire les ingrédients et leurs quantités, les frais de fabrication, le nombre d’objets produits par cycle et le taux de réussite.
- Ajouter les ingrédients un par un ou importer les lignes copiées depuis une liste d’objets du jeu. L’import associe également un prix unitaire calculé à partir de la valeur et de la quantité importées.
- Calculer le coût de revient en tenant compte des prix des ingrédients et, lorsqu’une recette connue est plus avantageuse, du coût de fabrication de l’ingrédient produit dans l’usine.
- Comparer le coût de revient estimé au prix de vente enregistré. La liste indique la rentabilité, un gain estimé et un commentaire d’aide à la décision.
- Mettre à jour automatiquement les calculs des recettes dépendantes lorsqu’un tarif ou un produit change.

Le statut métier distingue notamment `BUILD` (produire), `BUY` (acheter) et `NA` (données insuffisantes). Une rentabilité supérieure à 15 % est commentée « Commercialisable » ; une rentabilité positive inférieure ou égale à ce seuil est présentée comme adaptée à la consommation interne.

### Stock et liquidités

- Ajouter des objets au stock, individuellement ou en lot.
- Champ de recherche du stock présent dans l’interface, mais filtrage des objets pas encore implémenté.
- Ajuster une quantité en l’augmentant ou en la diminuant, supprimer une ligne ou réinitialiser tout le stock.
- Enregistrer et modifier le montant des liquidités de l’usine.
- Empêcher le retrait d’une quantité supérieure au stock disponible.

## Utilisation

Ouvrir `index.html` dans un navigateur moderne. La navigation permet d’accéder à l’accueil, au marché, aux produits et au stock. Aucune étape de compilation ni dépendance d’exécution n’est requise.

Les données sont propres au navigateur et à son origine. Effacer les données du site ou utiliser un autre navigateur/profil ne conserve pas l’usine. Le bouton de réinitialisation de l’accueil remplace l’usine locale par une nouvelle usine vide.

## Organisation du projet

- `index.html`, `marché.html`, `produits.html`, `edition_produit.html`, `stock.html` : pages et interactions de l’interface.
- `app/domain.js` : modèles métier (tarifs, recettes, ingrédients, produits, catalogue et inventaire) et calculs.
- `app/service.js` : orchestration de l’usine, propagation des mises à jour et sérialisation des données.
- `app/presentation.js` : décodage des listes importées, formatage et notifications.
- `style/style.css` : styles de l’interface.
- `__test__/` : tests unitaires du domaine, des services et de la présentation.

## Limites actuelles

- Les données et prix sont saisis/importés manuellement ; il n’y a pas de connexion à une API de marché ni de synchronisation entre appareils.
- Les calculs dépendent de la disponibilité et de la fraîcheur des prix saisis. Une recette dont les entrées nécessaires n’ont pas de prix exploitable ne peut pas avoir de rentabilité calculée.
- Le tableau des produits n’offre pas encore de recherche ni de tri. Dans le stock, le champ de recherche est présent, mais son filtrage n’est pas encore implémenté.
- Le suivi de stock ne déduit pas automatiquement les matériaux consommés ou les objets fabriqués lors d’une production.
- L’accueil n’est pas encore un tableau de bord de planification de production.
- Les liquidités sont suivies séparément : aucun budget, achat ou gain n’est automatiquement déduit ou crédité.

## Perspectives

Une évolution naturelle consiste à transformer les estimations en **outil de planification de production** : choisir un produit et une quantité, comparer achat et fabrication pour chaque composant, puis proposer une séquence d’achats et de fabrications selon les recettes et le stock disponible. La réservation des composants et le suivi des fabrications en cours permettraient ensuite de refléter l’avancement réel sans confondre stock disponible et stock engagé.

D’autres pistes utiles seraient d’ajouter la recherche et le tri au catalogue des produits, d’afficher la date de référence et les données manquantes avec chaque estimation, de calculer le capital restant à investir, et de permettre l’export/import d’une sauvegarde. À plus long terme, une synchronisation de prix configurable et une interface multilingue pourraient réduire la saisie manuelle et élargir l’usage de l’application.

## Développement

Le projet utilise des modules JavaScript natifs et des tests Mocha. Pour lancer les tests :

```sh
npm test
```
