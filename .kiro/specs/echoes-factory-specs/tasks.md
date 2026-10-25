# Plan d'implémentation — Echoes Factory

## Vue d'ensemble

Ce fichier est le plan de travail initial, remis en cohérence avec l’implémentation observée. `[x]` signifie que le comportement décrit existe ; les tâches explicitement signalées **partiel** ne couvrent pas encore l’exigence de bout en bout. Les exigences restent la source de vérité pour le périmètre attendu.

> Les tâches marquées `*` sont des tâches de référence/optionnelles ; elles ne sont pas toutes des tests de propriétés effectivement présents. Les tâches fonctionnelles 1.1–4.5 sont déjà réalisées, mais les sous-tâches de tests de propriétés 1.3–1.7, 2.3–2.6 et 3.3 ne sont pas présentes comme telles. Dernière validation observée : `npm test` donne 125 passing, 1 pending et 0 failing.

---

## Tâches

- [ ]* 1. Couche domaine — classes métier de base
  - [x]* 1.1 Implémenter `Tarif`, `Tarification`, `Ingrédient`, `Recette`, `Inventaire`, `Catalogue`, `Produit` dans `app/domain.js`
    - Champs privés (`#`), préconditions, formule de rentabilité, règles de statut
    - _Exigences : 1.1, 3.4, 3.7, 4.2, 4.3, 4.4, 4.5, 4.8, 4.9, 4.10, 4.11, 4.12, 7.3, 7.4, 7.5_
  - [x]* 1.2 Écrire les tests unitaires du domaine (`__test__/domain.test.js`)
    - Couvrir `Ingrédient`, `Produit`, `Catalogue`, `Inventaire`, `Tarification`
    - _Exigences : 3.7, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 1.3 Écrire les tests de propriété — Propriété 2 : calcul du coût de revient
    - **Propriété 2 : Calcul du coût de revient**
    - **Valide : Exigence 4.5**
  - [ ]* 1.4 Écrire les tests de propriété — Propriété 3 : cohérence du statut de rentabilité
    - **Propriété 3 : Cohérence du statut de rentabilité**
    - **Valide : Exigences 4.8, 4.9, 4.10**
  - [ ]* 1.5 Écrire les tests de propriété — Propriété 6 : rejet de l'antidatage
    - **Propriété 6 : Rejet de l'antidatage des tarifs**
    - **Valide : Exigence 3.4**
  - [ ]* 1.6 Écrire les tests de propriété — Propriété 8 : invariants de l'Inventaire
    - **Propriété 8 : Invariants de l'Inventaire**
    - **Valide : Exigences 7.3, 7.4, 7.5**
  - [ ]* 1.7 Écrire les tests de propriété — Propriété 10 : unicité dans le Catalogue
    - **Propriété 10 : Unicité dans le Catalogue**
    - **Valide : Exigence 4.4**

- [ ]* 2. Couche service — façade `Usine` et bus d'événements
  - [x]* 2.1 Implémenter `GestionnaireEvenements` et `Usine` dans `app/service.js`
    - Propagation `maj_tarif` / `maj_produit`, sérialisation `toString` / `parse`, gestion des liquidités
    - _Exigences : 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.5, 3.1, 3.5, 4.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.3, 7.10, 7.11, 7.12_
  - [x]* 2.2 Écrire les tests d'intégration de la façade Usine (`__test__/service.test.js`)
    - Couvrir ajout/modification/suppression de produits, propagation des événements
    - _Exigences : 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4_
  - [ ]* 2.3 Écrire les tests de propriété — Propriété 1 : aller-retour de sérialisation
    - **Propriété 1 : Aller-retour de sérialisation de l'Usine**
    - **Valide : Exigence 1.1**
  - [ ]* 2.4 Écrire les tests de propriété — Propriété 4 : propagation des mises à jour de tarif
    - **Propriété 4 : Propagation des mises à jour de tarif**
    - **Valide : Exigences 3.5, 6.1, 6.2**
  - [ ]* 2.5 Écrire les tests de propriété — Propriété 5 : propagation en cascade des sous-produits
    - **Propriété 5 : Propagation en cascade des sous-produits**
    - **Valide : Exigences 4.11, 4.12, 6.3, 6.4**
  - [ ]* 2.6 Écrire les tests de propriété — Propriété 9 : robustesse aux données numériques sous forme de chaînes
    - **Propriété 9 : Robustesse aux données numériques sous forme de chaînes**
    - **Valide : Exigences 1.6, 7.12**

- [ ]* 3. Couche présentation — utilitaires partagés
  - [ ]* 3.1 Implémenter `decodeEchoesListe`, `NUMBER_FORMAT`, `UNICODE_DATE_FORMAT`, `initialiserElement`, `notifier` dans `app/presentation.js`
    - _Exigences : 3.2, 3.3, 3.6, 5.5, 7.2, 8.4_
  - [ ]* 3.2 Écrire les tests unitaires des utilitaires de présentation (`__test__/presentation.test.js`)
    - Couvrir `decodeEchoesListe`, `initialiserElement`, `notifier`
    - _Exigences : 3.2, 3.6_
  - [ ]* 3.3 Écrire les tests de propriété — Propriété 7 : décodage du format TSV EVE Echoes
    - **Propriété 7 : Décodage du format TSV EVE Echoes**
    - **Valide : Exigences 3.2, 3.6**

- [ ]* 4. Pages HTML — interface utilisateur existante
  - [ ]* 4.1 Implémenter `index.html` — tableau de bord (nom, statistiques, reset)
    - _Exigences : 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2_
  - [ ]* 4.2 Implémenter `marché.html` — saisie et affichage des tarifs (formulaire unitaire + import TSV)
    - _Exigences : 3.1, 3.2, 3.3, 3.4, 3.6, 3.8, 8.3, 8.4_
  - [ ]* 4.3 Implémenter `produits.html` — catalogue produits avec rentabilité, édition, suppression
    - _Exigences : 4.1, 4.13, 5.1, 5.4, 8.3, 8.4_
  - [ ]* 4.4 Implémenter `edition_produit.html` — formulaire de création/modification de recette et ingrédients
    - Déclencher `Usine.évaluer()` pour chaque ligne valide de toute saisie TSV dans les ingrédients (Exigence 3.8)
    - _Exigences : 4.1, 4.2, 5.1, 5.2, 5.3, 5.5, 5.6, 3.8_
  - [ ]* 4.5 Implémenter `stock.html` — gestion du stock et des liquidités (formulaire unitaire + import TSV)
    - Déclencher `Usine.évaluer()` pour chaque ligne valide de toute saisie TSV dans le stock (Exigence 3.8)
    - _Exigences : 7.1, 7.2, 7.3, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 8.3, 8.4, 3.8_

- [x] 5. Point de contrôle — vérification de l'état initial
  - Exécuter `npm test` et s'assurer que tous les tests existants passent avant d'implémenter les nouvelles fonctionnalités.

- [x] 6. Amélioration UI — recherche et tri dans les listes
  - [x] 6.1 Ajouter le tri par colonne et la recherche par nom dans `stock.html`
    - Clic sur un en-tête de colonne → tri croissant/décroissant alterné ; les deux comportements sont cumulables
    - Champ texte filtrant les lignes du tableau en temps réel sur le nom de l'objet (correspondance partielle, insensible à la casse)
    - L'état de tri (colonne + direction) est géré localement dans la page, sans persistance
    - _Exigences : 8.5, 8.6_
  - [x] 6.2 Écrire les tests unitaires du tri et du filtre du stock
    - Tester le filtrage avec saisie vide, partielle et sans correspondance
    - Tester l'alternance croissant/décroissant et les différentes colonnes triables
    - _Exigences : 8.5, 8.6_
  - [x] 6.3 Ajouter le tri par colonne dans `produits.html`
    - Clic sur en-tête de colonne → tri croissant/décroissant alterné
    - _Exigences : 8.7_
  - [x] 6.4 Écrire les tests unitaires du tri par colonne des produits
    - Tester l'alternance croissant/décroissant et les différentes colonnes
    - _Exigences : 8.7_
  - [x] 6.5 Ajouter un champ de recherche dans `produits.html` pour filtrer les produits par nom
    - Filtrer les produits affichés en temps réel selon la saisie
    - _Exigences : 8.7_
  - [x] 6.6 Écrire les tests unitaires du filtre de recherche des produits
    - Tester le filtrage avec saisie vide, partielle et sans correspondance
    - _Exigences : 8.7_
  - [x] 6.7 Ajouter le tri par colonne et la recherche par nom dans `marché.html`
    - Clic sur un en-tête de colonne → tri croissant/décroissant alterné
    - Champ texte filtrant les tarifs en temps réel sur le nom de l'objet (correspondance partielle, insensible à la casse)
    - Les deux comportements sont indépendants et cumulables, sans persistance de l'état de tri
    - _Exigences : 8.9, 8.10_
  - [x] 6.8 Écrire les tests unitaires du tri et du filtre du marché
    - Tester le filtrage avec saisie vide, partielle et sans correspondance
    - Tester l'alternance croissant/décroissant et les différentes colonnes triables
    - _Exigences : 8.9, 8.10_

- [x] 7. Point de contrôle — vérification des améliorations UI
  - Exécuter `npm test` et s'assurer que tous les tests passent.

- [ ] 8. Export et import de la sauvegarde
  - [ ] 8.1 Implémenter le bouton « Exporter » dans `index.html`
    - Générer un fichier JSON avec la sérialisation complète de l'`Usine` et déclencher le téléchargement via un `<a>` avec `URL.createObjectURL`
    - _Exigences : 10.1_
  - [ ] 8.2 Implémenter le formulaire d'import JSON dans `index.html`
    - Lire le fichier sélectionné, appeler `Usine.parse()`, persister dans le `localStorage` et recharger la page
    - Afficher un message d'erreur explicite si le fichier est malformé ou incompatible
    - _Exigences : 10.2, 10.3_
  - [ ]* 8.3 Écrire les tests d'intégration de l'export/import
    - Vérifier le round-trip export → import (aucune donnée perdue)
    - Vérifier qu'un fichier invalide conserve l'usine existante
    - _Exigences : 10.1, 10.2, 10.3_

- [x] 9. Affichage de la date de référence des estimations
  - [x] 9.1 Afficher la date d'effet du tarif le plus ancien dans la ligne produit de `produits.html`
    - Ajouter une colonne ou une info secondaire avec la date de référence
    - _Exigences : 11.1_
  - [x] 9.2 Signaler visuellement les estimations périmées dans `produits.html`
    - Appliquer une classe CSS d'alerte si la date du tarif dépasse un seuil configurable
    - _Exigences : 11.2_
  - [x]* 9.3 Écrire les tests unitaires de la détection de péremption (1 test échoue au seuil exact de 7 jours)
    - Tester le calcul de péremption pour différentes dates et seuils
    - _Exigences : 11.2_

- [ ] 10. Point de contrôle — vérification des nouvelles fonctionnalités
  - Exécuter `npm test` et s'assurer que tous les tests passent.

- [ ] 11. Abstraction de la couche de stockage locale
  - [x] 11.1 Créer l'abstraction `Stockage` / `StockageLocal` dans `app/storage.js`
    - Déléguer la lecture/écriture de l'usine à cette abstraction depuis les pages HTML
    - Mode Pantry réservé pour une itération ultérieure
    - _Exigences : 1.7_
  - [x] 11.2 Migrer les pages HTML vers `Stockage`
    - Remplacer les accès directs à `localStorage` par la nouvelle abstraction
    - _Exigences : 1.7_
  - [x] 11.3 Mettre à jour `sauvegarderUsine` pour accepter l'objet `Usine` directement
    - La sérialisation JSON est gérée en interne par la méthode de stockage
    - _Exigences : 1.7_

- [ ] 12. Point de contrôle — vérification de l'abstraction de stockage
  - Exécuter `npm test` et s'assurer que tous les tests passent.

- [ ]* 13. Refactoring optionnel — préparation pour futures évolutions
  - [ ]* 13.1 Harmoniser les noms de méthodes et constantes entre pages
    - _Exigences : 2.5_
  - [ ]* 13.2 Réduire les duplications de logique UI entre `marché.html` et `stock.html`
    - _Exigences : 8.3, 8.4_

---

## Notes

- Les tâches marquées `*` sont optionnelles : elles correspondent au code déjà en production ou à des tests associés à du code existant. Elles peuvent être ignorées lors d'une exécution de sprint.
- Chaque tâche référence les exigences spécifiques pour assurer la traçabilité.
- Les points de contrôle garantissent une validation incrémentale.
- Les tests de propriétés valident les invariants universels définis dans le document de design.
- Les tests unitaires valident les exemples spécifiques et les cas limites.
- Commande de test : `npm test` → `mocha --exit "__test__/**/*.test.js"`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "3.2", "3.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 4, "tasks": ["6.1", "6.3", "6.5", "6.7", "8.1", "8.2", "9.1", "9.2"] },
    { "id": 5, "tasks": ["6.2", "6.4", "6.6", "6.8", "8.3", "9.3"] },
    { "id": 6, "tasks": ["11.1"] },
    { "id": 7, "tasks": ["11.2", "11.3"] },
    { "id": 8, "tasks": ["12.1", "12.2", "12.3"] }
  ]
}
```
