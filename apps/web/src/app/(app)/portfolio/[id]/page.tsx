import { PortfolioEditor } from "@/features/portfolio/components/PortfolioEditor";

export default async function PortfolioEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PortfolioEditor portfolioId={id} />;
}
