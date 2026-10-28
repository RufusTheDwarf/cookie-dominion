# Roadmap — Parfum Empire

- [x] Prototype web avec économie déterministe, sauvegarde locale et progression hors ligne plafonnée.
- [x] CI : typecheck TypeScript, tests unitaires et build.
- [x] Identité de parfumerie avec palette papier ivoire, vert profond, cuivre et laiton.
- [x] Dix producteurs illustrés avec coûts croissants et revenus passifs.
- [x] Refonte clicker à trois colonnes : parfumeur, manufacture et bureau de gestion.
- [x] Récolte aléatoire de sept matières botaniques ; dix matières consommées par fragrance.
- [x] Carnet de découvertes persisté, progression de lot et animation de fabrication.
- [x] Rééquilibrage des prix des producteurs et des premières récompenses.
- [x] Recherche botanique avec chance de récolter une matière supplémentaire.
- [x] Grand écran fixe sans défilement vertical, dix producteurs visibles en grille compacte.
- [x] Désactivation de la navigation Tab et de l'activation des boutons par Entrée/Espace pour les actions de jeu.
- [x] Événement du flacon mythique avec récompense ajustée à la progression et production doublée.
- [x] Catalogue de cinq recherches à dix niveaux.
- [x] Six contrats réclamables et registre de douze honneurs calculés automatiquement.
- [x] Commandes VIP accessibles directement depuis l'interface.
- [x] Trois collections avec inventaire séparé, multiplicateurs et déverrouillage par prestige.
- [x] Rebirth normal et ascension totale avec Essences originelles.
- [x] Import/export JSON, sauvegarde locale et support des anciens formats.
- [ ] Inspection visuelle manuelle sur des écrans desktop de plusieurs tailles.
- [ ] Réglage fin de l'équilibrage sur une session longue.
- [ ] Recettes avancées exigeant des combinaisons d'ingrédients spécifiques.
- [ ] Déploiement public et tests avec des joueurs.
- [ ] Comptes et sauvegardes cloud si nécessaires.
- [ ] Décider si un packaging desktop est utile.

## Critères de la version actuelle

- Au départ, le joueur récolte dix matières aléatoires avant d'obtenir son premier parfum.
- Dix ingrédients sont consommés par fragrance ; une recherche peut produire une récolte bonus.
- Tous les producteurs sont accessibles depuis le catalogue compact, sans déplacement sur la carte.
- Les revenus passifs restent séparés du rendu visuel et de l'animation des matières.
- Les recherches s'appliquent aux producteurs, à la récolte bonus, aux coûts et aux commandes VIP.
- La version desktop grand écran tient dans le viewport sans scroll vertical.
- Les actions de jeu ne sont pas déclenchées par Tab, Entrée ou Espace.
- L'inventaire botanique et la progression de récolte survivent à une sauvegarde/export-import JSON.
- Les tests, typecheck et build passent dans GitHub Actions.
