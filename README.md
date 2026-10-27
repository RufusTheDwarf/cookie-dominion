<div align="center">

# PARFUM EMPIRE

### Compose des fragrances. Automatise ta manufacture. Deviens une légende.

**Un tycoon 2D dans le navigateur, avec déplacements libres, machines, mondes à débloquer et deux niveaux de prestige.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Phaser 3](https://img.shields.io/badge/Phaser-3.90-8A2BE2)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Le concept

Pars d'un atelier vide et construis une maison de parfumerie. Formule tes premières fragrances, installe des alambics, remplis des flacons à la chaîne et développe tes ventes. Les revenus financent de nouveaux équipements, des recherches et l'accès à des mondes plus rares.

Le jeu reprend les mécaniques de progression rapides des tycoons Roblox, avec une identité visuelle et un univers originaux autour de la parfumerie.

## La boucle de jeu

1. **Crée tes premiers parfums** manuellement pour lancer la trésorerie.
2. **Achète des équipements** qui fabriquent et vendent automatiquement des fragrances.
3. **Améliore ta maison** pour augmenter les revenus, renforcer les créations manuelles et réduire le coût des machines.
4. **Livre les commandes VIP** : rejoins le client sur la carte, appuie sur `E`, paie les matières premières et empoche un paiement qui augmente à chaque livraison.
5. **Récupère les contrats** dès qu'ils sont terminés pour obtenir des parfums supplémentaires.
6. **Explore les étages et les mondes** pour ouvrir des lignes plus puissantes.
7. **Effectue un rebirth normal**, puis vise l'**ascension totale** pour repartir avec une monnaie de prestige plus précieuse.

## Ce qui est déjà dans le prototype

- **Déplacement en 2D** au clavier, avec les flèches, WASD, les commandes tactiles ou un clic sur le terrain.
- **Personnages redessinés** : ton parfumeur, Mila la parfumeuse et un client VIP, dans un style géométrique coloré.
- **Trois étages** : formulation, embouteillage et extraction.
- **Trois mondes** : Jardin de Verre, Maison d’Ambre et Palais Astral.
- **Cinq équipements** : table de formulation, alambic de cuivre, ligne d’embouteillage, atelier de parfumeur et extracteur astral.
- **Production animée** : flacons visibles sur le convoyeur et équipement qui s’active à l’achat.
- **Recherche** : rendement des machines, puissance des créations manuelles et réduction des coûts, jusqu’au niveau 10.
- **Commandes VIP** : marche jusqu’au client dans l’atelier et appuie sur `E` pour livrer. Les coûts de préparation et les paiements augmentent à chaque commande, et le compteur est sauvegardé.
- **Contrats** : six objectifs de progression avec barre d’avancement et récompense réclamable, dont un contrat pour la première livraison VIP.
- **Flacon mythique** : événement à durée limitée, récompense immédiate et production doublée pendant 20 secondes.
- **Sauvegarde locale** : sauvegarde automatique, export JSON, import depuis le texte ou un fichier et effacement avec confirmation.

## Les deux niveaux de prestige

### Rebirth normal

Le rebirth normal remet à zéro les parfums du run et les machines. Il augmente définitivement le multiplicateur de revenus et permet de conserver les recherches acquises.

### Ascension totale

L'ascension totale se débloque après **10 rebirths normaux**. Elle demande ensuite de terminer le run en cours. Elle efface les parfums, les machines, les mondes débloqués, les recherches et les contrats.

En échange, tu gagnes des **Essences originelles**. C'est une monnaie de prestige distincte :

- Chaque essence ajoute **75 % de rendement permanent**.
- Chaque essence représente **1 000 000 points de valeur d'empire**.
- La première ascension donne une essence ; les ascensions suivantes en donnent davantage.
- Le niveau requis augmente de cinq rebirths normaux à chaque ascension totale.

L'ascension est irréversible pour la progression normale. Le jeu demande une confirmation avant de la lancer.

## Commandes

| Action | Contrôle |
|---|---|
| Se déplacer | `WASD` ou flèches |
| Touches mobiles | D-pad à l’écran |
| Se déplacer vers un point | Cliquer sur le terrain |
| Créer un parfum manuellement | Bouton **CRÉER UN PARFUM** ou barre d’espace |
| Acheter une machine proche | `E` ou **INTERAGIR** |
| Utiliser les escaliers | S’approcher puis `E`, ou bouton d’étage |
| Livrer une commande VIP | Rejoins le client près du bas de la carte, puis appuie sur `E` |
| Entrer dans un monde débloqué | Portail ou bouton du monde |

## Lancer le jeu

**Prérequis :** Node.js 22+ et npm 10+.

```bash
git clone https://github.com/RufusTheDwarf/cookie-dominion.git
cd cookie-dominion
npm install
npm run dev
```

Ouvre l'adresse locale indiquée par Vite dans ton navigateur.

Pour lancer les vérifications avant de proposer un changement :

```bash
npm run typecheck
npm test
npm run build
```

Le dépôt contient également une configuration GitHub Codespaces. Ouvre **Code → Codespaces**, crée un Codespace sur `main`, puis lance `npm run dev` dans son terminal.

## Sauvegardes et compatibilité

La partie est stockée dans le navigateur, sans compte ni synchronisation cloud. Utilise l'export JSON pour conserver une copie ou déplacer ta progression.

Les anciennes sauvegardes sont chargées avec des valeurs par défaut pour les nouveaux champs de prestige. Les données de la version précédente sont réutilisées comme montant initial de parfums.

## Stack technique

| Couche | Technologie |
|---|---|
| Jeu 2D | [Phaser 3](https://phaser.io/) |
| Langage | [TypeScript](https://www.typescriptlang.org/) |
| Développement et build | [Vite](https://vite.dev/) |
| Tests | [Vitest](https://vitest.dev/) |
| Persistance | LocalStorage et fichiers JSON |

## État et prochaines étapes

Parfum Empire reste un **prototype web jouable**, pas encore une expérience équivalente en contenu à un jeu Roblox complet. Les prochaines étapes prioritaires sont les commandes de clients, une vente plus interactive, des objectifs spécifiques aux mondes, des tests visuels sur mobile et un déploiement public.

Les comptes joueurs, le multijoueur, les sauvegardes cloud et le backend autoritaire ne sont pas implémentés.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Décision de plateforme](docs/PLATFORM_DECISION.md)
- [Recherche technique](docs/RESEARCH.md)
- [Roadmap](docs/ROADMAP.md)
- [État d’implémentation](docs/IMPLEMENTATION_STATUS.md)

## Licence

Voir [LICENSE](LICENSE).
