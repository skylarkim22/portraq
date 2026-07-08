import { PortfolioEditor } from "@/features/portfolio/components/PortfolioEditor";

export default async function NewPortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  return <PortfolioEditor portfolioId={null} templateId={template ?? null} />;
}
