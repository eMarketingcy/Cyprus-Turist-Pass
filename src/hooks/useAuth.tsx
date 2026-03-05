import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileId?: string;
  contract?: any;
  merchantProfile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers: any = { "Content-Type": "application/json", ...options.headers };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  };

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
    } catch {
      // Network error - keep token, user will retry
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const register = async (formData: any) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Helper for authenticated API calls
export function useApi() {
  const { token } = useAuth();

  return async (url: string, options: RequestInit = {}) => {
    const headers: any = { "Content-Type": "application/json", ...options.headers };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    return res;
  };
}
