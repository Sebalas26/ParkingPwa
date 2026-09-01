import { useState, useEffect, useCallback } from 'react';
import { authService } from '../../features/auth/data/authService';
import type { UserSession } from '../../features/auth/model/AuthContracts';

export const useAuthSession = () => {
  const [user, setUser] = useState<UserSession | null>(() => authService.getCurrentUser());

  useEffect(() => {
    const handleSessionChange = () => {
      setUser(authService.getCurrentUser());
    };

    window.addEventListener('parkflow:session_updated', handleSessionChange);
    window.addEventListener('storage', handleSessionChange);

    return () => {
      window.removeEventListener('parkflow:session_updated', handleSessionChange);
      window.removeEventListener('storage', handleSessionChange);
    };
  }, []);

  const hasPermission = useCallback((slug: string): boolean => {
    return authService.hasPermission(slug);
  }, [user]);

  const hasModule = useCallback((moduleSlug: string): boolean => {
    return authService.hasModule(moduleSlug);
  }, [user]);

  const refreshSession = useCallback(async () => {
    const updated = await authService.refreshSession();
    if (updated) {
      setUser(updated);
    }
    return updated;
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    isSuperAdmin: Boolean(user?.isSuperAdmin),
    isAdmin: Boolean(user?.isAdmin || user?.isSuperAdmin),
    permissions: user?.permissions || [],
    modules: user?.modules || [],
    hasPermission,
    hasModule,
    refreshSession,
  };
};
