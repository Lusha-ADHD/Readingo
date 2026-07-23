# Le Sentier des mots — Game Design Document

> **Titre :** Le Sentier des mots  
> **Accroche :** Lis les mots et guide Pana jusqu’au trésor.

## Statut et périmètre

Ce document décrit le vertical slice implémenté du troisième jeu Readingo. La première version contient le niveau **Lisière de la jungle**, huit questions, trois directions, le système d’erreur et de demi-tour, les gemmes, la sauvegarde locale et un mode de test navigateur.

Le jeu doit être conçu comme un dungeon crawler guidé en vue rapprochée. Il ne possède ni carte persistante, ni graphe de navigation, ni déplacement libre. Les carrefours sont générés à partir de la question en cours et des réponses encore disponibles.

Sources de vérité prévues :

- mots, illustrations et prononciations : `src/content/fr/words.json` ;
- niveaux et distracteurs : `src/content/fr/sentier-lessons.json` ;
- dialogues et feedbacks : `src/content/fr/voice-lines.json` ;
- orchestration : `src/components/games/sentier/SentierGame.tsx` ;
- scène, défi et résultat : `src/components/games/sentier/JungleScene.tsx`,
  `SentierChallenge.tsx` et `SentierResult.tsx` ;
- logique pure : `src/components/games/sentier/sentierState.ts` ;
- progression : `src/components/games/sentier/sentierProgress.ts`.

Le document complète le [socle commun Readingo](../game-design-system.md). Les conventions visuelles, audio et de contenu ne sont pas redéfinies lorsqu’elles sont déjà couvertes par les documents communs.

## Résumé du jeu

Pana débarque sur une grande île recouverte d’une jungle épaisse. Un trésor se trouve quelque part au cœur de l’île, mais aucun chemin n’est indiqué.

À chaque carrefour, Pana prononce un mot et son illustration est affichée. Plusieurs mots écrits correspondent à plusieurs directions possibles. Le joueur doit reconnaître le bon mot pour guider Pana.

Quel que soit le choix, la caméra s’engage dans la direction sélectionnée :

- une bonne réponse rapproche Pana du trésor et fait apparaître des gemmes ;
- une mauvaise réponse l’entraîne dans une jungle plus dense, puis lui permet de choisir parmi les réponses restantes ;
- lorsqu’une seule réponse demeure, Pana propose de faire demi-tour et le joueur confirme la bonne réponse avec une commande dédiée.

Une session contient huit mots. La boucle ne change pas entre les niveaux ; seuls le contenu, le nombre de choix et la proximité des distracteurs évoluent.

## Public et objectif pédagogique

- Public principal : enfants de 5 à 7 ans, de la fin de grande section au début du CP.
- Durée cible : 3 à 7 minutes pour huit mots.
- Prérequis : connaître quelques lettres et comprendre qu’un mot oral peut être représenté par un mot écrit.
- Action principale : toucher ou cliquer le mot écrit correspondant au mot entendu et illustré.

Le jeu associe trois représentations d’un même mot :

- sa forme orale, prononcée par Pana ;
- son sens, soutenu par l’illustration ;
- sa forme orthographique, présentée parmi les réponses.

La compétence principale est l’identification d’un mot écrit à partir de sa forme orale. Le jeu prépare et consolide le décodage, mais n’évalue pas à lui seul la lecture autonome d’un mot inconnu puisque la cible est prononcée avant la réponse.

Le jeu travaille également :

- l’observation de l’ensemble du mot ;
- la discrimination de mots graphiquement ou phonologiquement proches ;
- l’automatisation progressive de mots fréquents ;
- l’association durable entre image, son et orthographe.

## Piliers propres au jeu

### Reconnaître

Le joueur ne reconstruit pas le mot : il doit le retrouver parmi plusieurs formes écrites. Les distracteurs sont choisis pour l’obliger progressivement à regarder au-delà de la première lettre.

### Choisir une direction

Chaque réponse est un chemin. Le choix pédagogique et l’action d’exploration sont une seule et même interaction.

### Avancer même en se trompant

Une erreur ne bloque pas le voyage. La caméra avance réellement dans le mauvais chemin, la jungle indique que Pana s’est égaré, puis le jeu rend le contrôle avec moins de réponses.

### Retrouver sa route

Le jeu ne possède pas d’état d’échec. L’élimination progressive des réponses conduit toujours à la bonne forme écrite et se termine, si nécessaire, par un demi-tour explicite.

### Matérialiser la précision

Les gemmes trouvées sur le chemin indiquent la qualité de la réponse sans retirer de récompense déjà acquise et sans afficher de sanction.

## Univers et narration

Le Sentier des mots occupe le territoire de jungle de l’univers Readingo :

- Pana arrive sur une île inconnue ;
- la jungle masque le chemin menant au trésor ;
- les mots guident l’expédition ;
- la densité de la végétation traduit le degré d’égarement ;
- les gemmes signalent que Pana se rapproche de la bonne route ;
- la progression de plusieurs niveaux doit conduire vers des ruines puis vers le trésor.

La jungle sert de cadre narratif et ne doit pas contraindre tous les mots à appartenir à son champ lexical. La progression pédagogique et la possibilité de réutiliser la bibliothèque d’illustrations Readingo restent prioritaires.

Le ton demeure aventureux mais rassurant. Les zones où Pana s’égare peuvent être plus denses ou mystérieuses, jamais effrayantes.

### Introduction

L’entrée doit reprendre la structure commune aux jeux Bateau et Lettres :

1. écran de départ centré avec le titre, l’accroche, Pana et une action « Commencer » ;
2. trois dialogues courts affichés et prononcés ;
3. possibilité de passer l’introduction ;
4. lancement automatique du premier mot après la dernière réplique.

Les trois textes produits sont :

1. « J’ai accosté sur une île couverte d’une immense jungle. Un grand trésor serait caché tout au fond ! »
2. « Mais tous les chemins se ressemblent… J’ai besoin de toi pour ne pas me perdre. »
3. « Écoute le mot, regarde l’image et retrouve-le parmi les chemins. En route vers le trésor ! »

## Parcours global

```text
Écran de départ
  → introduction de Pana
  → niveau 1 : Lisière de la jungle
  → huit mots
      → annonce de la cible
      → choix d’un chemin
      → déplacement
      → réussite, nouvelle tentative ou demi-tour
      → gemmes éventuelles
  → résultat du niveau
  → continuer l’expédition ou rejouer
```

Le nombre de niveaux et leur contenu ne sont pas encore arrêtés. Chaque niveau doit néanmoins conserver une unité de huit mots et faire progresser symboliquement Pana vers le trésor final.

## Boucle d’un mot

### Présentation

Au début d’un mot :

1. la scène affiche un nouveau carrefour ;
2. Pana prononce le mot cible ;
3. l’illustration du mot apparaît ;
4. un bouton permet de réécouter la cible ;
5. les réponses écrites apparaissent dans le panneau inférieur ;
6. chaque réponse reçoit une direction distincte.

Le mot cible n’est pas affiché séparément : il apparaît seulement parmi les réponses. La consigne visible reste générique, par exemple « Trouve le mot ».

### Directions

Le jeu peut utiliser jusqu’à cinq directions :

- très à gauche ;
- à gauche ;
- devant ;
- à droite ;
- très à droite.

La direction est représentée par une icône de flèche associée au bouton. Elle détermine uniquement la transition visuelle. Elle ne correspond pas à une coordonnée persistante et n’est pas enregistrée dans une carte.

Lors d’une nouvelle tentative, les réponses restantes peuvent recevoir de nouvelles directions. Le joueur ne doit pas pouvoir résoudre la question en mémorisant uniquement une position précédente.

### Sélection

Lorsqu’une réponse est choisie :

1. toutes les réponses sont temporairement désactivées ;
2. le bouton sélectionné prend un état pressé ;
3. la caméra avance dans la direction associée ;
4. la validation est révélée pendant le déplacement ou à l’arrivée ;
5. le jeu entre dans l’état de réussite ou de nouvelle tentative.

Le résultat ne doit pas être révélé avant le départ de la caméra. Le déplacement reste ainsi la conséquence directe du choix, qu’il soit correct ou non.

## Réponse correcte

Une bonne réponse :

1. termine le déplacement vers un chemin plus lisible ;
2. met en évidence le mot choisi ;
3. associe à nouveau le mot écrit, son illustration et sa prononciation ;
4. fait apparaître zéro, une ou deux gemmes selon les erreurs précédentes ;
5. joue le feedback de Pana adapté ;
6. collecte les gemmes dans le compteur ;
7. charge le carrefour du mot suivant.

Barème prévu :

| Erreurs avant la bonne réponse | Gemmes | Intention du feedback |
| ---: | ---: | --- |
| 0 | 2 | Pana confirme avec enthousiasme que le chemin est bon |
| 1 | 1 | Pana confirme calmement que la bonne piste est retrouvée |
| 2 ou plus | 0 | Pana valorise le retour sur la bonne route sans insister sur le score |

Feedbacks produits :

- sans erreur : « Oui ! Nous sommes sur le bon chemin ! »
- après une erreur : « Je crois que nous nous rapprochons. »
- après plusieurs erreurs : « Continuons, le trésor n’est peut-être plus très loin. »

## Réponse incorrecte

Une mauvaise réponse :

1. termine le déplacement dans une zone visuellement plus dense ;
2. augmente le compteur d’erreurs du mot ;
3. retire la réponse choisie de la liste disponible ;
4. conserve l’image cible et la possibilité de réécouter le mot ;
5. fait prononcer à Pana un feedback court ;
6. présente un nouveau carrefour avec les réponses restantes.

Feedback principal :

> « Je crois qu’on n’a pas pris le bon chemin… »

Une erreur ne retire aucune gemme déjà obtenue, ne recommence pas le niveau et ne produit pas de son agressif.

### Dernière réponse et demi-tour

Si une erreur ne laisse plus qu’une seule réponse :

1. Pana dit : « Je crois qu’il faut faire demi-tour. »
2. la dernière réponse reste visible ;
3. sa flèche directionnelle devient une icône de demi-tour ;
4. le joueur doit toucher cette réponse ;
5. la caméra effectue le demi-tour ;
6. le jeu associe explicitement le bon mot, sa prononciation et son image ;
7. aucune gemme n’est attribuée ;
8. le mot suivant commence.

Le jeu ne sélectionne pas automatiquement la dernière réponse. L’action du joueur ferme la correction et lui montre clairement la bonne forme écrite.

## Scène et simulation du déplacement

Le jeu simule une caméra avançant dans la jungle avec des calques 2D. Il ne nécessite ni moteur 3D, ni déplacement physique, ni collision.

Composition cible :

- fond lointain : ciel, canopée et lumière ;
- plan intermédiaire : troncs, rochers et végétation ;
- chemin ou ouverture centrale ;
- feuillages et lianes de premier plan ;
- brume légère ;
- particules ou petits éléments d’ambiance discrets.

Transitions prévues :

| Direction | Mouvement principal |
| --- | --- |
| Devant | zoom centré et parallaxe des feuillages |
| Gauche / droite | translation, légère rotation et zoom |
| Très à gauche / très à droite | translation latérale plus marquée et changement de cadrage |
| Demi-tour | balayage latéral ou rotation suggérée, puis fondu vers le chemin retrouvé |

Une transition doit rester assez courte pour rythmer la réponse. Une cible de 500 à 700 ms pourra être évaluée pendant le prototype. L’animation doit pouvoir être passée par une nouvelle interaction lorsque cela ne provoque pas de double validation.

Le nouveau carrefour est préparé pendant la transition puis remplace le précédent. Il n’existe aucun besoin de reconstruire ou de revisiter réellement une zone antérieure.

## Degré d’égarement

L’ambiance dépend uniquement du nombre d’erreurs sur le mot actuel. Trois états suffisent :

| État | Condition | Traitement |
| --- | --- | --- |
| Bonne piste | aucune erreur | lumière chaude, chemin lisible, couleurs ouvertes |
| Un peu perdu | une erreur | végétation plus dense, ombres et brume légèrement renforcées |
| Très perdu | deux erreurs ou plus | lianes plus présentes, chemin étroit, lumière plus froide |

Les variations utilisent les mêmes assets :

- filtres colorimétriques ;
- opacité de la brume ;
- quantité et position des calques de feuillage ;
- largeur apparente du chemin ;
- mixage de l’ambiance sonore.

Elles ne nécessitent pas un décor raster distinct pour chaque état.

Après la résolution du mot, le chemin des gemmes ramène progressivement la scène vers l’état « Bonne piste ». Le compteur d’égarement repart à zéro pour le mot suivant.

## Progression et difficulté

La boucle, les contrôles et les états de correction restent identiques. La difficulté évolue dans les données par :

- le nombre de réponses, de deux à cinq ;
- la longueur des mots ;
- les correspondances graphèmes-phonèmes mobilisées ;
- la régularité orthographique ;
- la proximité visuelle ou phonologique des distracteurs ;
- la fréquence et la familiarité du vocabulaire.

Exemples de séries pertinentes :

- `bateau`, `gâteau`, `râteau` ;
- `poule`, `boule`, `moule` ;
- `moto`, `photo`, `loto`.

Les distracteurs ne doivent pas être sélectionnés aléatoirement dans tout le dictionnaire. Chaque question possède une série validée, sans ambiguïté et adaptée à la progression.

Le nombre de directions ne constitue qu’un axe secondaire. Cinq mots longs peuvent surcharger un téléphone ; la proximité des distracteurs doit pouvoir augmenter la difficulté sans ajouter systématiquement une option.

Les changements de casse ne sont pas l’axe principal de ce jeu : la connaissance des capitales et minuscules relève prioritairement du jeu Lettres. La graphie par défaut et son évolution seront décidées avec le contenu des niveaux.

## Scoring et récompenses

L’unité de score est la gemme.

- maximum par mot : 2 gemmes ;
- maximum pour huit mots : 16 gemmes ;
- aucune gemme négative ;
- aucune gemme déjà obtenue n’est retirée ;
- la quantité gagnée dépend uniquement du nombre d’erreurs sur le mot courant.

Les gemmes apparaissent physiquement sur le chemin après la résolution. La caméra les approche, elles produisent un effet de collecte, puis rejoignent le compteur du HUD.

L’écran de résultat doit montrer :

- le niveau terminé ;
- les gemmes obtenues sur 16 ;
- le meilleur résultat du niveau lorsque cette progression existe ;
- une action principale pour poursuivre l’expédition.

Le cumul de gemmes sur toute l’aventure et son rôle dans l’accès au trésor restent à décider.

## Écrans et interface

### Écran de départ

L’écran reprend la structure visuelle des autres jeux :

- scène de jungle visible ;
- Pana clairement identifié ;
- titre « Le Sentier des mots » ;
- accroche « Lis les mots et guide Pana jusqu’au trésor. » ;
- bouton principal « Commencer », identique aux autres jeux.

Le dialogue conserve la même composition que le jeu des lettres : Pana au-dessus
d’une bulle claire centrée, une pointe orientée vers Pana et le bouton secondaire
« Passer » sous la bulle.

### HUD

Le HUD reste limité à :

- niveau ;
- mot actuel sur huit ;
- gemmes du niveau.

Le degré d’égarement doit être montré par la scène, pas par une jauge négative.

### Zone de jeu

La partie supérieure et centrale conserve la vue rapprochée du carrefour et suffisamment d’espace pour percevoir le mouvement de caméra.

Le panneau de réponse est ancré en bas du cadre, comme dans Bateau et Lettres. Il contient :

- Pana et la consigne ou le feedback courant ;
- l’illustration cible ;
- le bouton pour réécouter le mot ;
- les réponses écrites et leurs flèches.

Les réponses ne possèdent pas de bouton audio : écouter leur contenu révélerait la solution. Le bouton audio est uniquement associé à l’image cible et rejoue le mot demandé.

### Grille de réponses

La grille est pilotée par l’espace disponible :

- deux ou trois réponses peuvent tenir sur une ligne lorsque leur longueur le permet ;
- quatre ou cinq réponses se répartissent automatiquement sur plusieurs colonnes ou lignes ;
- les boutons conservent une largeur et une hauteur tactiles confortables ;
- le mot reste centré ;
- la flèche est superposée dans un coin et ne participe pas au centrage du texte ;
- l’ordre visuel suit les directions de la plus à gauche à la plus à droite.

La mise en page doit reposer sur une grille responsive générique, par exemple `auto-fit` et `minmax`, et non sur des exceptions par niveau ou par mot.

## Feedback, animation et son

### Feedback visuel

- sélection : enfoncement du bouton avant le départ ;
- réussite : mot validé, ouverture de la lumière et apparition des gemmes ;
- erreur : arrivée dans une zone plus dense et retrait de la réponse choisie ;
- demi-tour : changement explicite de l’icône puis retour vers un chemin lisible ;
- collecte : déplacement des gemmes vers le HUD.

Le rouge n’est pas nécessaire pour signaler l’erreur : la parole de Pana, la disparition du choix et l’évolution de la jungle suffisent.

### Voix

Le jeu doit prévoir :

- trois dialogues d’introduction ;
- une consigne courte ou le mot cible prononcé dans un contexte naturel ;
- les trois intensités de réussite ;
- le feedback de mauvais chemin ;
- le feedback de demi-tour ;
- un dialogue de fin de niveau ;
- un dialogue final lié au trésor lorsque le parcours complet sera défini.

Les mots et illustrations déjà présents dans `words.json` sont réutilisés. Si la prosodie d’un mot isolé ne convient pas à l’annonce, le pipeline commun doit permettre une variante contextuelle sans dupliquer la logique dans le composant.

### Ambiance et effets

Familles sonores prévues :

- boucle légère de jungle ;
- bruissement synchronisé au déplacement ;
- variation discrète de l’ambiance quand la jungle se densifie ;
- effet doux de mauvais chemin ;
- apparition puis collecte des gemmes ;
- réussite du niveau ;
- découverte du trésor.

Les sources et licences seront ajoutées au [pipeline audio](../audio-generation.md) lors du choix des fichiers. Les voix restent toujours prioritaires sur l’ambiance et les transitions.

## Contenu piloté par les données

Le jeu réutilise `words.json` pour :

- l’identifiant du mot ;
- sa graphie ;
- son illustration ;
- son audio ;
- ses éventuelles variantes de prononciation.

Le fichier de leçons définit :

```json
{
  "id": "sentier-1",
  "level": 1,
  "title": "Lisière de la jungle",
  "gameIds": ["sentier"],
  "questions": [
    {
      "id": "sentier-1-moto",
      "targetWordId": "moto",
      "distractors": ["melon", "maison"]
    }
  ]
}
```

Les directions ne sont pas stockées avec les mots. Elles sont affectées au lancement de la question et à chaque nouvelle tentative selon le nombre de réponses restantes.

Validation attendue :

- huit questions par niveau ;
- mot cible présent dans `words.json` ;
- distracteurs textuels normalisés et uniques ;
- entre deux et cinq réponses ;
- graphie, audio et image disponibles pour la cible ;
- illustration disponible pour la cible ;
- une seule réponse correcte ;
- distracteurs validés pédagogiquement ;
- quantité et longueur des réponses compatibles avec l’interface.

## Ambition graphique et stratégie d’assets

Le jeu doit produire l’impression d’un environnement vivant avec un petit ensemble de calques réutilisables.

### Assets existants à réutiliser

- Pana ;
- illustrations et audios des mots déjà présents ;
- panneaux, boutons, haut-parleur et états interactifs communs ;
- effets UI mutualisables ;
- coffre ou éléments de trésor existants lorsque leur représentation convient.

### Nouveaux assets du premier vertical slice

Les huit rasters produits dans `public/assets/world/jungle/` sont :

- `jungle-backdrop.png` : fond opaque 16:9 ;
- `jungle-canopy.png` : canopée supérieure transparente ;
- `foliage-left.png` et `foliage-right.png` : feuillages de premier plan ;
- `vines-a.png` et `vines-b.png` : lianes modulaires ;
- `rock-fern.png` : rochers et fougères ;
- `gem.png` : récompense.

La brume, les flèches, les ouvertures de chemin, les halos et les particules simples sont réalisés en SVG ou CSS.

Un fragment de carte, des ruines ou une entrée de temple ne sont produits qu’après validation de la boucle principale. Ils appartiennent à la progression longue et non au budget du premier vertical slice.

### Limites de production

Le jeu n’exige pas :

- un décor par mot ;
- un décor complet par niveau ;
- une image propre à chaque direction ;
- un personnage animé image par image ;
- un graphe illustré de la jungle ;
- des animaux décoratifs uniques pour chaque question ;
- une scène 3D ou un moteur de collision.

Une nouvelle illustration de mot est produite seulement si elle apporte du contenu pédagogique réutilisable. Elle rejoint alors la bibliothèque commune de Readingo.

## Sauvegarde

La sauvegarde est versionnée sous `readingo:sentier-des-mots:v1`.

Elle contient :

- `unlockedLevel` ;
- `completedLevels` ;
- `bestGemsByLevel` ;
- `sessions`.

La sauvegarde n’est écrite qu’après les huit mots. Une interruption ne termine pas le niveau et ne valide pas les gemmes temporaires. Une sauvegarde absente ou corrompue et un `localStorage` indisponible ne doivent jamais empêcher de jouer.

Le niveau suivant est débloqué séquentiellement dès qu’un niveau frontière est
terminé. Une ancienne sauvegarde sans `unlockedLevel` déduit cette valeur depuis
les niveaux terminés. La représentation visuelle de ce parcours et son total
cumulé restent différés jusqu’à la conception de la carte de la jungle.

## Responsive et accessibilité

- Le cadre commun Readingo utilise trois rangées réelles : HUD, scène flexible et contrôles intrinsèques.
- Le HUD et les contrôles restent dans le flux ; ils ne sont jamais positionnés par-dessus la scène.
- Les positions absolues sont limitées aux calques possédés par un composant : décor, flèche de direction et haut-parleur de l’image.
- Le jeu est contrôlé à 320, 375 et 768 px ainsi que sur bureau.
- La scène garde une zone visible suffisante au-dessus du panneau inférieur.
- Les réponses longues se réorganisent sans chevauchement ni débordement horizontal.
- Cinq réponses restent manipulables sans réduire excessivement le texte ou les zones tactiles.
- Les flèches possèdent des libellés accessibles, par exemple « chemin à gauche ».
- Le bouton complet possède un libellé associant mot et direction.
- Le feedback n’est transmis ni uniquement par la couleur, ni uniquement par le son.
- L’image cible reste disponible lorsque l’audio échoue.
- Les contrôles utilisent des boutons HTML natifs.
- Le jeu n’ajoute aucune navigation clavier ni aucun déplacement automatique du focus.

Avec `prefers-reduced-motion` :

- les mouvements de caméra sont remplacés par un fondu court ;
- les changements d’ambiance sont appliqués sans parallaxe ;
- les gemmes apparaissent sans déplacement long ;
- l’ordre et le résultat des états restent identiques.

## Mode de test

Le mode de test doit apparaître uniquement sur `localhost`, `127.0.0.1` et `::1`.

Il doit permettre d’ouvrir directement :

- un niveau ;
- une question précise ;
- un carrefour avec zéro, une ou plusieurs erreurs ;
- l’état où une seule réponse impose le demi-tour ;
- une réussite à deux, une ou zéro gemme ;
- le résultat du niveau.

Paramètres disponibles :

```text
?test=1&question=4
?test=1&errors=1
?test=1&state=uturn
?test=1&state=result
?test=1&choices=5
```

Une session de test ne modifie jamais la sauvegarde.

## Critères d’acceptation du premier vertical slice

- écran de départ conforme au cadre commun ;
- introduction de trois dialogues pouvant être passée ;
- niveau de huit mots piloté par les données ;
- mot cible prononcé et illustré ;
- entre deux et cinq réponses écrites associées à des directions ;
- déplacement visuel après chaque choix, correct ou incorrect ;
- une mauvaise réponse retirée avant la tentative suivante ;
- degré d’égarement visible selon les erreurs du mot actuel ;
- état de demi-tour lorsque seule la bonne réponse reste ;
- attribution exacte de deux, une ou zéro gemme ;
- retour à l’ambiance normale au mot suivant ;
- résultat sur 16 gemmes ;
- aucun graphe, collision ou historique spatial nécessaire ;
- réutilisation des illustrations et audios communs ;
- fonctionnement sans chevauchement à partir de 320 px ;
- comportement compatible avec Safari et ses restrictions audio ;
- support du mouvement réduit ;
- sauvegarde uniquement après les huit mots ;
- mode de test local sans écriture.

## Variations par rapport au socle commun

- Une erreur déclenche un déplacement narratif avant de rendre le contrôle.
- La réponse incorrecte est retirée pour la question en cours.
- La dernière réponse devient une action de demi-tour au lieu d’être validée automatiquement.
- Les boutons de réponse n’ont volontairement pas de bouton audio.
- La qualité de la réponse est matérialisée sur le chemin par des gemmes.
- L’ambiance visuelle évolue temporairement avec les erreurs du mot courant.

Ces variations ne modifient pas les composants communs de bouton, de panneau, de voix, de sauvegarde ou de résultat.

## Décisions restant à prendre

- contenu et nombre des niveaux après la Lisière ;
- ordre pédagogique des graphèmes et mots ;
- forme du parcours ou de la sélection des niveaux ;
- rôle du cumul de gemmes ;
- mise en scène de l’arrivée au trésor.

Le vertical slice ne doit pas anticiper ces décisions par des niveaux verrouillés ou une fausse carte.
