import type { Meta, StoryObj } from "@storybook/react";

// Very simple test component - just a div
const SimpleTest = () => (
  <div
    style={{
      width: "100%",
      height: "400px",
      background: "linear-gradient(45deg, #ff6b6b, #4ecdc4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontSize: "24px",
      fontWeight: "bold",
    }}
  >
    🎉 Storybook is working! 🎉
  </div>
);

const meta: Meta<typeof SimpleTest> = {
  title: "Test/Simple",
  component: SimpleTest,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [], // No decorators
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
