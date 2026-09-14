"use client";

import dynamic from "next/dynamic";

// WebGL only exists in the browser, so the viewer is never rendered on the server.
const IndustrialArmViewer = dynamic(() => import("./industrial-arm-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[62vh] min-h-[420px] items-center justify-center rounded-3xl border border-line bg-card text-sm text-muted lg:h-[calc(100vh-10rem)]">
      Loading the 3D viewer…
    </div>
  ),
});

export default function IndustrialArmClient() {
  return <IndustrialArmViewer />;
}
