import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LanguagePicker from "./LanguagePicker";

const setLanguage = vi.fn();
const languageState = { language: "en", recent: [] as string[] };

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ ...languageState, setLanguage }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  languageState.language = "en";
  languageState.recent = [];
  // cmdk measures items with ResizeObserver and scrolls them into view.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = vi.fn();
});

describe("LanguagePicker", () => {
  it("shows the current output language", () => {
    languageState.language = "hu";
    render(<LanguagePicker />);
    expect(
      screen.getByRole("button", { name: "Output language: Hungarian. Click to change." }),
    ).toBeInTheDocument();
  });

  it("lists recent languages first and selects one", () => {
    languageState.recent = ["sv", "en"];
    render(<LanguagePicker />);

    fireEvent.click(screen.getByRole("button", { name: /Output language: English/ }));
    expect(screen.getByText("Recent")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: /Swedish/ }));
    expect(setLanguage).toHaveBeenCalledWith("sv");
  });

  it("filters languages by search text", () => {
    render(<LanguagePicker />);
    fireEvent.click(screen.getByRole("button", { name: /Output language/ }));

    fireEvent.change(screen.getByPlaceholderText("Search languages…"), {
      target: { value: "Magyar" },
    });

    expect(screen.getByRole("option", { name: /Hungarian/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Swedish/ })).not.toBeInTheDocument();
  });
});
