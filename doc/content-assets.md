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

### Voix ElevenLabs

Les dialogues, mots et syllabes sont pre-generes avec ElevenLabs puis heberges comme assets statiques. La cle API reste uniquement dans `.env.local` et ne doit jamais etre exposee dans le code client.

La generation francaise utilise `ELEVENLABS_LANGUAGE_CODE=fr` avec `eleven_v3`. Le modele `eleven_multilingual_v2` ne doit pas etre utilise ici car son API ignore `language_code`, ce qui rend les syllabes tres courtes ambigues. Les graphies de generation peuvent differer du texte affiche, par exemple `tôt` pour garantir le son francais de `to` et `teau`.

La generation se lance avec :

```bash
npm run audio:generate
```

Le script `scripts/generate-voices.mjs` lit `words.json`, `syllables.json` et `voice-lines.json`. Il conserve les clips existants par defaut. Pour regenerer tous les fichiers apres un changement de voix ou de reglages :

```bash
npm run audio:generate -- --force
```

Les variantes contextuelles utilisent un chemin propre au mot, par exemple `words/maison/son.mp3`, tandis que les distracteurs emploient la prononciation generique de la syllabe. Le navigateur utilise `speechSynthesis` uniquement comme solution de repli lorsqu'un MP3 ne peut pas etre lu.

### Bruitages du jeu Bateau

Les bruitages sont heberges localement pour garantir leur lecture sur GitHub Pages. Ils proviennent de Pixabay et sont utilises selon la Pixabay Content License.

| Usage | Fichier local | Source |
| --- | --- | --- |
| Ambiance de la mer | `public/assets/audio/sfx/sea-loop.mp3` | [Sea Wave](https://pixabay.com/sound-effects/nature-sea-wave-34088/) |
| Vent pendant le voyage | `public/assets/audio/sfx/wind-loop.mp3` | [Wind Blowing SFX 01](https://pixabay.com/sound-effects/nature-wind-blowing-sfx-01-423673/) |
| Mouvement du bateau | `public/assets/audio/sfx/boat-loop.mp3` | [Boat Squeaking](https://pixabay.com/sound-effects/film-special-effects-boat-squeaking-44883/) |
| Selection d'une syllabe | `public/assets/audio/sfx/syllable-select.mp3` | [UI Pop sound](https://pixabay.com/sound-effects/film-special-effects-ui-pop-sound-316482/) |
| Depot d'une syllabe | `public/assets/audio/sfx/syllable-drop.mp3` | [app_interface_click_2](https://pixabay.com/sound-effects/app-interface-click-2-476372/) |
| Collecte d'un coffre | `public/assets/audio/sfx/chest-collect.mp3` | [Opening Bell](https://pixabay.com/sound-effects/film-special-effects-opening-bell-421471/) |
| Niveau termine | `public/assets/audio/sfx/level-complete.mp3` | [Short Success Sound Glockenspiel Treasure Video Game](https://pixabay.com/sound-effects/film-special-effects-short-success-sound-glockenspiel-treasure-video-game-6346/) |

L'ambiance de la mer ne demarre qu'apres l'action `Commencer`, conformement aux restrictions de lecture automatique des navigateurs. Le vent et le bateau sont synchronises avec le mouvement du voyage. Pendant la collecte d'un coffre, le bateau s'arrete mais le vent reste audible en arriere-plan a un volume reduit.

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

Assets partages deja reserves pour le jeu Bateau :

```txt
public/assets/
  characters/
    pana.png
  world/
    boat.png
    IslandWithChest.png
    IslandWithoutChest.png
    Chest.png
  words/
    WordAtlas.png
```

Ces assets sont charges automatiquement par l'interface Bateau si tu les ajoutes. Tant que Pana ou le bateau sont absents, le jeu garde un fallback CSS temporaire.

Pour les images de mots du prototype, `WordAtlas.png` est utilise comme atlas 4 colonnes x 3 lignes. Les deux premieres lignes contiennent les mots du jeu Bateau :

- ligne 1 : bateau, moto, lapin, panda ;
- ligne 2 : maison, melon, tapis, chaton.

Le composant `BateauGame` mappe explicitement chaque `id` de mot vers sa cellule d'atlas. Pour ajouter un mot, il faut soit ajouter l'image dans l'atlas et completer ce mapping, soit passer a des fichiers separes quand le volume d'assets augmente.

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
