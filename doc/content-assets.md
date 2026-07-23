# Contenu pédagogique et assets

## Rôle du document

Ce document décrit le modèle de contenu commun aux jeux Readingo et la relation entre données pédagogiques, images et sons.

Procédures associées :

- [pipeline audio](./audio-generation.md) ;
- [pipeline image](./image-generation.md) ;
- [socle de game design](./game-design-system.md).

Les règles propres à un jeu, comme le nombre de mots ou de distracteurs par niveau, restent dans son GDD. Voir les documents de [Bateau](./games/bateau.md) et de [Lettres](./games/lettres.md).

## Principe général

Les jeux consomment une base pédagogique. Ils ne définissent pas leurs mots, syllabes ou chemins d’assets dans les composants React.

```text
Fichiers de contenu
  → validation automatique
  → chargement par le jeu
  → rendu de l’exercice
```

Cette séparation permet :

- de réutiliser un mot dans plusieurs mécaniques ;
- de faire évoluer un niveau sans modifier l’interface ;
- de valider les assets avant le build ;
- de localiser les contenus ;
- de mutualiser les syllabes et les prononciations.

## Organisation actuelle

```text
src/content/
  fr/
    lessons.json
    letter-lessons.json
    letters.json
    syllables.json
    voice-lines.json
    words.json

public/assets/
  audio/
    fr/
    sfx/
  characters/
  images/
    fr/
      words/
  world/
```

### `words.json`

Contient la donnée pédagogique et les assets d’un mot :

```ts
type WordChallenge = {
  id: string;
  locale: string;
  word: string;
  displayWord: string;
  syllables: string[];
  spokenSyllables: string[];
  distractors: string[];
  image: string;
  audioWord: string;
  audioSyllables: Record<string, string>;
  difficulty: number;
  tags: string[];
};
```

Rôle des champs :

| Champ | Usage |
| --- | --- |
| `id` | identifiant stable, sans accent ni espace |
| `locale` | langue et variante du contenu |
| `word` | forme linguistique du mot |
| `displayWord` | texte affiché ou prononcé comme mot complet |
| `syllables` | unités affichées dans l’ordre attendu |
| `spokenSyllables` | textes utilisés pour générer les prononciations contextuelles |
| `distractors` | unités incorrectes proposées avec la réponse |
| `image` | chemin public de l’illustration |
| `audioWord` | chemin public du mot complet |
| `audioSyllables` | éventuelles variantes audio propres au mot |
| `difficulty` | classement pédagogique transversal |
| `tags` | recherche, regroupement et futurs jeux |

`audioSyllables` peut être vide lorsque toutes les syllabes utilisent les clips mutualisés.

### `syllables.json`

Contient le référentiel mutualisé :

```ts
type Syllable = {
  id: string;
  text: string;
  speechText: string;
  locale: string;
  audio: string;
};
```

`text` correspond à la graphie de jeu. `speechText` correspond au texte envoyé au moteur vocal. Ils peuvent différer.

### `lessons.json`

Décrit les regroupements de contenu :

```ts
type Lesson = {
  id: string;
  level: number;
  title: string;
  difficultyTier: number;
  gameIds: string[];
  wordIds: string[];
};
```

`gameIds` indique les mécaniques compatibles. Les contraintes de quantité et de difficulté sont définies par le GDD et vérifiées par le validateur.

### `voice-lines.json`

Contient les dialogues et feedbacks localisés. Une entrée possède un texte et un chemin audio. Les composants utilisent un identifiant fonctionnel tel que `tryAgain`, pas une phrase écrite en dur.

### `letters.json` et `letter-lessons.json`

`letters.json` associe le nom, les graphies, le son travaillé, le mot-indice et les clips d’une lettre. `letter-lessons.json` ordonne les questions et définit les choix proposés.

Le mot-indice référence `words.json` : son illustration et son audio ne sont pas dupliqués. Les contraintes du premier niveau sont détaillées dans le [GDD de Lettres](./games/lettres.md).

## Validation pédagogique

Avant intégration, vérifier :

- mot courant et adapté à l’âge ;
- image non ambiguë ;
- découpage cohérent avec l’objectif ;
- distracteurs plausibles mais non ambigus ;
- nombre de choix compatible avec le niveau ;
- prononciation naturelle ;
- graphie suffisamment simple pour l’étape ;
- absence de double sens problématique.

La difficulté doit être décrite par la compétence réellement travaillée, pas seulement par la longueur du mot.

## Validation automatique

La commande commune est :

```bash
npm run content:check
```

Le validateur actuel contrôle notamment :

- identifiants uniques ;
- appartenance de chaque mot à un niveau ;
- références de mots valides ;
- quantité de contenu attendue ;
- nombre de syllabes et de distracteurs ;
- présence des prononciations ;
- chemins publics valides ;
- existence et taille non nulle des assets ;
- limite du nombre de tuiles.

Lorsqu’un nouveau jeu possède d’autres contraintes, le validateur doit être étendu de manière explicite, idéalement par règle liée à `gameIds`.

## Images

### Illustrations pédagogiques

Les illustrations de mots sont actuellement des PNG carrés transparents :

```text
public/assets/images/<locale>/words/<id>.png
```

Chaque mot référence directement son fichier avec `image`. Aucun atlas ou mapping dans le composant n’est nécessaire.

### Personnages et monde

- `public/assets/characters/` contient les personnages partagés ;
- `public/assets/world/` contient les objets et décors réutilisables ;
- un futur jeu peut ajouter un sous-ensemble thématique lorsque le volume le justifie.

Un asset n’est partagé que si sa représentation et sa signification restent cohérentes entre les jeux.

La production, le détourage, les formats et l’historique sont définis dans le [pipeline image](./image-generation.md).

## Audio

Les contenus linguistiques sont localisés :

```text
public/assets/audio/<locale>/
  dialogue/
  feedback/
  syllables/
  words/
```

Les effets indépendants de la langue se trouvent dans `public/assets/audio/sfx/`.

Les textes de génération, commandes, variantes contextuelles et règles de cache sont définis dans le [pipeline audio](./audio-generation.md).

## Internationalisation

Le modèle doit permettre plusieurs langues même si le français est actuellement la locale de production.

Principes :

- un dossier de contenu par locale ;
- aucun texte pédagogique écrit dans un composant ;
- voix séparées par locale ;
- images mutualisées uniquement si elles gardent le même sens pédagogique ;
- aucun découpage syllabique supposé universel ;
- niveaux et distracteurs réévalués pour chaque langue ;
- feedbacks localisés dans les données.

Structure cible :

```text
src/content/
  fr/
  en/
public/assets/
  audio/
    fr/
    en/
  images/
    shared/
    fr/
    en/
```

Traduire un mot ne suffit pas : son image, son découpage, sa difficulté et ses distracteurs doivent former un nouvel item pédagogique cohérent.

## Ajouter un mot

1. Ajouter son entrée dans `words.json`.
2. Ajouter toute nouvelle syllabe mutualisée dans `syllables.json`.
3. Référencer le mot dans une leçon compatible.
4. Produire l’image avec le pipeline commun ou la variante documentée du jeu.
5. Produire le mot et les syllabes avec le pipeline audio.
6. Déclarer tous les chemins dans les données.
7. Lancer `npm run content:check`.
8. Lancer le jeu concerné dans son mode de test.

## Ajouter un nouveau jeu

1. Définir dans son GDD les compétences et contraintes de contenu.
2. Réutiliser les champs communs lorsque leur sens est identique.
3. Ajouter un nouveau fichier de données seulement si la mécanique exige une structure différente.
4. Référencer le jeu dans `gameIds`.
5. Étendre la validation automatique.
6. Documenter les variations d’images ou de sons dans les pipelines communs.

Un nouveau jeu ne doit pas dupliquer `words.json` uniquement pour changer son thème visuel.
