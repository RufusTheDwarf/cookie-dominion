# État d’implémentation — Parfum Empire

## Gameplay et contenu

| Système | État | Détails |
|---|---|---|
| Déplacement | Implémenté | WASD, flèches, D-pad tactile et clic sur la carte |
| Personnages | Implémenté | Joueur parfumeur, Mila la parfumeuse et client VIP en formes Phaser |
| Manufacture | Implémenté | Trois étages et cinq équipements de parfumerie |
| Flacons animés | Implémenté | Flacons colorés sur la ligne d’embouteillage ; l’animation ne double pas les revenus |
| Mondes | Implémenté | Jardin de Verre, Maison d’Ambre et Palais Astral |
| Améliorations | Implémenté | Rendement, puissance de création et réduction des coûts, dix niveaux chacun |
| Contrats | Implémenté | Cinq objectifs avec progression et récompenses réclamables |
| Flacon mythique | Implémenté | Fenêtre de récupération, récompense instantanée et production ×2 pendant 20 secondes |
| Rebirth normal | Implémenté | Réinitialise les machines et le solde du run, conserve les recherches et augmente le multiplicateur |
| Ascension totale | Implémenté | Après 10 rebirths normaux ; réinitialise la progression normale et récompense des Essences originelles |
| Valeur des essences | Implémenté | 1 000 000 points de valeur d’empire par essence et +75 % de rendement par unité |
| Sauvegarde | Implémenté | LocalStorage, export/import JSON, validation, migration et effacement confirmé |
| Progression hors ligne | Implémenté | Production plafonnée à huit heures |
| Comptes / cloud / multijoueur | Non implémenté | Aucun compte ni backend distant |

## Persistance

Les anciens champs de sauvegarde restent lus pour ne pas perdre la progression déjà enregistrée. Les champs ajoutés pour les Essences originelles et l’ascension totale reçoivent des valeurs par défaut lors du chargement d’une ancienne partie.

Les sauvegardes restent locales au navigateur. L’import/export JSON sert de transfert manuel entre appareils.

## Vérifications

- Tests Vitest : économie, machines, recherches, contrats, rebirth normal, ascension totale, essences, migration et import/export.
- GitHub Actions : installation npm, typecheck TypeScript, tests et build Vite.
- Test visuel manuel dans un vrai navigateur : à effectuer.
- Vérifications finales de l’interface sur ordinateur, tablette et petit écran : à effectuer.

## Prochaines étapes

1. Tests visuels en navigateur et corrections de caméra / interaction.
2. Commandes clients, vente interactive et objectifs contextuels des mondes.
3. Version publique hébergée et tests joueurs.
