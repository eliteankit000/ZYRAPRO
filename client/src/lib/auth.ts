import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  fullName: string;
  plan: string;
  role: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/login", credentials);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; fullName: string }) => {
      const response = await apiRequest("POST", "/api/register", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const isAuthenticated = !!user;
  const isLoggingIn = loginMutation.isPending;
  const isRegistering = registerMutation.isPending;
  const isLoggingOut = logoutMutation.isPending;

  return {
    user: (user as any)?.user as User | undefined,
    isLoading,
    error,
    isAuthenticated,
    isLoggingIn,
    isRegistering,
    isLoggingOut,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
  };
}

export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  
  if (!isLoading && !user) {
    window.location.href = "/auth/login";
    return null;
  }
  
  return { user, isLoading };
}
