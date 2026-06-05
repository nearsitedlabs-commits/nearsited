import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const logos = [
  { svg: "logo-icon.svg",     png: "logo-icon.png",     width: 220,  height: 126 },
  { svg: "logo-icon-mono.svg",png: "logo-icon-mono.png", width: 220,  height: 126 },
  { svg: "logo.svg",          png: "logo.png",           width: 512,  height: 128 },
];

async function convert() {
  for (const logo of logos) {
    const svgPath = join(publicDir, logo.svg);
    const pngPath = join(publicDir, logo.png);

    const svgBuffer = readFileSync(svgPath);

    // Inject explicit width/height into SVG if not present
    let svgContent = svgBuffer.toString("utf-8");
    if (!svgContent.includes('width="')) {
      svgContent = svgContent.replace("<svg", `<svg width="${logo.width}" height="${logo.height}"`);
    }

    await sharp(Buffer.from(svgContent))
      .resize(logo.width, logo.height)
      .png()
      .toFile(pngPath);

    console.log(`✅ ${logo.svg} → ${logo.png} (${logo.width}x${logo.height})`);
  }
}

convert().catch(console.error);
