import type { Meta, StoryObj } from "@storybook/react";

// Simple test component to verify Canvas setup
const TestCube = () => (
  <mesh position={[0, 0, 0]}>
    <boxGeometry args={[1, 1, 1]} />
    <meshLambertMaterial color="hotpink" />
  </mesh>
);

const meta: Meta<typeof TestCube> = {
  title: "Test/Simple Cube",
  component: TestCube,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
