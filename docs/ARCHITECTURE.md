# Architecture de Parfum Empire

## Modules

- `apps/web/src/main.ts) compose l'interface, met à jour la progression, gère les menus et sauvegarde les données.
- `apps/web/src/economy.ts) définit les règles du jeu sans dépendre du DOM ni du canvas.
- `apps/web/src/workshop-scene.ts) dessine l'atelier 2D, déplace le personnage, détecte les postes proches et gère les commandes clavier.
- `apps/web/src/style.css) présente l'atelier et les menus sur ordinateur et téléphone.
- `tests/economy.test.ts) vérifie les règles économiques, la récolte déterministe, les recettes, les ventes et les sauvegardes.
- `AGENTS.md) fournit une carte pratique pour les prochaines modifications.

## Responsabilités

1. Le module de scène signale le poste utilisé. Il ne modifie jamais directement l'argent ou l'inventaire.
2. Le module économique valide les récoltes, la consommation des ingrédients, la fabrication, les ventes et la progression.
3. Le module principal relie les interactions à l'économie et actualise l'interface.
4. La sauvegarde conserve les champs historiques nécessaires à l'import des anciennes parties. Un champ historique ne doit pas être réintroduit dans la boucle de jeu active sans raison.

## Boucle de jeu actuelle

Le joueur se déplace entre le jardin botanique, le laboratoire et le comptoir. Chaque parcelle donne une matière définie. Le joueur choisit une formule, se rend au laboratoire pour consommer les ingrédients et fabriquer un flacon, puis rejoint le comptoir pour le vendre. Les recherches améliorent les récoltes et la valeur des flacons de manière déterministe.

## Contrôles

- Flèches ou ZQSD pour marcher.
- Clic ou toucher le sol pour se déplacer vers une position.
- E ou bouton Interagir à proximité d'un poste.
- Commandes directionnelles tactiles sur les petits écrans.

## Sécurité et sauvegardes

La sauvegarde locale et le code côté navigateur peuvent être modifiés par un joueur. La validation actuelle protège contre les états malformés, pas contre une triche déterminée. Pour empêcher la modification de l'argent ou des inventaires, il faudra déplacer l'état faisant autorité et les opérations économiques vers un backend.

## Vérification

Avant de fusionner une modification, exécuter `npm run typecheck`, `npm test` et `npm run build`. Tester ensuite l'atelier dans un navigateur réel, en mode clavier et tactile.
