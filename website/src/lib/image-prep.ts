import "server-only";
import sharp from "sharp";

/**
 * Prepare an uploaded photo for the web before it's stored.
 *
 * Phones hand us 4 to 13 MB originals. Pages are served through next/image,
 * but storing the camera file still costs storage, bandwidth on every first
 * optimization, and time. This keeps a high-quality web master instead:
 * auto-rotated from EXIF, at most 2560 px on the long edge, JPEG q85
 * (mozjpeg). Originals live in production storage (Proton Drive), not here.
 *
 * Anything sharp can't read (HEIC on some builds, animated GIFs, SVG) is
 * passed through untouched, so an upload never fails because of this step.
 */

const MAX_EDGE = 2560;
const PASS_THROUGH = new Set(["image/gif", "image/svg+xml"]);

export interface PreparedImage {
  buffer: Buffer;
  contentType: string;
  ext: string;
  optimized: boolean;
}

export async function prepareWebImage(
  input: Buffer,
  mime: string,
  originalExt: string
): Promise<PreparedImage> {
  const passThrough: PreparedImage = { buffer: input, contentType: mime, ext: originalExt, optimized: false };
  if (!mime.startsWith("image/") || PASS_THROUGH.has(mime)) return passThrough;
  try {
    const out = await sharp(input, { failOn: "none" })
      .rotate() // apply EXIF orientation, then strip it
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    // Never make a file bigger than what we were given.
    if (out.length >= input.length && (mime === "image/jpeg" || mime === "image/jpg")) return passThrough;
    return { buffer: out, contentType: "image/jpeg", ext: "jpg", optimized: true };
  } catch (err) {
    console.warn("prepareWebImage: storing original", (err as Error).message);
    return passThrough;
  }
}
