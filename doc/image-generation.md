# Pipeline de génération des images

## Rôle du document

Ce document décrit le pipeline commun de production des images Readingo. La recette actuellement utilisée pour les illustrations pédagogiques et les objets du jeu Bateau se nomme `readingo-pana-v1`.

Le pipeline commun définit :

- la traçabilité d’une génération ;
- le recours aux références visuelles ;
- les formats de sortie ;
- le détourage ;
- les contrôles techniques ;
- l’intégration dans les données.

Un nouveau jeu peut créer une recette dérivée pour son territoire ou son type d’asset. Cette variante doit être documentée ici et conserver les invariants de la [direction artistique](./design-direction.md).

Le pipeline reproduit le cadrage, la palette et le traitement de transparence. Il ne garantit pas une reproduction pixel pour pixel : l’outil intégré `image_gen` ne fournit ni seed ni version de modèle verrouillable dans le projet.

## Catégories d’assets

| Catégorie | Format courant | Exemple |
| --- | --- | --- |
| Illustration pédagogique | carré transparent | image d’un mot |
| Personnage | portrait ou carré transparent | Pana |
| Objet de monde | transparent, silhouette compacte | bateau, coffre |
| Élément de parcours | transparent, échelle variable | petite île |
| Décor | large ou répétable | fond de scène |

La recette `readingo-pana-v1` concerne d’abord les sujets isolés transparents. Un décor complet doit disposer d’un contrat de cadrage propre.

## Sorties et historique

Les images finales des mots sont stockées dans `public/assets/images/<locale>/words/`. Avec `readingo-pana-v1`, elles sont produites en PNG RGBA de 768 × 768 pixels, avec un sujet centré, une marge régulière et des coins complètement transparents.

Les personnages et objets de monde sont rangés dans `public/assets/characters/` et `public/assets/world/`.

Ce document ne repertorie pas les generations individuelles. Le prompt exact, les references ordonnees et le post-traitement de chaque asset sont archives dans [`image-generation-history.yaml`](./image-generation-history.yaml).

L'archive est append-only : une nouvelle generation ajoute une entree, y compris lorsqu'elle remplace une version precedente. Une ancienne entree ne doit etre modifiee que pour corriger une erreur factuelle ; son statut permet d'indiquer si elle est selectionnee, remplacee ou rejetee.

## Outil et strategie

Les generations de cette recette utilisent l'outil integre `image_gen` de Codex, sans CLI et sans cle API locale. Un appel distinct est utilise pour chaque sujet. Cette separation est importante : plusieurs objets differents ne doivent pas etre demandes comme variantes d'un seul appel.

La transparence a ete obtenue en deux etapes :

1. generation sur un fond chroma parfaitement uni `#00ff00` ;
2. suppression locale du fond avec le helper `remove_chroma_key.py` du skill `imagegen`.

Les sujets doivent avoir des contours fermes. Pour les animaux, le prompt impose des formes de pelage simplifiees sans poils individuels. Cela rend le detourage chroma fiable.

## References visuelles

### Reference principale

`public/assets/characters/pana.png`

Role : reference principale pour le langage graphique. Les caracteristiques a conserver sont :

- silhouette ronde et compacte ;
- contour exterieur brun fonce, continu et lisible ;
- formes lisses proches d'une illustration vectorielle ;
- ombrage 2D doux donnant un leger volume 3D ;
- rehauts brillants limites ;
- palette chaude corail, orange et creme, completee par du turquoise ;
- proportions amicales de jouet pour un public de 5 a 7 ans.

### References secondaires

`public/assets/world/fishing-boat.png` et `public/assets/world/motorcycle.png`

Role : references secondaires recommandees pour stabiliser l'epaisseur des contours, la palette et le niveau de detail. Une ou deux references secondaires peuvent etre remplacees par des assets valides plus proches du nouveau sujet.

Les images de reference servent uniquement a la direction artistique. Leur sujet ne doit pas etre recopie ou ajoute a une autre illustration. L'ordre et le role exacts des references reellement envoyees sont toujours consignes dans l'archive.

## Contrat visuel actuel `readingo-pana-v1`

Tout nouveau prompt de la serie doit conserver les invariants suivants :

- un seul sujet, immediatement reconnaissable par un enfant ;
- cadrage carre et sujet entier, sans partie coupee ;
- sujet centre avec une marge uniforme ;
- lecture correcte autour de 180 pixels ;
- silhouette epaisse, arrondie et compacte ;
- contour exterieur brun fonce et ferme ;
- palette corail, orange, creme, turquoise, charbon chaud et quelques accents dores ;
- ombrage doux et rehauts brillants discrets ;
- aucun texte, chiffre, logo ou filigrane ;
- aucun sol, decor, paysage, ombre portee ou reflet ;
- aucun objet secondaire non indispensable a l'identification du mot ;
- aucune utilisation de `#00ff00` dans le sujet.

## Template de prompt

Le template suivant sert de point de depart. Le prompt effectivement envoye doit etre resolu avec le mot et sa description de sujet, puis copie integralement dans l'archive. Les references utilisees et leur ordre doivent egalement etre enregistres dans l'entree correspondante.

```text
Use case: stylized-concept
Asset type: individual square word-picture icon for a children's educational reading game
Input images: Image 1 is the primary character style reference; Images 2 and 3 are additional icon-set references. Match their shared rendering language, palette, outline weight and polish. Do not combine or copy their subjects.
Primary request: Create exactly one instantly recognizable icon representing the French word "<id>".
Subject: <subject>
Style/medium: polished cute 2D children's game asset; chunky rounded silhouette; continuous dark warm-brown outer outline; smooth vector-like shapes; subtle soft 3D shading and glossy highlights; friendly toy-like proportions; same detail level as the references.
Composition/framing: exactly one subject centered, completely visible, generous even padding, readable around 180 pixels, no scenery, no floor and no extra objects.
Color palette: warm coral, orange, cream, turquoise, dark warm charcoal and restrained golden accents, adapted naturally to the subject.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for removal.
Constraints: background must be exactly one uniform color with no shadow, gradient, texture, horizon, floor, reflection, or lighting variation. Crisp clean closed outer edges. Do not use #00ff00 anywhere on the subject.
Avoid: text, letters, numbers, logo, watermark, border, frame, cast shadow, contact shadow, photorealism, duplicated subject, cropped parts, background elements.
```

## Format d'une entree d'archive

Chaque appel de generation ajoute une entree contenant au minimum :

- un identifiant unique date et versionne ;
- le statut `selected`, `superseded` ou `rejected` ;
- l'outil, le modele et la seed, avec `not_exposed` lorsque l'information n'est pas disponible ;
- la recette de style ;
- les inputs dans leur ordre exact et le role de chacun ;
- le prompt complet effectivement envoye, sans placeholder ;
- les dimensions de la generation brute ;
- le post-traitement applique ;
- toutes les sorties et leurs eventuels derives ;
- le resultat de la validation.

Les alias YAML peuvent mutualiser les metadonnees identiques, mais chaque entree doit exposer les champs `inputs` et `prompt` une fois le fichier parse. Ne jamais remplacer une ancienne tentative : ajouter une nouvelle version et passer l'ancienne a `superseded` si necessaire.

## Post-traitement utilise

### Suppression du fond chroma

La sortie brute de chaque appel est d'abord copiee dans un emplacement temporaire, puis traitee avec la commande suivante :

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/imagegen/scripts/remove_chroma_key.py" \
  --input /chemin/vers/<mot>-chroma.png \
  --out public/assets/images/fr/words/<mot>.png \
  --auto-key border \
  --soft-matte \
  --transparent-threshold 12 \
  --opaque-threshold 220 \
  --despill
```

Le helper echantillonne la couleur sur la bordure, produit un canal alpha progressif pour les pixels anticreneles et retire la dominante verte des contours.

### Redimensionnement

Les generations brutes initiales mesuraient 1254 x 1254 pixels. La dimension brute reelle doit etre enregistree dans l'archive, puis la sortie est normalisee a 768 x 768 sur macOS avec :

```bash
sips -Z 768 public/assets/images/fr/words/*.png
```

Le redimensionnement est effectue apres le detourage afin de lisser egalement le canal alpha.

## Validation

Chaque asset doit etre valide visuellement avant integration :

- le mot est identifiable sans texte ;
- un seul sujet est present ;
- aucune partie du sujet n'est coupee ;
- le sujet reste lisible a la taille d'affichage du jeu ;
- le fond est transparent et les quatre coins ont un alpha nul ;
- aucun halo vert n'est visible ;
- le contour, la palette et le niveau de detail sont coherents avec les references ;
- aucun texte ou symbole parasite n'a ete genere.

Le controle technique du canal alpha utilise pour cette serie peut etre reproduit avec Pillow :

```bash
python3 -c "from PIL import Image; from pathlib import Path
for p in sorted(Path('public/assets/images/fr/words').glob('*.png')):
    im = Image.open(p).convert('RGBA')
    alpha = im.getchannel('A')
    corners = [alpha.getpixel(x) for x in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]]
    print(p.name, im.size, 'bbox=', alpha.getbbox(), 'corners=', corners)"
```

Les quatre valeurs de `corners` doivent etre egales a `0`. La boite `bbox` doit rester a l'interieur de l'image avec une marge suffisante.

Le build final est valide avec :

```bash
npm run build
```

## Variations par jeu

Le GDD d’un nouveau jeu doit lister les catégories d’images nécessaires et indiquer :

- la recette commune réutilisée ;
- les références supplémentaires ;
- le cadrage ou ratio différent ;
- la palette propre au territoire ;
- le mode de transparence ou d’assemblage ;
- le dossier de sortie ;
- les contrôles techniques spécifiques.

Une recette dérivée reçoit un nom versionné, par exemple `readingo-foret-v1`. Elle réutilise Pana et des assets Readingo comme références principales, puis ajoute au plus les références nécessaires au nouveau territoire.

Créer une variation ne dispense pas d’ajouter chaque génération à l’historique append-only.

## Intégration d’un nouveau mot

1. Ajouter le mot et ses donnees pedagogiques dans `src/content/fr/words.json`.
2. Generer un asset avec le template `readingo-pana-v1` et une description de sujet non ambigue.
3. Ajouter immediatement une entree dans `doc/image-generation-history.yaml` avec le prompt resolu et les inputs ordonnes.
4. Detourer, redimensionner et valider l'image, puis completer l'entree d'archive avec les sorties et le resultat de validation.
5. Enregistrer le fichier sous `public/assets/images/fr/words/<id>.png`.
6. Renseigner `"image": "/assets/images/fr/words/<id>.png"` dans le mot.
7. Lancer `npm run content:check`, puis `npm run build`.

`BateauGame` lit directement le champ `image`. Aucun atlas ni mapping d'image supplementaire n'est necessaire.

## Intégration d’un asset propre à un jeu

1. Identifier sa catégorie et sa recette dans le GDD.
2. Choisir des références ordonnées et compatibles avec la direction artistique.
3. Effectuer un appel distinct pour l’asset.
4. Ajouter l’entrée complète dans `image-generation-history.yaml`.
5. Appliquer le post-traitement prévu par la recette.
6. Enregistrer l’asset dans `characters`, `world` ou le dossier thématique documenté.
7. Le référencer depuis les données lorsque l’asset représente du contenu, ou depuis le composant de monde lorsqu’il appartient à la scène.
