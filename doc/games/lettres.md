# L’Observatoire des lettres — Game Design Document

## Statut et périmètre

**L’Observatoire des lettres** est un parcours complet de douze niveaux couvrant les 26 lettres de l’alphabet en capitales, en minuscules puis en casse mélangée. Le décor de navigation nocturne et la carte céleste sont produits en CSS et SVG afin de pouvoir évoluer sans modifier la boucle du jeu.

Sources techniques de vérité :

- lettres et consignes : `src/content/fr/letters.json` ;
- niveau et choix : `src/content/fr/letter-lessons.json` ;
- mots-indices et illustrations : `src/content/fr/words.json` ;
- orchestration : `src/components/games/letters/LettersGame.tsx` ;
- carte et formes : `src/components/games/letters/LettersLevelMap.tsx` et
  `lettersConstellations.ts` ;
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

Chaque réplique est affichée et prononcée. Le joueur peut passer toute l’introduction. La carte céleste apparaît après la troisième réplique ou après l’action « Passer ».

## Carte céleste

La carte reprend la progression séquentielle de L’Archipel des mots dans une
composition propre à l’univers nocturne. Douze constellations abstraites sont
réparties le long d’un parcours vertical et reliées par une route d’étoiles.

- une constellation terminée est dorée, cochée et rejouable ;
- la constellation frontière reçoit un halo, l’action « Jouer » et la main
  tutorielle commune ;
- un niveau réel encore verrouillé reste atténué et non interactif ;
- un éventuel emplacement sans contenu conserve l’état générique « À venir » ;
- la carte se centre sur le niveau jouable le plus avancé ;
- une reprise d’aventure revient sur la carte plutôt que dans une question.

Les douze formes sont définies indépendamment du contenu pédagogique. Chacune
contient huit étoiles et une liste de connexions. Lorsqu’un niveau est joué, sa
scène réutilise exactement la miniature affichée sur la carte.

La version actuelle contient douze niveaux réels. Ils sont tous visibles dès le
départ, mais seul le niveau frontière et les niveaux terminés sont interactifs.

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
- entre trois et six cartes de lettres selon le niveau ;
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

Après la huitième réponse, l’effet de réussite est suivi de « Bravo », puis l’écran « Constellation terminée » reste affiché jusqu’à l’action du joueur. « Continuer » revient à la carte et « Rejouer » recommence le niveau sélectionné.

## Progression pédagogique

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

Le niveau 1 historique est conservé. La suite progresse ainsi :

| Niveaux | Objectif | Nombre de choix |
| --- | --- | ---: |
| 1–4 | couvrir A à Z en capitales | 3 puis 4 |
| 5–8 | couvrir a à z en minuscules | 4 puis 5 |
| 9–10 | alterner capitales et minuscules entre les questions | 5 |
| 11–12 | mélanger les deux casses dans chaque grille | 6 |

Les distracteurs rapprochent progressivement les formes `B/D/P/Q`, `M/N`,
`U/V`, `I/J/L`, `C/G/O/Q`, `F/T`, `G/J`, `K/Q` et `X/Y`. Les mots révélés
sont affichés en capitales aux niveaux 1 à 4, puis en minuscules aux niveaux 5
à 12. La boucle et la taille minimale des zones tactiles restent inchangées.

## Univers et thème

Dans **L’Observatoire des lettres**, le mot « observatoire » désigne l’action d’observer le ciel, pas un lieu ni un bâtiment. Pana navigue de nuit à bord de son bateau et utilise une lunette astronomique pour retrouver sa route grâce aux étoiles.

- les bonnes réponses deviennent des étoiles ;
- huit étoiles forment l’une des douze constellations abstraites de la carte ;
- chaque nouvelle étoile produit un rebond élastique bref lorsqu’elle s’allume ;
- le segment reliant deux étoiles s’illumine dès que les deux extrémités sont actives ;
- une étoile filante traverse occasionnellement le ciel et des nuages nocturnes défilent lentement ;
- la mer nocturne reste visible sous le ciel sans concurrencer la constellation ;
- les couleurs nocturnes restent reliées à la palette Readingo.

Le prototype jouable actuel conserve uniquement le ciel, les constellations et leur parcours étoilé comme décor. Le bateau et la lunette appartiennent au contexte narratif, mais ne doivent pas être improvisés en SVG ou en CSS. Leur intégration visuelle attendra des assets dédiés et validés. Le moteur de questions, la validation, l’audio et la sauvegarde restent indépendants des coordonnées des constellations. Aucun bâtiment d’observatoire, dôme ou décor terrestre ne doit apparaître dans les futurs assets de ce jeu.

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

Chaque niveau terminé débloque séquentiellement le suivant.
Une ancienne sauvegarde sans `unlockedLevel` déduit cette frontière depuis les
niveaux terminés. Le niveau 1 historique étant conservé, une sauvegarde existante
ayant terminé ce niveau ouvre directement le niveau 2, sans migration.

## Mode de test

Le mode de test apparaît uniquement sur `localhost`, `127.0.0.1` et `::1`.

Paramètres disponibles :

- `?etat=carte` ou `?carte=1` ouvre directement la carte ;
- `?niveau=1` ouvre directement le niveau demandé lorsqu’il existe ;
- `?question=5` ouvre directement la cinquième question ;
- `?etoiles=7` ouvre la huitième question avec sept étoiles ;
- `?etat=resultat` ouvre l’écran final.

Le sélecteur local permet aussi d’ouvrir la carte, chaque niveau réel, Q1 à Q8 et le résultat. Une session de test n’écrit jamais dans la sauvegarde.

## Responsive et mouvement

- Les grilles de trois à six cartes utilisent au maximum trois colonnes et conservent des zones tactiles confortables à partir de 320 px.
- La bulle de Pana et le panneau de réponse gardent leur hauteur intrinsèque et sont ancrés ensemble au bas de la scène, comme le panneau de L’Archipel des mots.
- La constellation occupe la zone de décor libre au-dessus et ne passe pas derrière les panneaux.
- Les contenus décoratifs se réduisent avant les contrôles lorsque la hauteur est faible.
- Les cartes et boutons audio sont de vrais boutons.
- Les boutons audio de l’image et des lettres reprennent les dimensions de L’Archipel des mots et se superposent au coin supérieur droit sans décentrer le contenu.
- Les libellés audio sont accessibles.
- Le feedback n’est jamais transmis uniquement par la couleur.
- `prefers-reduced-motion` supprime le vol de la lettre, le rebond des étoiles et les animations continues du ciel.

Le jeu n’ajoute aucune navigation clavier ni aucun déplacement automatique du focus. Les contrôles conservent uniquement le comportement natif des boutons HTML.

## Critères d’acceptation

- douze niveaux de huit questions pilotés par les données ;
- douze constellations distinctes sur la carte ;
- trois blocs de quatre niveaux couvrant chacun les 26 lettres ;
- capitales aux niveaux 1–4, minuscules aux niveaux 5–8 et casse mélangée aux niveaux 9–12 ;
- introduction et reprise conduisant à la carte ;
- seuls les niveaux réels et débloqués peuvent démarrer ;
- la forme du niveau sélectionné est identique sur la carte et dans la scène ;
- aucun indice visuel ne désigne la lettre cible avant la réponse et le mot écrit reste masqué ;
- une seule bonne réponse par question ;
- une erreur ne fait pas avancer ;
- une réussite révèle le mot et allume une étoile ;
- huit étoiles produisent l’écran final ;
- fonctionnement sans chevauchement à partir de 320 px ;
- démarrage audio compatible avec Safari après interaction ;
- sauvegarde uniquement en fin de niveau ;
- thème remplaçable sans réécrire le moteur de jeu.
