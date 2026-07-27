import { useState } from "react";
import type { CSSProperties } from "react";
import { sitePath } from "../../../utils/paths";
import { PanaMascot } from "../../ui/PanaMascot";
import { OceanCanvas } from "./OceanCanvas";
import {
  buildSceneIslands,
  getWindLabel,
  SAILING_DURATIONS,
} from "./syllabesJourney";
import type { SyllabesPhase, Journey } from "./syllabesJourney";

const BOAT_ASSET_PATH = sitePath("/assets/world/boat.png");
const ISLAND_WITHOUT_CHEST_ASSET_PATH = sitePath(
  "/assets/world/IslandWithoutChest.png",
);
const CHEST_ICON_ASSET_PATH = sitePath("/assets/world/Chest.png");
const SCENE_CLOUDS = Array.from({ length: 18 }, (_, index) => ({
  id: `cloud-${index}`,
  left: -18 + index * 38,
  top: 42 + (index % 4) * 25,
  scale: 0.72 + (index % 3) * 0.17,
  duration: 8200 + (index % 5) * 1300,
  delay: -1100 * (index % 7),
}));

type Props = {
  phase: SyllabesPhase;
  collectingChest: boolean;
  sailingMotionActive: boolean;
  journey: Journey | null;
  islandStartIndex: number;
  chestBursts: number[];
  collectedTreasureIslandIds: string[];
  onSailingMotionComplete: () => void;
};

function BoatAsset() {
  const [assetFailed, setAssetFailed] = useState(false);

  return (
    <div
      className={`syllabes-game__boat ${
        assetFailed ? "syllabes-game__boat--asset-failed" : ""
      }`}
    >
      <img
        className="syllabes-game__boat-asset"
        src={BOAT_ASSET_PATH}
        alt=""
        draggable={false}
        hidden={assetFailed}
        onError={(event) => {
          event.currentTarget.hidden = true;
          setAssetFailed(true);
        }}
      />
      <div className="syllabes-game__boat-fallback" aria-hidden="true">
        <div className="syllabes-game__sail" />
      </div>
    </div>
  );
}

export function SyllabesScene({
  phase,
  collectingChest,
  sailingMotionActive,
  journey,
  islandStartIndex,
  chestBursts,
  collectedTreasureIslandIds,
  onSailingMotionComplete,
}: Props) {
  const sailingDuration = journey ? SAILING_DURATIONS[journey.wind] : 0;
  const visibleIslands =
    phase === "sailing" && journey
      ? journey.islands
      : buildSceneIslands(islandStartIndex, 2);
  const cloudStartDistance = islandStartIndex * -13;
  const cloudEndDistance =
    (islandStartIndex +
      (phase === "sailing" ? (journey?.wind ?? 0) : 0)) *
    -13;

  return (
    <>
      <OceanCanvas
        paused={collectingChest}
        sailing={phase === "sailing" && sailingMotionActive}
        sailingDuration={sailingDuration}
        wind={journey?.wind ?? 1}
      />

      <div className="syllabes-game__world" aria-hidden="true">
        <div
          className={`syllabes-game__cloud-track ${
            phase === "sailing" ? "syllabes-game__cloud-track--sailing" : ""
          }`}
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
              className="syllabes-game__cloud"
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

        {phase !== "map" ? (
          <>
            <div
              className={`syllabes-game__island-track ${
                phase === "sailing"
                  ? "syllabes-game__island-track--sailing"
                  : ""
              }`}
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) {
                  onSailingMotionComplete();
                }
              }}
              style={
                {
                  "--sailing-duration": `${sailingDuration}ms`,
                  "--sailing-distance-desktop": `${
                    journey ? journey.wind * -48 : 0
                  }vw`,
                  "--sailing-distance-mobile": `${
                    journey ? journey.wind * -58 : 0
                  }vw`,
                } as CSSProperties
              }
            >
              {visibleIslands.map((island, index) => (
                <div
                  className={[
                    "syllabes-game__island",
                    `syllabes-game__island--${island.size}`,
                    island.hasTreasure
                      ? "syllabes-game__island--treasure"
                      : "",
                  ]
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
                    className="syllabes-game__island-asset"
                    src={ISLAND_WITHOUT_CHEST_ASSET_PATH}
                    alt=""
                    draggable={false}
                  />
                  {island.hasTreasure &&
                  !collectedTreasureIslandIds.includes(island.id) ? (
                    <img
                      className="syllabes-game__island-chest"
                      src={CHEST_ICON_ASSET_PATH}
                      alt=""
                      draggable={false}
                      data-treasure-island={island.id}
                    />
                  ) : null}
                </div>
              ))}
            </div>

            {phase === "sailing"
              ? Array.from(
                  { length: 6 + (journey?.wind ?? 1) * 3 },
                  (_, index) => (
                    <span
                      className="syllabes-game__wind"
                      key={`wind-${index}`}
                      style={
                        {
                          "--wind-top": `${166 + (index % 6) * 24}px`,
                          "--wind-width": `${74 + (index % 6) * 7}px`,
                          "--wind-delay": `${index * -180}ms`,
                          "--wind-duration": `${
                            2700 - (journey?.wind ?? 1) * 300
                          }ms`,
                        } as CSSProperties
                      }
                    />
                  ),
                )
              : null}

            <BoatAsset />

            {chestBursts.map((burstId) => (
              <div className="syllabes-game__collect-burst" key={burstId}>
                <span className="syllabes-game__collect-spark syllabes-game__collect-spark--one" />
                <span className="syllabes-game__collect-spark syllabes-game__collect-spark--two" />
                <img src={CHEST_ICON_ASSET_PATH} alt="" draggable={false} />
                <strong>+1</strong>
              </div>
            ))}
          </>
        ) : null}
      </div>

      {phase === "sailing" && journey ? (
        <div className="syllabes-game__sailing-panel">
          <div className="syllabes-game__sailing-status" aria-live="polite">
            <PanaMascot compact />
            <div>
              <strong>{getWindLabel(journey.wind)}</strong>
              <span>
                {journey.treasuresFound > 0
                  ? `${journey.treasuresFound} coffre${
                      journey.treasuresFound > 1 ? "s" : ""
                    } collecté${journey.treasuresFound > 1 ? "s" : ""}`
                  : "On file vers la prochaine île"}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
