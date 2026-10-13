import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import AltTextResult from "./AltTextResult";
import { COPY_FEEDBACK_DURATION_MS, MAX_ALT_TEXT_LENGTH } from "@/lib/constants";
import type { PhotoFile } from "@/types/photo";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const writeText = vi.fn<(text: string) => Promise<void>>();

function makePhoto(overrides: Partial<PhotoFile> = {}): PhotoFile {
  return {
    id: "p1",
    file: new File(["x"], "p.jpg", { type: "image/jpeg" }),
    preview: "blob:p1",
    altText: "A red car on a beach",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AltTextResult", () => {
  it("shows a loading state while analyzing", () => {
    render(
      <AltTextResult photo={makePhoto({ analyzing: true })} index={0} onUpdateAltText={vi.fn()} />,
    );
    expect(screen.getByRole("status", { name: "Analyzing photo" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Alt text description")).not.toBeInTheDocument();
  });

  it("shows the alt text and its character count", () => {
    render(<AltTextResult photo={makePhoto()} index={1} onUpdateAltText={vi.fn()} />);
    expect(screen.getByRole("article", { name: "Alt text for photo 2" })).toBeInTheDocument();
    expect(screen.getByLabelText("Alt text description")).toHaveValue("A red car on a beach");
    expect(
      screen.getByText(`20/${MAX_ALT_TEXT_LENGTH.toLocaleString()}`, { exact: false }),
    ).toBeInTheDocument();
  });

  it("reports edits, capped at the Bluesky limit", () => {
    const onUpdate = vi.fn();
    render(<AltTextResult photo={makePhoto()} index={0} onUpdateAltText={onUpdate} />);

    fireEvent.change(screen.getByLabelText("Alt text description"), {
      target: { value: "x".repeat(MAX_ALT_TEXT_LENGTH + 5) },
    });

    expect(onUpdate).toHaveBeenCalledWith("p1", "x".repeat(MAX_ALT_TEXT_LENGTH));
  });

  it("disables copy when there is no alt text", () => {
    render(
      <AltTextResult
        photo={makePhoto({ altText: undefined })}
        index={0}
        onUpdateAltText={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Copy alt text" })).toBeDisabled();
  });

  it("copies the alt text and briefly confirms it", async () => {
    vi.useFakeTimers();
    writeText.mockResolvedValue(undefined);
    render(<AltTextResult photo={makePhoto()} index={0} onUpdateAltText={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy alt text" }));
    });

    expect(writeText).toHaveBeenCalledWith("A red car on a beach");
    expect(screen.getByRole("button", { name: "Copied to clipboard" })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COPY_FEEDBACK_DURATION_MS);
    });
    expect(screen.getByRole("button", { name: "Copy alt text" })).toBeInTheDocument();
  });

  // Regression: a denied clipboard used to leave an unhandled promise rejection
  // and no feedback for the user.
  it("shows an error message when the clipboard is unavailable", async () => {
    writeText.mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    render(<AltTextResult photo={makePhoto()} index={0} onUpdateAltText={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy alt text" }));
    });

    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/couldn't copy/i));
    expect(screen.getByRole("button", { name: "Copy alt text" })).toBeInTheDocument();
  });
});
