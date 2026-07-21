import "./game-ui.css";

type DropSlotProps = {
  index: number;
  value?: string;
  active?: boolean;
  onDropTile: (tileId: string, slotIndex: number) => void;
};

export function DropSlot({ index, value, active = false, onDropTile }: DropSlotProps) {
  return (
    <div
      className={`drop-slot ${active ? "drop-slot--active" : ""} ${value ? "drop-slot--filled" : ""}`.trim()}
      data-slot-index={index}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const tileId = event.dataTransfer.getData("text/plain");
        if (tileId) {
          onDropTile(tileId, index);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={value ? `Syllabe placee ${value}` : `Emplacement ${index + 1}`}
    >
      {value}
    </div>
  );
}
