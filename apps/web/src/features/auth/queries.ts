import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export const authQueries = {
  all: () => ["auth"] as const,

  user: () =>
    queryOptions({
      queryKey: [...authQueries.all(), "user"] as const,
      queryFn: async () => {
        const {
          data: { user },
        } = await createClient().auth.getUser();
        return user;
      },
    }),
};
