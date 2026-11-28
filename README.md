# KREATIVA — plateforme de vente de produits numériques

Projet frontend construit avec React, TypeScript et Vite.

## Contenu
- Catalogue et fiches produits
- Boutiques publiques et espaces vendeurs
- Inscription, connexion et espace compte
- Panier et parcours de commande
- Interface d'administration
- Assistant et composants d'interface

## Prérequis
- Node.js 20 ou supérieur
- npm

## Installation
```bash
npm install
npm run dev
```

## Vérifications
```bash
npm run lint
npm run build
```

## Déploiement
Le projet utilise Vite. La commande de build est `npm run build` et le dossier de sortie est `dist`.
Le fichier `vercel.json` configure le routage des applications monopages sur Vercel.

## État technique à connaître
La version fournie utilise actuellement `localStorage` dans le navigateur pour stocker les données de démonstration et la session. Les comptes, boutiques, commandes et paniers ne sont donc pas encore synchronisés entre plusieurs appareils et ne constituent pas un backend de production.

Les moyens de paiement affichés dans l'interface sont des options prévues dans le parcours utilisateur ; leur présence dans le code ne prouve pas qu'une passerelle de paiement réelle est connectée.

Avant une mise en production, prévoir un backend sécurisé, une base de données partagée, une authentification serveur, des règles d'accès et l'intégration réelle d'un prestataire de paiement.
