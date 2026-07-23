# Direction artistique et design UI Readingo

## Rôle du document

Ce document définit le langage visuel commun à tous les jeux Readingo. Il décrit les invariants de marque et d’interface, sans imposer un même décor à toutes les mécaniques.

Documents associés :

- [socle de game design](./game-design-system.md) pour les règles fonctionnelles communes ;
- [GDD de Bateau](./games/bateau.md) pour le thème de l’archipel ;
- [pipeline image](./image-generation.md) pour la production des illustrations ;
- [pipeline audio](./audio-generation.md) pour l’identité sonore.

## Intention

Readingo doit évoquer une application éducative chaleureuse, solide et immédiatement manipulable. Le rendu recherché est :

- joyeux sans être surchargé ;
- premium sans devenir froid ;
- enfantin sans être infantilisant ;
- animé sans distraire de la lecture ;
- cohérent entre plusieurs jeux et plusieurs territoires.

Pana relie les expériences. Les décors, véhicules et récompenses peuvent changer selon la thématique d’un jeu.

## Principes visuels

### Lisibilité

Le contenu pédagogique domine le décor. Une image, une syllabe ou une action principale doit rester identifiable au premier regard.

### Tactilité

Les contrôles ressemblent à des objets que l’on peut presser :

- contour épais ;
- surface colorée ;
- ombre courte ;
- changement d’état visible ;
- mouvement bref au toucher.

### Chaleur

Les formes sont arrondies, les contrastes francs et les matières légèrement illustrées. Les angles durs, textures réalistes et effets métalliques agressifs sont évités.

### Profondeur maîtrisée

Le décor peut utiliser plusieurs plans et un mouvement lent. Les panneaux pédagogiques restent stables, clairs et placés au premier plan.

## Univers commun et thèmes

Readingo se déroule dans un monde d’aventure guidé par Pana. Chaque jeu peut explorer un territoire adapté à sa mécanique : archipel, forêt, ciel, atelier, train ou autre environnement.

Éléments communs :

- Pana ;
- palette de base ;
- formes compactes ;
- contours brun foncé ;
- panneaux crème ou blancs ;
- récompenses concrètes ;
- vocabulaire visuel d’exploration et de découverte.

Éléments variables :

- décor ;
- véhicule ou objet central ;
- ambiance lumineuse ;
- motif de progression ;
- récompense ;
- bruitages d’environnement.

Une variation thématique doit être décrite dans le GDD du jeu. L’archipel, le bateau, les îles et les coffres appartiennent ainsi au thème de [Bateau](./games/bateau.md), pas à tous les jeux Readingo.

## Palette

Tokens communs de référence :

```css
:root {
  --color-bg: #fff8ec;
  --color-surface: #ffffff;
  --color-text: #203047;
  --color-muted: #6b7280;

  --color-green: #36c77b;
  --color-blue: #38a8ff;
  --color-yellow: #ffd447;
  --color-coral: #ff6b6b;
  --color-purple: #8b5cf6;

  --color-success: #26b96f;
  --color-error: #ff6b6b;
}
```

Les jeux peuvent compléter cette palette avec des couleurs de territoire. Ils ne redéfinissent pas la signification des couleurs sémantiques.

Règles :

- le fond éditorial reste chaud et discret ;
- les scènes de jeu peuvent être saturées ;
- les panneaux de lecture utilisent une surface calme ;
- le texte principal conserve un contraste élevé ;
- un état n’est jamais transmis uniquement par la couleur.

## Pana

Pana est un guide d’aventure bienveillant.

Règles visuelles :

- silhouette immédiatement reconnaissable ;
- regard expressif ;
- proportions rondes et compactes ;
- couleurs chaudes ;
- accessoires d’aventure stylisés, jamais réalistes ou menaçants ;
- aucune arme ;
- taille adaptée à son rôle : grand dans une introduction, discret dans le HUD.

Règles d’usage :

- Pana intervient pour présenter, encourager ou marquer une étape importante ;
- ses textes restent courts ;
- sa voix démarre après une interaction lorsque le navigateur l’exige ;
- il ne masque pas durablement la cible pédagogique ;
- il n’interrompt pas chaque action réussie.

## Typographie

Objectifs :

- formes de lettres claires ;
- distinction nette entre `b/d`, `p/q` et `i/l` ;
- excellente lisibilité en petite taille ;
- graisse suffisante sur les décors colorés ;
- fantaisie réservée aux titres, jamais au contenu à lire.

Familles à privilégier ou évaluer :

- Atkinson Hyperlegible ;
- Lexend ;
- Nunito Sans ;
- Andika.

La typographie du contenu pédagogique peut différer de celle des pages éditoriales si cela améliore l’apprentissage.

## Composants UI

### Boutons

- action principale visuellement dominante ;
- label court ;
- zone tactile d’au moins 44 × 44 px ;
- états normal, survol si disponible, pressé, désactivé et chargement ;
- ombre qui se réduit à l’enfoncement ;
- icône accompagnée d’un libellé accessible.

### Bouton audio

Le haut-parleur utilise le même composant dans tous les jeux :

- forme et dimensions stables ;
- contraste élevé ;
- état pressé visible ;
- libellé accessible décrivant le contenu lu ;
- placement dans le coin supérieur droit de l’objet associé lorsque l’audio appartient à une carte, une image ou une tuile.

L’image et une tuile de syllabe ne doivent pas définir deux variantes incompatibles de ce contrôle.

### Cartes et tuiles pédagogiques

- taille stable à l’intérieur d’une même grille ;
- contour lisible ;
- texte centré ;
- états correct et incorrect distincts ;
- contenu jamais tronqué ;
- grille calculée selon l’espace disponible.

### Emplacements de réponse

- visibles avant l’action ;
- contour pointillé ou surface douce ;
- même rythme visuel que les tuiles ;
- largeur distribuée selon le nombre d’unités ;
- alignement sur une ligne lorsque l’espace et la taille tactile le permettent.

### Panneaux

- surface calme, généralement crème ou blanche ;
- bordure forte sur un décor saturé ;
- rayon cohérent ;
- marges internes généreuses mais compressibles sur petit écran ;
- une seule action principale.

#### Compacité obligatoire

Un panneau ne reçoit jamais une grande hauteur fixe pour équilibrer une composition. Sa hauteur
vient de son contenu, avec seulement les marges nécessaires à la lisibilité et aux zones tactiles.
Le décor et les personnages doivent rester visibles autour de l’interface.

- séparer une bulle de dialogue du panneau de réponses ;
- ancrer les réponses en bas de la scène sans leur faire occuper tout l’espace disponible ;
- préférer `height: auto`, `fit-content` et une largeur maximale responsive ;
- réserver une hauteur fixe aux seules grilles dont la stabilité évite un déplacement gênant ;
- vérifier chaque état avec son contenu le plus long à 320 px avant d’ajouter de l’espace vide ;
- ne jamais masquer durablement un personnage ou un élément narratif pour remplir un panneau.

### HUD et progression

Le HUD montre seulement les informations utiles pendant l’action :

- niveau ou étape ;
- progression immédiate ;
- récompense pertinente ;
- réglage indispensable.

Le type de récompense et sa représentation sont définis par le GDD de chaque jeu.

## États et feedback

### Réussite

- couleur positive ;
- petit rebond ou éclat ;
- son bref ;
- progression visible.

### Erreur

- tremblement doux ;
- couleur d’attention non agressive ;
- retour rapide à l’état manipulable ;
- aucune perte ou formulation culpabilisante.

### Verrouillage

- contraste et saturation réduits ;
- pictogramme ou texte explicite ;
- état désactivé réel ;
- information non dépendante de la couleur.

## Animation

Repères :

- réaction simple : 120 à 180 ms ;
- transition de panneau : 220 à 400 ms ;
- progression narrative : durée définie dans le GDD ;
- léger easing élastique uniquement pour une réussite.

Les animations doivent expliquer une sélection, une validation, un déplacement ou une récompense. Les boucles décoratives restent lentes et peu contrastées.

`prefers-reduced-motion` :

- supprime les grands déplacements ;
- remplace les transitions par un fondu d’environ 150 ms ;
- conserve l’état final et le feedback essentiel ;
- ne retarde jamais l’interaction.

## Direction sonore

L’identité sonore suit les mêmes principes que l’image :

- sons courts et doux ;
- voix pédagogique prioritaire ;
- ambiances discrètes ;
- même signification pour un son UI mutualisé ;
- variation thématique réservée aux ambiances et objets du monde.

Les formats, commandes et règles d’intégration vivent dans le [pipeline audio](./audio-generation.md).

## Direction des images

Invariants :

- sujet immédiatement reconnaissable ;
- silhouette compacte ;
- contour brun foncé ;
- formes lisses et arrondies ;
- palette chaude complétée par du turquoise ;
- ombrage 2D doux ;
- aucun texte intégré ;
- niveau de détail compatible avec la taille réelle d’affichage.

Le format dépend de l’usage :

- carré détouré pour une illustration de mot ;
- transparent compact pour un objet de monde ;
- décor large ou tuile répétable pour un environnement ;
- portrait détouré pour un personnage.

La recette, les références et l’historique de génération sont décrits dans le [pipeline image](./image-generation.md). Une nouvelle thématique peut créer une recette dérivée documentée, sans perdre les invariants Readingo.

## Responsive

Le mobile portrait est prioritaire.

Contraintes :

- largeur minimale : 320 px ;
- aucune interaction dépendante du survol ;
- aucun débordement horizontal ;
- texte non tronqué dans les boutons ;
- grilles fluides sans exception par contenu ;
- décor autorisé à être rogné avant l’interface ;
- hauteur adaptée au viewport dynamique ;
- tablette et bureau fondés sur la même hiérarchie.

Les contrôles ne doivent pas être réduits jusqu’à devenir difficiles à toucher pour préserver un espace décoratif.

## Accessibilité

Minimum :

- contraste suffisant ;
- libellés accessibles ;
- état désactivé sémantique ;
- feedback visuel en complément du son ;
- mouvement réduit ;
- contenu utilisable au zoom ;
- langage court et compréhensible.

Les jeux sont conçus pour le toucher et la souris. Ils n’ajoutent pas de navigation clavier ou de gestion programmatique du focus.

Les besoins propres à une mécanique sont précisés dans son GDD.
