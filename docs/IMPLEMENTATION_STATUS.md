# État d’implémentation — Parfum Empire 0.4.0

## Gameplay et contenu

| Système | État | Détails |
|---|---|---|
| Récolte botanique | Implémenté | Chaque clic révèle une matière aléatoire parmi sept ingrédients |
| Fabrication manuelle | Implémenté | Dix matières sont consommées pour composer un parfum ; compteur de progression affiché |
| Carnet de découvertes | Implémenté | Les quantités découvertes sont suivies par matière et sauvegardées |
| Recherche botanique | Implémenté | Chaque niveau ajoute 8 % de chance de récolter une matière bonus |
| Producteurs | Implémenté | Dix types d'équipement, coûts croissants et production passive |
| Économie de départ | Rééquilibrée | Première machine à faible coût, commandes VIP et premières récompenses réduites |
| Améliorations | Implémenté | Production, récolte bonus, remise, bonus mythique et marge VIP ; dix niveaux chacune |
| Flacon mythique | Implémenté | Événement temporaire, récompense ajustée à la progression et production ×2 |
| Commandes VIP | Implémenté | Livraison par bouton, coût progressif, paiement et marge améliorables |
| Contrats | Implémenté | Six objectifs avec récompenses à réclamer |
| Honneurs | Implémenté | Registre de douze distinctions calculées à partir de la progression |
| Collections | Implémenté | Jardin de Verre, Maison d’Ambre et Palais Astral ; inventaires séparés |
| Rebirth normal | Implémenté | Réinitialise le stock du run, la récolte en cours et les producteurs ; conserve les recherches et le carnet |
| Ascension totale | Implémenté | Réinitialise la progression normale et récompense des Essences originelles |
| Illustrations | Implémenté | SVG originaux pour les matières premières, les flacons et les dix équipements |
| Grand écran | Implémenté dans le CSS | Mise en page fixe à trois colonnes, hauteur du viewport, aucun défilement sur les grands écrans |
| Écrans plus étroits | Implémenté dans le CSS | Grille responsive qui se replie en deux colonnes puis une colonne |
| Contrôles | Implémenté | Actions de jeu au pointeur/tactile ; Tab et activation Enter/Espace désactivés |
| Mode sombre | Implémenté | Palette sombre activable dans l'onglet Données |
| Sauvegardes | Implémenté | LocalStorage, export/import JSON, validation, migration et carnet botanique persisté |
| Progression hors ligne | Implémenté dans le moteur | Plafond de huit heures par chargement |
| Comptes / cloud / multijoueur | Non implémenté | Aucun compte ni backend distant |

## Persistance

La progression de récolte en cours, les ingrédients non encore assemblés, le nombre total de récoltes et le carnet de découvertes sont enregistrés dans la sauvegarde. Les anciennes sauvegardes reçoivent des valeurs par défaut pour ces champs.

Les champs historiques de déplacement et d'étages restent dans le format de sauvegarde par compatibilité, mais ne sont pas utilisés par la nouvelle interface clicker.

## Vérifications

- Tests Vitest : récolte en dix étapes, matière rare, bonus de récolte, persistance partielle, économie, producteurs, recherches, contrats, commandes VIP, rebirth, ascension et import/export.
- GitHub Actions : installation npm, vérification TypeScript, tests et build Vite.
- Inspection visuelle manuelle dans un navigateur réel : à effectuer.
- Validation finale de la hauteur sur plusieurs tailles de moniteur : à effectuer.

## Prochaines étapes

1. Vérifier visuellement le jeu sur un grand écran et un petit ordinateur portable.
2. Mesurer et équilibrer la progression sur une session de jeu plus longue.
3. Ajouter des recettes qui exigent des combinaisons d'ingrédients spécifiques.
4. Envisager un déploiement public et la synchronisation cloud séparément.
