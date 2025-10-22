import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Vector3 } from "three";
import Character from "./Character";

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

const meta: Meta<typeof Character> = {
  title: "Components/Character",
  component: Character,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [withCanvas],
  argTypes: {
    position: {
      control: "object",
      description: "Initial position of the character",
    },
    path: {
      control: "object",
      description: "Array of waypoints for character movement",
    },
    isMoving: {
      control: "boolean",
      description: "Whether the character is currently moving",
    },
    onMoveComplete: {
      action: "moveComplete",
      description: "Callback when character finishes moving",
    },
    onPositionChange: {
      action: "positionChange",
      description: "Callback when character position changes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - idle character
export const Default: Story = {
  args: {
    position: new Vector3(0, 0.5, 0),
    path: [],
    isMoving: false,
    onMoveComplete: () => console.log("Move completed"),
    onPositionChange: (pos: Vector3) => console.log("Position changed:", pos),
  },
};

// Character with a simple movement path
export const Moving: Story = {
  args: {
    position: new Vector3(0, 0.5, 0),
    path: [
      new Vector3(2, 0.5, 0),
      new Vector3(2, 0.5, 2),
      new Vector3(0, 0.5, 2),
      new Vector3(0, 0.5, 0),
    ],
    isMoving: true,
    onMoveComplete: () => console.log("Move completed"),
    onPositionChange: (pos: Vector3) => console.log("Position changed:", pos),
  },
};

// Character at different position
export const AtPosition: Story = {
  args: {
    position: new Vector3(3, 0.5, 3),
    path: [],
    isMoving: false,
    onMoveComplete: () => console.log("Move completed"),
    onPositionChange: (pos: Vector3) => console.log("Position changed:", pos),
  },
};

// Character with diagonal movement
export const DiagonalMovement: Story = {
  args: {
    position: new Vector3(0, 0.5, 0),
    path: [new Vector3(3, 0.5, 3), new Vector3(-2, 0.5, 2)],
    isMoving: true,
    onMoveComplete: () => console.log("Move completed"),
    onPositionChange: (pos: Vector3) => console.log("Position changed:", pos),
  },
};
