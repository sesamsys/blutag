import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type Announcements,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { PhotoFile } from "@/types/photo";
import { MAX_PHOTOS, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES, DROP_ANIMATION_DURATION_MS } from "@/lib/constants";
import SortablePhotoItem from "./SortablePhotoItem";

interface PhotoUploaderProps {
  photos: PhotoFile[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (index: number) => void;
  onClearAll?: () => void;
  onReorderPhotos?: (oldIndex: number, newIndex: number) => void;
}

export default function PhotoUploader({ photos, onAddPhotos, onRemovePhoto, onClearAll, onReorderPhotos }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const remaining = MAX_PHOTOS - photos.length;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const announcements: Announcements = useMemo(
    () => ({
      onDragStart({ active }) {
        const idx = photos.findIndex((p) => p.id === active.id);
        return `Picked up photo ${idx + 1} of ${photos.length}. Use arrow keys to move, space to drop.`;
      },
      onDragOver({ active, over }) {
        if (!over) return "";
        const oldIdx = photos.findIndex((p) => p.id === active.id);
        const newIdx = photos.findIndex((p) => p.id === over.id);
        return `Photo ${oldIdx + 1} is now over position ${newIdx + 1} of ${photos.length}.`;
      },
      onDragEnd({ active, over }) {
        if (!over) return `Photo dropped in its original position.`;
        const oldIdx = photos.findIndex((p) => p.id === active.id);
        const newIdx = photos.findIndex((p) => p.id === over.id);
        return oldIdx === newIdx
          ? `Photo ${oldIdx + 1} returned to its original position.`
          : `Photo moved from position ${oldIdx + 1} to position ${newIdx + 1}.`;
      },
      onDragCancel({ active }) {
        const idx = photos.findIndex((p) => p.id === active.id);
        return `Dragging cancelled. Photo ${idx + 1} returned to its original position.`;
      },
    }),
    [photos]
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      if (remaining <= 0) return;

      const allValid: File[] = [];
      const errors: string[] = [];
      
      Array.from(fileList).forEach((f) => {
        if (!f.type.startsWith("image/")) {
          errors.push(`${f.name}: Not an image file`);
          return;
        }
        if (f.size > MAX_FILE_SIZE_BYTES) {
          errors.push(`${f.name}: Exceeds ${MAX_FILE_SIZE_MB}MB limit`);
          return;
        }
        if (f.size === 0) {
          errors.push(`${f.name}: File is empty`);
          return;
        }
        const ext = f.name.split('.').pop()?.toLowerCase();
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
        if (!ext || !validExtensions.includes(ext)) {
          errors.push(`${f.name}: Unsupported file type`);
          return;
        }
        allValid.push(f);
      });
      
      if (errors.length > 0) {
        toast.error(`Some files were rejected:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''}`);
      }

      if (allValid.length > remaining) {
        toast.warning(`You can only add up to ${MAX_PHOTOS} photos. ${allValid.length - remaining} photo${allValid.length - remaining === 1 ? " was" : "s were"} not added.`);
      }

      const accepted = allValid.slice(0, remaining);
      if (accepted.length) onAddPhotos(accepted);
    },
    [remaining, onAddPhotos]
  );

  // Clipboard paste support: Cmd/Ctrl+V on desktop, OS paste menu on mobile
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        // Clipboard images (e.g. screenshots) often lack a proper filename
        if (!file.name || file.name === "image.png" || !file.name.includes(".")) {
          const ext = file.type.split("/")[1] || "png";
          const renamed = new File([file], `pasted-image-${Date.now()}.${ext}`, {
            type: file.type,
            lastModified: file.lastModified,
          });
          files.push(renamed);
        } else {
          files.push(file);
        }
      }

      if (files.length === 0) return;
      e.preventDefault();
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      handleFiles(dt.files);
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  const onDropZone = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      // Only process if it's an actual file drop (not a dnd-kit reorder)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || active.id === over.id || !onReorderPhotos) return;

      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderPhotos(oldIndex, newIndex);
      }
    },
    [photos, onReorderPhotos]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  const activePhoto = activeDragId ? photos.find((p) => p.id === activeDragId) : null;
  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] ?? null);
  const isEmpty = photos.length === 0;
  const sortableIds = photos.map((p) => p.id);

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2 h-7">
        {photos.length > 0 && onClearAll && (
          <button
            onClick={onClearAll}
            aria-label="Clear all photos"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      <div className="relative">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          accessibility={{ announcements }}
        >
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div
              role="region"
              aria-label="Photo upload area"
              onDrop={onDropZone}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl transition-all ${
                isDraggingOver
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : ""
              }`}
            >
              {slots.map((photo, i) =>
                photo ? (
                  <SortablePhotoItem
                    key={photo.id}
                    id={photo.id}
                    preview={photo.preview}
                    index={i}
                    onRemove={onRemovePhoto}
                  />
                ) : (
                  <button
                    key={`empty-${i}`}
                    onClick={() => inputRef.current?.click()}
                    aria-label={`Add photo, slot ${i + 1} of ${MAX_PHOTOS}`}
                    className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/50 hover:bg-accent transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Add photo</span>
                  </button>
                )
              )}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: DROP_ANIMATION_DURATION_MS, easing: "ease" }}>
            {activePhoto ? (
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted shadow-lg ring-2 ring-primary/50">
                <img
                  src={activePhoto.preview}
                  alt="Dragging photo"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Live region for screen readers */}
      <span className="sr-only" aria-live="polite">
        {photos.length > 0
          ? `${photos.length} of ${MAX_PHOTOS} photos added`
          : "No photos added"}
      </span>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        Up to {MAX_PHOTOS} photos · {MAX_FILE_SIZE_MB}MB max each · Paste with ⌘V / Ctrl+V
      </p>

      {isEmpty && (
        <div className="pointer-events-none select-none flex items-center justify-center gap-4 mt-3">
          <span
            className="text-primary text-2xl sm:text-3xl -rotate-2 shrink-0 leading-none"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            Drag photos here
          </span>
          <svg
            width="100"
            height="100"
            viewBox="0 0 260 180"
            fill="none"
            className="text-primary shrink-0 -ml-1"
            overflow="visible"
            aria-hidden="true"
          >
            <path
              d="M3,90c117.55-1.32,145.35-55.27,126.78-88.72-16.81-30.27-53.04-1.85-33.04,21.18,23.82,27.42,122.95,20.47,126.09-96.39"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M209.29,-62.5 L222.83,-80 M236.37,-62.5 L222.83,-80"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
