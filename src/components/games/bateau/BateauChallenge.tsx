import { useState } from "react";
import type { CSSProperties } from "react";
import type { WordEntry } from "../../../content/types";
import { sitePath } from "../../../utils/paths";
import { AudioButton } from "../../ui/AudioButton";
import { RewardBurst } from "../../ui/RewardBurst";
import { SyllableSlot } from "../../ui/SyllableSlot";
import { SyllableTile } from "../../ui/SyllableTile";
import type { BateauTile } from "./bateauTiles";

type Props = {
  challenge: WordEntry;
  tiles: BateauTile[];
  placed: Array<BateauTile | null>;
  usedTileIds: string[];
  wrongTileId: string | null;
  lastTreasuresFound: number;
  onListenWord: () => void;
  onListenSyllable: (tile: BateauTile) => void;
  onSelectTile: (tileId: string) => void;
};

export function BateauChallenge({
  challenge,
  tiles,
  placed,
  usedTileIds,
  wrongTileId,
  lastTreasuresFound,
  onListenWord,
  onListenSyllable,
  onSelectTile,
}: Props) {
  const [wordImageFailed, setWordImageFailed] = useState(false);

  return (
    <div className="bateau-game__panel">
      <div className="bateau-game__image-card">
        <div className="bateau-game__picture" aria-hidden="true">
          {!wordImageFailed ? (
            <img
              className="bateau-game__word-image"
              src={sitePath(challenge.image)}
              alt=""
              draggable={false}
              onError={() => setWordImageFailed(true)}
            />
          ) : (
            <span className="bateau-game__picture-fallback" />
          )}
          <AudioButton
            className="bateau-game__audio"
            label={`Écouter ${challenge.displayWord}`}
            onClick={onListenWord}
          />
        </div>
      </div>

      <div className="bateau-game__challenge">
        <div className="bateau-game__challenge-header">
          <p className="bateau-game__eyebrow" id="bateau-title">
            Compose le mot
          </p>
          {lastTreasuresFound > 0 ? (
            <RewardBurst points={lastTreasuresFound} />
          ) : null}
        </div>
        <div
          className="bateau-game__slots"
          aria-label="Emplacements des syllabes"
          data-count={challenge.syllables.length}
          style={
            { "--slot-count": challenge.syllables.length } as CSSProperties
          }
        >
          {placed.map((slot, index) => (
            <SyllableSlot
              index={index}
              key={`${challenge.id}-slot-${index}`}
              value={slot?.text}
            />
          ))}
        </div>
      </div>

      <div
        className="bateau-game__syllables"
        aria-label="Syllabes disponibles"
      >
        {tiles.map((tile) => (
          <div className="bateau-game__tile-wrap" key={tile.id}>
            <SyllableTile
              id={tile.id}
              onClick={() => onSelectTile(tile.id)}
              state={wrongTileId === tile.id ? "wrong" : "default"}
              text={tile.text}
              used={usedTileIds.includes(tile.id)}
            />
            <AudioButton
              className="bateau-game__tile-audio"
              label={`Écouter ${tile.text}`}
              onClick={() => onListenSyllable(tile)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
