import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Meta, StoryObj } from "@storybook/react";

// Test component with manual Canvas wrapper
const ManualCanvasTest = () => (
  <div style={{ width: "100%", height: "400px" }}>
    <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <OrbitControls />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="blue" />
      </mesh>
    </Canvas>
  </div>
);

const meta: Meta<typeof ManualCanvasTest> = {
  title: "Test/Manual Canvas",
  component: ManualCanvasTest,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [], // Override the global decorator
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
