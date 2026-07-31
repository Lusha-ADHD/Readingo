import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { sitePath } from "../../../utils/paths";
import { TutorialPointer } from "../../ui/TutorialPointer";
import type { LetterLesson } from "./letterGame";
import { LETTERS_CONSTELLATIONS } from "./lettersConstellations";
import type { LettersProgress } from "./lettersProgress";
import "./LettersLevelMap.css";

type MapPoint = {
  x: number;
  y: number;
};

type Props = {
  lessons: LetterLesson[];
  progress: LettersProgress;
  newlyUnlockedLevel: number | null;
  onSelectLevel: (lesson: LetterLesson) => void;
  onUnlockAnimationComplete: () => void;
};

const MAP_TOP = 170;
const MAP_GAP = 300;
const MAP_BOTTOM = 230;
const LEVEL_POINTS: MapPoint[] = LETTERS_CONSTELLATIONS.map((_, index) => ({
  x: index % 2 === 0 ? 31 : 69,
  y: MAP_TOP + index * MAP_GAP,
}));
const MAP_HEIGHT = MAP_TOP + (LETTERS_CONSTELLATIONS.length - 1) * MAP_GAP + MAP_BOTTOM;

function pathBetween(from: MapPoint, to: MapPoint) {
  const middleY = Math.round((from.y + to.y) / 2);
  return `M ${from.x} ${from.y} C ${from.x} ${middleY}, ${to.x} ${middleY}, ${to.x} ${to.y}`;
}

export function LettersLevelMap({
  lessons,
  progress,
  newlyUnlockedLevel,
  onSelectLevel,
  onUnlockAnimationComplete,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<number, HTMLButtonElement>());
  const lessonByLevel = new Map(lessons.map((lesson) => [lesson.level, lesson]));
  const completedCount = progress.completedLevels.filter((level) => lessonByLevel.has(level)).length;

  useEffect(() => {
    const scroller = scrollerRef.current;
    const targetLevel = Math.min(
      newlyUnlockedLevel ?? progress.unlockedLevel,
      lessons.length,
    );
    const target = nodeRefs.current.get(Math.max(1, targetLevel));

    if (!scroller || !target) {
      return;
    }

    const top = Math.max(
      0,
      target.offsetTop - scroller.clientHeight / 2 + target.clientHeight / 2,
    );
    scroller.scrollTo({ top, behavior: "auto" });
  }, [lessons.length, newlyUnlockedLevel, progress.unlockedLevel]);

  useEffect(() => {
    if (!newlyUnlockedLevel) {
      return;
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const timeout = window.setTimeout(
      onUnlockAnimationComplete,
      reduceMotion ? 150 : 1_150,
    );
    return () => window.clearTimeout(timeout);
  }, [newlyUnlockedLevel, onUnlockAnimationComplete]);

  return (
    <div className="letters-map" aria-label="Carte céleste des niveaux">
      <header className="letters-map__header">
        <img
          className="letters-map__pana"
          src={sitePath("/assets/characters/pana.png")}
          alt="Pana"
          draggable={false}
        />
        <div>
          <span>Le ciel de Pana</span>
          <h2>Carte des constellations</h2>
        </div>
        <div
          className="letters-map__total"
          aria-label={`${completedCount} constellation${completedCount > 1 ? "s" : ""} terminée${completedCount > 1 ? "s" : ""} sur ${lessons.length}`}
        >
          <span aria-hidden="true">★</span>
          <strong>{completedCount}/{lessons.length}</strong>
        </div>
      </header>

      <div className="letters-map__scroller" ref={scrollerRef}>
        <div className="letters-map__course" style={{ height: `${MAP_HEIGHT}px` }}>
          <span className="letters-map__nebula letters-map__nebula--one" />
          <span className="letters-map__nebula letters-map__nebula--two" />
          <span className="letters-map__nebula letters-map__nebula--three" />
          <span className="letters-map__nebula letters-map__nebula--four" />
          <span className="letters-map__shooting-star" />

          <svg
            className="letters-map__route-layer"
            viewBox={`0 0 100 ${MAP_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {LEVEL_POINTS.slice(0, -1).map((point, index) => {
              const destinationLevel = index + 2;
              const destinationExists = lessonByLevel.has(destinationLevel);
              const travelled =
                destinationExists &&
                destinationLevel <= progress.unlockedLevel &&
                progress.completedLevels.includes(destinationLevel - 1);

              return (
                <path
                  className={`letters-map__route ${
                    travelled
                      ? "letters-map__route--complete"
                      : destinationExists
                        ? "letters-map__route--locked"
                        : "letters-map__route--coming"
                  } ${newlyUnlockedLevel === destinationLevel ? "letters-map__route--unlocking" : ""}`}
                  d={pathBetween(point, LEVEL_POINTS[index + 1])}
                  key={`route-${index}`}
                  pathLength="1"
                />
              );
            })}
          </svg>

          {LETTERS_CONSTELLATIONS.map((constellation, index) => {
            const level = index + 1;
            const point = LEVEL_POINTS[index];
            const lesson = lessonByLevel.get(level);
            const completed = Boolean(lesson) && progress.completedLevels.includes(level);
            const unlocked = Boolean(lesson) && level <= progress.unlockedLevel;
            const frontier = unlocked && level === progress.unlockedLevel && !completed;
            const state = !lesson
              ? "coming"
              : completed
                ? "complete"
                : frontier
                  ? "frontier"
                  : unlocked
                    ? "available"
                    : "locked";
            const interactive = Boolean(lesson) && unlocked;

            return (
              <button
                className={`letters-map__node letters-map__node--${state} ${newlyUnlockedLevel === level ? "letters-map__node--new" : ""}`}
                disabled={!interactive}
                key={constellation.id}
                onClick={() => lesson && onSelectLevel(lesson)}
                ref={(element) => {
                  if (element) {
                    nodeRefs.current.set(level, element);
                  }
                }}
                style={
                  {
                    left: `${point.x}%`,
                    top: `${point.y}px`,
                    "--node-delay": `${index * 45}ms`,
                  } as CSSProperties
                }
                type="button"
                aria-label={
                  !lesson
                    ? `Niveau ${level}, constellation à venir`
                    : completed
                      ? `Niveau ${level}, ${lesson.title}, terminé, rejouer`
                      : unlocked
                        ? `Niveau ${level}, ${lesson.title}, disponible`
                        : `Niveau ${level}, ${lesson.title}, verrouillé`
                }
              >
                <span className="letters-map__constellation-wrap">
                  <svg
                    className="letters-map__constellation"
                    viewBox="0 0 100 88"
                    preserveAspectRatio="xMidYMid meet"
                    aria-hidden="true"
                  >
                    {constellation.connections.map(([fromIndex, toIndex], connectionIndex) => {
                      const from = constellation.points[fromIndex];
                      const to = constellation.points[toIndex];

                      return (
                        <line
                          className="letters-map__constellation-link"
                          key={`${constellation.id}-link-${connectionIndex}`}
                          x1={from.x}
                          x2={to.x}
                          y1={from.y}
                          y2={to.y}
                        />
                      );
                    })}
                    {constellation.points.map((star, starIndex) => (
                      <g
                        className="letters-map__constellation-star"
                        key={`${constellation.id}-star-${starIndex}`}
                        transform={`translate(${star.x} ${star.y})`}
                      >
                        <circle className="letters-map__constellation-halo" r="5" />
                        <path d="M0-4 1.1-1.2 4 0 1.1 1.2 0 4-1.1 1.2-4 0-1.1-1.2Z" />
                      </g>
                    ))}
                  </svg>
                  <strong className="letters-map__number">{completed ? "✓" : level}</strong>
                </span>

                <span className="letters-map__label">
                  <strong>Niveau {level}</strong>
                  <span>{lesson?.title ?? `Constellation ${level}`}</span>
                  <small>
                    {!lesson
                      ? "À venir"
                      : completed
                        ? "Rejouer"
                        : frontier
                          ? "Jouer"
                          : "Verrouillé"}
                  </small>
                </span>

                {frontier ? (
                  <TutorialPointer className="letters-map__tutorial-pointer" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {newlyUnlockedLevel ? (
        <div className="letters-map__unlock-message" role="status" aria-live="polite">
          Niveau {newlyUnlockedLevel} débloqué
        </div>
      ) : null}
    </div>
  );
}
