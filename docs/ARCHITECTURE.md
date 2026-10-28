# Architecture — Parfum Empire

## Organisation actuelle

- `apps/web/src/economy.ts` : moteur économique déterministe, dix types de producteurs, cinq recherches, commandes VIP, contrats, collections, rebirths, ascension totale et validation des sauvegardes.
- `apps/web/src/main.ts` : boucle clicker, état de l'interface, achats, récompenses, événements temporaires, collections, onglets, rendu DOM et autosauvegarde.
- `apps/web/src/style.css` : structure clicker à trois colonnes, panneaux du bureau, responsive design et mode sombre.
- `public/assets/*.svg` : illustrations originales du flacon, de la maison et des équipements.
- `tests/economy.test.ts` : tests unitaires du moteur de jeu et de la persistance.

## Couches

1. **Domaine :** l'économie définit les coûts, les revenus, les multiplicateurs, la progression et les règles de prestige. Elle ne dépend pas du DOM.
2. **Interface :** TypeScript et HTML pilotent le flacon cliquable, la manufacture, les onglets du bureau et les retours visuels.
3. **Présentation :** CSS et SVG donnent une identité originale à la parfumerie et gèrent les écrans larges ou étroits.
4. **Persistance :** LocalStorage et les fichiers JSON gèrent les sauvegardes locales. Le parseur valide et migre les anciens formats.
5. **Livraison :** Vite pour le serveur de développement et le build ; GitHub Actions pour le typecheck, les tests et la compilation.

## Choix de structure

La boucle de jeu est organisée comme un clicker incrémental : clic manuel, production passive, achat croissant de producteurs, recherche, commande ponctuelle, honneurs et prestige. Le catalogue affiche les producteurs successifs ; les collections changent le multiplicateur de revenus et conservent chacune leur propre inventaire.

Les anciennes données de déplacement, d'étages et de terrain sont encore présentes dans le format de sauvegarde pour préserver la compatibilité, mais elles ne sont plus nécessaires à l'interface active.

## Limites actuelles

Pas de comptes, de multijoueur, de sauvegarde cloud, de backend de validation ou de client mobile natif. La vérification visuelle manuelle doit encore être faite dans un vrai navigateur avant diffusion publique.
