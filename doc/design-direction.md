# Direction Artistique et Design System

## Intention

Readingo doit donner l'impression d'une application educative premium : simple, coloree, animee, chaleureuse et solide. Le rendu ne doit pas faire cheap, generique ou bricolage.

La reference d'esprit est Duolingo : immediatete, lisibilite, recompense, rythme, humour leger. Il ne faut pas copier son style graphique, mais viser le meme niveau de clarte et de polish.

## Mots-Cles

- ludique
- clair
- tactile
- bienveillant
- joyeux
- premium
- progressif
- rassurant

## Palette

La palette doit etre vive mais equilibree. Eviter une interface dominee par une seule couleur.

Proposition de tokens :

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
  --color-focus: #1d4ed8;
}
```

Le fond peut etre legerement chaud, mais les zones interactives doivent rester tres lisibles.

## Typographie

Objectifs :

- lisibilite maximale ;
- formes de lettres claires pour enfants ;
- pas de police trop fantaisie ;
- bonne distinction entre b/d, p/q, i/l.

Pistes :

- Atkinson Hyperlegible ;
- Lexend ;
- Nunito Sans ;
- Andika.

Pour l'apprentissage de la lecture, il faudra tester la lisibilite des lettres minuscules. La typographie du jeu peut differer legerement de la typographie editoriale si necessaire.

## Composants UI

### Boutons

- grands ;
- contrastes ;
- etats hover/pressed/focus ;
- feedback tactile visible ;
- icone quand utile ;
- label court.

### Cartes de Syllabes

Les cartes doivent ressembler a des objets manipulables :

- taille stable ;
- ombre courte ;
- bord epais ou contour clair ;
- etat "selectionne" ;
- etat "correct" ;
- etat "incorrect" ;
- animation au drag.

### Zones de Depot

Les zones de depot doivent etre visibles avant l'action :

- emplacement clair ;
- contour pointille ou surface douce ;
- changement d'etat quand une carte survole la zone ;
- taille suffisante sur mobile.

### Barre de Progression

La progression doit etre simple :

- nombre de mots restants ;
- etoiles ;
- chemin court ;
- pas de tableau de statistiques complexe dans le MVP.

## Animation

Les animations doivent etre courtes, energiques et lisibles :

- 120 a 180 ms pour les reactions simples ;
- 250 a 400 ms pour les transitions de mot ;
- easing elastique leger pour les succes ;
- pas d'animation permanente inutile.

Exemples :

- carte correcte : scale 1.06 puis retour a 1 ;
- erreur : shake horizontal doux ;
- mot complete : confettis legers + image qui rebondit ;
- changement de mot : sortie douce, entree rapide.

## Sound Design

Le son est une partie centrale du produit.

Il faut prevoir :

- voix pour lettres ;
- voix pour syllabes ;
- voix pour mots ;
- consignes courtes ;
- feedbacks positifs ;
- feedbacks d'erreur doux ;
- sons UI courts.

Principes :

- volume normalise ;
- pas de sons agressifs ;
- pas de musique bouclee au MVP ;
- bouton son visible et facile a trouver ;
- pas de lecture automatique excessive apres la premiere interaction.

## Direction des Images IA

Les images doivent etre generees avec une charte stricte.

Contraintes :

- sujet centre ;
- fond simple ;
- pas de texte dans l'image ;
- forme identifiable par un enfant ;
- style coherent sur toute la bibliotheque ;
- couleurs compatibles avec l'interface ;
- pas de details ambigus ;
- format carre ou 4:3 selon le jeu.

Prompt de reference a affiner :

```txt
Illustration 3D douce pour enfant, objet unique centre, fond clair uni,
formes simples, couleurs joyeuses, lumiere douce, style coherent application
educative premium, pas de texte, pas de decor complexe.
```

Chaque image doit etre validee humainement. Pour l'apprentissage de la lecture, une image ambigue peut nuire a l'exercice.

## Responsive

Le jeu doit etre prioritaire en mobile portrait.

Contraintes :

- largeur minimale cible : 360 px ;
- zones tactiles de 44 px minimum ;
- cartes manipulables au doigt ;
- aucune action necessitant un hover ;
- pas de texte qui deborde dans les boutons ;
- mode tablette avec plus d'espace mais meme logique ;
- desktop compatible souris.

## Accessibilite

MVP :

- contraste suffisant ;
- focus clavier visible ;
- boutons avec labels accessibles ;
- controle du son ;
- pas d'information transmise uniquement par couleur ;
- support clavier basique sur les jeux simples.

Plus tard :

- mode dyslexie/lisibilite ;
- rythme ralenti ;
- reduction des animations ;
- choix de casse typographique.

