import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

interface SortablePhotoItemProps {
  id: string;
  preview: string;
  index: number;
  onRemove: (index: number) => void;
  showNumber?: boolean;
}

const SortablePhotoItem = memo(function SortablePhotoItem({ id, preview, index, onRemove, showNumber }: SortablePhotoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-square rounded-2xl overflow-hidden bg-muted group cursor-grab active:cursor-grabbing touch-none"
    >
      <img
        src={preview}
        alt={`Upload ${index + 1}`}
        draggable={false}
        className="w-full h-full object-cover select-none pointer-events-none"
      />
      {showNumber && (
        <span className="absolute top-1 left-1 sm:top-2 sm:left-2 inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-foreground/70 text-background text-[10px] font-semibold tabular-nums select-none">
          {index + 1}
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 p-1 sm:top-2 sm:right-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-full bg-foreground/70 text-background hover:bg-foreground/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Remove photo ${index + 1}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

export default SortablePhotoItem;
