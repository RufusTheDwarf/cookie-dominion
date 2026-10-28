<div align="center">

# 🧪 Parfum Empire

**Compose des fragrances. Automatise ta manufacture. Construis une maison de légende.**

Un jeu de gestion incrémental dans le navigateur : clics, production passive, recherches, contrats et prestige.

<br>

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?style=flat&logo=nodedotjs&logoColor=white)](#)
[![SVG](https://img.shields.io/badge/Render-SVG-FFB13B?style=flat&logo=svg&logoColor=white)](#)
[![LocalStorage](https://img.shields.io/badge/Save-LocalStorage-4B32C3?style=flat)](#)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat)](#)

<br>

[![Stars](https://img.shields.io/github/stars/RufusTheDwarf/parfum-empire?style=flat&color=yellow)](https://github.com/RufusTheDwarf/parfum-empire/stargazers)
[![Forks](https://img.shields.io/github/forks/RufusTheDwarf/parfum-empire?style=flat&color=blue)](https://github.com/RufusTheDwarf/parfum-empire/forks)
[![Watchers](https://img.shields.io/github/watchers/RufusTheDwarf/parfum-empire?style=flat&color=green)](https://github.com/RufusTheDwarf/parfum-empire/watchers)
[![Issues](https://img.shields.io/github/issues/RufusTheDwarf/parfum-empire?style=flat&color=red)](https://github.com/RufusTheDwarf/parfum-empire/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/RufusTheDwarf/parfum-empire?style=flat&color=purple)](https://github.com/RufusTheDwarf/parfum-empire/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/RufusTheDwarf/parfum-empire?style=flat&color=orange)](https://github.com/RufusTheDwarf/parfum-empire/commits/main)
[![Contributors](https://img.shields.io/github/contributors/RufusTheDwarf/parfum-empire?style=flat&color=informational)](https://github.com/RufusTheDwarf/parfum-empire/graphs/contributors)
[![Repo Size](https://img.shields.io/github/repo-size/RufusTheDwarf/parfum-empire?style=flat&color=black)](https://github.com/RufusTheDwarf/parfum-empire)
[![Top Language](https://img.shields.io/github/languages/top/RufusTheDwarf/parfum-empire?style=flat&color=pink)](https://github.com/RufusTheDwarf/parfum-empire)

</div>

---

## 🎯 Le concept

Tu commences sans parfum fini, avec des matières premières à découvrir. Chaque clic récolte un ingrédient botanique aléatoire : lavande, menthe, rose, bergamote ou une essence plus rare. **Dix matières permettent de composer un parfum.** Les fragrances gagnées servent ensuite à acheter des équipements, développer des recherches et automatiser la production.

La structure est celle d'un **clicker tycoon** : le flacon est le point d'entrée principal, la manufacture rassemble les producteurs et le bureau regroupe les systèmes de progression. La navigation sur une carte 2D et les étages à parcourir ne font plus partie de la boucle centrale.

---

## 🖥️ Structure de l'interface

| Zone | Rôle |
|---|---|
| **Le parfumeur** | Récolte aléatoire, animation de la matière découverte, progression de 0 à 10, carnet botanique, flacon mythique et commandes VIP |
| **La manufacture** | Grille compacte des dix équipements, quantité possédée, coût du prochain exemplaire et rendement par seconde |
| **Le bureau** | Six onglets : recherches, contrats, honneurs, collections, prestige et sauvegardes |
| **Barre économique** | Trésorerie, production par seconde, progression des matières et cumul du run |

L'interface utilise des illustrations **SVG originales** pour la maison, les flacons, les ingrédients et les dix types d'équipement. Le style visuel associe papier ivoire, vert profond, cuivre et laiton. Sur grand écran, la zone de jeu tient dans la hauteur visible, sans défilement vertical ; les écrans plus étroits utilisent une mise en page responsive.

---

## 🔄 Boucle de jeu

1. **Récolte des matières** : chaque clic révèle un objet aléatoire. Les neuf premiers clics ne donnent pas directement de parfum.
2. **Assemble une fragrance** après dix matières récoltées. Les matières sont consommées pour produire un parfum.
3. **Investis dans les producteurs** : commence par la table de formulation, puis achète des équipements plus coûteux qui génèrent des parfums automatiquement.
4. **Achète des recherches** pour augmenter la production, améliorer la chance de récolte bonus, réduire les coûts, prolonger les bonus rares et augmenter les paiements VIP.
5. **Livre des commandes VIP** depuis le panneau dédié ; les coûts et les paiements progressent avec chaque livraison.
6. **Réclame les contrats** et complète le registre des honneurs.
7. **Ouvre de nouvelles collections** en effectuant des rebirths.
8. **Effectue une ascension totale** pour gagner des Essences originelles persistantes.

---

## ⚙️ Systèmes implémentés

- **Dix producteurs** : table de formulation, alambic de cuivre, ligne d'embouteillage, atelier de parfumeur, extracteur astral, serre botanique, presse à enfleurage, atelier haute parfumerie, distillateur de cristal et manufacture orbitale.
- **Production incrémentale** : coûts croissants à chaque achat, revenu passif calculé par seconde et multiplication du rendement selon la collection active.
- **Récolte botanique** : sept matières à probabilités différentes, dix ingrédients consommés par fragrance et carnet de découvertes sauvegardé.
- **Cinq recherches** : production globale, chance de récolter une matière bonus, réduction du prix des équipements, durée du bonus mythique et paiement des commandes VIP. Chaque recherche possède dix niveaux.
- **Flacon mythique** : apparaît temporairement, rapporte une récompense immédiate et double la production pendant une durée améliorée par la recherche correspondante.
- **Commandes VIP** : dépense de préparation, paiement croissant, marge améliorée par la recherche commerciale et progression sauvegardée.
- **Contrats** : six objectifs réclamables, liés aux équipements, aux ventes cumulées, aux collections et aux commandes.
- **Honneurs** : distinctions automatiques dérivées des étapes de progression.
- **Trois collections** : Jardin de Verre, Maison d'Ambre et Palais Astral. Chaque collection garde son propre inventaire et son multiplicateur de revenus.
- **Rebirth normal** : remet à zéro le stock et les équipements, multiplie durablement le rendement par 1,6 et ouvre des collections supplémentaires.
- **Ascension totale** : exige le seuil de rebirths du palier courant et réinitialise la progression normale contre des Essences originelles.
- **Sauvegardes** : LocalStorage, export JSON, import depuis un fichier ou du texte, migration des anciennes données et effacement confirmé.
- **Progression hors ligne** : les sauvegardes accumulent au maximum huit heures de production passive.

---

## ✨ Prestige

### Rebirth normal

Un rebirth normal remet à zéro le stock du run et les producteurs. Les recherches, les ventes cumulées et les honneurs dérivés de la progression sont conservés. Le multiplicateur de production augmente de **60 % par rebirth**.

### Ascension totale

L'ascension totale devient disponible après **10 rebirths normaux**, puis le seuil augmente de cinq après chaque ascension. Elle remet à zéro la progression normale, octroie des **Essences originelles** persistantes et augmente le rendement permanent de **75 % par essence**. Chaque essence contribue aussi à hauteur de **1 000 000 points de valeur d'empire**. L'ascension est irréversible pour la progression normale. Une confirmation est demandée avant l'action.

---

## 🚀 Lancer le jeu

**Prérequis :** Node.js 22+ et npm 10+.

```bash
git clone https://github.com/RufusTheDwarf/parfum-empire.git
cd parfum-empire
npm install
npm run dev
```

Ouvre l'adresse locale indiquée par Vite.

Dans **GitHub Codespaces**, ouvre le dépôt puis lance les mêmes commandes dans le terminal.

**Vérifications disponibles :**

```bash
npm run typecheck
npm test
npm run build
```

---

## 🏗️ Architecture

| Fichier | Rôle |
|---|---|
| `apps/web/src/main.ts` | Interface clicker, achats, événements, progression, onglets et sauvegardes |
| `apps/web/src/economy.ts` | Règles déterministes des revenus, producteurs, recherches, contrats et prestige |
| `apps/web/src/style.css` | Mise en page responsive, thème clair/sombre et animations d'interface |
| `public/assets/*.svg` | Illustrations originales des flacons et équipements |
| `tests/economy.test.ts` | Tests unitaires de l'économie, du prestige et de la persistance |

Le rendu est réalisé en **HTML/CSS/TypeScript avec SVG** ; Phaser n'est plus nécessaire pour la boucle de jeu actuelle. Sur grand écran, l'interface reste dans la hauteur du viewport, sans défilement vertical. Les actions de jeu sont opérées au pointeur ou au tactile : Tab ne parcourt pas les boutons et Entrée/Espace ne déclenchent pas les actions.

---

## 🚧 État du projet

Parfum Empire reste un **prototype incrémental côté navigateur**. Les tests automatisés vérifient le moteur économique et la compilation. Une inspection visuelle dans un navigateur réel reste nécessaire avant de considérer l'interface comme définitivement validée sur tous les appareils.

Les comptes, les sauvegardes cloud, le multijoueur et un backend autoritaire **ne sont pas implémentés**.

---

## 📚 Documentation

- [Architecture](https://github.com/RufusTheDwarf/parfum-empire/blob/main/docs/ARCHITECTURE.md)
- [Décision de plateforme](https://github.com/RufusTheDwarf/parfum-empire/blob/main/docs/PLATFORM_DECISION.md)
- [Recherche technique](https://github.com/RufusTheDwarf/parfum-empire/blob/main/docs/RESEARCH.md)
- [Roadmap](https://github.com/RufusTheDwarf/parfum-empire/blob/main/docs/ROADMAP.md)
- [État d'implémentation](https://github.com/RufusTheDwarf/parfum-empire/blob/main/docs/IMPLEMENTATION_STATUS.md)

---

## 🤝 Contribuer

Les contributions sont les bienvenues. Consulte le fichier [CONTRIBUTING.md](https://github.com/RufusTheDwarf/parfum-empire/blob/main/CONTRIBUTING.md) pour les détails.

1. Fork le dépôt.
2. Crée une branche : `git checkout -b feature/ma-fonctionnalite`
3. Commit : `git commit -m "Ajout de ma fonctionnalité"`
4. Push : `git push origin feature/ma-fonctionnalite`
5. Ouvre une Pull Request.

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](https://github.com/RufusTheDwarf/parfum-empire/blob/main/LICENSE) pour plus d'informations.

---

<div align="center">

### 👤 Auteur

**RufusTheDwarf**

[![GitHub](https://img.shields.io/badge/GitHub-RufusTheDwarf-181717?style=flat&logo=github&logoColor=white)](https://github.com/RufusTheDwarf) [![Repository](https://img.shields.io/badge/Repo-parfum--empire-2ea44f?style=flat&logo=git&logoColor=white)](https://github.com/RufusTheDwarf/parfum-empire)

<br>

### ⭐ Soutenir le projet

[![Star this repo](https://img.shields.io/badge/⭐_Star_this_repo-yellow?style=flat)](https://github.com/RufusTheDwarf/parfum-empire/stargazers) [![Report an issue](https://img.shields.io/badge/🐛_Report_an_issue-red?style=flat)](https://github.com/RufusTheDwarf/parfum-empire/issues) [![Fork this repo](https://img.shields.io/badge/🍴_Fork_this_repo-blue?style=flat)](https://github.com/RufusTheDwarf/parfum-empire/fork)

<br>

---

<sub>Fait avec ❤️ par **RufusTheDwarf** · Licence MIT · © 2026</sub>

<br>

*« Compose des fragrances. Automatise ta manufacture. Construis une maison de légende. »* 🧪

</div>
