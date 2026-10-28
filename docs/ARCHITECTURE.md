# Architecture — Parfum Empire

## Organisation actuelle

- `apps/web/src/economy.ts` : économie déterministe, tirage des matières botaniques, fabrication par lot de dix, dix producteurs, cinq recherches, commandes VIP, contrats, collections, prestige et validation des sauvegardes.
- `apps/web/src/main.ts` : boucle clicker, révélation de matière, carnet botanique, achats, récompenses, événements temporaires, onglets, contrôles au pointeur et autosauvegarde.
- `apps/web/src/style.css` : interface fixe en grand écran, grille compacte des dix producteurs, thème clair/sombre et modes responsive.
- `public/assets/*.svg` : illustrations originales des matières premières, des flacons et des équipements.
- `tests/economy.test.ts` : tests unitaires de l'économie, de la récolte aléatoire, de la fabrication et de la persistance.

## Couches

1. **Domaine :** calcul des revenus et des prix, probabilités de récolte, inventaire botanique, fabrication, progression et règles de prestige. Il ne dépend pas du DOM.
2. **Interface :** TypeScript et HTML pilotent le flacon récoltable, la révélation des objets, la manufacture et le bureau à onglets.
3. **Présentation :** CSS et SVG fixent une composition de grand écran sans défilement vertical, tout en conservant un repli responsive pour les fenêtres plus étroites.
4. **Contrôles :** les boutons de jeu sont opérés au pointeur ou au tactile. Les clics synthétiques associés à l'activation clavier sont ignorés, et Tab n'est pas utilisé pour parcourir les contrôles.
5. **Persistance :** LocalStorage et les fichiers JSON enregistrent la trésorerie, le stock de matières en cours, le carnet de découvertes et le reste de la progression. Les anciens formats sont migrés.
6. **Livraison :** Vite pour le serveur de développement et le build ; GitHub Actions pour le typecheck, les tests et la compilation.

## Boucle de jeu

Un clic récolte une matière aléatoire. Dix matières sont consommées pour fabriquer un parfum. La recherche botanique augmente la probabilité d'une récolte bonus. Les parfums alimentent ensuite les achats de producteurs, les commandes, les recherches et le prestige.

Les anciennes données de déplacement, d'étages et de terrain restent dans le format de sauvegarde pour éviter une rupture de compatibilité, mais elles ne participent plus à la boucle active.

## Limites actuelles

Pas de comptes, de multijoueur, de sauvegarde cloud ou de backend de validation. La CI valide le code et les tests unitaires ; une inspection visuelle manuelle reste nécessaire sur différents écrans avant de considérer l'interface comme définitivement validée.
