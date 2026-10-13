import { describe, expect, it } from "vitest";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "./constants";
import { formatRejections, getFileRejectionReason, selectPhotos } from "./photo-validation";

/** Creates a File whose reported size is `size` without allocating the bytes. */
function makeFile(name: string, type: string, size = 10): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("getFileRejectionReason", () => {
  it.each(["a.jpg", "a.JPEG", "a.png", "a.gif", "a.webp", "a.heic", "a.heif"])(
    "accepts %s",
    (name) => {
      expect(getFileRejectionReason(makeFile(name, "image/jpeg"))).toBeNull();
    },
  );

  it("rejects non-image MIME types", () => {
    expect(getFileRejectionReason(makeFile("doc.pdf", "application/pdf"))).toBe(
      "doc.pdf: Not an image file",
    );
  });

  it("rejects files over the size limit", () => {
    expect(getFileRejectionReason(makeFile("big.jpg", "image/jpeg", MAX_FILE_SIZE_BYTES + 1))).toBe(
      `big.jpg: Exceeds ${MAX_FILE_SIZE_MB}MB limit`,
    );
  });

  it("accepts files exactly at the size limit", () => {
    expect(
      getFileRejectionReason(makeFile("ok.jpg", "image/jpeg", MAX_FILE_SIZE_BYTES)),
    ).toBeNull();
  });

  it("rejects empty files", () => {
    expect(getFileRejectionReason(makeFile("empty.jpg", "image/jpeg", 0))).toBe(
      "empty.jpg: File is empty",
    );
  });

  it("rejects unsupported extensions", () => {
    expect(getFileRejectionReason(makeFile("vector.svg", "image/svg+xml"))).toBe(
      "vector.svg: Unsupported file type",
    );
  });
});

describe("selectPhotos", () => {
  const good = (i: number) => makeFile(`p${i}.jpg`, "image/jpeg");

  it("accepts everything when there is room", () => {
    const result = selectPhotos([good(1), good(2)], 10);
    expect(result.accepted).toHaveLength(2);
    expect(result.rejections).toEqual([]);
    expect(result.overflowCount).toBe(0);
  });

  it("keeps the first files and counts the overflow when slots run out", () => {
    const files = [good(1), good(2), good(3)];
    const result = selectPhotos(files, 2);
    expect(result.accepted).toEqual([files[0], files[1]]);
    expect(result.overflowCount).toBe(1);
  });

  it("separates rejected files from valid ones", () => {
    const result = selectPhotos([good(1), makeFile("x.txt", "text/plain")], 10);
    expect(result.accepted).toHaveLength(1);
    expect(result.rejections).toEqual(["x.txt: Not an image file"]);
  });

  it("treats negative remaining slots as zero", () => {
    const result = selectPhotos([good(1)], -1);
    expect(result.accepted).toEqual([]);
    expect(result.overflowCount).toBe(1);
  });
});

describe("formatRejections", () => {
  it("lists up to three reasons", () => {
    expect(formatRejections(["a", "b"])).toBe("Some files were rejected:\na\nb");
  });

  it("summarises reasons beyond the third", () => {
    expect(formatRejections(["a", "b", "c", "d", "e"])).toBe(
      "Some files were rejected:\na\nb\nc\n...and 2 more",
    );
  });
});
