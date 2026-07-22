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
  "image": "/assets/images/fr/words/chaton.png",
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

Les dialogues, mots et syllabes sont pre-generes avec ElevenLabs puis heberges comme assets statiques. Le navigateur ne contacte jamais ElevenLabs : la cle API reste uniquement dans `.env.local` et ne doit pas etre exposee dans le code client.

#### Configuration

Le fichier `.env.local` doit contenir :

```dotenv
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
ELEVENLABS_MODEL_ID=eleven_v3
ELEVENLABS_LANGUAGE_CODE=fr
```

`ELEVENLABS_API_KEY` et `ELEVENLABS_VOICE_ID` sont obligatoires. Le modele et la langue sont optionnels dans le fichier : le script utilise respectivement `eleven_v3` et `fr` par defaut.

Le modele `eleven_multilingual_v2` ne doit pas etre utilise ici car son API ignore `language_code`, ce qui rend les syllabes tres courtes ambigues. La voix configuree et sa compatibilite avec le modele peuvent etre controlees sans generer de fichier :

```bash
npm run audio:generate -- --check-voice
```

#### Sources de contenu

Le script `scripts/generate-voices.mjs` construit la liste des clips a partir de trois fichiers :

- `src/content/fr/voice-lines.json` pour les dialogues et retours de Pana ;
- `src/content/fr/words.json` pour les mots complets et leurs syllabes contextuelles ;
- `src/content/fr/syllables.json` pour les prononciations generiques partagees.

Pour un mot, `displayWord` est le texte envoye a ElevenLabs pour le clip complet. `spokenSyllables` contient les textes de generation des syllabes dans le meme ordre que `syllables`. Dans `syllables.json`, `text` est la graphie affichee et `speechText` est la graphie envoyee au moteur vocal.

Les graphies de generation peuvent donc differer du texte affiche. Par exemple, `tôt` produit le son francais de `to` et `teau`, `faux` celui de `pho`, et `leille` celui de `leil`. La ponctuation fait partie du texte de generation : `mi!` et `mi.` peuvent produire des resultats differents.

Une syllabe generique utilise le chemin defini par `syllables.json`. Une variante propre a un mot utilise `audioSyllables` avec un chemin distinct, par exemple `words/maison/son.mp3`. Deux prononciations differentes ne doivent jamais viser le meme chemin : le script detecte ce conflit et interrompt la generation.

#### Commandes de generation

La commande normale genere uniquement les fichiers absents et conserve les clips existants :

```bash
npm run audio:generate
```

Pour regenerer tous les clips apres un changement de voix, de modele ou de reglages :

```bash
npm run audio:generate -- --force
```

Pour regenerer un seul clip, utiliser son chemin public exact. `--force` est necessaire si le fichier existe deja :

```bash
npm run audio:generate -- --force --only=/assets/audio/fr/syllables/mi.mp3
npm run audio:generate -- --force --only=/assets/audio/fr/words/domino.mp3
```

Le filtre `--only` accepte aussi un identifiant interne affiche par le script, mais le chemin public est preferable car il reste non ambigu pour les syllabes mutualisees.

#### Parametres de sortie

Les appels utilisent :

- le format `mp3_44100_128` ;
- une seed fixe `41807` pour limiter les variations ;
- des reglages distincts pour les dialogues, les syllabes et les mots ;
- une vitesse plus lente pour les syllabes (`0.82`) que pour les mots (`0.88`) et les dialogues (`0.94`) ;
- jusqu'a trois nouvelles tentatives pour les erreurs temporaires `429` et `5xx`.

Les fichiers sont ecrits sous `public/assets/audio` en suivant les chemins declares dans les fichiers de contenu. Le navigateur utilise `speechSynthesis` uniquement comme solution de repli lorsqu'un fichier ne peut pas etre lu.

#### Cache navigateur

Les noms des assets audio restent stables. Lorsqu'un son deja publie est remplace, la constante `VOICE_ASSET_VERSION` de `src/components/games/useVoiceAudio.ts` peut etre incrementee avant le deploiement. Elle ajoute un parametre de version a l'URL et force les navigateurs a telecharger la nouvelle copie. Il n'est pas necessaire de la modifier entre chaque essai local si le cache du navigateur est deja desactive ou vide.

### Bruitages du jeu Bateau

Les bruitages sont heberges localement pour garantir leur lecture sur GitHub Pages. Ils proviennent de Pixabay et sont utilises selon la Pixabay Content License.

| Usage | Fichier local | Source |
| --- | --- | --- |
| Ambiance de la mer | `public/assets/audio/sfx/sea-loop.mp3` | [Sea Wave](https://pixabay.com/sound-effects/nature-sea-wave-34088/) |
| Vent pendant le voyage | `public/assets/audio/sfx/wind-loop.mp3` | [Wind Blowing SFX 01](https://pixabay.com/sound-effects/nature-wind-blowing-sfx-01-423673/) |
| Mouvement du bateau | `public/assets/audio/sfx/boat-loop.mp3` | [Boat Squeaking](https://pixabay.com/sound-effects/film-special-effects-boat-squeaking-44883/) |
| Selection d'une syllabe | `public/assets/audio/sfx/syllable-select.mp3` | [UI Pop sound](https://pixabay.com/sound-effects/film-special-effects-ui-pop-sound-316482/) |
| Placement d'une syllabe | `public/assets/audio/sfx/syllable-drop.mp3` | [app_interface_click_2](https://pixabay.com/sound-effects/app-interface-click-2-476372/) |
| Collecte d'un coffre | `public/assets/audio/sfx/chest-collect.mp3` | [Opening Bell](https://pixabay.com/sound-effects/film-special-effects-opening-bell-421471/) |
| Niveau termine | `public/assets/audio/sfx/level-complete.mp3` | [Short Success Sound Glockenspiel Treasure Video Game](https://pixabay.com/sound-effects/film-special-effects-short-success-sound-glockenspiel-treasure-video-game-6346/) |

L'ambiance de la mer ne demarre qu'apres l'action `Commencer`, conformement aux restrictions de lecture automatique des navigateurs. Le vent et le bateau sont synchronises avec le mouvement du voyage. Pendant la collecte d'un coffre, le bateau s'arrete mais le vent reste audible en arriere-plan a un volume reduit.

## Images

Arborescence cible :

```txt
public/assets/images/
  fr/
    words/
      chaton.png
      bateau.png
      moto.png
      lapin.png
      melon.png
      tapis.png
      panda.png
      maison.png
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
```

Ces assets sont charges automatiquement par l'interface Bateau si tu les ajoutes. Tant que Pana ou le bateau sont absents, le jeu garde un fallback CSS temporaire.

Chaque mot référence désormais son propre fichier transparent via le champ `image` de `src/content/fr/words.json`. Le composant `BateauGame` charge directement ce chemin ; ajouter un mot ne nécessite donc plus de modifier un atlas ou un mapping dans le composant.

La recette `readingo-pana-v1` et le pipeline de detourage sont documentes dans [Generation des assets images](./image-generation.md). Les prompts et inputs exacts de chaque asset sont conserves dans [l'historique YAML](./image-generation-history.yaml).

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
