import { useQuery } from "@tanstack/react-query";

export type AuthUser = {
  id: string;
  name?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  subscription?: { plan?: string | null } | null;
};

async function fetchAuthUser() {
  const res = await fetch("/api/auth/user", { credentials: "include" });
  if (!res.ok) {
    if (res.status === 401) return null;
    const text = await res.text();
    throw new Error(text || "Failed to load user");
  }
  return (await res.json()) as AuthUser;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchAuthUser,
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
  };
}
