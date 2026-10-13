import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import PhotoUploader from "./PhotoUploader";
import { MAX_FILE_SIZE_BYTES, MAX_PHOTOS } from "@/lib/constants";
import type { PhotoFile } from "@/types/photo";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), warning: vi.fn(), success: vi.fn() } }));

function makeFile(name: string, type = "image/jpeg", size = 100): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function makePhotos(n: number): PhotoFile[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    file: makeFile(`p${i}.jpg`),
    preview: `blob:p${i}`,
  }));
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("file input not found");
  return input;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PhotoUploader", () => {
  it("shows an empty slot for every photo allowed", () => {
    render(<PhotoUploader photos={[]} onAddPhotos={vi.fn()} onRemovePhoto={vi.fn()} />);
    expect(screen.getAllByRole("button", { name: /^Add photo, slot/ })).toHaveLength(MAX_PHOTOS);
  });

  it("adds valid selected images", () => {
    const onAdd = vi.fn();
    const { container } = render(
      <PhotoUploader photos={[]} onAddPhotos={onAdd} onRemovePhoto={vi.fn()} />,
    );
    const file = makeFile("beach.jpg");

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    expect(onAdd).toHaveBeenCalledWith([file]);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("rejects files over the size limit and explains why", () => {
    const onAdd = vi.fn();
    const { container } = render(
      <PhotoUploader photos={[]} onAddPhotos={onAdd} onRemovePhoto={vi.fn()} />,
    );

    fireEvent.change(getFileInput(container), {
      target: { files: [makeFile("huge.jpg", "image/jpeg", MAX_FILE_SIZE_BYTES + 1)] },
    });

    expect(onAdd).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("huge.jpg: Exceeds"));
  });

  it("only adds photos up to the limit and warns about the rest", () => {
    const onAdd = vi.fn();
    const { container } = render(
      <PhotoUploader
        photos={makePhotos(MAX_PHOTOS - 1)}
        onAddPhotos={onAdd}
        onRemovePhoto={vi.fn()}
      />,
    );
    const files = [makeFile("a.jpg"), makeFile("b.jpg")];

    fireEvent.change(getFileInput(container), { target: { files } });

    expect(onAdd).toHaveBeenCalledWith([files[0]]);
    expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining("1 photo was not added"));
  });

  it("offers a clear-all action once photos are added", () => {
    const onClear = vi.fn();
    render(
      <PhotoUploader
        photos={makePhotos(2)}
        onAddPhotos={vi.fn()}
        onRemovePhoto={vi.fn()}
        onClearAll={onClear}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear all photos" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
