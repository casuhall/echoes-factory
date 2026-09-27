# Bugfix Requirements: Feuille de style non appliquée sur index.html

## Problem Statement

La feuille de style `./style/style.css` ne s'applique pas sur la page `index.html`. Le navigateur ne charge pas le fichier CSS car l'attribut `href` du tag `<link>` est éclaté sur deux lignes, ce qui le rend invalide.

## Bug Description

### Observed Behavior (Defective)

L'attribut `href` du tag `<link rel="stylesheet">` dans `index.html` (lignes 9–10) est fragmenté sur deux lignes :

```html
<link rel="stylesheet" h
  ref="./style/style.css" />
```

Le navigateur interprète cela comme un attribut `h` (sans valeur) suivi d'un second attribut `ref`, ce qui empêche le chargement de la feuille de style. La page s'affiche sans mise en forme CSS.

### Expected Behavior

L'attribut `href` doit être sur une seule ligne, formant un chemin valide vers la feuille de style :

```html
<link rel="stylesheet" href="./style/style.css" />
```

Ainsi, le navigateur charge correctement `./style/style.css` et applique les styles à la page.

### Bug Condition

- **Fichier concerné** : `index.html`
- **Lignes** : 9–10
- **Condition déclenchante** : Le tag `<link>` contient un attribut `href` fragmenté sur deux lignes.
- **Résultat** : La feuille de style n'est pas chargée ; la page est affichée sans styles CSS.

## Requirements

### 1. Correction du tag `<link>`

1.1 L'attribut `href` du tag `<link rel="stylesheet">` dans `index.html` DOIT être écrit sur une seule ligne.

1.2 La valeur de `href` DOIT être `./style/style.css`.

1.3 Le tag `<link>` corrigé DOIT avoir la forme exacte :
```html
<link rel="stylesheet" href="./style/style.css" />
```

### 2. Préservation du comportement existant

2.1 Tous les autres attributs et balises dans `<head>` DOIVENT rester inchangés.

2.2 Le reste du fichier `index.html` (body, scripts, nav, etc.) DOIT rester inchangé.

2.3 Le chargement de la feuille de style DOIT fonctionner de la même manière que sur les autres pages du projet qui utilisent correctement ce chemin.
