import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { TemplateGallery } from "@/features/templates/components/TemplateGallery";
import { templateQueries } from "@/features/templates/queries";
import { getQueryClient } from "@/lib/getQueryClient";
import { createClient } from "@/lib/supabase/server";

const TemplatesPage = async () => {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(templateQueries.lists(createClient));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TemplateGallery />
    </HydrationBoundary>
  );
};

export default TemplatesPage;
