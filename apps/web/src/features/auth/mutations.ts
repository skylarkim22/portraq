import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { authQueries } from "@/features/auth/queries";

export const useSignInWithOAuth = () => {
  return useMutation({
    mutationFn: async (provider: "google" | "kakao") => {
      const { error } = await createClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    },
  });
};

export const useSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: authQueries.all() });
      const previousUser = queryClient.getQueryData(authQueries.user().queryKey);
      queryClient.setQueryData(authQueries.user().queryKey, null);
      return { previousUser };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(authQueries.user().queryKey, context?.previousUser);
    },
  });
};
