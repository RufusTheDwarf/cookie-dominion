# Roadmap — Parfum Empire

- [x] Phase 0–2: inspecter les outils, choisir Web/Phaser et définir l’architecture.
- [x] Phase 3: économie déterministe, équipements, sauvegarde locale et progression hors ligne plafonnée.
- [x] Phase 4: CI, tests unitaires, vérification TypeScript et build.
- [x] Phase 5: tycoon 2D avec déplacement, trois étages, convoyeur, collecteur, trois mondes et rebirth normal.
- [x] Phase 6: commandes tactiles, clic pour se déplacer, export/import/effacement des sauvegardes.
- [x] Phase 7a: rebranding de la pâtisserie vers une maison de parfumerie ; nouveau HUD coloré inspiré des conventions de tycoon Roblox.
- [x] Phase 7b: nouveaux personnages dessinés dans Phaser, équipements de parfumerie et flacons animés sur le convoyeur.
- [x] Phase 7c: double prestige — rebirth normal et ascension totale avec Essences originelles.
- [x] Phase 8a: améliorations de production, créations manuelles et réduction des coûts.
- [x] Phase 8b: cinq contrats de progression avec récompenses sauvegardées.
- [x] Phase 8c: flacon mythique temporaire, récompense immédiate et bonus de production ×2.
- [ ] Phase 9: test manuel dans un navigateur, ajuster la caméra et valider les tailles d’écran.
- [ ] Phase 10: commandes clients, chaîne production → vente, et objectifs propres à chaque monde.
- [ ] Phase 11: multijoueur autoritaire et sauvegardes cloud.
- [ ] Phase 12: déploiement public et tests avec des joueurs.
- [ ] Phase 13: décider si un packaging desktop est utile.

## Critères de la version actuelle

- Déplacement en 2D au clavier, au clic et via D-pad.
- Achat des équipements limité à l’étage et au prix affiché.
- Production passive calculée séparément des animations des flacons.
- Rebirth normal : remet les machines et le solde courant à zéro, conserve les recherches et augmente le multiplicateur.
- Ascension totale : débloquée après 10 rebirths normaux, remet à zéro la progression normale et donne des Essences originelles.
- Chaque essence accorde +75 % de rendement et compte pour 1 000 000 points de valeur d’empire.
- Import/export JSON validé, sauvegarde locale automatique et migration des anciens champs.
- Tests, typecheck et build via GitHub Actions.
