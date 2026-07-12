import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { authQueries } from "@/features/auth/queries";

export const useUser = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      queryClient.setQueryData(authQueries.user().queryKey, session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return useQuery(authQueries.user());
};
