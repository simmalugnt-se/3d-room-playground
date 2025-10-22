import type { Meta, StoryObj } from "@storybook/react";
import { Vector3 } from "three";

// Simplified Character component for testing
const SimpleCharacter = ({
  position,
  color = "#3498db",
}: {
  position: Vector3;
  color?: string;
}) => (
  <group>
    {/* Character body (simple capsule-like shape) */}
    <mesh position={position} castShadow>
      <group>
        {/* Body */}
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.3, 1]} />
          <meshLambertMaterial color={color} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.2]} />
          <meshLambertMaterial color="#f39c12" />
        </mesh>

        {/* Eyes */}
        <mesh position={[0.1, 0.85, 0.15]}>
          <sphereGeometry args={[0.03]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[-0.1, 0.85, 0.15]}>
          <sphereGeometry args={[0.03]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        {/* Direction indicator */}
        <mesh position={[0, 0.5, 0.4]}>
          <coneGeometry args={[0.1, 0.2]} />
          <meshLambertMaterial color="#e74c3c" />
        </mesh>
      </group>
    </mesh>

    {/* Character shadow */}
    <mesh
      position={[position.x, 0.01, position.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[0.4]} />
      <meshBasicMaterial color="#000000" opacity={0.2} transparent />
    </mesh>
  </group>
);

const meta: Meta<typeof SimpleCharacter> = {
  title: "Components/SimpleCharacter",
  component: SimpleCharacter,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    position: {
      control: "object",
      description: "Position of the character",
    },
    color: {
      control: "color",
      description: "Color of the character body",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    position: new Vector3(0, 0.5, 0),
    color: "#3498db",
  },
};

// Different colors
export const Red: Story = {
  args: {
    position: new Vector3(0, 0.5, 0),
    color: "#e74c3c",
  },
};

export const Green: Story = {
  args: {
    position: new Vector3(0, 0.5, 0),
    color: "#2ecc71",
  },
};

// Multiple characters
export const Multiple: Story = {
  render: () => (
    <>
      <SimpleCharacter position={new Vector3(0, 0.5, 0)} color="#3498db" />
      <SimpleCharacter position={new Vector3(2, 0.5, 0)} color="#e74c3c" />
      <SimpleCharacter position={new Vector3(-2, 0.5, 0)} color="#2ecc71" />
    </>
  ),
};
