# COSMO CITROUILLE — L'AVENTURE DES 140 MONDES 🎃🚀

**Version 3.0 — 140 mondes jouables, 14 galaxies, 14 boss, deux modes de difficulté.** Jeu spatial d'Halloween en français, pensé pour être joyeux et accessible aux enfants (à partir d'environ 7 ans). Sans publicité, sans achat intégré, sans collecte de données.

## Les 14 galaxies (10 mondes chacune)

| Mondes | Galaxie | Boss du 10e monde |
|---|---|---|
| 1–10 | Jardins stellaires | Roi Guimauve |
| 11–20 | Océan des sucettes | Méduse Caramelle |
| 21–30 | Bal des fantômes | Duchesse Bouh |
| 31–40 | Forêt des citrouilles | Citrouille Géante |
| 41–50 | Nébuleuse sucrée | Capitaine Réglisse |
| 51–60 | Château des chauves-souris | Comte Biscuit |
| 61–70 | Arc-en-ciel cométaire | Licorne Comète |
| 71–80 | Labyrinthe lunaire | Minotaure Mousse |
| 81–90 | Brume des sorcières | Sorcière Praline |
| 91–100 | Volcans chocolat | Dragon Cacao |
| 101–110 | Glaciers fantômes | Yéti Chantilly |
| 111–120 | Temple des étoiles | Sphinx Bonbon |
| 121–130 | Carnaval cosmique | Clown Cosmique |
| 131–140 | Palais des mille lunes | Impératrice Guimauve |

Chacune des neuf missions ordinaires d'une galaxie possède un intitulé et une configuration de difficulté distincts. Le 10e monde est un combat de boss : attraper des étoiles magiques pour déclencher des tirs automatiques, esquiver les projectiles et les vagues d'ennemis. Les boss ont des noms, des insignes et des couleurs adaptés à chaque galaxie, mais partagent une base graphique commune.

## Jouer

1. Ouvrir `JOUER_IMMEDIATEMENT.html` dans un navigateur capable d'ouvrir des fichiers HTML locaux. La version HTML autonome est également fournie séparément sous le nom `Cosmo_Citrouille_140_Mondes_JOUER.html`.
2. Choisir une galaxie avec les flèches gauche et droite ; faire défiler la carte pour voir ses dix mondes.
3. Sélectionner **Aventure** (4 cœurs au départ) ou **Défi** (3 cœurs, davantage d'obstacles, plus rapides et moins de temps). Les deux modes partagent le même déblocage de mondes.
4. Glisser un doigt pour diriger le vaisseau-citrouille. Attraper des bonbons et des étoiles. Éviter les météores ; ramasser les cœurs et boucliers.
5. Réussir une mission déverrouille le monde suivant. Les boss se trouvent aux mondes 10, 20, 30, …, 140. Après un boss (hors dernier), la galaxie suivante se débloque.

Les mondes sont de plus en plus exigeants : pluie de météores, trajectoires zigzagantes, ennemis qui suivent le vaisseau et attaques en vagues. Les décors, les couleurs, le rythme et les boss changent selon les galaxies. Le jeu propose des animations originales dessinées en Canvas HTML5, effets audio générés en local, commandes tactiles et clavier, pause automatique lors du passage en arrière-plan.

## Fonctionnement mobile

- `JOUER_IMMEDIATEMENT.html` : autonome et hors ligne. Certains iPhone/Android n'autorisent pas le JavaScript lorsqu'un fichier HTML est ouvert depuis l'aperçu des fichiers. Si l'ouverture locale ne fonctionne pas, passer par un hébergement HTTPS, ou compiler le projet mobile.
- Dossier `www/` : version web installable comme PWA après publication sur un serveur HTTPS. Sur iPhone Safari « Sur l'écran d'accueil », sur Android Chrome « Installer l'application ». Service worker avec cache pour le hors ligne après premier chargement.
- Projet Capacitor : installer Node.js, puis `npm install`. Pour Android : `npx cap add android && npx cap open android` (Android Studio requis). Pour iOS sur macOS : `npx cap add ios && npx cap open ios` (Xcode requis). Après modification du code : `npm run sync`.
- Les fichiers **APK et IPA ne sont pas inclus**. La compilation native, les certificats, les tests sur appareils physiques et la publication sur les magasins restent à effectuer.

## Sauvegarde et confidentialité

Les niveaux débloqués, le mode de difficulté, la victoire finale, le meilleur score et le choix du son sont enregistrés uniquement dans `localStorage` sur l'appareil. Aucun compte, traceur, publicité, permission ni connexion requise pendant une session hors ligne. Effacer les données du site efface la progression.

## Tests

`tests/test_140_worlds.py` et `tests/test_mobile_interactions.py` vérifient les interactions sous Chromium sur plusieurs formats, le choix des galaxies, la difficulté, la progression, la pause, les collisions, les combats contre les boss, la victoire finale et l'absence d'erreurs JavaScript. Les tests automatisés sont utiles, mais **ne garantissent pas** un fonctionnement parfait sur tous les iPhone et Android. Tester sur appareils réels avant diffusion publique.
## Objectif chronométré (version 800 points)

Sur chacun des 140 mondes, il faut atteindre 800 points avant la fin des deux minutes. Chaque nouveau niveau recommence avec zéro point. Les 14 boss exigent également que leur jauge de vie soit réduite à zéro. En mode Défi, les obstacles sont plus rapides et plus nombreux, mais le temps limite reste de 120 secondes.
