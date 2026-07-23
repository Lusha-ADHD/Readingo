# Socle de Game Design Readingo

## Rôle du document

Ce document définit les règles communes à tous les jeux Readingo. Il ne décrit pas une mécanique particulière : chaque jeu possède son propre Game Design Document dans `doc/games/`.

Le socle commun garantit que plusieurs jeux, même construits autour de thèmes différents, donnent l’impression d’appartenir au même produit.

## Vision produit

Readingo est une collection de jeux courts pour apprendre à lire. L’enfant doit pouvoir :

- comprendre l’action principale sans lire une longue consigne ;
- écouter les éléments pédagogiques autant de fois que nécessaire ;
- essayer sans craindre l’erreur ;
- percevoir immédiatement sa progression ;
- terminer une session courte avec une réussite claire.

Le parent doit pouvoir identifier la compétence travaillée, comprendre la progression et laisser l’enfant rejouer avec peu d’assistance.

## Public et contexte

- Cœur de cible : enfants de 5 à 7 ans.
- Usage accompagné au départ, puis progressivement autonome.
- Sessions visées : environ 3 à 7 minutes.
- Appareils prioritaires : téléphone en portrait et tablette.
- Appareils supportés : largeur à partir de 320 px, tablette et bureau.

## Piliers communs

### Clarté

Chaque écran possède une action principale évidente. Les informations secondaires restent visuellement en retrait.

### Manipulation

Les réponses se donnent principalement par toucher ou clic. Les éléments interactifs ressemblent à des objets manipulables et possèdent des états normal, pressé, validé, incorrect, désactivé et focus.

### Écoute

Un élément pédagogique sonore possède un bouton audio identifiable. Les clips préenregistrés sont prioritaires ; la synthèse vocale du navigateur n’est qu’un repli.

### Bienveillance

Une erreur déclenche un retour court, doux et réversible. Elle ne retire pas de points, n’interrompt pas la session et ne produit pas de message culpabilisant.

### Progression concrète

La progression utilise de petits nombres, des objets visibles ou un trajet. Les statistiques détaillées sont destinées aux adultes et ne doivent pas dominer l’interface enfant.

### Cohérence

Pana, les couleurs, les formes, les sons UI et les conventions d’interaction sont partagés. La thématique d’un jeu peut varier, mais pas la grammaire générale du produit.

## Univers commun et thèmes de jeu

Readingo se déroule dans un monde d’aventure chaleureux guidé par Pana. Ce monde peut contenir plusieurs territoires : archipel, ciel, forêt, atelier, train ou autre environnement adapté à la mécanique.

Ce qui reste commun :

- Pana comme guide bienveillant ;
- une esthétique colorée, tactile et lisible ;
- des silhouettes compactes et des contours marqués ;
- des panneaux clairs posés sur un décor vivant ;
- des récompenses concrètes et non compétitives ;
- un vocabulaire d’aventure, de découverte et de progression.

Ce qui peut varier par jeu :

- le territoire et son décor ;
- le véhicule ou l’objet central ;
- la forme de la récompense ;
- les animations de transition ;
- les bruitages d’ambiance ;
- la représentation de la progression.

Une variation thématique ne doit jamais modifier sans raison les composants de base, les couleurs sémantiques, les tailles tactiles ou la manière d’écouter un contenu.

## Structure commune d’une session

Tous les jeux devraient suivre cette structure, avec les adaptations précisées dans leur GDD :

```text
Entrée
  → consigne courte
  → sélection éventuelle d’un niveau
  → série d’exercices
      → présentation
      → action
      → validation
      → feedback
  → résultat
  → rejouer, continuer ou revenir au parcours
```

La consigne audio ne démarre qu’après une interaction utilisateur lorsque le navigateur l’exige.

## Structure commune d’un exercice

1. Présenter une cible pédagogique claire.
2. Rendre l’audio de la cible disponible.
3. Afficher les réponses ou objets manipulables.
4. Accepter une action simple.
5. Valider immédiatement.
6. Jouer le son pédagogique pertinent.
7. Montrer un feedback visuel court.
8. Passer à l’exercice ou à la récompense suivante.

Le jeu ne doit pas demander simultanément plusieurs gestes différents sans phase d’apprentissage explicite.

## Difficulté

La difficulté peut progresser par :

- longueur des mots ou unités ;
- nombre de choix ;
- proximité des distracteurs ;
- complexité phonologique ou orthographique ;
- nombre d’étapes ;
- réduction des indices ;
- vitesse, uniquement lorsqu’elle reste non punitive.

Chaque GDD doit séparer :

- la difficulté pédagogique ;
- la difficulté d’interface ;
- la difficulté liée au rythme.

Ajouter des choix ne doit pas rendre les boutons illisibles ou trop petits. La grille doit se réorganiser selon la largeur disponible.

## Scoring et récompenses

Principes :

- pas de score négatif ;
- pas de classement entre enfants ;
- pas de pression temporelle affichée ;
- récompenses fréquentes mais compréhensibles ;
- meilleur résultat conservé lorsqu’il aide à rejouer ;
- total cumulé possible pour matérialiser l’aventure.

Le GDD de chaque jeu définit l’unité de score, son mode de calcul et son effet sur la progression.

## UI commune

Les spécifications visuelles détaillées vivent dans [Direction artistique et design system](./design-direction.md).

Conventions fonctionnelles :

- bouton principal unique par panneau ;
- zones tactiles visées de 44 × 44 px ;
- bouton audio placé de manière cohérente sur l’objet associé ;
- texte court et jamais tronqué ;
- grille responsive pilotée par l’espace disponible, pas par une liste d’exceptions par niveau ;
- focus clavier visible ;
- état désactivé compréhensible sans dépendre uniquement de la couleur ;
- HUD limité au niveau, à la progression immédiate et à la récompense utile.

## Feedback et animation

Les animations servent à expliquer :

- sélection : enfoncement ou changement d’état ;
- réussite : rebond court, couleur positive et son ;
- erreur : tremblement doux et retour à l’état initial ;
- progression : déplacement ou remplissage visible ;
- récompense : apparition claire de l’objet gagné.

Les animations permanentes restent discrètes. `prefers-reduced-motion` doit supprimer les déplacements non essentiels et conserver un fondu court.

## Audio commun

Le pipeline et les formats sont décrits dans [Pipeline audio](./audio-generation.md).

Règles de game design :

- le son pédagogique est plus important que le son décoratif ;
- une nouvelle lecture interrompt proprement la précédente ;
- les ambiances restent sous les voix ;
- une erreur utilise un son doux ;
- les boucles de mouvement s’arrêtent lorsque le mouvement visuel s’arrête ;
- un jeu reste jouable si un clip ne peut pas être chargé.

## Images communes

Le pipeline de génération est décrit dans [Pipeline image](./image-generation.md).

Règles de game design :

- une illustration pédagogique représente un sujet unique et non ambigu ;
- le sujet reste lisible à petite taille ;
- aucun texte n’est intégré dans l’image ;
- les assets de monde et de personnages suivent la même direction artistique ;
- une variation de thème peut définir une recette dérivée, mais elle doit conserver les proportions, contours, couleurs et contraintes techniques communes.

## Contenu piloté par les données

Les jeux consomment les fichiers de `src/content/<locale>/`. Ils ne doivent pas définir leurs listes de mots directement dans les composants.

Le modèle commun et les règles d’internationalisation sont décrits dans [Contenu et assets](./content-assets.md).

Chaque jeu doit documenter :

- les fichiers qu’il consomme ;
- les champs obligatoires ;
- les règles de validation ;
- la relation entre niveau, contenu et assets ;
- les éventuelles variantes propres au jeu.

## Sauvegarde

La sauvegarde locale doit :

- être versionnée ;
- tolérer les données absentes ou corrompues ;
- migrer les versions antérieures lorsque cela est raisonnable ;
- ne valider une récompense qu’à la fin de l’unité prévue ;
- distinguer progression, meilleur résultat et cumul ;
- ne jamais empêcher de jouer si `localStorage` est indisponible.

Chaque GDD décrit précisément ce qui est enregistré et à quel moment.

## Responsive et accessibilité

Minimum commun :

- contrôle à 320, 375, 768 px et bureau ;
- aucune barre de défilement horizontale involontaire ;
- contenu principal utilisable avec zoom ;
- navigation clavier pour les actions essentielles ;
- libellés accessibles pour les boutons iconiques ;
- ordre de focus logique ;
- contraste suffisant ;
- support de `prefers-reduced-motion` ;
- aucun feedback transmis uniquement par couleur ou son.

## Pipelines communs et variations

Les pipelines audio et image sont communs à tous les jeux :

```text
Donnée pédagogique
  → spécification de l’asset
  → génération ou acquisition
  → transformation technique
  → intégration au manifeste de contenu
  → validation automatique
  → contrôle en situation dans le jeu
```

Une variation propre à un jeu peut modifier :

- la recette visuelle ;
- le type de cadrage ;
- le format d’un décor ;
- la voix ou l’intention d’un dialogue ;
- la famille de bruitages ;
- les références de style.

Elle ne doit pas modifier sans documentation :

- le nommage des fichiers ;
- les règles de transparence ;
- les formats de sortie ;
- l’historique de génération ;
- les règles de sécurité des clés ;
- les validateurs communs.

## Modèle de GDD pour un nouveau jeu

Chaque fichier `doc/games/<jeu>.md` doit contenir :

1. statut et sources de vérité ;
2. résumé du jeu ;
3. public et objectif pédagogique ;
4. piliers propres au jeu ;
5. thème et place dans l’univers Readingo ;
6. boucle macro et boucle d’exercice ;
7. contrôles et règles de validation ;
8. progression et difficulté ;
9. scoring et récompenses ;
10. écrans, HUD et états UI ;
11. feedback, animation et son ;
12. contenu et assets ;
13. sauvegarde ;
14. responsive et accessibilité ;
15. mode de test ;
16. critères d’acceptation ;
17. variations par rapport au socle commun ;
18. pistes futures clairement séparées du comportement actuel.

## Critères de cohérence pour les futurs jeux

Un nouveau jeu est cohérent avec Readingo si :

- Pana et le ton général restent reconnaissables ;
- l’enfant retrouve les conventions de bouton, audio et feedback ;
- la mécanique sert une compétence pédagogique explicite ;
- la thématique enrichit la mécanique sans masquer la consigne ;
- les assets passent par les pipelines communs ;
- le GDD décrit les variations au lieu de dupliquer le design system ;
- les tests responsive et d’accessibilité couvrent les mêmes seuils que les autres jeux.
