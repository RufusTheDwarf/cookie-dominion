# État d’implémentation — Parfum Empire

## Gameplay et contenu

| Système | État | Détails |
|---|---|---|
| Structure clicker | Implémenté | Flacon cliquable, manufacture verticale et bureau à onglets |
| Création manuelle | Implémenté | Revenus par clic, retour visuel flottant et animation du flacon |
| Producteurs | Implémenté | Dix types d'équipement avec coûts croissants et revenu passif |
| Améliorations | Implémenté | Production, clic, remise, bonus mythique et marge VIP ; dix niveaux chacune |
| Flacon mythique | Implémenté | Événement temporaire, récompense immédiate et production ×2 |
| Commandes VIP | Implémenté | Livraison directe par bouton, coût croissant, paiement et marge améliorables |
| Contrats | Implémenté | Six objectifs avec récompenses à réclamer |
| Honneurs | Implémenté | Registre de douze distinctions calculées à partir de la progression |
| Collections | Implémenté | Jardin de Verre, Maison d’Ambre et Palais Astral ; inventaires par collection |
| Rebirth normal | Implémenté | Réinitialise le stock du run et les producteurs, conserve les recherches |
| Ascension totale | Implémenté | Réinitialise la progression normale et récompense des Essences originelles |
| Illustrations | Implémenté | SVG originaux pour le flacon principal, le flacon mythique et dix équipements |
| Responsive | Implémenté dans le CSS | Grille à trois colonnes, repli en deux colonnes et une colonne sur petit écran |
| Mode sombre | Implémenté | Palette sombre activable dans l'onglet Données |
| Sauvegardes | Implémenté | LocalStorage, export/import JSON, validation, migration et effacement confirmé |
| Progression hors ligne | Implémenté dans le moteur | Plafond de huit heures par chargement |
| Comptes / cloud / multijoueur | Non implémenté | Aucun compte ni backend distant |

## Persistance

Les anciennes sauvegardes restent lisibles. Les nouveaux champs de recherche sont initialisés à zéro si l'ancienne partie ne les contient pas. Les identifiants historiques de producteurs et de collections sont migrés lors du chargement.

Le format conserve encore les champs historiques de déplacement et d'étages pour éviter de casser les sauvegardes, mais la nouvelle interface n'utilise plus la carte ni les escaliers.

## Vérifications

- Tests Vitest : économie, producteurs, recherches, contrats, commandes VIP, rebirth, ascension, migration et import/export.
- GitHub Actions : installation npm, vérification TypeScript, tests et build Vite.
- Inspection visuelle manuelle dans un navigateur réel : à effectuer.
- Vérification finale des comportements sur ordinateur et petit écran : à effectuer.

## Prochaines étapes

1. Vérifier visuellement les états du flacon, les achats, les onglets et la sauvegarde dans un navigateur.
2. Ajouter davantage de formules et des bonus spécifiques à chaque collection.
3. Équilibrer la progression avec des tests de session plus longs.
4. Préparer un déploiement public et des sauvegardes cloud uniquement si le besoin se confirme.
