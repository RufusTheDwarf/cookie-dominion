# Architecture de Parfum Empire

## Modules

- `apps/web/src/main.ts` compose l'interface, met à jour la progression, gère les menus et sauvegarde les données.
- `apps/web/src/economy.ts` définit les règles du jeu sans dépendre du DOM ni du canvas.
- `apps/web/src/workshop-scene.ts` dessine le monde 2D, suit le personnage avec la caméra, anime le personnage et les machines, gère les particules et détecte les postes proches.
- `apps/web/src/style.css` présente l'atelier et les menus sur ordinateur et téléphone.
- `tests/economy.test.ts` vérifie les règles économiques, la récolte déterministe, les recettes, les ventes et les sauvegardes.
- `AGENTS.md` fournit une carte pratique pour les prochaines modifications.

## Responsabilités

1. Le module de scène signale le poste utilisé. Il ne modifie jamais directement l'argent ou l'inventaire.
2. Le module économique valide les récoltes, la consommation des ingrédients, la fabrication, les ventes, les commandes clients et la progression.
3. Le module principal relie les interactions à l'économie et actualise l'interface.
4. La sauvegarde conserve les champs historiques nécessaires à l'import des anciennes parties. Un champ historique ne doit pas être réintroduit dans la boucle de jeu active sans raison.

## Boucle de jeu actuelle

Le joueur se déplace entre trois zones d'un même monde : le jardin botanique, le laboratoire et le comptoir. La carte dépasse la zone visible et la caméra accompagne les déplacements. Chaque parcelle donne une matière définie. Le joueur choisit une formule, se rend au laboratoire pour consommer les ingrédients et fabriquer un flacon, puis rejoint le comptoir pour le vendre ou livrer la commande active.

Les commandes clients suivent une rotation déterministe de cinq recettes. La progression de commande est conservée dans la sauvegarde, les quantités augmentent progressivement jusqu'à un plafond de cinq flacons et une livraison complète verse une prime de 50 % par rapport à la vente normale. Les commandes ne sont jamais tirées au hasard et ne se terminent pas par un minuteur. Les règles de stock et de paiement restent dans le moteur économique; la scène n'est qu'un point d'interaction.

## Scène et animation

- La scène est dessinée avec Canvas 2D sur une surface logique de 960 × 440.
- Le monde mesure 1440 × 720. La caméra suit le joueur et reste dans les limites du monde.
- Le personnage change d'orientation, anime son corps pendant la marche et tend le bras pendant une interaction.
- Les plantes oscillent légèrement. Les interactions créent des particules temporaires.
- Les deux murs intérieurs comportent des passages. Le déplacement ne peut pas traverser les murs en dehors de ces passages.
- Les coordonnées des clics sont converties de l'écran vers le monde, en tenant compte de la caméra.

## Contrôles

- Flèches ou ZQSD pour marcher.
- Clic ou toucher le sol pour se déplacer vers une position.
- E ou bouton Interagir à proximité d'un poste.
- Commandes directionnelles tactiles sur les petits écrans.

## Sécurité et sauvegardes

La sauvegarde locale et le code côté navigateur peuvent être modifiés par un joueur. La validation actuelle protège contre les états malformés, pas contre une triche déterminée. Pour empêcher la modification de l'argent ou des inventaires, il faudra déplacer l'état faisant autorité et les opérations économiques vers un backend.

## Vérification

Avant de fusionner une modification, exécuter `npm run typecheck`, `npm test` et `npm run build`. Tester ensuite l'atelier dans un navigateur réel, en mode clavier et tactile.
