# Design: Feuille de style non appliquée sur index.html

## Bug Condition

### isBugCondition(input)

```
isBugCondition(file) :=
  file == "index.html"
  AND file contient un tag <link> dont l'attribut `href` est fragmenté sur plusieurs lignes
  AND le navigateur ne charge pas ./style/style.css
```

**Cas concret** : dans `index.html` lignes 9–10 :
```html
<link rel="stylesheet" h
  ref="./style/style.css" />
```
Le navigateur voit l'attribut `h` (valeur vide) et l'attribut `ref` (non reconnu comme `href`), donc il ignore la feuille de style.

## Expected Behavior

### expectedBehavior(result)

```
expectedBehavior(file) :=
  file contient exactement : <link rel="stylesheet" href="./style/style.css" />
  AND l'attribut href est sur une seule ligne
  AND le navigateur charge ./style/style.css
  AND les styles CSS s'appliquent à la page index.html
```

### Expected Behavior Properties

- **P1** : Le tag `<link>` dans `index.html` possède un attribut `href` valide sur une seule ligne.
- **P2** : La valeur de `href` est exactement `./style/style.css`.
- **P3** : Aucun autre attribut ou balise du `<head>` n'est modifié.

## Preservation Requirements

Les comportements suivants, observés sur le code non corrigé, DOIVENT être préservés après la correction :

| # | Comportement à préserver | Condition (¬C(X)) |
|---|--------------------------|-------------------|
| PR1 | Tous les autres tags du `<head>` restent inchangés (`<title>`, `<meta charset>`, `<meta viewport>`) | Ne pas toucher à ces lignes |
| PR2 | Le `<body>` (nav, main, footer, scripts) reste intact | La correction ne porte que sur les lignes 9–10 |
| PR3 | Les autres pages HTML du projet (`marché.html`, `produits.html`, `stock.html`, `edition_produit.html`) ne sont pas affectées | La correction est limitée à `index.html` |

## Fix Specification

### Changement minimal

Remplacer les lignes 9–10 de `index.html` :

**Avant (buggy) :**
```html
<link rel="stylesheet" h
  ref="./style/style.css" />
```

**Après (corrigé) :**
```html
<link rel="stylesheet" href="./style/style.css" />
```

### Périmètre

- **Fichier** : `index.html` uniquement
- **Lignes** : 9–10 (deux lignes → une seule ligne)
- **Aucun autre changement** n'est requis

## Verification Strategy

### Exploration (Bug Condition Test)

Vérifier que `index.html` contient le pattern buggy avant le fix :
- Parser le HTML et constater que l'attribut `href` est absent du tag `<link>` (ou sa valeur est invalide)
- Confirmer que `./style/style.css` n'est pas référencé correctement

### Preservation Test

Vérifier que tous les autres éléments de `index.html` restent inchangés :
- `<title>Gestion de l'usine</title>` présent
- `<meta charset="utf-8" />` présent
- `<meta name="viewport" ...>` présent
- Le `<body>` est identique mot pour mot (hors lignes 9–10)
