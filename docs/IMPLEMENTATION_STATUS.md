# État d'implémentation de Parfum Empire

## Boucle de jeu

| Système | État | Détails |
|---|---|---|
| Atelier 2D | Implémenté | Jardin, laboratoire et boutique dans un monde plus grand que l'écran |
| Caméra | Implémenté | Suit le joueur et reste dans les limites de la carte |
| Identité visuelle des mondes | Implémenté | Fond, sols, chemins, séparations et mobilier adaptés à la collection active |
| Étages accessibles | Implémenté | Escaliers montants et descendants, coûts, prérequis, sélection, persistance, catalogues filtrés et arrivée sur une case libre près de l'escalier opposé |
| Architecture des étages | Implémenté | Lignes de conditionnement au 1er étage, chambres d’extraction au 2e, ouvertures encadrées |
| Escaliers bidirectionnels | Implémenté | Escalier montant et descendant visibles selon l’étage, règles de navigation testées |
| Animation du personnage | Implémenté | Orientation, marche, mouvement du corps et geste d'interaction |
| Animation du décor | Implémenté | Plantes animées et particules temporaires lors des interactions |
| Machines visibles | Implémenté | Laboratoire, comptoir et producteurs achetés dessinés comme des objets physiques |
| Producteurs matérialisés | Implémenté | Emplacement par étage, animation subtile et badge de quantité installée |
| Déplacement | Implémenté | Flèches, ZQSD, clic ou toucher pour marcher |
| Collisions | Implémenté | Obstacles autour des parcelles, postes et machines achetées; glissement latéral et arrêt d’un déplacement bloqué |
| Commandes tactiles | Implémenté | Pavé directionnel et bouton Interagir sur petits écrans |
| Accessibilité clavier | Implémenté | Tab, focus visible, activation native des boutons sans déplacer le personnage par accident |
| Effets sonores | Implémenté | Notes synthétiques d'action via Web Audio, paramètre persistant et désactivation possible |
| Récolte botanique | Implémenté | Chaque parcelle fournit une matière précise, sans tirage aléatoire |
| Carnet de formulations | Implémenté | Cinq recettes, sélection d'une formule et stock de flacons |
| Laboratoire | Implémenté | Consomme les ingrédients nécessaires et crée le flacon choisi |
| Comptoir | Implémenté | Vend le flacon sélectionné ou livre une commande client complète |
| Commandes clients | Implémenté | Rotation déterministe de recettes, quantité vérifiée, progression sauvegardée et prime liée à la réputation |
| Client dans la boutique | Implémenté | Personnage animé près du comptoir avec bulle synchronisée à la commande active |
| Réputation de la maison | Implémenté | 25 points par livraison, 10 rangs, prime de commande de 50 à 95 % |
| Coûts d'exploitation | Implémenté | Entretien des machines, rendement net affiché et calcul cohérent hors ligne |
| Parcelles bonus | Implémenté | Trois parcelles achetables, invisibles avant achat et reliées à la récolte ciblée |
| Producteurs | Implémenté | Dix équipements avec coûts croissants et production passive |
| Recherches | Implémenté | Production, récolte ciblée, remise, extraction spécialisée et finition de luxe |
| Contrats et honneurs | Implémenté | Objectifs liés aux ventes, équipements et collections |
| Collections | Implémenté | Jardin de Verre, Maison d'Ambre et Palais Astral |
| Rebirth et ascension | Implémenté | Réinitialisations de progression avec bonus persistants |
| Sauvegarde | Implémenté | LocalStorage, copie de secours, restauration de secours, export/import JSON, validation et migration |
| Production hors ligne | Implémenté | Plafond de huit heures, au chargement et au retour sur un onglet en arrière-plan |
| Comptes, cloud, multijoueur | Non implémenté | Aucun backend distant |

## Persistance et compatibilité

Les champs historiques liés à d'anciennes mécaniques peuvent rester dans le format de sauvegarde afin d'importer les anciennes parties. Ils ne doivent pas réapparaître dans l'interface active.

## Vérifications

- TypeScript, tests unitaires et build Vite : vérifier le statut GitHub Actions du commit candidat avant toute fusion.
- Tests unitaires de la destination d'arrivée aux étages : ajoutés dans `tests/workshop-scene.test.ts`.
- Inspection visuelle dans un navigateur réel : à effectuer sur ordinateur et téléphone, notamment la proximité des nouveaux escaliers.
- Test de santé économique des 30 combinaisons machine/monde ajouté; équilibrage sur une session longue, notamment la montée de quantité des commandes, la prime maximale de réputation et l'entretien : à effectuer.

## Limites

La progression est encore stockée côté navigateur. La validation des données empêche certains états malformés, mais ne constitue pas une protection anti-triche contre un joueur qui modifie le client. Une future version en ligne devra valider les opérations économiques sur un serveur.


### Click-to-move pathfinding

Tap/click movement uses grid-based A* routing to navigate around blocked stations, purchased machines, and closed wall sections. Automated route tests cover obstacle avoidance and cross-workshop movement; browser/device feel still needs manual verification.


### Mobile-first controls and feedback
- Les boutons directionnels tactiles acceptent un appui prolongé pour marcher en continu; un simple tap reste fonctionnel.
- Les commandes tactiles ont une zone de pression agrandie, sans sélection de texte ni surbrillance parasite.
- L'interface se réorganise en une colonne sur téléphone, avec statistiques défilantes et contrôles d'étage accessibles.
- Une brève vibration confirme les récoltes réussies sur les appareils qui prennent en charge l'API Vibration.
- Les effets sonores d'action étaient déjà présents; le test visuel réel sur appareil reste à faire.


### Path smoothing and recovery
- Le déplacement par toucher/clic fusionne les segments droits lorsque le trajet reste libre d'obstacles.
- Si le personnage est bloqué pendant un trajet, le chemin est recalculé vers sa destination au lieu d'être immédiatement abandonné.
- Les tests échantillonnent les segments lissés pour vérifier qu'ils ne traversent ni objets solides ni murs fermés.


### Présentation et animations
- Hiérarchie visuelle renforcée par des dégradés subtils, des ombres plus cohérentes et des transitions courtes sur les contrôles.
- Le statut de jeu anime brièvement chaque retour d'action; les indicateurs d'activité respirent doucement.
- L'atelier affiche des particules d'ambiance discrètes, tandis que le poste à proximité utilise un contour pulsé.
- Les animations CSS respectent la préférence système de réduction des mouvements.
- Le rendu sur navigateur mobile et ordinateur reste à vérifier manuellement.
