import { sitePath } from "../../utils/paths";
import "./tutorial-pointer.css";

type Props = {
  className?: string;
};

export function TutorialPointer({ className = "" }: Props) {
  return (
    <span
      className={["tutorial-pointer", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <img
        className="tutorial-pointer__image"
        src={sitePath("/assets/ui/tutorial-pointer.png")}
        alt=""
        draggable={false}
      />
    </span>
  );
}
