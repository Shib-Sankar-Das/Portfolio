/**
 * Converts a 3D model (.fbx or .glb/.gltf) into a small, web-ready GLB in
 * public/models/. Usage:
 *
 *   npm run model -- "assets/3d-source/Standing Greeting.fbx"
 *   npm run model -- input.fbx custom-name
 *
 * Pipeline: FBX -> glTF (FBX2glTF), then meshopt compression + WebP textures
 * (base color capped at 2048px, normal maps kept near-lossless). Animations
 * are preserved and resampled. Typical result: 85-95% smaller than the FBX.
 */
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  prune,
  resample,
  quantize,
  reorder,
  textureCompress,
  meshopt,
} from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import fbx2gltf from "fbx2gltf";
import sharp from "sharp";

const [input, customName] = process.argv.slice(2);
if (!input) {
  console.error('Usage: npm run model -- "path/to/model.fbx" [output-name]');
  process.exit(1);
}

const name =
  customName ??
  path
    .basename(input, path.extname(input))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const outDir = path.join(import.meta.dirname, "..", "public", "models");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${name}.glb`);

// Step 1: FBX -> GLB if needed.
let glbPath = input;
let tempDir = null;
if (/\.fbx$/i.test(input)) {
  tempDir = mkdtempSync(path.join(tmpdir(), "model-"));
  glbPath = path.join(tempDir, `${name}.glb`);
  console.log("Converting FBX -> glTF...");
  await fbx2gltf(input, glbPath);
}

// Step 2: compress geometry, animation, and textures.
console.log("Optimizing...");
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(glbPath);
await MeshoptEncoder.ready;

await doc.transform(
  dedup(),
  resample(),
  prune(),
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    slots: /baseColor|emissive|diffuse/i,
    resize: [2048, 2048],
    quality: 90,
  }),
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    slots: /normal|occlusion|metallicRoughness/i,
    quality: 95,
    nearLossless: true,
  }),
  reorder({ encoder: MeshoptEncoder }),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: "high" })
);

await io.write(outPath, doc);
if (tempDir) rmSync(tempDir, { recursive: true, force: true });
console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
