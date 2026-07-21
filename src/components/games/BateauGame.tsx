import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import syllableEntries from "../../content/fr/syllables.json";
import words from "../../content/fr/words.json";
import { sitePath } from "../../utils/paths";
import { AudioButton } from "../ui/AudioButton";
import { DropSlot } from "../ui/DropSlot";
import { GameButton } from "../ui/GameButton";
import { ProgressBar } from "../ui/ProgressBar";
import { RewardBurst } from "../ui/RewardBurst";
import { SyllableTile } from "../ui/SyllableTile";
import { OceanCanvas } from "./OceanCanvas";
import { useGameAudio } from "./gameAudio";
import "./BateauGame.css";

type WordChallenge = {
  id: string;
  locale: string;
  word: string;
  displayWord: string;
  syllables: string[];
  spokenSyllables?: string[];
  distractors: string[];
  difficulty: number;
  tags: string[];
};

type Tile = {
  id: string;
  text: string;
};

type DragState = {
  tileId: string;
  text: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  isDragging: boolean;
};

type SavedProgress = {
  bestTreasures: number;
  sessions: number;
  completedWords: string[];
};

type SyllableEntry = {
  id: string;
  text: string;
  speechText?: string;
};

type GamePhase = "intro" | "dialog" | "playing" | "sailing" | "done";

type SailingIsland = {
  id: string;
  globalIndex: number;
  hasTreasure: boolean;
  size: "small" | "large";
  sailingOrder: number | null;
};

type WordAtlasFrame = {
  column: number;
  row: number;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
};

type Journey = {
  wind: 1 | 2 | 3;
  islands: SailingIsland[];
  treasuresFound: number;
};

const STORAGE_KEY = "readingo:bateau:v2";
const DRAG_THRESHOLD = 8;
const PANA_ASSET_PATH = sitePath("/assets/characters/pana.png");
const BOAT_ASSET_PATH = sitePath("/assets/world/boat.png");
const ISLAND_WITH_CHEST_ASSET_PATH = sitePath("/assets/world/IslandWithChest.png");
const ISLAND_WITHOUT_CHEST_ASSET_PATH = sitePath("/assets/world/IslandWithoutChest.png");
const CHEST_ICON_ASSET_PATH = sitePath("/assets/world/Chest.png");
const WORD_ATLAS_ASSET_PATH = sitePath("/assets/words/WordAtlas.png");
const WORD_ATLAS_FRAMES: Record<string, WordAtlasFrame> = {
  bateau: { column: 0, row: 0, offsetY: 2 },
  moto: { column: 1, row: 0, offsetY: 1 },
  lapin: { column: 2, row: 0, offsetY: 2 },
  panda: { column: 3, row: 0, offsetY: 2 },
  maison: { column: 0, row: 1, offsetY: -4 },
  melon: { column: 1, row: 1, offsetY: -2 },
  tapis: { column: 2, row: 1, offsetY: -3 },
  chaton: { column: 3, row: 1, offsetY: -2 },
};
const CHEST_COLLECT_PAUSE_MS = 620;
const CHEST_COLLECT_SEGMENT_RATIO = 0.58;
const SAILING_DURATIONS: Record<Journey["wind"], number> = {
  1: 1700,
  2: 2200,
  3: 2700,
};
const SCENE_CLOUDS = Array.from({ length: 18 }, (_, index) => ({
  id: `cloud-${index}`,
  left: -18 + index * 38,
  top: 42 + (index % 4) * 25,
  scale: 0.72 + (index % 3) * 0.17,
  duration: 8200 + (index % 5) * 1300,
  delay: -1100 * (index % 7),
}));
const sessionWords = words as WordChallenge[];
const syllableSpeechByText = new Map((syllableEntries as SyllableEntry[]).map((entry) => [entry.text, entry.speechText ?? entry.text]));
const introLines = [
  "Aide-moi à parcourir l'océan et à trouver le plus de trésors possibles.",
  "Associe les bonnes syllabes à chaque mot pour que le vent pousse notre bateau !",
  "Je compte sur toi !",
];

function shuffleTiles(challenge: WordChallenge): Tile[] {
  return [...challenge.syllables, ...challenge.distractors]
    .map((text, index) => ({ id: `${challenge.id}-${text}-${index}`, text }))
    .sort((a, b) => {
      const left = `${challenge.id}-${a.text}-${a.id}`.localeCompare(`${challenge.id}-${b.text}-${b.id}`);
      return challenge.id.length % 2 === 0 ? left : -left;
    });
}

function getInitialProgress(): SavedProgress {
  if (typeof window === "undefined") {
    return { bestTreasures: 0, sessions: 0, completedWords: [] };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedProgress) : { bestTreasures: 0, sessions: 0, completedWords: [] };
  } catch {
    return { bestTreasures: 0, sessions: 0, completedWords: [] };
  }
}

function speak(text: string, options: { cancel?: boolean } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve();
  }

  if (options.cancel ?? true) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.82;
  utterance.pitch = 1.05;

  return new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

async function speakSequence(texts: string[], onLine?: (index: number) => void, shouldContinue = () => true) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  for (const [index, text] of texts.entries()) {
    if (!shouldContinue()) {
      return;
    }

    onLine?.(index);
    await speak(text, { cancel: index === 0 });

    if (!shouldContinue()) {
      return;
    }
  }
}

function getSyllableSpeechText(text: string) {
  return syllableSpeechByText.get(text) ?? text;
}

function getChallengeSyllableSpeechText(challenge: WordChallenge, text: string) {
  const syllableIndex = challenge.syllables.indexOf(text);
  return syllableIndex >= 0 ? (challenge.spokenSyllables?.[syllableIndex] ?? getSyllableSpeechText(text)) : getSyllableSpeechText(text);
}

function getPlacedSyllableSpeechText(challenge: WordChallenge, tile: Tile, slotIndex: number) {
  return challenge.spokenSyllables?.[slotIndex] ?? getSyllableSpeechText(tile.text);
}

function calculateWind(startedAt: number, mistakes: number): 1 | 2 | 3 {
  const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

  if (seconds <= 8 && mistakes === 0) {
    return 3;
  }

  if (seconds <= 16 && mistakes <= 1) {
    return 2;
  }

  return 1;
}

function buildSceneIslands(startIndex: number, visibleCount: number, sailingCount = 0): SailingIsland[] {
  return Array.from({ length: visibleCount }, (_, index) => ({
    id: `scene-island-${startIndex + index}`,
    globalIndex: startIndex + index,
    hasTreasure: (startIndex + index) % 2 === 1,
    size: (startIndex + index) % 2 === 0 ? "small" : "large",
    sailingOrder: index > 0 && index <= sailingCount ? index - 1 : null,
  }));
}

function buildJourney(startIndex: number, wind: 1 | 2 | 3): Journey {
  const islands = buildSceneIslands(startIndex, 2 + wind, wind);

  return {
    wind,
    islands,
    treasuresFound: islands.filter((island) => island.sailingOrder != null && island.hasTreasure).length,
  };
}

function getWindLabel(wind: 1 | 2 | 3) {
  if (wind === 3) {
    return "Vent tres fort";
  }

  if (wind === 2) {
    return "Vent moyen";
  }

  return "Vent faible";
}

function getWordAtlasStyle(frame: WordAtlasFrame) {
  const zoom = frame.zoom ?? 1.22;
  const centeredCropOffset = (zoom - 1) * -50;
  const left = frame.column * -100 * zoom + centeredCropOffset + (frame.offsetX ?? 0);
  const top = frame.row * -100 * zoom + centeredCropOffset + (frame.offsetY ?? 0);

  return {
    "--word-atlas-left": `${left}%`,
    "--word-atlas-top": `${top}%`,
    "--word-atlas-width": `${400 * zoom}%`,
    "--word-atlas-height": `${300 * zoom}%`,
  } as CSSProperties;
}

function PanaMascot({ compact = false }: { compact?: boolean }) {
  const [assetFailed, setAssetFailed] = useState(false);

  return (
    <div className={`${compact ? "pana pana--compact" : "pana"} ${assetFailed ? "pana--asset-failed" : ""}`} role="img" aria-label="Pana">
      <img
        className="pana__asset"
        src={PANA_ASSET_PATH}
        alt=""
        draggable={false}
        hidden={assetFailed}
        onError={(event) => {
          event.currentTarget.hidden = true;
          setAssetFailed(true);
        }}
      />
      <div className="pana__fallback" aria-hidden="true">
        <div className="pana__hat" />
        <div className="pana__head">
          <span className="pana__ear pana__ear--left" />
          <span className="pana__ear pana__ear--right" />
          <span className="pana__patch" />
          <span className="pana__eye" />
          <span className="pana__muzzle" />
        </div>
        <div className="pana__scarf" />
      </div>
    </div>
  );
}

function BoatAsset() {
  const [assetFailed, setAssetFailed] = useState(false);

  return (
    <div className={`bateau-game__boat ${assetFailed ? "bateau-game__boat--asset-failed" : ""}`}>
      <img
        className="bateau-game__boat-asset"
        src={BOAT_ASSET_PATH}
        alt=""
        draggable={false}
        hidden={assetFailed}
        onError={(event) => {
          event.currentTarget.hidden = true;
          setAssetFailed(true);
        }}
      />
      <div className="bateau-game__boat-fallback" aria-hidden="true">
        <div className="bateau-game__sail" />
      </div>
    </div>
  );
}

export function BateauGame() {
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [dialogLineIndex, setDialogLineIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [placed, setPlaced] = useState<Array<Tile | null>>([]);
  const [usedTileIds, setUsedTileIds] = useState<string[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [wrongTileId, setWrongTileId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [treasures, setTreasures] = useState(0);
  const [lastTreasuresFound, setLastTreasuresFound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [islandStartIndex, setIslandStartIndex] = useState(0);
  const [isCollectingChest, setIsCollectingChest] = useState(false);
  const [isSailingMotionActive, setIsSailingMotionActive] = useState(false);
  const [chestBursts, setChestBursts] = useState<number[]>([]);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [progress, setProgress] = useState<SavedProgress>(() => getInitialProgress());
  const dragStateRef = useRef<DragState | null>(null);
  const dialogRunRef = useRef(0);
  const chestBurstIdRef = useRef(0);
  const savedSessionRef = useRef(false);
  const [, forceDragRender] = useState(0);
  const { playEffect, setTravelAudio, startAmbience } = useGameAudio();

  const challenge = sessionWords[wordIndex];
  const wordAtlasFrame = WORD_ATLAS_FRAMES[challenge.id];
  const tiles = useMemo(() => shuffleTiles(challenge), [challenge]);
  const completedCount = phase === "done" ? sessionWords.length : wordIndex;

  useEffect(() => {
    setPlaced(Array.from({ length: challenge.syllables.length }, () => null));
    setUsedTileIds([]);
    setSelectedTileId(null);
    setWrongTileId(null);
    setActiveSlot(null);
    setLastTreasuresFound(0);
    setMistakes(0);
    setIsCollectingChest(false);
    setIsSailingMotionActive(false);
    setChestBursts([]);
    setJourney(null);
    setStartedAt(Date.now());
  }, [challenge]);

  useEffect(() => {
    if (phase !== "done" || savedSessionRef.current) {
      return;
    }

    savedSessionRef.current = true;
    const nextProgress: SavedProgress = {
      bestTreasures: Math.max(progress.bestTreasures, treasures),
      sessions: progress.sessions + 1,
      completedWords: Array.from(new Set([...progress.completedWords, ...sessionWords.map((item) => item.id)])),
    };

    setProgress(nextProgress);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
  }, [phase, progress.bestTreasures, progress.completedWords, progress.sessions, treasures]);

  useEffect(() => {
    setTravelAudio(phase === "sailing" && isSailingMotionActive, journey?.wind ?? 1, isCollectingChest);
  }, [isCollectingChest, isSailingMotionActive, journey?.wind, phase, setTravelAudio]);

  function findTile(tileId: string) {
    return tiles.find((tile) => tile.id === tileId);
  }

  async function startIntroDialog() {
    startAmbience();
    const runId = dialogRunRef.current + 1;
    dialogRunRef.current = runId;
    setPhase("dialog");
    setDialogLineIndex(0);
    await speakSequence(introLines, setDialogLineIndex, () => dialogRunRef.current === runId);

    if (dialogRunRef.current !== runId) {
      return;
    }

    setPhase("playing");
    setStartedAt(Date.now());
  }

  function skipIntroDialog() {
    dialogRunRef.current += 1;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setPhase("playing");
    setStartedAt(Date.now());
  }

  function placeTile(tileId: string, slotIndex: number) {
    if (phase !== "playing" || usedTileIds.includes(tileId) || placed[slotIndex]) {
      return;
    }

    const tile = findTile(tileId);

    if (!tile) {
      return;
    }

    const expected = challenge.syllables[slotIndex];

    if (tile.text !== expected) {
      setMistakes((value) => value + 1);
      setWrongTileId(tileId);
      void playEffect("drop").then(() => speakSequence([getChallengeSyllableSpeechText(challenge, tile.text), "Essaie encore"]));
      window.setTimeout(() => setWrongTileId(null), 320);
      return;
    }

    const nextPlaced = [...placed];
    nextPlaced[slotIndex] = tile;
    setPlaced(nextPlaced);
    setUsedTileIds((value) => [...value, tileId]);
    setSelectedTileId(null);
    void playEffect("drop").then(async () => {
      await speak(getPlacedSyllableSpeechText(challenge, tile, slotIndex));

      if (nextPlaced.every(Boolean)) {
        finishWord();
      }
    });
  }

  function finishWord() {
    const wind = calculateWind(startedAt, mistakes);
    const nextJourney = buildJourney(islandStartIndex, wind);
    const sailingDuration = SAILING_DURATIONS[wind];
    const segmentDuration = Math.round(sailingDuration / wind);
    setJourney(nextJourney);
    setLastTreasuresFound(nextJourney.treasuresFound);
    setIsSailingMotionActive(true);
    setPhase("sailing");

    let collectedBefore = 0;
    nextJourney.islands.forEach((island) => {
      if (!island.hasTreasure || island.sailingOrder == null) {
        return;
      }

      const collectAt = Math.round(
        island.sailingOrder * segmentDuration + segmentDuration * CHEST_COLLECT_SEGMENT_RATIO + collectedBefore * CHEST_COLLECT_PAUSE_MS,
      );
      collectedBefore += 1;

      window.setTimeout(() => {
        const burstId = chestBurstIdRef.current + 1;
        chestBurstIdRef.current = burstId;

        setIsCollectingChest(true);
        setChestBursts((value) => [...value, burstId]);
        setTreasures((value) => value + 1);
        void playEffect("chest");

        window.setTimeout(() => {
          setIsCollectingChest(false);
        }, CHEST_COLLECT_PAUSE_MS);

        window.setTimeout(() => {
          setChestBursts((value) => value.filter((id) => id !== burstId));
        }, 980);
      }, collectAt);
    });

    window.setTimeout(() => {
      if (wordIndex + 1 >= sessionWords.length) {
        setIslandStartIndex((value) => value + nextJourney.wind);
        setPhase("done");
        void playEffect("levelComplete");
      } else {
        setIslandStartIndex((value) => value + nextJourney.wind);
        setWordIndex((value) => value + 1);
        setPhase("playing");
      }
    }, sailingDuration + nextJourney.treasuresFound * CHEST_COLLECT_PAUSE_MS + 260);
  }

  function handlePointerDown(tile: Tile, event: ReactPointerEvent<HTMLButtonElement>) {
    if (phase !== "playing" || usedTileIds.includes(tile.id)) {
      return;
    }

    event.preventDefault();
    void playEffect("select");
    dragStateRef.current = {
      tileId: tile.id,
      text: tile.text,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      isDragging: false,
    };
    setSelectedTileId(tile.id);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentDrag = dragStateRef.current;

      if (!currentDrag) {
        return;
      }

      const movedDistance = Math.hypot(moveEvent.clientX - currentDrag.startX, moveEvent.clientY - currentDrag.startY);
      const isDragging = currentDrag.isDragging || movedDistance >= DRAG_THRESHOLD;

      dragStateRef.current = {
        ...currentDrag,
        x: moveEvent.clientX,
        y: moveEvent.clientY,
        isDragging,
      };

      if (isDragging) {
        const element = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        const slot = element?.closest("[data-slot-index]") as HTMLElement | null;
        setActiveSlot(slot?.dataset.slotIndex != null ? Number(slot.dataset.slotIndex) : null);
      }

      forceDragRender((value) => value + 1);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      const currentDrag = dragStateRef.current;
      const element = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
      const slot = element?.closest("[data-slot-index]") as HTMLElement | null;

      if (currentDrag?.isDragging && slot?.dataset.slotIndex != null) {
        placeTile(currentDrag.tileId, Number(slot.dataset.slotIndex));
      } else if (currentDrag) {
        setSelectedTileId((current) => (current === currentDrag.tileId ? null : currentDrag.tileId));
      }

      dragStateRef.current = null;
      setActiveSlot(null);
      forceDragRender((value) => value + 1);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  }

  function restartSession() {
    savedSessionRef.current = false;
    setWordIndex(0);
    setTreasures(0);
    setIslandStartIndex(0);
    setIsCollectingChest(false);
    setIsSailingMotionActive(false);
    setChestBursts([]);
    setJourney(null);
    setPhase("intro");
  }

  const currentDrag = dragStateRef.current?.isDragging ? dragStateRef.current : null;
  const showGamePanel = phase === "playing";
  const showHud = phase === "playing" || phase === "sailing" || phase === "done";
  const visibleIslands = phase === "sailing" && journey ? journey.islands : buildSceneIslands(islandStartIndex, 2);
  const sailingDuration = journey ? SAILING_DURATIONS[journey.wind] : 0;
  const cloudStartDistance = islandStartIndex * -13;
  const cloudEndDistance = (islandStartIndex + (phase === "sailing" ? (journey?.wind ?? 0) : 0)) * -13;

  return (
    <section className={`bateau-game bateau-game--${phase} ${isCollectingChest ? "bateau-game--collecting" : ""}`} aria-label="Jeu Bateau">
      <OceanCanvas
        paused={isCollectingChest}
        sailing={phase === "sailing" && isSailingMotionActive}
        sailingDuration={sailingDuration}
        wind={journey?.wind ?? 1}
      />

      {showHud ? (
        <div className="bateau-game__hud">
          <ProgressBar current={completedCount} total={sessionWords.length} score={treasures} />
        </div>
      ) : null}

      <div className="bateau-game__world" aria-hidden="true">
        <div
          className={`bateau-game__cloud-track ${phase === "sailing" ? "bateau-game__cloud-track--sailing" : ""}`}
          style={
            {
              "--cloud-start-distance": `${cloudStartDistance}vw`,
              "--cloud-end-distance": `${cloudEndDistance}vw`,
              "--cloud-sailing-duration": `${sailingDuration}ms`,
            } as CSSProperties
          }
        >
          {SCENE_CLOUDS.map((cloud) => (
            <span
              className="bateau-game__cloud"
              key={cloud.id}
              style={
                {
                  left: `${cloud.left}vw`,
                  top: `${cloud.top}px`,
                  "--cloud-scale": cloud.scale,
                  "--cloud-drift-duration": `${cloud.duration}ms`,
                  "--cloud-drift-delay": `${cloud.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div
          className={`bateau-game__island-track ${phase === "sailing" ? "bateau-game__island-track--sailing" : ""}`}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) {
              setIsSailingMotionActive(false);
            }
          }}
          style={
            {
              "--sailing-duration": `${sailingDuration}ms`,
              "--sailing-distance-desktop": `${journey ? journey.wind * -48 : 0}vw`,
              "--sailing-distance-mobile": `${journey ? journey.wind * -58 : 0}vw`,
            } as CSSProperties
          }
        >
          {visibleIslands.map((island, index) => (
            <div
              className={["bateau-game__island", `bateau-game__island--${island.size}`, island.hasTreasure ? "bateau-game__island--treasure" : ""]
                .filter(Boolean)
                .join(" ")}
              key={island.id}
              style={
                {
                  "--island-left-desktop": `calc(7% + ${index * 48}vw)`,
                  "--island-left-mobile": `calc(-24px + ${index * 58}vw)`,
                } as CSSProperties
              }
            >
              <img
                className="bateau-game__island-asset"
                src={island.hasTreasure ? ISLAND_WITH_CHEST_ASSET_PATH : ISLAND_WITHOUT_CHEST_ASSET_PATH}
                alt=""
                draggable={false}
              />
            </div>
          ))}
        </div>
        {phase === "sailing"
          ? Array.from({ length: 6 + (journey?.wind ?? 1) * 3 }, (_, index) => (
              <span
                className="bateau-game__wind"
                key={`wind-${index}`}
                style={
                  {
                    "--wind-top": `${166 + (index % 6) * 24}px`,
                    "--wind-width": `${74 + (index % 6) * 7}px`,
                    "--wind-delay": `${index * -180}ms`,
                    "--wind-duration": `${2700 - (journey?.wind ?? 1) * 300}ms`,
                  } as CSSProperties
                }
              />
            ))
          : null}
        <BoatAsset />
        {chestBursts.map((burstId) => (
          <div className="bateau-game__collect-burst" key={burstId}>
            <span className="bateau-game__collect-spark bateau-game__collect-spark--one" />
            <span className="bateau-game__collect-spark bateau-game__collect-spark--two" />
            <img src={CHEST_ICON_ASSET_PATH} alt="" draggable={false} />
            <strong>+1</strong>
          </div>
        ))}
      </div>

      {phase === "intro" ? (
        <div className="bateau-game__intro">
          <PanaMascot />
          <GameButton onClick={() => void startIntroDialog()} variant="primary">
            Commencer
          </GameButton>
        </div>
      ) : null}

      {phase === "dialog" ? (
        <div className="bateau-game__intro bateau-game__intro--dialog">
          <PanaMascot />
          <div className="bateau-game__speech" aria-live="polite">
            {introLines[dialogLineIndex]}
          </div>
          <GameButton onClick={skipIntroDialog} variant="secondary">
            Passer
          </GameButton>
        </div>
      ) : null}

      {phase === "sailing" && journey ? (
        <div className="bateau-game__sailing-panel">
          <div className="bateau-game__sailing-status" aria-live="polite">
            <PanaMascot compact />
            <div>
              <strong>{getWindLabel(journey.wind)}</strong>
              <span>
                {journey.treasuresFound > 0
                  ? `${journey.treasuresFound} coffre${journey.treasuresFound > 1 ? "s" : ""} collecte${journey.treasuresFound > 1 ? "s" : ""}`
                  : "On file vers la prochaine ile"}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {showGamePanel ? (
        <div className="bateau-game__panel">
          <div className="bateau-game__image-card">
            <div className="bateau-game__picture" aria-hidden="true">
              {wordAtlasFrame ? (
                <span className="bateau-game__word-frame">
                  <span className="bateau-game__word-atlas-viewport" style={getWordAtlasStyle(wordAtlasFrame)}>
                    <img className="bateau-game__word-atlas" src={WORD_ATLAS_ASSET_PATH} alt="" draggable={false} />
                  </span>
                </span>
              ) : (
                <span className="bateau-game__picture-fallback" />
              )}
              <AudioButton className="bateau-game__audio" label={`Ecouter ${challenge.displayWord}`} onClick={() => void speak(challenge.displayWord)} />
            </div>
          </div>

          <div className="bateau-game__challenge">
            <div className="bateau-game__challenge-header">
              <p className="bateau-game__eyebrow" id="bateau-title">
                Compose le mot
              </p>
              {lastTreasuresFound > 0 ? <RewardBurst points={lastTreasuresFound} /> : null}
            </div>
            <div className="bateau-game__slots" aria-label="Emplacements des syllabes">
              {placed.map((slot, index) => (
                <DropSlot
                  active={activeSlot === index}
                  index={index}
                  key={`${challenge.id}-slot-${index}`}
                  onDropTile={placeTile}
                  value={slot?.text}
                />
              ))}
            </div>
          </div>

          <div className="bateau-game__syllables" aria-label="Syllabes disponibles">
            {tiles.map((tile) => (
              <div className="bateau-game__tile-wrap" key={tile.id}>
                <SyllableTile
                  id={tile.id}
                  onPointerDown={(event) => handlePointerDown(tile, event)}
                  selected={selectedTileId === tile.id}
                  state={wrongTileId === tile.id ? "wrong" : "default"}
                  text={tile.text}
                  used={usedTileIds.includes(tile.id)}
                />
                <AudioButton
                  className="bateau-game__tile-audio"
                  label={`Ecouter ${tile.text}`}
                  onClick={() => void speak(getChallengeSyllableSpeechText(challenge, tile.text))}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="bateau-game__panel bateau-game__panel--end">
          <div className="bateau-game__end" aria-live="polite">
            <p className="bateau-game__eyebrow">Coffres ouverts</p>
            <h2>Session terminee</h2>
            <p>
              {sessionWords.length} mots reussis, {treasures} coffre{treasures > 1 ? "s" : ""} collecte{treasures > 1 ? "s" : ""}.
            </p>
            <div className="bateau-game__end-actions">
              <GameButton onClick={restartSession} variant="success">
                Rejouer
              </GameButton>
              <GameButton onClick={() => void speak("Bravo")} variant="secondary">
                Ecouter bravo
              </GameButton>
            </div>
          </div>
        </div>
      ) : null}

      {currentDrag ? <SyllableTile floating id={currentDrag.tileId} text={currentDrag.text} style={{ left: currentDrag.x, top: currentDrag.y }} /> : null}
    </section>
  );
}
