<div align="center">

# PARFUM EMPIRE

### Construis ton atelier. Maîtrise tes formules. Développe ta maison.

**Jeu de gestion en 2D dans le navigateur, avec déplacement, récolte ciblée, formulation, vente et automatisation.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

## Le jeu

Parfum Empire se déroule dans une maison de parfumerie que le joueur développe étape par étape. L'atelier est un espace 2D parcourable qui relie un jardin botanique, un laboratoire et une boutique. La caméra suit le personnage dans une carte plus grande que l'écran. Les ingrédients ne tombent pas au hasard : chaque parcelle fournit une matière précise.

## Boucle de jeu

1. Déplace-toi dans le jardin avec les flèches ou ZQSD. Sur téléphone, utilise les commandes tactiles ou touche le sol pour marcher.
2. Approche une parcelle et appuie sur E ou sur le bouton Interagir pour récolter la matière correspondante.
3. Choisis une recette dans le carnet de formulations.
4. Rejoins le laboratoire et interagis pour fabriquer le flacon. Les ingrédients nécessaires sont consommés.
5. Au comptoir, vends tes flacons ou livre la commande du client en cours pour obtenir une prime de 50 %.
6. Achète les machines de l'étage actif. Après les prérequis et le paiement, utilise l'escalier pour ouvrir l'étage de manufacture puis celui des essences rares.
7. Les étages ouverts restent accessibles avec le sélecteur et leurs machines continuent de produire pendant que tu travailles ailleurs.
8. Achète des recherches pour développer la manufacture, puis ouvre de nouvelles collections grâce au prestige.

## Systèmes

- Atelier 2D avec caméra de suivi, déplacement au clavier, commandes tactiles et déplacement par toucher.
- Animation de marche avec orientation, mouvements du corps et animation d'interaction.
- Machines et parcelles dessinées dans le monde, effets de particules lors des interactions et végétation animée.
- Trois étages persistants, escalier interactif, catalogue limité à l'étage actif et palettes visuelles distinctes.
- Trois pièces reliées par des passages : jardin botanique, laboratoire et boutique.
- Sept parcelles botaniques à récolte déterministe.
- Cinq recettes qui utilisent des combinaisons d'ingrédients précises.
- Inventaire des matières, découvertes, flacons fabriqués et ventes.
- Commandes clients déterministes, quantité requise, rotation de recettes sauvegardée et prime de livraison de 50 %.
- Dix équipements de production et cinq recherches évolutives.
- Contrats, honneurs, trois collections, rebirth et ascension totale.
- Sauvegarde locale, export JSON, import et migration des anciennes sauvegardes.
- Production hors ligne limitée à huit heures.

## Architecture

| Fichier | Responsabilité |
|---|---|
| `apps/web/src/main.ts` | Interface, progression, sauvegarde et connexion des systèmes |
| `apps/web/src/economy.ts` | Règles de récolte, recettes, vente, production, recherches et prestige |
| `apps/web/src/workshop-scene.ts` | Monde 2D, caméra, déplacement, animations, particules, proximité des postes et contrôles |
| `apps/web/src/style.css` | Interface responsive et commandes tactiles |
| `public/assets/*.svg` | Illustrations des matières, flacons et équipements |
| `tests/economy.test.ts` | Tests du moteur économique et des sauvegardes |
| `AGENTS.md` | Carte technique et règles à suivre lors des modifications |

Les fichiers livrés au navigateur peuvent être inspectés par les joueurs. Le renommage ou l'obfuscation des fichiers ne remplace pas une sécurité serveur. Une future protection contre la triche devra faire valider par un backend l'argent, l'inventaire et la progression.

## Lancer le jeu

Prérequis : Node.js 22 ou plus récent et npm 10 ou plus récent.

```bash
git clone https://github.com/RufusTheDwarf/parfum-empire.git
cd parfum-empire
npm install
npm run dev
```

Dans Codespaces, lance les mêmes commandes puis ouvre le port indiqué par Vite.

## Vérifications

```bash
npm run typecheck
npm test
npm run build
```

La compilation et les tests vérifient le code. Une vérification visuelle dans le navigateur reste nécessaire pour valider l'affichage sur plusieurs tailles d'écran.

## Limites connues

La progression est stockée localement dans le navigateur. Les comptes, les sauvegardes cloud, le multijoueur et la validation serveur ne sont pas encore implémentés.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Décision de plateforme](docs/PLATFORM_DECISION.md)
- [Recherche technique](docs/RESEARCH.md)
- [Roadmap](docs/ROADMAP.md)
- [État d'implémentation](docs/IMPLEMENTATION_STATUS.md)

## Licence

Voir [LICENSE](LICENSE).
