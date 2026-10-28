# Architecture de Parfum Empire

## Modules

- `apps/web/src/main.ts` compose l'interface, met à jour la progression, gère les menus et sauvegarde les données.
- `apps/web/src/economy.ts` définit les règles du jeu sans dépendre du DOM ni du canvas.
- `apps/web/src/workshop-scene.ts` dessine le monde 2D, suit le personnage avec la caméra, anime le personnage et les machines, gère les particules, applique la palette de la collection active et détecte les postes proches.
- `apps/web/src/style.css` présente l'atelier et les menus sur ordinateur et téléphone.
- `tests/economy.test.ts` vérifie les règles économiques, la récolte déterministe, les recettes, les ventes et les sauvegardes.
- `AGENTS.md` fournit une carte pratique pour les prochaines modifications.

## Responsabilités

1. Le module de scène signale le poste utilisé. Il ne modifie jamais directement l'argent ou l'inventaire.
2. Le module économique valide les récoltes, la consommation des ingrédients, la fabrication, les ventes, les commandes clients, les coûts d'exploitation, le déblocage des parcelles et la progression.
3. Le module principal relie les interactions à l'économie et actualise l'interface.
4. La sauvegarde conserve les champs historiques nécessaires à l'import des anciennes parties. Un champ historique ne doit pas être réintroduit dans la boucle de jeu active sans raison.

## Boucle de jeu actuelle

Le joueur se déplace entre trois zones d'un même monde : le jardin botanique, le laboratoire et le comptoir. La carte dépasse la zone visible et la caméra accompagne les déplacements. Chaque parcelle donne une matière définie. Le joueur choisit une formule, se rend au laboratoire pour consommer les ingrédients et fabriquer un flacon, puis rejoint le comptoir pour le vendre ou livrer la commande active.

La production hors ligne est calculée au chargement et lors du retour sur un onglet resté caché. La boucle de rendu n'accumule pas de revenus pendant que le document est caché; au retour, le moteur applique une seule fois le revenu net, plafonné à huit heures, puis sauvegarde le nouvel instant de référence.

Les commandes clients suivent une rotation déterministe de cinq recettes. La progression de commande est conservée dans la sauvegarde, les quantités augmentent progressivement jusqu'à un plafond de cinq flacons et une livraison complète verse une prime par rapport à la vente normale. La réputation augmente de 25 points par livraison, gagne un rang tous les 100 points et augmente la prime de 50 % au départ jusqu'à 95 % au rang 10. La réputation est dérivée du nombre de commandes livrées, donc elle reste cohérente après import ou migration. Les machines ont des coûts d'exploitation calculés à partir de leur prix de base et du multiplicateur de coût du monde actif. Le rendement net est utilisé pour les revenus en temps réel et hors ligne, et les coûts sont visibles dans l'interface. Trois parcelles bonus peuvent être achetées successivement. Elles apparaissent dans le jardin uniquement après déblocage, et leur récolte ajoute de la lavande, de la menthe ou des pétales de rose au stock. Les commandes ne sont jamais tirées au hasard et ne se terminent pas par un minuteur. Les règles de stock et de paiement restent dans le moteur économique; la scène n'est qu'un point d'interaction.

## Scène et animation

- La scène est dessinée avec Canvas 2D sur une surface logique de 960 × 440.
- Le monde mesure 1440 × 720. La caméra suit le joueur et reste dans les limites du monde.
- Le personnage change d'orientation, anime son corps pendant la marche et tend le bras pendant une interaction.
- Les plantes oscillent légèrement. Les interactions créent des particules temporaires.
- Les producteurs achetés sont transmis à la scène comme données d'affichage et rendus à des emplacements fixes, avec animation de fonctionnement et quantité visible.
- Les deux murs intérieurs comportent des passages avec encadrement visuel; la collision bloque le passage hors des ouvertures.
- Les étages de manufacture affichent des lignes de conditionnement; l’étage rare affiche des chambres circulaires d’extraction.
- Deux escaliers physiques assurent la montée et la descente; un escalier n’est visible et interactif que si sa direction correspond à l’étage actif.
- Les coordonnées des clics sont converties de l'écran vers le monde, en tenant compte de la caméra.
- Un escalier dans la scène déclenche les règles d'ouverture des étages. L'état ouvert et l'étage actif sont persistés, tandis que le catalogue n'affiche que les équipements de l'étage actif.
- Les collections utilisent leur palette persistée (fond, sol, couleur d'accent et bois) pour différencier visuellement l'atelier sans casser les collisions ou l'économie.

## Contrôles

- Flèches ou ZQSD pour marcher.
- Clic ou toucher le sol pour se déplacer vers une position.
- E ou bouton Interagir à proximité d'un poste.
- Les effets sonores utilisent Web Audio avec des oscillateurs et restent facultatifs; aucune ressource audio externe n'est chargée.
- Les commandes de navigation restent accessibles avec Tab et Enter/Space. Les touches de déplacement ne prennent pas le contrôle lorsqu'un bouton ou un champ reçoit le focus.
- Commandes directionnelles tactiles sur les petits écrans.

## Sécurité et sauvegardes

La sauvegarde locale dispose d'une copie de secours actualisée avant le remplacement de la sauvegarde principale. Au démarrage, la sauvegarde principale est validée; si elle est illisible, le jeu essaie la copie de secours puis l'ancien format local. La suppression de partie retire ces trois clés avant de créer une nouvelle sauvegarde. Ces mesures limitent les pertes dues à une corruption accidentelle, mais n'empêchent pas la modification volontaire des données locales.

La sauvegarde locale et le code côté navigateur peuvent être modifiés par un joueur. La validation actuelle protège contre les états malformés, pas contre une triche déterminée. Pour empêcher la modification de l'argent ou des inventaires, il faudra déplacer l'état faisant autorité et les opérations économiques vers un backend.

## Vérification

Avant de fusionner une modification, exécuter `npm run typecheck`, `npm test` et `npm run build`. Tester ensuite l'atelier dans un navigateur réel, en mode clavier et tactile.
