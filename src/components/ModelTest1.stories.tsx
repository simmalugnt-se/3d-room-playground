import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Vector3 } from "three";
import ModelTest1 from "./ModelTest1";

// Canvas decorator for 3D components
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

const meta: Meta<typeof ModelTest1> = {
  title: "Components/ModelTest1",
  component: ModelTest1,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [withCanvas],
  argTypes: {
    position: {
      control: "object",
      description: "Position of the model",
    },
    scale: {
      control: { type: "range", min: 0.1, max: 3, step: 0.1 },
      description: "Scale of the model",
    },
    enableIdleAnimation: {
      control: "boolean",
      description: "Enable idle animation",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - model with idle animation
export const Default: Story = {
  args: {
    position: new Vector3(0, 0, 0),
    scale: 1,
    enableIdleAnimation: true,
  },
};

// Model at different position
export const AtPosition: Story = {
  args: {
    position: new Vector3(2, 0, 2),
    scale: 1,
    enableIdleAnimation: true,
  },
};

// Scaled model
export const Scaled: Story = {
  args: {
    position: new Vector3(0, 0, 0),
    scale: 1.5,
    enableIdleAnimation: true,
  },
};

// Model without idle animation
export const Static: Story = {
  args: {
    position: new Vector3(0, 0, 0),
    scale: 1,
    enableIdleAnimation: false,
  },
};

// Multiple models
export const Multiple: Story = {
  render: () => (
    <group>
      <ModelTest1 position={new Vector3(-2, 0, 0)} scale={0.8} />
      <ModelTest1 position={new Vector3(0, 0, 0)} scale={1} />
      <ModelTest1 position={new Vector3(2, 0, 0)} scale={1.2} />
    </group>
  ),
};

// Recovery test - shows fallback when context is lost
export const RecoveryTest: Story = {
  args: {
    position: new Vector3(0, 0, 0),
    scale: 1,
    enableIdleAnimation: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "This story tests the WebGL context loss recovery mechanism. If you see a red box instead of the model, the context has been lost and the fallback is working.",
      },
    },
  },
};
