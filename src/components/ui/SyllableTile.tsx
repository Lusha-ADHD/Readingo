import "./game-ui.css";
import type { CSSProperties, PointerEvent, TouchEvent } from "react";

type SyllableTileProps = {
  id: string;
  text: string;
  used?: boolean;
  selected?: boolean;
  state?: "default" | "correct" | "wrong";
  floating?: boolean;
  onClick?: () => void;
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void;
  onTouchStart?: (event: TouchEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
};

export function SyllableTile({
  id,
  text,
  used = false,
  selected = false,
  state = "default",
  floating = false,
  onClick,
  onPointerDown,
  onTouchStart,
  style,
}: SyllableTileProps) {
  const classNames = [
    "syllable-tile",
    used ? "syllable-tile--used" : "",
    selected ? "syllable-tile--selected" : "",
    state !== "default" ? `syllable-tile--${state}` : "",
    floating ? "syllable-tile--floating" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classNames}
      data-tile-id={id}
      disabled={used}
      draggable={false}
      onClick={onClick}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={onPointerDown}
      onTouchStart={onTouchStart}
      style={style}
      type="button"
    >
      {text}
    </button>
  );
}
