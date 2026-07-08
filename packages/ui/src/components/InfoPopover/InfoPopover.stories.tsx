import type { Meta, StoryObj } from "@storybook/react";
import { InfoPopover } from "./index";

const meta: Meta<typeof InfoPopover> = {
  title: "Portraq/InfoPopover",
  component: InfoPopover,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof InfoPopover>;

export const Default: Story = {
  args: {
    label: "CAGR 설명",
    children: "연평균 복리 수익률(CAGR)은 일정 기간 동안의 성장률을 연 단위로 환산한 값입니다.",
  },
};
