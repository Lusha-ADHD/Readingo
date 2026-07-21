# Choix Techniques

## Stack Retenu

Le stack technique cible est :

- Astro pour le site statique, les pages SEO et la structure globale.
- React pour les mini-jeux interactifs.
- TypeScript pour fiabiliser la logique de jeu et les donnees de contenu.
- Motion pour les animations d'interface et les micro-interactions.
- Howler.js pour la gestion audio.
- CSS Modules et variables CSS pour le design system.
- LocalStorage pour la progression locale dans le MVP.
- GitHub Pages pour l'hebergement initial.
- GitHub Actions pour le build et le deploiement.

## Pourquoi Astro

Astro est adapte parce que Readingo doit combiner deux natures de pages :

- des pages editoriales tres rapides et indexables ;
- des zones de jeu interactives avec du JavaScript cote client.

Astro genere du HTML statique par defaut, ce qui aide le referencement, la performance mobile et la simplicite d'hebergement. Les mini-jeux peuvent etre ajoutes comme ilots interactifs React uniquement sur les pages qui en ont besoin.

Exemple cible :

```astro
---
import BateauGame from "../components/games/BateauGame.tsx";
---

<main>
  <BateauGame client:load />
</main>
```

## Pourquoi React

React est adapte pour gerer :

- l'etat du jeu : mot courant, syllabes disponibles, score, erreurs, temps ;
- les interactions tactiles et souris ;
- les transitions entre etats ;
- la composition de composants reutilisables ;
- l'integration de bibliotheques specialisees comme Motion, Howler.js, PixiJS ou Rive.

React n'est pas limitant pour ce projet. Les mini-jeux vises sont principalement des experiences 2D d'interface : selection au toucher, placement automatique, feedback, audio, progression. Pour des scenes plus proches d'un moteur de jeu 2D, PixiJS pourra etre ajoute ponctuellement sans remettre en cause l'architecture.

## Animation

Motion doit etre utilise pour :

- apparition des cartes ;
- rebond lors d'une bonne reponse ;
- tremblement doux lors d'une erreur ;
- transitions entre mots ;
- feedback de score ;
- moments de celebration courts.

Les animations doivent rester courtes et lisibles. Elles servent la comprehension, pas la decoration gratuite.

## Audio

Howler.js doit etre utilise pour :

- precharger les sons utiles a la session ;
- jouer les sons de syllabes, mots et feedbacks ;
- eviter les lectures superposees ;
- gerer proprement les differences entre navigateurs mobiles.

Le Web Speech API peut servir au prototypage rapide, mais la version produit doit utiliser des clips audio pre-generes pour garantir une voix stable, claire et qualitative.

## Persistance Locale

Le MVP ne necessite pas de compte utilisateur. La progression peut etre stockee dans LocalStorage :

- dernier jeu joue ;
- niveau courant ;
- score total ;
- badges debloques ;
- mots deja reussis ;
- preference audio active/desactivee.

La progression doit etre consideree comme non critique : elle peut etre perdue si le navigateur est nettoye.

## Deploiement

GitHub Pages est suffisant pour le MVP :

- site statique ;
- pas de backend ;
- pas de base de donnees ;
- pas d'authentification ;
- cout d'hebergement nul ;
- integration simple avec GitHub Actions.

Limite a anticiper : les assets audio et image peuvent grossir vite. Si le trafic ou le volume d'assets augmente, il faudra envisager un CDN externe.

## Structure Cible

```txt
src/
  components/
    games/
      BateauGame.tsx
      LetterPopGame.tsx
      SyllableTrainGame.tsx
    ui/
      Button.tsx
      ProgressBar.tsx
      AudioButton.tsx
      RewardBurst.tsx
  content/
    fr/
      words.json
      syllables.json
      lessons.json
      games.json
  layouts/
    BaseLayout.astro
  pages/
    index.astro
    jeux/
      bateau.astro
      lettres.astro
      syllabes.astro
    apprendre-a-lire.astro
    apprendre-les-lettres.astro
    apprendre-les-syllabes.astro
public/
  assets/
    audio/
      fr/
    images/
      fr/
```

## Donnees de Jeu

Les jeux doivent etre pilotes par des donnees, pas par du contenu code en dur.

Exemple :

```ts
export type WordChallenge = {
  id: string;
  locale: "fr-FR";
  word: string;
  syllables: string[];
  distractors: string[];
  image: string;
  audioWord: string;
  audioSyllables: Record<string, string>;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
};
```

Cette approche facilite :

- l'ajout de nouveaux mots ;
- la validation pedagogique ;
- l'internationalisation ;
- la generation d'assets ;
- la reutilisation d'un meme contenu dans plusieurs mini-jeux.
