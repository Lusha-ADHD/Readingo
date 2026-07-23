# Jeu Bateau — Game Design Document

## Statut et périmètre

Ce document décrit le comportement actuel du jeu Bateau et constitue sa référence de game design. Il complète le [socle commun Readingo](../game-design-system.md) sans recopier toutes ses règles.

Sources techniques de vérité :

- niveaux : `src/content/fr/lessons.json` ;
- mots et découpages : `src/content/fr/words.json` ;
- syllabes et prononciations : `src/content/fr/syllables.json` ;
- logique de jeu : `src/components/games/BateauGame.tsx` ;
- carte : `src/components/games/LevelMap.tsx` ;
- sauvegarde : `src/components/games/bateauProgress.ts`.

Lorsqu’une valeur technique change, le code, les données, les validateurs et ce document doivent être mis à jour ensemble.

## Intention

Bateau est un jeu de recomposition syllabique. L’enfant observe et écoute un mot, puis le reconstitue en choisissant ses syllabes dans le bon ordre.

La réussite fait avancer un bateau dans un archipel. La progression pédagogique et la progression dans le décor sont ainsi confondues : chaque mot correctement composé produit immédiatement un voyage visible.

## Public et objectif pédagogique

- Public principal : enfants de 5 à 7 ans.
- Compétence : identifier, ordonner et oraliser les syllabes d’un mot.
- Prérequis : savoir toucher ou cliquer un élément et reconnaître une image simple.
- Durée cible : 3 à 7 minutes pour un niveau de huit mots.

Le jeu travaille progressivement :

- les mots de deux syllabes ;
- les mots de trois syllabes ;
- les mots de quatre syllabes ;
- la discrimination entre syllabes correctes et distracteurs proches ;
- la mémorisation de séquences plus longues.

## Piliers propres au jeu

### Composer

La mécanique principale reste identique pendant les six niveaux : choisir la prochaine syllabe du mot. La difficulté vient du contenu et du nombre de choix, pas d’un changement de commande.

### Écouter

Le mot et chaque syllabe peuvent être réécoutés. Le texte affiché et le texte envoyé à la génération vocale peuvent différer afin de conserver une prononciation naturelle.

### Voyager

Chaque mot terminé déclenche une courte traversée. Le résultat n’est pas résumé par un nombre abstrait : il devient une distance parcourue et, parfois, un coffre trouvé.

### Rejouer

Un niveau débloqué reste disponible. Le meilleur résultat et le total de coffres donnent une raison de rejouer sans pénaliser l’enfant.

## Univers et narration

Bateau utilise le territoire maritime de l’univers Readingo :

- Pana guide le joueur ;
- le bateau relie les îles de l’archipel ;
- le vent traduit la qualité de la composition ;
- les coffres matérialisent les récompenses ;
- une grande île au trésor conclut le parcours.

Le vocabulaire est positif et concret : niveau, traversée, vent, coffre, île, aventure. Le temps n’est jamais affiché comme une pression.

## Parcours global

```text
Introduction
  → dialogue de Pana
  → carte de l’archipel
  → sélection d’un niveau débloqué
  → huit mots
      → composition
      → validation
      → traversée
  → résultat du niveau
  → « Continuer l’aventure »
  → carte et éventuel déblocage
```

Une session charge uniquement les huit mots du niveau sélectionné et les mélange. Quitter avant la fin ne termine pas le niveau et ne débloque aucune destination.

## Boucle d’un mot

### Présentation

L’écran affiche :

- le niveau et le numéro du mot ;
- les coffres du niveau et le total de l’aventure ;
- une barre de progression ;
- l’image du mot avec son bouton d’écoute ;
- autant d’emplacements que de syllabes attendues ;
- la grille des syllabes proposées.

Le mot peut être écouté avant toute réponse.

### Action

Le joueur touche une tuile. Elle est placée dans le premier emplacement vide, puis validée immédiatement.

La tuile audio respecte les conventions communes :

- même bouton haut-parleur que celui de l’image ;
- mêmes dimensions ;
- position constante dans le coin supérieur droit de l’élément associé.

### Réponse incorrecte

Une mauvaise syllabe :

1. augmente le compteur d’erreurs du mot ;
2. produit un retour visuel doux ;
3. joue la syllabe choisie ;
4. joue le message « Essaie encore » ;
5. libère l’emplacement pour un nouvel essai.

Elle ne retire ni coffre ni progression déjà obtenue.

### Réponse correcte

Une bonne syllabe :

1. reste dans son emplacement ;
2. déclenche le son de pose ;
3. est prononcée ;
4. laisse le joueur choisir la syllabe suivante.

Lorsque le mot est complet, le jeu joue l’effet de réussite puis le mot entier avant de lancer la traversée.

## Niveaux et difficulté

Chaque niveau contient huit mots. Le nombre total de tuiles est la somme des syllabes attendues et des distracteurs.

| Niveau | Titre | Syllabes par mot | Distracteurs | Tuiles proposées | Mots |
| --- | --- | ---: | ---: | ---: | --- |
| 1 | Premières syllabes | 2 | 2 | 4 | chaton, bateau, moto, lapin, melon, tapis, panda, maison |
| 2 | Petite traversée | 2 | 2 | 4 | vélo, fusée, soleil, requin, citron, pirate, girafe, cadeau |
| 3 | Trois syllabes | 3 | 2 | 5 | domino, canari, animal, parasol, ananas, chocolat, papillon, caméra |
| 4 | Sons nouveaux | 3 | 3 | 6 | écureuil, éléphant, téléphone, dinosaure, crocodile, coquillage, cheminée, libellule |
| 5 | Grand défi | 4 | 3 | 7 | hippopotame, hélicoptère, alligator, ordinateur, calculatrice, locomotive, caméléon, photographie |
| 6 | Maître des mots | 4 | 4 | 8 | aspirateur, rhinocéros, télévision, épouvantail, bibliothèque, motocyclette, accordéon, macaroni |

La difficulté augmente à deux paliers particulièrement visibles :

- niveau 3 : passage à trois syllabes et cinq choix ;
- niveau 5 : passage à quatre syllabes et sept choix.

Le niveau 4 introduit davantage de distracteurs. Le niveau 6 porte la grille à huit choix. La grille responsive doit absorber cette progression sans règle CSS propre à un mot ou à un niveau.

### Cas particuliers de contenu

- Une syllabe peut apparaître deux fois, comme `po` dans « hippopotame » : chaque occurrence reste une tuile manipulable distincte.
- Le texte affiché peut différer de la prononciation de génération, par exemple `llon → yon`, `pho → faux` ou `cy → si`.
- Les distracteurs sont définis par mot et doivent rester plausibles sans former une réponse ambiguë.

## Vent, voyage et coffres

Le vent récompense la fluidité sans afficher de chronomètre.

| Vent | Condition | Îles franchies |
| --- | --- | ---: |
| Fort | réponse en 8 secondes maximum, sans erreur | 3 |
| Moyen | réponse en 16 secondes maximum, avec au plus une erreur | 2 |
| Faible | tous les autres cas | 1 |

Les seuils sont calculés mot par mot. Ils modifient la longueur du voyage, jamais la possibilité de terminer le niveau.

Les petites îles alternent visuellement entre banc de sable, rochers et palmiers. Une île de trajet sur deux contient un coffre. Lorsqu’un coffre est atteint :

- le bateau marque une courte pause ;
- le coffre est collecté ;
- le compteur du niveau augmente ;
- le total de l’aventure est prévisualisé dans le HUD.

Durées de traversée actuelles :

- vent fort : environ 1,7 seconde ;
- vent moyen : environ 2,2 secondes ;
- vent faible : environ 2,7 secondes ;
- pause de collecte : environ 620 ms.

Le vent reste une récompense implicite. Il ne doit pas transformer l’exercice de lecture en épreuve de rapidité anxiogène.

## Carte verticale de l’archipel

### Rôle

La carte sert à :

- montrer les six niveaux dans un seul parcours ;
- sélectionner un niveau débloqué ;
- rendre les déblocages visibles ;
- afficher le meilleur score de chaque niveau ;
- matérialiser l’objectif final.

Elle conserve l’océan et le ciel animés du jeu. Le parcours défile verticalement à l’intérieur de la scène.

### Composition

- Six grandes îles représentent les niveaux.
- Trois petites îles non interactives relient chaque paire de niveaux.
- Un chemin maritime serpente de gauche à droite.
- Le bateau marque le niveau frontière, c’est-à-dire le niveau le plus avancé accessible.
- Une grande île au trésor se trouve après le niveau 6.
- L’en-tête fixe affiche Pana, « L’Archipel », le total de coffres et, selon le contexte, le bouton de fermeture.

Les positions sont exprimées relativement au parcours afin de conserver la trajectoire sur téléphone, tablette et bureau.

### États d’un niveau

| État | Représentation | Action |
| --- | --- | --- |
| Terminé | île avec coffre, coche et meilleur score | rejouer |
| Frontière | couleurs pleines, halo doré et bateau proche | démarrer ou continuer |
| Débloqué | couleurs pleines, sans halo | jouer ou rejouer |
| Verrouillé | saturation et opacité réduites, cadenas | aucune |
| Trésor final | grande île avec coffre | conclusion après le niveau 6 |

Le panneau de texte d’un niveau et son île constituent un seul bouton visuel. Ils ne doivent pas se recouvrir au point de masquer le titre ou l’action. Les grandes îles restent assez compactes pour ne pas cacher les petites îles de trajet.

### Ouverture

À l’ouverture :

1. le parcours centre silencieusement le niveau frontière ;
2. la carte apparaît par un fondu et une courte montée ;
3. les éléments visibles entrent avec un léger décalage ;
4. le chemin parcouru se dessine ;
5. le bateau rejoint la position courante ;
6. le halo du prochain niveau devient visible.

La carte devient interactive sans attendre la fin de l’animation.

### Déblocage

Après la première réussite du niveau le plus avancé :

1. le résultat disparaît ;
2. la carte se recentre sur le niveau terminé ;
3. son île reçoit son coffre, sa coche et son meilleur score ;
4. le nouveau segment s’éclaire ;
5. les petites îles s’illuminent dans l’ordre ;
6. le bateau rejoint le niveau suivant ;
7. le cadenas disparaît ;
8. le nouveau niveau retrouve ses couleurs et son halo ;
9. le focus va sur « Démarrer le niveau suivant ».

Une interaction peut terminer l’animation immédiatement. En mouvement réduit, les états sont appliqués directement avec un fondu court.

Lors du rejeu d’un ancien niveau, il n’y a ni nouveau voyage sur la carte ni nouveau déblocage. Seuls le coffre et le meilleur résultat sont actualisés.

## Interface de jeu

### HUD

Le HUD contient uniquement :

- `Niveau X/6 · Mot Y/8` ;
- la progression du niveau ;
- les coffres gagnés pendant le niveau ;
- le total cumulé avant la session.

Le HUD doit rester lisible sans prendre l’espace nécessaire à l’exercice.

### Zone de composition

L’image, les emplacements du mot et les choix forment un panneau unique.

Règles responsive :

- le mot composé tient sur une seule ligne tant que les dimensions tactiles minimales peuvent être conservées ;
- les emplacements partagent équitablement la largeur disponible ;
- les tuiles de choix utilisent une grille auto-ajustée ;
- les libellés courts ne sont pas tronqués ;
- aucune exception ne dépend d’un mot particulier ;
- si la hauteur est contrainte, les espaces décoratifs se réduisent avant les contrôles.

Sur les faibles largeurs, l’image et les emplacements peuvent se réorganiser, mais l’ordre pédagogique reste : cible, mot à composer, choix.

## Résultat de niveau

Le panneau de fin affiche :

- « Niveau terminé » ;
- les coffres obtenus ;
- le bouton principal « Continuer l’aventure ».
- une action secondaire « Rejouer ».

Le meilleur résultat est visible sur la carte, où il aide à comparer les replays sans alourdir le panneau de fin.

L’effet `level-complete` est suivi automatiquement du message audio « Bravo ». Il n’existe pas de commande séparée « Écouter bravo ».

Le résultat reste affiché jusqu’à l’action du joueur. La carte ne reprend pas automatiquement pendant que l’enfant observe sa réussite.

Après le niveau 6, le dernier trajet rejoint l’île au grand trésor. Le coffre final s’ouvre, le son de récompense est joué et le message « Archipel terminé » apparaît.

## Déblocage et rejeu

- Seul un niveau terminé débloque le niveau suivant.
- Un niveau débloqué peut être rejoué à tout moment.
- Terminer le niveau frontière pour la première fois anime le nouveau segment.
- Rejouer un niveau déjà terminé peut améliorer son meilleur score.
- Les coffres d’une session terminée sont ajoutés au total cumulé.
- Une session interrompue n’ajoute aucun coffre et ne débloque rien.

## Sauvegarde

La clé actuelle est `readingo:bateau:v3`.

La sauvegarde contient :

- `version` ;
- `unlockedLevel` : plus haut niveau débloqué ;
- `completedLevels` : niveaux terminés ;
- `bestTreasuresByLevel` : meilleur nombre de coffres par niveau ;
- `totalTreasures` : somme des coffres des sessions terminées ;
- `completedWords` : mots déjà terminés ;
- `sessions` : nombre de niveaux terminés.

Les règles communes de robustesse s’appliquent :

- une sauvegarde absente ou invalide ne bloque pas le jeu ;
- l’écriture n’a lieu qu’à la fin du niveau ;
- la version 2 est migrée vers la version 3 ;
- si les huit mots historiques sont terminés en version 2, le niveau 2 est débloqué ;
- le mode de test ne lit ni ne modifie la progression réelle.

## Audio

### Voix

- trois répliques d’introduction ;
- mots complets ;
- syllabes ;
- « Essaie encore » ;
- « Bravo ».

Les clips préenregistrés sont prioritaires. La synthèse du navigateur sert de repli si un fichier ne peut pas être joué.

### Effets et ambiances

- `sea-loop` : ambiance permanente de la scène ;
- `wind-loop` : traversée et animation de déblocage ;
- `boat-loop` : mouvement du bateau ;
- `syllable-select` : sélection d’une tuile ;
- `syllable-drop` : pose correcte ;
- `chest-collect` : collecte d’un coffre ;
- `level-complete` : mot ou niveau réussi selon le contexte.

Les boucles s’arrêtent avec le mouvement correspondant. Les voix restent toujours prioritaires dans le mix.

La fabrication et l’intégration sont décrites dans le [pipeline audio commun](../audio-generation.md).

## Images et assets de monde

Assets partagés ou propres au territoire maritime :

- `public/assets/characters/pana.png` ;
- `public/assets/world/boat.png` ;
- `public/assets/world/IslandWithoutChest.png` ;
- `public/assets/world/IslandWithChest.png` ;
- `public/assets/world/Chest.png` ;
- `public/assets/world/map-island-sandbar.png` ;
- `public/assets/world/map-island-rocky.png` ;
- `public/assets/world/map-island-palms.png` ;
- illustrations de mots dans `public/assets/images/fr/words/`.

La route, les coches, les cadenas et les halos sont produits en SVG ou CSS. Ils ne nécessitent pas de raster.

La fabrication est décrite dans le [pipeline image commun](../image-generation.md). La recette visuelle actuelle de Bateau est `readingo-pana-v1`.

## Contenu et validation automatique

Le jeu ne contient aucune liste de mots dans ses composants. Il joint :

- `lessons.json` pour la structure des niveaux ;
- `words.json` pour le libellé, les syllabes, les distracteurs et les assets ;
- `syllables.json` pour les prononciations et les clips mutualisés ;
- `voice-lines.json` pour les dialogues et feedbacks.

La validation doit notamment vérifier :

- huit mots par niveau ;
- présence de chaque mot référencé ;
- nombre de syllabes et de distracteurs conforme au niveau ;
- prononciations complètes ;
- chemins d’image et d’audio ;
- absence de réponse ambiguë ;
- support des syllabes dupliquées.

## Accessibilité et mouvement réduit

- Toutes les îles jouables sont de vrais boutons accessibles.
- Les boutons iconiques possèdent un libellé.
- Le focus reste visible.
- Le niveau nouvellement débloqué reçoit le focus après l’animation.
- Les états verrouillé, terminé et courant ne reposent pas uniquement sur la couleur.
- Les sons peuvent être relancés depuis les objets pédagogiques.
- Le jeu reste compréhensible si un son échoue.
- `prefers-reduced-motion` supprime le déplacement du bateau, le défilement fluide et les animations décoratives longues.

## Mode de test

Un mode de test local permet d’ouvrir directement chaque niveau sans modifier la sauvegarde.

- Disponible uniquement sur `localhost`, `127.0.0.1` et `::1`.
- Sélecteur visible en bas de la scène.
- Paramètre direct possible, par exemple `?niveau=5`.
- La fin d’un niveau testé n’ajoute pas de coffre, de session ou de déblocage.
- L’accès au niveau testé ignore son état verrouillé, sans écraser la progression chargée.

Ce mode sert au contrôle de contenu et d’interface. Il ne doit jamais apparaître en production.

## Variations par rapport au socle commun

Bateau spécialise le socle Readingo sur les points suivants :

- progression représentée par une carte verticale ;
- score matérialisé par des coffres ;
- qualité d’un mot matérialisée par le vent et la distance ;
- transition pédagogique longue sous forme de traversée ;
- ambiance maritime persistante ;
- recette d’images adaptée aux objets détourés et aux îles de l’archipel.

Les composants tactiles, la hiérarchie des actions, les couleurs sémantiques, les règles audio, le mouvement réduit et les exigences responsive restent communs aux autres jeux.

## Critères d’acceptation

Le game design est respecté si :

- les six niveaux contiennent chacun huit mots ;
- seuls les niveaux débloqués peuvent démarrer ;
- la sélection d’une syllabe est validée immédiatement ;
- le nombre de tuiles passe de 4 à 8 selon le tableau de difficulté ;
- les mots de quatre syllabes et les syllabes dupliquées restent utilisables à 320 px ;
- le vent produit respectivement un trajet de 3, 2 ou 1 île ;
- seuls les niveaux terminés mettent à jour la sauvegarde ;
- le bateau de la carte ne rejoue un déblocage qu’une seule fois ;
- le résultat joue automatiquement « Bravo » après l’effet sonore ;
- la carte centre correctement la progression ;
- le clavier, les libellés accessibles et le mouvement réduit restent fonctionnels ;
- le mode de test donne accès aux six niveaux sans contaminer la progression.

## Évolutions futures

Les idées non implémentées doivent rester dans cette section ou dans la roadmap. Elles ne doivent pas être présentées comme des règles actuelles.

Exemples à évaluer séparément :

- choix explicite de la difficulté par un adulte ;
- nouveaux territoires maritimes après l’île au trésor ;
- objectifs pédagogiques spécialisés par son ;
- tableau de progression destiné aux parents.
