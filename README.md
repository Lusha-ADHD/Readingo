# Readingo — Documentation produit

Readingo est un site de mini-jeux gratuits pour aider les enfants de 5 à 7 ans à apprendre les bases de la lecture, en français dans un premier temps.

Le produit est pensé pour être utilisé d’abord par un parent avec son enfant, puis progressivement par l’enfant en autonomie. Il n’y a pas de séparation stricte entre espace parent et espace enfant : l’expérience doit rester commune, simple et suffisamment explicite pour qu’un enfant puisse relancer une partie ou changer de jeu seul.

## Documentation

La documentation permet d’ajouter de nouveaux jeux sans recopier les mêmes règles de direction artistique, d’interface, d’accessibilité ou de production d’assets.

Ordre de lecture :

1. le socle commun définit ce que tous les jeux Readingo partagent ;
2. chaque jeu possède son propre Game Design Document ;
3. les documents de production expliquent comment fabriquer le contenu et les assets ;
4. le code et les fichiers de contenu restent la source de vérité pour les valeurs techniques exactes.

### Sources de vérité

| Sujet | Document principal |
| --- | --- |
| Principes communs à tous les jeux | [Socle de game design](./doc/game-design-system.md) |
| Direction artistique et composants UI | [Direction artistique et design UI](./doc/design-direction.md) |
| Parcours utilisateur et principes UX | [Expérience utilisateur et gameplay](./doc/ux-gameplay.md) |
| Game design du jeu Bateau | [Jeu Bateau — Game Design Document](./doc/games/bateau.md) |
| Prototype du jeu Lettres | [Jeu Lettres — Game Design Document](./doc/games/lettres.md) |
| Modèle de contenu pédagogique | [Contenu pédagogique et assets](./doc/content-assets.md) |
| Génération et intégration des voix | [Pipeline audio](./doc/audio-generation.md) |
| Génération des illustrations | [Pipeline image](./doc/image-generation.md) |
| Choix d’architecture et conventions techniques | [Choix techniques](./doc/technical-stack.md) |
| Planification historique et travaux futurs | [Roadmap](./doc/roadmap.md) |
| Ton éditorial et pages destinées aux parents | [Lignes éditoriales](./doc/editorial-guidelines.md) |

### Hiérarchie des décisions

En cas de contradiction :

1. une règle pédagogique ou fonctionnelle propre à un jeu est définie dans son GDD ;
2. une règle visuelle ou UX commune est définie dans le socle commun ou le design UI ;
3. une procédure de fabrication est définie dans le pipeline audio ou image ;
4. une valeur calculée, un chemin d’asset ou un schéma de sauvegarde est vérifié dans le code et les données ;
5. la roadmap décrit une intention ou un historique, jamais le comportement actuel.

Un GDD peut spécialiser une règle commune lorsqu’une mécanique le justifie. La variation doit être indiquée dans sa section « Variations par rapport au socle commun ».

### Ajouter un nouveau jeu

Avant l’implémentation :

1. créer `doc/games/<nom-du-jeu>.md` à partir du modèle du [socle de game design](./doc/game-design-system.md) ;
2. définir l’objectif pédagogique, la boucle principale et la progression ;
3. choisir une thématique compatible avec l’univers Readingo ;
4. réutiliser les composants UI et les comportements audio communs ;
5. lister les assets partagés et ceux propres au jeu ;
6. documenter les variations de pipeline avant de produire les assets ;
7. définir les critères de validation responsive, audio et mouvement réduit.

### Entretien de la documentation

- Éviter de recopier une règle commune dans chaque GDD : utiliser un lien.
- Conserver dans le GDD les décisions qui modifient l’expérience du joueur.
- Conserver dans les pipelines les recettes de production, commandes et formats.
- Mettre à jour le GDD et les validateurs avec tout changement de difficulté ou de progression.
- Marquer les concepts non implémentés comme « proposition » ou « futur ».

## Positionnement

Readingo doit combiner trois objectifs :

- proposer une experience ludique et qualitative, proche d'une application mobile educative premium ;
- creer un socle SEO solide autour de l'apprentissage de la lecture pour les enfants de 5 a 7 ans ;
- offrir un support naturel pour mettre en avant d'autres produits ou applications, sans perturber l'experience de jeu.

## Principes produit

- L'enfant doit comprendre quoi faire sans lire beaucoup de texte.
- Le parent doit comprendre la valeur pedagogique en quelques secondes.
- Les jeux doivent etre courts, rejouables, progressifs et bienveillants.
- Les feedbacks doivent etre immediats : animation, son, couleur, progression.
- Le site doit rester gratuit et accessible sans creation de compte.
- Les assets doivent etre coherents, propres et valides humainement.
- Le contenu doit etre structure pour faciliter l'ajout de nouvelles langues.

## Droits d'utilisation

Copyright 2026 Readingo. Tous droits reserves.

Ce depot est public afin de permettre la consultation du projet. Sauf autorisation ecrite prealable, aucune licence n'est accordee pour copier, modifier, reutiliser, publier ou redistribuer les elements originaux du projet. La mise a disposition sur GitHub reste soumise aux droits prevus par les conditions d'utilisation de la plateforme.

Les bibliotheques, outils et ressources provenant de tiers restent soumis a leurs licences respectives.
