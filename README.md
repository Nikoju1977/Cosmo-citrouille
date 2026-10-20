# Cosmo Citrouille — L'aventure des 140 mondes 🎃🚀

Jeu spatial d'Halloween en français pour les enfants à partir d'environ 7 ans.

**Contenu :** 140 mondes répartis dans 14 galaxies, 14 boss, modes Aventure et Défi, commandes tactiles et clavier, progression sauvegardée localement, aucun achat intégré ni publicité.

## Jouer dans le navigateur

Ouvrir [`index.html`](index.html) (version autonome) ou utiliser GitHub Pages pour une page jouable directement dans le navigateur.

**Activer GitHub Pages :** dans le dépôt GitHub, ouvrir **Settings → Pages → Build and deployment**, sélectionner **Deploy from a branch**, puis la branche `main` et le dossier `/(root)`. Après publication, l'adresse du jeu apparaîtra dans l'interface Pages.

## Projet web et applications mobiles

- `index.html` : jeu autonome, compatible avec une publication à la racine de GitHub Pages.
- `www/` : version PWA (avec manifeste, service worker, JavaScript et CSS externes).
- `JOUER_IMMEDIATEMENT.html` : copie autonome pour tester sans serveur.
- `capacitor.config.json` et `package.json` : projet Capacitor pour Android/iOS.
- `tests/` : tests d'interactions et de progression.

### Installer les dépendances et préparer les applications

```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

Sur macOS avec Xcode, pour iOS :

```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

Les binaires natifs `APK` et `IPA` ne sont pas fournis ; compilation, signature et tests sur appareils physiques restent nécessaires avant publication.

Consultez [`README_FR.md`](README_FR.md) pour la liste des galaxies, les règles du jeu et les notes de compatibilité.

## Données personnelles

La progression est stockée localement dans le navigateur (`localStorage`). Le jeu ne contient pas de publicité ni de collecte de données intégrée.

## Droits

Aucune licence open source n'est fournie : les droits sont réservés au titulaire du projet.