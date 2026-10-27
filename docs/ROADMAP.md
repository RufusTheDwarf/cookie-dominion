# Roadmap

- [x] Phase 0–2: inspecter les outils, choisir Web/Phaser et définir l’architecture de départ.
- [x] Phase 3: économie déterministe, machines, sauvegarde locale et progrès hors ligne plafonné.
- [x] Phase 4: CI, tests unitaires, vérification TypeScript et build de production.
- [x] Phase 5: tycoon 2D avec personnage contrôlable, trois étages, convoyeurs visibles, collecteur, trois mondes et rebirths.
- [x] Phase 6: contrôles visibles (clavier, D-pad, clic pour se déplacer) et gestion des sauvegardes (export/import/effacement confirmé).
- [ ] Phase 7: test manuel dans un navigateur réel, ajuster caméra/déplacements et vérifier différentes tailles d’écran.
- [x] Phase 8a: ajouter un panneau de recherche avec améliorations permanentes (production, puissance du clic, réduction des coûts).
- [x] Phase 8b: ajouter cinq contrats de progression avec barre de progression, récompenses et sauvegarde des récompenses réclamées.
- [x] Phase 8b.1: ajouter le cookie doré à durée limitée, sa récompense, le bonus de production ×2 et le compteur persistant.
- [ ] Phase 8c: ajouter des lignes de production à plusieurs étapes, des commandes clients et des objectifs propres à chaque monde.
- [ ] Phase 9: concevoir et tester des sessions multijoueurs autoritaires et des sauvegardes cloud.
- [ ] Phase 10: déployer une version web publique et organiser des tests de joueurs.
- [ ] Phase 11: décider si le packaging Tauri a de la valeur.

## Critères d’acceptation pour la tranche actuelle

- Le personnage peut se déplacer en 2D par clavier, commandes tactiles ou clic sur la carte.
- Le personnage peut se rendre aux étages et aux mondes déverrouillés.
- Le bouton de cookie et la barre d’espace donnent des cookies.
- L’achat d’une machine est limité à son étage et au prix affiché.
- Des cookies animés avancent sur le convoyeur vers le collecteur ; la production automatique est calculée par l’économie pour toutes les machines.
- Le rebirth réinitialise les machines du run, conserve les gains à vie et augmente le multiplicateur permanent.
- Les changements se sauvegardent automatiquement en local.
- Export JSON, import depuis texte/fichier et effacement avec confirmation sont disponibles.
- L’import rejette les données mal formées et migre l’ancien format où seuls les fours étaient stockés.
- Les progrès hors ligne sont limités à huit heures.
- CI exécute installation, typecheck, tests et build de production sur les commits vers main.
