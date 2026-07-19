# Contenu, Assets et Internationalisation

## Principe General

Le contenu doit etre structure comme une base pedagogique reutilisable. Les mini-jeux consomment ces donnees, mais ne les definissent pas directement.

Chaque item doit relier :

- un objectif pedagogique ;
- un mot ou son ;
- des syllabes ;
- une image ;
- des fichiers audio ;
- un niveau de difficulte ;
- des tags.

## Donnees de Mot

Modele cible :

```ts
type WordChallenge = {
  id: string;
  locale: string;
  word: string;
  displayWord: string;
  syllables: string[];
  distractors: string[];
  image: string;
  audioWord: string;
  audioSyllables: Record<string, string>;
  difficulty: number;
  tags: string[];
};
```

Exemple :

```json
{
  "id": "chaton",
  "locale": "fr-FR",
  "word": "chaton",
  "displayWord": "chaton",
  "syllables": ["cha", "ton"],
  "distractors": ["ba", "ti", "ma"],
  "image": "/assets/images/fr/words/chaton.webp",
  "audioWord": "/assets/audio/fr/words/chaton.mp3",
  "audioSyllables": {
    "cha": "/assets/audio/fr/syllables/cha.mp3",
    "ton": "/assets/audio/fr/syllables/ton.mp3"
  },
  "difficulty": 2,
  "tags": ["animal", "mot-bisyllabique", "son-ch"]
}
```

## Validation Pedagogique

Le contenu doit etre valide avant integration :

- mot courant et connu des enfants ;
- image non ambigue ;
- decoupage syllabique adapte a l'objectif ;
- distracteurs plausibles mais pas trop piegeux ;
- son audio clair ;
- pas de mot a double sens problematique ;
- pas de graphie inutilement complexe au debut.

Exemples de mots adaptés au demarrage :

- moto
- lama
- papa
- tapis
- tomate
- bateau
- ballon
- chaton
- maison
- melon

Exemples a eviter au tout debut :

- mots avec lettres muettes difficiles ;
- mots avec graphies rares ;
- mots visuellement ambigus ;
- mots dont l'image peut etre interpretee de plusieurs facons.

## Audio

Arborescence cible :

```txt
public/assets/audio/
  fr/
    letters/
      a.mp3
      b.mp3
    syllables/
      cha.mp3
      ton.mp3
    words/
      chaton.mp3
    ui/
      correct-01.mp3
      wrong-soft-01.mp3
      victory-01.mp3
```

Regles :

- fichiers courts ;
- volume normalise ;
- nommage stable ;
- voix claire ;
- articulation lente mais naturelle ;
- pas de musique de fond dans le MVP.

## Images

Arborescence cible :

```txt
public/assets/images/
  fr/
    words/
      chaton.webp
      bateau.webp
    characters/
    ui/
```

Regles :

- format web optimise ;
- ratio coherent ;
- poids reduit ;
- sujet centre ;
- pas de texte ;
- validation humaine obligatoire.

## Internationalisation

Le produit doit etre pense multilingue des le debut, meme si seule la langue francaise est implementee au MVP.

Principes :

- utiliser des dossiers par locale ;
- ne jamais coder les textes de jeu en dur ;
- separer les contenus pedagogiques par langue ;
- separer les assets audio par langue ;
- ne pas supposer que les syllabes fonctionnent pareil dans toutes les langues.

Structure cible :

```txt
src/content/
  fr/
    words.json
    lessons.json
  en/
    words.json
    lessons.json
public/assets/audio/
  fr/
  en/
public/assets/images/
  shared/
  fr/
  en/
```

Les images peuvent parfois etre mutualisees entre langues, mais il faut rester prudent : certains mots ou objets ne se traduisent pas de facon pedagogiquement equivalente.

## SEO

Les pages SEO doivent etre construites autour des intentions de recherche des parents :

- apprendre a lire a 5 ans ;
- apprendre a lire a 6 ans ;
- jeux de lecture CP ;
- jeux de lecture grande section ;
- apprendre les syllabes ;
- apprendre les lettres ;
- exercices de lecture gratuits ;
- jeux educatifs lecture gratuits.

Types de pages :

- pages piliers ;
- pages par competence ;
- pages par age ;
- pages par mini-jeu ;
- articles conseils.

Les jeux doivent etre integres dans les pages SEO quand cela sert l'intention utilisateur. Le contenu editorial ne doit pas etre artificiel : il doit expliquer ce que l'activite travaille et comment l'utiliser avec l'enfant.

## Mise en Avant d'Autres Produits

La promotion doit etre discrete et compatible avec une experience enfant.

Emplacements acceptables :

- fin de session ;
- footer ;
- pages conseils ;
- encart bas de page sur les pages SEO ;
- page ressources.

Emplacements a eviter :

- pendant une partie ;
- entre deux mots ;
- pop-up bloquante ;
- elements qui ressemblent a une recompense enfant.

