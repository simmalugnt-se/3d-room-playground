import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Preview } from "@storybook/nextjs-vite";
import React from "react";
import * as THREE from "three";

// Extend Three.js for React Three Fiber
import { extend } from "@react-three/fiber";
extend(THREE);

// Canvas decorator for React Three Fiber components
const withCanvas = (Story: any) => (
  <div style={{ width: "100%", height: "400px" }}>
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
        <Story />
      </React.Suspense>
    </Canvas>
  </div>
);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  // Remove global decorator - apply only to specific stories that need it
  // decorators: [withCanvas],
};

export default preview;
