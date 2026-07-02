import type { Meta, StoryObj } from "@storybook/react";
import { ActionChip } from "./index";

const meta: Meta<typeof ActionChip> = {
  title: "Portraq/ActionChip",
  component: ActionChip,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ActionChip>;

export const Buy: Story = { args: { action: "buy" } };
export const Sell: Story = { args: { action: "sell" } };
export const Hold: Story = { args: { action: "hold" } };
