import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";

interface SortablePhotoItemProps {
  id: string;
  preview: string;
  index: number;
  onRemove: (index: number) => void;
}

export default function SortablePhotoItem({ id, preview, index, onRemove }: SortablePhotoItemProps) {
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
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 p-1 rounded-full bg-foreground/70 text-background hover:bg-foreground/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Remove photo ${index + 1}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
