# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - href fragmenté sur deux lignes
  - **CRITICAL**: Ce test DOIT ÉCHOUER sur le code non corrigé — l'échec confirme que le bug existe
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: Ce test encode le comportement attendu — il validera le correctif quand il passera après l'implémentation
  - **GOAL**: Mettre en évidence le contre-exemple qui démontre l'existence du bug
  - **Scoped PBT Approach**: Bug déterministe — cibler le cas concret : `index.html` lignes 9–10 avec l'attribut `href` fragmenté
  - Parser `index.html` et vérifier que le tag `<link rel="stylesheet">` possède un attribut `href` valide sur une seule ligne (Bug Condition dans le design : `isBugCondition(file)`)
  - Le test doit assert que `href` vaut exactement `./style/style.css` (Expected Behavior Properties P1, P2)
  - Lancer le test sur le code NON CORRIGÉ
  - **EXPECTED OUTCOME**: Le test ÉCHOUE (preuve que le bug existe)
  - Documenter le contre-exemple trouvé (ex. : `href` absent ou valeur invalide sur le tag `<link>`)
  - Marquer la tâche terminée quand le test est écrit, lancé, et l'échec documenté
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Intégrité du reste de index.html
  - **IMPORTANT**: Suivre la méthodologie observation-first
  - Observer sur le code NON CORRIGÉ : `<title>Gestion de l'usine</title>` présent (ligne 6)
  - Observer sur le code NON CORRIGÉ : `<meta charset="utf-8" />` présent (ligne 7)
  - Observer sur le code NON CORRIGÉ : `<meta name="viewport" content="width=device-width,initial-scale=1" />` présent (ligne 8)
  - Observer sur le code NON CORRIGÉ : le `<body>` complet (nav, main, footer, script) est intact
  - Écrire un test qui vérifie que tous ces éléments sont présents et inchangés dans `index.html` (Preservation Requirements PR1, PR2 du design)
  - Vérifier que ce test PASSE sur le code non corrigé (confirme le comportement de référence)
  - **EXPECTED OUTCOME**: Les tests PASSENT (confirme le baseline à préserver)
  - Marquer la tâche terminée quand les tests sont écrits, lancés, et passants sur le code non corrigé
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Fix : réunir l'attribut href sur une seule ligne dans index.html

  - [x] 3.1 Implémenter le correctif
    - Dans `index.html` lignes 9–10, remplacer :
      ```html
      <link rel="stylesheet" h
        ref="./style/style.css" />
      ```
      par :
      ```html
      <link rel="stylesheet" href="./style/style.css" />
      ```
    - La modification ne porte que sur ces deux lignes ; aucun autre changement n'est apporté au fichier
    - _Bug_Condition: isBugCondition(file) — tag `<link>` avec `href` fragmenté sur plusieurs lignes_
    - _Expected_Behavior: `<link rel="stylesheet" href="./style/style.css" />` sur une seule ligne, P1 + P2_
    - _Preservation: PR1 (head inchangé), PR2 (body inchangé), PR3 (autres pages non affectées)_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - href fragmenté sur deux lignes
    - **IMPORTANT**: Relancer le MÊME test de la tâche 1 — ne PAS écrire un nouveau test
    - Le test de la tâche 1 encode le comportement attendu
    - Quand ce test passe, cela confirme que le comportement attendu est satisfait
    - Relancer le test de condition de bug de l'étape 1
    - **EXPECTED OUTCOME**: Le test PASSE (confirme que le bug est corrigé)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Intégrité du reste de index.html
    - **IMPORTANT**: Relancer les MÊMES tests de la tâche 2 — ne PAS écrire de nouveaux tests
    - Relancer les tests de préservation de l'étape 2
    - **EXPECTED OUTCOME**: Les tests PASSENT (confirme l'absence de régressions)
    - Confirmer que tous les tests passent après le correctif (aucune régression)

- [x] 4. Checkpoint - Ensure all tests pass
  - S'assurer que tous les tests passent, demander à l'utilisateur en cas de question.
