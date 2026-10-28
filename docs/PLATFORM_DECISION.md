# Décision de plateforme — Parfum Empire

## Décision actuelle

Parfum Empire est un jeu incrémental web construit avec TypeScript, Vite, HTML/CSS et SVG. La boucle active est un clicker tycoon : création manuelle, production passive, catalogue de producteurs, recherches, commandes, collections et prestige.

La première version utilisait Phaser pour expérimenter un atelier 2D explorable. Cette direction a été remplacée par une structure de clicker plus directe, inspirée des jeux incrémentaux classiques. Phaser a été retiré des dépendances parce qu'il n'est plus utilisé par l'interface actuelle.

## Pourquoi

- Le navigateur permet de lancer et partager facilement le prototype.
- Une interface HTML/CSS convient à un catalogue de bâtiments, des indicateurs économiques et des panneaux de progression.
- L'économie reste indépendante du rendu et se teste dans Vitest.
- Un prototype solo stable doit précéder le travail sur les comptes, les sauvegardes cloud, le multijoueur ou un packaging desktop.
- Le projet conserve son indépendance vis-à-vis de Roblox ; il doit donc gérer lui-même l'hébergement et tout futur backend.

## Stack actuelle

- Interface : TypeScript, HTML, CSS et SVG.
- Développement et compilation : Vite.
- Tests : Vitest pour les règles déterministes et les sauvegardes ; tests navigateur manuels à compléter.
- Hébergement : client statique d'abord, aucun backend distant actuellement.
- Sauvegarde : LocalStorage et import/export JSON.
- Multijoueur éventuel : WebSocket sur Cloudflare Durable Objects ou service Node.js à évaluer seulement après validation du jeu solo.
- Windows : Tauri à considérer lorsque le client web sera stable.

## Nom de travail

L'interface et le dépôt utilisent **Parfum Empire**. Ce nom n'est pas une validation de marque, de société, de domaine ou de disponibilité sur les boutiques d'applications.
