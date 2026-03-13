import {
  BLUESKY_IMAGE_MAX_BYTES,
  BLUESKY_IMAGE_MAX_DIMENSION,
  BLUESKY_IMAGE_JPEG_QUALITY,
  BLUESKY_IMAGE_JPEG_QUALITY_MIN,
  BLUESKY_IMAGE_JPEG_QUALITY_STEP,
} from "@/lib/constants";

/**
 * Loads a File as an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compresses an image file to JPEG ≤ 1 MB, resizing the longest edge
 * to at most BLUESKY_IMAGE_MAX_DIMENSION px.  Iteratively reduces
 * quality if the first pass is still too large.
 */
export async function compressImageForBluesky(file: File): Promise<Blob> {
  const img = await loadImage(file);

  // Calculate target dimensions
  let { width, height } = img;
  const maxDim = BLUESKY_IMAGE_MAX_DIMENSION;

  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round((height / width) * maxDim);
      width = maxDim;
    } else {
      width = Math.round((width / height) * maxDim);
      height = maxDim;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);

  // Clean up the object URL
  URL.revokeObjectURL(img.src);

  // Iteratively compress
  let quality = BLUESKY_IMAGE_JPEG_QUALITY;
  let blob: Blob | null = null;

  while (quality >= BLUESKY_IMAGE_JPEG_QUALITY_MIN) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );

    if (blob && blob.size <= BLUESKY_IMAGE_MAX_BYTES) {
      return blob;
    }

    quality -= BLUESKY_IMAGE_JPEG_QUALITY_STEP;
  }

  // Return whatever we got at minimum quality
  if (blob) return blob;

  // Fallback — shouldn't happen
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", BLUESKY_IMAGE_JPEG_QUALITY_MIN)
  );
}
