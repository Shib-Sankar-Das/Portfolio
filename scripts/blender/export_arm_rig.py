# Exports the robotic arm straight from its .blend to a raw GLB.
#
#   blender -b "Done_2nd-try.blend" --python scripts/blender/export_arm_rig.py -- out.glb
#   npm run model -- out.glb robotic-arm-rig --simplify 0.35
#
# Why from the .blend and not the FBX: the FBX route (FBX2glTF) silently drops
# both piston rods ("w-pistonBob") and leaves the base, body and pistons
# positioned in centimetres at the scene root, so the arm comes apart on the web.
# Blender's own glTF exporter keeps every object, applies modifiers, and writes
# the hierarchy Y-up.
#
# Constraints (Track To / IK / Child Of) cannot be carried by glTF at all — and
# in this file they do not hold the arm together under yaw anyway — so the web
# viewer does not rely on them. It rebuilds the mechanism itself; see
# components/robotics/rig/arm-kinematics.js.
import sys

import bpy

out = sys.argv[sys.argv.index("--") + 1]

bpy.ops.export_scene.gltf(
    filepath=out,
    export_format="GLB",
    use_selection=False,
    use_visible=False,
    export_apply=True,
    export_yup=True,
    export_extras=True,
    export_animations=False,
)
print("EXPORTED", out)
