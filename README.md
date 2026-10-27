# 🍪 Cookie Dominion

<p align="center">
  <strong>Construis ton empire de cookies, étage après étage.</strong><br>
  Un tycoon de boulangerie en 2D, jouable dans le navigateur.
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
  <img alt="Phaser 3" src="https://img.shields.io/badge/Phaser_3-8A2BE2">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white">
  <img alt="Tests" src="https://img.shields.io/badge/tests-Vitest-6E9F18">
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-green">
</p>

---

## 🏭 Ton empire commence avec un cookie

Déplace-toi dans ta boulangerie, installe des machines, automatise la production et fais grimper tes revenus. Débloque de nouveaux étages et des mondes toujours plus ambitieux, puis effectue un **rebirth** pour repartir plus puissant.

**Cookie Dominion** est un prototype de tycoon 2D développé avec **TypeScript**, **Phaser 3** et **Vite**.

## ✨ Fonctionnalités

- **Déplacement libre en 2D** — clavier, clic sur la carte ou commandes tactiles.
- **Boulangerie à plusieurs étages** — explore trois étages et utilise les escaliers pour circuler.
- **Production automatisée** — achète des machines et regarde les cookies parcourir les convoyeurs jusqu’au collecteur.
- **Progression entre les mondes** — découvre trois mondes, avec Choco Moon après le premier rebirth et Galaxy Oven après trois rebirths.
- **Un vrai loop de tycoon** — produis, investis, automatise, agrandis ta fabrique et recommence avec un meilleur rendement.
- **Trois améliorations permanentes** — augmente la production automatique, la puissance du clic et réduis le prix des prochaines machines. Les niveaux restent après un rebirth.
- **Cookie doré à durée limitée** — attrape-le avant qu’il disparaisse pour recevoir un bonus de cookies et doubler la production pendant 20 secondes. Le compteur est sauvegardé.
- **Contrats avec récompenses** — termine cinq objectifs de progression et réclame tes cookies pour financer l’expansion.
- **Rebirths** — réinitialise les machines du run pour gagner un multiplicateur permanent et débloquer de nouveaux mondes.
- **Trois mondes et trois étages** — change d’environnement, visite chaque étage et construis une usine différente dans chaque monde.
- **Progression hors ligne** — récupère une production limitée à huit heures d’absence.
- **Sauvegardes portables** — sauvegarde locale automatique, export/import JSON et effacement avec confirmation. Les améliorations et contrats réclamés sont enregistrés.

## 🔁 Ta boucle de progression

1. **Lance la production** avec le clic manuel et ta première machine.
2. **Réinvestis** dans des machines, puis dans la recherche pour augmenter les revenus ou réduire les coûts.
3. **Réclame les contrats** dès qu'ils sont terminés : ils apportent une réserve de cookies pour accélérer le début de partie.
4. **Explore les étages** pour trouver les machines qui correspondent à chaque zone.
5. **Débloque les portails** avec les rebirths, puis profite des multiplicateurs de monde.
6. **Recommence plus fort** grâce au multiplicateur permanent du rebirth et à tes améliorations conservées.

## 🎮 Commandes

| Action | Commande |
|---|---|
| Se déplacer | `WASD`, flèches directionnelles |
| Se déplacer sur mobile | D-pad à l’écran |
| Se déplacer vers un point | Cliquer sur la carte |
| Produire les premiers cookies | Bouton **FAIRE UN COOKIE** ou barre d’espace |
| Interagir avec une machine, un portail ou des escaliers | `E` ou bouton **INTERAGIR** à proximité |
| Changer d’étage | Utiliser les escaliers ou les boutons d’étage |
| Changer de monde | Utiliser un portail ou les boutons de monde après déblocage |

## 🚀 Démarrer rapidement

### Option 1 — Jouer avec GitHub Codespaces

Le dépôt contient une configuration Codespaces.

1. Ouvre le menu **Code** du dépôt.
2. Sélectionne **Codespaces → Create codespace on main**.
3. Dans le terminal du Codespace, lance :

```bash
npm run dev
```

4. Ouvre le port **5173** dans le navigateur depuis Codespaces.

> La disponibilité de Codespaces et ses quotas dépendent de ton compte GitHub.

### Option 2 — Lancer sur ton ordinateur

**Prérequis :** Node.js 22+ et npm 10+.

```bash
git clone https://github.com/RufusTheDwarf/cookie-dominion.git
cd cookie-dominion
npm install
npm run dev
```

Vite affichera l’adresse locale à ouvrir dans ton navigateur.

## 💾 Sauvegarde : garde ta progression

Ouvre le panneau **Gestion de la partie** pour gérer tes données.

| Action | Résultat |
|---|---|
| **Sauvegarder** | Enregistre immédiatement la partie dans le navigateur actuel |
| **Exporter data** | Génère une sauvegarde JSON à conserver |
| **Copier** | Copie les données lorsque le navigateur autorise le presse-papiers |
| **Charger texte** | Importe des données JSON collées dans le champ |
| **Charger fichier** | Importe un fichier JSON exporté précédemment |
| **Effacer la partie** | Réinitialise la progression après confirmation |

L’import vérifie le format des données avant de remplacer la partie. Les anciennes sauvegardes du prototype contenant uniquement le compteur de fours peuvent aussi être migrées.

**À savoir :** les sauvegardes sont stockées localement dans le navigateur. Elles ne sont pas synchronisées entre appareils. Exporte régulièrement tes données si tu veux en garder une copie.

## 🧰 Développement

Installe les dépendances, puis utilise les commandes suivantes :

```bash
npm install
npm run dev
```

Avant de proposer des changements, lance les vérifications :

```bash
npm run typecheck
npm test
npm run build
```

Les vérifications correspondantes sont également exécutées par GitHub Actions lors des mises à jour de `main`.

## 🧱 Stack technique

| Élément | Technologie |
|---|---|
| Moteur 2D | [Phaser 3](https://phaser.io/) |
| Langage | [TypeScript](https://www.typescriptlang.org/) |
| Serveur de développement et build | [Vite](https://vite.dev/) |
| Tests | [Vitest](https://vitest.dev/) |
| Sauvegarde | LocalStorage + fichiers JSON |
| Environnement de jeu | Navigateur web |

## 🗺️ Documentation du projet

- [Décision de plateforme](docs/PLATFORM_DECISION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Recherche technique](docs/RESEARCH.md)
- [Roadmap](docs/ROADMAP.md)
- [État d’implémentation](docs/IMPLEMENTATION_STATUS.md)

## 🔭 État du projet

Cookie Dominion est actuellement un **prototype web**. Les fonctionnalités suivantes ne sont pas encore implémentées :

- Comptes joueurs et sauvegardes cloud
- Multijoueur
- Multijoueur et sauvegardes cloud synchronisées
- Contrats répétables, événements saisonniers, clients/NPC et système de combat
- Backend distant avec autorité serveur
- Installateur Windows

## 🤝 Contribuer

Les idées, rapports de bugs et propositions d’amélioration sont les bienvenus. Pour signaler un problème, indique les étapes pour le reproduire et le résultat attendu.

## 📄 Licence

Le dépôt contient un fichier [LICENSE](LICENSE) annoncé sous licence MIT. Vérifie le contenu de ce fichier avant toute réutilisation ou redistribution.

---

<p align="center">
  <strong>Un cookie à la fois. Un empire à la fois.</strong>
</p>
