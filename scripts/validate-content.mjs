import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
const games = await readJson("src/content/fr/games.json");
const words = await readJson("src/content/fr/words.json");
const levels = await readJson("src/content/fr/lessons.json");
const syllables = await readJson("src/content/fr/syllables.json");
const letters = await readJson("src/content/fr/letters.json");
const letterLevels = await readJson("src/content/fr/letter-lessons.json");
const sentierLevels = await readJson("src/content/fr/sentier-lessons.json");
const voiceLines = await readJson("src/content/fr/voice-lines.json");
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function duplicates(values) {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

async function assertAsset(publicPath, label) {
  if (typeof publicPath !== "string" || !publicPath.startsWith("/assets/")) {
    errors.push(`${label}: chemin public invalide (${publicPath})`);
    return;
  }

  const filePath = path.join(root, "public", publicPath.slice(1));

  try {
    await access(filePath);
    assert((await stat(filePath)).size > 0, `${label}: fichier vide (${publicPath})`);
  } catch {
    errors.push(`${label}: fichier absent (${publicPath})`);
  }
}

assert(levels.length === 6, `6 niveaux attendus, ${levels.length} trouvés`);
assert(duplicates(games.map((game) => game.id)).length === 0, "Identifiants de jeux dupliqués");
assert(
  ["letters", "syllabes", "sentier"].every((id) => games.some((game) => game.id === id)),
  "Le catalogue doit contenir letters, syllabes et sentier",
);

for (const game of games) {
  assert(typeof game.route === "string" && game.route.startsWith("/jeux/"), `${game.id}: route invalide`);
  assert(Boolean(game.title), `${game.id}: titre absent`);
  assert(Boolean(game.cta), `${game.id}: CTA absent`);
  assert(Array.isArray(game.progressKeys) && game.progressKeys.length > 0, `${game.id}: clé de progression absente`);
}

assert(words.length === 78, `78 mots attendus, ${words.length} trouvés`);
assert(duplicates(words.map((word) => word.id)).length === 0, "Identifiants de mots dupliqués");
assert(duplicates(syllables.map((syllable) => syllable.id)).length === 0, "Identifiants de syllabes dupliqués");
assert(duplicates(syllables.map((syllable) => syllable.text)).length === 0, "Textes de syllabes dupliqués");

const wordById = new Map(words.map((word) => [word.id, word]));
const syllableByText = new Map(syllables.map((syllable) => [syllable.text, syllable]));
const letterById = new Map(letters.map((letter) => [letter.id, letter]));
const referencedWordIds = levels.flatMap((level) => level.wordIds);
const letterAnchorWordIds = letters.map((letter) => letter.anchorWordId);
const letterOnlyWords = words.filter((word) => word.tags?.includes("mot-indice-lettres"));
const sentierReferencedWordIds = sentierLevels.flatMap((level) =>
  level.questions?.flatMap((question) => question.choiceWordIds ?? []) ?? [],
);
const sentierOnlyWords = words.filter((word) => word.tags?.includes("mot-indice-sentier"));

assert(duplicates(referencedWordIds).length === 0, "Un mot est référencé par plusieurs niveaux");
assert(referencedWordIds.length === 48, "Les niveaux Syllabes doivent conserver leurs 48 mots");
assert(letterOnlyWords.length === 6, `${letterOnlyWords.length} mots-indices exclusifs Lettres trouvés au lieu de 6`);
assert(sentierOnlyWords.length === 24, `${sentierOnlyWords.length} mots-indices exclusifs Sentier trouvés au lieu de 24`);

for (const [index, level] of levels.entries()) {
  assert(level.level === index + 1, `Ordre invalide pour le niveau ${level.id}`);
  assert(level.gameIds?.includes("syllabes"), `${level.id}: gameIds doit contenir syllabes`);
  assert(level.wordIds.length === 8, `${level.id}: 8 mots attendus`);
  const expectedSyllables = level.level <= 2 ? 2 : level.level <= 4 ? 3 : 4;
  const expectedDistractors = level.level <= 3 ? 2 : level.level <= 5 ? 3 : 4;

  for (const wordId of level.wordIds) {
    const word = wordById.get(wordId);
    assert(Boolean(word), `${level.id}: mot inconnu ${wordId}`);
    if (!word) continue;
    assert(word.syllables.length === expectedSyllables, `${word.id}: ${expectedSyllables} syllabes attendues`);
    assert(word.spokenSyllables?.length === word.syllables.length, `${word.id}: prononciations incomplètes`);
    assert(word.distractors.length === expectedDistractors, `${word.id}: ${expectedDistractors} distracteurs attendus`);
    assert(word.syllables.length + word.distractors.length <= 8, `${word.id}: plus de 8 tuiles`);
    await assertAsset(word.image, `${word.id} image`);
    await assertAsset(word.audioWord, `${word.id} audio`);

    for (const text of [...word.syllables, ...word.distractors]) {
      const generic = syllableByText.get(text);
      const audio = word.audioSyllables?.[text] ?? generic?.audio;
      assert(Boolean(audio), `${word.id}: audio absent pour ${text}`);
      if (audio) await assertAsset(audio, `${word.id}/${text}`);
    }
  }
}

for (const word of words) {
  assert(
    referencedWordIds.includes(word.id) || letterAnchorWordIds.includes(word.id) || sentierReferencedWordIds.includes(word.id),
    `${word.id}: aucun jeu associé`,
  );
}

assert(letterLevels.length === 12, `12 niveaux Lettres attendus, ${letterLevels.length} trouvé(s)`);
assert(letters.length === 26, `26 lettres attendues, ${letters.length} trouvée(s)`);
assert(duplicates(letters.map((letter) => letter.id)).length === 0, "Identifiants de lettres dupliqués");
assert(duplicates(letters.map((letter) => letter.uppercase)).length === 0, "Capitales de lettres dupliquées");
assert(duplicates(letters.map((letter) => letter.lowercase)).length === 0, "Minuscules de lettres dupliquées");

const expectedChoiceCounts = [3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6];
const expectedAlphabet = "abcdefghijklmnopqrstuvwxyz".split("");

for (const firstLevelIndex of [0, 4, 8]) {
  const coveredLetters = new Set(
    letterLevels
      .slice(firstLevelIndex, firstLevelIndex + 4)
      .flatMap((level) => level.questions?.map((question) => question.targetLetterId) ?? []),
  );
  assert(
    expectedAlphabet.every((letterId) => coveredLetters.has(letterId)),
    `Les niveaux Lettres ${firstLevelIndex + 1} à ${firstLevelIndex + 4} doivent couvrir l’alphabet`,
  );
}

for (const [index, level] of letterLevels.entries()) {
  assert(level.level === index + 1, `Ordre invalide pour le niveau Lettres ${level.id}`);
  assert(level.gameIds?.includes("letters"), `${level.id}: gameIds doit contenir letters`);
  assert(level.questions?.length === 8, `${level.id}: 8 questions attendues`);
  assert(duplicates(level.questions?.map((question) => question.id) ?? []).length === 0, `${level.id}: questions dupliquées`);

  for (const question of level.questions ?? []) {
    const target = letterById.get(question.targetLetterId);
    assert(Boolean(target), `${question.id}: lettre cible inconnue ${question.targetLetterId}`);
    assert(
      question.displayCase === "uppercase" || question.displayCase === "lowercase",
      `${question.id}: casse d'affichage invalide`,
    );
    assert(
      question.choiceLetterIds?.length === expectedChoiceCounts[index],
      `${question.id}: ${expectedChoiceCounts[index]} choix attendus`,
    );
    assert(duplicates(question.choiceLetterIds ?? []).length === 0, `${question.id}: choix dupliqués`);
    assert(
      question.choiceLetterIds?.filter((id) => id === question.targetLetterId).length === 1,
      `${question.id}: la bonne réponse doit apparaître exactement une fois`,
    );

    for (const choiceId of question.choiceLetterIds ?? []) {
      assert(letterById.has(choiceId), `${question.id}: choix inconnu ${choiceId}`);
    }

    const choiceCases = question.choiceLetterIds?.map(
      (choiceId) => question.choiceCases?.[choiceId] ?? question.displayCase,
    ) ?? [];

    for (const [choiceId, displayCase] of Object.entries(question.choiceCases ?? {})) {
      assert(question.choiceLetterIds?.includes(choiceId), `${question.id}: casse définie pour un choix absent ${choiceId}`);
      assert(
        displayCase === "uppercase" || displayCase === "lowercase",
        `${question.id}: casse invalide pour ${choiceId}`,
      );
    }

    if (index < 4) {
      assert(question.displayCase === "uppercase", `${question.id}: capitale attendue`);
      assert(!question.choiceCases, `${question.id}: grille uniforme attendue`);
    } else if (index < 8) {
      assert(question.displayCase === "lowercase", `${question.id}: minuscule attendue`);
      assert(!question.choiceCases, `${question.id}: grille uniforme attendue`);
    } else if (index < 10) {
      assert(!question.choiceCases, `${question.id}: casse uniforme par question attendue`);
    } else if (index >= 10) {
      assert(
        Object.keys(question.choiceCases ?? {}).length === question.choiceLetterIds.length,
        `${question.id}: chaque choix doit définir sa casse`,
      );
      assert(new Set(choiceCases).size === 2, `${question.id}: capitales et minuscules attendues`);
      assert(
        question.choiceCases?.[question.targetLetterId] === question.displayCase,
        `${question.id}: la casse cible doit correspondre à displayCase`,
      );
    }

    if (!target) continue;
    const anchorWord = wordById.get(target.anchorWordId);
    assert(Boolean(anchorWord), `${target.id}: mot-indice inconnu ${target.anchorWordId}`);
    assert(
      anchorWord?.displayWord.toLocaleLowerCase("fr").includes(target.lowercase.toLocaleLowerCase("fr")),
      `${target.id}: la lettre est absente du mot-indice ${target.anchorWordId}`,
    );
    assert(Boolean(target.promptText), `${target.id}: consigne affichée absente`);
    assert(Boolean(target.promptSpeechText), `${target.id}: consigne vocale absente`);
    await assertAsset(target.nameAudio, `${target.id} nom audio`);
    await assertAsset(target.promptAudio, `${target.id} consigne audio`);
    if (anchorWord) {
      await assertAsset(anchorWord.image, `${target.id} image-indice`);
      await assertAsset(anchorWord.audioWord, `${target.id} audio du mot-indice`);
    }
  }
}

for (const level of letterLevels.slice(8, 10)) {
  assert(
    new Set(level.questions.map((question) => question.displayCase)).size === 2,
    `${level.id}: alternance de casse attendue`,
  );
}

assert(sentierLevels.length === 12, `12 niveaux Sentier attendus, ${sentierLevels.length} trouvé(s)`);
const expectedSentierChoiceCounts = [3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5];
const sentierRegions = new Set(["lisiere", "eaux", "profondeurs", "ruines"]);

for (const [index, level] of sentierLevels.entries()) {
  assert(level.level === index + 1, `Ordre invalide pour le niveau Sentier ${level.id}`);
  assert(
    level.gameIds?.includes("sentier"),
    `${level.id}: gameIds doit contenir sentier`,
  );
  assert(sentierRegions.has(level.regionId), `${level.id}: région de jungle invalide`);
  assert(level.questions?.length === 8, `${level.id}: 8 questions attendues`);
  assert(
    duplicates(level.questions?.map((question) => question.id) ?? []).length === 0,
    `${level.id}: questions dupliquées`,
  );

  for (const question of level.questions ?? []) {
    const target = wordById.get(question.targetWordId);
    const choices = question.choiceWordIds ?? [];
    const choiceCount = choices.length;

    assert(Boolean(target), `${question.id}: mot cible inconnu ${question.targetWordId}`);
    assert(
      choiceCount === expectedSentierChoiceCounts[index],
      `${question.id}: ${expectedSentierChoiceCounts[index]} choix attendus`,
    );
    assert(
      duplicates(choices).length === 0,
      `${question.id}: réponses dupliquées ou mot cible répété`,
    );
    assert(
      choices.filter((wordId) => wordId === question.targetWordId).length === 1,
      `${question.id}: la cible doit apparaître exactement une fois`,
    );
    assert(choices.every((wordId) => wordById.has(wordId)), `${question.id}: choix de mot inconnu`);
    assert(question.displayCase === "uppercase" || question.displayCase === "lowercase", `${question.id}: casse invalide`);

    if (index < 4) {
      assert(question.displayCase === "uppercase", `${question.id}: capitale attendue`);
      assert(!question.choiceCases, `${question.id}: grille uniforme attendue`);
    } else if (index < 8) {
      assert(question.displayCase === "lowercase", `${question.id}: minuscule attendue`);
      assert(!question.choiceCases, `${question.id}: grille uniforme attendue`);
    } else if (index < 10) {
      assert(!question.choiceCases, `${question.id}: alternance uniforme attendue`);
    } else {
      const cases = choices.map((wordId) => question.choiceCases?.[wordId]);
      assert(Object.keys(question.choiceCases ?? {}).length === choiceCount, `${question.id}: casse requise pour chaque choix`);
      assert(cases.every((value) => value === "uppercase" || value === "lowercase"), `${question.id}: casse de choix invalide`);
      assert(new Set(cases).size === 2, `${question.id}: capitales et minuscules attendues`);
      assert(question.choiceCases?.[question.targetWordId] === question.displayCase, `${question.id}: casse cible incohérente`);
    }

    if (target) {
      await assertAsset(target.image, `${question.id} image cible`);
      await assertAsset(target.audioWord, `${question.id} audio cible`);
    }
  }
}

for (const level of sentierLevels.slice(8, 10)) {
  assert(new Set(level.questions.map((question) => question.displayCase)).size === 2, `${level.id}: alternance de casse attendue`);
}

for (const word of sentierOnlyWords) {
  assert(word.syllables?.length === 0 && word.distractors?.length === 0, `${word.id}: le mot Sentier ne doit pas rejoindre les niveaux Syllabes`);
  await assertAsset(word.image, `${word.id} image Sentier`);
  await assertAsset(word.audioWord, `${word.id} audio Sentier`);
}

for (const asset of ["map-island-sandbar.png", "map-island-rocky.png", "map-island-palms.png"]) {
  await assertAsset(`/assets/world/${asset}`, `Carte ${asset}`);
}

for (const asset of [
  "jungle-backdrop.png",
  "jungle-canopy.png",
  "foliage-left.png",
  "foliage-right.png",
  "vines-a.png",
  "vines-b.png",
  "rock-fern.png",
  "gem.png",
  "grand-treasure-chest-closed.png",
  "grand-treasure-chest-open.png",
]) {
  await assertAsset(`/assets/world/jungle/${asset}`, `Sentier ${asset}`);
}


for (const asset of [1, 2, 3, 4].map((index) => `map/jungle-map-chapter-${index}-v2.webp`)) {
  await assertAsset(`/assets/world/jungle/${asset}`, `Carte Sentier ${asset}`);
}

for (const asset of [
  "jungle-loop.mp3",
  "jungle-step.mp3",
  "gem-collect.mp3",
  "digging.mp3",
]) {
  await assertAsset(`/assets/audio/sfx/${asset}`, `Sentier ${asset}`);
}

for (const [dialogueId, lines] of Object.entries(voiceLines.dialogue ?? {})) {
  assert(Array.isArray(lines) && lines.length > 0, `${dialogueId}: dialogue vide`);

  for (const line of lines ?? []) {
    assert(Boolean(line.id), `${dialogueId}: identifiant de réplique absent`);
    assert(Boolean(line.text), `${line.id ?? dialogueId}: texte de réplique absent`);
    await assertAsset(line.audio, `${line.id ?? dialogueId} audio`);
  }
}

if (errors.length) {
  process.stderr.write(`${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(
  `Contenu valide : ${levels.length} niveaux Syllabes, ${letterLevels.length} niveaux Lettres, ${sentierLevels.length} niveaux Sentier, ${words.length} mots, ${syllables.length} syllabes et ${letters.length} lettres.\n`,
);
