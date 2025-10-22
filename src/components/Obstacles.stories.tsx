import type { Meta, StoryObj } from "@storybook/react";
import Obstacles from "./Obstacles";

const meta: Meta<typeof Obstacles> = {
  title: "Components/Obstacles",
  component: Obstacles,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story showing all obstacles
export const Default: Story = {
  args: {},
};

// Story with a floor to show shadows
export const WithFloor: Story = {
  args: {},
  decorators: [
    (Story) => (
      <>
        <Story />
        {/* Add a floor for better visualization */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.5, 0]}
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <meshLambertMaterial color="#cccccc" />
        </mesh>
      </>
    ),
  ],
};
