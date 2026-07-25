import { sitePath } from "../../../utils/paths";

const PANA_PATH = sitePath("/assets/characters/pana.png");

type Props = {
  message: string;
};

export function SentierTreasurePrompt({ message }: Props) {
  return (
    <section className="sentier-treasure-prompt" data-testid="sentier-treasure-prompt">
      <img src={PANA_PATH} alt="Pana" draggable={false} />
      <p aria-live="polite">{message}</p>
    </section>
  );
}
