import { useState } from "react";
import { sitePath } from "../../utils/paths";
import "./game-intro.css";

type PanaMascotProps = {
  className?: string;
  compact?: boolean;
};

const PANA_ASSET_PATH = sitePath("/assets/characters/pana.png");

export function PanaMascot({ className = "", compact = false }: PanaMascotProps) {
  const [assetFailed, setAssetFailed] = useState(false);
  const classes = [
    "pana",
    compact ? "pana--compact" : "",
    assetFailed ? "pana--asset-failed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} role="img" aria-label="Pana">
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
