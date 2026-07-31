import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { sitePath } from "../../../utils/paths";
import { TutorialPointer } from "../../ui/TutorialPointer";
import type { SentierLesson } from "./sentierContent";
import type { SentierProgress } from "./sentierProgress";
import { SENTIER_MAP_PANELS, SENTIER_MAP_STAGES } from "./sentierMap";
import "./SentierLevelMap.css";

type Props = {
  lessons: SentierLesson[];
  progress: SentierProgress;
  newlyUnlockedLevel: number | null;
  onSelectLevel: (lesson: SentierLesson) => void;
  onUnlockAnimationComplete: () => void;
};

const PANA_PATH = sitePath("/assets/characters/pana.png");
const GEM_PATH = sitePath("/assets/world/jungle/gem.png");
const CLOSED_CHEST_PATH = sitePath("/assets/world/jungle/treasure-chest-buried.webp");
const OPEN_CHEST_PATH = sitePath("/assets/world/jungle/treasure-chest-open.webp");

export function SentierLevelMap({
  lessons,
  progress,
  newlyUnlockedLevel,
  onSelectLevel,
  onUnlockAnimationComplete,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<number, HTMLButtonElement>());
  const lessonByLevel = useMemo(
    () => new Map(lessons.map((lesson) => [lesson.level, lesson])),
    [lessons],
  );
  const totalGems = Object.entries(progress.bestGemsByLevel).reduce(
    (total, [level, score]) => lessonByLevel.has(Number(level)) ? total + score : total,
    0,
  );

  useEffect(() => {
    const scroller = scrollerRef.current;
    const targetLevel = Math.min(newlyUnlockedLevel ?? progress.unlockedLevel, lessons.length);
    const target = nodeRefs.current.get(Math.max(1, targetLevel));

    if (!scroller || !target) return;
    const scrollerBox = scroller.getBoundingClientRect();
    const targetBox = target.getBoundingClientRect();
    const top = Math.max(
      0,
      scroller.scrollTop + targetBox.top - scrollerBox.top - scroller.clientHeight / 2 + targetBox.height / 2,
    );
    scroller.scrollTo({ top, behavior: "auto" });
  }, [lessons.length, newlyUnlockedLevel, progress.unlockedLevel]);

  useEffect(() => {
    if (!newlyUnlockedLevel) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const timeout = window.setTimeout(onUnlockAnimationComplete, reduceMotion ? 120 : 1_050);
    return () => window.clearTimeout(timeout);
  }, [newlyUnlockedLevel, onUnlockAnimationComplete]);

  return (
    <section className="sentier-map" aria-label="Carte des étapes de la grande jungle">
      <header className="sentier-map__header">
        <img src={PANA_PATH} alt="Pana" draggable={false} />
        <div>
          <p>Le Sentier des mots</p>
          <h2>Choisis une étape</h2>
        </div>
        <strong className="sentier-map__total" aria-label={`${totalGems} gemmes sur 288`}>
          <img src={GEM_PATH} alt="" /> {totalGems}/288
        </strong>
      </header>

      <div className="sentier-map__scroller" ref={scrollerRef}>
        <div className="sentier-map__course">
          {SENTIER_MAP_PANELS.map((source, panelIndex) => (
            <div className="sentier-map__panel" key={source}>
              <img
                className="sentier-map__art"
                src={sitePath(source)}
                alt=""
                width="1024"
                height="1536"
                loading={panelIndex === Math.floor((progress.unlockedLevel - 1) / 3) ? "eager" : "lazy"}
                draggable={false}
              />
              {SENTIER_MAP_STAGES.filter((stage) => stage.panel === panelIndex).map((stage) => {
                const lesson = lessonByLevel.get(stage.level);
                if (!lesson) return null;
                const completed = progress.completedLevels.includes(stage.level);
                const unlocked = stage.level <= progress.unlockedLevel;
                const state = completed ? "completed" : unlocked ? "available" : "locked";
                const showPointer = unlocked && !completed && stage.level === progress.unlockedLevel;

                return (
                  <button
                    className={`sentier-map__node sentier-map__node--${state} ${newlyUnlockedLevel === stage.level ? "sentier-map__node--new" : ""}`}
                    disabled={!unlocked}
                    key={stage.level}
                    onClick={() => onSelectLevel(lesson)}
                    ref={(element) => {
                      if (element) nodeRefs.current.set(stage.level, element);
                    }}
                    style={{ left: `${stage.x}%`, top: `${stage.y}%` } as CSSProperties}
                    type="button"
                    aria-label={completed
                      ? `Niveau ${stage.level}, ${lesson.title}, terminé, rejouer`
                      : unlocked
                        ? `Niveau ${stage.level}, ${lesson.title}, disponible`
                        : `Niveau ${stage.level}, ${lesson.title}, verrouillé`}
                  >
                    <span className="sentier-map__chest-wrap">
                      <span className="sentier-map__halo" />
                      <img src={completed ? OPEN_CHEST_PATH : CLOSED_CHEST_PATH} alt="" draggable={false} />
                      <strong>{completed ? "✓" : stage.level}</strong>
                    </span>
                    <span className="sentier-map__label">
                      <b>{lesson.title}</b>
                      <small>{completed ? "Rejouer" : unlocked ? "Jouer" : "Verrouillé"}</small>
                    </span>
                    {showPointer ? <TutorialPointer className="sentier-map__pointer" /> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
