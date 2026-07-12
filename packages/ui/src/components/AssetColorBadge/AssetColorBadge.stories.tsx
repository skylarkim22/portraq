import type { Meta, StoryObj } from "@storybook/react";
import { AssetColorBadge } from "./index";

const meta: Meta<typeof AssetColorBadge> = {
  title: "Portraq/AssetColorBadge",
  component: AssetColorBadge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AssetColorBadge>;

export const KoreanStock: Story = {
  args: { ticker: "005930", name: "삼성전자", color: "#355df9" },
};

export const UsStock: Story = {
  args: { ticker: "AAPL", name: "Apple Inc.", color: "#e85d4a" },
};

export const NoName: Story = {
  args: { ticker: "AAPL" },
};

export const DefaultColor: Story = {
  args: { ticker: "AAPL", name: "Apple Inc." },
};
