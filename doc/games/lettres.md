# Jeu Lettres — Game Design Document

## Statut et périmètre

Lettres est un vertical slice jouable destiné à valider une mécanique pédagogique et une direction thématique. Le décor de constellation est volontairement produit en CSS et SVG afin de pouvoir être remplacé sans modifier la boucle du jeu.

Le contenu précis et la courbe de difficulté des futurs niveaux ne sont pas encore validés. Le premier niveau contient huit questions provisoires qui servent à tester la mécanique, l’audio, l’interface et le rythme.

Sources techniques de vérité :

- lettres et consignes : `src/content/fr/letters.json` ;
- niveau et choix : `src/content/fr/letter-lessons.json` ;
- mots-indices et illustrations : `src/content/fr/words.json` ;
- orchestration : `src/components/games/letters/LettersGame.tsx` ;
- thème, défi et résultat : `src/components/games/letters/ConstellationScene.tsx`,
  `LettersChallenge.tsx` et `LettersResult.tsx` ;
- sauvegarde : `src/components/games/letters/lettersProgress.ts`.

## Intention pédagogique

Le jeu travaille la connaissance des lettres en associant trois informations :

- le nom de la lettre ;
- son graphème, affiché sur une carte ;
- un son fréquent illustré par un mot connu.

La consigne canonique est :

> « Donne-moi la lettre B. B fait /b/, comme dans bateau. »

L’image du mot sert d’ancrage sémantique. Le mot écrit n’est révélé qu’après la bonne réponse afin que l’enfant doive d’abord écouter et identifier la lettre demandée.

## Boucle principale

Après l’écran d’accueil, Pana présente l’enjeu en trois répliques successives :

1. « Oh non ! Les étoiles qui me montrent le chemin se sont éteintes. Sans elles, je ne peux plus guider mon navire dans la nuit ! »
2. « Aide-moi à les rallumer ! Pour chaque étoile, tu devras retrouver la lettre qui lui est associée. »
3. « Chaque bonne réponse fera briller une étoile et nous montrera la route. En avant pour notre grand voyage ! »

Chaque réplique est affichée et prononcée. Le joueur peut passer toute l’introduction. La première consigne de lettre démarre automatiquement après la troisième réplique.

La boucle ne change pas entre les questions :

```text
Pana prononce la consigne
  → l’enfant observe l’image-indice
  → il choisit une lettre
  → feedback immédiat
  → révélation du mot en cas de réussite
  → une étoile rejoint la constellation
  → question suivante
```

Une session contient exactement huit questions. Huit bonnes réponses terminent la constellation.

## Présentation d’une question

L’écran affiche :

- la progression en étoiles ;
- Pana et une consigne visuelle générique ;
- un bouton pour réécouter la consigne complète ;
- l’image-indice et son bouton audio ;
- trois cartes de lettres ;
- un bouton audio sur chaque carte pour écouter son nom.

Avant la réponse, la lettre cible apparaît uniquement parmi les choix : elle n’est ni nommée, ni mise en évidence visuellement. Le mot écrit n’est pas affiché. La consigne visible reste générique : l’information cible vient de la voix de Pana.

Les questions restent dans l’ordre défini par le niveau. Seule la position des cartes est mélangée.

## Réponse incorrecte

Une mauvaise réponse :

1. colore et secoue doucement la carte choisie ;
2. prononce le nom de cette lettre ;
3. affiche « Essaie encore » à côté de Pana et joue le message correspondant ;
4. rend les cartes à nouveau disponibles.

Elle n’allume aucune étoile, ne change pas de question et ne retire aucun point.

## Réponse correcte

Une bonne réponse :

1. passe la carte au vert ;
2. révèle le mot-indice écrit ;
3. met en évidence toutes les occurrences de la lettre cible ;
4. prononce le mot complet ;
5. anime la lettre vers la prochaine étoile ;
6. allume l’étoile ;
7. passe à la question suivante.

Après la huitième réponse, l’effet de réussite est suivi de « Bravo », puis l’écran « Constellation terminée » reste affiché jusqu’à l’action du joueur.

## Premier niveau provisoire

Le niveau « Première constellation » utilise trois choix en capitales.

| Question | Lettre | Son travaillé | Mot-indice |
| ---: | --- | --- | --- |
| 1 | A | /a/ | ananas |
| 2 | M | /m/ | moto |
| 3 | L | /l/ | lapin |
| 4 | F | /f/ | fusée |
| 5 | S | /s/ | soleil |
| 6 | R | /r/ | requin |
| 7 | V | /v/ | vélo |
| 8 | B | /b/ | bateau |

Cette sélection ne constitue pas encore une progression pédagogique définitive. Elle réutilise des mots et illustrations déjà disponibles afin d’évaluer rapidement le jeu.

## Difficulté future

La boucle doit rester identique. La difficulté pourra varier uniquement dans les données par :

- le nombre de cartes proposées ;
- la proximité visuelle ou phonologique des distracteurs ;
- l’usage de capitales ou de minuscules ;
- la différence de casse entre la consigne, les cartes et le mot révélé ;
- la position de la lettre dans le mot-indice ;
- les graphies ou correspondances lettre-son moins régulières.

Ajouter de la difficulté ne doit pas réduire les zones tactiles ni introduire une nouvelle commande.

## Univers et thème

Le prototype se déroule dans « L’Observatoire des lettres » :

- les bonnes réponses deviennent des étoiles ;
- huit étoiles forment une constellation imaginaire ;
- chaque nouvelle étoile produit un rebond élastique bref lorsqu’elle s’allume ;
- le segment reliant deux étoiles s’illumine dès que les deux extrémités sont actives ;
- une étoile filante traverse occasionnellement le ciel et des nuages nocturnes défilent lentement ;
- une petite planète annelée complète le décor sans concurrencer la constellation ;
- les couleurs nocturnes restent reliées à la palette Readingo.

Le thème est isolé dans `ConstellationScene`. Le moteur de questions, la validation, l’audio et la sauvegarde ne dépendent pas d’un modèle de constellation. Aucun asset raster définitif n’est produit tant que cette direction n’est pas confirmée.

## Audio

Les voix propres au jeu sont rangées sous :

```text
public/assets/audio/fr/letters/
  names/
  prompts/
```

Chaque consigne est un clip complet. Elle n’est pas reconstruite à partir de fragments, afin de conserver une prosodie naturelle entre le nom, le son et le mot-indice.

Les clips existants suivants sont mutualisés :

- mots complets de `public/assets/audio/fr/words/` ;
- `essaie-encore.mp3` ;
- `bravo.mp3` ;
- effets de pose, de scintillement et de réussite.

Une boucle légère de grillons et de vagues accompagne la scène après l’action « Commencer ». Son volume reste inférieur à celui des voix. Un effet scintillant est joué au moment où chaque étoile s’allume.

Le premier son ne démarre qu’après « Commencer », ce qui respecte les restrictions d’autoplay de Safari. La synthèse vocale du navigateur reste un repli.

## Sauvegarde

La clé est `readingo:lettres:v1`.

La sauvegarde contient :

- `version` ;
- `unlockedLevel` ;
- `completedLevels` ;
- `sessions`.

La sauvegarde n’est écrite qu’à la fin des huit questions. Une session interrompue ne termine pas le niveau. Une donnée absente, invalide ou un `localStorage` indisponible ne doit jamais empêcher de jouer.

Le premier niveau terminé débloque séquentiellement le suivant dès qu’il existe.
Une ancienne sauvegarde sans `unlockedLevel` déduit cette frontière depuis les
niveaux terminés. La future carte des constellations pourra donc lire la
progression sans migration supplémentaire.

## Mode de test

Le mode de test apparaît uniquement sur `localhost`, `127.0.0.1` et `::1`.

Paramètres disponibles :

- `?question=5` ouvre directement la cinquième question ;
- `?etoiles=7` ouvre la huitième question avec sept étoiles ;
- `?etat=resultat` ouvre l’écran final.

Le sélecteur local permet aussi d’ouvrir Q1 à Q8 et le résultat. Une session de test n’écrit jamais dans la sauvegarde.

## Responsive et mouvement

- La grille de trois cartes conserve des zones tactiles confortables à partir de 320 px.
- La bulle de Pana et le panneau de réponse gardent leur hauteur intrinsèque et sont ancrés ensemble au bas de la scène, comme le panneau de Bateau.
- La constellation occupe la zone de décor libre au-dessus et ne passe pas derrière les panneaux.
- Les contenus décoratifs se réduisent avant les contrôles lorsque la hauteur est faible.
- Les cartes et boutons audio sont de vrais boutons.
- Les boutons audio de l’image et des lettres reprennent les dimensions de Bateau et se superposent au coin supérieur droit sans décentrer le contenu.
- Les libellés audio sont accessibles.
- Le feedback n’est jamais transmis uniquement par la couleur.
- `prefers-reduced-motion` supprime le vol de la lettre, le rebond des étoiles et les animations continues du ciel.

Le jeu n’ajoute aucune navigation clavier ni aucun déplacement automatique du focus. Les contrôles conservent uniquement le comportement natif des boutons HTML.

## Critères d’acceptation du vertical slice

- huit questions pilotées par les données ;
- aucun indice visuel ne désigne la lettre cible avant la réponse et le mot écrit reste masqué ;
- une seule bonne réponse par question ;
- une erreur ne fait pas avancer ;
- une réussite révèle le mot et allume une étoile ;
- huit étoiles produisent l’écran final ;
- fonctionnement sans chevauchement à partir de 320 px ;
- démarrage audio compatible avec Safari après interaction ;
- sauvegarde uniquement en fin de niveau ;
- thème remplaçable sans réécrire le moteur de jeu.
