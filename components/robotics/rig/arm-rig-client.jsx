"use client";

import dynamic from "next/dynamic";

// WebGL only exists in the browser, so the viewer is never rendered on the server.
const ArmRigViewer = dynamic(() => import("./arm-rig-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[62vh] min-h-[420px] items-center justify-center rounded-3xl border border-line bg-[#070a13] text-sm text-muted lg:h-[calc(100vh-10rem)]">
      Loading the 3D viewer…
    </div>
  ),
});

export default function ArmRigClient() {
  return <ArmRigViewer />;
}
