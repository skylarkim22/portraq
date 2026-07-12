import { useQuery } from "@tanstack/react-query";
import { templateQueries } from "@/features/templates/queries";

export const useTemplateList = () => {
  return useQuery(templateQueries.lists());
};

export const useTemplate = (id: string | null) => {
  return useQuery({
    ...templateQueries.lists(),
    enabled: id !== null,
    select: (templates) => templates.find((template) => template.id === id),
  });
};
