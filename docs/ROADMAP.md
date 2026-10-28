# Feuille de route de Parfum Empire

## Réalisé

- [x] Moteur économique avec sauvegarde locale et progression hors ligne.
- [x] Identité visuelle de maison de parfumerie.
- [x] Atelier 2D avec jardin, laboratoire et boutique.
- [x] Déplacement au clavier, par clic et avec les commandes tactiles.
- [x] Récolte déterministe de sept matières botaniques.
- [x] Cinq recettes et stock de flacons.
- [x] Formulation au laboratoire et vente au comptoir.
- [x] Dix producteurs et cinq recherches.
- [x] Contrats, honneurs, collections et prestige.
- [x] Import/export JSON et migration des anciennes sauvegardes.
- [x] Tests automatisés, vérification TypeScript et build.

## Prochaine phase

- [ ] Tester les déplacements, la proximité des postes, les parcelles bonus et l'interface tactile sur un vrai navigateur.
- [x] Ajouter des animations de marche et d'interaction, ainsi que des effets sonores originaux désactivables.
- [x] Progression entre étages avec escalier, coûts, prérequis, sélecteur et catalogues séparés.
- [ ] Développer davantage la géométrie de chaque étage, les portes intérieures et les points d'accès physiques.
- [x] Donner à chaque machine achetée un emplacement physique, une animation de production et un compteur de quantité.
- [x] Réputation de la maison liée aux livraisons, rangs et prime de commande croissante.
- [x] Coûts d'exploitation des machines, rendement net et calcul hors ligne cohérent.
- [x] Débloquer trois parcelles bonus de lavande, menthe et rose avec des prix progressifs.
- [ ] Équilibrer les prix, l'entretien et le rythme d'évolution sur une session longue.
- [ ] Envisager une version serveur si les comptes, les sauvegardes cloud ou l'anti-triche deviennent nécessaires.

## Principes

- Les actions principales doivent dépendre des choix du joueur, pas de butin aléatoire ou d'événements temporaires.
- Les règles économiques restent dans `economy.ts`, indépendantes de la scène.
- Le rendu et les déplacements restent dans `workshop-scene.ts`.
- Le jeu doit rester utilisable au clavier et sur écran tactile.
- Toute modification importante doit passer `npm run typecheck`, `npm test` et `npm run build`.
