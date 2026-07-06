import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

export const currentUserQueryOptions = queryOptions({
  queryKey: authKeys.user(),
  queryFn: async () => {
    const {
      data: { user },
    } = await createClient().auth.getUser();
    return user;
  },
});
