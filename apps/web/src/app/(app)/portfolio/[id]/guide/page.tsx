import { RebalancingGuide } from "@/features/portfolio/components/RebalancingGuide";

export default async function RebalancingGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RebalancingGuide portfolioId={id} />;
}
