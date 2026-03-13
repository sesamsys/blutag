import ExifReader from "exifreader";
import type { ExifInfo } from "@/types/photo";

export async function extractExif(file: File): Promise<ExifInfo> {
  try {
    const buffer = await file.arrayBuffer();
    const tags = ExifReader.load(buffer);

    const dateTime =
      tags["DateTimeOriginal"]?.description ??
      tags["DateTime"]?.description;

    let latitude: number | undefined;
    let longitude: number | undefined;

    if (tags["GPSLatitude"] && tags["GPSLongitude"]) {
      latitude = parseFloat(tags["GPSLatitude"].description);
      longitude = parseFloat(tags["GPSLongitude"].description);
      if (tags["GPSLatitudeRef"]?.value?.[0] === "S") latitude = -latitude;
      if (tags["GPSLongitudeRef"]?.value?.[0] === "W") longitude = -longitude;
    }

    const make = tags["Make"]?.description;
    const model = tags["Model"]?.description;

    return { dateTime, latitude, longitude, make, model };
  } catch {
    return {};
  }
}
