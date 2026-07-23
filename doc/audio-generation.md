# Pipeline audio Readingo

## Rôle du document

Ce document décrit le pipeline commun de production et d’intégration des voix, ambiances et bruitages Readingo. Les décisions de gameplay restent dans le [socle commun](./game-design-system.md) et dans le GDD de chaque jeu.

Un jeu peut varier l’intention d’une voix, la famille de bruitages ou l’ambiance, mais doit conserver les mêmes conventions de données, de chemins, de priorité des voix et de repli navigateur.

## Architecture des assets

```text
public/assets/audio/
  fr/
    dialogue/
    feedback/
    letters/
      names/
      prompts/
    syllables/
    words/
  sfx/
```

Conventions :

- un chemin public commence par `/assets/audio/` ;
- les noms sont stables, descriptifs et sans espace ;
- les voix localisées sont rangées sous leur locale ;
- les effets non linguistiques sont mutualisés dans `sfx` ;
- les fichiers sont courts et servis comme assets statiques ;
- aucune clé de fournisseur n’est exposée au navigateur.

## Voix préenregistrées

Les dialogues, mots, syllabes et feedbacks sont générés en amont avec ElevenLabs. Le navigateur ne contacte jamais le service : le script écrit directement les MP3 dans `public/assets/audio/`.

### Configuration

Créer un fichier `.env.local` non versionné :

```dotenv
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
ELEVENLABS_MODEL_ID=eleven_v3
ELEVENLABS_LANGUAGE_CODE=fr
```

`ELEVENLABS_API_KEY` et `ELEVENLABS_VOICE_ID` sont obligatoires. Le script utilise `eleven_v3` et `fr` par défaut.

La compatibilité de la voix et du modèle peut être contrôlée sans produire de fichier :

```bash
npm run audio:generate -- --check-voice
```

Le modèle `eleven_multilingual_v2` n’est pas retenu pour ce pipeline, car la langue des syllabes très courtes y est plus difficile à contraindre.

### Sources de contenu

Le script `scripts/generate-voices.mjs` construit les clips à partir de :

- `src/content/fr/voice-lines.json` pour les dialogues et feedbacks ;
- `src/content/fr/letters.json` pour les noms de lettres et les consignes complètes ;
- `src/content/fr/words.json` pour les mots et leurs prononciations contextuelles ;
- `src/content/fr/syllables.json` pour les syllabes mutualisées.

Les composants ne maintiennent aucune liste audio parallèle.

### Texte affiché et texte prononcé

Une graphie pédagogique n’est pas toujours un bon texte de synthèse vocale. Le modèle distingue donc :

- `displayWord` : mot complet envoyé au moteur vocal ;
- `syllables` : graphies affichées dans le jeu ;
- `spokenSyllables` : textes de génération dans le contexte du mot ;
- `speechText` : texte de génération générique d’une syllabe ;
- `audioWord` et `audio` : chemins des clips.
- `nameSpeechText` et `promptSpeechText` : textes de génération propres au jeu Lettres.

Exemples : `llon` peut être généré avec `yon`, `pho` avec `faux` et `cy` avec `si`. La ponctuation peut également influencer le résultat, comme dans `mi!`.

Dans une consigne complète sur une lettre, la notation du phonème entre barres obliques fonctionne généralement mieux que la répétition de la lettre. Par exemple, utiliser « La lettre L fait /l/, comme dans lapin » plutôt que `lll`, qui peut être prononcé comme trois noms de lettre distincts. Cette notation doit être essayée en premier ; une graphie phonétique de remplacement ne sert que si le rendu reste incorrect.

Pour générer le nom d’une lettre seule, l’entourer de guillemets aide généralement le moteur à l’interpréter comme une unité. Par exemple, le texte de génération `"M"` donne souvent un meilleur résultat que `M` sans guillemets. Cette règle concerne le nom isolé de la lettre ; pour son phonème dans une phrase, utiliser plutôt la notation `/m/`.

Une prononciation générique réutilise le chemin défini dans `syllables.json`. Si un mot nécessite une variante, `audioSyllables` doit pointer vers un chemin propre au mot, par exemple `/assets/audio/fr/words/maison/son.mp3`.

Deux textes prononcés différents ne doivent jamais cibler le même fichier. Le script détecte ce conflit et arrête la génération.

## Commandes de génération

Générer uniquement les fichiers absents :

```bash
npm run audio:generate
```

Régénérer tous les clips après un changement de voix, de modèle ou de réglages :

```bash
npm run audio:generate -- --force
```

Régénérer une cible existante par son chemin public :

```bash
npm run audio:generate -- --force --only=/assets/audio/fr/syllables/mi.mp3
npm run audio:generate -- --force --only=/assets/audio/fr/words/domino.mp3
```

`--only` accepte également un identifiant interne, mais le chemin public est préférable car il est non ambigu.

## Paramètres de sortie

Le pipeline actuel utilise :

- le format `mp3_44100_128` ;
- la seed `41807` pour limiter les variations ;
- une vitesse de `0.94` pour les dialogues ;
- une vitesse de `0.88` pour les mots ;
- une vitesse de `0.82` pour les syllabes ;
- une vitesse de `0.84` pour les noms de lettres ;
- une vitesse de `0.90` pour les consignes complètes du jeu Lettres ;
- des réglages de stabilité et de style propres à chaque catégorie ;
- jusqu’à trois nouvelles tentatives après une réponse `429` ou `5xx`.

Le script crée les répertoires nécessaires et conserve par défaut tout fichier déjà présent.

## Intégration dans le jeu

Le lecteur commun suit ces priorités :

1. interrompre proprement la voix précédente ;
2. lire le MP3 déclaré dans les données ;
3. utiliser `speechSynthesis` si le fichier ne peut pas être lu ;
4. laisser le jeu continuer même si les deux solutions échouent.

Les restrictions d’autoplay sont respectées : les ambiances et dialogues démarrent après une interaction utilisateur lorsque le navigateur l’impose.

### Cache navigateur

Les noms des fichiers restent stables. Lorsqu’un clip déjà publié est remplacé, la constante `VOICE_ASSET_VERSION` de `src/components/games/useVoiceAudio.ts` peut être incrémentée avant le déploiement.

Cette version ajoute un paramètre à l’URL. Elle n’a pas besoin de changer entre chaque essai local si le cache est désactivé ou vidé.

## Ambiances et bruitages

### Principes communs

- Une voix pédagogique reste au-dessus des ambiances.
- Une ambiance boucle sans coupure perceptible.
- Un son de réussite est court et chaleureux.
- Un son d’erreur est doux et non punitif.
- Une boucle de mouvement démarre et s’arrête avec l’animation correspondante.
- Les effets sont hébergés localement avec leur licence et leur provenance documentées.
- Un même effet peut être mutualisé s’il conserve la même signification dans plusieurs jeux.

### Inventaire actuel de Bateau

| Usage | Fichier | Source |
| --- | --- | --- |
| Ambiance de la mer | `public/assets/audio/sfx/sea-loop.mp3` | [Sea Wave](https://pixabay.com/sound-effects/nature-sea-wave-34088/) |
| Vent pendant le voyage | `public/assets/audio/sfx/wind-loop.mp3` | [Wind Blowing SFX 01](https://pixabay.com/sound-effects/nature-wind-blowing-sfx-01-423673/) |
| Mouvement du bateau | `public/assets/audio/sfx/boat-loop.mp3` | [Boat Squeaking](https://pixabay.com/sound-effects/film-special-effects-boat-squeaking-44883/) |
| Sélection d’une syllabe | `public/assets/audio/sfx/syllable-select.mp3` | [UI Pop sound](https://pixabay.com/sound-effects/film-special-effects-ui-pop-sound-316482/) |
| Pose d’une syllabe | `public/assets/audio/sfx/syllable-drop.mp3` | [app_interface_click_2](https://pixabay.com/sound-effects/app-interface-click-2-476372/) |
| Collecte d’un coffre | `public/assets/audio/sfx/chest-collect.mp3` | [Opening Bell](https://pixabay.com/sound-effects/film-special-effects-opening-bell-421471/) |
| Réussite | `public/assets/audio/sfx/level-complete.mp3` | [Short Success Sound Glockenspiel Treasure Video Game](https://pixabay.com/sound-effects/film-special-effects-short-success-sound-glockenspiel-treasure-video-game-6346/) |

Dans Bateau, la mer commence après « Commencer ». Le vent et le bateau sont synchronisés avec la traversée. Pendant une collecte, le bateau s’arrête et le vent reste plus discret.

Les règles fonctionnelles complètes sont dans le [GDD de Bateau](./games/bateau.md).

### Inventaire propre à Lettres

| Usage | Fichier | Source |
| --- | --- | --- |
| Ambiance nocturne | `public/assets/audio/sfx/night-loop.mp3` | [Crickets Chirping & Ocean Waves](https://pixabay.com/sound-effects/nature-crickets-chirping-amp-ocean-waves-by-prettysleepy-art-10372/), Prettysleepy, licence de contenu Pixabay |
| Allumage d’une étoile | `public/assets/audio/sfx/star-shine.mp3` | [Shine 11](https://pixabay.com/sound-effects/film-special-effects-shine-11-268907/), BenKirb, licence de contenu Pixabay |

L’ambiance nocturne démarre après l’action « Commencer » afin de respecter les restrictions d’autoplay. Elle reste très discrète sous les consignes. L’effet scintillant est joué au moment précis où l’étoile et son éventuel segment deviennent actifs.

### Inventaire propre au Sentier des mots

| Usage | Fichier | Provenance |
| --- | --- | --- |
| Ambiance de jungle | `public/assets/audio/sfx/jungle-loop.mp3` | variante locale provisoire de l’ambiance nocturne ; source cible : [Jungle Nature](https://pixabay.com/sound-effects/nature-jungle-nature-229896/) |
| Déplacement | `public/assets/audio/sfx/jungle-step.mp3` | variante locale provisoire du mouvement du bateau ; source cible : [Footstep Rustling](https://pixabay.com/sound-effects/nature-footstep-rustling-499643/) |
| Collecte d’une gemme | `public/assets/audio/sfx/gem-collect.mp3` | variante locale provisoire de l’effet scintillant ; source cible : [Soft Treble Fast Collect](https://pixabay.com/sound-effects/soft-treble-fast-collect-fade-out-ending-sound-effect-416828/) |

Ces variantes permettent de tester immédiatement le mixage et les timings sans dépendre d’un téléchargement externe. Elles doivent être remplacées par les trois sources cibles avant publication. L’ambiance démarre après « Entrer dans la jungle », baisse pendant la voix de Pana et reste silencieuse si l’autoplay est refusé.

## Variations par jeu

Le GDD d’un nouveau jeu doit préciser :

- les voix ou dialogues propres au thème ;
- les feedbacks réutilisés ;
- les ambiances et leur moment de démarrage ;
- les boucles synchronisées à un mouvement ;
- les nouveaux bruitages et leurs licences ;
- toute variation de voix, vitesse ou intention ;
- les chemins et catégories ajoutés.

Une variation de thème ne doit pas créer un second pipeline. Elle étend les données et, si nécessaire, les catégories comprises par le script commun.

## Ajouter un contenu vocal

1. Ajouter le contenu dans le fichier JSON approprié.
2. Définir le texte affiché et, si nécessaire, sa prononciation de génération.
3. Déclarer un chemin public unique.
4. Lancer la génération ciblée ou complète.
5. Exécuter `npm run content:check`.
6. Vérifier que le jeu utilise le chemin issu des données, sans mapping local supplémentaire.

Il n’est pas nécessaire de modifier le composant de jeu pour chaque nouveau mot ou chaque nouvelle syllabe.
