# Experience Utilisateur et Gameplay

## Hypothese d'Usage

L'utilisateur initial est le parent. Il arrive sur le site via une recherche, un lien ou une recommandation, puis lance une activite avec son enfant.

Le produit ne separe pas l'espace parent et l'espace enfant. Toute l'experience est commune, mais elle doit avoir deux niveaux de lecture :

- pour le parent : comprendre rapidement l'objectif pedagogique et choisir une activite pertinente ;
- pour l'enfant : voir immediatement quoi toucher, quoi ecouter et comment rejouer.

Le parent doit pouvoir accompagner sans mode d'emploi. L'enfant doit pouvoir relancer une partie ou changer de jeu seul apres une premiere session.

## Premiere Impression

La premiere page doit donner acces directement au jeu. Elle ne doit pas ressembler a une landing page marketing.

Elements prioritaires :

- bouton principal "Jouer" tres visible ;
- choix rapide d'une activite ;
- progression simple ;
- indication d'age et de competence travaillee ;
- acces discret aux pages d'information pour les parents.

Exemple de structure :

```txt
[Logo Readingo]              [Son on/off]

Bonjour !
Que veux-tu travailler ?

[Lettres] [Syllabes] [Mots]

[Continuer]   [Changer de jeu]

Progression du jour : 3 mots reussis
```

## Principes UX

- Chaque ecran doit avoir une action principale evidente.
- Les textes doivent etre courts et lus par la voix quand c'est utile.
- Les zones tactiles doivent etre grandes.
- Les erreurs doivent etre douces et encourageantes.
- Les animations doivent confirmer l'action de l'enfant.
- Le score doit encourager, jamais stresser.
- Le jeu doit fonctionner en portrait mobile, paysage tablette et desktop.

## Navigation

Navigation cible :

- Accueil jouable
- Selection de jeu
- Selection de niveau
- Partie
- Fin de session
- Pages SEO et conseils accessibles depuis le bas de page ou des liens secondaires

Il ne faut pas cacher la navigation derriere une interface parentale complexe. Le changement de jeu doit etre possible depuis une icone simple ou un bouton clair.

## Jeu Principal : Bateau

### Objectif

Construire un mot a partir de syllabes.

Exemple corrige :

- image : chaton
- mot attendu : chaton
- syllabes correctes : "cha", "ton"
- distracteurs : "ba", "ti"

Note : "chaton" doit etre utilise sans accent pour designer le petit chat. La graphie avec accent circonflexe sur le "a" renvoie a un autre sens en francais et doit etre evitee dans ce jeu.

### Boucle de Jeu

1. Une image apparait au centre.
2. Le mot est prononce.
3. Des cartes de syllabes apparaissent.
4. L'enfant peut toucher une syllabe pour l'entendre.
5. L'enfant glisse les syllabes dans les emplacements.
6. Le jeu valide chaque depot.
7. Si la syllabe est correcte, elle se fixe avec un feedback positif.
8. Si la syllabe est incorrecte, elle revient doucement a sa position.
9. Quand le mot est complet, le mot entier est prononce.
10. Le score/progres est mis a jour.
11. Le jeu passe au mot suivant.

### Feedback Positif

Un feedback positif doit combiner :

- petit son court ;
- rebond de la carte ;
- couleur de validation ;
- progression visible ;
- voix optionnelle : "Bravo", "Oui", "C'est ca".

### Feedback Negatif

Un feedback negatif doit rester bienveillant :

- tremblement court ;
- retour automatique de la carte ;
- son doux, non agressif ;
- voix optionnelle : "Essaie encore".

Pas de buzzer dur, pas de rouge agressif, pas de message culpabilisant.

### Scoring

Le scoring sert a motiver, pas a evaluer strictement.

Proposition :

- +100 points par mot complete ;
- +50 bonus sans erreur ;
- +0 a +50 bonus rapidite ;
- etoiles visuelles par session ;
- badge apres une serie de reussites.

Le timer ne doit pas etre central visuellement. Pour cet age, la pression temporelle doit rester secondaire.

## Autres Mini-Jeux

### Lettres Magiques

Objectif : reconnaitre une lettre entendue.

Gameplay :

- une voix dit "Trouve la lettre M" ;
- plusieurs lettres apparaissent ;
- l'enfant touche la bonne lettre ;
- progression vers majuscule/minuscule.

### Ballons Sons

Objectif : associer un son a une lettre ou une syllabe.

Gameplay :

- des ballons montent doucement ;
- chaque ballon contient une lettre ou syllabe ;
- l'enfant touche celui qui correspond au son entendu.

### Train des Syllabes

Objectif : remettre les syllabes dans l'ordre.

Gameplay :

- une locomotive attend des wagons ;
- chaque wagon contient une syllabe ;
- l'enfant place les wagons dans l'ordre du mot.

### Mot Mystere

Objectif : completer un mot avec une syllabe manquante.

Gameplay :

- image + mot partiellement affiche ;
- l'enfant choisit la syllabe manquante ;
- le mot complet est prononce.

### Image-Mot

Objectif : associer image, son et mot ecrit.

Gameplay :

- une image est affichee ;
- trois mots sont proposes ;
- l'enfant touche le bon mot.

## Progression Pedagogique

La progression doit suivre une logique simple :

1. Reconnaitre les lettres majuscules.
2. Associer majuscules et minuscules.
3. Identifier des sons simples.
4. Former des syllabes simples.
5. Lire des mots courts.
6. Manipuler des sons complexes.
7. Lire des mots plus longs.
8. Lire de petites phrases.

## Fin de Session

Une session doit durer environ 3 a 7 minutes.

Ecran de fin :

- nombre de mots ou lettres reussis ;
- etoiles gagnees ;
- bouton "Rejouer" ;
- bouton "Changer de jeu" ;
- suggestion douce : "Encore 3 mots demain".

La promotion d'autres produits peut apparaitre ici, mais uniquement comme contenu secondaire et non bloquant.
