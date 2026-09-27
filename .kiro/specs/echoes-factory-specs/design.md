# Document de Design — Echoes Factory

## Vue d'ensemble

Echoes Factory est une application web sans serveur, entièrement côté client. Aucune compilation n'est nécessaire : les fichiers HTML sont servis directement, et les modules JavaScript ES natifs (`type="module"`) assurent l'import des dépendances. L'application est constituée d'un ensemble de pages HTML autonomes (non une SPA au sens strict) partageant une même bibliothèque de domaine et de service. Toutes les données sont actuellement persistées dans le `localStorage` du navigateur sous forme de JSON ; une abstraction de la couche de stockage est prévue pour permettre une persistance dans un service externe (cf. Exigence 1.7).

L'architecture suit une séparation en trois couches :

```
Couche domaine (domain.js)        ← modèle métier pur, sans dépendance externe
Couche service (service.js)       ← façade Usine + bus d'événements GestionnaireEvenements
Couche présentation               ← pages HTML et scripts associés
```

> **Perspective — abstraction du stockage (Exigence 1.7) :** La persistance est aujourd'hui couplée à `localStorage` directement dans chaque page. Pour permettre un stockage dans un service externe indépendant de l'équipement, il faudra introduire une interface `StockageAdapter` (par ex. `LocalStorageAdapter` / `RemoteAdapter`) injectée au niveau de la façade `Usine`. Les pages délégueraient la lecture/écriture à cet adaptateur plutôt qu'à `localStorage` directement. Aucune modification du modèle de domaine ne serait nécessaire.

---

## Architecture des composants

### 1. Couche domaine — `app/domain.js`

Contient les classes métier pures, sans aucune dépendance sur le DOM ni sur le stockage. Toutes les classes utilisent des champs privés (`#`) pour garantir l'encapsulation.

#### `Tarif`

Représente le prix unitaire daté d'un objet. Immutable après construction.

```javascript
class Tarif {
  #nom        // string — nom de l'objet évalué
  #montant    // number — prix unitaire
  #date_effet // Date   — date de l'évaluation (copie défensive)

  constructor(nom, prix, date_effet = new Date())
  // Préconditions : nom non vide, prix > 0
  toString() // → JSON string
}
```

#### `Tarification`

Collection de tarifs avec contrôle d'antidatage. Refuse toute mise à jour dont la date est antérieure au tarif existant. Immutable après construction.

```javascript
class Tarification {
  #tarifs // Map<string, Tarif>

  mise_a_jour(objet, prix, date = new Date()) // → Tarif | throws si antidatage
  tarif(objet)                                // → Tarif | undefined
  get tarifs()                                // → Tarif[]
}
```

#### `Ingrédient`

Composant d'une recette, caractérisé par un nom et une quantité entière. Peut référencer un `Tarif` unitaire estimé et/ou le `Produit` correspondant dans le catalogue. Seuls le prix estimés et le produit associé peuvent changer une fois initialisé.

```javascript
class Ingrédient {
  #nom              // string
  #quantité         // number (entier > 0)
  #estimé_unitaire  // Tarif | undefined
  #produit          // Produit | undefined

  get prix()        // → number | undefined
  // Si produit.statut === 'BUILD' → utilise produit.coût_reviens
  // Sinon → utilise estimé_unitaire.montant
  // × quantité
}
```

#### `Recette`

Décrit la méthode de fabrication d'un objet : nom, frais fixes, liste d'ingrédients, quantité produite, taux de réussite. Immutable après construction.

```javascript
class Recette {
  #nom             // string
  #frais           // number (entier > 0)
  #ingrédients     // Ingrédient[]
  #quantité_produite  // number (entier > 0)
  #chance_de_succès   // number ∈ ]0, 1]

  toString()       // → JSON string
}
```

#### `Produit`

Représentation opérationnelle d'une recette enrichie des indicateurs de rentabilité. Recalcule ses indicateurs via `évaluer(tarif)`. Seuls le prix estimé et les indicateurs peuvent évoluer une fois initialisé.

```javascript
class Produit {
  #nom, #recette, #statut         // string, Recette, "NA"|"BUY"|"BUILD"
  #prix_estimé, #coût_reviens     // number | undefined
  #rentabilité                    // number | undefined
  #date_effet, #commentaire

  évaluer(tarif)   // recalcule coût_reviens, rentabilité, statut, commentaire
  toString()       // → JSON string
}
```

**Formule de rentabilité :**

```md
rentabilité = (prix_estimé × quantité_produite) / (coût_reviens / chances_de_succès) − 1
```

**Règles de statut :**

- `rentabilité > 0.15` → `BUILD`, commentaire : `Commercialisable`
- `0 < rentabilité ≤ 0.15` → `BUILD`, commentaire : `Pour consommation interne`
- `rentabilité ≤ 0` → `BUY`
- tarif ou coût manquant → `NA`

#### `Catalogue`

Collection de `Produit` garantissant l'unicité par nom. Il ne peut être modifié que par ses méthodes `inscrire(entrée)` et `retirer(entrée)`, sa consistance et garantie en dehors de ces méthodes.

```javascript
class Catalogue {
  inscrire(entrée)  // throws si nom déjà présent
  retirer(entrée)   // → Produit | undefined
  rechercher(entrée)// → Produit | undefined (Object.freeze)
  get fiches()      // → Produit[]
  get index()       // → string[]
}
```

#### `Inventaire`

Gestion des quantités en stock. Accepte uniquement des quantités entières strictement positives. Ne peut être modifié en dehors des fonctions `ajoute(objet, quantité)` et `retire(objet, quantité)`

```javascript
class Inventaire {
  ajoute(objet, quantité)  // → nouveau total | throws si invalide
  retire(objet, quantité)  // → nouveau total | throws si dépassement
  quantité_en_stock(objet) // → number (0 si absent)
  get stock()              // → {nom, quantité}[]
  // Supprime l'entrée quand quantité atteint 0
}
```

---

### 2. Couche service — `app/service.js`

#### `GestionnaireEvenements`

Bus d'événements pub/sub interne. Deux types d'événements circulent dans l'application :

- `maj_tarif` — déclenché quand un tarif est mis à jour
- `maj_produit` — déclenché quand un produit est ajouté, modifié ou supprimé

```javascript
class GestionnaireEvenements {
  consomme(type, consommateur) // enregistre un listener
  produit(type, données)       // émet l'événement vers tous les listeners enregistrés à l'instant t
}
```

#### `Usine`

Façade principale de l'application. Coordonne le catalogue, la tarification, l'inventaire et le bus d'événements.

```javascript
class Usine {
  #nom, #liquidités
  #catalogue_produits  // Catalogue
  #marché              // Tarification
  #inventaire          // Inventaire
  #gestionnaire_evenements  // GestionnaireEvenements

  // Accès en lecture
  get produits()   // → Produit[]
  get recettes()   // → Recette[]
  get tarifs()     // → Tarif[]
  get stock()      // → {nom, quantité}[]
  get liquidités() // → number
  set liquidités(montant) // → void | throws si non entier positif

  // Gestion des produits
  ajouteProduit(recette)   // → void | throws si doublon
  modifieProduit(recette)  // → void | conserve ancien en cas d'erreur
  supprimeProduit(nom)     // → void | throws si absent
  produit(nom)             // → Produit | undefined

  // Gestion du marché
  évaluer(objet, prix, date) // → void | throws si antidatage

  // Gestion du stock
  stocker(nom, quantité)     // → nouveau total
  déstocker(objet?, quantité?) // vide tout si sans argument

  // Sérialisation
  toString()           // → JSON string
  static parse(string) // → Usine | throws si JSON invalide
}
```

**Flux de propagation interne :**

```md
évaluer(objet, prix)
  → Tarification.mise_a_jour()
  → GestionnaireEvenements.produit("maj_tarif", objet)
    → maj_ingrédient_produit(objet)
      → Produit.évaluer(tarif) [produit direct s'il existe]
      → Produit.évaluer(tarif) [tous les produits dépendants]

ajouteProduit / modifieProduit / supprimeProduit
  → GestionnaireEvenements.produit("maj_produit", nom)
    → maj_ingrédient_produit(nom)
      → mise à jour des références ingrédient.produit dans les produits dépendants
      → Produit.évaluer() [recalcule des autres produits dépendants de la mise à jour]
```

**Initialisation et désérialisation (`Usine.parse`) :**

L'ordre d'initialisation est impératif pour assurer la cohérence des calculs :

1. Enregistrement des tarifs (`évaluer`)
2. Remplissage du stock (`stocker`)
3. Création des produits (`ajouteProduit`) — dans cet ordre, les tarifs sont déjà disponibles

Les données numériques fournies sous forme de chaînes de caractères sont converties via `Number.parseFloat` avant usage.

---

### 3. Couche présentation — `app/presentation.js`

Utilitaires partagés entre toutes les pages HTML.

#### `decodeEchoesListe(value)`

Parse une chaîne multi-lignes au format TSV EVE Echoes :

```md
index\tnom\tquantité\tvaleur_totale
```

Retourne `{index, nom, quantité, valeur}[]`. Les lignes ne correspondant pas au regex `/^(\d+)\t(.+)\t(\d+)\t(.+)$/` sont silencieusement ignorées.

> **Comportement transversal — mise à jour des tarifs (Exigence 3.8) :** Quelle que soit la destination initiale de la saisie TSV (stock, ingrédients d'une recette, marché), chaque ligne valide doit également déclencher un appel à `Usine.évaluer()` pour mettre à jour le tarif de l'objet correspondant (prix unitaire = `valeur / quantité`). Ce comportement est implémenté au niveau de chaque page qui consomme `decodeEchoesListe`, immédiatement après le traitement principal de la liste.

#### `NUMBER_FORMAT`

Formateur de nombres via `Intl.NumberFormat`. Deux modes :

- `format(value, "float")` — 2 décimales (défaut)
- `format(value, "integer")` — 0 décimale

#### `UNICODE_DATE_FORMAT`

Instance de `Intl.DateTimeFormat("fr-FR")` pour l'affichage des dates au format français.

#### `initialiserElement(typeElement, classes, contenu, evenements)`

Fabrique un élément HTML avec classes CSS, contenu textuel et listeners d'événements en une seule opération.

#### `notifier(message, level)`

Affiche une notification contextuelle dans un élément `<dialog id="notification">` (créé si absent). Le message disparaît automatiquement après 5 secondes. Niveaux : `"info"`, `"warn"`, `"error"`.

---

### 4. Pages HTML

Chaque page est un couple composé d'document HTML et de son script (sous forme de module) associé. Le cycle de vie est identique sur toutes les pages :

```md
1. Lire localStorage.getItem("usine")
2. Usine.parse() → instance Usine
3. Rendre le DOM à partir des données de l'usine
4. Écouter les événements utilisateur
5. Sur modification → usine.methode() + localStorage.setItem("usine", usine.toString())
6. Sur import TSV (toute page) → appeler aussi Usine.évaluer() pour chaque ligne valide (Exigence 3.8)
```

| Page                   | Responsabilité principale                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `index.html`           | Tableau de bord : nom, statistiques, reset                                                      |
| `marché.html`          | Saisie et affichage des tarifs (unitaire + import TSV) ; tri par colonne et recherche par nom   |
| `produits.html`        | Catalogue produits avec rentabilité, édition, suppression                                       |
| `edition_produit.html` | Formulaire de création/modification de recette + ingrédients                                    |
| `stock.html`           | Gestion du stock et des liquidités (unitaire + import TSV) ; tri par colonne et recherche par nom |
| `planification.html`   | Sélection d'un produit cible, plan d'achats/fabrications, surcharge achat/fabrication par ingrédient, visualisation des ressources et liquidités restantes |

La barre de navigation est reproduite sur chaque page. Le lien de la page courante porte la classe `btn` (actif) vs `btn ghost` (inactif).

#### Tri et recherche dans les tableaux (Exigences 8.5–8.10)

Les pages `stock.html` et `marché.html` exposent chacune un tableau triable et filtrable :

- **Tri par colonne** : un clic sur un en-tête de colonne trie les lignes selon cette colonne ; un deuxième clic inverse l'ordre. L'état de tri (colonne + direction) est géré localement dans la page, sans persistance.
- **Recherche** : un champ texte filtre les lignes en temps réel sur le nom de l'objet (correspondance partielle, insensible à la casse).
- Ces deux comportements sont indépendants et cumulables (filtrer puis trier, ou vice-versa).

La page `produits.html` gagnera également un tri par colonne (Exigence 8.7) et une recherche par nom (Exigence 8.8) selon le même modèle.

#### Page planification (Exigences 9.1–9.10, 7.13–7.14)

La page `planification.html` orchestrera les interactions suivantes :

1. **Sélection du produit cible et de la quantité** — l'utilisateur choisit un produit du catalogue et saisit une quantité souhaitée.
2. **Plan d'achats/fabrications** — le `Planificateur` calcule, pour chaque composant nécessaire, la comparaison coût de fabrication / coût d'achat et propose une séquence ordonnée minimisant le coût total.
3. **Choix par défaut basé sur la rentabilité** — le planificateur applique par défaut la décision achat/fabrication déduite du statut de chaque ingrédient-produit (`BUILD` → fabriquer, `BUY` → acheter).
4. **Surcharge utilisateur (Exigence 9.6)** — pour chaque ingrédient qui est également un `Produit` du catalogue, l'utilisateur peut remplacer la décision par défaut par un choix explicite (forcer l'achat ou forcer la fabrication). Ce choix est affiché clairement dans le plan et modifie le calcul de coût en conséquence.
5. **Ressources et liquidités restantes (Exigences 7.13/7.14)** — la page affiche, à côté du stock actuel, le stock résiduel estimé après exécution du plan, ainsi que les liquidités restantes après les achats prévus. Ces deux indicateurs sont mis en évidence visuellement (ex. colonne dédiée, couleur différente).
6. **Réservation de composants (Exigence 9.3)** — lors de la validation d'un plan, les composants nécessaires sont marqués « engagés » dans l'inventaire pour distinguer stock disponible et stock réservé.
7. **Plan toujours produit malgré les ressources insuffisantes (Exigence 9.7)** — le `Planificateur` ne bloque jamais la génération d'un plan : si le stock ou les liquidités sont insuffisants, le plan est affiché en intégralité, et les manques sont signalés visuellement sans empêcher la consultation du plan.
8. **Mise en évidence des composants en déficit (Exigence 9.8)** — pour chaque composant du plan dont la quantité disponible en stock est inférieure à la quantité requise, la ligne correspondante est mise en évidence visuellement (ex. quantité manquante en couleur d'alerte, icône d'avertissement). La quantité manquante exacte est affichée à côté de la quantité requise.
9. **Mise en évidence du déficit de liquidités (Exigence 9.9)** — si le total des achats prévus dans le plan dépasse les liquidités disponibles, le montant du déficit est affiché de façon proéminente (ex. montant en rouge, indicateur dédié au-dessus ou en dessous du récapitulatif du plan).
10. **Priorisation des étapes réalisables (Exigence 9.10)** — lorsque le plan comporte des ressources manquantes, le `Planificateur` ordonne la liste des prochaines étapes de fabrication en plaçant en tête celles dont tous les composants sont déjà disponibles en stock, suivies de celles qui nécessitent des achats ou présentent des ressources manquantes. L'ordre au sein de chaque groupe reste déterminé par la minimisation du coût total.

---

## Modèle de données — Format JSON (localStorage)

```json
{
  "nom": "string",
  "liquidités": 0,
  "recettes": [
    {
      "nom": "string",
      "frais": 0,
      "quantité_produite": 1,
      "chance_succès": 1,
      "ingrédients": [
        { "nom": "string", "quantité": 1 }
      ]
    }
  ],
  "tarifs": [
    { "nom": "string", "montant": "number", "date_effet": "ISO8601" }
  ],
  "stock": [
    { "nom": "string", "quantité": 1 }
  ]
}
```

> Les montants de tarifs sont sérialisés comme chaînes (`"montant":"1500"`) mais reconvertis en nombres à la désérialisation. L'`Usine` accepte des valeurs numériques sous forme de chaînes pour tous les champs concernés.

---

## Stratégie de tests

### Framework

**Mocha** (runner) + **Chai** (assertions) + **jsdom** (DOM simulé pour les tests de présentation).

Commande : `npm test` → `mocha --exit "__test__/**/*.test.js"`

### Organisation des fichiers de test

```md
__test__/
  domain.test.js       ← tests unitaires des classes du domaine
  service.test.js      ← tests d'intégration de la façade Usine
  presentation.test.js ← tests des utilitaires UI
```

### Approche duale

- **Tests par exemple** : comportements spécifiques (création d'une usine vide, cas d'erreur précis, valeurs limites)
- **Tests de propriétés** : invariants universels (formule de rentabilité, round-trip sérialisation, propagation des mises à jour)

---

## Gestion des erreurs

| Contexte                           | Comportement                                                            |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `Usine.parse()` avec JSON invalide | Log console + propagation de l'exception                                |
| Tarif antidaté                     | Exception + log `console.warn` dans `Usine.évaluer`                     |
| Recette/Ingrédient invalide        | Exception levée par le constructeur                                     |
| Stock insuffisant au retrait       | Exception `Inventaire.retire` avec message explicite                    |
| Liquidités invalides               | Exception `Usine.liquidités` setter                                     |
| Ligne TSV malformée                | Ignorée silencieusement par `decodeEchoesListe`                         |
| Erreur dans une opération UI       | `notifier(message, "error")` — notification 5 s                         |
| Modification de produit qui échoue | `modifieProduit` conserve la version précédente du produit dans l'Usine |

---

## Propriétés de correction

*Une propriété est une caractéristique ou un comportement qui doit rester vrai pour toutes les exécutions valides du système — c'est une affirmation formelle sur ce que le système est censé faire. Les propriétés constituent le pont entre les spécifications lisibles par l'humain et les garanties de correction vérifiables automatiquement.*

### Propriété 1 : Aller-retour de sérialisation de l'Usine

*Pour toute* instance d'`Usine` valide (nom, recettes, tarifs, stock, liquidités quelconques), la sérialisation via `toString()` suivie de la désérialisation via `Usine.parse()` doit produire une usine dont toutes les propriétés observables (nom, nombre de produits, coûts de revient, prix estimés, dates d'effet, stock, tarifs, liquidités) sont égales à celles de l'usine originale.

**Validates: Requirements 1.1**

---

### Propriété 2 : Calcul du coût de revient

*Pour toute* `Recette` avec frais `f`, `n` ingrédients de nom `i_k` et quantité `q_k`, et *pour tout* ensemble de tarifs unitaires `p_k > 0` associés à chaque ingrédient, le `coût_reviens` du `Produit` résultant doit être égal à `f + Σ(p_k × q_k)`.

**Validates: Requirements 4.5**

---

### Propriété 3 : Cohérence du statut de rentabilité

*Pour tout* `Produit` dont le `prix_estimé` et le `coût_reviens` sont définis, le `statut` et le `commentaire` doivent être déterminés exclusivement par la valeur de `rentabilité` selon les seuils définis :

- `rentabilité > 0.15` → `statut = "BUILD"`, commentaire `"Commercialisable"`
- `0 < rentabilité ≤ 0.15` → `statut = "BUILD"`, commentaire `"Pour consommation interne"`
- `rentabilité ≤ 0` → `statut = "BUY"`

**Validates: Requirements 4.8, 4.9, 4.10**

---

### Propriété 4 : Propagation des mises à jour de tarif

*Pour tout* produit P dont la recette contient un ingrédient X, et *pour toute* mise à jour du tarif de X dans l'`Usine`, le `coût_reviens` de P après la mise à jour doit refléter le nouveau tarif de X dans le calcul.

**Validates: Requirements 3.5, 6.1, 6.2**

---

### Propriété 5 : Propagation en cascade des sous-produits

*Pour tout* produit P1 dont la recette contient un ingrédient correspondant au produit P2 (sous-produit), *pour toute* modification de la recette de P2, le `coût_reviens` de P1 après la modification doit utiliser le nouveau `coût_reviens` de P2 (si `statut = "BUILD"`) ou le `prix_estimé` de P2 (si `statut = "BUY"`) comme prix unitaire de l'ingrédient P2.

**Validates: Requirements 4.11, 4.12, 6.3, 6.4**

---

### Propriété 6 : Rejet de l'antidatage des tarifs

*Pour tout* objet X ayant un tarif existant à la date T, toute tentative de mise à jour du tarif de X avec une date antérieure à T doit être rejetée, et le tarif existant doit rester inchangé.

**Validates: Requirements 3.4**

---

### Propriété 7 : Décodage du format TSV EVE Echoes

*Pour toute* chaîne multi-lignes contenant des lignes au format `index\tnom\tquantité\tvaleur` entremêlées de lignes invalides, `decodeEchoesListe` doit retourner exactement les lignes valides décodées (avec les valeurs numériques correctement parsées), et aucune ligne invalide ne doit apparaître dans le résultat. De plus, *pour toute* page qui consomme `decodeEchoesListe`, chaque ligne valide doit produire une mise à jour de tarif dans l'`Usine` (prix unitaire = `valeur / quantité`), quelle que soit la destination principale de la saisie.

**Validates: Requirements 3.2, 3.6, 3.8**

---

### Propriété 8 : Invariants de l'Inventaire

*Pour tout* objet X et *toute* séquence d'opérations `ajoute`/`retire` valides :

- La quantité en stock après `ajoute(X, n)` est égale à la quantité précédente plus `n`.
- La quantité en stock après `retire(X, n)` est égale à la quantité précédente moins `n`.
- Si la quantité atteint 0, l'entrée est supprimée du stock.
- Toute tentative de retrait dépassant le stock disponible doit lever une exception.

**Validates: Requirements 7.3, 7.4, 7.5**

---

### Propriété 9 : Robustesse aux données numériques sous forme de chaînes

*Pour toute* instance d'`Usine` initialisée avec des valeurs numériques (frais, quantités, montants, liquidités) fournies sous forme de chaînes de caractères représentant des nombres valides, les calculs (coût de revient, rentabilité) doivent produire des résultats identiques à ceux obtenus avec les mêmes valeurs fournies sous forme de nombres natifs.

**Validates: Requirements 1.6, 7.12**

---

### Propriété 10 : Unicité dans le Catalogue

*Pour tout* `Catalogue` contenant un produit de nom N, toute tentative d'inscription d'un nouveau produit portant le même nom N doit lever une exception, et le catalogue doit rester dans son état précédent.

**Validates: Requirements 4.4**
