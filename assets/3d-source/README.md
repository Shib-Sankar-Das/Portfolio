# 3D source files

Original (heavy) 3D assets live here — they are **not** served by the website.
The site loads optimized `.glb` files from `public/models/` instead.

## Adding a new model

Drop the `.fbx` (or `.glb`) here, then run from the project root:

```bash
npm run model -- "assets/3d-source/My Model.fbx"
```

This converts and compresses it (meshopt geometry/animation compression,
WebP textures, ~90% smaller) and writes `public/models/my-model.glb`.
Pass a second argument to choose the output name:

```bash
npm run model -- "assets/3d-source/My Model.fbx" hero-avatar
```

Render it with the reusable component in `components/avatar-model.jsx`:

```jsx
<AvatarModel url="/models/my-model.glb" height={3} />
```

It auto-normalizes orientation/scale, plays the first animation clip,
fades in on load, and respects reduced motion.
