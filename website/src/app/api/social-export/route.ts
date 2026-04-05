import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      filename,
      width,
      height,
      focusX,   // 0-1, horizontal focal point
      focusY,   // 0-1, vertical focal point
      score,    // Eos score to overlay (optional)
      showBrand, // whether to show brand watermark
    } = body as {
      filename: string;
      width: number;
      height: number;
      focusX: number;
      focusY: number;
      score?: number;
      showBrand?: boolean;
    };

    // Sanitize filename
    const safe = path.basename(filename);
    const srcPath = path.join(process.cwd(), "public/archives", safe);
    if (!fs.existsSync(srcPath)) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Get source dimensions
    const meta = await sharp(srcPath).metadata();
    const srcW = meta.width!;
    const srcH = meta.height!;

    // Calculate crop region based on focal point
    const targetAspect = width / height;
    const srcAspect = srcW / srcH;

    let cropW: number, cropH: number, cropX: number, cropY: number;

    if (srcAspect > targetAspect) {
      // Source is wider — crop width
      cropH = srcH;
      cropW = Math.round(srcH * targetAspect);
      cropX = Math.round((srcW - cropW) * focusX);
      cropY = 0;
    } else {
      // Source is taller — crop height
      cropW = srcW;
      cropH = Math.round(srcW / targetAspect);
      cropX = 0;
      cropY = Math.round((srcH - cropH) * focusY);
    }

    // Clamp
    cropX = Math.max(0, Math.min(cropX, srcW - cropW));
    cropY = Math.max(0, Math.min(cropY, srcH - cropH));

    const composites: sharp.OverlayOptions[] = [];

    // "Z" monogram — upper right corner
    // Uses SVG paths for a decorative serif Z so it renders without font dependencies
    {
      const zSize = Math.round(Math.min(width, height) * 0.09);
      const zMargin = Math.round(width * 0.04);
      const zX = width - zSize - zMargin;
      const zY = zMargin;
      const r = zSize / 2;
      const cx = zX + r;
      const cy = zY + r;
      const sw = Math.max(1, Math.round(zSize * 0.03));

      // Decorative serif "Z" as vector path, designed for a ~100x100 viewBox
      // Scaled and translated to fit inside the circle
      const zScale = zSize * 0.005;
      const zOffX = cx - 50 * zScale;
      const zOffY = cy - 52 * zScale;

      const zSvg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(13,15,20,0.6)" stroke="rgba(240,165,0,0.7)" stroke-width="${sw}" />
        <g transform="translate(${zOffX},${zOffY}) scale(${zScale})" fill="rgba(240,165,0,0.85)">
          <!-- Top bar with serifs -->
          <rect x="22" y="24" width="56" height="7" rx="1" />
          <rect x="18" y="24" width="8" height="10" rx="1" />
          <rect x="74" y="24" width="8" height="10" rx="1" />
          <!-- Diagonal -->
          <polygon points="70,31 30,75 38,79 78,35" />
          <!-- Bottom bar with serifs -->
          <rect x="22" y="75" width="56" height="7" rx="1" />
          <rect x="18" y="72" width="8" height="10" rx="1" />
          <rect x="74" y="72" width="8" height="10" rx="1" />
          <!-- Decorative diamond accents -->
          <polygon points="50,18 54,22 50,26 46,22" opacity="0.5" />
          <polygon points="50,80 54,84 50,88 46,84" opacity="0.5" />
        </g>
      </svg>`);
      composites.push({ input: zSvg, top: 0, left: 0 });
    }

    // Score badge overlay
    if (score != null) {
      const badgeW = Math.round(width * 0.18);
      const badgeH = Math.round(badgeW * 0.55);
      const badgeX = width - badgeW - Math.round(width * 0.04);
      const badgeY = height - badgeH - Math.round(height * 0.04);
      const fontSize = Math.round(badgeW * 0.42);
      const labelSize = Math.round(badgeW * 0.15);
      const r = Math.round(badgeH * 0.15);

      const scoreSvg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="${r}" fill="rgba(13,15,20,0.75)" />
        <text x="${badgeX + badgeW / 2}" y="${badgeY + badgeH * 0.42}" font-family="monospace" font-size="${labelSize}" font-weight="bold" fill="rgba(200,212,224,0.7)" text-anchor="middle" letter-spacing="2">EOS INDEX</text>
        <text x="${badgeX + badgeW / 2}" y="${badgeY + badgeH * 0.82}" font-family="monospace" font-size="${fontSize}" font-weight="bold" fill="#F0A500" text-anchor="middle">${score}</text>
      </svg>`);
      composites.push({ input: scoreSvg, top: 0, left: 0 });
    }

    // Brand watermark
    if (showBrand) {
      const brandSize = Math.round(width * 0.018);
      const bx = Math.round(width * 0.04);
      const by = height - Math.round(height * 0.04);

      const brandSvg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text x="${bx}" y="${by}" font-family="monospace" font-size="${brandSize}" fill="rgba(240,165,0,0.6)" letter-spacing="1.5">thezorafiles.com</text>
      </svg>`);
      composites.push({ input: brandSvg, top: 0, left: 0 });
    }

    let pipeline = sharp(srcPath)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .resize(width, height);

    if (composites.length > 0) {
      pipeline = pipeline.composite(composites);
    }

    const buffer = await pipeline.jpeg({ quality: 92 }).toBuffer();
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `inline; filename="export-${width}x${height}.jpg"`,
      },
    });
  } catch (err) {
    console.error("Social export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
