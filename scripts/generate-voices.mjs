import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDirectory = process.cwd();
const force = process.argv.includes("--force");
const checkVoiceOnly = process.argv.includes("--check-voice");
const onlyTarget = process.argv.find((argument) => argument.startsWith("--only="))?.slice("--only=".length);

async function loadLocalEnvironment() {
  const environmentFile = await readFile(path.join(rootDirectory, ".env.local"), "utf8");

  for (const sourceLine of environmentFile.split(/\r?\n/)) {
    const line = sourceLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex < 1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] ||= value;
  }
}

await loadLocalEnvironment();

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;
const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_v3";
const languageCode = process.env.ELEVENLABS_LANGUAGE_CODE || "fr";

if (!apiKey || !voiceId) {
  throw new Error("ELEVENLABS_API_KEY et ELEVENLABS_VOICE_ID doivent être renseignés dans .env.local.");
}

if (checkVoiceOnly) {
  const response = await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(voiceId)}`, {
    headers: { "xi-api-key": apiKey },
  });

  if (!response.ok) {
    throw new Error(`Impossible de lire la voix ElevenLabs (${response.status}) : ${await response.text()}`);
  }

  const voice = await response.json();
  const verifiedLanguages = (voice.verified_languages || []).map(({ language, accent, locale, model_id }) => ({
    language,
    accent,
    locale,
    modelId: model_id,
  }));

  process.stdout.write(
    `${JSON.stringify(
      {
        name: voice.name,
        category: voice.category,
        labels: voice.labels,
        verifiedLanguages,
        selectedModel: modelId,
        selectedLanguage: languageCode,
        selectedModelSupported: (voice.high_quality_base_model_ids || []).includes(modelId),
      },
      null,
      2,
    )}\n`,
  );
  process.exit(0);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(rootDirectory, relativePath), "utf8"));
}

async function fileExists(filePath) {
  try {
    return (await stat(filePath)).size > 0;
  } catch {
    return false;
  }
}

function publicFilePath(publicPath) {
  if (!publicPath.startsWith("/assets/")) {
    throw new Error(`Chemin audio public invalide : ${publicPath}`);
  }

  return path.join(rootDirectory, "public", publicPath.slice(1));
}

function sentence(text) {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

const words = await readJson("src/content/fr/words.json");
const syllables = await readJson("src/content/fr/syllables.json");
const voiceLines = await readJson("src/content/fr/voice-lines.json");
const letters = await readJson("src/content/fr/letters.json");
const genericSyllables = new Map(syllables.map((entry) => [entry.text, entry]));
const targets = new Map();

function addTarget({ id, text, audio, kind }) {
  const normalizedText = sentence(text);
  const existing = targets.get(audio);

  if (existing && existing.text !== normalizedText) {
    throw new Error(`Conflit de prononciation pour ${audio} : "${existing.text}" et "${normalizedText}".`);
  }

  targets.set(audio, { id, text: normalizedText, audio, kind });
}

for (const line of voiceLines.dialogue.intro) {
  addTarget({ ...line, kind: "dialogue" });
}

for (const [id, line] of Object.entries(voiceLines.feedback)) {
  addTarget({ id, ...line, kind: "dialogue" });
}

for (const syllable of syllables) {
  addTarget({
    id: `syllable-${syllable.id}`,
    text: syllable.speechText || syllable.text,
    audio: syllable.audio,
    kind: "syllable",
  });
}

for (const word of words) {
  addTarget({ id: `word-${word.id}`, text: word.displayWord, audio: word.audioWord, kind: "word" });

  word.syllables.forEach((syllableText, index) => {
    const generic = genericSyllables.get(syllableText);
    const spokenText = word.spokenSyllables?.[index] || generic?.speechText || syllableText;
    const audio = word.audioSyllables?.[syllableText] || generic?.audio;

    if (!audio) {
      throw new Error(`Chemin audio manquant pour la syllabe ${syllableText} du mot ${word.id}.`);
    }

    addTarget({ id: `${word.id}-${syllableText}`, text: spokenText, audio, kind: "syllable" });
  });
}

for (const letter of letters) {
  addTarget({
    id: `letter-name-${letter.id}`,
    text: letter.nameSpeechText,
    audio: letter.nameAudio,
    kind: "letterName",
  });
  addTarget({
    id: `letter-prompt-${letter.id}`,
    text: letter.promptSpeechText,
    audio: letter.promptAudio,
    kind: "letterPrompt",
  });
}

function voiceSettings(kind) {
  if (kind === "dialogue") {
    return { stability: 0.58, similarity_boost: 0.82, style: 0.16, use_speaker_boost: true, speed: 0.94 };
  }

  if (kind === "syllable") {
    return { stability: 0.76, similarity_boost: 0.84, style: 0.03, use_speaker_boost: true, speed: 0.82 };
  }

  if (kind === "letterName") {
    return { stability: 0.76, similarity_boost: 0.84, style: 0.03, use_speaker_boost: true, speed: 0.84 };
  }

  if (kind === "letterPrompt") {
    return { stability: 0.62, similarity_boost: 0.84, style: 0.12, use_speaker_boost: true, speed: 0.9 };
  }

  return { stability: 0.72, similarity_boost: 0.84, style: 0.05, use_speaker_boost: true, speed: 0.88 };
}

async function generate(target, attempt = 1) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: target.text,
        model_id: modelId,
        language_code: languageCode,
        voice_settings: voiceSettings(target.kind),
        seed: 41807,
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();

    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      return generate(target, attempt + 1);
    }

    throw new Error(`ElevenLabs ${response.status} pour ${target.id} : ${details}`);
  }

  const outputPath = publicFilePath(target.audio);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

let generatedCount = 0;
let skippedCount = 0;

for (const target of targets.values()) {
  const outputPath = publicFilePath(target.audio);

  if (onlyTarget && target.id !== onlyTarget && target.audio !== onlyTarget) {
    continue;
  }

  if (!force && (await fileExists(outputPath))) {
    skippedCount += 1;
    process.stdout.write(`ignore  ${target.audio}\n`);
    continue;
  }

  process.stdout.write(`genere  ${target.audio} <- ${target.text}\n`);
  await generate(target);
  generatedCount += 1;
}

process.stdout.write(`\n${generatedCount} clip(s) genere(s), ${skippedCount} clip(s) conserve(s).\n`);
