import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';

const TOKEN_KEY = 'gitupx_access_token';
const USER_KEY = 'gitupx_user';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return {
      id: 1,
      email: 'admin@gitupx.security',
      has_github_token: true,
      created_at: new Date().toISOString()
    };
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY) || true); // Default true for instant demo

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateGithubStatus = useCallback((hasToken: boolean) => {
    if (user) {
      const updated = { ...user, has_github_token: hasToken };
      setUser(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  }, [user]);

  useEffect(() => {
    // Check token validity or fallback to demo session
    if (!token && !localStorage.getItem('gitupx_demo_init')) {
      localStorage.setItem('gitupx_demo_init', 'true');
      const demoToken = 'mock_jwt_token_gitupx_demo_session_123456789';
      const demoUser: User = {
        id: 1,
        email: 'security.engineer@gitupx.local',
        has_github_token: true,
        created_at: new Date().toISOString()
      };
      login(demoToken, demoUser);
    }
  }, [token, login]);

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    updateGithubStatus
  };
}
