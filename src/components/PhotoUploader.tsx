import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { ClipboardPaste, ImagePlus, X } from "lucide-react";
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

  const pasteFromClipboard = useCallback(async () => {
    if (remaining <= 0) {
      toast.warning(`You've reached the ${MAX_PHOTOS} photo limit.`);
      return;
    }
    if (!navigator.clipboard || typeof navigator.clipboard.read !== "function") {
      toast.error("Your browser doesn't support pasting images. Try copying the image again or use the file picker.");
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      const files: File[] = [];
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const ext = imageType.split("/")[1] || "png";
        files.push(
          new File([blob], `pasted-image-${Date.now()}.${ext}`, { type: imageType })
        );
      }
      if (files.length === 0) {
        toast.error("No image found on the clipboard. Copy an image first, then tap Paste.");
        return;
      }
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      handleFiles(dt.files);
    } catch (err) {
      // User denied permission, or clipboard unreadable
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("permission")) {
        toast.error("Clipboard permission denied. Please allow clipboard access and try again.");
      } else {
        toast.error("Couldn't read the clipboard. Try copying the image again.");
      }
    }
  }, [remaining, handleFiles]);


  const activePhoto = activeDragId ? photos.find((p) => p.id === activeDragId) : null;
  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] ?? null);
  const isEmpty = photos.length === 0;
  const sortableIds = photos.map((p) => p.id);

  return (
    <div className="w-full">
      <div className="flex justify-end items-center gap-2 mb-2 h-7">
        <button
          type="button"
          onClick={pasteFromClipboard}
          aria-label="Paste image from clipboard"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          Paste
        </button>
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
        {/* Handwritten annotation — only when no photos */}
        {isEmpty && (
          <div className="absolute -top-2 -left-2 sm:-left-8 z-10 pointer-events-none select-none flex flex-col items-start">
            <span
              className="text-muted-foreground text-lg sm:text-xl -rotate-3"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              Drag photos here
            </span>
            {/* Loopy arrow SVG */}
            <svg
              width="80"
              height="60"
              viewBox="0 0 80 60"
              fill="none"
              className="text-muted-foreground ml-6 -mt-1"
              style={{ transform: "rotate(12deg)" }}
              aria-hidden="true"
            >
              <path
                d="M4 4 C10 20, 20 30, 30 24 C40 18, 35 6, 25 10 C15 14, 22 28, 35 30 C48 32, 58 22, 68 34"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M63 28 L68 34 L61 35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        )}

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
              aria-label="Photo upload area. Paste images with Cmd+V or Ctrl+V."
              tabIndex={0}
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
        Up to {MAX_PHOTOS} photos · {MAX_FILE_SIZE_MB}MB max each · ⌘V / Ctrl+V or tap Paste
      </p>

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
