# Ovenfall

**Titre de travail — nom et marque non vérifiés.**

Tycoon de boulangerie 2D jouable dans le navigateur, construit avec TypeScript, Phaser 3 et Vite.

## Boucle de jeu

- Déplacement du personnage avec **WASD**, les **flèches**, les boutons directionnels à l’écran ou un clic sur la carte.
- Approche-toi d’une machine, du portail ou des escaliers puis appuie sur **E** ou utilise le bouton **INTERAGIR**.
- Achète des machines sur l’étage correspondant. Les cookies animés apparaissent sur le convoyeur et avancent vers le collecteur.
- Les machines produisent des cookies automatiquement. Les gains sont calculés par l’économie du jeu et continuent sur les autres étages.
- Trois étages, trois mondes, cinq types de machines et des rebirths qui multiplient durablement les revenus.
- Le premier rebirth déverrouille Choco Moon ; trois rebirths déverrouillent Galaxy Oven.
- Sauvegarde automatique locale, progrès hors ligne limité à huit heures, export de sauvegarde JSON, import depuis texte/fichier et effacement avec confirmation.

## Contrôles

| Action | Contrôle |
|---|---|
| Se déplacer | WASD, flèches, D-pad à l’écran ou clic sur l’endroit de la carte |
| Interagir avec une machine / un portail / les escaliers | E ou bouton INTERAGIR quand tu es proche |
| Produire des cookies au début | Bouton FAIRE UN COOKIE ou barre d’espace |
| Changer d’étage | Escaliers + E ou boutons d’étage |
| Changer de monde | Portail + E ou boutons de monde après déblocage |

## Sauvegarde et données

Le panneau **Gestion de la partie** permet de :

- **Sauvegarder** immédiatement dans le stockage de ce navigateur.
- **Exporter data** : produit un bloc JSON que tu peux copier et garder comme sauvegarde.
- **Copier** : copie le bloc JSON lorsque le navigateur autorise l’accès au presse-papiers.
- **Charger texte** : importe le bloc JSON collé dans le champ.
- **Charger fichier** : importe un fichier JSON exporté.
- **Effacer la partie** : demande confirmation, puis réinitialise cookies, machines, rebirths et mondes débloqués.

L’import contrôle le format pour éviter qu’un texte invalide remplace accidentellement la sauvegarde avec une partie vide. Les anciennes sauvegardes du prototype avec seulement le compteur de fours peuvent aussi être migrées. Les sauvegardes restent locales : elles ne sont pas synchronisées entre appareils.

## Lancer dans le navigateur sans installer Node.js localement

Le dépôt privé contient une configuration GitHub Codespaces.

1. Ouvre le dépôt, puis sélectionne **Code → Codespaces → Create codespace on main**.
2. Dans le terminal intégré, exécute :

```bash
npm run dev
```

3. Ouvre le port **5173** via **Open in Browser**.

La disponibilité et les quotas de Codespaces dépendent du compte GitHub.

## Lancer en local

Prérequis : Node.js 22+ et npm 10+.

```bash
npm install
npm run dev
```

## Vérifier le projet

```bash
npm run typecheck
npm test
npm run build
```

Les vérifications automatiques de ces commandes sont exécutées par GitHub Actions sur les mises à jour de main.

## Stack et limites

| Couche | Technologie |
|---|---|
| Jeu 2D | Phaser 3 |
| Langage | TypeScript |
| Dev/build | Vite |
| Tests | Vitest |
| Sauvegarde actuelle | LocalStorage et fichier JSON |
| Hébergement actuel | Prototype web ; aucun backend distant ni compte utilisateur |

Multijoueur, sauvegardes cloud, quêtes, combat, serveur autoritaire et installateur Windows ne sont pas encore implémentés.

## Documentation

- [Décision de plateforme](docs/PLATFORM_DECISION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Recherche technique](docs/RESEARCH.md)
- [Roadmap](docs/ROADMAP.md)
- [État d’implémentation](docs/IMPLEMENTATION_STATUS.md)

## Licence

Le dépôt comporte un fichier LICENSE avec la licence MIT. Confirme que c’est bien la licence voulue avant une publication publique.
