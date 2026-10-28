<div align="center">

# PARFUM EMPIRE

### Compose des fragrances. Automatise ta manufacture. Construis une maison de légende.

**Un jeu de gestion incrémental dans le navigateur : clics, production passive, recherches, contrats et prestige.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Le concept

Tu commences sans parfum fini, avec des matières premières à découvrir. Chaque clic récolte un ingrédient botanique aléatoire : lavande, menthe, rose, bergamote ou une essence plus rare. **Compose manuellement des recettes à partir d'herbes précises, puis vends les flacons.** Les contrats VIP demandent désormais une fragrance et une quantité précises ; les flacons livrés sont consommés et donnent une prime.

La structure est désormais celle d'un **clicker tycoon** : le flacon est le point d'entrée principal du jeu, la manufacture rassemble les producteurs et le bureau regroupe les systèmes de progression. La navigation sur une carte 2D et les étages à parcourir ne font plus partie de la boucle centrale.

## Structure de l'interface

- **Le parfumeur :** zone de récolte aléatoire, animation de la matière découverte, progression de 0 à 10, carnet botanique, flacon mythique et commandes VIP.
- **La manufacture :** grille compacte des dix équipements, quantité possédée, coût du prochain exemplaire et rendement par seconde.
- **Le bureau :** six onglets dédiés aux recherches, contrats, honneurs, collections, prestige et sauvegardes.
- **Barre économique :** trésorerie, production par seconde, progression des matières pour la prochaine fragrance et cumul du run.

L'interface utilise des illustrations SVG originales pour la maison, les flacons, les ingrédients et les dix types d'équipement. Le style visuel associe papier ivoire, vert profond, cuivre et laiton. Sur grand écran, la zone de jeu tient dans la hauteur visible, sans défilement vertical ; les écrans plus étroits utilisent une mise en page responsive.

## Boucle de jeu

1. **Récolte des matières** : chaque clic révèle une herbe ou une essence aléatoire, qui reste en stock.
2. **Compose une recette** avec les ingrédients requis, puis vends le flacon manuellement à bas prix au début.
3. **Livre les commandes VIP** : prépare la recette et la quantité demandées pour obtenir une prime ; les flacons livrés sont consommés.
4. **Investis dans les producteurs** : commence par la table de formulation, puis achète des équipements plus coûteux qui génèrent des parfums automatiquement.
5. **Achète des recherches** pour augmenter la production, améliorer la chance de récolte bonus, réduire les coûts, prolonger les bonus rares et augmenter les paiements VIP.
7. **Réclame les contrats** et complète le registre des honneurs.
8. **Ouvre de nouvelles collections** en effectuant des rebirths.
9. **Effectue une ascension totale** pour gagner des Essences originelles persistantes.

## Systèmes implémentés

- **Dix producteurs :** table de formulation, alambic de cuivre, ligne d'embouteillage, atelier de parfumeur, extracteur astral, serre botanique, presse à enfleurage, atelier haute parfumerie, distillateur de cristal et manufacture orbitale.
- **Production incrémentale :** coûts croissants à chaque achat, revenu passif calculé par seconde et multiplication du rendement selon la collection active.
- **Récolte botanique :** sept matières à probabilités différentes, cinq recettes à combinaisons explicites, flacons en stock et carnet de découvertes sauvegardé.
- **Commandes VIP réelles :** demande de recette et quantité, vérification du stock, consommation des flacons, prime de livraison et progression des commandes persistée.
- **Cinq recherches :** production globale, chance de récolter une matière bonus, réduction du prix des équipements, durée du bonus mythique et paiement des commandes VIP. Chaque recherche possède dix niveaux.
- **Flacon mythique :** apparaît temporairement, rapporte une récompense immédiate et double la production pendant une durée améliorée par la recherche correspondante.
- **Commandes VIP :** dépense de préparation, paiement croissant, marge améliorée par la recherche commerciale et progression sauvegardée.
- **Contrats :** six objectifs réclamables, liés aux équipements, aux ventes cumulées, aux collections et aux commandes.
- **Honneurs :** distinctions automatiques dérivées des étapes de progression.
- **Trois collections :** Jardin de Verre, Maison d'Ambre et Palais Astral. Chaque collection garde son propre inventaire et son multiplicateur de revenus.
- **Rebirth normal :** remet à zéro le stock et les équipements, multiplie durablement le rendement par 1,6 et ouvre des collections supplémentaires.
- **Ascension totale :** exige le seuil de rebirths du palier courant et réinitialise la progression normale contre des Essences originelles.
- **Sauvegardes :** LocalStorage, export JSON, import depuis un fichier ou du texte, migration des anciennes données et effacement confirmé.
- **Progression hors ligne :** les sauvegardes accumulent au maximum huit heures de production passive.

## Prestige

### Rebirth normal

Un rebirth normal remet à zéro le stock du run et les producteurs. Les recherches, les ventes cumulées et les honneurs dérivés de la progression sont conservés. Le multiplicateur de production augmente de 60 % par rebirth.

### Ascension totale

L'ascension totale devient disponible après 10 rebirths normaux, puis le seuil augmente de cinq après chaque ascension. Elle remet à zéro la progression normale, octroie des Essences originelles persistantes et augmente le rendement permanent de 75 % par essence. Chaque essence contribue aussi à hauteur de 1 000 000 points de valeur d'empire.

L'ascension est irréversible pour la progression normale. Une confirmation est demandée avant l'action.

## Lancer le jeu

Prérequis : Node.js 22+ et npm 10+.

```bash
git clone https://github.com/RufusTheDwarf/parfum-empire.git
cd parfum-empire
npm install
npm run dev
```

Ouvre l'adresse locale indiquée par Vite. Dans GitHub Codespaces, ouvre le dépôt puis lance les mêmes commandes dans le terminal.

Vérifications disponibles :

```bash
npm run typecheck
npm test
npm run build
```

## Architecture

| Fichier | Rôle |
|---|---|
| `apps/web/src/main.ts` | Interface clicker, achats, événements, progression, onglets et sauvegardes |
| `apps/web/src/economy.ts` | Règles déterministes des revenus, producteurs, recherches, contrats et prestige |
| `apps/web/src/style.css` | Mise en page responsive, thème clair/sombre et animations d'interface |
| `public/assets/*.svg` | Illustrations originales des flacons et équipements |
| `tests/economy.test.ts` | Tests unitaires de l'économie, du prestige et de la persistance |

Le rendu est réalisé en HTML/CSS/TypeScript avec SVG ; Phaser n'est plus nécessaire pour la boucle de jeu actuelle. Sur grand écran, l'interface reste dans la hauteur du viewport, sans défilement vertical. Les actions de jeu sont opérées au pointeur ou au tactile : Tab ne parcourt pas les boutons et Entrée/Espace ne déclenchent pas les actions.

## État du projet

Parfum Empire reste un prototype incrémental côté navigateur. Les tests automatisés vérifient le moteur économique et la compilation. Une inspection visuelle dans un navigateur réel reste nécessaire avant de considérer l'interface comme définitivement validée sur tous les appareils.

Les comptes, les sauvegardes cloud, le multijoueur et un backend autoritaire ne sont pas implémentés.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Décision de plateforme](docs/PLATFORM_DECISION.md)
- [Recherche technique](docs/RESEARCH.md)
- [Roadmap](docs/ROADMAP.md)
- [État d'implémentation](docs/IMPLEMENTATION_STATUS.md)

## Licence

Voir [LICENSE](LICENSE).
