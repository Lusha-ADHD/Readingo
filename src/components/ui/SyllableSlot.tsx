import "./game-ui.css";

type SyllableSlotProps = {
  index: number;
  value?: string;
};

export function SyllableSlot({ index, value }: SyllableSlotProps) {
  return (
    <div
      className={`syllable-slot ${value ? "syllable-slot--filled" : ""}`.trim()}
      aria-label={value ? `Syllabe placee ${value}` : `Emplacement ${index + 1}`}
    >
      {value}
    </div>
  );
}
