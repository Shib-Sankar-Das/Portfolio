/**
 * Converts a 3D model (.fbx or .glb/.gltf) into a small, web-ready GLB in
 * public/models/. Usage:
 *
 *   npm run model -- "assets/3d-source/Standing Greeting.fbx"
 *   npm run model -- input.fbx custom-name
 *   npm run model -- input.fbx custom-name --simplify 0.35
 *   npm run model -- input.glb custom-name --max-texture 2048
 *
 * Pipeline: FBX -> glTF (FBX2glTF), then meshopt compression + WebP textures
 * (base color capped at 2048px, normal maps kept near-lossless). Animations
 * are preserved and resampled. Typical result: 85-95% smaller than the FBX.
 *
 * `--simplify <ratio>` additionally collapses triangles, error-bounded, which
 * is worth it for hard-surface models whose detail is far denser than the size
 * they are drawn at. It is opt-in because it is riskier on skinned characters,
 * where collapsing around a joint can pinch the silhouette.
 *
 * `--max-texture <px>` caps every texture — normal and roughness maps included —
 * at that size. Without it only colour maps are capped (at 2048px) and the
 * others keep their resolution. Worth it for models shipped with 4K+ maps.
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
  simplify,
  textureCompress,
  meshopt,
} from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import fbx2gltf from "fbx2gltf";
import sharp from "sharp";

const argv = process.argv.slice(2);
const VALUE_FLAGS = new Set(["--simplify", "--max-texture"]);
const flag = (name) => (argv.includes(name) ? Number(argv[argv.indexOf(name) + 1]) : null);
const simplifyAt = flag("--simplify");
const maxTexture = flag("--max-texture");
const [input, customName] = argv.filter(
  (a, i) => !a.startsWith("--") && !VALUE_FLAGS.has(argv[i - 1])
);
if (!input) {
  console.error('Usage: npm run model -- "path/to/model.fbx" [output-name] [--simplify 0.35] [--max-texture 2048]');
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

if (simplifyAt) await MeshoptSimplifier.ready;

await doc.transform(
  dedup(),
  resample(),
  prune(),
  // Error-bounded triangle collapse, before anything is quantised or encoded.
  ...(simplifyAt
    ? [simplify({ simplifier: MeshoptSimplifier, ratio: simplifyAt, error: 0.002 })]
    : []),
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    slots: /baseColor|emissive|diffuse/i,
    resize: [maxTexture ?? 2048, maxTexture ?? 2048],
    quality: 90,
  }),
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    slots: /normal|occlusion|metallicRoughness/i,
    quality: 95,
    nearLossless: true,
    ...(maxTexture ? { resize: [maxTexture, maxTexture] } : {}),
  }),
  reorder({ encoder: MeshoptEncoder }),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: "high" })
);

await io.write(outPath, doc);
if (tempDir) rmSync(tempDir, { recursive: true, force: true });
console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
