// Generates PWA icons from scripts/icon.svg. Run: node scripts/make-icons.mjs
import sharp from "sharp";
const src = new URL("./icon.svg", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const out = (f) => `public/icons/${f}`;
for (const size of [192, 512]) await sharp(src).resize(size, size).png().toFile(out(`icon-${size}.png`));
// Maskable icons need the artwork inside the central 80% safe zone.
for (const size of [192, 512]) {
  const inner = Math.round(size * 0.8);
  const art = await sharp(src).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#2b1670" } })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toFile(out(`maskable-${size}.png`));
}
await sharp(src).resize(180, 180).png().toFile(out("apple-touch-icon.png"));
console.log("icons written");
