import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { authKeys, currentUserQueryOptions } from "@/features/auth/queries";

export function useUser() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return useQuery(currentUserQueryOptions);
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.all }),
  });
}
