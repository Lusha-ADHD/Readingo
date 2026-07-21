# Direction Artistique et Design System

## Intention

Readingo doit donner l'impression d'une application educative premium : simple, coloree, animee, chaleureuse et solide. Le rendu ne doit pas faire cheap, generique ou bricolage.

Le territoire principal est l'Archipel des mots : un ocean fantastique, des iles, un bateau, du vent, des coffres et des tresors. La reference d'esprit reste l'immediatete et le polish d'applications comme Duolingo ou Lingokids, mais l'identite visuelle doit venir du voyage en bateau et de la chasse aux tresors.

Pana est le personnage accompagnateur. Il introduit l'aventure, rassure l'enfant et donne les consignes importantes. Il doit etre present comme compagnon de voyage, pas comme mascotte envahissante.

## Mots-Cles

- ludique
- clair
- tactile
- bienveillant
- joyeux
- premium
- progressif
- rassurant
- aventure
- tresor
- ocean

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

Le fond peut etre legerement chaud pour les pages editoriales. Les ecrans de jeu utilisent plutot une mer violette/bleue tres saturee, des iles colorees et des panneaux clairs pour la lecture. Les zones interactives doivent rester tres lisibles.

## Univers Archipel

Le jeu doit donner l'impression que l'enfant avance physiquement dans un monde.

Elements recurrents :

- mer violette/bleue avec reflets simples ;
- bateau au centre de l'action ;
- iles qui defilent de droite a gauche ;
- coffres sur certaines iles ;
- cartes, coquillages, boussoles, voiles et fanions ;
- particules de vent pour montrer la vitesse.

Le bateau reste stable au centre pendant les sequences de navigation. Le mouvement est donne par les iles et les particules qui defilent. Cette convention rend l'action plus lisible sur mobile.

## Pana

Pana est un compagnon pirate bienveillant. Il accompagne l'enfant au debut de la session puis ponctuellement lors des moments importants.

Regles visuelles :

- silhouette tres lisible ;
- regard expressif ;
- chapeau pirate sans signes agressifs ;
- pas d'armes ;
- pas de cranes ;
- couleurs chaudes pour contraster avec la mer violette ;
- utilisation en grand dans l'introduction, en plus petit pendant le jeu.

Regles UX :

- Pana parle apres une action utilisateur, jamais automatiquement au chargement ;
- les textes de Pana doivent etre courts ;
- quand Pana parle, le jeu attend la fin du dialogue avant de commencer ;
- l'enfant doit pouvoir comprendre la consigne avec la voix et le visuel.

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
- coffres collectes ;
- chemin court ;
- pas de tableau de statistiques complexe dans le MVP.

Pour les enfants de 5 a 7 ans, eviter les grands scores. Le score principal du jeu Bateau est le nombre de coffres collectes. Il reste petit, concret et facile a comprendre.

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
- mot complete : vent qui se leve, iles qui defilent, bateau qui avance ;
- coffre trouve : petit arret visuel, coffre qui s'ouvre, compteur de coffres collectes qui augmente ;
- changement de mot : le jeu revient au panneau de lecture apres la navigation.

## Vent et Tresors

Le vent traduit la rapidite et la precision.

- Vent fort : le bateau parcourt 3 iles.
- Vent moyen : le bateau parcourt 2 iles.
- Vent faible : le bateau parcourt 1 ile.

En moyenne, une ile sur deux contient un coffre. Les iles avec coffre provoquent une micro-pause : le coffre s'ouvre, un tresor est collecte, puis le bateau reprend son trajet.

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
