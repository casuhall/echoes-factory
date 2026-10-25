# Template de prompt — fonctionnalité Echoes Factory

## Prompt à copier-coller

Fonctionnalité : [description courte de ce que l'utilisateur veut faire]

Workflow attendu :
1. Concevoir l'évolution du domaine et des services
2. Implémenter l'interface utilisateur
3. Adapter le stockage si nécessaire
4. Mettre a jour la documentation du projet pour refléter les modifications appliquées

Stack : JavaScript navigateur, ES modules, pas de TypeScript

Fichiers existants à consulter : [liste des modules du domaine et de l'UI]

## Notes
- Pour les fonctionnalités simples, un seul agent peut suivre tout le workflow dans l'ordre.
- Pour les fonctionnalités plus larges, lancer domain-designer et ui-developer en parallèle, puis storage-engineer, puis kiss-reviewer en fin de parcours.
