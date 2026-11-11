import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("installed app stays inside its GitHub Pages subdirectory and uses valid launcher icons", () => {
  const manifest = JSON.parse(
    readFileSync(
      new URL("../public/manifest.webmanifest", import.meta.url),
      "utf8",
    ),
  );
  const manifestURL = new URL(
    "https://nernkerthok.github.io/courtmate/manifest.webmanifest",
  );
  for (const field of ["id", "start_url", "scope"]) {
    assert.equal(
      new URL(manifest[field], manifestURL).href,
      "https://nernkerthok.github.io/courtmate/",
    );
  }
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.name && manifest.short_name);
  for (const size of [192, 512]) {
    assert.ok(
      manifest.icons.some(
        (icon) => icon.sizes === `${size}x${size}` && icon.purpose === "any",
      ),
    );
  }
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
  for (const icon of [
    ...manifest.icons,
    { src: "icons/apple-touch-icon.png", sizes: "180x180" },
  ]) {
    const png = readFileSync(new URL(`../public/${icon.src}`, import.meta.url));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /rel="manifest" href="\.\/manifest.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon"/);
});
