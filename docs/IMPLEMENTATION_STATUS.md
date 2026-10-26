# État d’implémentation — 2026-10-26

## État de la tranche actuelle

| Fichier | Rôle | État | Vérification |
|---|---|---|---|
| apps/web/src/main.ts | Carte Phaser, déplacement, étages, mondes, machines, convoyeur, HUD, sauvegardes | Implémenté | TypeScript, tests et build passés sur le commit gameplay précédent ; test visuel manuel restant |
| apps/web/src/economy.ts | Coûts/revenus des machines, multiplicateurs, rebirth, sauvegarde locale, import/export et migration | Implémenté | Tests Vitest passés |
| apps/web/src/style.css | HUD responsive, D-pad, gestion des sauvegardes | Implémenté | Vérification source ; test visuel de différentes tailles restant |
| tests/economy.test.ts | Économie, verrous d’étage/monde, rebirth, migration et import/export | Étendu | Tests Vitest passés |
| .devcontainer/devcontainer.json | Environnement Codespaces pour Node.js/npm | Présent | Codespaces non lancé manuellement par l’assistant |
| .github/workflows/ci.yml | Installation, typecheck, tests et build | Présent | CI passée sur le commit gameplay 152bc668 |

## Comportement de cette version

- Le personnage est volontairement plus visible : contour lumineux, étiquette « TOI » et position affichée dans le HUD.
- Le déplacement est possible avec WASD, les flèches, le D-pad à l’écran et un clic sur la carte.
- Le bouton E / INTERAGIR sert quand le personnage est proche d’une machine, des escaliers ou d’un portail.
- La production automatique est calculée par le modèle économique, indépendamment des animations qui montrent les cookies en transit. Cela évite de compter deux fois les revenus.
- Le panneau Gestion de la partie permet la sauvegarde locale, l’export JSON, la copie, l’import de texte/fichier et l’effacement confirmé.
- L’import valide la structure avant de remplacer l’état courant et prend en charge la migration de l’ancien format « fours uniquement ».

## Vérification

- GitHub Actions sur le commit 152bc668 a réussi l’installation npm, le typecheck TypeScript, les tests Vitest et le build Vite.
- Le test visuel manuel dans un vrai navigateur n’a pas encore été effectué par l’assistant.
- La sauvegarde actuelle reste locale au navigateur ; aucun backend distant, compte ou synchronisation inter-appareils n’existe.

## Dépôt

- Dépôt privé : RufusTheDwarf/cookie-dominion, branche main.
- Le fichier LICENSE contient la licence MIT. Confirmer le choix avant toute publication publique.
