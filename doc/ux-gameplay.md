# Expérience utilisateur et gameplay

## Rôle du document

Ce document décrit le parcours global autour des jeux Readingo. Les principes de conception communs sont dans le [socle de game design](./game-design-system.md), tandis que chaque mécanique possède son propre GDD.

## Deux niveaux de lecture

Le parent arrive généralement par une recherche, un lien ou une recommandation. L’enfant devient ensuite l’utilisateur principal de la partie.

L’expérience doit donc permettre :

- au parent de comprendre l’âge, la compétence et la durée ;
- à l’enfant d’identifier immédiatement quoi toucher et quoi écouter ;
- aux deux de relancer ou changer de jeu sans mode d’emploi.

Il n’est pas nécessaire de créer deux interfaces séparées au début. La hiérarchie visuelle distingue le contexte destiné au parent de l’action destinée à l’enfant.

## Entrée dans Readingo

La page d’entrée donne rapidement accès aux activités. Elle ne doit pas repousser le jeu derrière une longue présentation marketing.

Priorités :

- action « Jouer » visible ;
- objectif pédagogique compréhensible ;
- choix d’une activité ;
- reprise de la progression locale ;
- informations parentales secondaires mais accessibles.

## Navigation

Parcours cible :

```text
Accueil
  → choix d’un jeu
  → présentation courte
  → carte ou sélection de niveau
  → partie
  → résultat
  → continuer, rejouer ou changer de jeu
```

Règles :

- une action principale par écran ;
- retour ou fermeture explicite ;
- changement de jeu accessible hors d’un exercice actif ;
- aucune navigation essentielle cachée derrière un geste non indiqué ;
- progression locale chargée sans imposer de compte.

## Avant une partie

Le joueur doit comprendre :

- ce qu’il va travailler ;
- comment donner une réponse ;
- comment écouter ;
- quelle unité constitue une session.

Une introduction parlée peut compléter le visuel, mais elle commence après l’interaction nécessaire à l’audio navigateur. Une consigne déjà comprise ne doit pas être répétée avant chaque exercice.

## Pendant une partie

Une partie alterne :

1. cible pédagogique ;
2. action ;
3. validation immédiate ;
4. feedback ;
5. progression.

Le décor peut raconter une aventure, mais ne doit pas déplacer les commandes de manière imprévisible. Les transitions plus longues ont une fonction de récompense et peuvent être passées.

## Erreur et réussite

Une réussite combine au moins deux formes de retour parmi :

- changement d’état ;
- animation courte ;
- son ;
- progression visible ;
- récompense.

Une erreur :

- explique quel objet doit être réessayé ;
- rend rapidement le contrôle ;
- ne retire rien ;
- évite le buzzer agressif et le rouge dominant ;
- ne déclenche pas une longue prise de parole.

## Fin de session

Une session cible dure environ 3 à 7 minutes.

Le résultat :

- nomme clairement la réussite ;
- montre une petite quantité compréhensible ;
- propose une action principale pour continuer ;
- laisse le joueur observer son résultat ;
- sépare les suggestions destinées au parent des récompenses enfant.

La promotion d’un autre produit ne doit jamais ressembler à un coffre, un badge ou une récompense du jeu.

## Progression pédagogique globale

La collection Readingo peut couvrir progressivement :

1. reconnaissance des lettres ;
2. association des formes majuscules et minuscules ;
3. identification de sons simples ;
4. formation de syllabes ;
5. lecture de mots courts ;
6. manipulation de sons complexes ;
7. lecture de mots longs ;
8. lecture de phrases courtes.

Cette séquence est une orientation de collection. Chaque jeu précise son périmètre réel et ses prérequis dans son GDD.

## Jeux documentés

### Bateau

Bateau fait recomposer des mots à partir de syllabes et transforme chaque réussite en traversée maritime.

Sa boucle, ses six niveaux, sa carte, son scoring, sa sauvegarde et son mode de test sont décrits dans le [Game Design Document de Bateau](./games/bateau.md).

## Concepts de jeux futurs

Les concepts ci-dessous ne sont pas des fonctionnalités implémentées. Chacun devra recevoir un GDD avant sa conception visuelle ou son développement.

### Lettres magiques

Reconnaître une lettre entendue parmi plusieurs formes.

### Ballons sons

Associer un son à une lettre ou une syllabe portée par un objet en mouvement.

### Train des syllabes

Remettre les syllabes d’un mot dans l’ordre sous la forme de wagons.

### Mot mystère

Compléter un mot avec une syllabe manquante.

### Image-mot

Associer une image et un son au mot écrit correspondant.

Ces thèmes peuvent employer des territoires différents tout en réutilisant Pana, les composants UI, les conventions audio et les pipelines d’assets.
