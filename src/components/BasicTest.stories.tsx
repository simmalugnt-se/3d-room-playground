import { OrbitControls } from "@react-three/drei";
import { Canvas, extend } from "@react-three/fiber";
import type { Meta, StoryObj } from "@storybook/react";
import * as THREE from "three";

// Extend Three.js
extend(THREE);

// Basic test component
const BasicCube = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="orange" />
  </mesh>
);

const meta: Meta<typeof BasicCube> = {
  title: "Test/Basic",
  component: BasicCube,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "400px" }}>
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <OrbitControls />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
