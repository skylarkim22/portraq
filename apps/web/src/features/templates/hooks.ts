import { useQuery } from "@tanstack/react-query";
import { templateListQueryOptions } from "@/features/templates/queries";

export const useTemplateList = () => {
  return useQuery(templateListQueryOptions());
};

export const useTemplate = (id: string | null) => {
  return useQuery({
    ...templateListQueryOptions(),
    enabled: id !== null,
    select: (templates) => templates.find((template) => template.id === id),
  });
};
