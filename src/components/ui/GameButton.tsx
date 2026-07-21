import "./game-ui.css";
import type { ReactNode } from "react";

type GameButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "success";
  className?: string;
};

export function GameButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  variant = "primary",
  className = "",
}: GameButtonProps) {
  return (
    <button
      className={`game-button game-button--${variant} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
