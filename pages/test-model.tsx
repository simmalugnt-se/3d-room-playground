import dynamic from "next/dynamic";
import React from "react";

// Dynamically import Three.js components to avoid SSR issues
const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false }
);

const OrbitControls = dynamic(
  () => import("@react-three/drei").then((mod) => mod.OrbitControls),
  { ssr: false }
);

const Environment = dynamic(
  () => import("@react-three/drei").then((mod) => mod.Environment),
  { ssr: false }
);

const ModelTest1 = dynamic(() => import("../src/components/ModelTest1"), {
  ssr: false,
});

export default function TestModel() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        shadows
        style={{ background: "#f0f0f0" }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <Environment preset="apartment" />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        <React.Suspense fallback={null}>
          <ModelTest1
            position={[0, 0, 0]}
            scale={1}
            enableIdleAnimation={true}
          />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
