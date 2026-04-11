import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, clearSession, getStoredSession, saveSession, type AuthSession, type AuthUser } from '../../lib/api';

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  permissions: string[];
  loading: boolean;
  setSession: (session: AuthSession) => void;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() => getStoredSession());
  const [loading, setLoading] = useState(false);

  const setSession = useCallback((nextSession: AuthSession) => {
    saveSession(nextSession);
    setSessionState(nextSession);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.token) return;

    setLoading(true);
    try {
      const response = await apiFetch<{ user: AuthUser }>('/users/me');
      const nextSession: AuthSession = {
        token: session.token,
        user: response.user,
      };
      saveSession(nextSession);
      setSessionState(nextSession);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session?.token) return;
    if (session.user.permissions?.length) return;
    void refreshProfile();
  }, [session?.token]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    permissions: session?.user.permissions ?? [],
    loading,
    setSession,
    refreshProfile,
    hasPermission: (permission: string) => (session?.user.permissions ?? []).includes(permission),
    logout,
  }), [loading, logout, refreshProfile, session, setSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
