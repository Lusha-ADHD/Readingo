import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
const words = await readJson("src/content/fr/words.json");
const levels = await readJson("src/content/fr/lessons.json");
const syllables = await readJson("src/content/fr/syllables.json");
const letters = await readJson("src/content/fr/letters.json");
const letterLevels = await readJson("src/content/fr/letter-lessons.json");
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
assert(words.length === 48, `48 mots attendus, ${words.length} trouvés`);
assert(duplicates(words.map((word) => word.id)).length === 0, "Identifiants de mots dupliqués");
assert(duplicates(syllables.map((syllable) => syllable.id)).length === 0, "Identifiants de syllabes dupliqués");
assert(duplicates(syllables.map((syllable) => syllable.text)).length === 0, "Textes de syllabes dupliqués");

const wordById = new Map(words.map((word) => [word.id, word]));
const syllableByText = new Map(syllables.map((syllable) => [syllable.text, syllable]));
const letterById = new Map(letters.map((letter) => [letter.id, letter]));
const referencedWordIds = levels.flatMap((level) => level.wordIds);

assert(duplicates(referencedWordIds).length === 0, "Un mot est référencé par plusieurs niveaux");
assert(referencedWordIds.length === words.length, "Tous les mots doivent appartenir à un niveau");

for (const [index, level] of levels.entries()) {
  assert(level.level === index + 1, `Ordre invalide pour le niveau ${level.id}`);
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
  assert(referencedWordIds.includes(word.id), `${word.id}: aucun niveau associé`);
}

assert(letterLevels.length === 1, `1 niveau Lettres attendu, ${letterLevels.length} trouvé(s)`);
assert(duplicates(letters.map((letter) => letter.id)).length === 0, "Identifiants de lettres dupliqués");
assert(duplicates(letters.map((letter) => letter.uppercase)).length === 0, "Capitales de lettres dupliquées");
assert(duplicates(letters.map((letter) => letter.lowercase)).length === 0, "Minuscules de lettres dupliquées");

for (const [index, level] of letterLevels.entries()) {
  assert(level.level === index + 1, `Ordre invalide pour le niveau Lettres ${level.id}`);
  assert(level.gameIds?.includes("lettres"), `${level.id}: gameIds doit contenir lettres`);
  assert(level.questions?.length === 8, `${level.id}: 8 questions attendues`);
  assert(duplicates(level.questions?.map((question) => question.id) ?? []).length === 0, `${level.id}: questions dupliquées`);

  for (const question of level.questions ?? []) {
    const target = letterById.get(question.targetLetterId);
    assert(Boolean(target), `${question.id}: lettre cible inconnue ${question.targetLetterId}`);
    assert(
      question.displayCase === "uppercase" || question.displayCase === "lowercase",
      `${question.id}: casse d'affichage invalide`,
    );
    assert(question.choiceLetterIds?.length >= 2, `${question.id}: au moins 2 choix attendus`);
    assert(duplicates(question.choiceLetterIds ?? []).length === 0, `${question.id}: choix dupliqués`);
    assert(
      question.choiceLetterIds?.filter((id) => id === question.targetLetterId).length === 1,
      `${question.id}: la bonne réponse doit apparaître exactement une fois`,
    );

    for (const choiceId of question.choiceLetterIds ?? []) {
      assert(letterById.has(choiceId), `${question.id}: choix inconnu ${choiceId}`);
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
    if (anchorWord) await assertAsset(anchorWord.image, `${target.id} image-indice`);
  }
}

for (const asset of ["map-island-sandbar.png", "map-island-rocky.png", "map-island-palms.png"]) {
  await assertAsset(`/assets/world/${asset}`, `Carte ${asset}`);
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
  `Contenu valide : ${levels.length} niveaux Bateau, ${letterLevels.length} niveau Lettres, ${words.length} mots, ${syllables.length} syllabes et ${letters.length} lettres.\n`,
);
