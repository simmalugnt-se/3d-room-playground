import type { Meta, StoryObj } from "@storybook/react";

// Minimal test component - just a cube
const MinimalCube = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="red" />
  </mesh>
);

const meta: Meta<typeof MinimalCube> = {
  title: "Test/Minimal",
  component: MinimalCube,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
