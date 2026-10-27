# État d’implémentation — 2026-10-27

## Boucle de jeu actuelle

| Système | État | Détails |
|---|---|---|
| Déplacement 2D | Implémenté | WASD, flèches, D-pad tactile et clic sur la carte |
| Usine et machines | Implémenté | Trois étages, cinq types de machines, convoyeur animé et collecteur |
| Mondes | Implémenté | Cookie Valley, Choco Moon et Galaxy Oven, déverrouillés par rebirth |
| Production passive | Implémenté | Production calculée par l’économie, indépendante des effets visuels |
| Rebirth | Implémenté | Réinitialise le parc de machines, augmente le multiplicateur et débloque des mondes |
| Recherche | Implémenté | Production +20 % par niveau, clic +10 cookies par niveau, machines jusqu’à 50 % moins chères ; dix niveaux chacun |
| Contrats | Implémenté | Cinq objectifs à progression suivie avec récompenses réclamables une seule fois |
| Cookie doré | Implémenté | Apparition périodique, fenêtre de 12 secondes, récompense immédiate et production ×2 pendant 20 secondes |
| Sauvegardes | Implémenté | LocalStorage, export/import JSON, validation, migration et effacement confirmé |
| Progression hors ligne | Implémenté | Production hors ligne plafonnée à huit heures |
| Multijoueur / cloud | Non implémenté | Aucun compte, backend autoritaire ou synchronisation cloud |

## Persistance

Les améliorations achetées, les contrats réclamés et le nombre de cookies dorés récupérés sont intégrés à l’état sauvegardé. Les anciennes sauvegardes sans ces nouveaux champs sont chargées avec des valeurs par défaut, sans demander au joueur de recommencer.

## Vérifications

- Les tests Vitest couvrent les coûts de machines, la production, les upgrades, les missions, le rebirth, les mondes, la migration et l’import/export.
- GitHub Actions exécute l’installation, le typecheck TypeScript, les tests et le build Vite à chaque push sur `main`.
- Le test visuel manuel dans un vrai navigateur et les vérifications sur plusieurs tailles d’écran restent à effectuer.

## Prochaines étapes prioritaires

1. Tester les contrôles, la caméra et le HUD sur ordinateur et mobile.
2. Ajouter les commandes de clients, une chaîne production → vente plus interactive et des objectifs propres à chaque monde.
3. Préparer une version hébergée et organiser des tests de joueurs.
