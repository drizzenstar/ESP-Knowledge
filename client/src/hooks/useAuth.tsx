import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, LoginUser, RegisterUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { toast } = useToast();

  // Be explicit: fetch current user via apiRequest (returns JSON)
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: () => apiRequest("GET", "/api/user"),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      // apiRequest returns JSON — no `.json()` call here
      return await apiRequest("POST", "/api/login", credentials);
    },
    onSuccess: async (user: SelectUser) => {
      // cache the user and/or refetch the /api/user endpoint
      queryClient.setQueryData(["/api/user"], user);
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Welcome back!",
        description: `Hello ${user.email}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterUser) => {
      return await apiRequest("POST", "/api/register", credentials);
    },
    onSuccess: async (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Account created!",
        description: `Welcome ${user.email}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: async () => {
      queryClient.setQueryData(["/api/user"], null);
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Logged out",
        description: "See you next time!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return {
    ...context,
    isAuthenticated: !!context.user,
  };
}
