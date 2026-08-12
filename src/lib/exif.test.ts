import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractExif } from "./exif";

// Mock ExifReader so tests don't need real JPEG buffers.
vi.mock("exifreader", () => ({
  default: {
    load: vi.fn(),
  },
}));

import ExifReader from "exifreader";

const mockLoad = vi.mocked(ExifReader.load);

/** Build a minimal ExifReader tags object from the provided fields. */
function makeTags(fields: Record<string, { description?: string; value?: unknown }>) {
  return fields as unknown as ReturnType<typeof ExifReader.load>;
}

/** Minimal File stub — extractExif only calls file.arrayBuffer(). */
function makeFile(): File {
  const file = { arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)) } as unknown as File;
  return file;
}

describe("extractExif", () => {
  beforeEach(() => {
    mockLoad.mockReset();
  });

  it("returns empty object when no relevant tags are present", async () => {
    mockLoad.mockReturnValue(makeTags({}));
    const result = await extractExif(makeFile());
    expect(result).toEqual({});
  });

  it("extracts DateTimeOriginal", async () => {
    mockLoad.mockReturnValue(
      makeTags({ DateTimeOriginal: { description: "2024:06:15 12:00:00" } })
    );
    const result = await extractExif(makeFile());
    expect(result.dateTime).toBe("2024:06:15 12:00:00");
  });

  it("falls back to DateTime when DateTimeOriginal is absent", async () => {
    mockLoad.mockReturnValue(
      makeTags({ DateTime: { description: "2024:01:01 00:00:00" } })
    );
    const result = await extractExif(makeFile());
    expect(result.dateTime).toBe("2024:01:01 00:00:00");
  });

  it("extracts positive latitude and longitude (NE hemisphere)", async () => {
    mockLoad.mockReturnValue(
      makeTags({
        GPSLatitude: { description: "48.8566" },
        GPSLongitude: { description: "2.3522" },
        GPSLatitudeRef: { value: ["N"] },
        GPSLongitudeRef: { value: ["E"] },
      })
    );
    const result = await extractExif(makeFile());
    expect(result.latitude).toBeCloseTo(48.8566);
    expect(result.longitude).toBeCloseTo(2.3522);
  });

  it("negates latitude for southern hemisphere (S ref)", async () => {
    mockLoad.mockReturnValue(
      makeTags({
        GPSLatitude: { description: "33.8688" },
        GPSLongitude: { description: "151.2093" },
        GPSLatitudeRef: { value: ["S"] },
        GPSLongitudeRef: { value: ["E"] },
      })
    );
    const result = await extractExif(makeFile());
    expect(result.latitude).toBeCloseTo(-33.8688);
    expect(result.longitude).toBeCloseTo(151.2093);
  });

  it("negates longitude for western hemisphere (W ref)", async () => {
    mockLoad.mockReturnValue(
      makeTags({
        GPSLatitude: { description: "40.7128" },
        GPSLongitude: { description: "74.006" },
        GPSLatitudeRef: { value: ["N"] },
        GPSLongitudeRef: { value: ["W"] },
      })
    );
    const result = await extractExif(makeFile());
    expect(result.latitude).toBeCloseTo(40.7128);
    expect(result.longitude).toBeCloseTo(-74.006);
  });

  it("negates both for southwest hemisphere (S + W refs)", async () => {
    mockLoad.mockReturnValue(
      makeTags({
        GPSLatitude: { description: "34.6037" },
        GPSLongitude: { description: "58.3816" },
        GPSLatitudeRef: { value: ["S"] },
        GPSLongitudeRef: { value: ["W"] },
      })
    );
    const result = await extractExif(makeFile());
    expect(result.latitude).toBeCloseTo(-34.6037);
    expect(result.longitude).toBeCloseTo(-58.3816);
  });

  it("does not negate when GPSLatitudeRef value is not an array", async () => {
    // Covers the Array.isArray guard — non-array value must not flip sign
    mockLoad.mockReturnValue(
      makeTags({
        GPSLatitude: { description: "51.5074" },
        GPSLongitude: { description: "0.1278" },
        GPSLatitudeRef: { value: "S" as unknown as string[] }, // string, not array
        GPSLongitudeRef: { value: "W" as unknown as string[] },
      })
    );
    const result = await extractExif(makeFile());
    expect(result.latitude).toBeCloseTo(51.5074);  // should remain positive
    expect(result.longitude).toBeCloseTo(0.1278);   // should remain positive
  });

  it("omits GPS fields when only one of lat/lon is present", async () => {
    mockLoad.mockReturnValue(
      makeTags({ GPSLatitude: { description: "48.8566" } }) // no GPSLongitude
    );
    const result = await extractExif(makeFile());
    expect(result.latitude).toBeUndefined();
    expect(result.longitude).toBeUndefined();
  });

  it("extracts camera make and model", async () => {
    mockLoad.mockReturnValue(
      makeTags({
        Make: { description: "Apple" },
        Model: { description: "iPhone 15 Pro" },
      })
    );
    const result = await extractExif(makeFile());
    expect(result.make).toBe("Apple");
    expect(result.model).toBe("iPhone 15 Pro");
  });

  it("returns empty object when ExifReader throws", async () => {
    mockLoad.mockImplementation(() => { throw new Error("not a JPEG"); });
    const result = await extractExif(makeFile());
    expect(result).toEqual({});
  });
});
