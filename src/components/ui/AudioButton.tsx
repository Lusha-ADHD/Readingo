import "./game-ui.css";

type AudioButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  size?: "default" | "compact";
};

export function AudioButton({
  label,
  onClick,
  className = "",
  disabled = false,
  size = "default",
}: AudioButtonProps) {
  return (
    <button
      className={`audio-button audio-button--${size} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      type="button"
      aria-label={label}
    >
      <svg className="audio-button__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path className="audio-button__speaker" d="M3.5 9.25h4.1L13 5.15v13.7l-5.4-4.1H3.5z" />
        <path className="audio-button__wave" d="M16 8.8a5.1 5.1 0 0 1 0 6.4" />
        <path className="audio-button__wave audio-button__wave--outer" d="M18.7 6.15a8.9 8.9 0 0 1 0 11.7" />
      </svg>
    </button>
  );
}
