# Plan d'implémentation — Echoes Factory

## Vue d'ensemble

Ce plan de tâches couvre l'ensemble du projet Echoes Factory. Les fonctionnalités déjà en production (marquées ✅ dans les exigences) sont listées comme tâches optionnelles — elles sont implémentées et peuvent servir de référence. Les améliorations planifiées (☐ dans les exigences) constituent les tâches réelles à développer.

> Les tâches marquées `*` sont optionnelles (code déjà en production ou tests associés à du code existant).

---

## Tâches

- [ ]* 1. Couche domaine — classes métier de base
  - [ ]* 1.1 Implémenter `Tarif`, `Tarification`, `Ingrédient`, `Recette`, `Inventaire`, `Catalogue`, `Produit` dans `app/domain.js`
    - Champs privés (`#`), préconditions, formule de rentabilité, règles de statut
    - _Exigences : 1.1, 3.4, 3.7, 4.2, 4.3, 4.4, 4.5, 4.8, 4.9, 4.10, 4.11, 4.12, 7.3, 7.4, 7.5_
  - [ ]* 1.2 Écrire les tests unitaires du domaine (`__test__/domain.test.js`)
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
  - [ ]* 2.1 Implémenter `GestionnaireEvenements` et `Usine` dans `app/service.js`
    - Propagation `maj_tarif` / `maj_produit`, sérialisation `toString` / `parse`, gestion des liquidités
    - _Exigences : 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.5, 3.1, 3.5, 4.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.3, 7.10, 7.11, 7.12_
  - [ ]* 2.2 Écrire les tests d'intégration de la façade Usine (`__test__/service.test.js`)
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

- [ ] 5. Point de contrôle — vérification de l'état initial
  - Exécuter `npm test` et s'assurer que tous les tests existants passent avant d'implémenter les nouvelles fonctionnalités.

- [ ] 6. Amélioration UI — recherche et tri dans les listes
  - [ ] 6.1 Ajouter le tri par colonne et la recherche par nom dans `stock.html`
    - Clic sur un en-tête de colonne → tri croissant/décroissant alterné ; les deux comportements sont cumulables
    - Champ texte filtrant les lignes du tableau en temps réel sur le nom de l'objet (correspondance partielle, insensible à la casse)
    - L'état de tri (colonne + direction) est géré localement dans la page, sans persistance
    - _Exigences : 8.5, 8.6_
  - [ ]* 6.2 Écrire les tests unitaires du tri et du filtre du stock
    - Tester le filtrage avec saisie vide, partielle et sans correspondance
    - Tester l'alternance croissant/décroissant et les différentes colonnes triables
    - _Exigences : 8.5, 8.6_
  - [ ] 6.3 Ajouter le tri par colonne dans `produits.html`
    - Clic sur en-tête de colonne → tri croissant/décroissant alterné
    - _Exigences : 8.7_
  - [ ]* 6.4 Écrire les tests unitaires du tri par colonne des produits
    - Tester l'alternance croissant/décroissant et les différentes colonnes
    - _Exigences : 8.7_
  - [ ] 6.5 Ajouter un champ de recherche dans `produits.html` pour filtrer les produits par nom
    - Filtrer les produits affichés en temps réel selon la saisie
    - _Exigences : 8.7_
  - [ ]* 6.6 Écrire les tests unitaires du filtre de recherche des produits
    - Tester le filtrage avec saisie vide, partielle et sans correspondance
    - _Exigences : 8.7_
  - [ ] 6.7 Ajouter le tri par colonne et la recherche par nom dans `marché.html`
    - Clic sur un en-tête de colonne → tri croissant/décroissant alterné
    - Champ texte filtrant les tarifs en temps réel sur le nom de l'objet (correspondance partielle, insensible à la casse)
    - Les deux comportements sont indépendants et cumulables, sans persistance de l'état de tri
    - _Exigences : 8.9, 8.10_
  - [ ]* 6.8 Écrire les tests unitaires du tri et du filtre du marché
    - Tester le filtrage avec saisie vide, partielle et sans correspondance
    - Tester l'alternance croissant/décroissant et les différentes colonnes triables
    - _Exigences : 8.9, 8.10_

- [ ] 7. Point de contrôle — vérification des améliorations UI
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

- [ ] 9. Affichage de la date de référence des estimations
  - [ ] 9.1 Afficher la date d'effet du tarif le plus ancien dans la ligne produit de `produits.html`
    - Ajouter une colonne ou une info secondaire avec la date de référence
    - _Exigences : 11.1_
  - [ ] 9.2 Signaler visuellement les estimations périmées dans `produits.html`
    - Appliquer une classe CSS d'alerte si la date du tarif dépasse un seuil configurable
    - _Exigences : 11.2_
  - [ ]* 9.3 Écrire les tests unitaires de la détection de péremption
    - Tester le calcul de péremption pour différentes dates et seuils
    - _Exigences : 11.2_

- [ ] 10. Point de contrôle — vérification des nouvelles fonctionnalités
  - Exécuter `npm test` et s'assurer que tous les tests passent.

- [ ] 11. Planification de production — moteur de calcul
  - [ ] 11.1 Implémenter la classe `Planificateur` dans `app/service.js` (ou `app/planificateur.js`)
    - Pour un produit cible et une quantité donnée, comparer coût de fabrication vs coût d'achat pour chaque composant
    - Proposer une séquence d'achats/fabrications ordonnée minimisant le coût total
    - _Exigences : 9.1, 9.2_
  - [ ] 11.2 Écrire les tests unitaires du `Planificateur`
    - Tester les cas : composant BUY, composant BUILD, composant sans tarif, arborescence imbriquée
    - _Exigences : 9.1, 9.2_
  - [ ] 11.3 Implémenter la réservation de composants dans l'`Inventaire`
    - Ajouter les notions de stock disponible vs stock engagé lors de la planification
    - _Exigences : 9.3_
  - [ ] 11.4 Écrire les tests unitaires de la réservation de stock
    - Tester que le stock engagé est bien soustrait du stock disponible
    - _Exigences : 9.3_
  - [ ] 11.5 Implémenter le suivi des fabrications en cours dans l'`Usine`
    - Stocker les plans de fabrication validés et permettre de suivre leur avancement
    - _Exigences : 9.4_
  - [ ] 11.6 Écrire les tests d'intégration du suivi de production
    - Tester la validation d'un plan, la progression et la finalisation d'une fabrication
    - _Exigences : 9.4_

- [ ] 12. Planification de production — interface utilisateur
  - [ ] 12.1 Créer la page `planification.html` avec le formulaire de sélection produit + quantité cible
    - Afficher le plan proposé (liste d'achats et fabrications ordonnées)
    - Ajouter le lien de navigation vers cette page dans la barre de navigation de toutes les pages
    - Déclencher `Usine.évaluer()` pour chaque ligne valide de toute saisie TSV dans la page (Exigence 3.8)
    - _Exigences : 9.1, 9.2, 3.8, 8.11_
  - [ ] 12.2 Implémenter la surcharge utilisateur achat/fabrication dans `planification.html`
    - Pour chaque ingrédient qui est aussi un `Produit` du catalogue, afficher la décision par défaut (basée sur le statut `BUILD`/`BUY`) et permettre à l'utilisateur de la remplacer par un choix explicite
    - Recalculer le coût total du plan en fonction des surcharges appliquées
    - _Exigences : 9.5_
  - [ ] 12.3 Écrire les tests unitaires de la surcharge achat/fabrication
    - Tester que la surcharge modifie bien le calcul de coût (forcer fabrication sur un `BUY`, forcer achat sur un `BUILD`)
    - _Exigences : 9.5_
  - [ ] 12.4 Afficher les ressources et liquidités restantes estimées dans `planification.html`
    - À côté du stock actuel, afficher le stock résiduel estimé après exécution du plan
    - Afficher les liquidités restantes estimées après les achats prévus
    - Mettre en évidence visuellement ces indicateurs (colonne dédiée ou couleur différente)
    - _Exigences : 7.13, 7.14_
  - [ ] 12.5 Implémenter la détection des déficits dans le `Planificateur`
    - Pour chaque composant du plan, comparer la quantité requise au stock disponible et calculer le déficit éventuel
    - Calculer le coût total des achats prévus et le comparer aux liquidités disponibles pour identifier un éventuel déficit de trésorerie
    - Le plan reste généré même en cas de ressources insuffisantes (aucun blocage)
    - _Exigences : 9.7, 9.8, 9.9_
  - [ ] 12.6 Écrire les tests unitaires de la détection des déficits
    - Tester qu'un plan est bien produit malgré un stock insuffisant
    - Tester le calcul du déficit par composant (quantité disponible < quantité requise)
    - Tester la détection du déficit de liquidités (coût total > liquidités disponibles)
    - _Exigences : 9.7, 9.8, 9.9_
  - [ ] 12.7 Afficher les déficits visuellement dans `planification.html`
    - Mettre en évidence les composants dont le stock disponible est insuffisant (quantités manquantes en rouge ou avec icône d'alerte)
    - Afficher le déficit de liquidités lorsque les achats prévus dépassent les liquidités disponibles
    - _Exigences : 9.8, 9.9_
  - [ ] 12.8 Implémenter la priorisation des étapes réalisables dans le `Planificateur`
    - Trier les étapes de fabrication de façon à placer en tête celles dont tous les composants sont déjà disponibles en stock, avant celles qui nécessitent des achats ou des ressources manquantes
    - _Exigences : 9.10_
  - [ ]* 12.9 Écrire les tests unitaires de la priorisation des étapes réalisables
    - Tester qu'une étape entièrement couverte par le stock apparaît avant une étape avec composants manquants
    - Tester le cas où aucune étape n'est immédiatement réalisable
    - _Exigences : 9.10_
  - [ ] 12.10 Afficher le résumé des fabrications en cours sur `index.html`
    - Ajouter une section résumé sur la page d'accueil avec les étapes suivantes
    - _Exigences : 9.5_

- [ ] 13. Point de contrôle final — validation complète
  - Exécuter `npm test` et s'assurer que l'intégralité des tests passe.

- [ ]* 14. Refactoring optionnel — abstraction de la couche de stockage (Exigence 1.7)
  - [ ]* 14.1 Créer l'interface `StockageAdapter` et l'implémentation `LocalStorageAdapter` dans `app/service.js`
    - Déplacer la lecture/écriture `localStorage` dans l'adaptateur ; injecter celui-ci dans l'`Usine`
    - Toutes les pages délèguent la persistance via cet adaptateur plutôt qu'en appelant `localStorage` directement
    - _Exigences : 1.7_
  - [ ]* 14.2 Écrire les tests unitaires du `LocalStorageAdapter`
    - Vérifier que l'adaptateur lit, écrit et efface correctement la clé `usine` dans le `localStorage`
    - _Exigences : 1.7_

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
    { "id": 8, "tasks": ["11.4", "11.5", "12.1"] },
    { "id": 9, "tasks": ["11.6", "12.2", "12.4"] },
    { "id": 10, "tasks": ["12.3", "12.5", "12.8"] },
    { "id": 11, "tasks": ["12.6", "12.7", "12.9", "12.10"] },
    { "id": 12, "tasks": ["14.1"] },
    { "id": 13, "tasks": ["14.2"] }
  ]
}
```
