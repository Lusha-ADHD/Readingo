import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { sitePath } from "../../utils/paths";
import type { BateauProgress } from "./bateauProgress";
import "./LevelMap.css";

export type BateauLevel = {
  id: string;
  level: number;
  title: string;
  difficultyTier: number;
  gameIds: string[];
  wordIds: string[];
};

type MapPoint = { x: number; y: number };

type LevelMapProps = {
  levels: BateauLevel[];
  progress: BateauProgress;
  newlyUnlockedLevel: number | null;
  recentlyCompletedLevel: number | null;
  onSelectLevel: (level: BateauLevel) => void;
  onClose?: () => void;
  onUnlockAnimationComplete: () => void;
};

const MAP_HEIGHT = 2200;
const LEVEL_POINTS: MapPoint[] = [
  { x: 31, y: 150 },
  { x: 69, y: 480 },
  { x: 31, y: 810 },
  { x: 69, y: 1140 },
  { x: 31, y: 1470 },
  { x: 69, y: 1800 },
];
const FINAL_POINT: MapPoint = { x: 50, y: 2110 };
const TRANSIT_ASSETS = ["map-island-sandbar.png", "map-island-rocky.png", "map-island-palms.png"];

function pathBetween(from: MapPoint, to: MapPoint) {
  const middleY = Math.round((from.y + to.y) / 2);
  return `M ${from.x} ${from.y} C ${from.x} ${middleY}, ${to.x} ${middleY}, ${to.x} ${to.y}`;
}

function interpolatePoint(from: MapPoint, to: MapPoint, ratio: number, direction: number): MapPoint {
  const eased = ratio * ratio * (3 - 2 * ratio);
  const curve = Math.sin(Math.PI * ratio) * 7 * direction;
  return {
    x: from.x + (to.x - from.x) * eased + curve,
    y: from.y + (to.y - from.y) * ratio,
  };
}

function getSegmentState(index: number, progress: BateauProgress) {
  if (progress.completedLevels.includes(index + 1)) {
    return "complete";
  }

  if (progress.unlockedLevel === index + 1) {
    return "next";
  }

  return "locked";
}

export function LevelMap({
  levels,
  progress,
  newlyUnlockedLevel,
  recentlyCompletedLevel,
  onSelectLevel,
  onClose,
  onUnlockAnimationComplete,
}: LevelMapProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<number, HTMLButtonElement>());
  const targetPoint = newlyUnlockedLevel === levels.length + 1 ? FINAL_POINT : LEVEL_POINTS[(newlyUnlockedLevel ?? progress.unlockedLevel) - 1];
  const previousPoint = newlyUnlockedLevel && newlyUnlockedLevel > 1 ? LEVEL_POINTS[Math.min(newlyUnlockedLevel - 2, levels.length - 1)] : targetPoint;
  const frontierPoint = progress.completedLevels.includes(levels.length) ? FINAL_POINT : LEVEL_POINTS[progress.unlockedLevel - 1];
  const boatPoint = newlyUnlockedLevel ? targetPoint : frontierPoint;

  const segments = useMemo(
    () =>
      levels.map((level, index) => {
        const from = LEVEL_POINTS[index];
        const to = index === levels.length - 1 ? FINAL_POINT : LEVEL_POINTS[index + 1];
        return {
          level,
          from,
          to,
          path: pathBetween(from, to),
          state: getSegmentState(index, progress),
          transitPoints: [0.33, 0.5, 0.67].map((ratio) => interpolatePoint(from, to, ratio, index % 2 === 0 ? 1 : -1)),
        };
      }),
    [levels, progress],
  );

  useEffect(() => {
    const scroller = scrollerRef.current;
    const targetLevel = newlyUnlockedLevel && newlyUnlockedLevel <= levels.length ? newlyUnlockedLevel : progress.unlockedLevel;
    const target = nodeRefs.current.get(targetLevel);

    if (!scroller || !target) {
      return;
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const top = Math.max(0, target.offsetTop - scroller.clientHeight / 2 + target.clientHeight / 2);
    scroller.scrollTo({ top, behavior: newlyUnlockedLevel && !reduceMotion ? "smooth" : "auto" });
  }, [levels.length, newlyUnlockedLevel, progress.unlockedLevel]);

  useEffect(() => {
    if (!newlyUnlockedLevel) {
      return;
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const timeout = window.setTimeout(() => {
      onUnlockAnimationComplete();
    }, reduceMotion ? 150 : 1150);

    return () => window.clearTimeout(timeout);
  }, [newlyUnlockedLevel, onUnlockAnimationComplete]);

  return (
    <div className="level-map" aria-label="Carte des niveaux">
      <header className="level-map__header">
        <img className="level-map__pana" src={sitePath("/assets/characters/pana.png")} alt="Pana" draggable={false} />
        <div>
          <span>Le parcours de Pana</span>
          <h2>L’Archipel</h2>
        </div>
        <div className="level-map__total" aria-label={`${progress.totalTreasures} coffres collectés au total`}>
          <img src={sitePath("/assets/world/Chest.png")} alt="" draggable={false} />
          <strong>{progress.totalTreasures}</strong>
        </div>
        {onClose ? (
          <button className="level-map__close" onClick={onClose} type="button" aria-label="Fermer la carte">
            ×
          </button>
        ) : null}
      </header>

      <div className="level-map__scroller" ref={scrollerRef}>
        <div className="level-map__course" style={{ height: `${MAP_HEIGHT}px` }}>
          <svg className="level-map__routes" viewBox={`0 0 100 ${MAP_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
            {segments.map((segment, index) => (
              <path
                className={`level-map__route level-map__route--${segment.state} ${newlyUnlockedLevel === index + 2 ? "level-map__route--unlocking" : ""}`}
                d={segment.path}
                key={segment.level.id}
                pathLength="1"
              />
            ))}
          </svg>

          {segments.flatMap((segment, segmentIndex) =>
            segment.transitPoints.map((point, pointIndex) => (
              <img
                className={`level-map__transit level-map__transit--${segment.state} ${newlyUnlockedLevel === segmentIndex + 2 ? "level-map__transit--unlocking" : ""}`}
                src={sitePath(`/assets/world/${TRANSIT_ASSETS[(segmentIndex + pointIndex) % TRANSIT_ASSETS.length]}`)}
                alt=""
                aria-hidden="true"
                draggable={false}
                key={`${segment.level.id}-transit-${pointIndex}`}
                style={
                  {
                    left: `${point.x}%`,
                    top: `${point.y}px`,
                    "--transit-delay": `${pointIndex * 120 + 280}ms`,
                    "--transit-scale": 0.66 + ((segmentIndex + pointIndex) % 3) * 0.1,
                    "--transit-flip": (segmentIndex + pointIndex) % 2 === 0 ? 1 : -1,
                  } as CSSProperties
                }
              />
            )),
          )}

          {levels.map((level, index) => {
            const point = LEVEL_POINTS[index];
            const completed = progress.completedLevels.includes(level.level);
            const unlocked = level.level <= progress.unlockedLevel;
            const frontier = level.level === progress.unlockedLevel && !completed;
            const state = completed ? "complete" : frontier ? "frontier" : unlocked ? "available" : "locked";
            const best = progress.bestTreasuresByLevel[String(level.level)] ?? 0;
            const justCompleted = recentlyCompletedLevel === level.level;
            const firstCompletion = justCompleted && newlyUnlockedLevel !== null;

            return (
              <button
                className={`level-map__node level-map__node--${state} ${newlyUnlockedLevel === level.level ? "level-map__node--new" : ""} ${firstCompletion ? "level-map__node--just-completed" : ""} ${justCompleted && !firstCompletion ? "level-map__node--replayed" : ""}`}
                disabled={!unlocked}
                key={level.id}
                onClick={() => onSelectLevel(level)}
                ref={(element) => {
                  if (element) nodeRefs.current.set(level.level, element);
                }}
                style={{ left: `${point.x}%`, top: `${point.y}px`, "--node-delay": `${index * 70}ms` } as CSSProperties}
                type="button"
                aria-label={
                  unlocked
                    ? `Niveau ${level.level}, ${level.title}${completed ? `, terminé, meilleur score ${best} coffres` : ", disponible"}`
                    : `Niveau ${level.level}, ${level.title}, verrouillé`
                }
              >
                <span className="level-map__island-wrap">
                  {firstCompletion ? (
                    <>
                      <img className="level-map__island level-map__island--before" src={sitePath("/assets/world/IslandWithoutChest.png")} alt="" draggable={false} />
                      <img className="level-map__island level-map__island--after" src={sitePath("/assets/world/IslandWithChest.png")} alt="" draggable={false} />
                    </>
                  ) : (
                    <img
                      className="level-map__island"
                      src={sitePath(completed ? "/assets/world/IslandWithChest.png" : "/assets/world/IslandWithoutChest.png")}
                      alt=""
                      draggable={false}
                    />
                  )}
                  <strong className="level-map__number">{completed ? "✓" : unlocked ? level.level : "▰"}</strong>
                </span>
                <span className="level-map__label">
                  <strong>Niveau {level.level}</strong>
                  <span>{level.title}</span>
                  {completed ? <small>{best} coffre{best > 1 ? "s" : ""}</small> : frontier ? <small>Jouer</small> : null}
                </span>
              </button>
            );
          })}

          <div
            className={`level-map__final ${progress.completedLevels.includes(levels.length) ? "level-map__final--complete" : ""} ${newlyUnlockedLevel === levels.length + 1 ? "level-map__final--new" : ""}`}
            style={{ left: `${FINAL_POINT.x}%`, top: `${FINAL_POINT.y}px` }}
            aria-label={progress.completedLevels.includes(levels.length) ? "Trésor final atteint" : "Trésor final verrouillé"}
          >
            <img src={sitePath("/assets/world/IslandWithChest.png")} alt="" draggable={false} />
            <strong>{progress.completedLevels.includes(levels.length) ? "Archipel terminé !" : "Trésor final"}</strong>
          </div>

          <div
            className={`level-map__boat ${newlyUnlockedLevel ? "level-map__boat--travelling" : ""}`}
            style={
              {
                "--boat-from-x": `${previousPoint.x}%`,
                "--boat-from-y": `${previousPoint.y}px`,
                "--boat-to-x": `${boatPoint.x}%`,
                "--boat-to-y": `${boatPoint.y}px`,
              } as CSSProperties
            }
            aria-hidden="true"
          >
            <img src={sitePath("/assets/world/boat.png")} alt="" draggable={false} />
          </div>

        </div>
      </div>

      {newlyUnlockedLevel ? (
        <div className="level-map__unlock-message" role="status" aria-live="polite">
          {newlyUnlockedLevel <= levels.length ? `Niveau ${newlyUnlockedLevel} débloqué` : "Archipel terminé"}
        </div>
      ) : null}
    </div>
  );
}
