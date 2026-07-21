import "./game-ui.css";

type SyllableTileProps = {
  id: string;
  text: string;
  used?: boolean;
  state?: "default" | "correct" | "wrong";
  onClick?: () => void;
};

export function SyllableTile({
  id,
  text,
  used = false,
  state = "default",
  onClick,
}: SyllableTileProps) {
  const classNames = [
    "syllable-tile",
    used ? "syllable-tile--used" : "",
    state !== "default" ? `syllable-tile--${state}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classNames}
      data-tile-id={id}
      disabled={used}
      onClick={onClick}
      type="button"
    >
      {text}
    </button>
  );
}
