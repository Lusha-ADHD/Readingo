# Roadmap d'Implementation

## Phase 0 - Cadrage

Objectif : verrouiller les fondations produit avant de coder trop large.

Livrables :

- nom du projet confirme ;
- stack valide ;
- structure des donnees ;
- direction artistique initiale ;
- liste de 30 premiers mots ;
- regles de generation des assets ;
- premiere arborescence du repo.

Definition of Done :

- un document de contenu existe ;
- chaque mot MVP a syllabes, distracteurs, image cible et audio cible ;
- la direction graphique est suffisamment precise pour produire des assets coherents.

## Phase 1 - Setup Technique

Objectif : obtenir un site deployable sur GitHub Pages.

Taches :

- initialiser Astro + React + TypeScript ;
- configurer le routage ;
- ajouter CSS Modules ou structure CSS globale avec tokens ;
- configurer GitHub Actions ;
- configurer le deploiement GitHub Pages ;
- ajouter les premieres pages statiques ;
- ajouter une page de jeu vide.

Definition of Done :

- `npm run build` fonctionne ;
- le site est deployable sur GitHub Pages ;
- la page d'accueil s'affiche correctement sur mobile et desktop.

## Phase 2 - Design System MVP

Objectif : construire les composants UI de base.

Taches :

- tokens couleurs ;
- typographie ;
- boutons ;
- cartes de syllabes ;
- zones de depot ;
- barre de progression ;
- bouton audio ;
- ecran de fin de session ;
- etats focus/accessibilite.

Definition of Done :

- les composants sont reutilisables ;
- les etats normal, hover, pressed, disabled et focus sont couverts ;
- le rendu mobile ne deborde pas ;
- le style ne ressemble pas a une interface generique.

## Phase 3 - Mini-Jeu Bateau

Objectif : livrer le premier jeu complet.

Taches :

- charger une liste de mots depuis JSON ;
- afficher image, syllabes et zones de depot ;
- gerer clic audio sur image ;
- gerer clic audio sur syllabe ;
- gerer drag and drop souris et tactile ;
- valider les syllabes ;
- ajouter feedback positif/negatif ;
- calculer score ;
- passer au mot suivant ;
- gerer fin de session ;
- sauvegarder progression locale.

Definition of Done :

- le jeu fonctionne sur mobile, tablette et desktop ;
- un enfant peut rejouer sans aide apres une premiere demonstration ;
- les feedbacks sont immediats ;
- les erreurs ne bloquent pas ;
- le score est mis a jour correctement.

## Phase 4 - Assets MVP

Objectif : remplacer les placeholders par des assets propres.

Taches :

- generer ou produire 30 images ;
- generer les audios mots ;
- generer les audios syllabes ;
- generer les sons UI ;
- optimiser les images ;
- normaliser les audios ;
- valider chaque association mot-image-son.

Definition of Done :

- aucun asset placeholder dans le jeu principal ;
- chaque image est claire ;
- chaque audio est comprehensible ;
- les assets sont suffisamment legers pour GitHub Pages.

## Phase 5 - SEO Initial

Objectif : creer la base d'acquisition organique.

Taches :

- page accueil ;
- page apprendre a lire ;
- page apprendre les lettres ;
- page apprendre les syllabes ;
- page jeux de lecture CP ;
- page jeux grande section ;
- metadonnees SEO ;
- sitemap ;
- Open Graph ;
- liens internes vers le jeu.

Definition of Done :

- les pages sont indexables ;
- chaque page a une intention claire ;
- le jeu est accessible depuis les pages SEO ;
- les contenus ne parasitent pas l'experience enfant.

## Phase 6 - Deuxieme et Troisieme Jeux

Objectif : transformer le site en collection de mini-jeux.

Jeux recommandes :

- Lettres Magiques ;
- Train des Syllabes.

Taches :

- reutiliser le design system ;
- reutiliser les donnees existantes ;
- creer les regles propres a chaque jeu ;
- ajouter selection de jeu ;
- ajouter progression par competence.

Definition of Done :

- au moins 3 jeux jouables ;
- chaque jeu travaille une competence claire ;
- la navigation entre jeux est comprehensible ;
- la progression reste simple.

## Phase 7 - Qualite Produit

Objectif : augmenter le polish et reduire les frictions.

Taches :

- tests responsive ;
- audit performance ;
- audit accessibilite ;
- reduction des tailles d'assets ;
- amelioration animations ;
- ajustement scoring ;
- retours utilisateurs parents/enfants ;
- correction des incomprehensions observees.

Definition of Done :

- l'experience est fluide sur mobile ;
- les interactions tactiles sont fiables ;
- les parents comprennent l'objectif ;
- les enfants restent engages pendant une session courte.

## Phase 8 - Internationalisation

Objectif : preparer une deuxieme langue sans casser le francais.

Taches :

- abstraire les contenus par locale ;
- ajouter textes UI traduisibles ;
- separer assets audio par langue ;
- adapter la logique pedagogique ;
- creer un premier pack de contenu non francais.

Definition of Done :

- la langue peut etre changee ;
- le francais continue de fonctionner ;
- les jeux ne supposent pas une structure syllabique uniquement francaise.

## Priorite MVP

Ordre recommande :

1. Setup Astro/React/TypeScript.
2. Design system minimal mais soigne.
3. Jeu Bateau complet avec placeholders.
4. Donnees de 30 mots.
5. Assets finaux pour ces 30 mots.
6. Pages SEO initiales.
7. Deploiement GitHub Pages.

Le risque principal n'est pas technique. Le risque principal est la qualite percue : assets incoherents, audio moyen, animations pauvres ou progression confuse. Il faut donc livrer peu de contenu au debut, mais avec un niveau de finition eleve.

