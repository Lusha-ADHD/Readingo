# Choix techniques

## Rôle du document

Ce document décrit l’architecture actuellement utilisée. Les bibliothèques envisagées mais non installées doivent être présentées comme des options, jamais comme des dépendances du produit.

## Stack actuelle

- Astro pour les pages statiques, le routage et l’intégration globale.
- React pour les jeux interactifs.
- TypeScript pour la logique, les composants et les tests.
- CSS global ou propre aux composants pour les scènes et animations.
- Canvas lorsque le décor animé le justifie.
- API `Audio` du navigateur pour les clips et boucles.
- `speechSynthesis` comme repli des voix préenregistrées.
- `localStorage` pour la progression locale.
- JSON sous `src/content/<locale>/` pour le contenu pédagogique.
- Scripts Node.js pour la validation et la génération des voix.
- GitHub Pages et GitHub Actions pour l’hébergement et le déploiement.

Motion, Howler.js, PixiJS ou Rive peuvent être évalués si une future mécanique le nécessite. Ils ne font pas partie de la stack actuelle.

## Astro

Readingo combine :

- des pages éditoriales statiques et indexables ;
- des jeux riches exécutés dans le navigateur.

Astro produit le HTML des pages et hydrate uniquement les îlots React qui en ont besoin.

```astro
---
import { GAME_BY_ID, GAME_IDS } from "../content/gameCatalog";
import GamePageLayout from "../layouts/GamePageLayout.astro";
import { BateauGame } from "../components/games/BateauGame";

const game = GAME_BY_ID[GAME_IDS.BATEAU];
---

<GamePageLayout game={game}>
  <BateauGame client:load />
</GamePageLayout>
```

Cette séparation limite le JavaScript des pages éditoriales tout en laissant les jeux gérer leur état local.

`GamePageLayout.astro` possède le cadre, l’en-tête éditorial et les règles mobiles
communes. Une page de jeu ne redéfinit pas ces styles.

## React

React gère :

- les phases d’un jeu ;
- la sélection du niveau ;
- les exercices et réponses ;
- les transitions fonctionnelles ;
- la carte et les panneaux ;
- l’intégration audio ;
- la progression en mémoire avant sauvegarde.

Un jeu complexe peut être divisé en composants de scène, de carte et de contrôles. Les données pédagogiques restent en dehors de ces composants.

Les introductions utilisent `GameIntroOverlay` et `GameDialogueOverlay`. Ces
composants possèdent Pana, la bulle de dialogue et les actions « Commencer » et
« Passer » ; le décor demeure la responsabilité du jeu.

## Animation

Les animations actuelles sont réalisées en CSS, SVG et Canvas selon leur nature :

- CSS pour les transitions de panneaux et contrôles ;
- SVG pour les chemins et tracés ;
- Canvas pour un fond animé contenant de nombreux éléments ;
- coordonnées partagées pour synchroniser un objet et son trajet.

Une bibliothèque d’animation n’est justifiée que si elle réduit réellement la complexité d’une nouvelle mécanique. Le support de `prefers-reduced-motion` reste obligatoire quelle que soit la technique.

## Audio

Les clips sont servis comme fichiers statiques et lus avec l’API `Audio`.

Responsabilités du lecteur commun :

- interrompre les voix qui ne doivent pas se superposer ;
- gérer les boucles ;
- régler les volumes relatifs ;
- arrêter les sons lors d’un changement de phase ;
- utiliser la synthèse du navigateur en repli ;
- tolérer une erreur de chargement.

Le pipeline de fabrication est décrit dans [Pipeline audio](./audio-generation.md).

## Persistance locale

Chaque jeu utilise une clé versionnée. La sauvegarde doit être :

- validée à la lecture ;
- migrable ;
- non bloquante ;
- écrite à la fin de l’unité prévue ;
- séparée du mode de test.

La progression est non critique et peut disparaître lorsque les données du navigateur sont effacées. Le GDD de chaque jeu documente son schéma exact.

## Contenu piloté par les données

Les fichiers de `src/content/<locale>/` sont chargés par les pages ou composants et transmis au jeu.

`src/content/fr/games.json` est le catalogue localisé des jeux. Il contient la
route, les titres, les textes de carte et de page, le thème et les clés de
progression. `src/content/gameCatalog.ts` fournit la couche typée utilisée par
l’accueil, l’onboarding, les pages de jeu et les modules de sauvegarde.

Avantages :

- ajout de contenu sans modifier la mécanique ;
- validation automatique ;
- génération d’assets depuis les mêmes sources ;
- internationalisation ;
- réutilisation entre jeux.

Voir [Contenu pédagogique et assets](./content-assets.md).

## Structure actuelle utile

```text
src/
  components/
    games/
    ui/
  content/
    fr/
  layouts/
  pages/
    jeux/
  styles/
scripts/
tests/
public/
  assets/
    audio/
    characters/
    images/
    world/
doc/
  games/
```

La structure peut évoluer, mais un nouveau jeu doit conserver la séparation entre :

- contenu ;
- logique ;
- présentation ;
- assets ;
- documentation de game design.

## Validation et build

Commandes principales :

```bash
npm run content:check
npm test
npm run build
```

`npm run build` exécute la validation du contenu, la vérification Astro et la production statique.

Les tests unitaires actuels couvrent notamment la progression et la migration de Bateau. Chaque nouveau jeu doit tester au minimum sa progression sauvegardée et ses règles de déblocage.

## Déploiement

GitHub Pages convient tant que Readingo reste :

- statique ;
- sans compte ;
- sans base de données ;
- sans backend de jeu.

Les chemins publics d’assets doivent fonctionner avec le préfixe de déploiement configuré par le projet. Le volume d’images et d’audio devra être surveillé ; un CDN pourra être ajouté sans modifier le modèle de contenu si les URL restent pilotées par les données.
